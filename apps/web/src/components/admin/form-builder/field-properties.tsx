'use client'

import { X, Plus, Trash2, GripVertical } from 'lucide-react'
import { FormField, FieldOption } from './types'

interface FieldPropertiesProps {
  field: FormField | null
  onUpdate: (fieldId: string, updates: Partial<FormField>) => void
  onClose: () => void
}

export function FieldProperties({ field, onUpdate, onClose }: FieldPropertiesProps) {
  if (!field) {
    return (
      <div className="w-80 border-l border-slate-200 bg-slate-50 p-4">
        <p className="text-sm text-slate-500 text-center mt-8">
          Vali väli selle omaduste muutmiseks
        </p>
      </div>
    )
  }

  const hasOptions = ['select', 'radio', 'checkbox', 'multi_select'].includes(field.type)
  const options = (field.settings?.options as FieldOption[]) || []

  const handleOptionChange = (index: number, key: 'label' | 'value', value: string) => {
    const newOptions = [...options]
    newOptions[index] = { ...newOptions[index], [key]: value }
    onUpdate(field.id, {
      settings: { ...field.settings, options: newOptions },
    })
  }

  const handleAddOption = () => {
    const newOptions = [
      ...options,
      { label: `Valik ${options.length + 1}`, value: `option_${options.length + 1}` },
    ]
    onUpdate(field.id, {
      settings: { ...field.settings, options: newOptions },
    })
  }

  const handleRemoveOption = (index: number) => {
    const newOptions = options.filter((_, i) => i !== index)
    onUpdate(field.id, {
      settings: { ...field.settings, options: newOptions },
    })
  }

  return (
    <div className="w-80 border-l border-slate-200 bg-slate-50 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-slate-900">Välja omadused</h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-200 transition-colors"
        >
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Label */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">Silt</label>
          <input
            type="text"
            value={field.label}
            onChange={(e) => onUpdate(field.id, { label: e.target.value })}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
        </div>

        {/* Placeholder - only for input fields */}
        {!['heading', 'paragraph', 'divider', 'checkbox', 'radio'].includes(field.type) && (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Kohatäitetekst</label>
            <input
              type="text"
              value={field.placeholder || ''}
              onChange={(e) => onUpdate(field.id, { placeholder: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        )}

        {/* Description */}
        {!['heading', 'paragraph', 'divider'].includes(field.type) && (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Kirjeldus</label>
            <input
              type="text"
              value={field.description || ''}
              onChange={(e) => onUpdate(field.id, { description: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        )}

        {/* Required */}
        {!['heading', 'paragraph', 'divider'].includes(field.type) && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="field-required"
              checked={field.required}
              onChange={(e) => onUpdate(field.id, { required: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
            />
            <label htmlFor="field-required" className="text-sm font-medium text-slate-700">
              Kohustuslik
            </label>
          </div>
        )}

        {/* Width */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">Laius</label>
          <select
            value={field.width || 'full'}
            onChange={(e) =>
              onUpdate(field.id, { width: e.target.value as 'full' | 'half' | 'third' })
            }
            className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          >
            <option value="full">Täislaius</option>
            <option value="half">Pool</option>
            <option value="third">Kolmandik</option>
          </select>
        </div>

        {/* Options for select/radio/checkbox */}
        {hasOptions && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Valikud</label>
            <div className="space-y-2">
              {options.map((option, index) => (
                <div key={index} className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-slate-400 cursor-grab" />
                  <input
                    type="text"
                    value={option.label}
                    onChange={(e) => handleOptionChange(index, 'label', e.target.value)}
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Silt"
                  />
                  <button
                    onClick={() => handleRemoveOption(index)}
                    disabled={options.length <= 1}
                    className="p-2 rounded hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
            <button
              onClick={handleAddOption}
              className="w-full px-3 py-2 mt-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Lisa valik
            </button>
          </div>
        )}

        {/* Number settings */}
        {field.type === 'number' && (
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Min</label>
              <input
                type="number"
                value={(field.settings?.min as number) ?? ''}
                onChange={(e) =>
                  onUpdate(field.id, {
                    settings: {
                      ...field.settings,
                      min: e.target.value ? Number(e.target.value) : undefined,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Max</label>
              <input
                type="number"
                value={(field.settings?.max as number) ?? ''}
                onChange={(e) =>
                  onUpdate(field.id, {
                    settings: {
                      ...field.settings,
                      max: e.target.value ? Number(e.target.value) : undefined,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        )}

        {/* Textarea rows */}
        {field.type === 'textarea' && (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Ridade arv</label>
            <input
              type="number"
              min={2}
              max={20}
              value={(field.settings?.rows as number) ?? 4}
              onChange={(e) =>
                onUpdate(field.id, {
                  settings: { ...field.settings, rows: Number(e.target.value) },
                })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        )}

        {/* Rating max */}
        {field.type === 'rating' && (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Maksimaalne hinnang</label>
            <input
              type="number"
              min={3}
              max={10}
              value={(field.settings?.maxRating as number) ?? 5}
              onChange={(e) =>
                onUpdate(field.id, {
                  settings: { ...field.settings, maxRating: Number(e.target.value) },
                })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        )}

        {/* Slider settings */}
        {field.type === 'slider' && (
          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Min</label>
              <input
                type="number"
                value={(field.settings?.min as number) ?? 0}
                onChange={(e) =>
                  onUpdate(field.id, {
                    settings: { ...field.settings, min: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Max</label>
              <input
                type="number"
                value={(field.settings?.max as number) ?? 100}
                onChange={(e) =>
                  onUpdate(field.id, {
                    settings: { ...field.settings, max: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-slate-700">Samm</label>
              <input
                type="number"
                value={(field.settings?.step as number) ?? 1}
                onChange={(e) =>
                  onUpdate(field.id, {
                    settings: { ...field.settings, step: Number(e.target.value) },
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>
        )}

        {/* Heading level */}
        {field.type === 'heading' && (
          <div className="space-y-1">
            <label className="block text-sm font-medium text-slate-700">Pealkirja tase</label>
            <select
              value={String((field.settings?.level as number) ?? 2)}
              onChange={(e) =>
                onUpdate(field.id, {
                  settings: { ...field.settings, level: Number(e.target.value) },
                })
              }
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            >
              <option value="1">H1 - Suur</option>
              <option value="2">H2 - Keskmine</option>
              <option value="3">H3 - Väike</option>
            </select>
          </div>
        )}
      </div>
    </div>
  )
}
