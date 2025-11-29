'use client'

import React from 'react'
import { Checkbox } from '@rivest/ui'
import { ChevronRight, ChevronDown } from 'lucide-react'
import { DynamicCell } from './DynamicCell'
import type { UltraTableColumn, UltraTableRow } from '@/types/ultra-table'
import { cn } from '@rivest/ui'

interface TableRowProps {
  row: UltraTableRow
  columns: UltraTableColumn[]
  calculatedValues?: Record<string, any>
  isSelected: boolean
  onSelect: () => void
  onClick?: () => void
  onCellChange?: (columnKey: string, value: any) => void
  style?: React.CSSProperties
  enableSubRows?: boolean
  level?: number
  onExpand?: () => void
  onCollapse?: () => void
}

export const TableRow = React.memo(function TableRow({
  row,
  columns,
  calculatedValues = {},
  isSelected,
  onSelect,
  onClick,
  onCellChange,
  style,
  enableSubRows = false,
  level = 0,
  onExpand,
  onCollapse,
}: TableRowProps) {
  const hasChildren = row.children && row.children.length > 0

  return (
    <tr
      className={cn(
        'border-b transition-colors cursor-pointer',
        'hover:bg-muted/50',
        isSelected && 'bg-[#279989]/10'
      )}
      style={style}
      onClick={onClick}
    >
      {/* Selection checkbox */}
      <td className="px-4 py-3 w-12">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect()}
          onClick={(e) => e.stopPropagation()}
        />
      </td>

      {/* Cells */}
      {columns.filter(col => col.visible).map((column, idx) => {
        const value = calculatedValues[column.key] ?? row.data[column.key]

        return (
          <td
            key={column.id}
            className="px-4 py-3"
            style={{
              width: column.width ? `${column.width}px` : 'auto',
              paddingLeft: idx === 0 && enableSubRows ? `${16 + (level * 24)}px` : undefined,
            }}
          >
            <div className="flex items-center">
              {/* Expand/Collapse for first column if sub-rows */}
              {idx === 0 && enableSubRows && hasChildren && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    row.expanded ? onCollapse?.() : onExpand?.()
                  }}
                  className="inline-flex items-center justify-center w-5 h-5 mr-2 hover:bg-muted rounded"
                >
                  {row.expanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}

              {/* Cell content */}
              <DynamicCell
                column={column}
                value={value}
                row={row}
                onChange={(newValue) => onCellChange?.(column.key, newValue)}
              />
            </div>
          </td>
        )
      })}
    </tr>
  )
})
