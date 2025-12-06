'use client'

/**
 * Admin - Integrations & API Keys
 * Configure external service integrations like OCR, AI, etc.
 */

import React, { useState } from 'react'
import {
  Key,
  Eye,
  EyeOff,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  ScanLine,
  Mail,
  MessageSquare,
  Cloud,
  Shield,
  Settings,
  Trash2,
  Plus,
  TestTube,
} from 'lucide-react'

interface ApiIntegration {
  id: string
  name: string
  description: string
  icon: React.ElementType
  category: 'ai' | 'communication' | 'storage' | 'other'
  apiKeyConfigured: boolean
  lastTested?: string
  status: 'active' | 'inactive' | 'error'
  fields: {
    name: string
    label: string
    type: 'text' | 'password' | 'select'
    required: boolean
    placeholder?: string
    options?: string[]
    value?: string
  }[]
  docsUrl?: string
}

const integrations: ApiIntegration[] = [
  {
    id: 'openai',
    name: 'OpenAI',
    description: 'GPT-4 Vision API dokumendituvastuseks ja teksti analüüsiks',
    icon: Sparkles,
    category: 'ai',
    apiKeyConfigured: false,
    status: 'inactive',
    fields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true, placeholder: 'sk-...' },
      { name: 'model', label: 'Mudel', type: 'select', required: true, options: ['gpt-4-vision-preview', 'gpt-4o', 'gpt-4o-mini'] },
      { name: 'org_id', label: 'Organization ID', type: 'text', required: false, placeholder: 'org-...' },
    ],
    docsUrl: 'https://platform.openai.com/docs/api-reference',
  },
  {
    id: 'google_vision',
    name: 'Google Cloud Vision',
    description: 'Google Vision API tekstide ja dokumentide OCR-iks',
    icon: ScanLine,
    category: 'ai',
    apiKeyConfigured: false,
    status: 'inactive',
    fields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true, placeholder: 'AIza...' },
      { name: 'project_id', label: 'Project ID', type: 'text', required: true, placeholder: 'my-project-123' },
    ],
    docsUrl: 'https://cloud.google.com/vision/docs',
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    description: 'Claude AI dokumendianalüüsiks ja tekstide töötlemiseks',
    icon: Sparkles,
    category: 'ai',
    apiKeyConfigured: true,
    lastTested: '2024-03-15 14:30',
    status: 'active',
    fields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true, placeholder: 'sk-ant-...' },
      { name: 'model', label: 'Mudel', type: 'select', required: true, options: ['claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'] },
    ],
    docsUrl: 'https://docs.anthropic.com/',
  },
  {
    id: 'azure_ocr',
    name: 'Azure Document Intelligence',
    description: 'Microsoft Azure vormide ja dokumentide analüüs',
    icon: Cloud,
    category: 'ai',
    apiKeyConfigured: false,
    status: 'inactive',
    fields: [
      { name: 'endpoint', label: 'Endpoint URL', type: 'text', required: true, placeholder: 'https://your-resource.cognitiveservices.azure.com/' },
      { name: 'api_key', label: 'API Key', type: 'password', required: true, placeholder: '' },
    ],
    docsUrl: 'https://learn.microsoft.com/en-us/azure/ai-services/document-intelligence/',
  },
  {
    id: 'sendgrid',
    name: 'SendGrid',
    description: 'E-posti saatmine ja teavitused',
    icon: Mail,
    category: 'communication',
    apiKeyConfigured: true,
    lastTested: '2024-03-14 10:00',
    status: 'active',
    fields: [
      { name: 'api_key', label: 'API Key', type: 'password', required: true, placeholder: 'SG...' },
      { name: 'from_email', label: 'Saatja e-post', type: 'text', required: true, placeholder: 'noreply@rivest.ee' },
      { name: 'from_name', label: 'Saatja nimi', type: 'text', required: false, placeholder: 'Rivest ERP' },
    ],
    docsUrl: 'https://docs.sendgrid.com/',
  },
  {
    id: 'twilio',
    name: 'Twilio',
    description: 'SMS teavitused ja 2FA',
    icon: MessageSquare,
    category: 'communication',
    apiKeyConfigured: false,
    status: 'inactive',
    fields: [
      { name: 'account_sid', label: 'Account SID', type: 'text', required: true, placeholder: 'AC...' },
      { name: 'auth_token', label: 'Auth Token', type: 'password', required: true, placeholder: '' },
      { name: 'phone_number', label: 'Twilio number', type: 'text', required: true, placeholder: '+372...' },
    ],
    docsUrl: 'https://www.twilio.com/docs',
  },
]

