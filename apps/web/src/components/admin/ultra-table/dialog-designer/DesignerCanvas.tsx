'use client'

import { useDroppable } from '@dnd-kit/core'
import { Button, Card } from '@rivest/ui'
import { Plus, Trash2, GripVertical } from 'lucide-react'
import { cn } from '@rivest/ui'
import type { DialogConfig, DialogSection, DialogField } from './useDialogDesigner'

interface DesignerCanvasProps {
  config: DialogConfig
  selectedSection: DialogSection | null
  selectedField: DialogField | null
  onSelectSection: (section: DialogSection | null) => void
  onSelectField: (field: DialogField | null) => void
  onAddSection: (section: DialogSection) => void
  onUpdateSection: (sectionId: string, updates: Partial<DialogSection>) => void
  onDeleteSection: (sectionId: string) => void
  onUpdateField: (fieldId: string, updates: Partial<DialogField>) => void
  onDeleteField: (fieldId: string) => void
}

export function DesignerCanvas({
  config,
  selectedSection,
  selectedField,
  onSelectSection,
  onSelectField,
  onAddSection,
  onUpdateSection,
  onDeleteSection,
  onUpdateField,
  onDeleteField,
}: DesignerCanvasProps) {
  const { setNodeRef } = useDroppable({
    id: 'dialog-canvas',
  })

  const handleAddSection = () => {
    const newSection: DialogSection = {
      id: `section_${Date.now()}`,
      title: 'New Section',
      fields: [],
      layout: { type: 'vertical', gap: 12 },
      order: config.sections.length,
    }
    onAddSection(newSection)
  }

  return (
    <div ref={setNodeRef} className="max-w-4xl mx-auto">
      {/* Dialog Preview Container */}
      <Card className="p-6 bg-white shadow-lg">
        <div className="space-y-6">
          {config.sections.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <p className="text-lg font-medium mb-2">
                Your dialog is empty
              </p>
              <p className="text-sm">
                Drag fields from the toolbar or add a section to get started
              </p>
              <Button className="mt-4" onClick={handleAddSection}>
                <Plus className="h-4 w-4 mr-1" />
                Add Section
              </Button>
            </div>
          ) : (
            config.sections.map(section => (
              <SectionItem
                key={section.id}
                section={section}
                isSelected={selectedSection?.id === section.id}
                selectedFieldId={selectedField?.id}
                onSelectSection={() => onSelectSection(section)}
                onSelectField={onSelectField}
                onUpdate={(updates) => onUpdateSection(section.id, updates)}
                onDelete={() => onDeleteSection(section.id)}
                onUpdateField={onUpdateField}
                onDeleteField={onDeleteField}
              />
            ))
          )}

          {config.sections.length > 0 && (
            <Button
              variant="outline"
              className="w-full border-dashed"
              onClick={handleAddSection}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Section
            </Button>
          )}
        </div>

        {/* Dialog Actions */}
        <div className="mt-6 flex justify-end gap-2 pt-6 border-t">
          {config.cancelButton?.show && (
            <Button variant="outline">
              {config.cancelButton.label}
            </Button>
          )}
          <Button
            className={
              config.submitButton?.variant === 'primary'
                ? 'bg-[#279989] hover:bg-[#1f7a6e]'
                : ''
            }
          >
            {config.submitButton?.label || 'Submit'}
          </Button>
        </div>
      </Card>
    </div>
  )
}

function SectionItem({
  section,
  isSelected,
  selectedFieldId,
  onSelectSection,
  onSelectField,
  onUpdate,
  onDelete,
  onUpdateField,
  onDeleteField,
}: {
  section: DialogSection
  isSelected: boolean
  selectedFieldId?: string
  onSelectSection: () => void
  onSelectField: (field: DialogField | null) => void
  onUpdate: (updates: Partial<DialogSection>) => void
  onDelete: () => void
  onUpdateField: (fieldId: string, updates: Partial<DialogField>) => void
  onDeleteField: (fieldId: string) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `section-${section.id}`,
    data: { type: 'section', sectionId: section.id },
  })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'border-2 rounded-lg p-4 transition-all',
        isSelected
          ? 'border-[#279989] bg-[#279989]/5'
          : 'border-border hover:border-muted-foreground/30',
        isOver && 'border-[#279989] border-dashed'
      )}
      onClick={(e) => {
        e.stopPropagation()
        onSelectSection()
      }}
    >
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
          {section.title ? (
            <h3 className="font-semibold">{section.title}</h3>
          ) : (
            <span className="text-muted-foreground italic">Untitled Section</span>
          )}
        </div>

        <Button
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-destructive hover:text-destructive"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {section.description && (
        <p className="text-sm text-muted-foreground mb-4">{section.description}</p>
      )}

      {/* Fields */}
      <div
        className={cn(
          'space-y-3',
          section.layout?.type === 'grid' && `grid gap-3`,
          section.layout?.type === 'grid' && section.layout.columns === 2 && 'grid-cols-2',
          section.layout?.type === 'grid' && section.layout.columns === 3 && 'grid-cols-3',
          section.layout?.type === 'horizontal' && 'flex flex-wrap gap-3'
        )}
      >
        {section.fields.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground border-2 border-dashed rounded">
            Drop fields here
          </div>
        ) : (
          section.fields.map(field => (
            <FieldItem
              key={field.id}
              field={field}
              isSelected={selectedFieldId === field.id}
              onSelect={() => onSelectField(field)}
              onUpdate={(updates) => onUpdateField(field.id, updates)}
              onDelete={() => onDeleteField(field.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function FieldItem({
  field,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}: {
  field: DialogField
  isSelected: boolean
  onSelect: () => void
  onUpdate: (updates: Partial<DialogField>) => void
  onDelete: () => void
}) {
  return (
    <div
      className={cn(
        'p-3 rounded border-2 cursor-pointer transition-all',
        isSelected
          ? 'border-[#279989] bg-[#279989]/5'
          : 'border-border hover:border-muted-foreground/30',
        field.width === 'half' && 'w-1/2',
        field.width === 'third' && 'w-1/3'
      )}
      onClick={(e) => {
        e.stopPropagation()
        onSelect()
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium">
          {field.label || field.columnKey}
          {field.required && <span className="text-destructive ml-1">*</span>}
        </label>
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6"
          onClick={(e) => {
            e.stopPropagation()
            onDelete()
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Field Preview */}
      <div className="text-sm text-muted-foreground border rounded p-2 bg-muted/50">
        {field.placeholder || `${field.columnType} field`}
      </div>
    </div>
  )
}
