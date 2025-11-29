'use client'

import { useState, useCallback } from 'react'
import { FormField, FormSettings, FormTheme, FieldOption } from './types'
import { CheckCircle, AlertCircle, Star, Upload, X } from 'lucide-react'

interface FormPreviewProps {
  fields: FormField[]
  settings: FormSettings
  theme: FormTheme
  onSubmit?: (data: Record<string, unknown>) => void
  isPreview?: boolean
}

interface FormErrors {
  [fieldId: string]: string
}

export function FormPreview({
  fields,
  settings,
  theme,
  onSubmit,
  isPreview = false,
}: FormPreviewProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = useCallback((fieldId: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))
    // Clear error when field is edited
    if (errors[fieldId]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[fieldId]
        return next
      })
    }
  }, [errors])

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    fields.forEach((field) => {
      const value = formData[field.id]

      // Required validation
      if (field.required) {
        if (value === undefined || value === null || value === '') {
          newErrors[field.id] = 'See väli on kohustuslik'
          return
        }
        if (Array.isArray(value) && value.length === 0) {
          newErrors[field.id] = 'Vali vähemalt üks valik'
          return
        }
      }

      // Type-specific validation
      if (value && field.type === 'email') {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(String(value))) {
          newErrors[field.id] = 'Sisesta kehtiv e-posti aadress'
        }
      }

      if (value && field.type === 'phone') {
        const phoneRegex = /^[+]?[\d\s()-]{7,}$/
        if (!phoneRegex.test(String(value))) {
          newErrors[field.id] = 'Sisesta kehtiv telefoninumber'
        }
      }

      if (value && field.type === 'url') {
        try {
          new URL(String(value))
        } catch {
          newErrors[field.id] = 'Sisesta kehtiv URL'
        }
      }

      if (value && field.type === 'number') {
        const numValue = Number(value)
        const min = field.settings?.min as number | undefined
        const max = field.settings?.max as number | undefined
        if (min !== undefined && numValue < min) {
          newErrors[field.id] = `Väärtus peab olema vähemalt ${min}`
        }
        if (max !== undefined && numValue > max) {
          newErrors[field.id] = `Väärtus peab olema kuni ${max}`
        }
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (isPreview) {
      alert('Eelvaate režiimis vormi ei saa esitada')
      return
    }

    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      await onSubmit?.(formData)
      setIsSubmitted(true)
    } catch (error) {
      console.error('Form submission error:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div
        className="flex flex-col items-center justify-center py-16 px-8 text-center"
        style={{
          backgroundColor: theme.backgroundColor,
          borderRadius: theme.borderRadius,
        }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
          style={{ backgroundColor: `${theme.primaryColor}20` }}
        >
          <CheckCircle className="w-8 h-8" style={{ color: theme.primaryColor }} />
        </div>
        <h2 className="text-xl font-semibold text-slate-900 mb-2">Täname!</h2>
        <p className="text-slate-600">Teie vastused on edukalt saadetud.</p>
        {settings.allowMultipleSubmissions && (
          <button
            onClick={() => {
              setIsSubmitted(false)
              setFormData({})
            }}
            className="mt-6 px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: theme.primaryColor,
              color: '#fff',
              borderRadius: theme.borderRadius,
            }}
          >
            Saada uuesti
          </button>
        )}
      </div>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4"
      style={{
        backgroundColor: theme.backgroundColor,
        padding: theme.fieldSpacing,
        borderRadius: theme.borderRadius,
        fontFamily: theme.fontFamily,
        fontSize: theme.fontSize,
      }}
    >
      {fields.map((field) => (
        <FormFieldRenderer
          key={field.id}
          field={field}
          value={formData[field.id]}
          onChange={(value) => handleChange(field.id, value)}
          error={errors[field.id]}
          theme={theme}
          disabled={isSubmitting}
        />
      ))}

      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3 px-6 font-medium text-white transition-colors disabled:opacity-50"
          style={{
            backgroundColor: theme.primaryColor,
            borderRadius: theme.borderRadius,
          }}
        >
          {isSubmitting ? 'Saadan...' : settings.submitButtonText}
        </button>
      </div>
    </form>
  )
}

interface FormFieldRendererProps {
  field: FormField
  value: unknown
  onChange: (value: unknown) => void
  error?: string
  theme: FormTheme
  disabled?: boolean
}

