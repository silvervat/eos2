'use client'

import { CheckSquare } from 'lucide-react'
import { Checkbox } from '@rivest/ui'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const CheckboxColumn: ColumnTypeDefinition = {
  type: 'checkbox',
  name: 'Checkbox',
  description: 'Boolean checkbox',
  category: 'selection',
  icon: CheckSquare,

  defaultConfig: {},

  defaultValue: false,

  CellRenderer: ({ value, isEditing, onChange }: CellRendererProps) => {
    return (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={!!value}
          onCheckedChange={(checked) => onChange(!!checked)}
          disabled={!isEditing}
          className="h-4 w-4"
        />
      </div>
    )
  },

  format: (value) => (value ? 'Yes' : 'No'),

  parse: (value) => {
    const lower = String(value).toLowerCase()
    return lower === 'true' || lower === 'yes' || lower === '1'
  },

  sort: (a, b) => (a ? 1 : 0) - (b ? 1 : 0),

  filter: (value, filterValue, operator) => {
    switch (operator) {
      case 'equals':
        return !!value === !!filterValue
      case 'is_checked':
        return !!value
      case 'is_unchecked':
        return !value
      default:
        return true
    }
  },

  getFilterOperators: () => [
    { value: 'is_checked', label: 'Is checked' },
    { value: 'is_unchecked', label: 'Is unchecked' },
  ],

  supportedAggregations: ['count', 'percent_empty', 'percent_not_empty'],

  aggregate: (values, aggregation) => {
    const checked = values.filter((v) => !!v).length
    const total = values.length

    switch (aggregation) {
      case 'count':
        return checked
      case 'percent_empty':
        return total > 0 ? `${Math.round(((total - checked) / total) * 100)}%` : '0%'
      case 'percent_not_empty':
        return total > 0 ? `${Math.round((checked / total) * 100)}%` : '0%'
      default:
        return null
    }
  },

  exportValue: (value) => (value ? 'true' : 'false'),

  importValue: (value) => {
    const lower = String(value).toLowerCase()
    return lower === 'true' || lower === 'yes' || lower === '1'
  },
}
