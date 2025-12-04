'use client'

import { useVirtualizer } from '@tanstack/react-virtual'
import { useRef, useCallback, useEffect, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

export interface VirtualListProps<T> {
  /** Items to render */
  items: T[]
  /** Height of each item in pixels */
  itemHeight: number
  /** Height of the container */
  containerHeight?: number | string
  /** Render function for each item */
  renderItem: (item: T, index: number) => ReactNode
  /** Key extractor for items */
  getItemKey: (item: T, index: number) => string | number
  /** Whether more items are being loaded */
  isLoading?: boolean
  /** Whether there are more items to load */
  hasMore?: boolean
  /** Callback when user scrolls near the end */
  onLoadMore?: () => void
  /** How many items from the end to trigger load more */
  loadMoreThreshold?: number
  /** Overscan count for rendering extra items */
  overscan?: number
  /** Custom class for container */
  className?: string
  /** Empty state message */
  emptyMessage?: string
  /** Custom loading component */
  loadingComponent?: ReactNode
}

export function VirtualList<T>({
  items,
  itemHeight,
  containerHeight = 600,
  renderItem,
  getItemKey,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  loadMoreThreshold = 5,
  overscan = 5,
  className = '',
  emptyMessage = 'Andmed puuduvad',
  loadingComponent,
}: VirtualListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef(onLoadMore)

  // Keep loadMore ref updated
  useEffect(() => {
    loadMoreRef.current = onLoadMore
  }, [onLoadMore])

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan,
    getItemKey: (index) => getItemKey(items[index], index),
  })

  const virtualItems = virtualizer.getVirtualItems()

  // Check if we need to load more
  const checkLoadMore = useCallback(() => {
    if (!hasMore || isLoading || !loadMoreRef.current) return

    const lastItem = virtualItems[virtualItems.length - 1]
    if (!lastItem) return

    // If we're within threshold of the end, load more
    if (lastItem.index >= items.length - loadMoreThreshold) {
      loadMoreRef.current()
    }
  }, [virtualItems, items.length, hasMore, isLoading, loadMoreThreshold])

  // Check for load more on scroll
  useEffect(() => {
    checkLoadMore()
  }, [checkLoadMore])

  // Empty state
  if (items.length === 0 && !isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 text-slate-500 ${className}`}>
        {emptyMessage}
      </div>
    )
  }

  const containerStyle = typeof containerHeight === 'number'
    ? { height: containerHeight }
    : { height: containerHeight }

  return (
    <div
      ref={parentRef}
      className={`overflow-auto ${className}`}
      style={containerStyle}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualItems.map((virtualItem) => {
          const item = items[virtualItem.index]
          return (
            <div
              key={virtualItem.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualItem.size}px`,
                transform: `translateY(${virtualItem.start}px)`,
              }}
            >
              {renderItem(item, virtualItem.index)}
            </div>
          )
        })}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-4">
          {loadingComponent || (
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Laadin...</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * Virtual table component for table-based lists
 */
export interface VirtualTableProps<T> {
  items: T[]
  rowHeight: number
  containerHeight?: number | string
  columns: {
    key: string
    header: string
    width?: string
    render: (item: T, index: number) => ReactNode
  }[]
  getRowKey: (item: T, index: number) => string | number
  isLoading?: boolean
  hasMore?: boolean
  onLoadMore?: () => void
  onRowClick?: (item: T, index: number) => void
  emptyMessage?: string
  className?: string
}

export function VirtualTable<T>({
  items,
  rowHeight,
  containerHeight = 600,
  columns,
  getRowKey,
  isLoading = false,
  hasMore = false,
  onLoadMore,
  onRowClick,
  emptyMessage = 'Andmed puuduvad',
  className = '',
}: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)
  const loadMoreRef = useRef(onLoadMore)

  useEffect(() => {
    loadMoreRef.current = onLoadMore
  }, [onLoadMore])

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 10,
    getItemKey: (index) => getRowKey(items[index], index),
  })

  const virtualItems = virtualizer.getVirtualItems()

  // Load more check
  useEffect(() => {
    if (!hasMore || isLoading || !loadMoreRef.current) return

    const lastItem = virtualItems[virtualItems.length - 1]
    if (!lastItem) return

    if (lastItem.index >= items.length - 5) {
      loadMoreRef.current()
    }
  }, [virtualItems, items.length, hasMore, isLoading])

  // Empty state
  if (items.length === 0 && !isLoading) {
    return (
      <div className={`bg-white rounded-xl border ${className}`}>
        <table className="w-full">
          <thead className="bg-slate-50 border-b">
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="text-left py-3 px-4 text-sm font-medium text-slate-600"
                  style={{ width: col.width }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
        </table>
        <div className="flex items-center justify-center py-16 text-slate-500">
          {emptyMessage}
        </div>
      </div>
    )
  }

  const containerStyle = typeof containerHeight === 'number'
    ? { height: containerHeight }
    : { height: containerHeight }

  return (
    <div className={`bg-white rounded-xl border overflow-hidden ${className}`}>
      {/* Fixed header */}
      <table className="w-full">
        <thead className="bg-slate-50 border-b">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className="text-left py-3 px-4 text-sm font-medium text-slate-600"
                style={{ width: col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
      </table>

      {/* Virtual scrolling body */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={containerStyle}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => {
            const item = items[virtualItem.index]
            const isEven = virtualItem.index % 2 === 0

            return (
              <div
                key={virtualItem.key}
                className={`
                  absolute top-0 left-0 w-full flex items-center border-b
                  ${isEven ? 'bg-white' : 'bg-slate-50/50'}
                  ${onRowClick ? 'hover:bg-slate-100 cursor-pointer' : ''}
                `}
                style={{
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                onClick={() => onRowClick?.(item, virtualItem.index)}
              >
                {columns.map((col) => (
                  <div
                    key={col.key}
                    className="py-3 px-4 text-sm text-slate-700 truncate"
                    style={{ width: col.width, flexShrink: 0 }}
                  >
                    {col.render(item, virtualItem.index)}
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex items-center justify-center py-4 border-t">
            <div className="flex items-center gap-2 text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Laadin...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Hook for infinite query with virtual list
 */
export function useInfiniteVirtualList<T>({
  queryKey,
  fetchFn,
  getItemId,
}: {
  queryKey: string[]
  fetchFn: (cursor?: string) => Promise<{ items: T[]; nextCursor: string | null; hasMore: boolean }>
  getItemId: (item: T) => string
}) {
  // This hook would integrate with useInfiniteQuery
  // Implementation depends on specific use case
  return {
    // Return methods to integrate with VirtualList
  }
}

export default VirtualList
