'use client'

import { ListChecks } from 'lucide-react'
import { Badge } from '@rivest/ui'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const MultiSelectColumn: ColumnTypeDefinition = {
  type: 'multi_select',
  name: 'Multi-Select',
  description: 'Multiple selections from options',
  category: 'selection',
  icon: ListChecks,

  defaultConfig: {
    dropdown: {
      options: [],
      allowCustom: false,
      color: true,
    },
  },

  defaultValue: [],

  CellRenderer: ({ value, column, isEditing, onChange }: CellRendererProps) => {
    const config = column.config.dropdown
    const options = config?.options || []
    const selectedValues = Array.isArray(value) ? value : []

    const selectedOptions = selectedValues
      .map((v) => options.find((o) => o.id === v || o.label === v))
      .filter(Boolean)

    if (isEditing) {
      return (
        <div className="flex flex-wrap gap-1 p-1">
          {options.map((opt) => {
            const isSelected = selectedValues.includes(opt.id)
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  const newValue = isSelected
                    ? selectedValues.filter((v) => v !== opt.id)
                    : [...selectedValues, opt.id]
                  onChange(newValue)
                }}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  isSelected
                    ? 'ring-2 ring-primary ring-offset-1'
                    : 'opacity-50 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: opt.color ? `${opt.color}20` : '#f3f4f6',
                  color: opt.color || '#374151',
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      )
    }

    if (selectedOptions.length === 0) return null

    return (
      <div className="flex flex-wrap gap-1">
        {selectedOptions.map((opt: any) => (
          <span
            key={opt.id}
            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
            style={{
              backgroundColor: opt.color ? `${opt.color}20` : '#f3f4f6',
              color: opt.color || '#374151',
            }}
          >
            {opt.label}
          </span>
        ))}
      </div>
    )
  },

  format: (value, config) => {
    if (!Array.isArray(value)) return ''
    const options = config.dropdown?.options || []
    return value
      .map((v) => {
        const opt = options.find((o) => o.id === v || o.label === v)
        return opt?.label || v
      })
      .join(', ')
  },

  supportedAggregations: ['count', 'count_empty', 'count_not_empty'],
}
