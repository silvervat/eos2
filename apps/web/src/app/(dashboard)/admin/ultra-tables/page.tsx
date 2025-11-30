'use client'

import { useState, useEffect } from 'react'
import { Plus, Table, Eye, Pencil, Trash2, Database, Loader2, Columns } from 'lucide-react'
import { CreateTableDialog } from '@/components/admin/ultra-tables/CreateTableDialog'
import Link from 'next/link'

interface UltraTable {
  id: string
  name: string
  description: string | null
  icon: string | null
  color: string
  created_at: string
  columns: any[]
  views: any[]
}

export default function UltraTablesPage() {
  const [tables, setTables] = useState<UltraTable[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetchTables()
  }, [])

  const fetchTables = async () => {
    try {
      const response = await fetch('/api/ultra-tables')
      const data = await response.json()
      setTables(data)
    } catch (error) {
      console.error('Error fetching tables:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Kas oled kindel, et soovid tabeli kustutada? Kõik andmed kustutatakse.')) return

    setDeleting(id)
    try {
      await fetch(`/api/ultra-tables/${id}`, { method: 'DELETE' })
      fetchTables()
    } catch (error) {
      console.error('Error deleting table:', error)
    } finally {
      setDeleting(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Ultra Tabelid</h1>
          <p className="mt-2 text-slate-600">
            Halda oma kohandatud tabeleid ja andmestruktuure
          </p>
        </div>
        <button
          onClick={() => setCreateDialogOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6e] transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Uus tabel
        </button>
      </div>

      {/* Tables Grid */}
      {tables.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {tables.map((table) => (
            <div
              key={table.id}
              className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-2xl"
                    style={{ backgroundColor: table.color }}
                  >
                    {table.icon || <Table className="w-7 h-7" />}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-lg">{table.name}</h3>
                    {table.description && (
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">
                        {table.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-slate-600 mb-5 pb-5 border-b border-slate-200">
                <div className="flex items-center gap-1.5">
                  <Columns className="w-4 h-4" />
                  <span>{table.columns?.length || 0} veergu</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Eye className="w-4 h-4" />
                  <span>{table.views?.length || 0} vaadet</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link
                  href={`/admin/ultra-tables/${table.id}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors font-medium"
                >
                  <Pencil className="w-4 h-4" />
                  Halda
                </Link>
                <button
                  onClick={() => handleDelete(table.id)}
                  disabled={deleting === table.id}
                  className="p-2.5 border border-slate-300 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-50"
                >
                  {deleting === table.id ? (
                    <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-red-600" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Database className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">
            Tabeleid pole veel loodud
          </h3>
          <p className="text-slate-600 mb-6 max-w-md mx-auto">
            Loo oma esimene kohandatud tabel ja alusta andmete haldamist. Tabelid toetavad 55 erinevat veeru tüüpi.
          </p>
          <button
            onClick={() => setCreateDialogOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6e] transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Loo esimene tabel
          </button>
        </div>
      )}

      {/* Create Table Dialog */}
      <CreateTableDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={fetchTables}
      />
    </div>
  )
}
