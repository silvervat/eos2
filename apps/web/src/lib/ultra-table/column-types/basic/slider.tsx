'use client'

import { Sliders } from 'lucide-react'
import { Slider } from '@rivest/ui'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const SliderColumn: ColumnTypeDefinition = {
  type: 'slider',
  name: 'Slider',
  description: 'Visual number slider',
  category: 'basic',
  icon: Sliders,

  defaultConfig: {
    slider: {
      min: 0,
      max: 100,
      step: 1,
      showValue: true,
      showTicks: false,
    },
  },

  defaultValue: null,

  CellRenderer: ({ value, column, isEditing, onChange }: CellRendererProps) => {
    const config = column.config.slider
    const min = config?.min ?? 0
    const max = config?.max ?? 100
    const step = config?.step ?? 1

    if (isEditing) {
      return (
        <div className="flex items-center gap-2 px-2">
          <Slider
            value={[value ?? min]}
            onValueChange={([val]) => onChange(val)}
            min={min}
            max={max}
            step={step}
            className="flex-1"
          />
          {config?.showValue && (
            <span className="text-sm tabular-nums w-10 text-right">
              {value ?? min}
            </span>
          )}
        </div>
      )
    }

    if (value == null) return null

    // Show progress bar in view mode
    const percentage = ((value - min) / (max - min)) * 100

    return (
      <div className="flex items-center gap-2 px-2">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${percentage}%` }}
          />
        </div>
        {config?.showValue && (
          <span className="text-sm tabular-nums w-10 text-right">
            {value}
          </span>
        )}
      </div>
    )
  },

  validate: (value, config) => {
    if (value == null) return true
    const { min = 0, max = 100 } = config.slider || {}
    if (value < min || value > max) {
      return `Value must be between ${min} and ${max}`
    }
    return true
  },

  format: (value) => String(value ?? ''),

  sort: (a, b) => (Number(a) || 0) - (Number(b) || 0),

  supportedAggregations: ['avg', 'min', 'max', 'count'],
}
