'use client'

import { ExternalLink } from 'lucide-react'
import { Button } from '@rivest/ui'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const LinkColumn: ColumnTypeDefinition = {
  type: 'link',
  name: 'Link Button',
  description: 'External link button',
  category: 'visual',
  icon: ExternalLink,
  defaultConfig: {},
  defaultValue: null,

  CellRenderer: ({ value }: CellRendererProps) => {
    if (!value) return null
    const url = typeof value === 'object' ? value.url : value
    const label = typeof value === 'object' ? value.label : 'Open'

    return (
      <Button
        size="sm"
        variant="outline"
        className="h-7 text-xs"
        asChild
      >
        <a href={url} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-3 w-3 mr-1" />
          {label}
        </a>
      </Button>
    )
  },

  format: (value) => (value ? (typeof value === 'object' ? value.url : value) : ''),
  supportedAggregations: ['count'],
}