function FormFieldRenderer({
  field,
  value,
  onChange,
  error,
  theme,
  disabled,
}: FormFieldRendererProps) {
  const options = (field.settings?.options as FieldOption[]) || []

  const inputClassName = `w-full px-3 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
    error
      ? 'border-red-500 focus:ring-red-200 focus:border-red-500'
      : 'border-slate-300 focus:ring-primary/20 focus:border-primary'
  }`

  const labelElement = !['heading', 'paragraph', 'divider'].includes(field.type) && (
    <label className="block text-sm font-medium text-slate-700 mb-1">
      {field.label}
      {field.required && <span className="text-red-500 ml-1">*</span>}
    </label>
  )

  const descriptionElement = field.description && (
    <p className="text-xs text-slate-500 mt-1">{field.description}</p>
  )

  const errorElement = error && (
    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
      <AlertCircle className="w-3 h-3" />
      {error}
    </p>
  )

  const widthClasses: Record<string, string> = {
    full: 'w-full',
    half: 'w-full sm:w-1/2',
    third: 'w-full sm:w-1/3',
  }

  const wrapField = (content: React.ReactNode) => (
    <div className={widthClasses[field.width || 'full']} style={{ marginBottom: theme.fieldSpacing }}>
      {labelElement}
      {content}
      {descriptionElement}
      {errorElement}
    </div>
  )

  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'url':
      return wrapField(
        <input
          type={field.type === 'phone' ? 'tel' : field.type}
          placeholder={field.placeholder}
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          className={inputClassName}
          disabled={disabled}
          style={{ borderRadius: theme.borderRadius }}
        />
      )

    case 'number':
      return wrapField(
        <input
          type="number"
          placeholder={field.placeholder}
          value={(value as number) ?? ''}
          onChange={(e) => onChange(e.target.value ? Number(e.target.value) : '')}
          min={field.settings?.min as number}
          max={field.settings?.max as number}
          step={field.settings?.step as number}
          className={inputClassName}
          disabled={disabled}
          style={{ borderRadius: theme.borderRadius }}
        />
      )

    case 'textarea':
      return wrapField(
        <textarea
          placeholder={field.placeholder}
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={(field.settings?.rows as number) || 4}
          className={inputClassName}
          disabled={disabled}
          style={{ borderRadius: theme.borderRadius }}
        />
      )

    case 'select':
      return wrapField(
        <select
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          className={inputClassName}
          disabled={disabled}
          style={{ borderRadius: theme.borderRadius }}
        >
          <option value="">{field.placeholder || 'Vali...'}</option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      )

    case 'radio':
      return wrapField(
        <div className="space-y-2 mt-2">
          {options.map((opt) => (
            <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name={field.id}
                value={opt.value}
                checked={value === opt.value}
                onChange={(e) => onChange(e.target.value)}
                className="w-4 h-4"
                disabled={disabled}
                style={{ accentColor: theme.primaryColor }}
              />
              <span className="text-sm text-slate-700">{opt.label}</span>
            </label>
          ))}
        </div>
      )

    case 'checkbox':
      return wrapField(
        <div className="space-y-2 mt-2">
          {options.map((opt) => {
            const checkedValues = (value as string[]) || []
            const isChecked = checkedValues.includes(opt.value)
            return (
              <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  value={opt.value}
                  checked={isChecked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...checkedValues, opt.value])
                    } else {
                      onChange(checkedValues.filter((v) => v !== opt.value))
                    }
                  }}
                  className="w-4 h-4 rounded"
                  disabled={disabled}
                  style={{ accentColor: theme.primaryColor }}
                />
                <span className="text-sm text-slate-700">{opt.label}</span>
              </label>
            )
          })}
        </div>
      )

    case 'multi_select':
      return wrapField(
        <div className="space-y-2 mt-2">
          {options.map((opt) => {
            const selectedValues = (value as string[]) || []
            const isSelected = selectedValues.includes(opt.value)
            return (
              <label key={opt.value} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  value={opt.value}
                  checked={isSelected}
                  onChange={(e) => {
                    if (e.target.checked) {
                      onChange([...selectedValues, opt.value])
                    } else {
                      onChange(selectedValues.filter((v) => v !== opt.value))
                    }
                  }}
                  className="w-4 h-4 rounded"
                  disabled={disabled}
                  style={{ accentColor: theme.primaryColor }}
                />
                <span className="text-sm text-slate-700">{opt.label}</span>
              </label>
            )
          })}
        </div>
      )

    case 'date':
      return wrapField(
        <input
          type="date"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          className={inputClassName}
          disabled={disabled}
          style={{ borderRadius: theme.borderRadius }}
        />
      )

    case 'time':
      return wrapField(
        <input
          type="time"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          className={inputClassName}
          disabled={disabled}
          style={{ borderRadius: theme.borderRadius }}
        />
      )

    case 'datetime':
      return wrapField(
        <input
          type="datetime-local"
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          className={inputClassName}
          disabled={disabled}
          style={{ borderRadius: theme.borderRadius }}
        />
      )

    case 'file_upload':
      const files = (value as File[]) || []
      return wrapField(
        <div>
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:bg-slate-50 transition-colors"
            style={{ borderRadius: theme.borderRadius }}
            onClick={() => document.getElementById(`file-${field.id}`)?.click()}
          >
            <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-sm text-slate-600">
              Lohista failid siia või <span style={{ color: theme.primaryColor }}>vali failid</span>
            </p>
            <input
              id={`file-${field.id}`}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                const newFiles = Array.from(e.target.files || [])
                onChange([...files, ...newFiles])
              }}
              disabled={disabled}
            />
          </div>
          {files.length > 0 && (
            <div className="mt-2 space-y-1">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <span className="text-sm text-slate-700 truncate">{file.name}</span>
                  <button
                    type="button"
                    onClick={() => onChange(files.filter((_, i) => i !== index))}
                    className="p-1 hover:bg-slate-200 rounded"
                  >
                    <X className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )

    case 'signature':
      return wrapField(
        <div
          className="border rounded-lg p-8 text-center bg-slate-50 cursor-pointer"
          style={{ borderRadius: theme.borderRadius }}
        >
          <p className="text-sm text-slate-500">Allkirja ala (tulemas)</p>
        </div>
      )

    case 'rating':
      const maxRating = (field.settings?.maxRating as number) || 5
      const currentRating = (value as number) || 0
      return wrapField(
        <div className="flex gap-1 mt-2">
          {Array.from({ length: maxRating }).map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i + 1)}
              className="focus:outline-none transition-colors"
              disabled={disabled}
            >
              <Star
                className="w-8 h-8"
                fill={i < currentRating ? theme.primaryColor : 'none'}
                stroke={i < currentRating ? theme.primaryColor : '#94a3b8'}
              />
            </button>
          ))}
        </div>
      )

    case 'slider':
      const min = (field.settings?.min as number) || 0
      const max = (field.settings?.max as number) || 100
      const step = (field.settings?.step as number) || 1
      const sliderValue = (value as number) ?? min
      return wrapField(
        <div className="mt-2">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={sliderValue}
            onChange={(e) => onChange(Number(e.target.value))}
            className="w-full"
            disabled={disabled}
            style={{ accentColor: theme.primaryColor }}
          />
          <div className="flex justify-between text-xs text-slate-500 mt-1">
            <span>{min}</span>
            <span className="font-medium" style={{ color: theme.primaryColor }}>{sliderValue}</span>
            <span>{max}</span>
          </div>
        </div>
      )

    case 'heading':
      const level = (field.settings?.level as number) || 2
      const headingClasses: Record<number, string> = {
        1: 'text-2xl font-bold text-slate-900',
        2: 'text-xl font-semibold text-slate-900',
        3: 'text-lg font-medium text-slate-900',
      }
      const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements
      return (
        <div style={{ marginBottom: theme.fieldSpacing }}>
          <HeadingTag className={headingClasses[level] || headingClasses[2]}>
            {field.label}
          </HeadingTag>
        </div>
      )

    case 'paragraph':
      return (
        <div style={{ marginBottom: theme.fieldSpacing }}>
          <p className="text-sm text-slate-600">{field.label}</p>
        </div>
      )

    case 'divider':
      return (
        <div style={{ marginBottom: theme.fieldSpacing }}>
          <hr className="border-slate-300" />
        </div>
      )

    default:
      return wrapField(
        <input
          type="text"
          placeholder={field.placeholder}
          value={(value as string) || ''}
          onChange={(e) => onChange(e.target.value)}
          className={inputClassName}
          disabled={disabled}
          style={{ borderRadius: theme.borderRadius }}
        />
      )
  }
}
