'use client'

import { Phone } from 'lucide-react'
import { Input } from '@rivest/ui'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const PhoneColumn: ColumnTypeDefinition = {
  type: 'phone',
  name: 'Phone',
  description: 'Phone number',
  category: 'contact',
  icon: Phone,
  defaultConfig: {},
  defaultValue: null,

  CellRenderer: ({ value, isEditing, onChange }: CellRendererProps) => {
    if (isEditing) {
      return (
        <Input
          type="tel"
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="h-8 text-sm border-0"
          autoFocus
        />
      )
    }
    if (!value) return null
    return (
      <a href={`tel:${value}`} className="text-sm text-primary hover:underline">
        {value}
      </a>
    )
  },

  format: (value) => value || '',
  sort: (a, b) => String(a || '').localeCompare(String(b || '')),
  supportedAggregations: ['count', 'count_unique'],
}
