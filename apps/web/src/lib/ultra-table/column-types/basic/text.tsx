'use client'

import { Type } from 'lucide-react'
import { Input } from '@rivest/ui'
import type { ColumnTypeDefinition, CellRendererProps, TEXT_FILTER_OPERATORS } from '../types'

export const TextColumn: ColumnTypeDefinition = {
  type: 'text',
  name: 'Text',
  description: 'Single line text',
  category: 'basic',
  icon: Type,

  defaultConfig: {
    text: {
      maxLength: undefined,
      placeholder: '',
    },
  },

  defaultValue: '',

  CellRenderer: ({ value, isEditing, onChange }: CellRendererProps) => {
    if (isEditing) {
      return (
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-sm border-0 focus-visible:ring-1"
          autoFocus
        />
      )
    }

    return (
      <span className="truncate text-sm">{value || ''}</span>
    )
  },

  validate: (value, config) => {
    if (!value) return true

    const maxLength = config.text?.maxLength
    if (maxLength && String(value).length > maxLength) {
      return `Maximum ${maxLength} characters allowed`
    }

    return true
  },

  format: (value) => String(value ?? ''),

  parse: (value) => value,

  sort: (a, b) => String(a ?? '').localeCompare(String(b ?? '')),

  filter: (value, filterValue, operator) => {
    const strValue = String(value ?? '').toLowerCase()
    const strFilter = String(filterValue ?? '').toLowerCase()

    switch (operator) {
      case 'equals':
        return strValue === strFilter
      case 'not_equals':
        return strValue !== strFilter
      case 'contains':
        return strValue.includes(strFilter)
      case 'not_contains':
        return !strValue.includes(strFilter)
      case 'starts_with':
        return strValue.startsWith(strFilter)
      case 'ends_with':
        return strValue.endsWith(strFilter)
      case 'is_empty':
        return !value || strValue === ''
      case 'is_not_empty':
        return !!value && strValue !== ''
      default:
        return true
    }
  },

  getFilterOperators: () => [
    { value: 'contains', label: 'Contains' },
    { value: 'not_contains', label: 'Does not contain' },
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Does not equal' },
    { value: 'starts_with', label: 'Starts with' },
    { value: 'ends_with', label: 'Ends with' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],

  supportedAggregations: ['count', 'count_unique', 'count_empty', 'count_not_empty'],

  aggregate: (values, aggregation) => {
    switch (aggregation) {
      case 'count':
        return values.length
      case 'count_unique':
        return new Set(values.filter(v => v != null)).size
      case 'count_empty':
        return values.filter(v => !v || v === '').length
      case 'count_not_empty':
        return values.filter(v => v && v !== '').length
      default:
        return null
    }
  },

  exportValue: (value) => String(value ?? ''),

  importValue: (value) => value,

  supportsAutoFill: true,
}
