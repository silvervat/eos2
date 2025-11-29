'use client'

import { Hash } from 'lucide-react'
import { Input } from '@rivest/ui'
import type { ColumnTypeDefinition, CellRendererProps, NUMBER_FILTER_OPERATORS } from '../types'

export const NumberColumn: ColumnTypeDefinition = {
  type: 'number',
  name: 'Number',
  description: 'Numeric values with formatting',
  category: 'basic',
  icon: Hash,

  defaultConfig: {
    number: {
      min: undefined,
      max: undefined,
      step: 1,
      decimals: 0,
      format: 'number',
      prefix: '',
      suffix: '',
    },
  },

  defaultValue: null,

  CellRenderer: ({ value, column, isEditing, onChange }: CellRendererProps) => {
    const config = column.config.number

    if (isEditing) {
      return (
        <Input
          type="number"
          value={value ?? ''}
          onChange={(e) => {
            const val = e.target.value === '' ? null : Number(e.target.value)
            onChange(val)
          }}
          step={config?.step}
          min={config?.min}
          max={config?.max}
          className="h-8 text-sm text-right border-0 focus-visible:ring-1"
          autoFocus
        />
      )
    }

    if (value == null) return null

    const formattedValue = formatNumber(value, config)

    return (
      <span className="text-sm text-right tabular-nums">
        {config?.prefix}{formattedValue}{config?.suffix}
      </span>
    )
  },

  validate: (value, config) => {
    if (value == null) return true

    const num = Number(value)
    if (isNaN(num)) {
      return 'Must be a valid number'
    }

    const { min, max } = config.number || {}
    if (min !== undefined && num < min) {
      return `Minimum value is ${min}`
    }
    if (max !== undefined && num > max) {
      return `Maximum value is ${max}`
    }

    return true
  },

  format: (value, config) => {
    if (value == null) return ''
    const cfg = config.number
    return `${cfg?.prefix || ''}${formatNumber(value, cfg)}${cfg?.suffix || ''}`
  },

  parse: (value) => {
    if (!value || value === '') return null
    const num = Number(value.replace(/[^0-9.-]/g, ''))
    return isNaN(num) ? null : num
  },

  sort: (a, b) => {
    const numA = Number(a) || 0
    const numB = Number(b) || 0
    return numA - numB
  },

  filter: (value, filterValue, operator) => {
    const numValue = Number(value)
    const numFilter = Number(filterValue)

    if (operator === 'is_empty') return value == null
    if (operator === 'is_not_empty') return value != null

    if (isNaN(numValue)) return false

    switch (operator) {
      case 'equals':
        return numValue === numFilter
      case 'not_equals':
        return numValue !== numFilter
      case 'greater_than':
        return numValue > numFilter
      case 'less_than':
        return numValue < numFilter
      case 'greater_or_equal':
        return numValue >= numFilter
      case 'less_or_equal':
        return numValue <= numFilter
      default:
        return true
    }
  },

  getFilterOperators: () => [
    { value: 'equals', label: 'Equals' },
    { value: 'not_equals', label: 'Does not equal' },
    { value: 'greater_than', label: 'Greater than' },
    { value: 'less_than', label: 'Less than' },
    { value: 'greater_or_equal', label: 'Greater or equal' },
    { value: 'less_or_equal', label: 'Less or equal' },
    { value: 'is_empty', label: 'Is empty' },
    { value: 'is_not_empty', label: 'Is not empty' },
  ],

  supportedAggregations: ['sum', 'avg', 'min', 'max', 'count', 'count_empty', 'count_not_empty'],

  aggregate: (values, aggregation) => {
    const nums = values.filter(v => v != null).map(Number).filter(n => !isNaN(n))

    switch (aggregation) {
      case 'sum':
        return nums.reduce((a, b) => a + b, 0)
      case 'avg':
        return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
      case 'min':
        return nums.length > 0 ? Math.min(...nums) : null
      case 'max':
        return nums.length > 0 ? Math.max(...nums) : null
      case 'count':
        return values.length
      case 'count_empty':
        return values.filter(v => v == null).length
      case 'count_not_empty':
        return values.filter(v => v != null).length
      default:
        return null
    }
  },

  exportValue: (value) => String(value ?? ''),

  importValue: (value) => {
    if (!value) return null
    const num = Number(value.replace(/[^0-9.-]/g, ''))
    return isNaN(num) ? null : num
  },

  supportsAutoFill: true,

  autoFillNext: (currentValue, direction, config) => {
    if (currentValue == null) return null
    const step = config.number?.step || 1
    return direction === 'down' ? currentValue + step : currentValue - step
  },
}

function formatNumber(value: number, config?: { decimals?: number }): string {
  const decimals = config?.decimals ?? 0
  return value.toLocaleString('et-EE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}
