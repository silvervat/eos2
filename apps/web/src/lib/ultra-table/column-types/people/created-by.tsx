'use client'

import { UserPlus } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@rivest/ui'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const CreatedByColumn: ColumnTypeDefinition = {
  type: 'created_by',
  name: 'Created By',
  description: 'Auto-set to creator',
  category: 'people',
  icon: UserPlus,

  defaultConfig: {},

  defaultValue: null,
  isReadOnly: true,

  CellRenderer: ({ value }: CellRendererProps) => {
    if (!value) return null

    const user = typeof value === 'object' ? value : { id: value, name: value }

    return (
      <div className="flex items-center gap-2">
        <Avatar className="h-5 w-5">
          <AvatarImage src={user.avatarUrl} />
          <AvatarFallback className="text-[10px]">
            {getInitials(user.name || user.email || '')}
          </AvatarFallback>
        </Avatar>
        <span className="text-sm text-muted-foreground truncate">
          {user.name || user.email}
        </span>
      </div>
    )
  },

  format: (value) => {
    if (!value) return ''
    return typeof value === 'object' ? value.name || value.email || '' : String(value)
  },
}

function getInitials(name: string): string {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}
