'use client'

import { Paperclip } from 'lucide-react'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const AttachmentColumn: ColumnTypeDefinition = {
  type: 'attachment',
  name: 'Attachment',
  description: 'File attachments (Airtable)',
  category: 'media',
  icon: Paperclip,
  defaultConfig: { attachment: { maxCount: 10, maxSize: 20 } },
  defaultValue: [],

  CellRenderer: ({ value }: CellRendererProps) => {
    const files = Array.isArray(value) ? value : value ? [value] : []
    if (files.length === 0) return null
    return (
      <div className="flex items-center gap-1">
        <Paperclip className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm">{files.length} attachment{files.length !== 1 ? 's' : ''}</span>
      </div>
    )
  },
  format: (value) => {
    const files = Array.isArray(value) ? value : value ? [value] : []
    return files.length > 0 ? `${files.length} attachment(s)` : ''
  },
  supportedAggregations: ['count', 'count_empty', 'count_not_empty'],
}
