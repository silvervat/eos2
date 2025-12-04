'use client'

/**
 * Personnel - Kasutajagrupid
 *
 * Kasutajagruppide haldus ja õiguste määramine
 */

import React, { useState } from 'react'
import { Plus, Users, Shield, Edit, Trash2, ChevronDown, ChevronRight, Check } from 'lucide-react'

interface UserGroup {
  id: string
  name: string
  description: string
  members: number
  color: string
  permissions: {
    module: string
    access: 'none' | 'view' | 'edit' | 'full'
  }[]
}

const modules = [
  { id: 'dashboard', name: 'Töölaud', icon: '📊' },
  { id: 'projects', name: 'Projektid', icon: '📁' },
  { id: 'projects_ptv', name: '- PTV', icon: '⚡' },
  { id: 'projects_montaaz', name: '- Montaaž', icon: '🔨' },
  { id: 'projects_muuk', name: '- Müük', icon: '🛒' },
  { id: 'projects_vahendus', name: '- Vahendus', icon: '🤝' },
  { id: 'projects_rent', name: '- Rent', icon: '🏠' },
  { id: 'personnel', name: 'Personaal', icon: '👥' },
  { id: 'invoices', name: 'Arved', icon: '📄' },
  { id: 'documents', name: 'Dokumendid', icon: '📝' },
  { id: 'file_vault', name: 'Failihaldus', icon: '📂' },
  { id: 'warehouse', name: 'Laohaldus', icon: '🏭' },
  { id: 'reports', name: 'Aruanded', icon: '📈' },
  { id: 'admin', name: 'Admin', icon: '⚙️' },
]

const mockGroups: UserGroup[] = [
  {
    id: '1',
    name: 'Administraatorid',
    description: 'Täielik ligipääs kõigile süsteemi osadele',
    members: 3,
    color: 'red',
    permissions: modules.map(m => ({ module: m.id, access: 'full' as const })),
  },
  {
    id: '2',
    name: 'Projektijuhid',
    description: 'Projektide, arvete ja dokumentide haldus',
    members: 5,
    color: 'blue',
    permissions: [
      { module: 'dashboard', access: 'view' },
      { module: 'projects', access: 'full' },
      { module: 'projects_ptv', access: 'full' },
      { module: 'projects_montaaz', access: 'full' },
      { module: 'projects_muuk', access: 'full' },
      { module: 'projects_vahendus', access: 'full' },
      { module: 'projects_rent', access: 'full' },
      { module: 'personnel', access: 'view' },
      { module: 'invoices', access: 'full' },
      { module: 'documents', access: 'full' },
      { module: 'file_vault', access: 'edit' },
      { module: 'warehouse', access: 'view' },
      { module: 'reports', access: 'view' },
      { module: 'admin', access: 'none' },
    ],
  },
  {
    id: '3',
    name: 'Monteerijad',
    description: 'Montaaži projektid ja laohaldus',
    members: 8,
    color: 'green',
    permissions: [
      { module: 'dashboard', access: 'view' },
      { module: 'projects', access: 'view' },
      { module: 'projects_ptv', access: 'edit' },
      { module: 'projects_montaaz', access: 'edit' },
      { module: 'projects_muuk', access: 'none' },
      { module: 'projects_vahendus', access: 'none' },
      { module: 'projects_rent', access: 'none' },
      { module: 'personnel', access: 'none' },
      { module: 'invoices', access: 'none' },
      { module: 'documents', access: 'view' },
      { module: 'file_vault', access: 'view' },
      { module: 'warehouse', access: 'edit' },
      { module: 'reports', access: 'none' },
      { module: 'admin', access: 'none' },
    ],
  },
  {
    id: '4',
    name: 'Müügimeeskond',
    description: 'Müügi projektid, kliendid ja arved',
    members: 4,
    color: 'purple',
    permissions: [
      { module: 'dashboard', access: 'view' },
      { module: 'projects', access: 'view' },
      { module: 'projects_ptv', access: 'none' },
      { module: 'projects_montaaz', access: 'none' },
      { module: 'projects_muuk', access: 'full' },
      { module: 'projects_vahendus', access: 'full' },
      { module: 'projects_rent', access: 'full' },
      { module: 'personnel', access: 'none' },
      { module: 'invoices', access: 'edit' },
      { module: 'documents', access: 'edit' },
      { module: 'file_vault', access: 'edit' },
      { module: 'warehouse', access: 'view' },
      { module: 'reports', access: 'view' },
      { module: 'admin', access: 'none' },
    ],
  },
  {
    id: '5',
    name: 'Vaatajad',
    description: 'Ainult vaatamisõigus',
    members: 4,
    color: 'gray',
    permissions: modules.map(m => ({ module: m.id, access: m.id === 'admin' ? 'none' as const : 'view' as const })),
  },
]

