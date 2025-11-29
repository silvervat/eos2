'use client'

import { Images as ImagesIcon } from 'lucide-react'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const ImagesColumn: ColumnTypeDefinition = {
  type: 'images',
  name: 'Images',
  description: 'Multiple images gallery',
  category: 'media',
  icon: ImagesIcon,
  defaultConfig: { images: { maxCount: 10, maxSize: 5, layout: 'grid' } },
  defaultValue: [],

  CellRenderer: ({ value }: CellRendererProps) => {
    const images = Array.isArray(value) ? value : []
    if (images.length === 0) return null
    return (
      <div className="flex -space-x-2">
        {images.slice(0, 4).map((img: any, i: number) => (
          <div key={i} className="w-8 h-8 rounded border-2 border-background overflow-hidden bg-muted">
            <img src={typeof img === 'object' ? img.url : img} alt="" className="w-full h-full object-cover" />
          </div>
        ))}
        {images.length > 4 && (
          <div className="w-8 h-8 rounded bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
            +{images.length - 4}
          </div>
        )}
      </div>
    )
  },
  format: (value) => (Array.isArray(value) ? `${value.length} images` : ''),
  supportedAggregations: ['count'],
}
