'use client'

import { Tags } from 'lucide-react'
import { Badge } from '@rivest/ui'
import type { ColumnTypeDefinition, CellRendererProps } from '../types'

export const TagsColumn: ColumnTypeDefinition = {
  type: 'tags',
  name: 'Tags',
  description: 'Colorful tags (Notion-style)',
  category: 'selection',
  icon: Tags,

  defaultConfig: {
    tags: {
      options: [],
      maxTags: undefined,
      colorized: true,
    },
  },

  defaultValue: [],

  CellRenderer: ({ value, column, isEditing, onChange }: CellRendererProps) => {
    const config = column.config.tags
    const options = config?.options || []
    const selectedValues = Array.isArray(value) ? value : []

    const selectedTags = selectedValues
      .map((v) => options.find((o) => o.id === v || o.label === v))
      .filter(Boolean)

    if (isEditing) {
      return (
        <div className="flex flex-wrap gap-1 p-1">
          {options.map((opt) => {
            const isSelected = selectedValues.includes(opt.id)
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => {
                  const newValue = isSelected
                    ? selectedValues.filter((v) => v !== opt.id)
                    : [...selectedValues, opt.id]
                  onChange(newValue)
                }}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all ${
                  isSelected ? 'ring-2 ring-offset-1' : 'opacity-60 hover:opacity-100'
                }`}
                style={{
                  backgroundColor: opt.color,
                  color: getContrastColor(opt.color),
                  ringColor: opt.color,
                }}
              >
                {opt.icon && <span>{opt.icon}</span>}
                {opt.label}
              </button>
            )
          })}
        </div>
      )
    }

    if (selectedTags.length === 0) return null

    return (
      <div className="flex flex-wrap gap-1">
        {selectedTags.map((tag: any) => (
          <span
            key={tag.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
            style={{
              backgroundColor: tag.color,
              color: getContrastColor(tag.color),
            }}
          >
            {tag.icon && <span>{tag.icon}</span>}
            {tag.label}
          </span>
        ))}
      </div>
    )
  },

  format: (value, config) => {
    if (!Array.isArray(value)) return ''
    const options = config.tags?.options || []
    return value
      .map((v) => {
        const opt = options.find((o) => o.id === v || o.label === v)
        return opt?.label || v
      })
      .join(', ')
  },

  supportedAggregations: ['count', 'count_empty', 'count_not_empty'],
}

function getContrastColor(hexColor: string): string {
  // Remove # if present
  const hex = hexColor.replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return luminance > 0.5 ? '#000000' : '#ffffff'
}
