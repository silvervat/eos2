'use client'

import { Percent } from 'lucide-react'
import { Input } from '@rivest/ui'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const PercentColumn: ColumnTypeDefinition = {
  type: 'percent',
  name: 'Percent',
  description: 'Percentage values',
  category: 'basic',
  icon: Percent,

  defaultConfig: {
    percent: {
      decimals: 0,
      showSymbol: true,
    },
  },

  defaultValue: null,

  CellRenderer: ({ value, column, isEditing, onChange }: CellRendererProps) => {
    const config = column.config.percent
    const decimals = config?.decimals ?? 0

    if (isEditing) {
      return (
        <Input
          type="number"
          value={value ?? ''}
          onChange={(e) => {
            const val = e.target.value === '' ? null : Number(e.target.value)
            onChange(val)
          }}
          step={Math.pow(10, -decimals)}
          className="h-8 text-sm text-right border-0 focus-visible:ring-1"
          autoFocus
        />
      )
    }

    if (value == null) return null

    const formatted = value.toFixed(decimals)

    return (
      <span className="text-sm text-right tabular-nums">
        {formatted}{config?.showSymbol !== false && '%'}
      </span>
    )
  },

  format: (value, config) => {
    if (value == null) return ''
    const decimals = config.percent?.decimals ?? 0
    return `${value.toFixed(decimals)}%`
  },

  sort: (a, b) => (Number(a) || 0) - (Number(b) || 0),

  supportedAggregations: ['avg', 'min', 'max', 'count'],

  aggregate: (values, aggregation) => {
    const nums = values.filter(v => v != null).map(Number).filter(n => !isNaN(n))

    switch (aggregation) {
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
