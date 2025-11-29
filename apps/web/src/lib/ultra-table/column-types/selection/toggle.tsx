'use client'

import { ToggleLeft } from 'lucide-react'
import { Switch } from '@rivest/ui'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const ToggleColumn: ColumnTypeDefinition = {
  type: 'toggle',
  name: 'Toggle',
  description: 'Toggle switch (Notion-style)',
  category: 'selection',
  icon: ToggleLeft,

  defaultConfig: {},

  defaultValue: false,

  CellRenderer: ({ value, isEditing, onChange }: CellRendererProps) => {
    return (
      <div className="flex items-center">
        <Switch
          checked={!!value}
          onCheckedChange={(checked) => onChange(checked)}
          disabled={!isEditing}
          className="h-5 w-9"
        />
      </div>
    )
  },

  format: (value) => (value ? 'On' : 'Off'),

  sort: (a, b) => (a ? 1 : 0) - (b ? 1 : 0),

  supportedAggregations: ['count', 'percent_not_empty'],
}
