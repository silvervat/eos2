'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button, Badge, cn } from '@rivest/ui'
import { GripVertical, Eye, EyeOff, Trash2 } from 'lucide-react'
import { getColumnType } from '@/lib/ultra-table/column-types/registry'
import type { UltraTableColumn } from '@/types/ultra-table'

interface ColumnListProps {
  columns: UltraTableColumn[]
  selectedId?: string
  onSelect: (column: UltraTableColumn) => void
  onToggleVisibility: (columnId: string) => void
  onDelete: (columnId: string) => void
}

export function ColumnList({
  columns,
  selectedId,
  onSelect,
  onToggleVisibility,
  onDelete
}: ColumnListProps) {
  if (columns.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No columns yet</p>
        <p className="text-sm">Click "Add Column" to get started</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {columns.map(column => (
        <SortableColumnItem
          key={column.id}
          column={column}
          isSelected={column.id === selectedId}
          onSelect={() => onSelect(column)}
          onToggleVisibility={() => onToggleVisibility(column.id)}
          onDelete={() => onDelete(column.id)}
        />
      ))}
    </div>
  )
}

interface SortableColumnItemProps {
  column: UltraTableColumn
  isSelected: boolean
  onSelect: () => void
  onToggleVisibility: () => void
  onDelete: () => void
}

function SortableColumnItem({
  column,
  isSelected,
  onSelect,
  onToggleVisibility,
  onDelete
}: SortableColumnItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: column.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  const columnType = getColumnType(column.type)
  const Icon = columnType.icon

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
        isSelected
          ? 'bg-[#279989]/10 border-[#279989]'
          : 'bg-background hover:bg-muted/50 border-border',
        isDragging && 'opacity-50',
        !column.visible && 'opacity-60'
      )}
      onClick={onSelect}
    >
      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-5 w-5 text-muted-foreground" />
      </div>

      {/* Column Icon & Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="font-medium text-sm truncate">{column.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {columnType.name}
          </Badge>
          <span className="text-xs text-muted-foreground truncate">
            {column.key}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8"
          onClick={(e) => {
            e.stopPropagation()
            onToggleVisibility()
          }}
        >
          {column.visible ? (
            <Eye className="h-4 w-4 text-muted-foreground" />
          ) : (
            <EyeOff className="h-4 w-4 text-muted-foreground/50" />
          )}
        </Button>

        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
