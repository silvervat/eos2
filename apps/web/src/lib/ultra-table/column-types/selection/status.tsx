'use client'

import { CircleDot } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@rivest/ui'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

const DEFAULT_STATUSES = [
  { id: 'todo', label: 'To Do', color: '#6b7280', type: 'todo' as const },
  { id: 'in_progress', label: 'In Progress', color: '#3b82f6', type: 'in_progress' as const },
  { id: 'done', label: 'Done', color: '#22c55e', type: 'done' as const },
  { id: 'blocked', label: 'Blocked', color: '#ef4444', type: 'blocked' as const },
]

export const StatusColumn: ColumnTypeDefinition = {
  type: 'status',
  name: 'Status',
  description: 'Status badge (Notion-style)',
  category: 'selection',
  icon: CircleDot,

  defaultConfig: {
    status: {
      options: DEFAULT_STATUSES,
    },
  },

  defaultValue: null,

  CellRenderer: ({ value, column, isEditing, onChange }: CellRendererProps) => {
    const config = column.config.status
    const options = config?.options || DEFAULT_STATUSES
    const status = options.find((o) => o.id === value)

    if (isEditing) {
      return (
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-sm border-0">
            <SelectValue placeholder="Select status..." />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: opt.color }}
                  />
                  {opt.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    if (!status) return null

    return (
      <div className="flex items-center">
        <span
          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium"
          style={{
            backgroundColor: `${status.color}20`,
            color: status.color,
          }}
        >
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: status.color }}
          />
          {status.label}
        </span>
      </div>
    )
  },

  format: (value, config) => {
    const options = config.status?.options || DEFAULT_STATUSES
    const status = options.find((o) => o.id === value)
    return status?.label || String(value ?? '')
  },

  supportedAggregations: ['count', 'count_unique'],
}
