'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { format, parseISO } from 'date-fns'
import {
  Save,
  ArrowLeft,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useOne, useCreate, useUpdate, useList } from '@eos2/data-provider'
import { getResource, getDefaultValues, type FieldDefinition } from '@eos2/resources'

// ============ TYPES ============

export interface ResourceFormProps {
  /** Resource name */
  resource: string
  /** Record ID for edit mode */
  id?: string
  /** Default form values */
  defaultValues?: Record<string, unknown>
  /** Callback on successful save */
  onSuccess?: (data: Record<string, unknown>) => void
  /** Callback on cancel */
  onCancel?: () => void
  /** Additional metadata for mutations */
  meta?: Record<string, unknown>
  /** Show back button */
  showBackButton?: boolean
  /** Custom title */
  title?: string
}

// ============ COMPONENT ============

export function ResourceForm({
  resource,
  id,
  defaultValues: propDefaultValues,
  onSuccess,
  onCancel,
  meta,
  showBackButton = true,
  title,
}: ResourceFormProps) {
  const router = useRouter()
  const resourceDef = getResource(resource)
  const isEdit = !!id

  // Get default values from resource definition
  const resourceDefaults = useMemo(() => getDefaultValues(resource), [resource])

  // Form state
  const [formData, setFormData] = useState<Record<string, unknown>>({
    ...resourceDefaults,
    ...propDefaultValues,
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  // Fetch existing data for edit
  const {
    data: existingData,
    isLoading: isLoadingData,
  } = useOne(resource, id!, { supabaseSelect: '*' }, { enabled: isEdit })

  // Mutations
  const { mutate: create, isPending: isCreating, error: createError } = useCreate(resource, { meta })
  const { mutate: update, isPending: isUpdating, error: updateError } = useUpdate(resource, { meta })

  const isSubmitting = isCreating || isUpdating
  const mutationError = createError || updateError

  // Set form values when existing data loads
  useEffect(() => {
    if (existingData) {
      const formattedData: Record<string, unknown> = { ...existingData }

      // Format date fields for input
      for (const field of resourceDef.fields) {
        if ((field.type === 'date' || field.type === 'datetime') && formattedData[field.name]) {
          try {
            const date = parseISO(formattedData[field.name] as string)
            formattedData[field.name] = format(date, 'yyyy-MM-dd')
          } catch {
            // Keep original value
          }
        }
      }

      setFormData(formattedData)
    }
  }, [existingData, resourceDef.fields])

  // Get visible fields
  const visibleFields = useMemo(() => {
    return resourceDef.fields.filter((field) => {
      if (field.type === 'hidden') return false
      if (isEdit && field.hideOnEdit) return false
      if (!isEdit && field.hideOnCreate) return false
      if (field.showIf && !field.showIf(formData)) return false
      return true
    })
  }, [resourceDef.fields, isEdit, formData])

  // Handle field change
  const handleChange = useCallback((name: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [name]: value }))

    // Clear error when field is changed
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }, [errors])

  // Handle blur
  const handleBlur = useCallback((name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }))
  }, [])

  // Validate form
  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {}

    for (const field of visibleFields) {
      const value = formData[field.name]

      // Required validation
      if (field.required && (value === undefined || value === null || value === '')) {
        newErrors[field.name] = `${field.label} on kohustuslik`
        continue
      }

      // Skip further validation if empty and not required
      if (value === undefined || value === null || value === '') {
        continue
      }

      // Custom validation
      if (field.validation) {
        const { min, max, minLength, maxLength, pattern, message, custom } = field.validation

        if (typeof value === 'number') {
          if (min !== undefined && value < min) {
            newErrors[field.name] = message || `Väärtus peab olema vähemalt ${min}`
          }
          if (max !== undefined && value > max) {
            newErrors[field.name] = message || `Väärtus ei tohi ületada ${max}`
          }
        }

        if (typeof value === 'string') {
          if (minLength !== undefined && value.length < minLength) {
            newErrors[field.name] = message || `Peab olema vähemalt ${minLength} tähemärki`
          }
          if (maxLength !== undefined && value.length > maxLength) {
            newErrors[field.name] = message || `Maksimaalselt ${maxLength} tähemärki`
          }
          if (pattern && !pattern.test(value)) {
            newErrors[field.name] = message || 'Vigane formaat'
          }
        }

        if (custom) {
          const customError = custom(value, formData)
          if (customError) {
            newErrors[field.name] = customError
          }
        }
      }

      // Email validation
      if (field.type === 'email' && typeof value === 'string') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(value)) {
          newErrors[field.name] = 'Sisesta korrektne e-posti aadress'
        }
      }

      // URL validation
      if (field.type === 'url' && typeof value === 'string') {
        try {
          new URL(value)
        } catch {
          newErrors[field.name] = 'Sisesta korrektne URL'
        }
      }
    }

    // Run resource-level validation if defined
    if (resourceDef.hooks?.validate) {
      const resourceErrors = resourceDef.hooks.validate(formData)
      if (resourceErrors) {
        Object.assign(newErrors, resourceErrors)
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [visibleFields, formData, resourceDef.hooks])

  // Handle submit
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) {
      // Mark all fields as touched to show errors
      const allTouched: Record<string, boolean> = {}
      for (const field of visibleFields) {
        allTouched[field.name] = true
      }
      setTouched(allTouched)
      return
    }

    // Prepare data
    let submitData = { ...formData }

    // Transform values if needed
    for (const field of resourceDef.fields) {
      if (field.transform && submitData[field.name] !== undefined) {
        submitData[field.name] = field.transform(submitData[field.name])
      }
    }

    // Run beforeCreate/beforeUpdate hooks
    if (isEdit && resourceDef.hooks?.beforeUpdate) {
      submitData = resourceDef.hooks.beforeUpdate(submitData)
    } else if (!isEdit && resourceDef.hooks?.beforeCreate) {
      submitData = resourceDef.hooks.beforeCreate(submitData)
    }

    // Submit
    if (isEdit) {
      update(
        { id: id!, data: submitData },
        {
          onSuccess: (data) => {
            resourceDef.hooks?.afterUpdate?.(data as Record<string, unknown>)
            onSuccess?.(data as Record<string, unknown>) ?? router.push(resourceDef.basePath)
          },
        }
      )
    } else {
      create(submitData, {
        onSuccess: (data) => {
          resourceDef.hooks?.afterCreate?.(data as Record<string, unknown>)
          onSuccess?.(data as Record<string, unknown>) ?? router.push(resourceDef.basePath)
        },
      })
    }
  }, [validate, formData, isEdit, id, resourceDef, update, create, onSuccess, router, visibleFields])

  // Handle cancel
  const handleCancel = useCallback(() => {
    onCancel?.() ?? router.back()
  }, [onCancel, router])

  // Render loading state
  if (isEdit && isLoadingData) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <button
              onClick={handleCancel}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <h2 className="text-lg font-semibold text-gray-900">
            {title || (isEdit ? `Muuda: ${resourceDef.label}` : `Lisa: ${resourceDef.label}`)}
          </h2>
        </div>
      </div>

      {/* Error message */}
      {mutationError && (
        <div className="mx-6 mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-red-800">Viga salvestamisel</p>
            <p className="text-sm text-red-600 mt-1">{mutationError.message}</p>
          </div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-24 gap-4">
          {visibleFields.map((field) => (
            <div
              key={field.name}
              className={clsx('col-span-24', field.span && `md:col-span-${field.span}`)}
              style={{ gridColumn: field.span ? `span ${field.span}` : 'span 24' }}
            >
              <FormField
                field={field}
                value={formData[field.name]}
                onChange={(value) => handleChange(field.name, value)}
                onBlur={() => handleBlur(field.name)}
                error={touched[field.name] ? errors[field.name] : undefined}
                disabled={field.readOnly || (field.disableIf?.(formData) ?? false)}
              />
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
          >
            Tühista
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isEdit ? 'Salvesta muudatused' : 'Lisa'}
          </button>
        </div>
      </form>
    </div>
  )
}

// ============ FORM FIELD COMPONENT ============

interface FormFieldProps {
  field: FieldDefinition
  value: unknown
  onChange: (value: unknown) => void
  onBlur: () => void
  error?: string
  disabled?: boolean
}

function FormField({ field, value, onChange, onBlur, error, disabled }: FormFieldProps) {
  const inputClasses = clsx(
    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed',
    error ? 'border-red-300' : 'border-gray-300'
  )

  const renderInput = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
      case 'password':
        return (
          <input
            type={field.type === 'password' ? 'password' : field.type === 'email' ? 'email' : 'text'}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={field.placeholder}
            disabled={disabled}
            className={inputClasses}
          />
        )

      case 'textarea':
        return (
          <textarea
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={field.placeholder}
            disabled={disabled}
            rows={field.rows || 4}
            className={inputClasses}
          />
        )

      case 'number':
      case 'currency':
        return (
          <input
            type="number"
            value={value !== undefined && value !== null ? String(value) : ''}
            onChange={(e) => {
              const val = e.target.value
              onChange(val === '' ? null : parseFloat(val))
            }}
            onBlur={onBlur}
            placeholder={field.placeholder}
            disabled={disabled}
            min={field.min}
            max={field.max}
            step={field.step || (field.type === 'currency' ? 0.01 : 1)}
            className={inputClasses}
          />
        )

      case 'date':
        return (
          <input
            type="date"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            disabled={disabled}
            className={inputClasses}
          />
        )

      case 'datetime':
        return (
          <input
            type="datetime-local"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            disabled={disabled}
            className={inputClasses}
          />
        )

      case 'time':
        return (
          <input
            type="time"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            disabled={disabled}
            className={inputClasses}
          />
        )

      case 'select':
        return (
          <select
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value || null)}
            onBlur={onBlur}
            disabled={disabled}
            className={inputClasses}
          >
            <option value="">{field.placeholder || 'Vali...'}</option>
            {field.options?.map((option) => (
              <option key={String(option.value)} value={String(option.value)} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'multiselect':
        const selectedValues = Array.isArray(value) ? value : []
        return (
          <select
            multiple
            value={selectedValues.map(String)}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (opt) => opt.value)
              onChange(selected)
            }}
            onBlur={onBlur}
            disabled={disabled}
            className={clsx(inputClasses, 'min-h-[100px]')}
          >
            {field.options?.map((option) => (
              <option key={String(option.value)} value={String(option.value)} disabled={option.disabled}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'switch':
      case 'checkbox':
        return (
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
              onBlur={onBlur}
              disabled={disabled}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">{field.helpText}</span>
          </label>
        )

      case 'relation':
        return (
          <RelationField
            field={field}
            value={value as string}
            onChange={onChange}
            onBlur={onBlur}
            disabled={disabled}
            className={inputClasses}
          />
        )

      case 'color':
        return (
          <input
            type="color"
            value={(value as string) || '#000000'}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            disabled={disabled}
            className="w-16 h-10 p-1 border border-gray-300 rounded cursor-pointer"
          />
        )

      case 'slider':
        return (
          <div className="flex items-center gap-4">
            <input
              type="range"
              value={(value as number) || field.min || 0}
              onChange={(e) => onChange(parseFloat(e.target.value))}
              onBlur={onBlur}
              disabled={disabled}
              min={field.min || 0}
              max={field.max || 100}
              step={field.step || 1}
              className="flex-1"
            />
            <span className="text-sm text-gray-600 w-12 text-right">{String(value ?? 0)}</span>
          </div>
        )

      default:
        return (
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={field.placeholder}
            disabled={disabled}
            className={inputClasses}
          />
        )
    }
  }

  // Don't show label for switch/checkbox (it's inline)
  if (field.type === 'switch' || field.type === 'checkbox') {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {renderInput()}
        {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      </div>
    )
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {renderInput()}
      {field.helpText && !error && (
        <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>
      )}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  )
}

// ============ RELATION FIELD ============

interface RelationFieldProps {
  field: FieldDefinition
  value: string | undefined
  onChange: (value: unknown) => void
  onBlur: () => void
  disabled?: boolean
  className?: string
}

function RelationField({ field, value, onChange, onBlur, disabled, className }: RelationFieldProps) {
  const { data, isLoading } = useList(
    field.relationResource!,
    {
      pagination: { page: 1, pageSize: 100 },
      supabaseSelect: `id, ${field.relationLabel || 'name'}`,
    }
  )

  const options = data?.data?.map((item) => ({
    value: item.id as string,
    label: String(item[field.relationLabel || 'name']),
  })) || []

  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || null)}
      onBlur={onBlur}
      disabled={disabled || isLoading}
      className={className}
    >
      <option value="">{isLoading ? 'Laadin...' : (field.placeholder || 'Vali...')}</option>
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
