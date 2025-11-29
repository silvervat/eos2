'use client'

import { MousePointer2 } from 'lucide-react'
import { Button } from '@rivest/ui'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const ButtonColumn: ColumnTypeDefinition = {
  type: 'button',
  name: 'Button',
  description: 'Action button',
  category: 'visual',
  icon: MousePointer2,
  defaultConfig: {
    button: {
      label: 'Click',
      action: 'api',
      config: {},
      variant: 'default',
    },
  },
  defaultValue: null,
  isReadOnly: true,

  CellRenderer: ({ column, row }: CellRendererProps) => {
    const config = column.config.button
    const label = config?.label || 'Click'
    const variant = config?.variant || 'default'

    const handleClick = () => {
      // Execute button action
      console.log('Button clicked', { row, config })
    }

    return (
      <Button
        size="sm"
        variant={variant as any}
        onClick={handleClick}
        className="h-7 text-xs"
      >
        {config?.icon && <span className="mr-1">{config.icon}</span>}
        {label}
      </Button>
    )
  },

  format: () => '',
  supportedAggregations: [],
}
