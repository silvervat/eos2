'use client'

/**
 * Admin Panel Layout
 *
 * Kaitstud layout admin paneelile
 */

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { AdminOnly, NoAccess } from '@/core/permissions'

interface AdminLayoutProps {
  children: React.ReactNode
}

const menuItems = [
  {
    key: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    path: '/admin',
  },
  {
    key: 'modules',
    label: 'Moodulid',
    icon: '📦',
    path: '/admin/modules',
  },
  {
    key: 'users',
    label: 'Kasutajad',
    icon: '👥',
    path: '/admin/users',
  },
  {
    key: 'permissions',
    label: 'Õigused',
    icon: '🔐',
    path: '/admin/permissions',
  },
  {
    key: 'system',
    label: 'Süsteem',
    icon: '⚙️',
    path: '/admin/system',
  },
  {
    key: 'logs',
    label: 'Logid',
    icon: '📋',
    path: '/admin/logs',
  },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname()

  return (
    <AdminOnly fallback={<NoAccess title="Admin ligipääs keelatud" />}>
      <div className="flex min-h-screen bg-gray-100">
        {/* Sidebar */}
        <aside className="w-64 bg-white shadow-md">
          <div className="p-4 border-b">
            <h1 className="text-xl font-bold text-gray-800">
              👑 Admin Panel
            </h1>
            <p className="text-sm text-gray-500">EOS2 Haldus</p>
          </div>

          <nav className="p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const isActive = pathname === item.path ||
                  (item.path !== '/admin' && pathname?.startsWith(item.path))

                return (
                  <li key={item.key}>
                    <Link
                      href={item.path}
                      className={`
                        flex items-center gap-3 px-4 py-2 rounded-lg transition-colors
                        ${isActive
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-gray-600 hover:bg-gray-50'
                        }
                      `}
                    >
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* Footer */}
          <div className="absolute bottom-0 w-64 p-4 border-t bg-gray-50">
            <Link
              href="/"
              className="flex items-center gap-2 text-gray-500 hover:text-gray-700"
            >
              ← Tagasi rakendusse
            </Link>
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </AdminOnly>
  )
}
