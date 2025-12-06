'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  ExternalLink,
  RefreshCw,
  Box,
  Layers,
  Eye,
  EyeOff,
  Download,
  Upload,
  Settings,
  MessageSquare,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
  FileText,
  Folder,
} from 'lucide-react'

interface TrimbleModel {
  id: string
  name: string
  version: string
  lastModified: string
  modifiedBy: string
  size: string
  status: 'current' | 'outdated' | 'review'
  discipline: string
  visible: boolean
}

interface TrimbleIssue {
  id: string
  title: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'critical'
  assignee: string
  createdAt: string
  viewpoint?: string
}

const mockModels: TrimbleModel[] = [
  {
    id: '1',
    name: 'HVAC_Ventilation_Main',
    version: 'v12',
    lastModified: '2024-03-14T14:30:00',
    modifiedBy: 'Jaan Tamm',
    size: '45.2 MB',
    status: 'current',
    discipline: 'Ventilatsioon',
    visible: true,
  },
  {
    id: '2',
    name: 'HVAC_Heating',
    version: 'v8',
    lastModified: '2024-03-12T09:15:00',
    modifiedBy: 'Peeter Mets',
    size: '28.7 MB',
    status: 'current',
    discipline: 'Küte',
    visible: true,
  },
  {
    id: '3',
    name: 'HVAC_Cooling',
    version: 'v5',
    lastModified: '2024-03-10T16:45:00',
    modifiedBy: 'Andres Kask',
    size: '32.1 MB',
    status: 'review',
    discipline: 'Jahutus',
    visible: true,
  },
  {
    id: '4',
    name: 'Architecture_Base',
    version: 'v22',
    lastModified: '2024-03-08T11:00:00',
    modifiedBy: 'Arhitektibüroo',
    size: '156.3 MB',
    status: 'current',
    discipline: 'Arhitektuur',
    visible: false,
  },
  {
    id: '5',
    name: 'Structure_Main',
    version: 'v18',
    lastModified: '2024-03-05T10:30:00',
    modifiedBy: 'Konstruktor OÜ',
    size: '89.4 MB',
    status: 'outdated',
    discipline: 'Konstruktsioon',
    visible: false,
  },
]

const mockIssues: TrimbleIssue[] = [
  {
    id: '1',
    title: 'Kanalite kokkupõrge trepikoja piirkonnas',
    status: 'open',
    priority: 'high',
    assignee: 'Jaan Tamm',
    createdAt: '2024-03-14',
  },
  {
    id: '2',
    title: 'Puuduv läbiviik seinas S-05',
    status: 'in_progress',
    priority: 'medium',
    assignee: 'Peeter Mets',
    createdAt: '2024-03-12',
  },
  {
    id: '3',
    title: 'Jahutusseadme asukoha konflikt',
    status: 'resolved',
    priority: 'high',
    assignee: 'Andres Kask',
    createdAt: '2024-03-10',
  },
]

