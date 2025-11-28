'use client'

import { useState, useCallback } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  pointerWithin,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { Save, Eye, EyeOff, FileText, Settings, Palette } from 'lucide-react'
import { FieldPalette } from './field-palette'
import { FormCanvas } from './form-canvas'
import { FieldProperties } from './field-properties'
import {
  FormField,
  FormTemplate,
  FormSettings,
  FormTheme,
  FieldType,
  generateId,
  getDefaultLabel,
  getDefaultSettings,
} from './types'

interface FormBuilderProps {
  templateId?: string
  onSave?: (template: Partial<FormTemplate>) => void
}

const defaultSettings: FormSettings = {
  submitButtonText: 'Saada',
  showProgressBar: false,
  savePartialData: false,
  allowMultipleSubmissions: true,
  requireAuth: false,
  captcha: false,
  emailNotifications: true,
  autoSave: true,
  language: 'et',
}

const defaultTheme: FormTheme = {
  primaryColor: '#279989',
  backgroundColor: '#ffffff',
  fontFamily: 'system-ui',
  fontSize: 14,
  borderRadius: 8,
  fieldSpacing: 16,
  labelPosition: 'top',
}

export function FormBuilder({ templateId, onSave }: FormBuilderProps) {
  const [formName, setFormName] = useState('Uus vorm')
  const [formDescription, setFormDescription] = useState('')
  const [fields, setFields] = useState<FormField[]>([])
  const [selectedField, setSelectedField] = useState<FormField | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [activeTab, setActiveTab] = useState<'build' | 'settings' | 'theme'>('build')
  const [settings, setSettings] = useState<FormSettings>(defaultSettings)
  const [theme, setTheme] = useState<FormTheme>(defaultTheme)
  const [activeDragId, setActiveDragId] = useState<string | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id))
  }

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      setActiveDragId(null)

      if (!over) return

      // Adding new field from palette
      if (active.data.current?.isNew) {
        const fieldType = active.data.current.type as FieldType

        const newField: FormField = {
          id: generateId(),
          type: fieldType,
          label: getDefaultLabel(fieldType),
          required: false,
          validation: [],
          width: 'full',
          settings: getDefaultSettings(fieldType),
        }

        // Find position to insert
        if (over.id === 'form-canvas') {
          setFields((prev) => [...prev, newField])
        } else {
          const overIndex = fields.findIndex((f) => f.id === over.id)
          if (overIndex >= 0) {
            const newFields = [...fields]
            newFields.splice(overIndex + 1, 0, newField)
            setFields(newFields)
          } else {
            setFields((prev) => [...prev, newField])
          }
        }

        setSelectedField(newField)
        return
      }

      // Reordering existing fields
      if (active.id !== over.id) {
        setFields((items) => {
          const oldIndex = items.findIndex((f) => f.id === active.id)
          const newIndex = items.findIndex((f) => f.id === over.id)

          if (oldIndex >= 0 && newIndex >= 0) {
            return arrayMove(items, oldIndex, newIndex)
          }
          return items
        })
      }
    },
    [fields]
  )

  const handleFieldUpdate = useCallback(
    (fieldId: string, updates: Partial<FormField>) => {
      setFields((prev) =>
        prev.map((f) => (f.id === fieldId ? { ...f, ...updates } : f))
      )
      if (selectedField?.id === fieldId) {
        setSelectedField((prev) => (prev ? { ...prev, ...updates } : null))
      }
    },
    [selectedField]
  )

  const handleDeleteField = useCallback(
    (fieldId: string) => {
      setFields((prev) => prev.filter((f) => f.id !== fieldId))
      if (selectedField?.id === fieldId) {
        setSelectedField(null)
      }
    },
    [selectedField]
  )

  const handleSave = () => {
    const template: Partial<FormTemplate> = {
      id: templateId || generateId(),
      name: formName,
      description: formDescription,
      fields,
      settings,
      theme,
      updatedAt: new Date(),
    }
    onSave?.(template)
    alert('Vorm salvestatud!')
  }

  const tabs = [
    { id: 'build', label: 'Ehita', icon: FileText },
    { id: 'settings', label: 'Seaded', icon: Settings },
    { id: 'theme', label: 'Teema', icon: Palette },
  ]

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white rounded-xl shadow-sm border border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="text-lg font-semibold w-64 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
          />
          <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPreviewMode(!previewMode)}
            className="flex items-center gap-2 px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            {previewMode ? (
              <>
                <EyeOff className="h-4 w-4" />
                Sulge eelvaade
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Eelvaade
              </>
            )}
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            style={{ backgroundColor: '#279989' }}
          >
            <Save className="h-4 w-4" />
            Salvesta
          </button>
        </div>
      </div>

      {/* Main content */}
      {activeTab === 'build' && (
        <DndContext
          sensors={sensors}
          collisionDetection={pointerWithin}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-1 overflow-hidden">
            {!previewMode && <FieldPalette />}

            <FormCanvas
              fields={fields}
              selectedFieldId={selectedField?.id || null}
              onSelectField={setSelectedField}
              onDeleteField={handleDeleteField}
            />

            {!previewMode && selectedField && (
              <FieldProperties
                field={selectedField}
                onUpdate={handleFieldUpdate}
                onClose={() => setSelectedField(null)}
              />
            )}
          </div>

          <DragOverlay>
            {activeDragId && (
              <div className="p-3 rounded-md border border-primary bg-white shadow-lg">
                <span className="text-sm font-medium">Lohistamine...</span>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {activeTab === 'settings' && (
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-xl mx-auto space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">Vormi seaded</h2>

            <div className="space-y-4">
              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Vormi kirjeldus</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                  rows={3}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Saatmisnupu tekst</label>
                <input
                  type="text"
                  value={settings.submitButtonText}
                  onChange={(e) =>
                    setSettings({ ...settings, submitButtonText: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Suunamis-URL pärast saatmist</label>
                <input
                  type="text"
                  value={settings.submitRedirectUrl || ''}
                  onChange={(e) =>
                    setSettings({ ...settings, submitRedirectUrl: e.target.value })
                  }
                  placeholder="https://..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-200">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="show-progress"
                    checked={settings.showProgressBar}
                    onChange={(e) =>
                      setSettings({ ...settings, showProgressBar: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="show-progress" className="text-sm font-medium text-slate-700">
                    Näita edenemisriba
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="save-partial"
                    checked={settings.savePartialData}
                    onChange={(e) =>
                      setSettings({ ...settings, savePartialData: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="save-partial" className="text-sm font-medium text-slate-700">
                    Salvesta osalised andmed
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="multiple-submissions"
                    checked={settings.allowMultipleSubmissions}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        allowMultipleSubmissions: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="multiple-submissions" className="text-sm font-medium text-slate-700">
                    Luba mitu saatmist
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="require-auth"
                    checked={settings.requireAuth}
                    onChange={(e) =>
                      setSettings({ ...settings, requireAuth: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="require-auth" className="text-sm font-medium text-slate-700">
                    Nõua sisselogimist
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="captcha"
                    checked={settings.captcha}
                    onChange={(e) =>
                      setSettings({ ...settings, captcha: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="captcha" className="text-sm font-medium text-slate-700">
                    CAPTCHA
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="email-notifications"
                    checked={settings.emailNotifications}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        emailNotifications: e.target.checked,
                      })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="email-notifications" className="text-sm font-medium text-slate-700">
                    E-posti teavitused
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="auto-save"
                    checked={settings.autoSave}
                    onChange={(e) =>
                      setSettings({ ...settings, autoSave: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary"
                  />
                  <label htmlFor="auto-save" className="text-sm font-medium text-slate-700">
                    Automaatne salvestamine
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'theme' && (
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-xl mx-auto space-y-6">
            <h2 className="text-lg font-semibold text-slate-900">Vormi teema</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Põhivärv</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={theme.primaryColor}
                      onChange={(e) =>
                        setTheme({ ...theme, primaryColor: e.target.value })
                      }
                      className="w-12 h-10 p-1 border border-slate-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={theme.primaryColor}
                      onChange={(e) =>
                        setTheme({ ...theme, primaryColor: e.target.value })
                      }
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="block text-sm font-medium text-slate-700">Taustavärv</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={theme.backgroundColor}
                      onChange={(e) =>
                        setTheme({ ...theme, backgroundColor: e.target.value })
                      }
                      className="w-12 h-10 p-1 border border-slate-300 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={theme.backgroundColor}
                      onChange={(e) =>
                        setTheme({ ...theme, backgroundColor: e.target.value })
                      }
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Fondi suurus (px)</label>
                <input
                  type="number"
                  min={10}
                  max={24}
                  value={theme.fontSize}
                  onChange={(e) =>
                    setTheme({ ...theme, fontSize: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Nurkade ümarus (px)</label>
                <input
                  type="number"
                  min={0}
                  max={24}
                  value={theme.borderRadius}
                  onChange={(e) =>
                    setTheme({ ...theme, borderRadius: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Väljade vahe (px)</label>
                <input
                  type="number"
                  min={8}
                  max={48}
                  value={theme.fieldSpacing}
                  onChange={(e) =>
                    setTheme({ ...theme, fieldSpacing: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-sm font-medium text-slate-700">Sildi asukoht</label>
                <select
                  value={theme.labelPosition}
                  onChange={(e) =>
                    setTheme({
                      ...theme,
                      labelPosition: e.target.value as 'top' | 'left' | 'placeholder',
                    })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                >
                  <option value="top">Üleval</option>
                  <option value="left">Vasakul</option>
                  <option value="placeholder">Kohatäitena</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
