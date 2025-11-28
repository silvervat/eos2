'use client'

import type { DynamicField, FieldOption } from '@rivest/types'

interface DynamicFieldRendererProps {
  field: DynamicField
  value: unknown
  onChange: (value: unknown) => void
  readOnly?: boolean
}

export function DynamicFieldRenderer({
  field,
  value,
  onChange,
  readOnly = false,
}: DynamicFieldRendererProps) {
  const config = field.config || {}
  const options = (config.options as FieldOption[]) || []

  const baseInputClasses =
    'w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary disabled:bg-slate-100 disabled:cursor-not-allowed'

  // Render field based on type
  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'url':
      return (
        <FieldWrapper field={field}>
          <input
            type={field.type === 'email' ? 'email' : field.type === 'url' ? 'url' : 'text'}
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={config.placeholder as string}
            disabled={readOnly}
            className={baseInputClasses}
          />
        </FieldWrapper>
      )

    case 'textarea':
      return (
        <FieldWrapper field={field}>
          <textarea
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={config.placeholder as string}
            disabled={readOnly}
            rows={4}
            className={baseInputClasses}
          />
        </FieldWrapper>
      )

    case 'number':
    case 'decimal':
    case 'currency':
      return (
        <FieldWrapper field={field}>
          <div className="relative">
            {config.prefix && (
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                {config.prefix}
              </span>
            )}
            <input
              type="number"
              value={(value as number) ?? ''}
              onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
              min={config.min as number}
              max={config.max as number}
              step={field.type === 'decimal' || field.type === 'currency' ? 0.01 : 1}
              disabled={readOnly}
              className={`${baseInputClasses} ${config.prefix ? 'pl-8' : ''} ${config.suffix ? 'pr-8' : ''}`}
            />
            {config.suffix && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
                {config.suffix}
              </span>
            )}
          </div>
        </FieldWrapper>
      )

    case 'date':
      return (
        <FieldWrapper field={field}>
          <input
            type="date"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={readOnly}
            className={baseInputClasses}
          />
        </FieldWrapper>
      )

    case 'datetime':
      return (
        <FieldWrapper field={field}>
          <input
            type="datetime-local"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={readOnly}
            className={baseInputClasses}
          />
        </FieldWrapper>
      )

    case 'time':
      return (
        <FieldWrapper field={field}>
          <input
            type="time"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={readOnly}
            className={baseInputClasses}
          />
        </FieldWrapper>
      )

    case 'select':
      return (
        <FieldWrapper field={field}>
          <select
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={readOnly}
            className={baseInputClasses}
          >
            <option value="">Vali...</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FieldWrapper>
      )

    case 'multiselect':
      const selectedValues = (value as string[]) || []
      return (
        <FieldWrapper field={field}>
          <div className="space-y-2">
            {options.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={selectedValues.includes(option.value)}
                  onChange={(e) => {
                    const newValues = e.target.checked
                      ? [...selectedValues, option.value]
                      : selectedValues.filter((v) => v !== option.value)
                    onChange(newValues)
                  }}
                  disabled={readOnly}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <span
                  className="text-sm px-2 py-0.5 rounded-full"
                  style={option.color ? { backgroundColor: `${option.color}20`, color: option.color } : {}}
                >
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </FieldWrapper>
      )

    case 'radio':
      return (
        <FieldWrapper field={field}>
          <div className="space-y-2">
            {options.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name={field.key}
                  checked={value === option.value}
                  onChange={() => onChange(option.value)}
                  disabled={readOnly}
                  className="w-4 h-4 border-slate-300"
                />
                <span
                  className="text-sm px-2 py-0.5 rounded-full"
                  style={option.color ? { backgroundColor: `${option.color}20`, color: option.color } : {}}
                >
                  {option.label}
                </span>
              </label>
            ))}
          </div>
        </FieldWrapper>
      )

    case 'checkbox':
      return (
        <FieldWrapper field={field}>
          <div className="space-y-2">
            {options.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={((value as string[]) || []).includes(option.value)}
                  onChange={(e) => {
                    const current = (value as string[]) || []
                    const newValues = e.target.checked
                      ? [...current, option.value]
                      : current.filter((v) => v !== option.value)
                    onChange(newValues)
                  }}
                  disabled={readOnly}
                  className="w-4 h-4 rounded border-slate-300"
                />
                <span className="text-sm">{option.label}</span>
              </label>
            ))}
          </div>
        </FieldWrapper>
      )

    case 'boolean':
      return (
        <FieldWrapper field={field}>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input
                type="checkbox"
                checked={value === true}
                onChange={(e) => onChange(e.target.checked)}
                disabled={readOnly}
                className="sr-only"
              />
              <div
                className={`w-11 h-6 rounded-full transition-colors ${
                  value ? 'bg-primary' : 'bg-slate-300'
                }`}
                style={value ? { backgroundColor: '#279989' } : {}}
              />
              <div
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  value ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </div>
            <span className="text-sm text-slate-700">
              {value ? 'Jah' : 'Ei'}
            </span>
          </label>
        </FieldWrapper>
      )

    case 'color':
      return (
        <FieldWrapper field={field}>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={(value as string) || '#279989'}
              onChange={(e) => onChange(e.target.value)}
              disabled={readOnly}
              className="w-12 h-10 rounded-lg border border-slate-300 cursor-pointer"
            />
            <input
              type="text"
              value={(value as string) || ''}
              onChange={(e) => onChange(e.target.value)}
              placeholder="#279989"
              disabled={readOnly}
              className={`${baseInputClasses} flex-1 font-mono text-sm`}
            />
          </div>
        </FieldWrapper>
      )

    case 'file':
    case 'image':
      return (
        <FieldWrapper field={field}>
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
            <input
              type="file"
              accept={field.type === 'image' ? 'image/*' : undefined}
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) {
                  onChange(file.name) // In real app, would upload and get URL
                }
              }}
              disabled={readOnly}
              className="hidden"
              id={`file-${field.key}`}
            />
            <label
              htmlFor={`file-${field.key}`}
              className="cursor-pointer"
            >
              <div className="text-slate-500 mb-2">
                {field.type === 'image' ? '📷' : '📎'}
              </div>
              <p className="text-sm text-slate-600">
                {value ? (value as string) : 'Kliki faili üleslaadimiseks'}
              </p>
            </label>
          </div>
        </FieldWrapper>
      )

    default:
      return (
        <FieldWrapper field={field}>
          <input
            type="text"
            value={(value as string) || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={readOnly}
            className={baseInputClasses}
          />
        </FieldWrapper>
      )
  }
}

