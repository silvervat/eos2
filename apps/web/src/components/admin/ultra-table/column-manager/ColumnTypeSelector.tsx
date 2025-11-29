'use client'

import { useState } from 'react'
import { Input, Badge, ScrollArea } from '@rivest/ui'
import { Search, Star } from 'lucide-react'
import {
  getAllColumnTypes,
  getColumnTypesByCategory,
  getAirtableCompatibleTypes,
  getRivestExclusiveTypes
} from '@/lib/ultra-table/column-types/registry'
import { COLUMN_CATEGORIES } from '@/lib/ultra-table/column-types/types'
import { cn } from '@rivest/ui'
import type { ColumnType } from '@/types/ultra-table'
import type { ColumnCategory } from '@/lib/ultra-table/column-types/types'

const CATEGORY_LIST: { key: ColumnCategory; label: string; description: string }[] = [
  { key: 'basic', label: 'Basic', description: 'Text, numbers, dates' },
  { key: 'selection', label: 'Selection', description: 'Dropdowns, tags, status' },
  { key: 'datetime', label: 'Date & Time', description: 'Dates, times, durations' },
  { key: 'people', label: 'People', description: 'Users, assignees' },
  { key: 'media', label: 'Media', description: 'Images, files, videos' },
  { key: 'contact', label: 'Contact', description: 'Email, phone, location' },
  { key: 'code', label: 'Code & Tech', description: 'QR codes, JSON, barcodes' },
  { key: 'relations', label: 'Relations', description: 'Links, lookups, rollups' },
  { key: 'formulas', label: 'Formulas', description: 'Calculated fields' },
  { key: 'visual', label: 'Visual', description: 'Progress, colors, icons' },
  { key: 'advanced', label: 'Advanced', description: 'AI, signatures, voting' },
]

interface ColumnTypeSelectorProps {
  onSelect: (type: ColumnType) => void
}

export function ColumnTypeSelector({ onSelect }: ColumnTypeSelectorProps) {
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<ColumnCategory>('basic')

  const allTypes = getAllColumnTypes()
  const filteredTypes = search
    ? allTypes.filter(type =>
        type.name.toLowerCase().includes(search.toLowerCase()) ||
        type.description.toLowerCase().includes(search.toLowerCase()) ||
        type.type.toLowerCase().includes(search.toLowerCase())
      )
    : getColumnTypesByCategory(selectedCategory)

  const airtableTypes = new Set(getAirtableCompatibleTypes().map(t => t.type))

  return (
    <div className="h-full flex flex-col">
      <div className="p-6 border-b space-y-4">
        <div>
          <h2 className="text-2xl font-bold">Add Column</h2>
          <p className="text-muted-foreground">
            Choose from 55 column types
          </p>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search column types..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Categories */}
        {!search && (
          <div className="w-48 border-r p-2 overflow-auto">
            {CATEGORY_LIST.map(cat => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={cn(
                  'w-full text-left px-3 py-2 rounded-md text-sm transition-colors',
                  selectedCategory === cat.key
                    ? 'bg-[#279989]/10 text-[#279989] font-medium'
                    : 'hover:bg-muted'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Column Types */}
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-2">
            {search && (
              <p className="text-sm text-muted-foreground mb-4">
                {filteredTypes.length} results for "{search}"
              </p>
            )}

            {filteredTypes.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No column types found
              </p>
            ) : (
              filteredTypes.map(type => {
                const Icon = type.icon
                const isAirtable = airtableTypes.has(type.type)

                return (
                  <button
                    key={type.type}
                    onClick={() => onSelect(type.type)}
                    className="w-full flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 hover:border-[#279989] transition-colors text-left"
                  >
                    <div className="p-2 rounded-md bg-muted">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{type.name}</span>
                        {isAirtable && (
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                            Airtable
                          </Badge>
                        )}
                        {!isAirtable && (
                          <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {type.description}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Footer */}
      <div className="p-4 border-t bg-muted/50">
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              Airtable
            </Badge>
            <span>= Airtable compatible</span>
          </div>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
            <span>= Rivest exclusive</span>
          </div>
        </div>
      </div>
    </div>
  )
}
