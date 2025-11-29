'use client'

import { useState, useRef, useMemo } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Button, Card, Input } from '@rivest/ui'
import { Search, Filter, Download, Settings, Plus, RefreshCw } from 'lucide-react'
import { TableHeader } from './TableHeader'
import { TableRow } from './TableRow'
import { TableFooter } from './TableFooter'
import { useUltraTable, matchesFilter } from './useUltraTable'
import { usePerformanceMonitor } from './usePerformanceMonitor'
import type { UltraTableRow, UltraTableColumn } from '@/types/ultra-table'
import { cn } from '@rivest/ui'

interface Filter {
  columnKey: string
  operator: string
  value: any
}

interface UltraTableProps {
  tableId: string
  viewId?: string
  enableVirtualization?: boolean
  enableFormulas?: boolean
  enableAggregations?: boolean
  enableSubRows?: boolean
  className?: string
  onRowClick?: (row: UltraTableRow) => void
  onRowsSelected?: (rows: UltraTableRow[]) => void
  onAddRow?: () => void
}

export function UltraTable({
  tableId,
  viewId,
  enableVirtualization = true,
  enableFormulas = true,
  enableAggregations = true,
  enableSubRows = false,
  className,
  onRowClick,
  onRowsSelected,
  onAddRow,
}: UltraTableProps) {
  // Data & Config
  const {
    table,
    columns,
    rows,
    view,
    config,
    isLoading,
    error,
    // CRUD operations
    createRow,
    updateRow,
    deleteRow,
    // Formula calculations
    calculatedValues,
    isCalculating,
    // Aggregations
    aggregations,
    // Sub-rows
    expandRow,
    collapseRow,
    // Selection
    selectedRows,
    selectRow,
    selectAll,
    deselectAll,
    // Sort
    sortColumn,
    sortDirection,
    setSortColumn,
    setSortDirection,
    // Filters
    activeFilters,
    setActiveFilters,
  } = useUltraTable(tableId, viewId)

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('')

  // Virtual scrolling
  const parentRef = useRef<HTMLDivElement>(null)

  // Filter and sort rows
  const filteredRows = useMemo(() => {
    let result = rows

    // Apply search
    if (searchQuery) {
      result = result.filter(row =>
        columns.some(col => {
          const value = row.data[col.key]
          return String(value || '').toLowerCase().includes(searchQuery.toLowerCase())
        })
      )
    }

    // Apply filters
    if (activeFilters.length > 0) {
      result = result.filter(row =>
        activeFilters.every(filter => matchesFilter(row, filter, columns))
      )
    }

    // Apply sort
    if (sortColumn && sortDirection) {
      result = [...result].sort((a, b) => {
        const valueA = a.data[sortColumn]
        const valueB = b.data[sortColumn]

        if (valueA == null) return sortDirection === 'asc' ? 1 : -1
        if (valueB == null) return sortDirection === 'asc' ? -1 : 1

        if (typeof valueA === 'number' && typeof valueB === 'number') {
          return sortDirection === 'asc' ? valueA - valueB : valueB - valueA
        }

        const strA = String(valueA).toLowerCase()
        const strB = String(valueB).toLowerCase()
        return sortDirection === 'asc'
          ? strA.localeCompare(strB)
          : strB.localeCompare(strA)
      })
    }

    return result
  }, [rows, searchQuery, activeFilters, columns, sortColumn, sortDirection])

  // Virtual rows
  const rowVirtualizer = useVirtualizer({
    count: filteredRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => config?.rowHeightPx || 52,
    overscan: 10,
    enabled: enableVirtualization,
  })

  // Performance monitoring
  const { fps, renderTime } = usePerformanceMonitor()

  // Handle sort
  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      if (sortDirection === 'asc') {
        setSortDirection('desc')
      } else if (sortDirection === 'desc') {
        setSortColumn(null)
        setSortDirection(null)
      }
    } else {
      setSortColumn(columnKey)
      setSortDirection('asc')
    }
  }

  // Handle cell change
  const handleCellChange = async (rowId: string, columnKey: string, value: any) => {
    await updateRow(rowId, { [columnKey]: value })
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <RefreshCw className="h-12 w-12 animate-spin text-[#279989] mx-auto" />
          <p className="mt-4 text-sm text-muted-foreground">Loading table...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-destructive">
          <p className="font-medium">Error loading table</p>
          <p className="text-sm mt-2">{error.message}</p>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => window.location.reload()}
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn('ultra-table flex flex-col h-full bg-background', className)}>
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 p-4 border-b bg-background">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Selection Info */}
          {selectedRows.length > 0 && (
            <div className="px-3 py-1 bg-[#279989]/10 text-[#279989] rounded text-sm font-medium">
              {selectedRows.length} selected
              <button
                className="ml-2 hover:underline"
                onClick={() => deselectAll()}
              >
                Clear
              </button>
            </div>
          )}

          {/* Actions */}
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-1" />
            Filter
            {activeFilters.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-[#279989] text-white text-xs rounded-full">
                {activeFilters.length}
              </span>
            )}
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-1" />
            View
          </Button>
          <Button
            size="sm"
            className="bg-[#279989] hover:bg-[#1f7a6e]"
            onClick={onAddRow}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Row
          </Button>
        </div>
      </div>

      {/* Table Container */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto"
      >
        <table className="w-full border-collapse">
          {/* Header */}
          <TableHeader
            columns={columns}
            selectedAll={selectedRows.length === filteredRows.length && filteredRows.length > 0}
            onSelectAll={() => {
              if (selectedRows.length === filteredRows.length) {
                deselectAll()
              } else {
                selectAll(filteredRows)
              }
              onRowsSelected?.(selectedRows)
            }}
            sortColumn={sortColumn}
            sortDirection={sortDirection}
            onSort={handleSort}
          />

          {/* Body */}
          <tbody
            style={
              enableVirtualization
                ? {
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    position: 'relative',
                  }
                : undefined
            }
          >
            {filteredRows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="text-center py-16 text-muted-foreground"
                >
                  <p className="text-lg font-medium">No data</p>
                  <p className="text-sm mt-1">
                    {searchQuery
                      ? 'No rows match your search'
                      : 'Add a row to get started'}
                  </p>
                  {!searchQuery && (
                    <Button
                      className="mt-4 bg-[#279989] hover:bg-[#1f7a6e]"
                      onClick={onAddRow}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Row
                    </Button>
                  )}
                </td>
              </tr>
            ) : enableVirtualization ? (
              // Virtual rows
              rowVirtualizer.getVirtualItems().map(virtualRow => {
                const row = filteredRows[virtualRow.index]
                return (
                  <TableRow
                    key={row.id}
                    row={row}
                    columns={columns}
                    calculatedValues={calculatedValues[row.id]}
                    isSelected={selectedRows.some(r => r.id === row.id)}
                    onSelect={() => {
                      selectRow(row)
                      onRowsSelected?.(selectedRows)
                    }}
                    onClick={() => onRowClick?.(row)}
                    onCellChange={(columnKey, value) =>
                      handleCellChange(row.id, columnKey, value)
                    }
                    enableSubRows={enableSubRows}
                    onExpand={() => expandRow(row.id)}
                    onCollapse={() => collapseRow(row.id)}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  />
                )
              })
            ) : (
              // All rows (non-virtualized)
              filteredRows.map(row => (
                <TableRow
                  key={row.id}
                  row={row}
                  columns={columns}
                  calculatedValues={calculatedValues[row.id]}
                  isSelected={selectedRows.some(r => r.id === row.id)}
                  onSelect={() => {
                    selectRow(row)
                    onRowsSelected?.(selectedRows)
                  }}
                  onClick={() => onRowClick?.(row)}
                  onCellChange={(columnKey, value) =>
                    handleCellChange(row.id, columnKey, value)
                  }
                  enableSubRows={enableSubRows}
                  onExpand={() => expandRow(row.id)}
                  onCollapse={() => collapseRow(row.id)}
                />
              ))
            )}
          </tbody>

          {/* Footer */}
          {enableAggregations && filteredRows.length > 0 && (
            <TableFooter
              columns={columns}
              rows={filteredRows}
              aggregations={aggregations}
            />
          )}
        </table>
      </div>

      {/* Performance Monitor (dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="flex items-center gap-4 px-4 py-2 border-t bg-muted/50 text-xs text-muted-foreground">
          <span>Rows: {filteredRows.length.toLocaleString()}</span>
          <span>FPS: {fps}</span>
          <span>Render: {renderTime}ms</span>
          {isCalculating && (
            <span className="text-[#279989]">
              <RefreshCw className="h-3 w-3 inline mr-1 animate-spin" />
              Calculating...
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export { useUltraTable } from './useUltraTable'
export { TableHeader } from './TableHeader'
export { TableRow } from './TableRow'
export { TableFooter } from './TableFooter'
export { DynamicCell } from './DynamicCell'
