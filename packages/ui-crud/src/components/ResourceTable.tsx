'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  Trash2,
  Edit,
  Eye,
  Download,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { clsx } from 'clsx'
import { useList, useDelete, useDeleteMany, type Filter, type SortParams } from '@eos2/data-provider'
import { getResource, type ColumnDefinition } from '@eos2/resources'
import { formatValue, getCellAlignment, getNestedValue } from '../formatters'

// ============ TYPES ============

export interface ResourceTableProps {
  /** Resource name (e.g., 'projects') */
  resource: string
  /** Override row click behavior */
  onRowClick?: (record: Record<string, unknown>) => void
  /** Additional columns to display */
  additionalColumns?: ColumnDefinition[]
  /** Columns to hide by default */
  hideColumns?: string[]
  /** Custom action buttons for each row */
  customActions?: (record: Record<string, unknown>) => React.ReactNode
  /** Default filter values */
  defaultFilters?: Filter[]
  /** Enable row selection */
  selectable?: boolean
  /** Callback when selection changes */
  onSelect?: (selectedIds: string[]) => void
  /** Page size options */
  pageSizeOptions?: number[]
  /** Default page size */
  defaultPageSize?: number
  /** Show search input */
  showSearch?: boolean
  /** Show create button */
  showCreateButton?: boolean
  /** Additional toolbar content */
  toolbarContent?: React.ReactNode
  /** Custom empty state */
  emptyState?: React.ReactNode
  /** Additional metadata for queries */
  meta?: Record<string, unknown>
}

// ============ COMPONENT ============

