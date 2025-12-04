'use client'

/**
 * Admin Dashboard
 *
 * Ülevaade süsteemi seisundist
 */

import React from 'react'
import Link from 'next/link'

// Statistika kaart
function StatCard({
  title,
  value,
  subtitle,
  icon,
  color = 'blue',
}: {
  title: string
  value: number | string
  subtitle?: string
  icon: string
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple'
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600 border-blue-200',
    green: 'bg-green-50 text-green-600 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-600 border-yellow-200',
    red: 'bg-red-50 text-red-600 border-red-200',
    purple: 'bg-purple-50 text-purple-600 border-purple-200',
  }

  return (
    <div className={`p-6 rounded-xl border ${colors[color]}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium opacity-75">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
          {subtitle && (
            <p className="text-sm mt-1 opacity-60">{subtitle}</p>
          )}
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </div>
  )
}

// Süsteemi tervis
function SystemHealth() {
  const services = [
    { name: 'Database', status: 'healthy', icon: '🗄️' },
    { name: 'API', status: 'healthy', icon: '🔌' },
    { name: 'Storage', status: 'healthy', icon: '💾' },
    { name: 'Auth', status: 'healthy', icon: '🔐' },
  ]

  return (
    <div className="grid grid-cols-4 gap-4">
      {services.map((service) => (
        <div
          key={service.name}
          className="flex items-center gap-3 p-4 bg-green-50 rounded-lg border border-green-200"
        >
          <span className="text-2xl">{service.icon}</span>
          <div>
            <p className="font-medium text-green-800">{service.name}</p>
            <p className="text-sm text-green-600">✓ Healthy</p>
          </div>
        </div>
      ))}
    </div>
  )
}

// Moodulite nimekiri
function ModulesList() {
  const modules = [
    { name: 'warehouse', label: 'Laohaldus', status: 'active', components: 8 },
    { name: 'projects', label: 'Projektid', status: 'todo', components: 0 },
    { name: 'invoices', label: 'Arved', status: 'todo', components: 0 },
    { name: 'vehicles', label: 'Sõidukid', status: 'todo', components: 0 },
  ]

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-800',
    beta: 'bg-blue-100 text-blue-800',
    development: 'bg-yellow-100 text-yellow-800',
    todo: 'bg-gray-100 text-gray-800',
  }

  return (
    <div className="space-y-2">
      {modules.map((module) => (
        <div
          key={module.name}
          className="flex items-center justify-between p-4 bg-white rounded-lg border hover:shadow-sm transition-shadow"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">📦</span>
            <div>
              <p className="font-medium">{module.label}</p>
              <p className="text-sm text-gray-500">{module.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {module.components} komponenti
            </span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[module.status]}`}>
              {module.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

// TODO nimekiri
function TodoList() {
  const todos = [
    { id: 'TODO-001', title: 'Implementeerida defineModule helper', priority: 'high' },
    { id: 'TODO-002', title: 'Luua design tokens', priority: 'medium' },
    { id: 'TODO-003', title: 'Vehicles mooduli definitsioon', priority: 'medium' },
    { id: 'TODO-004', title: 'Unit testid permissions moodulile', priority: 'low' },
  ]

  const priorityColors: Record<string, string> = {
    high: 'text-red-600',
    medium: 'text-yellow-600',
    low: 'text-gray-600',
  }

  return (
    <div className="space-y-2">
      {todos.map((todo) => (
        <div
          key={todo.id}
          className="flex items-center gap-3 p-3 bg-white rounded-lg border"
        >
          <input type="checkbox" className="w-4 h-4" />
          <span className={`text-xs font-mono ${priorityColors[todo.priority]}`}>
            #{todo.id}
          </span>
          <span className="text-gray-700">{todo.title}</span>
        </div>
      ))}
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500">EOS2 süsteemi ülevaade</p>
      </div>

      {/* Statistika */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          title="Mooduleid"
          value={4}
          subtitle="1 aktiivne"
          icon="📦"
          color="blue"
        />
        <StatCard
          title="Komponente"
          value={8}
          subtitle="8 aktiivset"
          icon="🧩"
          color="green"
        />
        <StatCard
          title="Kasutajaid"
          value={1}
          subtitle="1 online"
          icon="👥"
          color="purple"
        />
        <StatCard
          title="TODO"
          value={4}
          subtitle="0 kriitilist"
          icon="📋"
          color="yellow"
        />
      </div>

      {/* Süsteemi tervis */}
      <div className="bg-white rounded-xl p-6 border">
        <h2 className="text-lg font-semibold mb-4">🏥 Süsteemi tervis</h2>
        <SystemHealth />
      </div>

      {/* Kaks veergu */}
      <div className="grid grid-cols-2 gap-6">
        {/* Moodulid */}
        <div className="bg-white rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">📦 Moodulid</h2>
            <Link
              href="/admin/modules"
              className="text-sm text-blue-600 hover:underline"
            >
              Vaata kõiki →
            </Link>
          </div>
          <ModulesList />
        </div>

        {/* TODO */}
        <div className="bg-white rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">📋 Pooleli</h2>
            <Link
              href="/admin/todos"
              className="text-sm text-blue-600 hover:underline"
            >
              Vaata kõiki →
            </Link>
          </div>
          <TodoList />
        </div>
      </div>

      {/* Kiire info */}
      <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">
          💡 Järgmine samm
        </h2>
        <p className="text-blue-700">
          Vaata implementatsiooni plaani: <code className="bg-blue-100 px-2 py-1 rounded">manual/04.12/01-IMPLEMENTATSIOONI-PLAAN.md</code>
        </p>
        <p className="text-blue-600 text-sm mt-2">
          Praegu pooleli: PHASE 3 - Admin paneel
        </p>
      </div>
    </div>
  )
}
