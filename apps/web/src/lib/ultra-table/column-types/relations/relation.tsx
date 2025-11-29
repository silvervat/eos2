'use client'

import { Link } from 'lucide-react'
import { Badge } from '@rivest/ui'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const RelationColumn: ColumnTypeDefinition = {
  type: 'relation',
  name: 'Relation',
  description: 'Link to another table',
  category: 'relations',
  icon: Link,
  defaultConfig: {
    relation: {
      tableId: '',
      fieldKey: 'name',
      allowMultiple: true,
      twoWayLink: true,
    },
  },
  defaultValue: [],

  CellRenderer: ({ value }: CellRendererProps) => {
    const items = Array.isArray(value) ? value : value ? [value] : []
    if (items.length === 0) return null

    return (
      <div className="flex flex-wrap gap-1">
        {items.slice(0, 3).map((item: any, i: number) => (
          <Badge key={item.id || i} variant="secondary" className="text-xs">
            {item.displayValue || item.name || item.id}
          </Badge>
        ))}
        {items.length > 3 && (
          <Badge variant="outline" className="text-xs">
            +{items.length - 3}
          </Badge>
        )}
      </div>
    )
  },

  format: (value) => {
    const items = Array.isArray(value) ? value : value ? [value] : []
    return items.map((i) => i.displayValue || i.name || i.id).join(', ')
  },

  supportedAggregations: ['count', 'count_empty', 'count_not_empty'],

  aggregate: (values, aggregation) => {
    switch (aggregation) {
      case 'count':
        return values.flat().length
      case 'count_empty':
        return values.filter((v) => !v || (Array.isArray(v) && v.length === 0)).length
      case 'count_not_empty':
        return values.filter((v) => v && (!Array.isArray(v) || v.length > 0)).length
      default:
        return null
    }
  },
}
