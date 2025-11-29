'use client'

import { useState } from 'react'
import { Button, Input, Label, Card, Checkbox, Switch, Textarea } from '@rivest/ui'
import { X } from 'lucide-react'
import { getColumnType } from '@/lib/ultra-table/column-types/registry'
import type { DialogConfig, DialogSection, DialogField } from './useDialogDesigner'
import { cn } from '@rivest/ui'

interface PreviewDialogProps {
  config: DialogConfig
  tableId: string
  onClose: () => void
}

export function PreviewDialog({ config, tableId, onClose }: PreviewDialogProps) {
  const [formData, setFormData] = useState<Record<string, any>>({})

  const handleChange = (fieldId: string, value: any) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />

      {/* Dialog */}
      <Card className="relative z-10 w-full max-w-2xl max-h-[90vh] overflow-auto m-4 p-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Preview badge */}
        <div className="absolute top-4 left-4">
          <span className="px-2 py-1 bg-[#279989] text-white text-xs rounded font-medium">
            Preview
          </span>
        </div>

        {/* Dialog content */}
        <div className="mt-8 space-y-6">
          {config.sections.map(section => (
            <PreviewSection
              key={section.id}
              section={section}
              formData={formData}
              onChange={handleChange}
            />
          ))}
        </div>

        {/* Dialog Actions */}
        <div className="mt-6 flex justify-end gap-2 pt-6 border-t">
          {config.cancelButton?.show && (
            <Button variant="outline" onClick={onClose}>
              {config.cancelButton.label}
            </Button>
          )}
          <Button
            className={
              config.submitButton?.variant === 'primary'
                ? 'bg-[#279989] hover:bg-[#1f7a6e]'
                : ''
            }
            onClick={() => {
              console.log('Form data:', formData)
              alert('Form submitted! Check console for data.')
            }}
          >
            {config.submitButton?.label || 'Submit'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

function PreviewSection({
  section,
  formData,
  onChange,
}: {
  section: DialogSection
  formData: Record<string, any>
  onChange: (fieldId: string, value: any) => void
}) {
  return (
    <div className="space-y-4">
      {section.title && (
        <div className="border-b pb-2">
          <h3 className="font-semibold">{section.title}</h3>
          {section.description && (
            <p className="text-sm text-muted-foreground">{section.description}</p>
          )}
        </div>
      )}

      <div
        className={cn(
          'space-y-4',
          section.layout?.type === 'grid' && 'grid gap-4',
          section.layout?.type === 'grid' && section.layout.columns === 2 && 'grid-cols-2',
          section.layout?.type === 'grid' && section.layout.columns === 3 && 'grid-cols-3',
          section.layout?.type === 'horizontal' && 'flex flex-wrap gap-4'
        )}
      >
        {section.fields.map(field => (
          <PreviewField
            key={field.id}
            field={field}
            value={formData[field.id]}
            onChange={(value) => onChange(field.id, value)}
          />
        ))}
      </div>
    </div>
  )
}

function PreviewField({
  field,
  value,
  onChange,
}: {
  field: DialogField
  value: any
  onChange: (value: any) => void
}) {
  const columnType = getColumnType(field.columnType as any)

  // Render different inputs based on column type
  const renderInput = () => {
    switch (field.columnType) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
        return (
          <Input
            type={field.columnType === 'email' ? 'email' : 'text'}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={field.disabled}
          />
        )

      case 'long_text':
        return (
          <Textarea
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder}
            disabled={field.disabled}
            rows={4}
          />
        )

      case 'number':
      case 'currency':
      case 'percent':
      case 'decimal':
        return (
          <Input
            type="number"
            value={value || ''}
            onChange={(e) => onChange(Number(e.target.value))}
            placeholder={field.placeholder}
            disabled={field.disabled}
          />
        )

      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <Checkbox
              checked={value || false}
              onCheckedChange={(checked) => onChange(checked)}
              disabled={field.disabled}
            />
            <span className="text-sm">{field.placeholder || 'Enabled'}</span>
          </div>
        )

      case 'toggle':
        return (
          <div className="flex items-center gap-2">
            <Switch
              checked={value || false}
              onCheckedChange={(checked) => onChange(checked)}
              disabled={field.disabled}
            />
            <span className="text-sm">{field.placeholder || 'Enabled'}</span>
          </div>
        )

      case 'date':
        return (
          <Input
            type="date"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={field.disabled}
          />
        )

      case 'datetime':
        return (
          <Input
            type="datetime-local"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={field.disabled}
          />
        )

      case 'time':
        return (
          <Input
            type="time"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            disabled={field.disabled}
          />
        )

      default:
        return (
          <Input
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || `Enter ${columnType.name}`}
            disabled={field.disabled}
          />
        )
    }
  }

  if (field.hidden) {
    return null
  }

  return (
    <div
      className={cn(
        'space-y-2',
        field.width === 'half' && 'w-1/2',
        field.width === 'third' && 'w-1/3',
        field.width === 'full' && 'w-full'
      )}
    >
      <Label>
        {field.label || field.columnKey}
        {field.required && <span className="text-destructive ml-1">*</span>}
      </Label>
      {renderInput()}
    </div>
  )
}
