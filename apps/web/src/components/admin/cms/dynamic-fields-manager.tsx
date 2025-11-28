'use client'

import { useState } from 'react'
import { Plus, Edit, Trash2, CheckCircle2, XCircle, GripVertical } from 'lucide-react'
import type { DynamicField, FieldType } from '@rivest/types'
import { DynamicFieldDialog } from './dynamic-field-dialog'

// Mock data for demo
const mockFields: DynamicField[] = [
  {
    id: '1',
    tenantId: 'demo',
    entityType: 'projects',
    key: 'priority_level',
    label: 'Prioriteet',
    type: 'select',
    config: {
      options: [
        { label: 'Madal', value: 'low', color: '#22c55e' },
        { label: 'Keskmine', value: 'medium', color: '#eab308' },
        { label: 'Kõrge', value: 'high', color: '#ef4444' },
      ],
    },
    required: true,
    validationRules: [],
    sortOrder: 1,
    fieldGroup: 'Üldine',
    conditionalLogic: [],
    canView: ['admin', 'manager', 'user'],
    canEdit: ['admin', 'manager'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    tenantId: 'demo',
    entityType: 'projects',
    key: 'custom_notes',
    label: 'Lisamärkmed',
    type: 'textarea',
    config: {
      placeholder: 'Lisa märkmeid projekti kohta...',
      maxLength: 1000,
    },
    required: false,
    validationRules: [],
    sortOrder: 2,
    fieldGroup: 'Üldine',
    conditionalLogic: [],
    canView: ['admin', 'manager', 'user'],
    canEdit: ['admin', 'manager', 'user'],
    isActive: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '3',
    tenantId: 'demo',
    entityType: 'projects',
    key: 'deadline_alert',
    label: 'Tähtaeg hoiatuseks',
    type: 'date',
    config: {},
    required: false,
    validationRules: [],
    sortOrder: 3,
    fieldGroup: 'Ajakava',
    conditionalLogic: [],
    canView: ['admin', 'manager'],
    canEdit: ['admin'],
    isActive: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

const fieldTypeLabels: Record<FieldType, string> = {
  text: 'Tekst',
  textarea: 'Tekstiala',
  rich_text: 'Rikastekst',
  number: 'Number',
  decimal: 'Kümnendmurd',
  currency: 'Valuuta',
  date: 'Kuupäev',
  datetime: 'Kuupäev ja kellaaeg',
  time: 'Kellaaeg',
  select: 'Valik',
  multiselect: 'Mitu valikut',
  radio: 'Raadionupud',
  checkbox: 'Märkeruut',
  boolean: 'Jah/Ei',
  file: 'Fail',
  image: 'Pilt',
  url: 'URL',
  email: 'E-post',
  phone: 'Telefon',
  color: 'Värv',
  json: 'JSON',
}

interface DynamicFieldsManagerProps {
  entityType: string
}

export function DynamicFieldsManager({ entityType }: DynamicFieldsManagerProps) {
  const [fields, setFields] = useState<DynamicField[]>(mockFields)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedField, setSelectedField] = useState<DynamicField | null>(null)

  // Group fields by fieldGroup
  const groupedFields = fields.reduce((acc, field) => {
    const group = field.fieldGroup || 'Muu'
    if (!acc[group]) acc[group] = []
    acc[group].push(field)
    return acc
  }, {} as Record<string, DynamicField[]>)

  const handleDelete = (fieldId: string) => {
    if (confirm('Kas oled kindel, et soovid selle välja kustutada?')) {
      setFields(fields.filter(f => f.id !== fieldId))
    }
  }

  const handleToggleActive = (fieldId: string) => {
    setFields(fields.map(f =>
      f.id === fieldId ? { ...f, isActive: !f.isActive } : f
    ))
  }

  const handleSave = (fieldData: Partial<DynamicField>) => {
    if (selectedField) {
      // Update existing field
      setFields(fields.map(f =>
        f.id === selectedField.id
          ? { ...f, ...fieldData, updatedAt: new Date().toISOString() }
          : f
      ))
    } else {
      // Create new field
      const newField: DynamicField = {
        id: crypto.randomUUID(),
        tenantId: 'demo',
        entityType,
        key: fieldData.key || '',
        label: fieldData.label || '',
        type: fieldData.type || 'text',
        config: fieldData.config || {},
        required: fieldData.required || false,
        validationRules: fieldData.validationRules || [],
        sortOrder: fields.length + 1,
        fieldGroup: fieldData.fieldGroup || 'Muu',
        conditionalLogic: [],
        canView: fieldData.canView || ['admin', 'manager', 'user'],
        canEdit: fieldData.canEdit || ['admin', 'manager'],
        isActive: fieldData.isActive !== undefined ? fieldData.isActive : true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      setFields([...fields, newField])
    }
    setIsDialogOpen(false)
    setSelectedField(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dünaamilised väljad</h1>
          <p className="text-slate-600 text-sm mt-1">
            Halda {entityType} mooduli kohandatud välju
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedField(null)
            setIsDialogOpen(true)
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors hover:opacity-90"
          style={{ backgroundColor: '#279989' }}
        >
          <Plus className="h-4 w-4" />
          Lisa väli
        </button>
      </div>

      {/* Fields by Group */}
      <div className="space-y-6">
        {Object.entries(groupedFields).map(([group, groupFields]) => (
          <div key={group} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
              <h2 className="font-semibold text-slate-900">{group}</h2>
              <p className="text-sm text-slate-500">{groupFields.length} välja</p>
            </div>
            <div className="divide-y divide-slate-100">
              {groupFields.map((field) => (
                <div
                  key={field.id}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition-colors"
                >
                  <GripVertical className="h-4 w-4 text-slate-400 cursor-grab" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">{field.label}</span>
                      {field.required && (
                        <span className="text-red-500 text-xs">*</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">
                        {field.key}
                      </code>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {fieldTypeLabels[field.type]}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Required indicator */}
                    <div className="flex items-center gap-1 text-sm">
                      {field.required ? (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-slate-300" />
                      )}
                    </div>

                    {/* Status badge */}
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        field.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {field.isActive ? 'Aktiivne' : 'Mitteaktiivne'}
                    </span>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          setSelectedField(field)
                          setIsDialogOpen(true)
                        }}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title="Muuda"
                      >
                        <Edit className="h-4 w-4 text-slate-500" />
                      </button>
                      <button
                        onClick={() => handleToggleActive(field.id)}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                        title={field.isActive ? 'Deaktiveeri' : 'Aktiveeri'}
                      >
                        {field.isActive ? (
                          <XCircle className="h-4 w-4 text-slate-500" />
                        ) : (
                          <CheckCircle2 className="h-4 w-4 text-slate-500" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete(field.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                        title="Kustuta"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {fields.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <div className="text-slate-400 mb-4">
            <Plus className="h-12 w-12 mx-auto" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Dünaamilisi välju pole
          </h3>
          <p className="text-slate-600 mb-4">
            Lisa esimene kohandatud väli sellele moodulile
          </p>
          <button
            onClick={() => setIsDialogOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: '#279989' }}
          >
            <Plus className="h-4 w-4" />
            Lisa väli
          </button>
        </div>
      )}

      {/* Dynamic Field Dialog */}
      <DynamicFieldDialog
        isOpen={isDialogOpen}
        onClose={() => {
          setIsDialogOpen(false)
          setSelectedField(null)
        }}
        onSave={handleSave}
        field={selectedField}
        entityType={entityType}
      />
    </div>
  )
}
