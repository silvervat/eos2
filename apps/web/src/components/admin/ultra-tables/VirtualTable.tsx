'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import { FixedSizeList as List } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'
import { Trash2, Loader2 } from 'lucide-react'
import { DynamicCell } from '@/components/shared/ultra-table/DynamicCell'
import type { UltraTableColumn, UltraTableRow } from '@/types/ultra-table'

interface VirtualTableProps {
  tableId: string
  tableName: string
  columns: any[]
  records: any[]
  onRecordUpdate: (recordId: string, data: any) => void
  onRecordDelete: (recordId: string) => void
  onLoadMore: () => void
  hasMore: boolean
  loadingMore: boolean
}

const ROW_HEIGHT = 48
const HEADER_HEIGHT = 48

export function VirtualTable({
  tableId,
  tableName,
  columns,
  records,
  onRecordUpdate,
  onRecordDelete,
  onLoadMore,
  hasMore,
  loadingMore,
}: VirtualTableProps) {
  const infiniteLoaderRef = useRef<InfiniteLoader>(null)
  const [containerHeight, setContainerHeight] = useState(600)

  useEffect(() => {
    const updateHeight = () => {
      const height = window.innerHeight - 350
      setContainerHeight(Math.max(400, height))
    }
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  // Calculate total width
  const totalWidth = columns.reduce((sum, col) => sum + (col.width || 150), 0) + 60

  // Determine if item is loaded
  const isItemLoaded = (index: number) => !hasMore || index < records.length

  // Load more items
  const loadMoreItems = useCallback(
    (startIndex: number, stopIndex: number) => {
      if (!loadingMore && hasMore) {
        onLoadMore()
      }
      return Promise.resolve()
    },
    [loadingMore, hasMore, onLoadMore]
  )

  // Total item count (records + 1 loading row if hasMore)
  const itemCount = hasMore ? records.length + 1 : records.length

  // Convert API record to UltraTableRow format
  const toUltraTableRow = (record: any): UltraTableRow => ({
    id: record.id,
    tableId: record.table_id,
    data: record.data || {},
    level: 0,
    order: record.position || 0,
    expanded: false,
    createdAt: new Date(record.created_at),
    updatedAt: new Date(record.updated_at),
    createdBy: record.created_by || '',
  })

  // Convert API column to UltraTableColumn format
  const toUltraTableColumn = (column: any): UltraTableColumn => ({
    id: column.id,
    tableId: column.table_id || tableId,
    name: column.name,
    key: column.id,
    type: column.type,
    config: column.config || {},
    visible: true,
    order: column.position || 0,
    width: column.width || 150,
    createdAt: new Date(column.created_at || Date.now()),
    updatedAt: new Date(column.updated_at || Date.now()),
  })

  const Row = useCallback(
    ({ index, style }: any) => {
      // Loading row
      if (!isItemLoaded(index)) {
        return (
          <div
            style={style}
            className="flex items-center justify-center border-b border-slate-200 bg-slate-50"
          >
            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
            <span className="ml-2 text-slate-500 text-sm">Laadin...</span>
          </div>
        )
      }

      const record = records[index]
      if (!record) return null

      const ultraRow = toUltraTableRow(record)

      return (
        <div
          style={{ ...style, minWidth: totalWidth }}
          className="flex items-center border-b border-slate-200 hover:bg-slate-50 group"
        >
          {columns.map((column) => {
            const ultraColumn = toUltraTableColumn(column)
            return (
              <div
                key={column.id}
                className="px-3 py-2 border-r border-slate-200 overflow-hidden flex-shrink-0"
                style={{ width: column.width || 150, minWidth: column.width || 150 }}
              >
                <DynamicCell
                  column={ultraColumn}
                  value={record.data?.[column.id]}
                  row={ultraRow}
                  onChange={(value) => {
                    onRecordUpdate(record.id, {
                      ...record.data,
                      [column.id]: value,
                    })
                  }}
                />
              </div>
            )
          })}
          <div className="px-3 py-2 flex-shrink-0" style={{ width: 60 }}>
            <button
              onClick={() => onRecordDelete(record.id)}
              className="p-1.5 rounded-md opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all"
            >
              <Trash2 className="w-4 h-4 text-red-600" />
            </button>
          </div>
        </div>
      )
    },
    [columns, records, onRecordUpdate, onRecordDelete, hasMore, totalWidth, tableId]
  )

  return (
    <div className="border rounded-lg bg-white overflow-hidden">
      {/* Header */}
      <div
        className="flex items-center border-b border-slate-200 bg-slate-50 font-medium sticky top-0 z-10 overflow-x-auto"
        style={{ height: HEADER_HEIGHT, minWidth: totalWidth }}
      >
        {columns.map((column) => (
          <div
            key={column.id}
            className="px-3 py-3 border-r border-slate-200 text-sm text-slate-700 truncate flex-shrink-0"
            style={{ width: column.width || 150, minWidth: column.width || 150 }}
          >
            {column.name}
          </div>
        ))}
        <div className="px-3 py-3 text-sm text-slate-700 flex-shrink-0" style={{ width: 60 }}>
          {/* Actions column */}
        </div>
      </div>

      {/* Virtual Scrolling Body with Infinite Loader */}
      <div className="overflow-x-auto">
        {records.length > 0 ? (
          <InfiniteLoader
            ref={infiniteLoaderRef}
            isItemLoaded={isItemLoaded}
            itemCount={itemCount}
            loadMoreItems={loadMoreItems}
            threshold={10}
          >
            {({ onItemsRendered, ref }) => (
              <List
                ref={ref}
                height={containerHeight}
                itemCount={itemCount}
                itemSize={ROW_HEIGHT}
                width="100%"
                onItemsRendered={onItemsRendered}
                overscanCount={5}
                style={{ minWidth: totalWidth }}
              >
                {Row}
              </List>
            )}
          </InfiniteLoader>
        ) : (
          <div className="flex items-center justify-center h-64 text-slate-500">
            <div className="text-center">
              <p className="text-lg font-medium">Andmeid pole veel</p>
              <p className="text-sm mt-1">Lisa esimene rida, et alustada</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
