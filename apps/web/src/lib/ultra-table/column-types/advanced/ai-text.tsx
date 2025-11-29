'use client'

import { Sparkles } from 'lucide-react'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const AITextColumn: ColumnTypeDefinition = {
  type: 'ai_text',
  name: 'AI Text',
  description: 'AI-generated text',
  category: 'advanced',
  icon: Sparkles,
  defaultConfig: {
    aiText: {
      prompt: '',
      model: 'gpt-4',
      maxTokens: 500,
    },
  },
  defaultValue: null,
  isReadOnly: true,

  CellRenderer: ({ value }: CellRendererProps) => {
    if (!value) {
      return (
        <span className="text-muted-foreground text-xs flex items-center gap-1">
          <Sparkles className="h-3 w-3" />
          Generate...
        </span>
      )
    }
    return <span className="text-sm line-clamp-2">{value}</span>
  },

  format: (value) => value || '',
  supportedAggregations: ['count'],
}
