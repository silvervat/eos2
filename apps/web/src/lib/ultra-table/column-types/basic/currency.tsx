'use client'

import { Euro } from 'lucide-react'
import { Input } from '@rivest/ui'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

const CURRENCY_SYMBOLS: Record<string, string> = {
  EUR: '€',
  USD: '$',
  GBP: '£',
  SEK: 'kr',
  NOK: 'kr',
  DKK: 'kr',
}

export const CurrencyColumn: ColumnTypeDefinition = {
  type: 'currency',
  name: 'Currency',
  description: 'Monetary values with currency symbol',
  category: 'basic',
  icon: Euro,

  defaultConfig: {
    currency: {
      currency: 'EUR',
      decimals: 2,
      symbol: '€',
    },
  },

  defaultValue: null,

  CellRenderer: ({ value, column, isEditing, onChange }: CellRendererProps) => {
    const config = column.config.currency
    const currency = config?.currency || 'EUR'
    const decimals = config?.decimals ?? 2

    if (isEditing) {
      return (
        <Input
          type="number"
          value={value ?? ''}
          onChange={(e) => {
            const val = e.target.value === '' ? null : Number(e.target.value)
            onChange(val)
          }}
          step={Math.pow(10, -decimals)}
          className="h-8 text-sm text-right border-0 focus-visible:ring-1"
          autoFocus
        />
      )
    }

    if (value == null) return null

    const formatted = formatCurrency(value, currency, decimals)

    return (
      <span className="text-sm text-right tabular-nums font-medium">
        {formatted}
      </span>
    )
  },

  validate: (value) => {
    if (value == null) return true
    if (isNaN(Number(value))) {
      return 'Must be a valid number'
    }
    return true
  },

  format: (value, config) => {
    if (value == null) return ''
    return formatCurrency(
      value,
      config.currency?.currency || 'EUR',
      config.currency?.decimals ?? 2
    )
  },

  parse: (value) => {
    if (!value) return null
    const num = Number(value.replace(/[^0-9.-]/g, ''))
    return isNaN(num) ? null : num
  },

  sort: (a, b) => (Number(a) || 0) - (Number(b) || 0),

  supportedAggregations: ['sum', 'avg', 'min', 'max', 'count'],

  aggregate: (values, aggregation, config) => {
    const nums = values.filter(v => v != null).map(Number).filter(n => !isNaN(n))

    let result: number | null = null
    switch (aggregation) {
      case 'sum':
        result = nums.reduce((a, b) => a + b, 0)
        break
      case 'avg':
        result = nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
        break
      case 'min':
        result = nums.length > 0 ? Math.min(...nums) : null
        break
      case 'max':
        result = nums.length > 0 ? Math.max(...nums) : null
        break
      case 'count':
        return values.length
    }

    return result != null
      ? formatCurrency(result, config.currency?.currency || 'EUR', config.currency?.decimals ?? 2)
      : null
  },

  exportValue: (value) => String(value ?? ''),

  importValue: (value) => {
    if (!value) return null
    const num = Number(value.replace(/[^0-9.-]/g, ''))
    return isNaN(num) ? null : num
  },

  supportsAutoFill: true,
}

function formatCurrency(value: number, currency: string, decimals: number): string {
  return new Intl.NumberFormat('et-EE', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}
