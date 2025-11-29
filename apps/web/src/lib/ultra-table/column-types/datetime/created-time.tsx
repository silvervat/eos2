'use client'

import { CalendarPlus } from 'lucide-react'
import { format, isValid } from 'date-fns'
import { et } from 'date-fns/locale'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const CreatedTimeColumn: ColumnTypeDefinition = {
  type: 'created_time',
  name: 'Created Time',
  description: 'Auto-set when row is created',
  category: 'datetime',
  icon: CalendarPlus,

  defaultConfig: {
    date: {
      format: 'dd.MM.yyyy HH:mm',
    },
  },

  defaultValue: null,
  isReadOnly: true,

  CellRenderer: ({ value, column }: CellRendererProps) => {
    if (!value) return null

    const date = new Date(value)
    if (!isValid(date)) return null

    const dateFormat = column.config.date?.format || 'dd.MM.yyyy HH:mm'

    return (
      <span className="text-sm text-muted-foreground">
        {format(date, dateFormat, { locale: et })}
      </span>
    )
  },

  format: (value, config) => {
    if (!value) return ''
    const date = new Date(value)
    if (!isValid(date)) return ''
    return format(date, config.date?.format || 'dd.MM.yyyy HH:mm', { locale: et })
  },

  sort: (a, b) => {
    const dateA = a ? new Date(a).getTime() : 0
    const dateB = b ? new Date(b).getTime() : 0
    return dateA - dateB
  },

  supportedAggregations: ['count', 'min', 'max'],
}
