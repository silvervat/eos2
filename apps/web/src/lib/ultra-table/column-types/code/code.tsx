'use client'

import { Code2 } from 'lucide-react'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const CodeColumn: ColumnTypeDefinition = {
  type: 'code',
  name: 'Code',
  description: 'Code snippet with syntax highlighting',
  category: 'code',
  icon: Code2,
  defaultConfig: { code: { language: 'javascript', lineNumbers: true } },
  defaultValue: null,

  CellRenderer: ({ value }: CellRendererProps) => {
    if (!value) return null
    const preview = String(value).split('\n')[0].slice(0, 50)
    return (
      <code className="text-xs font-mono bg-muted px-1 py-0.5 rounded truncate">
        {preview}{preview.length >= 50 ? '...' : ''}
      </code>
    )
  },
  format: (value) => value || '',
  supportedAggregations: ['count'],
}