export function ResourceTable({
  resource,
  onRowClick,
  additionalColumns = [],
  hideColumns = [],
  customActions,
  defaultFilters = [],
  selectable = true,
  onSelect,
  pageSizeOptions = [10, 25, 50, 100],
  defaultPageSize = 25,
  showSearch = true,
  showCreateButton = true,
  toolbarContent,
  emptyState,
  meta,
}: ResourceTableProps) {
  const router = useRouter()
  const resourceDef = getResource(resource)

  // State
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(defaultPageSize)
  const [search, setSearch] = useState('')
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
  const [sortField, setSortField] = useState<string | undefined>(
    resourceDef.defaultSort?.field
  )
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(
    resourceDef.defaultSort?.order || 'desc'
  )
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // Build filters
  const queryFilters = useMemo(() => {
    const filters: Filter[] = [...defaultFilters]

    // Add search filter
    if (search && resourceDef.search?.fields?.length) {
      // For simplicity, search in the first searchable field
      // A more advanced implementation would use OR across multiple fields
      filters.push({
        field: resourceDef.search.fields[0],
        operator: 'contains',
        value: search,
      })
    }

    return filters
  }, [search, defaultFilters, resourceDef.search])

  // Build sort
  const sort = useMemo((): SortParams[] | undefined => {
    if (!sortField) return undefined
    return [{ field: sortField, order: sortOrder }]
  }, [sortField, sortOrder])

  // Fetch data
  const {
    data,
    isLoading,
    isFetching,
    error,
    refetch,
  } = useList(resource, {
    pagination: { page, pageSize },
    sort,
    filters: queryFilters,
    supabaseSelect: resourceDef.select,
    meta,
  })

  // Delete mutations
  const { mutate: deleteOne, isPending: isDeleting } = useDelete(resource)
  const { mutate: deleteMany, isPending: isDeletingMany } = useDeleteMany(resource)

  // Generate columns
  const columns = useMemo(() => {
    return resourceDef.columns
      .filter((col) => !hideColumns.includes(col.field) && !col.hidden)
      .concat(additionalColumns)
  }, [resourceDef.columns, hideColumns, additionalColumns])

  // Handle sort
  const handleSort = useCallback((field: string) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
    setPage(1)
  }, [sortField])

  // Handle row click
  const handleRowClick = useCallback((record: Record<string, unknown>) => {
    if (onRowClick) {
      onRowClick(record)
    } else {
      router.push(`${resourceDef.basePath}/${record.id}`)
    }
  }, [onRowClick, router, resourceDef.basePath])

  // Handle delete
  const handleDelete = useCallback((id: string) => {
    deleteOne(id, {
      onSuccess: () => {
        setDeleteConfirmId(null)
        refetch()
      },
    })
  }, [deleteOne, refetch])

  // Handle bulk delete
  const handleBulkDelete = useCallback(() => {
    if (selectedRowKeys.length === 0) return

    deleteMany(selectedRowKeys, {
      onSuccess: () => {
        setSelectedRowKeys([])
        refetch()
      },
    })
  }, [deleteMany, selectedRowKeys, refetch])

  // Handle selection
  const handleSelectAll = useCallback(() => {
    if (!data?.data) return

    const allIds = data.data.map((item) => String(item.id))
    const allSelected = allIds.every((id) => selectedRowKeys.includes(id))

    if (allSelected) {
      setSelectedRowKeys([])
      onSelect?.([])
    } else {
      setSelectedRowKeys(allIds)
      onSelect?.(allIds)
    }
  }, [data, selectedRowKeys, onSelect])

  const handleSelectRow = useCallback((id: string) => {
    setSelectedRowKeys((prev) => {
      const newSelection = prev.includes(id)
        ? prev.filter((key) => key !== id)
        : [...prev, id]
      onSelect?.(newSelection)
      return newSelection
    })
  }, [onSelect])

  // Pagination
  const totalPages = Math.ceil((data?.total || 0) / pageSize)
  const startItem = (page - 1) * pageSize + 1
  const endItem = Math.min(page * pageSize, data?.total || 0)

  // Render loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Viga andmete laadimisel</h3>
        <p className="text-gray-500 mb-4">{error.message}</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Proovi uuesti
        </button>
      </div>
    )
  }

  const records = data?.data || []
  const hasRecords = records.length > 0
  const isAllSelected = hasRecords && records.every((r) => selectedRowKeys.includes(String(r.id)))
  const isSomeSelected = hasRecords && records.some((r) => selectedRowKeys.includes(String(r.id)))

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Search */}
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={resourceDef.search?.placeholder || 'Otsi...'}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          )}

          {/* Custom toolbar content */}
          {toolbarContent}
        </div>

        <div className="flex items-center gap-2">
          {/* Bulk delete */}
          {selectedRowKeys.length > 0 && resourceDef.capabilities?.bulkDelete && (
            <button
              onClick={handleBulkDelete}
              disabled={isDeletingMany}
              className="inline-flex items-center gap-2 px-4 py-2 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 disabled:opacity-50"
            >
              {isDeletingMany ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              Kustuta ({selectedRowKeys.length})
            </button>
          )}

          {/* Export */}
          {resourceDef.capabilities?.export && (
            <button className="inline-flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              <Download className="w-4 h-4" />
              Ekspordi
            </button>
          )}

          {/* Create button */}
          {showCreateButton && resourceDef.capabilities?.create && (
            <button
              onClick={() => router.push(`${resourceDef.basePath}/new`)}
              className="inline-flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              Lisa {resourceDef.label.toLowerCase()}
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {/* Selection column */}
                {selectable && (
                  <th className="w-12 px-4 py-3">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isSomeSelected && !isAllSelected
                      }}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                )}

                {/* Data columns */}
                {columns.map((column) => (
                  <th
                    key={column.field}
                    className={clsx(
                      'px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider',
                      getCellAlignment(column),
                      column.sortable && 'cursor-pointer hover:bg-gray-100 select-none'
                    )}
                    style={{
                      width: column.width,
                      minWidth: column.minWidth,
                    }}
                    onClick={() => column.sortable && handleSort(column.field)}
                  >
                    <div className={clsx(
                      'flex items-center gap-1',
                      column.align === 'right' && 'justify-end',
                      column.align === 'center' && 'justify-center'
                    )}>
                      <span>{column.label}</span>
                      {column.sortable && sortField === column.field && (
                        sortOrder === 'asc' ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )
                      )}
                    </div>
                  </th>
                ))}

                {/* Actions column */}
                <th className="w-32 px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider text-right">
                  Tegevused
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {!hasRecords ? (
                <tr>
                  <td
                    colSpan={columns.length + (selectable ? 2 : 1)}
                    className="px-4 py-12 text-center"
                  >
                    {emptyState || (
                      <div className="text-gray-500">
                        <p className="text-lg font-medium mb-1">Andmeid ei leitud</p>
                        <p className="text-sm">
                          {search
                            ? 'Proovi muuta otsingut'
                            : `Lisa esimene ${resourceDef.label.toLowerCase()}`}
                        </p>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                records.map((record) => {
                  const id = String(record.id)
                  const isSelected = selectedRowKeys.includes(id)
                  const isConfirmingDelete = deleteConfirmId === id

                  return (
                    <tr
                      key={id}
                      className={clsx(
                        'hover:bg-gray-50 cursor-pointer transition-colors',
                        isSelected && 'bg-blue-50'
                      )}
                      onClick={() => handleRowClick(record)}
                    >
                      {/* Selection */}
                      {selectable && (
                        <td className="w-12 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRow(id)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                        </td>
                      )}

                      {/* Data cells */}
                      {columns.map((column) => {
                        const value = column.field.includes('.')
                          ? getNestedValue(record, column.field)
                          : record[column.field]

                        return (
                          <td
                            key={column.field}
                            className={clsx(
                              'px-4 py-3 text-sm',
                              getCellAlignment(column)
                            )}
                          >
                            {formatValue(value, column, record)}
                          </td>
                        )
                      })}

                      {/* Actions */}
                      <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {customActions?.(record)}

                          {resourceDef.capabilities?.show && (
                            <button
                              onClick={() => router.push(`${resourceDef.basePath}/${id}`)}
                              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                              title="Vaata"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          )}

                          {resourceDef.capabilities?.edit && (
                            <button
                              onClick={() => router.push(`${resourceDef.basePath}/${id}/edit`)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                              title="Muuda"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}

                          {resourceDef.capabilities?.delete && (
                            <>
                              {isConfirmingDelete ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => handleDelete(id)}
                                    disabled={isDeleting}
                                    className="px-2 py-1 text-xs text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50"
                                  >
                                    {isDeleting ? '...' : 'Jah'}
                                  </button>
                                  <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded hover:bg-gray-200"
                                  >
                                    Ei
                                  </button>
                                </div>
                              ) : (
                                <button
                                  onClick={() => setDeleteConfirmId(id)}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                                  title="Kustuta"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {hasRecords && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">
                {startItem}–{endItem} / {data?.total || 0}
              </span>

              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value))
                  setPage(1)
                }}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {pageSizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size} rida
                  </option>
                ))}
              </select>

              {isFetching && (
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 text-sm text-gray-600">
                {page} / {totalPages || 1}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(totalPages)}
                disabled={page >= totalPages}
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
