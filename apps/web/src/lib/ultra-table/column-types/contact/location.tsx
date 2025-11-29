'use client'

import { MapPin } from 'lucide-react'
import { Input } from '@rivest/ui'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const LocationColumn: ColumnTypeDefinition = {
  type: 'location',
  name: 'Location',
  description: 'Address / Location',
  category: 'contact',
  icon: MapPin,
  defaultConfig: { location: { enableMap: false, geocoding: false } },
  defaultValue: null,

  CellRenderer: ({ value, isEditing, onChange }: CellRendererProps) => {
    if (isEditing) {
      const address = typeof value === 'object' ? value.address : value
      return (
        <Input
          value={address || ''}
          onChange={(e) => onChange(e.target.value || null)}
          className="h-8 text-sm border-0"
          placeholder="Enter address..."
          autoFocus
        />
      )
    }
    if (!value) return null
    const address = typeof value === 'object' ? value.address : value
    return (
      <div className="flex items-center gap-1 text-sm truncate">
        <MapPin className="h-3 w-3 text-muted-foreground flex-shrink-0" />
        {address}
      </div>
    )
  },

  format: (value) => {
    if (!value) return ''
    return typeof value === 'object' ? value.address : value
  },
  supportedAggregations: ['count', 'count_unique'],
}
