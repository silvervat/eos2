'use client'

import { useState } from 'react'
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core'
import { SortableContext, arrayMove, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Button, Card, Sheet, SheetContent } from '@rivest/ui'
import { Plus, Settings } from 'lucide-react'
import { ColumnList } from './ColumnList'
import { ColumnEditor } from './ColumnEditor'
import { ColumnTypeSelector } from './ColumnTypeSelector'
import { getColumnType } from '@/lib/ultra-table/column-types/registry'
import type { UltraTableColumn, ColumnType } from '@/types/ultra-table'

interface ColumnManagerProps {
  tableId: string
  columns: UltraTableColumn[]
  onUpdate: (columns: UltraTableColumn[]) => Promise<void>
}

export function ColumnManager({ tableId, columns, onUpdate }: ColumnManagerProps) {
  const [selectedColumn, setSelectedColumn] = useState<UltraTableColumn | null>(null)
  const [showEditor, setShowEditor] = useState(false)
  const [showTypeSelector, setShowTypeSelector] = useState(false)

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (active.id !== over?.id) {
      const oldIndex = columns.findIndex(col => col.id === active.id)
      const newIndex = columns.findIndex(col => col.id === over!.id)

      const reordered = arrayMove(columns, oldIndex, newIndex).map((col, i) => ({
        ...col,
        order: i
      }))

      onUpdate(reordered)
    }
  }

  const handleAddColumn = (type: ColumnType) => {
    const columnDef = getColumnType(type)
    const newColumn: UltraTableColumn = {
      id: `col_${Date.now()}`,
      tableId,
      name: `New ${columnDef.name}`,
      key: `new_${type}_${Date.now()}`,
      type,
      config: columnDef.defaultConfig as any,
      visible: true,
      order: columns.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    onUpdate([...columns, newColumn])
    setSelectedColumn(newColumn)
    setShowEditor(true)
    setShowTypeSelector(false)
  }

  const handleUpdateColumn = (columnId: string, updates: Partial<UltraTableColumn>) => {
    const updated = columns.map(col =>
      col.id === columnId ? { ...col, ...updates, updatedAt: new Date() } : col
    )
    onUpdate(updated)
  }

  const handleDeleteColumn = (columnId: string) => {
    if (confirm('Are you sure you want to delete this column?')) {
      onUpdate(columns.filter(col => col.id !== columnId))
      if (selectedColumn?.id === columnId) {
        setSelectedColumn(null)
        setShowEditor(false)
      }
    }
  }

  const handleToggleVisibility = (columnId: string) => {
    const updated = columns.map(col =>
      col.id === columnId ? { ...col, visible: !col.visible } : col
    )
    onUpdate(updated)
  }

  return (
    <div className="grid grid-cols-[350px_1fr] gap-6 h-full">
      {/* Left Panel - Column List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Columns</h2>
          <Button
            size="sm"
            onClick={() => setShowTypeSelector(true)}
            className="bg-[#279989] hover:bg-[#1f7a6e]"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Column
          </Button>
        </div>

        <Card className="p-4">
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={columns.map(c => c.id)}
              strategy={verticalListSortingStrategy}
            >
              <ColumnList
                columns={columns}
                selectedId={selectedColumn?.id}
                onSelect={(col) => {
                  setSelectedColumn(col)
                  setShowEditor(true)
                }}
                onToggleVisibility={handleToggleVisibility}
                onDelete={handleDeleteColumn}
              />
            </SortableContext>
          </DndContext>
        </Card>

        {/* Stats */}
        <Card className="p-4">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Columns:</span>
              <span className="font-medium">{columns.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Visible:</span>
              <span className="font-medium">
                {columns.filter(c => c.visible).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hidden:</span>
              <span className="font-medium">
                {columns.filter(c => !c.visible).length}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Formulas:</span>
              <span className="font-medium">
                {columns.filter(c => c.type === 'formula').length}
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Right Panel - Column Editor */}
      <div className="relative">
        {showEditor && selectedColumn ? (
          <ColumnEditor
            column={selectedColumn}
            onUpdate={(updates) => handleUpdateColumn(selectedColumn.id, updates)}
            onClose={() => {
              setShowEditor(false)
              setSelectedColumn(null)
            }}
          />
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <div className="text-center">
              <Settings className="h-16 w-16 mx-auto mb-4 opacity-20" />
              <p>Select a column to edit</p>
              <p className="text-sm mt-2">Or add a new column to get started</p>
            </div>
          </div>
        )}
      </div>

      {/* Column Type Selector Sheet */}
      <Sheet open={showTypeSelector} onOpenChange={setShowTypeSelector}>
        <SheetContent side="right" className="w-[600px] sm:max-w-[600px]">
          <ColumnTypeSelector onSelect={handleAddColumn} />
        </SheetContent>
      </Sheet>
    </div>
  )
}
