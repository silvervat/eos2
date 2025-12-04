'use client'

/**
 * Admin - Süsteemi logid
 *
 * REAALNE audit_log tabelist Supabase'st
 */

import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RefreshCw, Download, Trash2, Copy, CheckCircle } from 'lucide-react'

interface LogEntry {
  id: string
  tenant_id: string
  user_id: string | null
  action: string
  entity_type: string
  entity_id: string
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  ip_address: string | null
  user_agent: string | null
  created_at: string
}

const actionConfig: Record<string, { label: string; color: string; bg: string; icon: string }> = {
  create: { label: 'Loomine', color: 'text-green-700', bg: 'bg-green-100', icon: '➕' },
  update: { label: 'Muutmine', color: 'text-blue-700', bg: 'bg-blue-100', icon: '✏️' },
  delete: { label: 'Kustutamine', color: 'text-red-700', bg: 'bg-red-100', icon: '🗑️' },
  login: { label: 'Sisselogimine', color: 'text-purple-700', bg: 'bg-purple-100', icon: '🔐' },
  logout: { label: 'Väljalogimine', color: 'text-gray-700', bg: 'bg-gray-100', icon: '🚪' },
}

const entityConfig: Record<string, string> = {
  asset: '📦',
  project: '📁',
  invoice: '📄',
  employee: '👔',
  user: '👤',
  company: '🏢',
  document: '📝',
  transfer: '🔄',
  category: '📂',
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [entityFilter, setEntityFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [limit, setLimit] = useState(50)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const [exportSuccess, setExportSuccess] = useState(false)

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    const supabase = createClient()

    try {
      let query = supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)

      if (filter !== 'all') {
        query = query.eq('action', filter)
      }
      if (entityFilter !== 'all') {
        query = query.eq('entity_type', entityFilter)
      }

      const { data, error: fetchError } = await query

      if (fetchError) {
        setError(fetchError.message)
        setLogs([])
      } else {
        setLogs(data || [])
      }
    } catch {
      setError('Logide laadimine ebaõnnestus')
      setLogs([])
    }

    setLoading(false)
  }, [filter, entityFilter, limit])

  useEffect(() => {
    fetchLogs()
  }, [fetchLogs])

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      log.action.toLowerCase().includes(search) ||
      log.entity_type.toLowerCase().includes(search) ||
      log.entity_id.toLowerCase().includes(search)
    )
  })

  const stats = {
    total: filteredLogs.length,
    creates: filteredLogs.filter(l => l.action === 'create').length,
    updates: filteredLogs.filter(l => l.action === 'update').length,
    deletes: filteredLogs.filter(l => l.action === 'delete').length,
  }

  // Format logs as text for clipboard
  const formatLogsAsText = () => {
    return filteredLogs.map(log =>
      `[${new Date(log.created_at).toLocaleString('et-EE')}] [${log.action.toUpperCase()}] [${log.entity_type}] ID: ${log.entity_id}`
    ).join('\n')
  }

  // Copy to clipboard
  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(formatLogsAsText())
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch {
      alert('Kopeerimine ebaõnnestus')
    }
  }

  // Export as JSON file
  const handleExport = () => {
    const dataStr = JSON.stringify(filteredLogs, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `audit_logs_${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    setExportSuccess(true)
    setTimeout(() => setExportSuccess(false), 2000)
  }

  // Clear logs (requires admin permission in database)
  const handleClearLogs = async () => {
    const supabase = createClient()
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const { error } = await supabase
        .from('audit_log')
        .delete()
        .lt('created_at', thirtyDaysAgo.toISOString())

      if (error) {
        alert(`Kustutamine ebaõnnestus: ${error.message}`)
      } else {
        fetchLogs()
      }
    } catch {
      alert('Kustutamine ebaõnnestus')
    }
    setShowClearConfirm(false)
  }

  const uniqueEntities = [...new Set(logs.map(l => l.entity_type))].sort()
  const uniqueActions = [...new Set(logs.map(l => l.action))].sort()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Süsteemi logid</h1>
          <p className="text-gray-500">Audit log - tegelikud andmed Supabase'st</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Värskenda
          </button>
          <button
            onClick={handleCopyToClipboard}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
              copySuccess ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {copySuccess ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copySuccess ? 'Kopeeritud!' : 'Kopeeri'}
          </button>
          <button
            onClick={handleExport}
            disabled={logs.length === 0}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-colors disabled:opacity-50 ${
              exportSuccess ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Download className="w-4 h-4" />
            {exportSuccess ? 'Eksporditud!' : 'Ekspordi'}
          </button>
          <button
            onClick={() => setShowClearConfirm(true)}
            disabled={logs.length === 0}
            className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            Tühjenda vanad
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-800">
            <strong>Viga:</strong> {error}
          </p>
          <p className="text-red-600 text-sm mt-1">
            Kontrolli, kas audit_log tabel eksisteerib ja RLS poliitikad lubavad lugemist.
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="flex gap-4 text-sm">
        <span className="px-2 py-1 bg-gray-100 rounded">
          Kokku: <strong>{stats.total}</strong>
        </span>
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded">
          Loodud: <strong>{stats.creates}</strong>
        </span>
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
          Muudetud: <strong>{stats.updates}</strong>
        </span>
        <span className="px-2 py-1 bg-red-100 text-red-700 rounded">
          Kustutatud: <strong>{stats.deletes}</strong>
        </span>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-center flex-wrap">
        <div className="flex gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">Kõik tegevused</option>
            {uniqueActions.map(action => (
              <option key={action} value={action}>
                {actionConfig[action]?.label || action}
              </option>
            ))}
          </select>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">Kõik olemid</option>
            {uniqueEntities.map(entity => (
              <option key={entity} value={entity}>{entity}</option>
            ))}
          </select>
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value={25}>25 kirjet</option>
            <option value={50}>50 kirjet</option>
            <option value={100}>100 kirjet</option>
            <option value={500}>500 kirjet</option>
          </select>
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

      {/* Logs table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
            <p>Laadin logisid...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p className="text-4xl mb-2">📭</p>
            <p>Logisid ei leitud</p>
            <p className="text-sm mt-2">
              {error ? 'Kontrolli andmebaasi ühendust' : 'Audit_log tabel on tühi'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Aeg</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Tegevus</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Olem</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ID</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">Detailid</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {new Date(log.created_at).toLocaleString('et-EE')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${actionConfig[log.action]?.bg || 'bg-gray-100'} ${actionConfig[log.action]?.color || 'text-gray-700'}`}>
                      {actionConfig[log.action]?.icon || '📝'} {actionConfig[log.action]?.label || log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1">
                      {entityConfig[log.entity_type] || '📄'}
                      <span className="font-medium">{log.entity_type}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-gray-100 px-1 rounded">{log.entity_id.slice(0, 8)}...</code>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {log.new_values && Object.keys(log.new_values).length > 0 && (
                      <span title={JSON.stringify(log.new_values, null, 2)}>
                        {Object.keys(log.new_values).slice(0, 3).join(', ')}
                        {Object.keys(log.new_values).length > 3 && '...'}
                      </span>
                    )}
                    {log.ip_address && (
                      <span className="ml-2 text-gray-400">IP: {log.ip_address}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Load more */}
      {filteredLogs.length >= limit && (
        <div className="flex justify-center">
          <button
            onClick={() => setLimit(prev => prev + 50)}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            Laadi rohkem logisid...
          </button>
        </div>
      )}

      {/* Info */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <p className="text-blue-800 text-sm">
          <strong>ℹ️ Info:</strong> See leht näitab reaalseid logisid audit_log tabelist Supabase'st.
          Logid luuakse automaatselt süsteemi tegevuste käigus. "Tühjenda vanad" kustutab üle 30 päeva vanused logid.
        </p>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-red-600">Kustuta vanad logid?</h2>
            <p className="text-gray-600 mb-4">
              Kas oled kindel, et soovid kustutada üle 30 päeva vanused logid?
            </p>
            <p className="text-sm text-yellow-600 mb-4">
              See tegevus nõuab andmebaasi admin õigusi.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
              >
                Tühista
              </button>
              <button
                onClick={handleExport}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Ekspordi enne
              </button>
              <button
                onClick={handleClearLogs}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Kustuta vanad
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
