'use client'

import { useState } from 'react'
import { Button, Input, Label, Card, Tabs, TabsContent, TabsList, TabsTrigger, Switch, Textarea } from '@rivest/ui'
import { X, Save } from 'lucide-react'
import { getColumnType } from '@/lib/ultra-table/column-types/registry'
import type { UltraTableColumn, ColumnConfig } from '@/types/ultra-table'

interface ColumnEditorProps {
  column: UltraTableColumn
  onUpdate: (updates: Partial<UltraTableColumn>) => void
  onClose: () => void
}

export function ColumnEditor({ column, onUpdate, onClose }: ColumnEditorProps) {
  const [localColumn, setLocalColumn] = useState(column)
  const columnType = getColumnType(column.type)
  const Icon = columnType.icon

  const handleSave = () => {
    onUpdate(localColumn)
  }

  const updateField = <K extends keyof UltraTableColumn>(
    field: K,
    value: UltraTableColumn[K]
  ) => {
    setLocalColumn(prev => ({ ...prev, [field]: value }))
  }

  const updateConfig = (configUpdates: Partial<ColumnConfig>) => {
    setLocalColumn(prev => ({
      ...prev,
      config: { ...prev.config, ...configUpdates }
    }))
  }

  return (
    <Card className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <Icon className="h-5 w-5 text-[#279989]" />
          <div>
            <h3 className="font-semibold">{localColumn.name}</h3>
            <p className="text-sm text-muted-foreground">{columnType.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={handleSave} className="bg-[#279989] hover:bg-[#1f7a6e]">
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <Tabs defaultValue="basic" className="space-y-4">
          <TabsList>
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="config">Configuration</TabsTrigger>
            <TabsTrigger value="display">Display</TabsTrigger>
            <TabsTrigger value="validation">Validation</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Column Name</Label>
              <Input
                id="name"
                value={localColumn.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Enter column name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="key">Column Key</Label>
              <Input
                id="key"
                value={localColumn.key}
                onChange={(e) => updateField('key', e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                placeholder="column_key"
                className="font-mono"
              />
              <p className="text-xs text-muted-foreground">
                Used in formulas and API. No spaces allowed.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Visible</Label>
                <p className="text-xs text-muted-foreground">Show column in table</p>
              </div>
              <Switch
                checked={localColumn.visible}
                onCheckedChange={(checked) => updateField('visible', checked)}
              />
            </div>
          </TabsContent>

          <TabsContent value="config" className="space-y-4">
            <ColumnTypeConfig
              type={column.type}
              config={localColumn.config}
              onUpdate={updateConfig}
            />
          </TabsContent>

          <TabsContent value="display" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="width">Column Width (px)</Label>
              <Input
                id="width"
                type="number"
                value={localColumn.width || ''}
                onChange={(e) => updateField('width', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="Auto"
              />
            </div>

            <div className="space-y-2">
              <Label>Pin Column</Label>
              <div className="flex gap-2">
                {(['left', 'right', undefined] as const).map((pin) => (
                  <Button
                    key={pin || 'none'}
                    variant={localColumn.pinned === pin ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateField('pinned', pin)}
                  >
                    {pin || 'None'}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="validation" className="space-y-4">
            {column.type === 'formula' ? (
              <div className="space-y-2">
                <Label htmlFor="formula">Formula Expression</Label>
                <Textarea
                  id="formula"
                  value={localColumn.formula || ''}
                  onChange={(e) => updateField('formula', e.target.value)}
                  placeholder="e.g. {price} * {quantity}"
                  className="font-mono"
                  rows={4}
                />
                <p className="text-xs text-muted-foreground">
                  Use {'{column_key}'} to reference other columns
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                Validation rules coming soon...
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  )
}

// Type-specific configuration component
function ColumnTypeConfig({
  type,
  config,
  onUpdate
}: {
  type: string
  config: ColumnConfig
  onUpdate: (updates: Partial<ColumnConfig>) => void
}) {
  switch (type) {
    case 'number':
    case 'currency':
    case 'percent':
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Minimum</Label>
              <Input
                type="number"
                value={config.number?.min ?? ''}
                onChange={(e) => onUpdate({
                  number: { ...config.number, min: e.target.value ? Number(e.target.value) : undefined }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Maximum</Label>
              <Input
                type="number"
                value={config.number?.max ?? ''}
                onChange={(e) => onUpdate({
                  number: { ...config.number, max: e.target.value ? Number(e.target.value) : undefined }
                })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Decimal Places</Label>
            <Input
              type="number"
              min={0}
              max={10}
              value={config.number?.decimals ?? 0}
              onChange={(e) => onUpdate({
                number: { ...config.number, decimals: Number(e.target.value) }
              })}
            />
          </div>
        </div>
      )

    case 'dropdown':
    case 'multi_select':
      return (
        <div className="space-y-4">
          <Label>Options</Label>
          <p className="text-sm text-muted-foreground">
            Configure dropdown options in the options editor (coming soon)
          </p>
        </div>
      )

    case 'rating':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Maximum Rating</Label>
            <Input
              type="number"
              min={1}
              max={10}
              value={config.rating?.max ?? 5}
              onChange={(e) => onUpdate({
                rating: { ...config.rating, max: Number(e.target.value) }
              })}
            />
          </div>
          <div className="space-y-2">
            <Label>Color</Label>
            <Input
              type="color"
              value={config.rating?.color ?? '#fbbf24'}
              onChange={(e) => onUpdate({
                rating: { ...config.rating, color: e.target.value }
              })}
            />
          </div>
        </div>
      )

    default:
      return (
        <p className="text-muted-foreground text-sm">
          No additional configuration for this column type.
        </p>
      )
  }
}
