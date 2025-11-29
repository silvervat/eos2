'use client'

import { Hash } from 'lucide-react'
import { Input } from '@rivest/ui'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const DecimalColumn: ColumnTypeDefinition = {
  type: 'decimal',
  name: 'Decimal',
  description: 'High-precision decimal numbers',
  category: 'basic',
  icon: Hash,

  defaultConfig: {
    decimal: {
      precision: 10,
      scale: 2,
    },
  },

  defaultValue: null,

  CellRenderer: ({ value, column, isEditing, onChange }: CellRendererProps) => {
    const config = column.config.decimal
    const scale = config?.scale ?? 2

    if (isEditing) {
      return (
        <Input
          type="number"
          value={value ?? ''}
          onChange={(e) => {
            const val = e.target.value === '' ? null : Number(e.target.value)
            onChange(val)
          }}
          step={Math.pow(10, -scale)}
          className="h-8 text-sm text-right border-0 focus-visible:ring-1"
          autoFocus
        />
      )
    }

    if (value == null) return null

    return (
      <span className="text-sm text-right tabular-nums">
        {Number(value).toFixed(scale)}
      </span>
    )
  },

  format: (value, config) => {
    if (value == null) return ''
    return Number(value).toFixed(config.decimal?.scale ?? 2)
  },

  sort: (a, b) => (Number(a) || 0) - (Number(b) || 0),

  supportedAggregations: ['sum', 'avg', 'min', 'max', 'count'],

  aggregate: (values, aggregation) => {
    const nums = values.filter(v => v != null).map(Number).filter(n => !isNaN(n))

    switch (aggregation) {
      case 'sum':
        return nums.reduce((a, b) => a + b, 0)
      case 'avg':
        return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
      case 'min':
        return nums.length > 0 ? Math.min(...nums) : null
      case 'max':
        return nums.length > 0 ? Math.max(...nums) : null
      case 'count':
        return values.length
      default:
        return null
    }
  },
}
