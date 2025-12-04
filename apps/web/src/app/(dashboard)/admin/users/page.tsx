'use client'

/**
 * Admin - Kasutajate haldus
 *
 * Kasutajate ülevaade ja õiguste haldus
 */

import React, { useState } from 'react'

interface User {
  id: string
  name: string
  email: string
  role: 'owner' | 'admin' | 'manager' | 'user' | 'viewer'
  status: 'active' | 'inactive' | 'pending'
  lastLogin: string
  createdAt: string
}

// Mock andmed
const mockUsers: User[] = [
  {
    id: '1',
    name: 'Admin Kasutaja',
    email: 'admin@example.com',
    role: 'owner',
    status: 'active',
    lastLogin: '2024-12-04 10:30',
    createdAt: '2024-01-01',
  },
  {
    id: '2',
    name: 'Test Kasutaja',
    email: 'test@example.com',
    role: 'user',
    status: 'active',
    lastLogin: '2024-12-03 15:45',
    createdAt: '2024-06-15',
  },
  {
    id: '3',
    name: 'Vaataja',
    email: 'viewer@example.com',
    role: 'viewer',
    status: 'inactive',
    lastLogin: '2024-11-20 09:00',
    createdAt: '2024-09-01',
  },
]

const roleConfig: Record<string, { label: string; color: string; bg: string; level: number }> = {
  owner: { label: 'Omanik', color: 'text-purple-700', bg: 'bg-purple-100', level: 100 },
  admin: { label: 'Admin', color: 'text-red-700', bg: 'bg-red-100', level: 80 },
  manager: { label: 'Haldur', color: 'text-blue-700', bg: 'bg-blue-100', level: 60 },
  user: { label: 'Kasutaja', color: 'text-green-700', bg: 'bg-green-100', level: 40 },
  viewer: { label: 'Vaataja', color: 'text-gray-700', bg: 'bg-gray-100', level: 20 },
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Aktiivne', color: 'text-green-700', bg: 'bg-green-100' },
  inactive: { label: 'Mitteaktiivne', color: 'text-gray-700', bg: 'bg-gray-100' },
  pending: { label: 'Ootel', color: 'text-yellow-700', bg: 'bg-yellow-100' },
}

function RoleBadge({ role }: { role: string }) {
  const config = roleConfig[role] || roleConfig.viewer
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
      {config.label} ({config.level})
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.inactive
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
      {config.label}
    </span>
  )
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(mockUsers)
  const [filter, setFilter] = useState<string>('all')
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)

  const filteredUsers = filter === 'all'
    ? users
    : users.filter(u => u.role === filter || u.status === filter)

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    admins: users.filter(u => u.role === 'owner' || u.role === 'admin').length,
  }

  const handleRoleChange = (userId: string, newRole: User['role']) => {
    setUsers(users.map(u =>
      u.id === userId ? { ...u, role: newRole } : u
    ))
    setShowEditModal(false)
    setSelectedUser(null)
  }

  const handleStatusToggle = (userId: string) => {
    setUsers(users.map(u =>
      u.id === userId
        ? { ...u, status: u.status === 'active' ? 'inactive' : 'active' }
        : u
    ))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Kasutajate haldus</h1>
          <p className="text-gray-500">Halda süsteemi kasutajaid ja nende õigusi</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Kutsu kasutaja
        </button>
      </div>

      {/* Statistika */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`p-4 rounded-lg border text-center transition-colors ${
            filter === 'all' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
          }`}
        >
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-sm text-gray-500">Kokku kasutajaid</p>
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
          onClick={() => setFilter('admin')}
          className={`p-4 rounded-lg border text-center transition-colors ${
            filter === 'admin' ? 'border-purple-500 bg-purple-50' : 'hover:bg-gray-50'
          }`}
        >
          <p className="text-2xl font-bold text-purple-600">{stats.admins}</p>
          <p className="text-sm text-gray-500">Adminid</p>
        </button>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Kasutaja</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Roll</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Staatus</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Viimane sisselogimine</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Toimingud</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredUsers.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <RoleBadge role={user.role} />
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={user.status} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {user.lastLogin}
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => { setSelectedUser(user); setShowEditModal(true); }}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Muuda rolli"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => handleStatusToggle(user.id)}
                      className="p-2 text-gray-400 hover:text-yellow-600 transition-colors"
                      title={user.status === 'active' ? 'Deaktiveeri' : 'Aktiveeri'}
                    >
                      {user.status === 'active' ? '🔒' : '🔓'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* RBAC Info */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <p className="text-blue-800 font-medium mb-2">📋 Hierarhiline RBAC süsteem</p>
        <div className="flex gap-4 text-sm">
          <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded">Omanik (100)</span>
          <span className="px-2 py-1 bg-red-100 text-red-700 rounded">Admin (80)</span>
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Haldur (60)</span>
          <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Kasutaja (40)</span>
          <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded">Vaataja (20)</span>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Kutsu uus kasutaja</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-post</label>
                <input
                  type="email"
                  placeholder="kasutaja@example.com"
                  className="w-full p-2 border rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Roll</label>
                <select className="w-full p-2 border rounded-lg">
                  <option value="viewer">Vaataja (20)</option>
                  <option value="user">Kasutaja (40)</option>
                  <option value="manager">Haldur (60)</option>
                  <option value="admin">Admin (80)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Tühista
              </button>
              <button
                onClick={() => {
                  alert('Kutse saadetud! (Demo)')
                  setShowInviteModal(false)
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Saada kutse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {showEditModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Muuda rolli: {selectedUser.name}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Roll</label>
                <select
                  defaultValue={selectedUser.role}
                  onChange={(e) => handleRoleChange(selectedUser.id, e.target.value as User['role'])}
                  className="w-full p-2 border rounded-lg"
                >
                  <option value="viewer">Vaataja (20)</option>
                  <option value="user">Kasutaja (40)</option>
                  <option value="manager">Haldur (60)</option>
                  <option value="admin">Admin (80)</option>
                  <option value="owner">Omanik (100)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button
                onClick={() => { setShowEditModal(false); setSelectedUser(null); }}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Sulge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
