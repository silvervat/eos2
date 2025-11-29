'use client'

import { Palette } from 'lucide-react'
import { Input } from '@rivest/ui'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const ColorColumn: ColumnTypeDefinition = {
  type: 'color',
  name: 'Color',
  description: 'Color picker',
  category: 'visual',
  icon: Palette,
  defaultConfig: { color: { format: 'hex', allowCustom: true } },
  defaultValue: null,

  CellRenderer: ({ value, isEditing, onChange }: CellRendererProps) => {
    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <Input
            type="color"
            value={value || '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="h-8 w-12 p-0 border-0 cursor-pointer"
          />
          <Input
            type="text"
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder="#000000"
            className="h-8 text-sm border-0 font-mono w-24"
          />
        </div>
      )
    }
    if (!value) return null
    return (
      <div className="flex items-center gap-2">
        <div
          className="w-6 h-6 rounded border"
          style={{ backgroundColor: value }}
        />
        <span className="text-xs font-mono text-muted-foreground">{value}</span>
      </div>
    )
  },

  format: (value) => value || '',
  supportedAggregations: ['count', 'count_unique'],
}
