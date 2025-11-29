'use client'

import { Clock } from 'lucide-react'
import { Input } from '@rivest/ui'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const TimeColumn: ColumnTypeDefinition = {
  type: 'time',
  name: 'Time',
  description: 'Time only (no date)',
  category: 'datetime',
  icon: Clock,

  defaultConfig: {
    time: {
      format: '24h',
      step: 1,
    },
  },

  defaultValue: null,

  CellRenderer: ({ value, isEditing, onChange }: CellRendererProps) => {
    if (isEditing) {
      return (
        <Input
          type="time"
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="h-8 text-sm border-0 focus-visible:ring-1"
          autoFocus
        />
      )
    }

    if (!value) return null

    return <span className="text-sm tabular-nums">{value}</span>
  },

  format: (value) => value || '',

  sort: (a, b) => String(a || '').localeCompare(String(b || '')),

  supportedAggregations: ['count', 'min', 'max'],
}
