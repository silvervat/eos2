'use client'

import { User } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@rivest/ui'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const UserColumn: ColumnTypeDefinition = {
  type: 'user',
  name: 'User',
  description: 'Single user selection',
  category: 'people',
  icon: User,

  defaultConfig: {
    user: {
      allowMultiple: false,
      showAvatar: true,
    },
  },

  defaultValue: null,

  CellRenderer: ({ value }: CellRendererProps) => {
    if (!value) return null

    const user = typeof value === 'object' ? value : { id: value, name: value }

    return (
      <div className="flex items-center gap-2">
        <Avatar className="h-6 w-6">
          <AvatarImage src={user.avatarUrl} />
          <AvatarFallback className="text-xs">
            {getInitials(user.name || user.email || '')}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm truncate">{user.name || user.email}</span>
      </div>
    )
  },

  format: (value) => {
    if (!value) return ''
    return typeof value === 'object' ? value.name || value.email || '' : String(value)
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
