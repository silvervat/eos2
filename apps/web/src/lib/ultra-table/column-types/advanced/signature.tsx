'use client'

import { PenTool } from 'lucide-react'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const SignatureColumn: ColumnTypeDefinition = {
  type: 'signature',
  name: 'Signature',
  description: 'Digital signature',
  category: 'advanced',
  icon: PenTool,
  defaultConfig: {
    signature: {
      penColor: '#000000',
      backgroundColor: '#ffffff',
      width: 300,
      height: 100,
    },
  },
  defaultValue: null,

  CellRenderer: ({ value }: CellRendererProps) => {
    if (!value) {
      return (
        <span className="text-muted-foreground text-xs flex items-center gap-1">
          <PenTool className="h-3 w-3" />
          Sign...
        </span>
      )
    }
    // Value is base64 image
    return (
      <div className="h-8 w-20 bg-muted rounded overflow-hidden">
        <img src={value} alt="Signature" className="h-full w-full object-contain" />
      </div>
    )
  },

  format: (value) => (value ? 'Signed' : ''),
  supportedAggregations: ['count', 'count_empty', 'count_not_empty'],
}
