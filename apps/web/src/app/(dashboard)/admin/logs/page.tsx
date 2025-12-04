'use client'

/**
 * Admin - Süsteemi logid
 *
 * Süsteemi tegevuste ja vigade logid
 */

import React, { useState } from 'react'

interface LogEntry {
  id: string
  timestamp: string
  level: 'info' | 'warning' | 'error' | 'debug'
  source: string
  message: string
  user?: string
}

// Mock andmed
const mockLogs: LogEntry[] = [
  {
    id: '1',
    timestamp: '2024-12-04 10:45:23',
    level: 'info',
    source: 'auth',
    message: 'Kasutaja sisse loginud',
    user: 'admin@example.com',
  },
  {
    id: '2',
    timestamp: '2024-12-04 10:44:12',
    level: 'info',
    source: 'warehouse',
    message: 'Uus vara lisatud: Laptop Dell XPS 15',
    user: 'admin@example.com',
  },
  {
    id: '3',
    timestamp: '2024-12-04 10:42:05',
    level: 'warning',
    source: 'database',
    message: 'Aeglane päring: SELECT * FROM assets (took 1.2s)',
  },
  {
    id: '4',
    timestamp: '2024-12-04 10:40:00',
    level: 'error',
    source: 'api',
    message: 'Failed to connect to external service: timeout after 30s',
  },
  {
    id: '5',
    timestamp: '2024-12-04 10:38:45',
    level: 'info',
    source: 'system',
    message: 'Süsteem käivitatud',
  },
  {
    id: '6',
    timestamp: '2024-12-04 10:35:12',
    level: 'debug',
    source: 'cache',
    message: 'Cache invalidated for key: user_permissions_1',
  },
  {
    id: '7',
    timestamp: '2024-12-04 10:30:00',
    level: 'info',
    source: 'deploy',
    message: 'Uus versioon deployed: v2.0.0',
  },
  {
    id: '8',
    timestamp: '2024-12-04 10:25:33',
    level: 'warning',
    source: 'storage',
    message: 'Storage kasutus üle 80%: 82.5GB / 100GB',
  },
  {
    id: '9',
    timestamp: '2024-12-04 10:20:00',
    level: 'info',
    source: 'backup',
    message: 'Automaatne backup loodud: backup_2024120410.sql',
  },
  {
    id: '10',
    timestamp: '2024-12-04 10:15:45',
    level: 'error',
    source: 'email',
    message: 'Failed to send email to user@example.com: SMTP connection refused',
  },
]

const levelConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  info: { label: 'Info', color: 'text-blue-700', bg: 'bg-blue-100', icon: 'ℹ️' },
  warning: { label: 'Hoiatus', color: 'text-yellow-700', bg: 'bg-yellow-100', icon: '⚠️' },
  error: { label: 'Viga', color: 'text-red-700', bg: 'bg-red-100', icon: '❌' },
  debug: { label: 'Debug', color: 'text-gray-700', bg: 'bg-gray-100', icon: '🔧' },
}

const sourceConfig: Record<string, string> = {
  auth: '🔐',
  warehouse: '🏭',
  database: '🗄️',
  api: '🔌',
  system: '⚙️',
  cache: '⚡',
  deploy: '🚀',
  storage: '💾',
  backup: '📦',
  email: '📧',
}

export default function LogsPage() {
  const [logs] = useState<LogEntry[]>(mockLogs)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')

  const filteredLogs = logs.filter(log => {
    const matchesFilter = filter === 'all' || log.level === filter
    const matchesSearch = searchTerm === '' ||
      log.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.source.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const stats = {
    total: logs.length,
    errors: logs.filter(l => l.level === 'error').length,
    warnings: logs.filter(l => l.level === 'warning').length,
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Süsteemi logid</h1>
          <p className="text-gray-500">Tegevuste ja vigade logi</p>
        </div>
        <div className="flex gap-2">
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            📥 Ekspordi
          </button>
          <button className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
            🗑️ Tühjenda
          </button>
        </div>
      </div>

      {/* Filtrid */}
      <div className="flex gap-4 items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filter === 'all' ? 'bg-gray-800 text-white' : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            Kõik ({stats.total})
          </button>
          <button
            onClick={() => setFilter('error')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filter === 'error' ? 'bg-red-600 text-white' : 'bg-red-100 text-red-700 hover:bg-red-200'
            }`}
          >
            Vead ({stats.errors})
          </button>
          <button
            onClick={() => setFilter('warning')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filter === 'warning' ? 'bg-yellow-600 text-white' : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
            }`}
          >
            Hoiatused ({stats.warnings})
          </button>
          <button
            onClick={() => setFilter('info')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filter === 'info' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
          >
            Info
          </button>
          <button
            onClick={() => setFilter('debug')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              filter === 'debug' ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Debug
          </button>
        </div>
        <div className="flex-1">
          <input
            type="text"
            placeholder="Otsi logidest..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Logid */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="divide-y">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 text-xl">
                  {sourceConfig[log.source] || '📝'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${levelConfig[log.level].bg} ${levelConfig[log.level].color}`}>
                      {levelConfig[log.level].icon} {levelConfig[log.level].label}
                    </span>
                    <span className="text-xs text-gray-500 font-mono">{log.source}</span>
                    {log.user && (
                      <span className="text-xs text-gray-400">• {log.user}</span>
                    )}
                  </div>
                  <p className={`text-sm ${log.level === 'error' ? 'text-red-700' : 'text-gray-700'}`}>
                    {log.message}
                  </p>
                </div>
                <div className="flex-shrink-0 text-xs text-gray-400 font-mono">
                  {log.timestamp}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination / Load more */}
      <div className="flex justify-center">
        <button className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
          Laadi rohkem logisid...
        </button>
      </div>

      {/* Info */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <p className="text-blue-800 text-sm">
          <strong>💡 Vihje:</strong> Logid säilitatakse 30 päeva. Pikemaajaliseks säilitamiseks ekspordi logid regulaarselt.
        </p>
      </div>
    </div>
  )
}
