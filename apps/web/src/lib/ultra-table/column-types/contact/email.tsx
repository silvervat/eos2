'use client'

import { Mail } from 'lucide-react'
import { Input } from '@rivest/ui'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const EmailColumn: ColumnTypeDefinition = {
  type: 'email',
  name: 'Email',
  description: 'Email address',
  category: 'contact',
  icon: Mail,
  defaultConfig: {},
  defaultValue: null,

  CellRenderer: ({ value, isEditing, onChange }: CellRendererProps) => {
    if (isEditing) {
      return (
        <Input
          type="email"
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="h-8 text-sm border-0"
          autoFocus
        />
      )
    }
    if (!value) return null
    return (
      <a href={`mailto:${value}`} className="text-sm text-primary hover:underline truncate">
        {value}
      </a>
    )
  },

  validate: (value) => {
    if (!value) return true
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value) || 'Invalid email address'
  },

  format: (value) => value || '',
  sort: (a, b) => String(a || '').localeCompare(String(b || '')),
  supportedAggregations: ['count', 'count_unique'],
}
