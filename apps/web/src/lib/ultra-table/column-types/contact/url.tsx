'use client'

import { Link2 } from 'lucide-react'
import { Input } from '@rivest/ui'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const UrlColumn: ColumnTypeDefinition = {
  type: 'url',
  name: 'URL',
  description: 'Web link',
  category: 'contact',
  icon: Link2,
  defaultConfig: {},
  defaultValue: null,

  CellRenderer: ({ value, isEditing, onChange }: CellRendererProps) => {
    if (isEditing) {
      return (
        <Input
          type="url"
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="h-8 text-sm border-0"
          placeholder="https://"
          autoFocus
        />
      )
    }
    if (!value) return null
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm text-primary hover:underline truncate flex items-center gap-1"
      >
        <Link2 className="h-3 w-3" />
        {getDomain(value)}
      </a>
    )
  },

  format: (value) => value || '',
  sort: (a, b) => String(a || '').localeCompare(String(b || '')),
  supportedAggregations: ['count', 'count_unique'],
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname.replace('www.', '')
  } catch {
    return url
  }
}
