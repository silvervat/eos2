'use client'

import { Flag } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@rivest/ui'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

const DEFAULT_PRIORITIES = [
  { id: 'urgent', label: 'Urgent', color: '#ef4444', icon: '🔴', level: 4 },
  { id: 'high', label: 'High', color: '#f97316', icon: '🟠', level: 3 },
  { id: 'medium', label: 'Medium', color: '#eab308', icon: '🟡', level: 2 },
  { id: 'low', label: 'Low', color: '#22c55e', icon: '🟢', level: 1 },
]

export const PriorityColumn: ColumnTypeDefinition = {
  type: 'priority',
  name: 'Priority',
  description: 'Priority levels (ClickUp-style)',
  category: 'selection',
  icon: Flag,

  defaultConfig: {
    priority: {
      options: DEFAULT_PRIORITIES,
      showIcon: true,
    },
  },

  defaultValue: null,

  CellRenderer: ({ value, column, isEditing, onChange }: CellRendererProps) => {
    const config = column.config.priority
    const options = config?.options || DEFAULT_PRIORITIES
    const priority = options.find((o) => o.id === value)

    if (isEditing) {
      return (
        <Select value={value || ''} onValueChange={onChange}>
          <SelectTrigger className="h-8 text-sm border-0">
            <SelectValue placeholder="Set priority..." />
          </SelectTrigger>
          <SelectContent>
            {options.map((opt) => (
              <SelectItem key={opt.id} value={opt.id}>
                <div className="flex items-center gap-2">
                  {config?.showIcon !== false && <span>{opt.icon}</span>}
                  <span style={{ color: opt.color }}>{opt.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )
    }

    if (!priority) return null

    return (
      <div className="flex items-center gap-1">
        {config?.showIcon !== false && <span>{priority.icon}</span>}
        <span
          className="text-xs font-medium"
          style={{ color: priority.color }}
        >
          {priority.label}
        </span>
      </div>
    )
  },

  format: (value, config) => {
    const options = config.priority?.options || DEFAULT_PRIORITIES
    const priority = options.find((o) => o.id === value)
    return priority?.label || String(value ?? '')
  },

  sort: (a, b, config) => {
    const options = config.priority?.options || DEFAULT_PRIORITIES
    const levelA = options.find((o) => o.id === a)?.level ?? 0
    const levelB = options.find((o) => o.id === b)?.level ?? 0
    return levelB - levelA // Higher priority first
  },

  supportedAggregations: ['count', 'count_unique'],
}
