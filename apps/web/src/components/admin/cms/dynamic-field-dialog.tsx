'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'
import type { DynamicField, FieldType, FieldOption } from '@rivest/types'

const fieldTypes: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Tekst' },
  { value: 'textarea', label: 'Tekstiala' },
  { value: 'number', label: 'Number' },
  { value: 'decimal', label: 'Kümnendmurd' },
  { value: 'currency', label: 'Valuuta' },
  { value: 'date', label: 'Kuupäev' },
  { value: 'datetime', label: 'Kuupäev ja kellaaeg' },
  { value: 'select', label: 'Rippmenüü' },
  { value: 'multiselect', label: 'Mitu valikut' },
  { value: 'radio', label: 'Raadionupud' },
  { value: 'checkbox', label: 'Märkeruut' },
  { value: 'boolean', label: 'Jah/Ei' },
  { value: 'file', label: 'Fail' },
  { value: 'image', label: 'Pilt' },
  { value: 'url', label: 'URL' },
  { value: 'email', label: 'E-post' },
  { value: 'phone', label: 'Telefon' },
  { value: 'color', label: 'Värv' },
]

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'manager', label: 'Manager' },
  { value: 'user', label: 'Kasutaja' },
  { value: 'viewer', label: 'Vaataja' },
]

interface DynamicFieldDialogProps {
  field: DynamicField | null
  entityType: string
  isOpen: boolean
  onClose: () => void
  onSave: (field: DynamicField) => void
}

