'use client'

import { Calendar } from 'lucide-react'
import { Input } from '@rivest/ui'
import { format, parseISO, isValid } from 'date-fns'
import { et } from 'date-fns/locale'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const DateColumn: ColumnTypeDefinition = {
  type: 'date',
  name: 'Date',
  description: 'Date only',
  category: 'datetime',
  icon: Calendar,

  defaultConfig: {
    date: {
      format: 'dd.MM.yyyy',
      includeTime: false,
    },
  },

  defaultValue: null,

  CellRenderer: ({ value, column, isEditing, onChange }: CellRendererProps) => {
    const dateFormat = column.config.date?.format || 'dd.MM.yyyy'

    if (isEditing) {
      const inputValue = value ? new Date(value).toISOString().split('T')[0] : ''
      return (
        <Input
          type="date"
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
    return format(date, config.date?.format || 'dd.MM.yyyy', { locale: et })
  },

  parse: (value) => {
    if (!value) return null
    const date = new Date(value)
    return isValid(date) ? date.toISOString() : null
  },

  sort: (a, b) => {
    const dateA = a ? new Date(a).getTime() : 0
    const dateB = b ? new Date(b).getTime() : 0
    return dateA - dateB
  },

  supportedAggregations: ['count', 'min', 'max', 'count_empty', 'count_not_empty'],

  aggregate: (values, aggregation, config) => {
    const dates = values
      .filter((v) => v != null)
      .map((v) => new Date(v))
      .filter((d) => isValid(d))

    switch (aggregation) {
      case 'count':
        return values.length
      case 'min':
        return dates.length > 0
          ? format(new Date(Math.min(...dates.map((d) => d.getTime()))), config.date?.format || 'dd.MM.yyyy')
          : null
      case 'max':
        return dates.length > 0
          ? format(new Date(Math.max(...dates.map((d) => d.getTime()))), config.date?.format || 'dd.MM.yyyy')
          : null
      case 'count_empty':
        return values.filter((v) => v == null).length
      case 'count_not_empty':
        return values.filter((v) => v != null).length
      default:
        return null
    }
  },

  exportValue: (value) => (value ? new Date(value).toISOString().split('T')[0] : ''),

  importValue: (value) => {
    if (!value) return null
    const date = new Date(value)
    return isValid(date) ? date.toISOString() : null
  },
}
