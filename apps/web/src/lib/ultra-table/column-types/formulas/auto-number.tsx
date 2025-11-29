'use client'

import { ListOrdered } from 'lucide-react'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const AutoNumberColumn: ColumnTypeDefinition = {
  type: 'auto_number',
  name: 'Auto Number',
  description: 'Auto-incrementing number',
  category: 'formulas',
  icon: ListOrdered,
  defaultConfig: {},
  defaultValue: null,
  isReadOnly: true,

  CellRenderer: ({ value }: CellRendererProps) => {
    if (value == null) return null
    return <span className="text-sm text-muted-foreground tabular-nums">{value}</span>
  },

  format: (value) => String(value || ''),
  sort: (a, b) => (Number(a) || 0) - (Number(b) || 0),
  supportedAggregations: ['count', 'min', 'max'],
}