// Field wrapper with label and help text
function FieldWrapper({
  field,
  children,
}: {
  field: DynamicField
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-slate-700">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {field.config?.helpText && (
        <p className="text-xs text-slate-500">{field.config.helpText as string}</p>
      )}
    </div>
  )
}

// Preview component for showing all fields
interface DynamicFieldsPreviewProps {
  fields: DynamicField[]
  values: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
  readOnly?: boolean
}

export function DynamicFieldsPreview({
  fields,
  values,
  onChange,
  readOnly = false,
}: DynamicFieldsPreviewProps) {
  // Group fields
  const groupedFields = fields
    .filter((f) => f.isActive)
    .reduce((acc, field) => {
      const group = field.fieldGroup || 'Muu'
      if (!acc[group]) acc[group] = []
      acc[group].push(field)
      return acc
    }, {} as Record<string, DynamicField[]>)

  return (
    <div className="space-y-6">
      {Object.entries(groupedFields).map(([group, groupFields]) => (
        <div key={group} className="space-y-4">
          <h3 className="text-sm font-semibold text-slate-900 border-b border-slate-200 pb-2">
            {group}
          </h3>
          <div className="grid gap-4 md:grid-cols-2">
            {groupFields
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((field) => (
                <DynamicFieldRenderer
                  key={field.id}
                  field={field}
                  value={values[field.key]}
                  onChange={(value) => onChange(field.key, value)}
                  readOnly={readOnly}
                />
              ))}
          </div>
        </div>
      ))}
    </div>
  )
}
