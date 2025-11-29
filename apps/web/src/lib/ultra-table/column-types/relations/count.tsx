'use client'

import { Hash } from 'lucide-react'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const CountColumn: ColumnTypeDefinition = {
  type: 'count',
  name: 'Count',
  description: 'Count linked records',
  category: 'relations',
  icon: Hash,
  defaultConfig: {
    count: {
      relationFieldId: '',
    },
  },
  defaultValue: 0,
  isReadOnly: true,

  CellRenderer: ({ value }: CellRendererProps) => {
    const count = Number(value) || 0
    return (
      <span className="text-sm font-medium tabular-nums text-muted-foreground">
        {count}
      </span>
    )
  },

  format: (value) => String(value || 0),

  sort: (a, b) => (Number(a) || 0) - (Number(b) || 0),

  supportedAggregations: ['sum', 'avg', 'min', 'max'],

  aggregate: (values, aggregation) => {
    const nums = values.map((v) => Number(v) || 0)
    switch (aggregation) {
      case 'sum':
        return nums.reduce((a, b) => a + b, 0)
      case 'avg':
        return nums.length > 0 ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : 0
      case 'min':
        return nums.length > 0 ? Math.min(...nums) : 0
      case 'max':
        return nums.length > 0 ? Math.max(...nums) : 0
      default:
        return null
    }
  },
}
