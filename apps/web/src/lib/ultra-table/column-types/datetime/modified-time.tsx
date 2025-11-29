'use client'

import { CalendarCog } from 'lucide-react'
import { format, isValid } from 'date-fns'
import { et } from 'date-fns/locale'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const ModifiedTimeColumn: ColumnTypeDefinition = {
  type: 'modified_time',
  name: 'Modified Time',
  description: 'Auto-updated when row changes',
  category: 'datetime',
  icon: CalendarCog,

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