const categoryLabels: Record<string, string> = {
  ai: 'AI & Dokumendituvastus',
  communication: 'Kommunikatsioon',
  storage: 'Failihaldus',
  other: 'Muud',
}

export default function IntegrationsPage() {
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null)
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})
  const [formData, setFormData] = useState<Record<string, Record<string, string>>>({})
  const [isTesting, setIsTesting] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState<string | null>(null)

  // Group integrations by category
  const groupedIntegrations = integrations.reduce((acc, integration) => {
    if (!acc[integration.category]) acc[integration.category] = []
    acc[integration.category].push(integration)
    return acc
  }, {} as Record<string, ApiIntegration[]>)

  const toggleShowApiKey = (integrationId: string) => {
    setShowApiKeys(prev => ({
      ...prev,
      [integrationId]: !prev[integrationId],
    }))
  }

  const handleFieldChange = (integrationId: string, fieldName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [integrationId]: {
        ...(prev[integrationId] || {}),
        [fieldName]: value,
      },
    }))
  }

  const handleTestConnection = async (integrationId: string) => {
    setIsTesting(integrationId)
    // Simulate API test
    await new Promise(resolve => setTimeout(resolve, 2000))
    setIsTesting(null)
    // Show success message
    alert('Ühendus testitud edukalt!')
  }

  const handleSave = async (integrationId: string) => {
    setIsSaving(true)
    // Simulate save
    await new Promise(resolve => setTimeout(resolve, 1000))
    setIsSaving(false)
    setSavedSuccess(integrationId)
    setTimeout(() => setSavedSuccess(null), 3000)
  }

  const activeCount = integrations.filter(i => i.status === 'active').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Integratsioonid</h1>
          <p className="text-gray-500">API võtmete ja väliste teenuste seadistamine</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
            {activeCount} aktiivset
          </span>
        </div>
      </div>

      {/* Security notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
        <div>
          <h3 className="font-medium text-blue-900">Turvalisuse meeldetuletus</h3>
          <p className="text-sm text-blue-700 mt-1">
            API võtmed salvestatakse krüpteeritult. Ärge jagage võtmeid teistega.
            Kasutage alati tootmiskeskkonna võtmeid ainult tootmises.
          </p>
        </div>
      </div>

      {/* Integrations by category */}
      {Object.entries(groupedIntegrations).map(([category, categoryIntegrations]) => (
        <div key={category} className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">{categoryLabels[category]}</h2>

          <div className="grid gap-4">
            {categoryIntegrations.map(integration => {
              const Icon = integration.icon
              const isSelected = selectedIntegration === integration.id
              const isConfigured = integration.apiKeyConfigured

              return (
                <div
                  key={integration.id}
                  className={`bg-white rounded-lg border overflow-hidden ${
                    isSelected ? 'border-[#279989] ring-1 ring-[#279989]' : ''
                  }`}
                >
                  {/* Integration header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-gray-50"
                    onClick={() => setSelectedIntegration(isSelected ? null : integration.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          isConfigured ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          <Icon className={`w-5 h-5 ${isConfigured ? 'text-green-600' : 'text-gray-500'}`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{integration.name}</h3>
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              integration.status === 'active'
                                ? 'bg-green-100 text-green-700'
                                : integration.status === 'error'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {integration.status === 'active' ? 'Aktiivne' :
                               integration.status === 'error' ? 'Viga' : 'Seadistamata'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{integration.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {integration.lastTested && (
                          <span className="text-xs text-gray-400">
                            Testitud: {integration.lastTested}
                          </span>
                        )}
                        <Settings className={`w-5 h-5 text-gray-400 transition-transform ${
                          isSelected ? 'rotate-90' : ''
                        }`} />
                      </div>
                    </div>
                  </div>

                  {/* Configuration panel */}
                  {isSelected && (
                    <div className="p-4 border-t bg-gray-50 space-y-4">
                      {/* Fields */}
                      <div className="grid gap-4">
                        {integration.fields.map(field => (
                          <div key={field.name}>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              {field.label}
                              {field.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            {field.type === 'select' ? (
                              <select
                                value={formData[integration.id]?.[field.name] || ''}
                                onChange={(e) => handleFieldChange(integration.id, field.name, e.target.value)}
                                className="w-full px-3 py-2 border rounded-lg text-sm"
                              >
                                <option value="">Vali...</option>
                                {field.options?.map(opt => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : (
                              <div className="relative">
                                <input
                                  type={field.type === 'password' && !showApiKeys[`${integration.id}_${field.name}`] ? 'password' : 'text'}
                                  value={formData[integration.id]?.[field.name] || field.value || ''}
                                  onChange={(e) => handleFieldChange(integration.id, field.name, e.target.value)}
                                  placeholder={field.placeholder}
                                  className="w-full px-3 py-2 border rounded-lg text-sm pr-10"
                                />
                                {field.type === 'password' && (
                                  <button
                                    type="button"
                                    onClick={() => toggleShowApiKey(`${integration.id}_${field.name}`)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
                                  >
                                    {showApiKeys[`${integration.id}_${field.name}`] ? (
                                      <EyeOff className="w-4 h-4 text-gray-400" />
                                    ) : (
                                      <Eye className="w-4 h-4 text-gray-400" />
                                    )}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t">
                        <div className="flex items-center gap-2">
                          {integration.docsUrl && (
                            <a
                              href={integration.docsUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-[#279989] hover:underline flex items-center gap-1"
                            >
                              Dokumentatsioon
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleTestConnection(integration.id)}
                            disabled={isTesting === integration.id}
                            className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                          >
                            {isTesting === integration.id ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Testimine...
                              </>
                            ) : (
                              <>
                                <TestTube className="w-4 h-4" />
                                Testi ühendust
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleSave(integration.id)}
                            disabled={isSaving}
                            className="px-4 py-2 bg-[#279989] text-white rounded-lg text-sm hover:bg-[#1f7a6d] flex items-center gap-2 disabled:opacity-50"
                          >
                            {savedSuccess === integration.id ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                Salvestatud!
                              </>
                            ) : (
                              <>
                                <Save className="w-4 h-4" />
                                Salvesta
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* OCR Settings Section */}
      <div className="bg-white rounded-lg border p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <ScanLine className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800">OCR seaded</h2>
            <p className="text-sm text-gray-500">Dokumendituvastuse eelistused</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Eelistatud OCR teenus
            </label>
            <select className="w-full max-w-md px-3 py-2 border rounded-lg text-sm">
              <option value="openai">OpenAI GPT-4 Vision</option>
              <option value="anthropic">Anthropic Claude</option>
              <option value="google">Google Cloud Vision</option>
              <option value="azure">Azure Document Intelligence</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Valitud teenust kasutatakse kõikides dokumentide skaneerimise kohtades
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Automaatne andmete täitmine
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" defaultChecked />
                <span className="text-sm text-gray-700">Täida vormivälju automaatselt pärast skaneerimist</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" defaultChecked />
                <span className="text-sm text-gray-700">Küsi kinnitust enne andmete rakendamist</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded" />
                <span className="text-sm text-gray-700">Salvesta skaneeritud pildid automaatselt</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimaalne kindluse tase (%)
            </label>
            <input
              type="number"
              min="50"
              max="100"
              defaultValue="80"
              className="w-32 px-3 py-2 border rounded-lg text-sm"
            />
            <p className="text-xs text-gray-500 mt-1">
              Madalama kindlusega tulemused märgitakse kasutajale ülevaatamiseks
            </p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t flex justify-end">
          <button className="px-4 py-2 bg-[#279989] text-white rounded-lg text-sm hover:bg-[#1f7a6d] flex items-center gap-2">
            <Save className="w-4 h-4" />
            Salvesta OCR seaded
          </button>
        </div>
      </div>

      {/* Help section */}
      <div className="bg-gray-50 rounded-lg p-4 border">
        <h3 className="font-medium text-gray-900 mb-2">Kuidas seadistada?</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
          <li>Vali soovitud integratsioon ja kliki seadete avamiseks</li>
          <li>Sisesta vastava teenuse API võti (saad teenuse pakkuja lehelt)</li>
          <li>Testi ühendust, et veenduda võtme korrektsuses</li>
          <li>Salvesta seaded</li>
        </ol>
      </div>
    </div>
  )
}
