'use client'

import { Button, Input, Label, Switch, Tabs, TabsContent, TabsList, TabsTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@rivest/ui'
import { Settings, Columns, Eye, Zap } from 'lucide-react'
import type { DialogSection, DialogField } from './useDialogDesigner'

interface PropertiesPanelProps {
  selectedSection: DialogSection | null
  selectedField: DialogField | null
  onUpdateSection: (sectionId: string, updates: Partial<DialogSection>) => void
  onUpdateField: (fieldId: string, updates: Partial<DialogField>) => void
}

export function PropertiesPanel({
  selectedSection,
  selectedField,
  onUpdateSection,
  onUpdateField,
}: PropertiesPanelProps) {
  if (!selectedSection && !selectedField) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <div className="text-center p-4">
          <Settings className="h-12 w-12 mx-auto mb-4 opacity-20" />
          <p className="font-medium">No Selection</p>
          <p className="text-sm mt-2">
            Select a section or field to edit its properties
          </p>
        </div>
      </div>
    )
  }

  if (selectedField) {
    return (
      <FieldProperties
        field={selectedField}
        onUpdate={(updates) => onUpdateField(selectedField.id, updates)}
      />
    )
  }

  if (selectedSection) {
    return (
      <SectionProperties
        section={selectedSection}
        onUpdate={(updates) => onUpdateSection(selectedSection.id, updates)}
      />
    )
  }

  return null
}

function SectionProperties({
  section,
  onUpdate,
}: {
  section: DialogSection
  onUpdate: (updates: Partial<DialogSection>) => void
}) {
  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="font-semibold mb-1">Section Properties</h3>
        <p className="text-sm text-muted-foreground">
          Configure section settings
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="w-full">
          <TabsTrigger value="general" className="flex-1">General</TabsTrigger>
          <TabsTrigger value="layout" className="flex-1">Layout</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="section-title">Title</Label>
            <Input
              id="section-title"
              value={section.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Section title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="section-description">Description</Label>
            <Input
              id="section-description"
              value={section.description || ''}
              onChange={(e) => onUpdate({ description: e.target.value })}
              placeholder="Optional description"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Collapsible</Label>
              <p className="text-xs text-muted-foreground">Allow section to collapse</p>
            </div>
            <Switch
              checked={section.collapsible || false}
              onCheckedChange={(checked) => onUpdate({ collapsible: checked })}
            />
          </div>

          {section.collapsible && (
            <div className="flex items-center justify-between">
              <div>
                <Label>Start Collapsed</Label>
                <p className="text-xs text-muted-foreground">Initially collapsed</p>
              </div>
              <Switch
                checked={section.collapsed || false}
                onCheckedChange={(checked) => onUpdate({ collapsed: checked })}
              />
            </div>
          )}
        </TabsContent>

        <TabsContent value="layout" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Layout Type</Label>
            <Select
              value={section.layout?.type || 'vertical'}
              onValueChange={(value) =>
                onUpdate({ layout: { ...section.layout, type: value as 'vertical' | 'horizontal' | 'grid' } })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vertical">Vertical (Stack)</SelectItem>
                <SelectItem value="horizontal">Horizontal (Row)</SelectItem>
                <SelectItem value="grid">Grid</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {section.layout?.type === 'grid' && (
            <div className="space-y-2">
              <Label>Columns</Label>
              <Select
                value={String(section.layout?.columns || 2)}
                onValueChange={(value) =>
                  onUpdate({ layout: { ...section.layout, columns: Number(value) } })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 Columns</SelectItem>
                  <SelectItem value="3">3 Columns</SelectItem>
                  <SelectItem value="4">4 Columns</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="section-gap">Gap (px)</Label>
            <Input
              id="section-gap"
              type="number"
              value={section.layout?.gap || 12}
              onChange={(e) =>
                onUpdate({ layout: { ...section.layout, gap: Number(e.target.value) } })
              }
              min={0}
              max={48}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function FieldProperties({
  field,
  onUpdate,
}: {
  field: DialogField
  onUpdate: (updates: Partial<DialogField>) => void
}) {
  return (
    <div className="p-4 space-y-6">
      <div>
        <h3 className="font-semibold mb-1">Field Properties</h3>
        <p className="text-sm text-muted-foreground">
          Configure field settings
        </p>
      </div>

      <Tabs defaultValue="general">
        <TabsList className="w-full">
          <TabsTrigger value="general" className="flex-1">
            <Settings className="h-3 w-3 mr-1" />
            General
          </TabsTrigger>
          <TabsTrigger value="display" className="flex-1">
            <Eye className="h-3 w-3 mr-1" />
            Display
          </TabsTrigger>
          <TabsTrigger value="logic" className="flex-1">
            <Zap className="h-3 w-3 mr-1" />
            Logic
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="field-label">Label</Label>
            <Input
              id="field-label"
              value={field.label || ''}
              onChange={(e) => onUpdate({ label: e.target.value })}
              placeholder="Field label"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="field-placeholder">Placeholder</Label>
            <Input
              id="field-placeholder"
              value={field.placeholder || ''}
              onChange={(e) => onUpdate({ placeholder: e.target.value })}
              placeholder="Placeholder text"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Required</Label>
              <p className="text-xs text-muted-foreground">Field is required</p>
            </div>
            <Switch
              checked={field.required || false}
              onCheckedChange={(checked) => onUpdate({ required: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Disabled</Label>
              <p className="text-xs text-muted-foreground">Field is read-only</p>
            </div>
            <Switch
              checked={field.disabled || false}
              onCheckedChange={(checked) => onUpdate({ disabled: checked })}
            />
          </div>
        </TabsContent>

        <TabsContent value="display" className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Width</Label>
            <Select
              value={field.width || 'full'}
              onValueChange={(value) =>
                onUpdate({ width: value as 'full' | 'half' | 'third' })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="full">Full Width</SelectItem>
                <SelectItem value="half">Half Width</SelectItem>
                <SelectItem value="third">1/3 Width</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Hidden</Label>
              <p className="text-xs text-muted-foreground">Hide field initially</p>
            </div>
            <Switch
              checked={field.hidden || false}
              onCheckedChange={(checked) => onUpdate({ hidden: checked })}
            />
          </div>
        </TabsContent>

        <TabsContent value="logic" className="space-y-4 mt-4">
          <div className="py-8 text-center text-muted-foreground">
            <Zap className="h-8 w-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">Conditional logic coming soon</p>
            <p className="text-xs mt-1">Show/hide fields based on conditions</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
