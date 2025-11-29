'use client'

import { AlignLeft } from 'lucide-react'
import { Textarea } from '@rivest/ui'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const LongTextColumn: ColumnTypeDefinition = {
  type: 'long_text',
  name: 'Long Text',
  description: 'Multi-line text with optional rich text',
  category: 'basic',
  icon: AlignLeft,

  defaultConfig: {
    longText: {
      enableRichText: false,
      enableMarkdown: false,
      minHeight: 60,
      maxHeight: 200,
    },
  },

  defaultValue: '',

  CellRenderer: ({ value, isEditing, onChange }: CellRendererProps) => {
    if (isEditing) {
      return (
        <Textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          className="min-h-[60px] text-sm border-0 focus-visible:ring-1 resize-none"
          autoFocus
        />
      )
    }

    // Show truncated preview in cell
    const displayValue = String(value || '')
    const truncated = displayValue.length > 100
      ? displayValue.slice(0, 100) + '...'
      : displayValue

    return (
      <span className="text-sm text-muted-foreground line-clamp-2">
        {truncated}
      </span>
    )
  },

  validate: (value) => {
    if (value && typeof value !== 'string') {
      return 'Value must be text'
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
      case 'is_empty':
        return !value || strValue === ''
      case 'is_not_empty':
        return !!value && strValue !== ''
      default:
        return true
    }
  },

  supportedAggregations: ['count', 'count_empty', 'count_not_empty'],

  exportValue: (value) => String(value ?? ''),

  importValue: (value) => value,
}
