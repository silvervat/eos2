'use client'

import { FunctionSquare } from 'lucide-react'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const FormulaColumn: ColumnTypeDefinition = {
  type: 'formula',
  name: 'Formula',
  description: 'Calculated field',
  category: 'formulas',
  icon: FunctionSquare,
  defaultConfig: {
    formula: {
      expression: '',
      returnType: 'text',
      dependencies: [],
    },
  },
  defaultValue: null,
  isReadOnly: true,

  CellRenderer: ({ value, column }: CellRendererProps) => {
    if (value == null) return <span className="text-muted-foreground text-xs">-</span>
    const returnType = column.config.formula?.returnType || 'text'
    return <span className="text-sm">{formatFormulaResult(value, returnType)}</span>
  },

  format: (value, config) => {
    if (value == null) return ''
    return formatFormulaResult(value, config.formula?.returnType || 'text')
  },

  calculateFormula: (expression, row, allRows) => {
    // Simple formula engine - evaluates basic expressions
    try {
      const context = { ...row.data, ROW_INDEX: allRows.indexOf(row) + 1 }
      // Replace field references with values
      let expr = expression
      for (const [key, val] of Object.entries(context)) {
        expr = expr.replace(new RegExp(`\\{${key}\\}`, 'g'), JSON.stringify(val))
      }
      // Built-in functions
      expr = expr
        .replace(/SUM\(([^)]+)\)/gi, (_, args) => {
          const nums = args.split(',').map((a: string) => Number(a.trim()) || 0)
          return String(nums.reduce((a: number, b: number) => a + b, 0))
        })
        .replace(/AVG\(([^)]+)\)/gi, (_, args) => {
          const nums = args.split(',').map((a: string) => Number(a.trim()) || 0)
          return String(nums.reduce((a: number, b: number) => a + b, 0) / nums.length)
        })
        .replace(/IF\(([^,]+),([^,]+),([^)]+)\)/gi, (_, cond, t, f) => {
          return eval(cond) ? t.trim() : f.trim()
        })
      return eval(expr)
    } catch {
      return '#ERROR'
    }
  },

  supportedAggregations: ['sum', 'avg', 'min', 'max', 'count'],
}

function formatFormulaResult(value: any, returnType: string): string {
  switch (returnType) {
    case 'number':
      return Number(value).toLocaleString('et-EE')
    case 'currency':
      return new Intl.NumberFormat('et-EE', { style: 'currency', currency: 'EUR' }).format(value)
    case 'percent':
      return `${Number(value).toFixed(1)}%`
    default:
      return String(value)
  }
}
