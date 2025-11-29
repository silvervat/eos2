'use client'

import { Smile } from 'lucide-react'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const IconColumn: ColumnTypeDefinition = {
  type: 'icon',
  name: 'Icon',
  description: 'Icon selector',
  category: 'visual',
  icon: Smile,
  defaultConfig: { icon: { library: 'lucide' } },
  defaultValue: null,

  CellRenderer: ({ value }: CellRendererProps) => {
    if (!value) return null
    // Display emoji or icon name
    return <span className="text-lg">{value}</span>
  },

  format: (value) => value || '',
  supportedAggregations: ['count', 'count_unique'],
}
