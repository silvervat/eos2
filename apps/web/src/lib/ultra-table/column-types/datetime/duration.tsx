'use client'

import { Timer } from 'lucide-react'
import { Input } from '@rivest/ui'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const DurationColumn: ColumnTypeDefinition = {
  type: 'duration',
  name: 'Duration',
  description: 'Time duration',
  category: 'datetime',
  icon: Timer,

  defaultConfig: {
    duration: {
      format: 'hh:mm',
      showDays: false,
    },
  },

  defaultValue: null,

  CellRenderer: ({ value, column, isEditing, onChange }: CellRendererProps) => {
    if (isEditing) {
      // Value stored in minutes
      const hours = Math.floor((value || 0) / 60)
      const minutes = (value || 0) % 60
      const inputValue = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`

      return (
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => {
            const [h, m] = e.target.value.split(':').map(Number)
            onChange((h || 0) * 60 + (m || 0))
          }}
          placeholder="00:00"
          className="h-8 text-sm border-0 focus-visible:ring-1"
          autoFocus
        />
      )
    }

    if (value == null) return null

    return (
      <span className="text-sm tabular-nums">
        {formatDuration(value, column.config.duration)}
      </span>
    )
  },

  format: (value, config) => {
    if (value == null) return ''
    return formatDuration(value, config.duration)
  },

  sort: (a, b) => (Number(a) || 0) - (Number(b) || 0),

  supportedAggregations: ['sum', 'avg', 'min', 'max', 'count'],

  aggregate: (values, aggregation) => {
    const nums = values.filter((v) => v != null).map(Number)

    switch (aggregation) {
      case 'sum':
        return formatDuration(nums.reduce((a, b) => a + b, 0))
      case 'avg':
        return nums.length > 0
          ? formatDuration(Math.round(nums.reduce((a, b) => a + b, 0) / nums.length))
          : null
      case 'min':
        return nums.length > 0 ? formatDuration(Math.min(...nums)) : null
      case 'max':
        return nums.length > 0 ? formatDuration(Math.max(...nums)) : null
      case 'count':
        return values.length
      default:
        return null
    }
  },
}

function formatDuration(minutes: number, config?: { format?: string; showDays?: boolean }): string {
  const days = Math.floor(minutes / (24 * 60))
  const hours = Math.floor((minutes % (24 * 60)) / 60)
  const mins = minutes % 60

  if (config?.showDays && days > 0) {
    return `${days}d ${hours}h ${mins}m`
  }

  const totalHours = Math.floor(minutes / 60)
  return `${String(totalHours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
}
