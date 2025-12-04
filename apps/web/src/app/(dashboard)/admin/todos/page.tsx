'use client'

/**
 * Admin - TODO ja Changelog
 *
 * Arendusülesannete ja versioonide haldus
 */

import React, { useState } from 'react'

interface Todo {
  id: string
  title: string
  description?: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'todo' | 'in_progress' | 'done'
  module?: string
  commit?: string
  completedAt?: string
}

interface BuildVersion {
  version: string
  date: string
  commit: string
  changes: string[]
}

// Tegelikud TODO-d projektist
const projectTodos: Todo[] = [
  {
    id: 'TODO-001',
    title: 'Supabase RLS poliitikad',
    description: 'Lisa Row Level Security poliitikad assets, categories, transfers tabelitele',
    priority: 'critical',
    status: 'todo',
    module: 'database',
  },
  {
    id: 'TODO-002',
    title: 'API validatsioon Zod-iga',
    description: 'Lisa Zod skeemid kõigile API endpointidele request/response validatsiooniks',
    priority: 'high',
    status: 'todo',
    module: 'api',
  },
  {
    id: 'TODO-003',
    title: 'E-maili teavitused',
    description: 'Seadista Resend teenus ja loo teavituste mallid (kutse, parool, alerts)',
    priority: 'medium',
    status: 'todo',
    module: 'notifications',
  },
  {
    id: 'TODO-004',
    title: 'Dark mode tugi',
    description: 'Lisa dark mode toggle ja CSS custom properties teemade jaoks',
    priority: 'low',
    status: 'todo',
    module: 'design',
  },
  {
    id: 'TODO-005',
    title: 'Vehicles moodul - API',
    description: 'Loo vehicles API endpoints ja Supabase tabelid',
    priority: 'high',
    status: 'todo',
    module: 'vehicles',
  },
  // Tehtud ülesanded
  {
    id: 'DONE-001',
    title: 'Admin lehtede loomine',
    description: 'Loodud /admin/users, /admin/system, /admin/logs, /admin/todos, /admin/components lehed',
    priority: 'high',
    status: 'done',
    module: 'admin',
    commit: '948dddd',
    completedAt: '2024-12-04',
  },
  {
    id: 'DONE-002',
    title: 'Moodulite haldus funktsionaalsus',
    description: 'Lisatud onClick handlerid ja modaalid /admin/modules lehele',
    priority: 'high',
    status: 'done',
    module: 'admin',
    commit: '306d07a',
    completedAt: '2024-12-04',
  },
  {
    id: 'DONE-003',
    title: 'Vehicles UI komponendid',
    description: 'Eemaldatud antd sõltuvused, kasutab nüüd @rivest/ui',
    priority: 'high',
    status: 'done',
    module: 'vehicles',
    commit: '4ba0458',
    completedAt: '2024-12-04',
  },
  {
    id: 'DONE-004',
    title: 'Logide funktsionaalsus',
    description: 'Lisatud copy, export, clear nupud logide lehele',
    priority: 'medium',
    status: 'done',
    module: 'admin',
    commit: 'd8a1b13',
    completedAt: '2024-12-04',
  },
]

// Build versioonid
const buildVersions: BuildVersion[] = [
  {
    version: '2.0.5',
    date: '2024-12-04',
    commit: 'd8a1b13',
    changes: [
      'Logide leht - copy/export/clear nupud töötavad',
    ],
  },
  {
    version: '2.0.4',
    date: '2024-12-04',
    commit: '948dddd',
    changes: [
      'Lisatud /admin/components ülevaate leht',
      'Admin menüü uuendatud',
    ],
  },
  {
    version: '2.0.3',
    date: '2024-12-04',
    commit: '306d07a',
    changes: [
      'Lisatud /admin/users, /admin/system, /admin/logs, /admin/todos',
      'Moodulite haldus nupud töötavad',
    ],
  },
  {
    version: '2.0.2',
    date: '2024-12-04',
    commit: '4ba0458',
    changes: [
      'Vehicles mooduli UI komponendid @rivest/ui-ga',
      'Eemaldatud antd sõltuvused',
    ],
  },
  {
    version: '2.0.1',
    date: '2024-12-04',
    commit: '3f64126',
    changes: [
      'EOS2 modulaarne süsteem (PHASE 1-8)',
      'Core permissions, registry, design tokens',
    ],
  },
]

