'use client'

/**
 * Admin - TODO nimekiri
 *
 * Süsteemi arendusülesannete haldus
 */

import React, { useState } from 'react'

interface Todo {
  id: string
  title: string
  description?: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  status: 'todo' | 'in_progress' | 'review' | 'done'
  module?: string
  assignee?: string
  createdAt: string
  dueDate?: string
}

// Mock andmed
const mockTodos: Todo[] = [
  {
    id: 'TODO-001',
    title: 'Implementeerida Supabase RLS poliitikad',
    description: 'Lisa Row Level Security poliitikad kõigile tabelitele',
    priority: 'critical',
    status: 'in_progress',
    module: 'core',
    assignee: 'Admin',
    createdAt: '2024-12-01',
    dueDate: '2024-12-10',
  },
  {
    id: 'TODO-002',
    title: 'Vehicles mooduli UI komponendid',
    description: 'Loo sõidukite halduse vormid ja nimekirjad',
    priority: 'high',
    status: 'done',
    module: 'vehicles',
    createdAt: '2024-12-02',
  },
  {
    id: 'TODO-003',
    title: 'Unit testid permissions moodulile',
    description: 'Lisa testid checkPermission ja hasRole funktsioonidele',
    priority: 'medium',
    status: 'done',
    module: 'permissions',
    createdAt: '2024-12-03',
  },
  {
    id: 'TODO-004',
    title: 'API endpoint validation',
    description: 'Lisa Zod validatsioon kõigile API endpointidele',
    priority: 'high',
    status: 'todo',
    module: 'api',
    createdAt: '2024-12-03',
  },
  {
    id: 'TODO-005',
    title: 'Dark mode tugi',
    description: 'Lisa dark mode toggle ja CSS muutujad',
    priority: 'low',
    status: 'todo',
    module: 'design',
    createdAt: '2024-12-04',
  },
  {
    id: 'TODO-006',
    title: 'E-maili teavitused',
    description: 'Seadista Resend ja loo e-maili mallid',
    priority: 'medium',
    status: 'todo',
    module: 'notifications',
    createdAt: '2024-12-04',
  },
  {
    id: 'TODO-007',
    title: 'Ekspordi funktsioon',
    description: 'Lisa CSV/Excel eksport tabelitele',
    priority: 'low',
    status: 'review',
    module: 'warehouse',
    createdAt: '2024-12-02',
  },
]

const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
  critical: { label: 'Kriitiline', color: 'text-red-700', bg: 'bg-red-100' },
  high: { label: 'Kõrge', color: 'text-orange-700', bg: 'bg-orange-100' },
  medium: { label: 'Keskmine', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  low: { label: 'Madal', color: 'text-gray-700', bg: 'bg-gray-100' },
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  todo: { label: 'Teha', color: 'text-gray-700', bg: 'bg-gray-100', icon: '⬜' },
  in_progress: { label: 'Töös', color: 'text-blue-700', bg: 'bg-blue-100', icon: '🔄' },
  review: { label: 'Ülevaatus', color: 'text-purple-700', bg: 'bg-purple-100', icon: '👁️' },
  done: { label: 'Valmis', color: 'text-green-700', bg: 'bg-green-100', icon: '✅' },
}

