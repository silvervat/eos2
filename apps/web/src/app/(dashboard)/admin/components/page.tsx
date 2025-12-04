'use client'

/**
 * Admin - Komponendid
 *
 * Süsteemi komponentide ülevaade
 */

import React, { useState } from 'react'
import Link from 'next/link'

interface Component {
  id: string
  name: string
  module: string
  type: 'page' | 'component' | 'hook' | 'util' | 'api'
  path: string
  status: 'active' | 'beta' | 'deprecated'
  description?: string
}

// Tegelikud komponendid süsteemist
const components: Component[] = [
  // Warehouse mooduli komponendid
  {
    id: '1',
    name: 'AssetsPage',
    module: 'warehouse',
    type: 'page',
    path: '/warehouse/assets',
    status: 'active',
    description: 'Varade nimekiri ja haldus',
  },
  {
    id: '2',
    name: 'AssetDetailPage',
    module: 'warehouse',
    type: 'page',
    path: '/warehouse/assets/[id]',
    status: 'active',
    description: 'Vara detailvaade',
  },
  {
    id: '3',
    name: 'CategoriesPage',
    module: 'warehouse',
    type: 'page',
    path: '/warehouse/categories',
    status: 'active',
    description: 'Kategooriate haldus',
  },
  {
    id: '4',
    name: 'MaintenancePage',
    module: 'warehouse',
    type: 'page',
    path: '/warehouse/maintenance',
    status: 'active',
    description: 'Hoolduste haldus',
  },
  {
    id: '5',
    name: 'TransfersPage',
    module: 'warehouse',
    type: 'page',
    path: '/warehouse/transfers',
    status: 'active',
    description: 'Ülekannete haldus',
  },
  // Core komponendid
  {
    id: '6',
    name: 'DashboardPage',
    module: 'core',
    type: 'page',
    path: '/dashboard',
    status: 'active',
    description: 'Peamine töölaud',
  },
  {
    id: '7',
    name: 'SettingsPage',
    module: 'core',
    type: 'page',
    path: '/settings',
    status: 'active',
    description: 'Kasutaja seaded',
  },
  {
    id: '8',
    name: 'NotificationsPage',
    module: 'core',
    type: 'page',
    path: '/notifications',
    status: 'active',
    description: 'Teavituste keskus',
  },
  // Admin komponendid
  {
    id: '9',
    name: 'ModulesPage',
    module: 'admin',
    type: 'page',
    path: '/admin/modules',
    status: 'active',
    description: 'Moodulite haldus',
  },
  {
    id: '10',
    name: 'UsersPage',
    module: 'admin',
    type: 'page',
    path: '/admin/users',
    status: 'active',
    description: 'Kasutajate haldus',
  },
  {
    id: '11',
    name: 'PermissionsPage',
    module: 'admin',
    type: 'page',
    path: '/admin/permissions',
    status: 'active',
    description: 'Õiguste maatriks',
  },
  {
    id: '12',
    name: 'SystemPage',
    module: 'admin',
    type: 'page',
    path: '/admin/system',
    status: 'active',
    description: 'Süsteemi info',
  },
  // UI komponendid (@rivest/ui)
  {
    id: '13',
    name: 'Button',
    module: '@rivest/ui',
    type: 'component',
    path: 'packages/ui/src/button.tsx',
    status: 'active',
    description: 'Nupu komponent',
  },
  {
    id: '14',
    name: 'Card',
    module: '@rivest/ui',
    type: 'component',
    path: 'packages/ui/src/card.tsx',
    status: 'active',
    description: 'Kaardi komponent',
  },
  {
    id: '15',
    name: 'Input',
    module: '@rivest/ui',
    type: 'component',
    path: 'packages/ui/src/input.tsx',
    status: 'active',
    description: 'Sisestusvälja komponent',
  },
  {
    id: '16',
    name: 'Table',
    module: '@rivest/ui',
    type: 'component',
    path: 'packages/ui/src/table.tsx',
    status: 'active',
    description: 'Tabeli komponent',
  },
]

const typeConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  page: { label: 'Leht', color: 'text-blue-700', bg: 'bg-blue-100', icon: '📄' },
  component: { label: 'Komponent', color: 'text-green-700', bg: 'bg-green-100', icon: '🧩' },
  hook: { label: 'Hook', color: 'text-purple-700', bg: 'bg-purple-100', icon: '🪝' },
  util: { label: 'Util', color: 'text-yellow-700', bg: 'bg-yellow-100', icon: '🔧' },
  api: { label: 'API', color: 'text-orange-700', bg: 'bg-orange-100', icon: '🔌' },
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Aktiivne', color: 'text-green-700', bg: 'bg-green-100' },
  beta: { label: 'Beeta', color: 'text-blue-700', bg: 'bg-blue-100' },
  deprecated: { label: 'Aegunud', color: 'text-red-700', bg: 'bg-red-100' },
}

export default function ComponentsPage() {
  const [filter, setFilter] = useState<string>('all')
  const [moduleFilter, setModuleFilter] = useState<string>('all')

  const modules = [...new Set(components.map(c => c.module))]

  const filteredComponents = components.filter(c => {
    const matchesType = filter === 'all' || c.type === filter
    const matchesModule = moduleFilter === 'all' || c.module === moduleFilter
    return matchesType && matchesModule
  })

  const stats = {
    total: components.length,
    pages: components.filter(c => c.type === 'page').length,
    components: components.filter(c => c.type === 'component').length,
    active: components.filter(c => c.status === 'active').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Komponendid</h1>
          <p className="text-gray-500">Süsteemi komponentide ülevaade</p>
        </div>
      </div>

      {/* Statistika */}
      <div className="grid grid-cols-4 gap-4">
        <button
          onClick={() => { setFilter('all'); setModuleFilter('all'); }}
          className={`p-4 rounded-lg border text-center transition-colors ${
            filter === 'all' && moduleFilter === 'all' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
          }`}
        >
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-sm text-gray-500">Kokku</p>
        </button>
        <button
          onClick={() => setFilter('page')}
          className={`p-4 rounded-lg border text-center transition-colors ${
            filter === 'page' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
          }`}
        >
          <p className="text-2xl font-bold text-blue-600">{stats.pages}</p>
          <p className="text-sm text-gray-500">Lehti</p>
        </button>
        <button
          onClick={() => setFilter('component')}
          className={`p-4 rounded-lg border text-center transition-colors ${
            filter === 'component' ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50'
          }`}
        >
          <p className="text-2xl font-bold text-green-600">{stats.components}</p>
          <p className="text-sm text-gray-500">UI komponendid</p>
        </button>
        <div className="p-4 rounded-lg border text-center bg-green-50 border-green-200">
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          <p className="text-sm text-green-700">Aktiivsed</p>
        </div>
      </div>

      {/* Mooduli filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setModuleFilter('all')}
          className={`px-3 py-1 rounded-lg text-sm transition-colors ${
            moduleFilter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 hover:bg-gray-200'
          }`}
        >
          Kõik moodulid
        </button>
        {modules.map((module) => (
          <button
            key={module}
            onClick={() => setModuleFilter(module)}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              moduleFilter === module ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            {module}
          </button>
        ))}
      </div>

      {/* Komponendid */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Komponent</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Moodul</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Tüüp</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Staatus</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Path</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredComponents.map((component) => (
              <tr key={component.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{component.name}</p>
                    {component.description && (
                      <p className="text-sm text-gray-500">{component.description}</p>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                    {component.module}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${typeConfig[component.type].bg} ${typeConfig[component.type].color}`}>
                    {typeConfig[component.type].icon} {typeConfig[component.type].label}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusConfig[component.status].bg} ${statusConfig[component.status].color}`}>
                    {statusConfig[component.status].label}
                  </span>
                </td>
                <td className="px-6 py-4">
                  {component.type === 'page' && component.path.startsWith('/') ? (
                    <Link
                      href={component.path.replace('[id]', '1')}
                      className="text-sm text-blue-600 hover:underline font-mono"
                    >
                      {component.path}
                    </Link>
                  ) : (
                    <code className="text-sm text-gray-500">{component.path}</code>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <p className="text-blue-800">
          <strong>💡 Vihje:</strong> Komponendid on jagatud moodulite kaupa.
          UI komponendid asuvad <code className="bg-blue-100 px-1 rounded">packages/ui/</code> kaustas,
          lehekülged <code className="bg-blue-100 px-1 rounded">apps/web/src/app/</code> kaustas.
        </p>
      </div>
    </div>
  )
}
