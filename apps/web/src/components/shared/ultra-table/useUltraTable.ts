'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import type { UltraTableColumn, UltraTableRow, TableConfig, ViewConfig } from '@/types/ultra-table'

interface UltraTable {
  id: string
  name: string
  tenantId: string
  columns: UltraTableColumn[]
  config: TableConfig
}

interface UltraTableView {
  id: string
  name: string
  tableId: string
  config: ViewConfig
  isDefault: boolean
}

interface Filter {
  columnKey: string
  operator: string
  value: any
}

interface UseUltraTableReturn {
  table: UltraTable | null
  columns: UltraTableColumn[]
  rows: UltraTableRow[]
  view: UltraTableView | null
  config: TableConfig | null
  isLoading: boolean
  error: Error | null
  // CRUD
  createRow: (data: Record<string, any>) => Promise<UltraTableRow>
  updateRow: (rowId: string, data: Record<string, any>) => Promise<UltraTableRow>
  deleteRow: (rowId: string) => Promise<void>
  // Calculations
  calculatedValues: Record<string, Record<string, any>>
  isCalculating: boolean
  // Aggregations
  aggregations: Record<string, any>
  // Sub-rows
  expandRow: (rowId: string) => void
  collapseRow: (rowId: string) => void
  // Selection
  selectedRows: UltraTableRow[]
  selectRow: (row: UltraTableRow) => void
  deselectRow: (row: UltraTableRow) => void
  selectAll: (rows: UltraTableRow[]) => void
  deselectAll: () => void
  // Filters
  activeFilters: Filter[]
  setActiveFilters: (filters: Filter[]) => void
  // Sort
  sortColumn: string | null
  sortDirection: 'asc' | 'desc' | null
  setSortColumn: (column: string | null) => void
  setSortDirection: (direction: 'asc' | 'desc' | null) => void
}

