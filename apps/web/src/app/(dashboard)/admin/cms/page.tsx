'use client'

import { useState } from 'react'
import { DynamicFieldsManager } from '@/components/admin/cms/dynamic-fields-manager'
import { WorkflowBuilder } from '@/components/admin/cms/workflow-builder'
import { FormBuilder } from '@/components/admin/form-builder'
import { Settings, Database, Bell, FileText, Workflow, FormInput } from 'lucide-react'

const entities = [
  { id: 'projects', label: 'Projektid', icon: FileText },
  { id: 'invoices', label: 'Arved', icon: FileText },
  { id: 'employees', label: 'Töötajad', icon: FileText },
  { id: 'companies', label: 'Ettevõtted', icon: FileText },
]

const tabs = [
  { id: 'fields', label: 'Dünaamilised väljad', icon: Database },
  { id: 'workflows', label: 'Töövood', icon: Workflow },
  { id: 'forms', label: 'Vormid', icon: FormInput },
  { id: 'notifications', label: 'Teavitused', icon: Bell },
  { id: 'settings', label: 'Seaded', icon: Settings },
]

export default function CMSAdminPage() {
  const [selectedEntity, setSelectedEntity] = useState('projects')
  const [selectedTab, setSelectedTab] = useState('fields')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">CMS Haldus</h1>
        <p className="text-slate-600 text-sm mt-1">
          Halda dünaamilisi välju, töövooge ja teavitusi
        </p>
      </div>

      {/* Entity selector */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Vali moodul
        </label>
        <div className="flex gap-2 flex-wrap">
          {entities.map((entity) => (
            <button
              key={entity.id}
              onClick={() => setSelectedEntity(entity.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedEntity === entity.id
                  ? 'bg-primary text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
              style={selectedEntity === entity.id ? { backgroundColor: '#279989' } : {}}
            >
              <entity.icon className="h-4 w-4" />
              {entity.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                selectedTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
              style={selectedTab === tab.id ? { color: '#279989', borderColor: '#279989' } : {}}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab content */}
      <div>
        {selectedTab === 'fields' && (
          <DynamicFieldsManager entityType={selectedEntity} />
        )}

        {selectedTab === 'workflows' && (
          <WorkflowBuilder entityType={selectedEntity} />
        )}

        {selectedTab === 'forms' && (
          <FormBuilder />
        )}

        {selectedTab === 'notifications' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Bell className="h-12 w-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              Teavituste haldus
            </h3>
            <p className="text-slate-600">
              E-posti, SMS ja rakendusesisesed teavitused - tulemas peagi
            </p>
          </div>
        )}

        {selectedTab === 'settings' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
            <Settings className="h-12 w-12 mx-auto text-slate-400 mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">
              CMS seaded
            </h3>
            <p className="text-slate-600">
              Üldised seaded - tulemas peagi
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