const statusConfig = {
  model: {
    current: { label: 'Aktuaalne', color: 'text-green-600', bg: 'bg-green-100' },
    outdated: { label: 'Aegunud', color: 'text-red-600', bg: 'bg-red-100' },
    review: { label: 'Ülevaatamisel', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  },
  issue: {
    open: { label: 'Avatud', color: 'text-blue-600', bg: 'bg-blue-100' },
    in_progress: { label: 'Töös', color: 'text-yellow-600', bg: 'bg-yellow-100' },
    resolved: { label: 'Lahendatud', color: 'text-green-600', bg: 'bg-green-100' },
    closed: { label: 'Suletud', color: 'text-gray-600', bg: 'bg-gray-100' },
  },
}

const priorityConfig = {
  low: { label: 'Madal', color: 'text-gray-600' },
  medium: { label: 'Keskmine', color: 'text-blue-600' },
  high: { label: 'Kõrge', color: 'text-orange-600' },
  critical: { label: 'Kriitiline', color: 'text-red-600' },
}

export default function TrimbleConnectPage() {
  const params = useParams()
  const projectId = params.id as string

  const [models, setModels] = useState<TrimbleModel[]>(mockModels)
  const [issues] = useState<TrimbleIssue[]>(mockIssues)
  const [activeTab, setActiveTab] = useState<'models' | 'issues'>('models')
  const [isConnected, setIsConnected] = useState(true)

  const formatDateTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleDateString('et-EE', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const toggleModelVisibility = (modelId: string) => {
    setModels(models.map(m =>
      m.id === modelId ? { ...m, visible: !m.visible } : m
    ))
  }

  // Stats
  const visibleModels = models.filter(m => m.visible).length
  const openIssues = issues.filter(i => i.status === 'open' || i.status === 'in_progress').length

  return (
    <div className="space-y-6">
      {/* Header with Trimble Connect Link */}
      <div className="bg-gradient-to-r from-[#00263A] to-[#00456B] rounded-xl p-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/10 rounded-xl flex items-center justify-center">
              <Box className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Trimble Connect</h2>
              <p className="text-white/70 text-sm">Ülemiste keskuse laiendus - BIM mudel</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {isConnected ? (
              <span className="flex items-center gap-2 px-3 py-1.5 bg-green-500/20 text-green-300 rounded-lg text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Ühendatud
              </span>
            ) : (
              <span className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-300 rounded-lg text-sm">
                <AlertCircle className="w-4 h-4" />
                Ühendus puudub
              </span>
            )}
            <button className="px-4 py-2 bg-white text-[#00263A] rounded-lg font-medium flex items-center gap-2 hover:bg-white/90">
              <ExternalLink className="w-4 h-4" />
              Ava Trimble Connect
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Mudeleid kokku</p>
          <p className="text-2xl font-bold text-gray-900">{models.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Nähtavad mudelid</p>
          <p className="text-2xl font-bold text-gray-900">{visibleModels}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-600">Avatud probleemid</p>
          <p className="text-2xl font-bold text-orange-700">{openIssues}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600">Viimane sünkr.</p>
          <p className="text-lg font-bold text-blue-700">14. märts 15:45</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b">
        <button
          onClick={() => setActiveTab('models')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'models'
              ? 'border-[#279989] text-[#279989]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          Mudelid ({models.length})
        </button>
        <button
          onClick={() => setActiveTab('issues')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'issues'
              ? 'border-[#279989] text-[#279989]'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Probleemid ({issues.length})
        </button>
      </div>

      {/* Models Tab */}
      {activeTab === 'models' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <RefreshCw className="w-4 h-4" />
                Sünkrooni
              </button>
              <button className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Laadi üles
              </button>
            </div>
            <button className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-50 flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Seaded
            </button>
          </div>

          <div className="bg-white border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="w-10 px-4 py-3"></th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Mudel</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Distsipliin</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Versioon</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Muudetud</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Staatus</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {models.map((model) => {
                  const statusInfo = statusConfig.model[model.status]

                  return (
                    <tr key={model.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <button
                          onClick={() => toggleModelVisibility(model.id)}
                          className={`p-1.5 rounded ${model.visible ? 'bg-[#279989]/10 text-[#279989]' : 'bg-gray-100 text-gray-400'}`}
                        >
                          {model.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Box className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{model.name}</p>
                            <p className="text-xs text-gray-500">{model.size}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{model.discipline}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">{model.version}</span>
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <p className="text-gray-900">{formatDateTime(model.lastModified)}</p>
                        <p className="text-xs text-gray-500">{model.modifiedBy}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button className="p-1.5 hover:bg-gray-100 rounded">
                          <Download className="w-4 h-4 text-gray-400" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Issues Tab */}
      {activeTab === 'issues' && (
        <div className="space-y-4">
          {issues.map((issue) => {
            const statusInfo = statusConfig.issue[issue.status]
            const priorityInfo = priorityConfig[issue.priority]

            return (
              <div key={issue.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${statusInfo.bg}`}>
                      <AlertCircle className={`w-5 h-5 ${statusInfo.color}`} />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{issue.title}</h4>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className={priorityInfo.color}>{priorityInfo.label}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {issue.assignee}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {issue.createdAt}
                        </span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>
              </div>
            )
          })}

          {issues.length === 0 && (
            <div className="text-center py-12 bg-white border rounded-lg text-gray-500">
              <CheckCircle2 className="w-12 h-12 text-green-300 mx-auto mb-3" />
              <p>Avatud probleeme ei ole</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
