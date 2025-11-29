'use client'

import { UserCheck } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@rivest/ui'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const CollaboratorColumn: ColumnTypeDefinition = {
  type: 'collaborator',
  name: 'Collaborator',
  description: 'Extended user with role',
  category: 'people',
  icon: UserCheck,

  defaultConfig: {},

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
        <div className="flex flex-col">
          <span className="text-sm truncate">{user.name || user.email}</span>
          {user.role && (
            <span className="text-xs text-muted-foreground">{user.role}</span>
          )}
        </div>
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
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}
