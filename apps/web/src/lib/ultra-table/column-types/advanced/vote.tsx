'use client'

import { Vote } from 'lucide-react'
import { Button } from '@rivest/ui'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const VoteColumn: ColumnTypeDefinition = {
  type: 'vote',
  name: 'Vote',
  description: 'Voting/polling',
  category: 'advanced',
  icon: Vote,
  defaultConfig: {
    vote: {
      maxVotes: 1,
      showResults: true,
      anonymous: false,
    },
  },
  defaultValue: { count: 0, voters: [] },

  CellRenderer: ({ value, isEditing, onChange }: CellRendererProps) => {
    const votes = typeof value === 'object' ? value : { count: Number(value) || 0, voters: [] }

    if (isEditing) {
      return (
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs gap-1"
          onClick={() => onChange({ ...votes, count: votes.count + 1 })}
        >
          <Vote className="h-3 w-3" />
          {votes.count}
        </Button>
      )
    }

    return (
      <div className="flex items-center gap-1 text-sm">
        <Vote className="h-3 w-3 text-muted-foreground" />
        <span className="tabular-nums">{votes.count}</span>
      </div>
    )
  },

  format: (value) => {
    const count = typeof value === 'object' ? value.count : Number(value) || 0
    return `${count} votes`
  },

  sort: (a, b) => {
    const countA = typeof a === 'object' ? a.count : Number(a) || 0
    const countB = typeof b === 'object' ? b.count : Number(b) || 0
    return countB - countA
  },

  supportedAggregations: ['sum', 'avg', 'max'],

  aggregate: (values, aggregation) => {
    const counts = values.map((v) => (typeof v === 'object' ? v.count : Number(v) || 0))
    switch (aggregation) {
      case 'sum':
        return counts.reduce((a, b) => a + b, 0)
      case 'avg':
        return counts.length > 0 ? (counts.reduce((a, b) => a + b, 0) / counts.length).toFixed(1) : 0
      case 'max':
        return counts.length > 0 ? Math.max(...counts) : 0
      default:
        return null
    }
  },
}
