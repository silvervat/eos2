'use client'

/**
 * Admin - Moodulite haldus
 *
 * Kõigi süsteemi moodulite ülevaade ja haldus
 */

import React, { useState } from 'react'

interface Module {
  id: string
  name: string
  label: string
  icon: string
  description: string
  status: 'active' | 'beta' | 'development' | 'todo' | 'disabled'
  components: number
  bugs: number
  todos: number
  version: string
}

// Mock andmed - hiljem asenda Supabase päringuga
const mockModules: Module[] = [
  {
    id: '1',
    name: 'warehouse',
    label: 'Laohaldus',
    icon: '🏭',
    description: 'Varade, laoseisu ja ülekannete haldus',
    status: 'active',
    components: 8,
    bugs: 0,
    todos: 2,
    version: '1.0.0',
  },
  {
    id: '2',
    name: 'projects',
    label: 'Projektid',
    icon: '📁',
    description: 'Projektide haldus ja jälgimine',
    status: 'todo',
    components: 0,
    bugs: 0,
    todos: 5,
    version: '0.0.0',
  },
  {
    id: '3',
    name: 'invoices',
    label: 'Arved',
    icon: '📄',
    description: 'Arvete koostamine ja haldus',
    status: 'todo',
    components: 0,
    bugs: 0,
    todos: 4,
    version: '0.0.0',
  },
  {
    id: '4',
    name: 'vehicles',
    label: 'Sõidukid',
    icon: '🚗',
    description: 'Sõidukipargi haldus',
    status: 'todo',
    components: 0,
    bugs: 0,
    todos: 3,
    version: '0.0.0',
  },
  {
    id: '5',
    name: 'clients',
    label: 'Kliendid',
    icon: '👥',
    description: 'Klientide ja kontaktide haldus',
    status: 'todo',
    components: 0,
    bugs: 0,
    todos: 3,
    version: '0.0.0',
  },
]

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Aktiivne', color: 'text-green-700', bg: 'bg-green-100' },
  beta: { label: 'Beeta', color: 'text-blue-700', bg: 'bg-blue-100' },
  development: { label: 'Arenduses', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  todo: { label: 'Planeeritud', color: 'text-gray-700', bg: 'bg-gray-100' },
  disabled: { label: 'Keelatud', color: 'text-red-700', bg: 'bg-red-100' },
}

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.todo
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
      {config.label}
    </span>
  )
}

export default function ModulesPage() {
  const [modules] = useState<Module[]>(mockModules)
  const [filter, setFilter] = useState<string>('all')

  const filteredModules = filter === 'all'
    ? modules
    : modules.filter(m => m.status === filter)

  const stats = {
    total: modules.length,
    active: modules.filter(m => m.status === 'active').length,
    beta: modules.filter(m => m.status === 'beta').length,
    development: modules.filter(m => m.status === 'development').length,
    todo: modules.filter(m => m.status === 'todo').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Moodulite haldus</h1>
          <p className="text-gray-500">Süsteemi moodulite ülevaade ja seaded</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          + Lisa moodul
        </button>
      </div>

      {/* Statistika */}
      <div className="grid grid-cols-5 gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`p-4 rounded-lg border text-center transition-colors ${
            filter === 'all' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
          }`}
        >
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-sm text-gray-500">Kokku</p>
        </button>
        <button
          onClick={() => setFilter('active')}
          className={`p-4 rounded-lg border text-center transition-colors ${
            filter === 'active' ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50'
          }`}
        >
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          <p className="text-sm text-gray-500">Aktiivsed</p>
        </button>
        <button
          onClick={() => setFilter('beta')}
          className={`p-4 rounded-lg border text-center transition-colors ${
            filter === 'beta' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
          }`}
        >
          <p className="text-2xl font-bold text-blue-600">{stats.beta}</p>
          <p className="text-sm text-gray-500">Beeta</p>
        </button>
        <button
          onClick={() => setFilter('development')}
          className={`p-4 rounded-lg border text-center transition-colors ${
            filter === 'development' ? 'border-yellow-500 bg-yellow-50' : 'hover:bg-gray-50'
          }`}
        >
          <p className="text-2xl font-bold text-yellow-600">{stats.development}</p>
          <p className="text-sm text-gray-500">Arenduses</p>
        </button>
        <button
          onClick={() => setFilter('todo')}
          className={`p-4 rounded-lg border text-center transition-colors ${
            filter === 'todo' ? 'border-gray-500 bg-gray-100' : 'hover:bg-gray-50'
          }`}
        >
          <p className="text-2xl font-bold text-gray-600">{stats.todo}</p>
          <p className="text-sm text-gray-500">Planeeritud</p>
        </button>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Moodul</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Staatus</th>
              <th className="text-center px-6 py-3 text-sm font-medium text-gray-500">Komponendid</th>
              <th className="text-center px-6 py-3 text-sm font-medium text-gray-500">Bugid</th>
              <th className="text-center px-6 py-3 text-sm font-medium text-gray-500">TODO</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Versioon</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Toimingud</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredModules.map((module) => (
              <tr key={module.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{module.icon}</span>
                    <div>
                      <p className="font-medium text-gray-900">{module.label}</p>
                      <p className="text-sm text-gray-500">{module.name}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={module.status} />
                </td>
                <td className="px-6 py-4 text-center">
                  <span className={module.components > 0 ? 'text-green-600 font-medium' : 'text-gray-400'}>
                    {module.components}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  {module.bugs > 0 ? (
                    <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                      {module.bugs}
                    </span>
                  ) : (
                    <span className="text-gray-400">0</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {module.todos > 0 ? (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {module.todos}
                    </span>
                  ) : (
                    <span className="text-gray-400">0</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <code className="text-sm text-gray-600">{module.version}</code>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600 transition-colors">
                      👁️
                    </button>
                    <button className="p-2 text-gray-400 hover:text-green-600 transition-colors">
                      ✏️
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Info */}
      <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
        <p className="text-yellow-800">
          <strong>💡 Vihje:</strong> Uue mooduli lisamiseks kasuta käsku{' '}
          <code className="bg-yellow-100 px-2 py-1 rounded">pnpm new-module</code>{' '}
          või kopeeri <code className="bg-yellow-100 px-2 py-1 rounded">modules/_template/</code> kaust.
        </p>
      </div>
    </div>
  )
}