export default function TodosPage() {
  const [todos, setTodos] = useState<Todo[]>(mockTodos)
  const [filter, setFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)

  const filteredTodos = filter === 'all'
    ? todos
    : todos.filter(t => t.status === filter || t.priority === filter)

  const stats = {
    total: todos.length,
    todo: todos.filter(t => t.status === 'todo').length,
    inProgress: todos.filter(t => t.status === 'in_progress').length,
    done: todos.filter(t => t.status === 'done').length,
    critical: todos.filter(t => t.priority === 'critical' && t.status !== 'done').length,
  }

  const handleStatusChange = (todoId: string, newStatus: Todo['status']) => {
    setTodos(todos.map(t =>
      t.id === todoId ? { ...t, status: newStatus } : t
    ))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">TODO nimekiri</h1>
          <p className="text-gray-500">Arendusülesannete haldus</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Lisa ülesanne
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
          onClick={() => setFilter('todo')}
          className={`p-4 rounded-lg border text-center transition-colors ${
            filter === 'todo' ? 'border-gray-500 bg-gray-100' : 'hover:bg-gray-50'
          }`}
        >
          <p className="text-2xl font-bold text-gray-600">{stats.todo}</p>
          <p className="text-sm text-gray-500">Teha</p>
        </button>
        <button
          onClick={() => setFilter('in_progress')}
          className={`p-4 rounded-lg border text-center transition-colors ${
            filter === 'in_progress' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
          }`}
        >
          <p className="text-2xl font-bold text-blue-600">{stats.inProgress}</p>
          <p className="text-sm text-gray-500">Töös</p>
        </button>
        <button
          onClick={() => setFilter('done')}
          className={`p-4 rounded-lg border text-center transition-colors ${
            filter === 'done' ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50'
          }`}
        >
          <p className="text-2xl font-bold text-green-600">{stats.done}</p>
          <p className="text-sm text-gray-500">Valmis</p>
        </button>
        <button
          onClick={() => setFilter('critical')}
          className={`p-4 rounded-lg border text-center transition-colors ${
            filter === 'critical' ? 'border-red-500 bg-red-50' : 'hover:bg-gray-50'
          }`}
        >
          <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
          <p className="text-sm text-gray-500">Kriitilised</p>
        </button>
      </div>

      {/* TODO nimekiri */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="divide-y">
          {filteredTodos.map((todo) => (
            <div key={todo.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-4">
                <button
                  onClick={() => handleStatusChange(
                    todo.id,
                    todo.status === 'done' ? 'todo' : 'done'
                  )}
                  className="flex-shrink-0 text-xl hover:scale-110 transition-transform"
                >
                  {statusConfig[todo.status].icon}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono text-gray-400">#{todo.id}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityConfig[todo.priority].bg} ${priorityConfig[todo.priority].color}`}>
                      {priorityConfig[todo.priority].label}
                    </span>
                    {todo.module && (
                      <span className="px-2 py-0.5 rounded text-xs bg-blue-100 text-blue-700">
                        {todo.module}
                      </span>
                    )}
                  </div>
                  <p className={`font-medium ${todo.status === 'done' ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                    {todo.title}
                  </p>
                  {todo.description && (
                    <p className="text-sm text-gray-500 mt-1">{todo.description}</p>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span>Loodud: {todo.createdAt}</span>
                    {todo.dueDate && <span>Tähtaeg: {todo.dueDate}</span>}
                    {todo.assignee && <span>Täitja: {todo.assignee}</span>}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <select
                    value={todo.status}
                    onChange={(e) => handleStatusChange(todo.id, e.target.value as Todo['status'])}
                    className={`text-sm px-2 py-1 rounded border ${statusConfig[todo.status].bg}`}
                  >
                    <option value="todo">Teha</option>
                    <option value="in_progress">Töös</option>
                    <option value="review">Ülevaatus</option>
                    <option value="done">Valmis</option>
                  </select>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Progress */}
      <div className="bg-white rounded-xl p-4 border">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Üldine progress</span>
          <span className="text-sm text-gray-500">
            {stats.done}/{stats.total} valmis ({Math.round((stats.done / stats.total) * 100)}%)
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-green-500 h-2 rounded-full transition-all"
            style={{ width: `${(stats.done / stats.total) * 100}%` }}
          ></div>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Lisa uus ülesanne</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pealkiri</label>
                <input
                  type="text"
                  placeholder="Ülesande kirjeldus"
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioriteet</label>
                <select className="w-full p-2 border rounded-lg">
                  <option value="low">Madal</option>
                  <option value="medium">Keskmine</option>
                  <option value="high">Kõrge</option>
                  <option value="critical">Kriitiline</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Moodul</label>
                <select className="w-full p-2 border rounded-lg">
                  <option value="">Vali moodul...</option>
                  <option value="core">Core</option>
                  <option value="warehouse">Warehouse</option>
                  <option value="vehicles">Vehicles</option>
                  <option value="permissions">Permissions</option>
                  <option value="design">Design</option>
                </select>
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
                onClick={() => {
                  alert('Ülesanne lisatud! (Demo)')
                  setShowAddModal(false)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Lisa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
