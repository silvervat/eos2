'use client'

import { Video } from 'lucide-react'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const VideoColumn: ColumnTypeDefinition = {
  type: 'video',
  name: 'Video',
  description: 'Video upload',
  category: 'media',
  icon: Video,
  defaultConfig: {},
  defaultValue: null,

  CellRenderer: ({ value }: CellRendererProps) => {
    if (!value) return null
    const video = typeof value === 'object' ? value : { name: value, url: value }
    return (
      <div className="flex items-center gap-2">
        <Video className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm truncate">{video.name || 'Video'}</span>
      </div>
    )
  },
  format: (value) => (value ? 'Video' : ''),
  supportedAggregations: ['count'],
}
