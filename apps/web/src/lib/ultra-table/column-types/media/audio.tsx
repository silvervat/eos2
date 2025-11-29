'use client'

import { Music } from 'lucide-react'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const AudioColumn: ColumnTypeDefinition = {
  type: 'audio',
  name: 'Audio',
  description: 'Audio upload',
  category: 'media',
  icon: Music,
  defaultConfig: {},
  defaultValue: null,

  CellRenderer: ({ value }: CellRendererProps) => {
    if (!value) return null
    const audio = typeof value === 'object' ? value : { name: value, url: value }
    return (
      <div className="flex items-center gap-2">
        <Music className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm truncate">{audio.name || 'Audio'}</span>
      </div>
    )
  },
  format: (value) => (value ? 'Audio' : ''),
  supportedAggregations: ['count'],
}
