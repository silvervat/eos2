'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Plus,
  Search,
  MoreVertical,
  CheckCircle2,
  Clock,
  AlertCircle,
  Wind,
  Thermometer,
  Droplets,
  Zap,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'

interface System {
  id: string
  code: string
  name: string
  type: 'ventilation' | 'heating' | 'cooling' | 'plumbing' | 'electrical'
  zone: string
  status: 'not_started' | 'in_progress' | 'testing' | 'completed'
  progress: number
  components: number
  completedComponents: number
}

const mockSystems: System[] = [
  { id: '1', code: 'VEN-01', name: 'Põhiventilatsiooni süsteem', type: 'ventilation', zone: '1. korrus', status: 'completed', progress: 100, components: 24, completedComponents: 24 },
  { id: '2', code: 'VEN-02', name: 'Köögi väljatõmme', type: 'ventilation', zone: '1. korrus', status: 'completed', progress: 100, components: 8, completedComponents: 8 },
  { id: '3', code: 'VEN-03', name: 'Kontoriala ventilatsioon', type: 'ventilation', zone: '2. korrus', status: 'in_progress', progress: 65, components: 18, completedComponents: 12 },
  { id: '4', code: 'KYT-01', name: 'Põrandaküte A-tsoon', type: 'heating', zone: '1. korrus', status: 'completed', progress: 100, components: 12, completedComponents: 12 },
  { id: '5', code: 'KYT-02', name: 'Põrandaküte B-tsoon', type: 'heating', zone: '2. korrus', status: 'in_progress', progress: 40, components: 16, completedComponents: 6 },
  { id: '6', code: 'JAH-01', name: 'Jahutussüsteem', type: 'cooling', zone: 'Kogu hoone', status: 'testing', progress: 90, components: 32, completedComponents: 29 },
  { id: '7', code: 'TOR-01', name: 'Vee sissetulek', type: 'plumbing', zone: 'Tehniline ruum', status: 'completed', progress: 100, components: 6, completedComponents: 6 },
  { id: '8', code: 'ELE-01', name: 'Automaatika kilp', type: 'electrical', zone: 'Tehniline ruum', status: 'not_started', progress: 0, components: 14, completedComponents: 0 },
]

const typeConfig: Record<string, { label: string; icon: React.ElementType; color: string; bg: string }> = {
  ventilation: { label: 'Ventilatsioon', icon: Wind, color: 'text-blue-600', bg: 'bg-blue-100' },
  heating: { label: 'Küte', icon: Thermometer, color: 'text-orange-600', bg: 'bg-orange-100' },
  cooling: { label: 'Jahutus', icon: Droplets, color: 'text-cyan-600', bg: 'bg-cyan-100' },
  plumbing: { label: 'Torustik', icon: Droplets, color: 'text-indigo-600', bg: 'bg-indigo-100' },
  electrical: { label: 'Elekter', icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-100' },
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  not_started: { label: 'Alustamata', color: 'text-gray-600', bg: 'bg-gray-100', icon: Clock },
  in_progress: { label: 'Töös', color: 'text-blue-600', bg: 'bg-blue-100', icon: Clock },
  testing: { label: 'Testimisel', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: AlertCircle },
  completed: { label: 'Valmis', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2 },
}

export default function SystemsPage() {
  const params = useParams()
  const projectId = params.id as string

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedSystems, setExpandedSystems] = useState<Set<string>>(new Set())

  const filteredSystems = mockSystems.filter(system => {
    const matchesSearch = search === '' ||
      system.name.toLowerCase().includes(search.toLowerCase()) ||
      system.code.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' || system.type === typeFilter
    const matchesStatus = statusFilter === 'all' || system.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedSystems)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedSystems(newExpanded)
  }

  // Stats
  const totalSystems = mockSystems.length
  const completedSystems = mockSystems.filter(s => s.status === 'completed').length
  const inProgressSystems = mockSystems.filter(s => s.status === 'in_progress').length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="text-sm text-gray-500">Kokku süsteeme</p>
          <p className="text-2xl font-bold text-gray-900">{totalSystems}</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4">
          <p className="text-sm text-green-600">Valmis</p>
          <p className="text-2xl font-bold text-green-700">{completedSystems}</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm text-blue-600">Töös</p>
          <p className="text-2xl font-bold text-blue-700">{inProgressSystems}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Otsi süsteemi..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="all">Kõik tüübid</option>
          <option value="ventilation">Ventilatsioon</option>
          <option value="heating">Küte</option>
          <option value="cooling">Jahutus</option>
          <option value="plumbing">Torustik</option>
          <option value="electrical">Elekter</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="all">Kõik staatused</option>
          <option value="not_started">Alustamata</option>
          <option value="in_progress">Töös</option>
          <option value="testing">Testimisel</option>
          <option value="completed">Valmis</option>
        </select>
        <button className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Lisa süsteem
        </button>
      </div>

      {/* Systems List */}
      <div className="space-y-3">
        {filteredSystems.map((system) => {
          const typeInfo = typeConfig[system.type]
          const statusInfo = statusConfig[system.status]
          const TypeIcon = typeInfo.icon
          const StatusIcon = statusInfo.icon
          const isExpanded = expandedSystems.has(system.id)

          return (
            <div key={system.id} className="bg-white border rounded-lg overflow-hidden">
              <div
                className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => toggleExpand(system.id)}
              >
                <button className="p-1">
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  )}
                </button>

                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeInfo.bg}`}>
                  <TypeIcon className={`w-5 h-5 ${typeInfo.color}`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{system.name}</p>
                    <span className="text-xs text-gray-500">{system.code}</span>
                  </div>
                  <p className="text-sm text-gray-500">{system.zone} • {typeInfo.label}</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm text-gray-500">Komponendid</p>
                    <p className="text-sm font-medium">{system.completedComponents}/{system.components}</p>
                  </div>

                  <div className="w-24">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">{system.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-[#279989] rounded-full"
                        style={{ width: `${system.progress}%` }}
                      />
                    </div>
                  </div>

                  <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${statusInfo.bg} ${statusInfo.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusInfo.label}
                  </span>

                  <button
                    className="p-1 hover:bg-gray-100 rounded"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t bg-gray-50 p-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Asukoht</p>
                      <p className="font-medium">{system.zone}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Tüüp</p>
                      <p className="font-medium">{typeInfo.label}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Progress</p>
                      <p className="font-medium">{system.completedComponents} / {system.components} komponenti</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Staatus</p>
                      <p className="font-medium">{statusInfo.label}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                    <button className="px-3 py-1.5 text-sm bg-white border rounded-lg hover:bg-gray-50">
                      Vaata komponente
                    </button>
                    <button className="px-3 py-1.5 text-sm bg-white border rounded-lg hover:bg-gray-50">
                      Muuda
                    </button>
                    <button className="px-3 py-1.5 text-sm bg-white border rounded-lg hover:bg-gray-50">
                      Ava Trimble
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filteredSystems.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <p>Süsteeme ei leitud</p>
          </div>
        )}
      </div>
    </div>
  )
}
