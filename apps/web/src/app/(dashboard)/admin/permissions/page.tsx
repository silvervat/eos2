'use client'

/**
 * Admin - Õiguste Maatriks
 *
 * Visuaalne õiguste maatriks - näitab millistel rollidel on milliseid õigusi
 */

import React from 'react'
import {
  Role,
  RoleLabels,
  RoleColors,
  RoleHierarchy,
  PermissionMatrix,
  roleHasPermission,
  type RoleType,
} from '@/core/permissions'

// Moodulid ja nende toimingud
const modulePermissions = [
  {
    module: 'warehouse',
    label: 'Laohaldus',
    icon: '🏭',
    actions: ['read', 'create', 'update', 'delete', 'transfer', 'export'],
  },
  {
    module: 'project',
    label: 'Projektid',
    icon: '📁',
    actions: ['read', 'create', 'update', 'delete', 'archive', 'assign', 'export'],
  },
  {
    module: 'invoice',
    label: 'Arved',
    icon: '📄',
    actions: ['read', 'create', 'update', 'delete', 'send', 'approve', 'export'],
  },
  {
    module: 'vehicle',
    label: 'Sõidukid',
    icon: '🚗',
    actions: ['read', 'create', 'update', 'delete', 'assign', 'maintenance', 'export'],
  },
]

const actionLabels: Record<string, string> = {
  read: '👁️ Vaata',
  create: '➕ Lisa',
  update: '✏️ Muuda',
  delete: '🗑️ Kustuta',
  export: '📤 Eksport',
  transfer: '🔄 Ülekanne',
  archive: '📦 Arhiveeri',
  assign: '👤 Määra',
  send: '📧 Saada',
  approve: '✅ Kinnita',
  maintenance: '🔧 Hooldus',
}

const roles: RoleType[] = ['owner', 'admin', 'manager', 'user', 'viewer']

function PermissionCell({
  module,
  action,
  role,
}: {
  module: string
  action: string
  role: RoleType
}) {
  const permission = `${module}:${action}`
  const hasAccess = roleHasPermission(role, permission)

  return (
    <td className="px-3 py-2 text-center border-r last:border-r-0">
      {hasAccess ? (
        <span className="text-green-600 text-lg">✓</span>
      ) : (
        <span className="text-gray-300 text-lg">−</span>
      )}
    </td>
  )
}

export default function PermissionsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Õiguste maatriks</h1>
        <p className="text-gray-500">Ülevaade rollide ja õiguste seostest</p>
      </div>

      {/* Rollide legend */}
      <div className="bg-white rounded-xl p-6 border">
        <h2 className="text-lg font-semibold mb-4">🎭 Rollide hierarhia</h2>
        <div className="flex gap-4">
          {roles.map((role) => (
            <div
              key={role}
              className="flex-1 p-4 rounded-lg border"
              style={{ borderColor: RoleColors[role] }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: RoleColors[role] }}
                />
                <span className="font-medium">{RoleLabels[role]}</span>
              </div>
              <p className="text-sm text-gray-500">Tase: {RoleHierarchy[role]}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Maatriks moodulite kaupa */}
      {modulePermissions.map((mp) => (
        <div key={mp.module} className="bg-white rounded-xl border overflow-hidden">
          <div className="px-6 py-4 border-b bg-gray-50">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <span>{mp.icon}</span>
              <span>{mp.label}</span>
              <code className="text-sm text-gray-500 font-normal ml-2">({mp.module})</code>
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 w-40">
                    Toiming
                  </th>
                  {roles.map((role) => (
                    <th
                      key={role}
                      className="px-3 py-3 text-sm font-medium text-center border-l"
                      style={{ color: RoleColors[role] }}
                    >
                      {RoleLabels[role]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y">
                {mp.actions.map((action) => (
                  <tr key={action} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm">
                      {actionLabels[action] || action}
                    </td>
                    {roles.map((role) => (
                      <PermissionCell
                        key={role}
                        module={mp.module}
                        action={action}
                        role={role}
                      />
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Admin õigused */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span>👑</span>
            <span>Admin toimingud</span>
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 text-sm font-medium text-gray-500 w-40">
                  Toiming
                </th>
                {roles.map((role) => (
                  <th
                    key={role}
                    className="px-3 py-3 text-sm font-medium text-center border-l"
                    style={{ color: RoleColors[role] }}
                  >
                    {RoleLabels[role]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                { action: 'admin:access', label: '🚪 Ligipääs' },
                { action: 'admin:users', label: '👥 Kasutajad' },
                { action: 'admin:modules', label: '📦 Moodulid' },
                { action: 'admin:permissions', label: '🔐 Õigused' },
                { action: 'admin:system', label: '⚙️ Süsteem' },
                { action: 'admin:logs', label: '📋 Logid' },
              ].map((item) => (
                <tr key={item.action} className="hover:bg-gray-50">
                  <td className="px-4 py-2 text-sm">{item.label}</td>
                  {roles.map((role) => (
                    <td key={role} className="px-3 py-2 text-center border-l">
                      {roleHasPermission(role, item.action) ? (
                        <span className="text-green-600 text-lg">✓</span>
                      ) : (
                        <span className="text-gray-300 text-lg">−</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <p className="text-blue-800">
          <strong>ℹ️ Info:</strong> See maatriks näitab vaikimisi õigusi rollide kaupa.
          Kasutajatele saab anda ka individuaalseid õigusi läbi{' '}
          <code className="bg-blue-100 px-2 py-1 rounded">user_module_access</code> tabeli.
        </p>
      </div>
    </div>
  )
}
