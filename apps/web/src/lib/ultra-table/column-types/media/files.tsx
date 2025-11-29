'use client'

import { Files as FilesIcon } from 'lucide-react'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const FilesColumn: ColumnTypeDefinition = {
  type: 'files',
  name: 'Files',
  description: 'Multiple file uploads',
  category: 'media',
  icon: FilesIcon,
  defaultConfig: { files: { maxCount: 10, maxSize: 10 } },
  defaultValue: [],

  CellRenderer: ({ value }: CellRendererProps) => {
    const files = Array.isArray(value) ? value : []
    if (files.length === 0) return null
    return (
      <div className="flex items-center gap-1">
        <FilesIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{files.length} files</span>
      </div>
    )
  },
  format: (value) => (Array.isArray(value) ? `${value.length} files` : ''),
  supportedAggregations: ['count'],
}
