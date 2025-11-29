'use client'

import { Users } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@rivest/ui'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const MultiUserColumn: ColumnTypeDefinition = {
  type: 'multi_user',
  name: 'Multi-User',
  description: 'Multiple user selection',
  category: 'people',
  icon: Users,

  defaultConfig: {},

  defaultValue: [],

  CellRenderer: ({ value }: CellRendererProps) => {
    const users = Array.isArray(value) ? value : []
    if (users.length === 0) return null

    return (
      <div className="flex items-center -space-x-2">
        {users.slice(0, 5).map((user: any, i: number) => (
          <Avatar key={user.id || i} className="h-6 w-6 border-2 border-background">
            <AvatarImage src={user.avatarUrl} />
            <AvatarFallback className="text-xs">
              {getInitials(user.name || user.email || '')}
            </AvatarFallback>
          </Avatar>
        ))}
        {users.length > 5 && (
          <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium border-2 border-background">
            +{users.length - 5}
          </div>
        )}
      </div>
    )
  },

  format: (value) => {
    if (!Array.isArray(value)) return ''
    return value.map((u) => u.name || u.email || '').join(', ')
  },

  supportedAggregations: ['count', 'count_unique'],
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