const accessColors: Record<string, { bg: string; text: string; label: string }> = {
  none: { bg: 'bg-gray-100', text: 'text-gray-400', label: '-' },
  view: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Vaata' },
  edit: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Muuda' },
  full: { bg: 'bg-green-100', text: 'text-green-700', label: 'Täis' },
}

const groupColors: Record<string, string> = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  purple: 'bg-purple-500',
  gray: 'bg-gray-500',
  orange: 'bg-orange-500',
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<UserGroup[]>(mockGroups)
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Kasutajagrupid</h1>
          <p className="text-gray-500 text-sm">Halda gruppe ja määra moodulite õigusi</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Lisa grupp
        </button>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-lg border p-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Õiguste tasemed:</p>
        <div className="flex gap-4">
          {Object.entries(accessColors).map(([key, config]) => (
            <div key={key} className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs ${config.bg} ${config.text}`}>
                {config.label}
              </span>
              <span className="text-xs text-gray-500">
                {key === 'none' && 'Pole ligipääsu'}
                {key === 'view' && 'Ainult vaatamine'}
                {key === 'edit' && 'Muutmine lubatud'}
                {key === 'full' && 'Täielik ligipääs'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Groups */}
      <div className="space-y-3">
        {groups.map((group) => (
          <div key={group.id} className="bg-white rounded-lg border overflow-hidden">
            {/* Group header */}
            <div
              className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
              onClick={() => setExpandedGroup(expandedGroup === group.id ? null : group.id)}
            >
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${groupColors[group.color]}`} />
                <div>
                  <h3 className="font-medium text-gray-900">{group.name}</h3>
                  <p className="text-sm text-gray-500">{group.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                  <Users className="w-4 h-4 inline mr-1" />
                  {group.members} liiget
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Edit className="w-4 h-4 text-gray-400" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); }}
                    className="p-1 hover:bg-gray-100 rounded"
                  >
                    <Trash2 className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
                {expandedGroup === group.id ? (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>

            {/* Permissions matrix */}
            {expandedGroup === group.id && (
              <div className="border-t bg-gray-50 p-4">
                <p className="text-sm font-medium text-gray-700 mb-3">
                  <Shield className="w-4 h-4 inline mr-1" />
                  Moodulite õigused
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {modules.map((module) => {
                    const perm = group.permissions.find(p => p.module === module.id)
                    const access = perm?.access || 'none'
                    const config = accessColors[access]
                    return (
                      <div
                        key={module.id}
                        className={`p-2 rounded flex items-center justify-between ${config.bg}`}
                      >
                        <span className={`text-sm ${module.id.startsWith('projects_') ? 'pl-2' : ''}`}>
                          {module.icon} {module.name}
                        </span>
                        <span className={`text-xs font-medium ${config.text}`}>
                          {config.label}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl">
            <h2 className="text-xl font-bold mb-4">Lisa uus grupp</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grupi nimi</label>
                <input
                  type="text"
                  placeholder="nt. Raamatupidajad"
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Kirjeldus</label>
                <input
                  type="text"
                  placeholder="Lühike kirjeldus grupi rollist"
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Värv</label>
                <div className="flex gap-2">
                  {Object.keys(groupColors).map(color => (
                    <button
                      key={color}
                      className={`w-8 h-8 rounded-full ${groupColors[color]} hover:ring-2 ring-offset-2`}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Tühista
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d]"
              >
                Lisa grupp
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