export function useUltraTable(tableId: string, viewId?: string): UseUltraTableReturn {
  const [table, setTable] = useState<UltraTable | null>(null)
  const [rows, setRows] = useState<UltraTableRow[]>([])
  const [view, setView] = useState<UltraTableView | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [selectedRows, setSelectedRows] = useState<UltraTableRow[]>([])
  const [activeFilters, setActiveFilters] = useState<Filter[]>([])
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Load table data
  useEffect(() => {
    const loadTable = async () => {
      setIsLoading(true)
      setError(null)

      try {
        // Load table metadata and rows
        // In production, this would be an API call
        const mockTable: UltraTable = {
          id: tableId,
          name: 'Sample Table',
          tenantId: 'tenant_1',
          columns: [],
          config: {
            rowHeight: 'normal',
            rowHeightPx: 52,
            striped: false,
            bordered: false,
            enableVirtualization: true,
            enableSubRows: false,
            enableFormulas: true,
            enableAggregations: true,
            enableFilters: true,
            enableSort: true,
            enableSearch: true,
            enableGrouping: false,
            enableColumnResize: true,
            enableColumnReorder: true,
            enableRowSelection: true,
            enableBulkEdit: true,
            chunkSize: 1000,
            cacheSize: 10000,
            workerCount: 4,
            enableRealtime: true,
            showCursors: true,
            showChanges: true,
            headerSticky: true,
            footerSticky: false,
            showRowNumbers: false,
            defaultPermission: 'view',
          },
        }

        setTable(mockTable)
        setRows([])
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to load table'))
      } finally {
        setIsLoading(false)
      }
    }

    loadTable()
  }, [tableId, viewId])

  // Calculate formulas
  const calculatedValues = useMemo(() => {
    const values: Record<string, Record<string, any>> = {}

    rows.forEach(row => {
      values[row.id] = {}

      table?.columns.forEach(column => {
        if (column.type === 'formula' && column.formula) {
          try {
            // Simple formula evaluation
            values[row.id][column.key] = evaluateFormula(column.formula, row.data)
          } catch {
            values[row.id][column.key] = '#ERROR'
          }
        }
      })
    })

    return values
  }, [rows, table?.columns])

  // Calculate aggregations
  const aggregations = useMemo(() => {
    const aggs: Record<string, any> = {}

    table?.columns.forEach(column => {
      const values = rows.map(row => row.data[column.key]).filter(v => v != null)

      aggs[column.key] = {
        count: values.length,
        sum: typeof values[0] === 'number' ? values.reduce((a, b) => a + b, 0) : null,
        avg: typeof values[0] === 'number' ? values.reduce((a, b) => a + b, 0) / values.length : null,
        min: values.length > 0 ? Math.min(...values.filter(v => typeof v === 'number')) : null,
        max: values.length > 0 ? Math.max(...values.filter(v => typeof v === 'number')) : null,
      }
    })

    return aggs
  }, [rows, table?.columns])

  // CRUD operations
  const createRow = useCallback(async (data: Record<string, any>): Promise<UltraTableRow> => {
    const newRow: UltraTableRow = {
      id: `row_${Date.now()}`,
      tableId,
      data,
      order: rows.length,
      level: 0,
      expanded: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current_user',
    }

    setRows(prev => [...prev, newRow])
    return newRow
  }, [tableId, rows.length])

  const updateRow = useCallback(async (rowId: string, data: Record<string, any>): Promise<UltraTableRow> => {
    let updatedRow: UltraTableRow | null = null

    setRows(prev => prev.map(row => {
      if (row.id === rowId) {
        updatedRow = { ...row, data: { ...row.data, ...data }, updatedAt: new Date() }
        return updatedRow
      }
      return row
    }))

    if (!updatedRow) {
      throw new Error('Row not found')
    }

    return updatedRow
  }, [])

  const deleteRow = useCallback(async (rowId: string): Promise<void> => {
    setRows(prev => prev.filter(row => row.id !== rowId))
  }, [])

  // Sub-row operations
  const expandRow = useCallback((rowId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      next.add(rowId)
      return next
    })
  }, [])

  const collapseRow = useCallback((rowId: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      next.delete(rowId)
      return next
    })
  }, [])

  // Selection operations
  const selectRow = useCallback((row: UltraTableRow) => {
    setSelectedRows(prev => {
      if (prev.some(r => r.id === row.id)) {
        return prev.filter(r => r.id !== row.id)
      }
      return [...prev, row]
    })
  }, [])

  const deselectRow = useCallback((row: UltraTableRow) => {
    setSelectedRows(prev => prev.filter(r => r.id !== row.id))
  }, [])

  const selectAll = useCallback((rowsToSelect: UltraTableRow[]) => {
    setSelectedRows(rowsToSelect)
  }, [])

  const deselectAll = useCallback(() => {
    setSelectedRows([])
  }, [])

  // Add expanded state to rows
  const rowsWithExpanded = useMemo(() => {
    return rows.map(row => ({
      ...row,
      expanded: expandedRows.has(row.id),
    }))
  }, [rows, expandedRows])

  return {
    table,
    columns: table?.columns || [],
    rows: rowsWithExpanded,
    view,
    config: table?.config || null,
    isLoading,
    error,
    createRow,
    updateRow,
    deleteRow,
    calculatedValues,
    isCalculating,
    aggregations,
    expandRow,
    collapseRow,
    selectedRows,
    selectRow,
    deselectRow,
    selectAll,
    deselectAll,
    activeFilters,
    setActiveFilters,
    sortColumn,
    sortDirection,
    setSortColumn,
    setSortDirection,
  }
}

function evaluateFormula(formula: string, data: Record<string, any>): any {
  // Simple formula evaluation - replace {field} with values
  let expression = formula

  const fieldPattern = /\{(\w+)\}/g
  let match

  while ((match = fieldPattern.exec(formula)) !== null) {
    const fieldKey = match[1]
    const value = data[fieldKey]

    if (value == null) {
      return null
    }

    expression = expression.replace(match[0], String(value))
  }

  try {
    // Note: In production, use a proper expression parser
    // This is a simplified version for demonstration
    return Function(`"use strict"; return (${expression})`)()
  } catch {
    return '#ERROR'
  }
}

export function matchesFilter(row: UltraTableRow, filter: Filter, columns: UltraTableColumn[]): boolean {
  const value = row.data[filter.columnKey]

  switch (filter.operator) {
    case 'equals':
      return value === filter.value
    case 'not_equals':
      return value !== filter.value
    case 'contains':
      return String(value || '').toLowerCase().includes(String(filter.value).toLowerCase())
    case 'not_contains':
      return !String(value || '').toLowerCase().includes(String(filter.value).toLowerCase())
    case 'is_empty':
      return value == null || value === ''
    case 'is_not_empty':
      return value != null && value !== ''
    case 'greater_than':
      return Number(value) > Number(filter.value)
    case 'less_than':
      return Number(value) < Number(filter.value)
    default:
      return true
  }
}
