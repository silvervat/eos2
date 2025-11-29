'use client'

import { ChevronDown } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@rivest/ui'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const DropdownColumn: ColumnTypeDefinition = {
  type: 'dropdown',
  name: 'Dropdown',
  description: 'Single selection from options',
  category: 'selection',
  icon: ChevronDown,

  defaultConfig: {
    dropdown: {
      options: [],
      allowCustom: false,
      color: true,
    },
  },

  defaultValue: null,

  CellRenderer: ({ value, column, isEditing, onChange }: CellRendererProps) => {
    const config = column.config.dropdown
    const options = config?.options || []
    const option = options.find((o) => o.id === value || o.label === value)

    if (isEditing) {
      return (
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-sm border-0">
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                <div className="flex items-center gap-2">
                  {opt.color && (
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: opt.color }}
                    />
                  )}
                  {opt.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    if (!option) return null

    return (
      <div className="flex items-center">
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium"
          style={{
            backgroundColor: option.color ? `${option.color}20` : '#f3f4f6',
            color: option.color || '#374151',
          }}
        >
          {option.icon && <span>{option.icon}</span>}
          {option.label}
        </span>
      </div>
    )
  },

  validate: (value, config) => {
    if (!value) return true
    const options = config.dropdown?.options || []
    const valid = options.some((o) => o.id === value || o.label === value)
    if (!valid && !config.dropdown?.allowCustom) {
      return 'Invalid option selected'
    }
    return true
  },

  format: (value, config) => {
    const options = config.dropdown?.options || []
    const option = options.find((o) => o.id === value || o.label === value)
    return option?.label || String(value ?? '')
  },

  sort: (a, b, config) => {
    const options = config.dropdown?.options || []
    const orderA = options.findIndex((o) => o.id === a || o.label === a)
    const orderB = options.findIndex((o) => o.id === b || o.label === b)
    return orderA - orderB
  },

  getFilterOperators: () => [
    { value: 'equals', label: 'Is' },
    { value: 'not_equals', label: 'Is not' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],

  supportedAggregations: ['count', 'count_unique', 'count_empty', 'count_not_empty'],
}
