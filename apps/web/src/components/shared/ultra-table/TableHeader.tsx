'use client'

import React from 'react'
import { Checkbox } from '@rivest/ui'
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react'
import { getColumnType } from '@/lib/ultra-table/column-types/registry'
import type { UltraTableColumn, ColumnType } from '@/types/ultra-table'
import { cn } from '@rivest/ui'

interface TableHeaderProps {
  columns: UltraTableColumn[]
  selectedAll: boolean
  onSelectAll: () => void
  sortColumn?: string | null
  sortDirection?: 'asc' | 'desc' | null
  onSort?: (columnKey: string) => void
}

export const TableHeader = React.memo(function TableHeader({
  columns,
  selectedAll,
  onSelectAll,
  sortColumn,
  sortDirection,
  onSort,
}: TableHeaderProps) {
  return (
    <thead className="bg-muted/50 sticky top-0 z-10">
      <tr className="border-b">
        {/* Selection header */}
        <th className="px-4 py-3 w-12">
          <Checkbox
            checked={selectedAll}
            onCheckedChange={onSelectAll}
          />
        </th>

        {/* Column headers */}
        {columns.filter(col => col.visible).map(column => {
          const columnType = getColumnType(column.type as ColumnType)
          const Icon = columnType.icon
          const isSorted = sortColumn === column.key

          return (
            <th
              key={column.id}
              className={cn(
                'px-4 py-3 text-left text-sm font-medium text-foreground',
                'hover:bg-muted/80 cursor-pointer select-none transition-colors'
              )}
              style={{ width: column.width ? `${column.width}px` : 'auto' }}
              onClick={() => onSort?.(column.key)}
            >
              <div className="flex items-center gap-2">
                <Icon className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{column.name}</span>

                {/* Sort indicator */}
                <span className="ml-auto">
                  {isSorted ? (
                    sortDirection === 'asc' ? (
                      <ArrowUp className="h-4 w-4 text-[#279989]" />
                    ) : (
                      <ArrowDown className="h-4 w-4 text-[#279989]" />
                    )
                  ) : (
                    <ArrowUpDown className="h-4 w-4 text-muted-foreground/30" />
                  )}
                </span>
              </div>
            </th>
          )
        })}
      </tr>
    </thead>
  )
})
