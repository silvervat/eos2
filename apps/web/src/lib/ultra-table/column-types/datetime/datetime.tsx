'use client'

import { CalendarClock } from 'lucide-react'
import { Input } from '@rivest/ui'
import { format, isValid } from 'date-fns'
import { et } from 'date-fns/locale'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const DateTimeColumn: ColumnTypeDefinition = {
  type: 'datetime',
  name: 'Date & Time',
  description: 'Date with time',
  category: 'datetime',
  icon: CalendarClock,

  defaultConfig: {
    date: {
      format: 'dd.MM.yyyy HH:mm',
      includeTime: true,
    },
  },

  defaultValue: null,

  CellRenderer: ({ value, column, isEditing, onChange }: CellRendererProps) => {
    const dateFormat = column.config.date?.format || 'dd.MM.yyyy HH:mm'

    if (isEditing) {
      const inputValue = value
        ? new Date(value).toISOString().slice(0, 16)
        : ''
      return (
        <Input
          type="datetime-local"
          value={inputValue}
          onChange={(e) => {
            const date = e.target.value ? new Date(e.target.value) : null
            onChange(date?.toISOString() || null)
          }}
          className="h-8 text-sm border-0 focus-visible:ring-1"
          autoFocus
        />
      )
    }

    if (!value) return null

    const date = new Date(value)
    if (!isValid(date)) return null

    return (
      <span className="text-sm">
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
