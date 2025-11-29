'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const RatingColumn: ColumnTypeDefinition = {
  type: 'rating',
  name: 'Rating',
  description: 'Star rating (1-5)',
  category: 'basic',
  icon: Star,

  defaultConfig: {
    rating: {
      max: 5,
      icon: 'star',
      color: '#fbbf24',
      allowHalf: false,
    },
  },

  defaultValue: null,

  CellRenderer: ({ value, column, isEditing, onChange }: CellRendererProps) => {
    const config = column.config.rating
    const max = config?.max ?? 5
    const color = config?.color ?? '#fbbf24'

    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: max }, (_, i) => {
          const filled = value != null && i < value

          return (
            <button
              key={i}
              type="button"
              onClick={() => isEditing && onChange(i + 1 === value ? null : i + 1)}
              disabled={!isEditing}
              className={cn(
                'p-0 h-5 w-5 transition-colors',
                isEditing && 'cursor-pointer hover:scale-110'
              )}
            >
              <Star
                className="h-4 w-4"
                fill={filled ? color : 'transparent'}
                stroke={filled ? color : '#d1d5db'}
                strokeWidth={1.5}
              />
            </button>
          )
        })}
      </div>
    )
  },

  validate: (value, config) => {
    if (value == null) return true
    const max = config.rating?.max ?? 5
    if (value < 0 || value > max) {
      return `Rating must be between 0 and ${max}`
    }
    return true
  },

  format: (value, config) => {
    if (value == null) return ''
    return `${value}/${config.rating?.max ?? 5}`
  },

  sort: (a, b) => (Number(a) || 0) - (Number(b) || 0),

  supportedAggregations: ['avg', 'min', 'max', 'count'],

  aggregate: (values, aggregation) => {
    const nums = values.filter(v => v != null).map(Number).filter(n => !isNaN(n))

    switch (aggregation) {
      case 'avg':
        return nums.length > 0 ? (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(1) : null
      case 'min':
        return nums.length > 0 ? Math.min(...nums) : null
      case 'max':
        return nums.length > 0 ? Math.max(...nums) : null
      case 'count':
        return values.length
      default:
        return null
    }
  },
}
