'use client'

import { Search } from 'lucide-react'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const LookupColumn: ColumnTypeDefinition = {
  type: 'lookup',
  name: 'Lookup',
  description: 'Lookup value from relation',
  category: 'relations',
  icon: Search,
  defaultConfig: {
    lookup: {
      relationFieldId: '',
      lookupFieldId: '',
      returnType: 'first',
    },
  },
  defaultValue: null,
  isReadOnly: true,

  CellRenderer: ({ value }: CellRendererProps) => {
    if (!value) return null
    const display = Array.isArray(value) ? value.join(', ') : String(value)
    return <span className="text-sm text-muted-foreground">{display}</span>
  },

  format: (value) => {
    if (!value) return ''
    return Array.isArray(value) ? value.join(', ') : String(value)
  },

  supportedAggregations: ['count'],
}
