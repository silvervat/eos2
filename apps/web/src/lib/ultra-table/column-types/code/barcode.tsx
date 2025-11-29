'use client'

import { Barcode as BarcodeIcon } from 'lucide-react'
import { Input } from '@rivest/ui'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const BarcodeColumn: ColumnTypeDefinition = {
  type: 'barcode',
  name: 'Barcode',
  description: 'Barcode scanner/display',
  category: 'code',
  icon: BarcodeIcon,
  defaultConfig: { barcode: { format: 'CODE128', showValue: true } },
  defaultValue: null,

  CellRenderer: ({ value, isEditing, onChange }: CellRendererProps) => {
    if (isEditing) {
      return (
        <Input
          value={value || ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="h-8 text-sm border-0 font-mono"
          autoFocus
        />
      )
    }
    if (!value) return null
    return (
      <div className="flex items-center gap-2">
        <BarcodeIcon className="h-4 w-4 text-muted-foreground" />
        <code className="text-xs font-mono">{value}</code>
      </div>
    )
  },
  format: (value) => value || '',
  supportedAggregations: ['count', 'count_unique'],
}
