'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Database, Columns, Eye, Settings } from 'lucide-react'
import Link from 'next/link'
import { TableDataView } from '@/components/admin/ultra-tables/TableDataView'
import { TableSettings } from '@/components/admin/ultra-tables/TableSettings'
import { ViewsManager } from '@/components/admin/ultra-tables/ViewsManager'
import { ColumnManager } from '@/components/admin/ultra-table/column-manager'
import type { UltraTableColumn } from '@/types/ultra-table'

type TabType = 'data' | 'columns' | 'views' | 'settings'

export default function TableDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [table, setTable] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('data')

  const fetchTable = useCallback(async () => {
    try {
      const response = await fetch(`/api/ultra-tables/${params.id}`)
      if (!response.ok) {
        router.push('/admin/ultra-tables')
        return
      }
      const data = await response.json()
      setTable(data)
    } catch (error) {
      console.error('Error fetching table:', error)
    } finally {
      setLoading(false)
    }
  }, [params.id, router])

  useEffect(() => {
    fetchTable()
  }, [fetchTable])

  // Handle column updates for ColumnManager integration
  const handleColumnsUpdate = async (columns: UltraTableColumn[]) => {
    try {
      // Update column positions
      await fetch(`/api/ultra-tables/${params.id}/columns`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ columns }),
      })
      fetchTable()
    } catch (error) {
      console.error('Error updating columns:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!table) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Database className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-600">Tabelit ei leitud</p>
        </div>
      </div>
    )
  }

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'data', label: 'Andmed', icon: Database },
    { id: 'columns', label: 'Veerud', icon: Columns },
    { id: 'views', label: 'Vaated', icon: Eye },
    { id: 'settings', label: 'Seaded', icon: Settings },
  ]

  // Convert columns to ColumnManager format
  const columnsForManager: UltraTableColumn[] = (table.columns || []).map((col: any) => ({
    id: col.id,
    tableId: table.id,
    name: col.name,
    key: col.id,
    type: col.type,
    config: col.config || {},
    visible: true,
    order: col.position || 0,
    width: col.width || 150,
    createdAt: new Date(col.created_at || Date.now()),
    updatedAt: new Date(col.updated_at || Date.now()),
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/ultra-tables"
          className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </Link>
        <div className="flex items-center gap-4">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl"
            style={{ backgroundColor: table.color }}
          >
            {table.icon || '📊'}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{table.name}</h1>
            {table.description && (
              <p className="text-slate-600 mt-0.5">{table.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-1">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                  activeTab === tab.id
                    ? 'text-[#279989] border-[#279989]'
                    : 'text-slate-600 border-transparent hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'data' && (
          <TableDataView
            tableId={table.id}
            tableName={table.name}
            columns={table.columns || []}
          />
        )}

        {activeTab === 'columns' && (
          <div className="bg-white border border-slate-200 rounded-xl p-6">
            <ColumnManager
              tableId={table.id}
              columns={columnsForManager}
              onUpdate={handleColumnsUpdate}
            />
          </div>
        )}

        {activeTab === 'views' && (
          <ViewsManager
            tableId={table.id}
            views={table.views || []}
            onUpdate={fetchTable}
          />
        )}

        {activeTab === 'settings' && (
          <TableSettings table={table} onUpdate={fetchTable} />
        )}
      </div>
    </div>
  )
}