export function DynamicFieldDialog({
  field,
  entityType,
  isOpen,
  onClose,
  onSave,
}: DynamicFieldDialogProps) {
  const [formData, setFormData] = useState<Partial<DynamicField>>({
    entityType,
    type: 'text',
    required: false,
    isActive: true,
    fieldGroup: 'Üldine',
    canView: ['admin', 'manager', 'user'],
    canEdit: ['admin', 'manager'],
    config: {},
    validationRules: [],
    conditionalLogic: [],
  })

  useEffect(() => {
    if (field) {
      setFormData(field)
    } else {
      setFormData({
        entityType,
        type: 'text',
        required: false,
        isActive: true,
        fieldGroup: 'Üldine',
        canView: ['admin', 'manager', 'user'],
        canEdit: ['admin', 'manager'],
        config: {},
        validationRules: [],
        conditionalLogic: [],
      })
    }
  }, [field, entityType])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const newField: DynamicField = {
      id: field?.id || String(Date.now()),
      tenantId: 'demo',
      entityType,
      key: formData.key || '',
      label: formData.label || '',
      type: formData.type || 'text',
      config: formData.config || {},
      required: formData.required || false,
      validationRules: formData.validationRules || [],
      sortOrder: formData.sortOrder || 0,
      fieldGroup: formData.fieldGroup || 'Üldine',
      conditionalLogic: formData.conditionalLogic || [],
      canView: formData.canView || ['admin', 'manager', 'user'],
      canEdit: formData.canEdit || ['admin', 'manager'],
      isActive: formData.isActive !== false,
      createdAt: field?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    onSave(newField)
  }

  // Auto-generate key from label
  const handleLabelChange = (label: string) => {
    const key = label
      .toLowerCase()
      .replace(/[äöüõ]/g, (c) => ({ ä: 'a', ö: 'o', ü: 'u', õ: 'o' }[c] || c))
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')

    setFormData({ ...formData, label, key: formData.key ? formData.key : key })
  }

  const needsOptions = ['select', 'multiselect', 'radio', 'checkbox'].includes(formData.type || '')

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* Dialog */}
      <div className="relative bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">
            {field ? 'Muuda välja' : 'Lisa uus väli'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-auto p-6">
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Välja nimi *
                </label>
                <input
                  type="text"
                  value={formData.label || ''}
                  onChange={(e) => handleLabelChange(e.target.value)}
                  placeholder="nt. Projekti prioriteet"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Välja võti *
                </label>
                <input
                  type="text"
                  value={formData.key || ''}
                  onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                  placeholder="nt. projekti_prioriteet"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono text-sm"
                  required
                />
                <p className="text-xs text-slate-500 mt-1">
                  Tehniline nimi (snake_case, ilma tühikuteta)
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Välja tüüp *
                </label>
                <select
                  value={formData.type || 'text'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as FieldType })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  {fieldTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Grupp
                </label>
                <input
                  type="text"
                  value={formData.fieldGroup || ''}
                  onChange={(e) => setFormData({ ...formData, fieldGroup: e.target.value })}
                  placeholder="nt. Üldine, Täpsemad seaded"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>
            </div>

            {/* Options Editor (for select, radio, etc.) */}
            {needsOptions && (
              <div className="border border-slate-200 rounded-lg p-4">
                <OptionsEditor
                  options={(formData.config?.options as FieldOption[]) || []}
                  onChange={(options) =>
                    setFormData({
                      ...formData,
                      config: { ...formData.config, options },
                    })
                  }
                />
              </div>
            )}

            {/* Display Settings */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Kuvamise seaded</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Abitekst
                  </label>
                  <textarea
                    value={(formData.config?.helpText as string) || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        config: { ...formData.config, helpText: e.target.value },
                      })
                    }
                    placeholder="Selgitus kasutajale"
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Kohahoidja tekst
                  </label>
                  <input
                    type="text"
                    value={(formData.config?.placeholder as string) || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        config: { ...formData.config, placeholder: e.target.value },
                      })
                    }
                    placeholder="Placeholder..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  />
                </div>

                <div className="flex flex-wrap gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.required || false}
                      onChange={(e) => setFormData({ ...formData, required: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-slate-700">Kohustuslik väli</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.isActive !== false}
                      onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                      className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-slate-700">Aktiivne</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Permissions */}
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Õigused</h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Kes näeb seda välja?
                  </label>
                  <div className="space-y-2">
                    {roleOptions.map((role) => (
                      <label key={role.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.canView?.includes(role.value) || false}
                          onChange={(e) => {
                            const current = formData.canView || []
                            const updated = e.target.checked
                              ? [...current, role.value]
                              : current.filter((r) => r !== role.value)
                            setFormData({ ...formData, canView: updated })
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-slate-700">{role.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Kes saab muuta seda välja?
                  </label>
                  <div className="space-y-2">
                    {roleOptions.map((role) => (
                      <label key={role.value} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.canEdit?.includes(role.value) || false}
                          onChange={(e) => {
                            const current = formData.canEdit || []
                            const updated = e.target.checked
                              ? [...current, role.value]
                              : current.filter((r) => r !== role.value)
                            setFormData({ ...formData, canEdit: updated })
                          }}
                          className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
                        />
                        <span className="text-sm text-slate-700">{role.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Tühista
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors"
            style={{ backgroundColor: '#279989' }}
          >
            {field ? 'Salvesta muudatused' : 'Lisa väli'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Options Editor Component
function OptionsEditor({
  options,
  onChange,
}: {
  options: FieldOption[]
  onChange: (options: FieldOption[]) => void
}) {
  const addOption = () => {
    onChange([...options, { label: '', value: '', color: '#279989' }])
  }

  const updateOption = (index: number, updates: Partial<FieldOption>) => {
    onChange(options.map((opt, i) => (i === index ? { ...opt, ...updates } : opt)))
  }

  const removeOption = (index: number) => {
    onChange(options.filter((_, i) => i !== index))
  }

  // Auto-generate value from label
  const handleLabelChange = (index: number, label: string) => {
    const value = label
      .toLowerCase()
      .replace(/[äöüõ]/g, (c) => ({ ä: 'a', ö: 'o', ü: 'u', õ: 'o' }[c] || c))
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_|_$/g, '')

    updateOption(index, {
      label,
      value: options[index].value || value,
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">Valikud</label>
        <button
          type="button"
          onClick={addOption}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-lg border border-slate-300 hover:bg-slate-50 transition-colors"
        >
          <Plus className="h-3 w-3" />
          Lisa valik
        </button>
      </div>

      {options.length === 0 ? (
        <p className="text-sm text-slate-500 text-center py-4">
          Valikuid pole veel lisatud
        </p>
      ) : (
        <div className="space-y-2">
          {options.map((option, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                value={option.label}
                onChange={(e) => handleLabelChange(index, e.target.value)}
                placeholder="Silt"
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              <input
                type="text"
                value={option.value}
                onChange={(e) => updateOption(index, { value: e.target.value })}
                placeholder="Väärtus"
                className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-mono"
              />
              <input
                type="color"
                value={option.color || '#279989'}
                onChange={(e) => updateOption(index, { color: e.target.value })}
                className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => removeOption(index)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
