'use client'

import { File as FileIcon } from 'lucide-react'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const FileColumn: ColumnTypeDefinition = {
  type: 'file',
  name: 'File',
  description: 'Single file upload',
  category: 'media',
  icon: FileIcon,
  defaultConfig: { file: { maxSize: 10 } },
  defaultValue: null,

  CellRenderer: ({ value }: CellRendererProps) => {
    if (!value) return null
    const file = typeof value === 'object' ? value : { name: value, url: value }
    return (
      <div className="flex items-center gap-2">
        <FileIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm truncate">{file.name}</span>
      </div>
    )
  },
  format: (value) => (value ? (typeof value === 'object' ? value.name : 'File') : ''),
  supportedAggregations: ['count', 'count_empty', 'count_not_empty'],
}
