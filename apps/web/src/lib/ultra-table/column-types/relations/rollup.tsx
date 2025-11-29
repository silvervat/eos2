'use client'

import { Calculator } from 'lucide-react'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const RollupColumn: ColumnTypeDefinition = {
  type: 'rollup',
  name: 'Rollup',
  description: 'Aggregate values from relation',
  category: 'relations',
  icon: Calculator,
  defaultConfig: {
    rollup: {
      relationFieldId: '',
      rollupFieldId: '',
      aggregation: 'sum',
    },
  },
  defaultValue: null,
  isReadOnly: true,

  CellRenderer: ({ value, column }: CellRendererProps) => {
    if (value == null) return null
    const aggregation = column.config.rollup?.aggregation || 'sum'
    return (
      <span className="text-sm font-medium tabular-nums">
        {formatRollupValue(value, aggregation)}
      </span>
    )
  },

  format: (value, config) => {
    if (value == null) return ''
    return formatRollupValue(value, config.rollup?.aggregation || 'sum')
  },

  supportedAggregations: ['sum', 'avg', 'min', 'max'],
}

function formatRollupValue(value: any, aggregation: string): string {
  if (typeof value === 'number') {
    if (aggregation === 'avg') {
      return value.toFixed(2)
    }
    return value.toLocaleString('et-EE')
  }
  return String(value)
}
