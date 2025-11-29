'use client'

import { Image as ImageIcon } from 'lucide-react'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const ImageColumn: ColumnTypeDefinition = {
  type: 'image',
  name: 'Image',
  description: 'Single image upload',
  category: 'media',
  icon: ImageIcon,
  defaultConfig: { image: { maxSize: 5, thumbnail: true } },
  defaultValue: null,

  CellRenderer: ({ value }: CellRendererProps) => {
    if (!value) return null
    const url = typeof value === 'object' ? value.url : value
    return (
      <div className="w-10 h-10 rounded overflow-hidden bg-muted">
        <img src={url} alt="" className="w-full h-full object-cover" />
      </div>
    )
  },
  format: (value) => (value ? (typeof value === 'object' ? value.name : 'Image') : ''),
  supportedAggregations: ['count', 'count_empty', 'count_not_empty'],
}
