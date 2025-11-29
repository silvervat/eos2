'use client'

import { BarChart3 } from 'lucide-react'
import { Slider } from '@rivest/ui'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const ProgressColumn: ColumnTypeDefinition = {
  type: 'progress',
  name: 'Progress',
  description: 'Progress bar (0-100%)',
  category: 'visual',
  icon: BarChart3,
  defaultConfig: { progress: { showPercentage: true, color: '#279989' } },
  defaultValue: 0,

  CellRenderer: ({ value, column, isEditing, onChange }: CellRendererProps) => {
    const percent = Math.min(100, Math.max(0, Number(value) || 0))
    const color = column.config.progress?.color || '#279989'
    const showPct = column.config.progress?.showPercentage !== false

    if (isEditing) {
      return (
        <div className="flex items-center gap-2 px-2">
          <Slider
            value={[percent]}
            onValueChange={([v]) => onChange(v)}
            min={0}
            max={100}
            step={1}
            className="flex-1"
          />
          {showPct && <span className="text-xs tabular-nums w-8">{percent}%</span>}
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 px-2">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${percent}%`, backgroundColor: color }}
          />
        </div>
        {showPct && <span className="text-xs tabular-nums w-8">{percent}%</span>}
      </div>
    )
  },

  validate: (value) => {
    const num = Number(value)
    if (isNaN(num) || num < 0 || num > 100) {
      return 'Progress must be between 0 and 100'
    }
    return true
  },

  format: (value) => `${Number(value) || 0}%`,
  sort: (a, b) => (Number(a) || 0) - (Number(b) || 0),
  supportedAggregations: ['avg', 'min', 'max'],
}
