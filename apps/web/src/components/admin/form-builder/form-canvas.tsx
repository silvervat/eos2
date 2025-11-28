'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Trash2, GripVertical, Settings } from 'lucide-react'
import { FormField, FieldOption } from './types'

interface FormCanvasProps {
  fields: FormField[]
  selectedFieldId: string | null
  onSelectField: (field: FormField) => void
  onDeleteField: (fieldId: string) => void
}

interface SortableFieldProps {
  field: FormField
  isSelected: boolean
  onSelect: () => void
  onDelete: () => void
}

function FieldPreview({ field }: { field: FormField }) {
  const options = (field.settings?.options as FieldOption[]) || []

  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
    case 'url':
      return (
        <input
          type="text"
          placeholder={field.placeholder || field.label}
          disabled
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 disabled:opacity-50"
        />
      )

    case 'number':
      return (
        <input
          type="number"
          placeholder={field.placeholder || field.label}
          min={field.settings?.min as number}
          max={field.settings?.max as number}
          disabled
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 disabled:opacity-50"
        />
      )

    case 'textarea':
      return (
        <textarea
          placeholder={field.placeholder || field.label}
          rows={(field.settings?.rows as number) || 4}
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 disabled:opacity-50"
          disabled
        />
      )

    case 'select':
      return (
        <select
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 disabled:opacity-50"
          disabled
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
      return (
        <div className="space-y-2">
          {options.map((opt) => (
            <div key={opt.value} className="flex items-center gap-2">
              <input type="radio" name={field.id} disabled className="h-4 w-4" />
              <span className="text-sm text-slate-700">{opt.label}</span>
            </div>
          ))}
        </div>
      )

    case 'checkbox':
      return (
        <div className="space-y-2">
          {options.map((opt) => (
            <div key={opt.value} className="flex items-center gap-2">
              <input type="checkbox" disabled className="h-4 w-4" />
              <span className="text-sm text-slate-700">{opt.label}</span>
            </div>
          ))}
        </div>
      )

    case 'multi_select':
      return (
        <div className="space-y-1">
          {options.map((opt) => (
            <div key={opt.value} className="flex items-center gap-2">
              <input type="checkbox" disabled className="h-4 w-4" />
              <span className="text-sm text-slate-700">{opt.label}</span>
            </div>
          ))}
        </div>
      )

    case 'date':
      return (
        <input
          type="date"
          disabled
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 disabled:opacity-50"
        />
      )

    case 'time':
      return (
        <input
          type="time"
          disabled
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 disabled:opacity-50"
        />
      )

    case 'datetime':
      return (
        <input
          type="datetime-local"
          disabled
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 disabled:opacity-50"
        />
      )

    case 'file_upload':
      return (
        <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center text-sm text-slate-500">
          Lohista fail siia või kliki valimiseks
        </div>
      )

    case 'signature':
      return (
        <div className="border border-slate-300 rounded-lg p-8 text-center text-sm text-slate-500 bg-slate-50">
          Allkirja ala
        </div>
      )

    case 'rating':
      const maxRating = (field.settings?.maxRating as number) || 5
      return (
        <div className="flex gap-1">
          {Array.from({ length: maxRating }).map((_, i) => (
            <span key={i} className="text-xl text-slate-400">
              &#9734;
            </span>
          ))}
        </div>
      )

    case 'slider':
      return (
        <input
          type="range"
          min={(field.settings?.min as number) || 0}
          max={(field.settings?.max as number) || 100}
          step={(field.settings?.step as number) || 1}
          className="w-full"
          disabled
        />
      )

    case 'heading':
      const level = (field.settings?.level as number) || 2
      const headingClasses: Record<number, string> = {
        1: 'text-2xl font-bold text-slate-900',
        2: 'text-xl font-semibold text-slate-900',
        3: 'text-lg font-medium text-slate-900',
      }
      if (level === 1) return <h1 className={headingClasses[1]}>{field.label}</h1>
      if (level === 2) return <h2 className={headingClasses[2]}>{field.label}</h2>
      return <h3 className={headingClasses[3]}>{field.label}</h3>

    case 'paragraph':
      return <p className="text-sm text-slate-600">{field.label}</p>

    case 'divider':
      return <hr className="border-slate-300" />

    default:
      return (
        <input
          type="text"
          placeholder={field.label}
          disabled
          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 disabled:opacity-50"
        />
      )
  }
}

function SortableField({ field, isSelected, onSelect, onDelete }: SortableFieldProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const widthClasses: Record<string, string> = {
    full: 'w-full',
    half: 'w-1/2',
    third: 'w-1/3',
  }

  const isDisplay = ['heading', 'paragraph', 'divider'].includes(field.type)

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group relative p-3 rounded-lg border-2 transition-colors ${
        widthClasses[field.width || 'full']
      } ${
        isSelected ? 'border-primary bg-primary/5' : 'border-transparent hover:border-slate-200'
      } ${isDragging ? 'z-50' : ''}`}
      onClick={onSelect}
    >
      {/* Drag handle and actions */}
      <div className="absolute -left-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div
          {...attributes}
          {...listeners}
          className="p-1 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4 text-slate-400" />
        </div>
      </div>

      <div className="absolute -right-1 top-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onSelect()
          }}
          className="p-1 rounded hover:bg-slate-200 transition-colors"
        >
          <Settings className="h-3 w-3 text-slate-500" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
          className="p-1 rounded hover:bg-red-100 transition-colors"
        >
          <Trash2 className="h-3 w-3 text-red-500" />
        </button>
      </div>

      {/* Field content */}
      <div className="space-y-2">
        {!isDisplay && (
          <label className="flex items-center gap-1 text-sm font-medium text-slate-700">
            {field.label}
            {field.required && <span className="text-red-500">*</span>}
          </label>
        )}
        <FieldPreview field={field} />
        {field.description && !isDisplay && (
          <p className="text-xs text-slate-500">{field.description}</p>
        )}
      </div>
    </div>
  )
}

export function FormCanvas({
  fields,
  selectedFieldId,
  onSelectField,
  onDeleteField,
}: FormCanvasProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'form-canvas',
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 p-6 overflow-y-auto ${isOver ? 'bg-primary/5' : ''}`}
    >
      <div className="max-w-2xl mx-auto">
        <SortableContext items={fields.map((f) => f.id)} strategy={verticalListSortingStrategy}>
          {fields.length === 0 ? (
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-12 text-center">
              <p className="text-slate-500">
                Lohista väljad siia vormile lisamiseks
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {fields.map((field) => (
                <SortableField
                  key={field.id}
                  field={field}
                  isSelected={selectedFieldId === field.id}
                  onSelect={() => onSelectField(field)}
                  onDelete={() => onDeleteField(field.id)}
                />
              ))}
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  )
}
