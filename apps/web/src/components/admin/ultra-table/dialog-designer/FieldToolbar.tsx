'use client'

import { useDraggable } from '@dnd-kit/core'
import { Card } from '@rivest/ui'
import { getColumnType, getAllColumnTypes, getColumnTypesByCategory } from '@/lib/ultra-table/column-types/registry'
import type { ColumnCategory } from '@/lib/ultra-table/column-types/types'
import type { ColumnType } from '@/types/ultra-table'
import { cn } from '@rivest/ui'
import { Minus, Type, AlignLeft, Layout, LayoutGrid } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  basic: 'Basic Fields',
  selection: 'Selection',
  datetime: 'Date & Time',
  people: 'People',
  media: 'Media',
  contact: 'Contact',
  code: 'Code & Tech',
  relations: 'Relations',
  formulas: 'Formulas',
  visual: 'Visual',
  advanced: 'Advanced',
}

interface FieldToolbarProps {
  tableId: string
  onAddField: (sectionId: string, field: any) => void
}

export function FieldToolbar({ tableId, onAddField }: FieldToolbarProps) {
  const columnTypes = getAllColumnTypes()

  // Group by category
  const groupedTypes = columnTypes.reduce((acc, type) => {
    if (!acc[type.category]) {
      acc[type.category] = []
    }
    acc[type.category].push(type)
    return acc
  }, {} as Record<string, typeof columnTypes>)

  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="font-semibold mb-2">Fields</h3>
        <p className="text-sm text-muted-foreground">
          Drag fields to the canvas
        </p>
      </div>

      {/* Layout Elements */}
      <div>
        <h4 className="text-sm font-medium text-muted-foreground mb-2">
          Layout
        </h4>
        <div className="space-y-1">
          <DraggableLayoutElement type="divider" label="Divider" icon={Minus} />
          <DraggableLayoutElement type="heading" label="Heading" icon={Type} />
          <DraggableLayoutElement type="text" label="Text Block" icon={AlignLeft} />
          <DraggableLayoutElement type="spacer" label="Spacer" icon={Layout} />
          <DraggableLayoutElement type="columns" label="Columns" icon={LayoutGrid} />
        </div>
      </div>

      {/* Field Types */}
      {Object.entries(groupedTypes).map(([category, types]) => (
        <div key={category}>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">
            {CATEGORY_LABELS[category] || category}
          </h4>

          <div className="space-y-1">
            {types.map(type => (
              <DraggableField
                key={type.type}
                type={type.type as ColumnType}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function DraggableField({ type }: { type: ColumnType }) {
  const columnType = getColumnType(type)
  const Icon = columnType.icon

  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `draggable-field-${type}`,
    data: { type: 'field', columnType: type },
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'flex items-center gap-2 p-2 rounded cursor-grab active:cursor-grabbing',
        'hover:bg-muted transition-colors text-sm',
        isDragging && 'opacity-50'
      )}
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span>{columnType.name}</span>
    </div>
  )
}

function DraggableLayoutElement({
  type,
  label,
  icon: Icon,
}: {
  type: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `draggable-layout-${type}`,
    data: { type: 'layout', layoutType: type },
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn(
        'flex items-center gap-2 p-2 rounded cursor-grab active:cursor-grabbing',
        'hover:bg-muted transition-colors text-sm',
        isDragging && 'opacity-50'
      )}
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span>{label}</span>
    </div>
  )
}
