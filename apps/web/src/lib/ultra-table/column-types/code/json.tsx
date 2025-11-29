'use client'

import { Braces } from 'lucide-react'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const JsonColumn: ColumnTypeDefinition = {
  type: 'json',
  name: 'JSON',
  description: 'JSON data editor',
  category: 'code',
  icon: Braces,
  defaultConfig: { json: { validate: true } },
  defaultValue: null,

  CellRenderer: ({ value }: CellRendererProps) => {
    if (!value) return null
    const preview = typeof value === 'object' ? JSON.stringify(value).slice(0, 50) : String(value).slice(0, 50)
    return (
      <code className="text-xs font-mono text-muted-foreground truncate">
        {preview}{preview.length >= 50 ? '...' : ''}
      </code>
    )
  },

  validate: (value) => {
    if (!value) return true
    try {
      if (typeof value === 'string') JSON.parse(value)
      return true
    } catch {
      return 'Invalid JSON'
    }
  },

  format: (value) => (value ? JSON.stringify(value) : ''),
  parse: (value) => {
    try {
      return JSON.parse(value)
    } catch {
      return value
    }
  },
  supportedAggregations: ['count'],
}
