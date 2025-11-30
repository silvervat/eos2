'use client'

import { useState, useEffect, useCallback } from 'react'
import { Plus, Search, RefreshCw, Loader2 } from 'lucide-react'
import { VirtualTable } from './VirtualTable'

interface TableDataViewProps {
  tableId: string
  tableName: string
  columns: any[]
}

export function TableDataView({ tableId, tableName, columns }: TableDataViewProps) {
  const [records, setRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [total, setTotal] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')

  const fetchRecords = useCallback(async (pageNum: number, append = false) => {
    if (pageNum === 1) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }

    try {
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: '100',
      })
      if (searchQuery) {
        params.set('search', searchQuery)
      }

      const response = await fetch(`/api/ultra-tables/${tableId}/records?${params}`)
      const data = await response.json()

      if (append) {
        setRecords((prev) => [...prev, ...data.records])
      } else {
        setRecords(data.records)
      }

      setTotal(data.pagination.total)
      setHasMore(data.pagination.hasMore)
      setPage(pageNum)
    } catch (error) {
      console.error('Error fetching records:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [tableId, searchQuery])

  useEffect(() => {
    fetchRecords(1)
  }, [fetchRecords])

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      fetchRecords(page + 1, true)
    }
  }, [loadingMore, hasMore, page, fetchRecords])

  const handleRecordUpdate = async (recordId: string, data: any) => {
    // Optimistic update
    setRecords((prev) =>
      prev.map((r) => (r.id === recordId ? { ...r, data } : r))
    )

    try {
      await fetch(`/api/ultra-tables/${tableId}/records`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: recordId, data }),
      })
    } catch (error) {
      console.error('Error updating record:', error)
      // Revert on error
      fetchRecords(1)
    }
  }

  const handleAddRecord = async () => {
    try {
      const response = await fetch(`/api/ultra-tables/${tableId}/records`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: {} }),
      })

      if (response.ok) {
        const newRecord = await response.json()
        setRecords((prev) => [newRecord, ...prev])
        setTotal((prev) => prev + 1)
      }
    } catch (error) {
      console.error('Error adding record:', error)
    }
  }

  const handleRecordDelete = async (recordId: string) => {
    if (!confirm('Kas oled kindel, et soovid selle rea kustutada?')) return

    // Optimistic delete
    setRecords((prev) => prev.filter((r) => r.id !== recordId))
    setTotal((prev) => prev - 1)

    try {
      await fetch(`/api/ultra-tables/${tableId}/records?recordId=${recordId}`, {
        method: 'DELETE',
      })
    } catch (error) {
      console.error('Error deleting record:', error)
      // Revert on error
      fetchRecords(1)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchRecords(1)
  }

  if (loading && records.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* Search */}
          <form onSubmit={handleSearch} className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Otsi..."
              className="w-64 pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
            />
          </form>

          {/* Refresh */}
          <button
            onClick={() => fetchRecords(1)}
            disabled={loading}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
          </button>

          {/* Record count */}
          <span className="text-sm text-slate-500">
            {total} kirjet
          </span>
        </div>

        {/* Add record button */}
        <button
          onClick={handleAddRecord}
          className="flex items-center gap-2 px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6e] transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Lisa rida
        </button>
      </div>

      {/* Table */}
      <VirtualTable
        tableId={tableId}
        tableName={tableName}
        columns={columns}
        records={records}
        onRecordUpdate={handleRecordUpdate}
        onRecordDelete={handleRecordDelete}
        onLoadMore={handleLoadMore}
        hasMore={hasMore}
        loadingMore={loadingMore}
      />
    </div>
  )
}