const priorityConfig: Record<string, { label: string; color: string; dot: string }> = {
  critical: { label: 'Kriitiline', color: 'text-red-600', dot: 'bg-red-500' },
  high: { label: 'Kõrge', color: 'text-orange-600', dot: 'bg-orange-500' },
  medium: { label: 'Keskmine', color: 'text-yellow-600', dot: 'bg-yellow-500' },
  low: { label: 'Madal', color: 'text-gray-500', dot: 'bg-gray-400' },
}

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>(projectTodos)
  const [showDone, setShowDone] = useState(false)
  const [tab, setTab] = useState<'todos' | 'changelog'>('todos')

  const pendingTodos = todos.filter(t => t.status !== 'done')
  const doneTodos = todos.filter(t => t.status === 'done')

  const stats = {
    total: pendingTodos.length,
    critical: pendingTodos.filter(t => t.priority === 'critical').length,
    done: doneTodos.length,
  }

  const handleToggle = (todoId: string) => {
    setTodos(todos.map(t =>
      t.id === todoId
        ? {
            ...t,
            status: t.status === 'done' ? 'todo' : 'done',
            completedAt: t.status === 'done' ? undefined : new Date().toISOString().split('T')[0]
          }
        : t
    ))
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">TODO & Changelog</h1>
          <p className="text-gray-500 text-sm">Arendus ja versioonid</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-xs text-gray-500">Praegune versioon</p>
            <p className="font-mono font-bold text-lg">v{buildVersions[0].version}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b">
        <button
          onClick={() => setTab('todos')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            tab === 'todos'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📋 TODO ({stats.total})
        </button>
        <button
          onClick={() => setTab('changelog')}
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            tab === 'changelog'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          📜 Changelog ({buildVersions.length})
        </button>
      </div>

      {tab === 'todos' ? (
        <>
          {/* Quick stats */}
          <div className="flex gap-4 text-sm">
            <span className="px-2 py-1 bg-gray-100 rounded">
              Pooleli: <strong>{stats.total}</strong>
            </span>
            {stats.critical > 0 && (
              <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
                Kriitilised: <strong>{stats.critical}</strong>
              </span>
            )}
            <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
              Tehtud: <strong>{stats.done}</strong>
            </span>
          </div>

          {/* TODO list - compact */}
          <div className="bg-white rounded-lg border divide-y">
            {pendingTodos.map((todo) => (
              <div key={todo.id} className="p-3 hover:bg-gray-50 flex items-start gap-3">
                <button
                  onClick={() => handleToggle(todo.id)}
                  className="mt-0.5 w-5 h-5 rounded border-2 border-gray-300 hover:border-green-500 flex-shrink-0 transition-colors"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${priorityConfig[todo.priority].dot}`} />
                    <span className="font-medium text-gray-800">{todo.title}</span>
                    {todo.module && (
                      <span className="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                        {todo.module}
                      </span>
                    )}
                  </div>
                  {todo.description && (
                    <p className="text-sm text-gray-500 mt-0.5">{todo.description}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 font-mono">{todo.id}</span>
              </div>
            ))}
          </div>

          {/* Done toggle */}
          <button
            onClick={() => setShowDone(!showDone)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {showDone ? '▼' : '▶'} Tehtud ({doneTodos.length})
          </button>

          {/* Done list */}
          {showDone && (
            <div className="bg-gray-50 rounded-lg border divide-y opacity-75">
              {doneTodos.map((todo) => (
                <div key={todo.id} className="p-3 flex items-start gap-3">
                  <button
                    onClick={() => handleToggle(todo.id)}
                    className="mt-0.5 w-5 h-5 rounded bg-green-500 text-white flex items-center justify-center flex-shrink-0 text-xs"
                  >
                    ✓
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-500 line-through">{todo.title}</span>
                      {todo.module && (
                        <span className="px-1.5 py-0.5 text-xs bg-gray-200 text-gray-600 rounded">
                          {todo.module}
                        </span>
                      )}
                    </div>
                    {todo.description && (
                      <p className="text-sm text-gray-400 mt-0.5">{todo.description}</p>
                    )}
                    <div className="flex gap-2 mt-1 text-xs text-gray-400">
                      {todo.commit && <span className="font-mono">#{todo.commit}</span>}
                      {todo.completedAt && <span>{todo.completedAt}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Progress */}
          <div className="bg-white rounded-lg p-3 border">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Progress</span>
              <span className="text-gray-500">
                {stats.done}/{stats.done + stats.total} ({Math.round((stats.done / (stats.done + stats.total)) * 100)}%)
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full transition-all"
                style={{ width: `${(stats.done / (stats.done + stats.total)) * 100}%` }}
              />
            </div>
          </div>
        </>
      ) : (
        /* Changelog tab */
        <div className="space-y-4">
          {buildVersions.map((build, index) => (
            <div
              key={build.version}
              className={`bg-white rounded-lg border p-4 ${index === 0 ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-lg">v{build.version}</span>
                  {index === 0 && (
                    <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                      PRAEGUNE
                    </span>
                  )}
                </div>
                <div className="text-sm text-gray-500">
                  <span className="font-mono">#{build.commit}</span>
                  <span className="mx-2">•</span>
                  <span>{build.date}</span>
                </div>
              </div>
              <ul className="space-y-1">
                {build.changes.map((change, i) => (
                  <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                    <span className="text-green-500">+</span>
                    {change}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
