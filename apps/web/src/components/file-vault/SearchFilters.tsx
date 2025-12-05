'use client'

import { useState, useCallback } from 'react'
import {
  Filter,
  X,
  Image,
  Film,
  Music,
  FileText,
  Archive,
  File,
  Calendar,
  HardDrive,
  ChevronDown,
} from 'lucide-react'
import { Button } from '@rivest/ui'

// Filter types
export interface FileFilters {
  mimeCategory?: string | null
  extension?: string | null
  minSize?: number | null
  maxSize?: number | null
  dateFrom?: string | null
  dateTo?: string | null
}

interface SearchFiltersProps {
  filters: FileFilters
  onFiltersChange: (filters: FileFilters) => void
  onClear: () => void
}

// MIME categories
const MIME_CATEGORIES = [
  { id: 'image', label: 'Pildid', icon: Image, mimePrefix: 'image/' },
  { id: 'video', label: 'Videod', icon: Film, mimePrefix: 'video/' },
  { id: 'audio', label: 'Audio', icon: Music, mimePrefix: 'audio/' },
  { id: 'document', label: 'Dokumendid', icon: FileText, extensions: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'] },
  { id: 'archive', label: 'Arhiivid', icon: Archive, extensions: ['zip', 'rar', '7z', 'tar', 'gz'] },
]

// Size presets
const SIZE_PRESETS = [
  { label: 'Alla 1 MB', min: null, max: 1024 * 1024 },
  { label: '1-10 MB', min: 1024 * 1024, max: 10 * 1024 * 1024 },
  { label: '10-100 MB', min: 10 * 1024 * 1024, max: 100 * 1024 * 1024 },
  { label: 'Üle 100 MB', min: 100 * 1024 * 1024, max: null },
]

// Date presets
const DATE_PRESETS = [
  { label: 'Täna', days: 0 },
  { label: 'Viimased 7 päeva', days: 7 },
  { label: 'Viimased 30 päeva', days: 30 },
  { label: 'Viimased 90 päeva', days: 90 },
  { label: 'See aasta', days: 365 },
]

export function SearchFilters({ filters, onFiltersChange, onClear }: SearchFiltersProps) {
  const [showFilters, setShowFilters] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(v => v !== null && v !== undefined).length

  // Handle MIME category change
  const handleMimeCategory = useCallback((categoryId: string | null) => {
    onFiltersChange({
      ...filters,
      mimeCategory: categoryId === filters.mimeCategory ? null : categoryId,
      extension: null, // Clear extension when changing category
    })
  }, [filters, onFiltersChange])

  // Handle size change
  const handleSizeChange = useCallback((min: number | null, max: number | null) => {
    const isSame = filters.minSize === min && filters.maxSize === max
    onFiltersChange({
      ...filters,
      minSize: isSame ? null : min,
      maxSize: isSame ? null : max,
    })
  }, [filters, onFiltersChange])

  // Handle date change
  const handleDatePreset = useCallback((days: number) => {
    const now = new Date()
    const from = new Date()

    if (days === 0) {
      from.setHours(0, 0, 0, 0)
    } else {
      from.setDate(now.getDate() - days)
    }

    const dateFrom = from.toISOString().split('T')[0]
    const isSame = filters.dateFrom === dateFrom

    onFiltersChange({
      ...filters,
      dateFrom: isSame ? null : dateFrom,
      dateTo: isSame ? null : now.toISOString().split('T')[0],
    })
  }, [filters, onFiltersChange])

  // Get active category
  const activeCategory = MIME_CATEGORIES.find(c => c.id === filters.mimeCategory)

  return (
    <div className="relative">
      {/* Filter toggle button */}
      <Button
        variant="outline"
        size="sm"
        className={`gap-2 ${activeFilterCount > 0 ? 'border-[#279989] text-[#279989]' : ''}`}
        onClick={() => setShowFilters(!showFilters)}
      >
        <Filter className="w-4 h-4" />
        <span className="hidden sm:inline">Filtrid</span>
        {activeFilterCount > 0 && (
          <span className="bg-[#279989] text-white text-xs px-1.5 py-0.5 rounded-full">
            {activeFilterCount}
          </span>
        )}
        <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
      </Button>

      {/* Filter dropdown */}
      {showFilters && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-slate-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-slate-100">
            <span className="font-medium text-slate-900">Filtrid</span>
            {activeFilterCount > 0 && (
              <button
                onClick={() => {
                  onClear()
                  setShowFilters(false)
                }}
                className="text-sm text-[#279989] hover:underline"
              >
                Tühjenda
              </button>
            )}
          </div>

          {/* Filter sections */}
          <div className="p-3 space-y-4 max-h-96 overflow-y-auto">
            {/* File type filter */}
            <div>
              <button
                onClick={() => setActiveSection(activeSection === 'type' ? null : 'type')}
                className="flex items-center justify-between w-full text-sm font-medium text-slate-700 mb-2"
              >
                <span className="flex items-center gap-2">
                  <File className="w-4 h-4" />
                  Faili tüüp
                </span>
                {activeCategory && (
                  <span className="text-xs bg-[#279989]/10 text-[#279989] px-2 py-0.5 rounded">
                    {activeCategory.label}
                  </span>
                )}
              </button>

              {(activeSection === 'type' || !activeSection) && (
                <div className="flex flex-wrap gap-2">
                  {MIME_CATEGORIES.map((cat) => {
                    const Icon = cat.icon
                    const isActive = filters.mimeCategory === cat.id
                    return (
                      <button
                        key={cat.id}
                        onClick={() => handleMimeCategory(cat.id)}
                        className={`
                          flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm
                          transition-colors
                          ${isActive
                            ? 'bg-[#279989] text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }
                        `}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {cat.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Size filter */}
            <div>
              <button
                onClick={() => setActiveSection(activeSection === 'size' ? null : 'size')}
                className="flex items-center justify-between w-full text-sm font-medium text-slate-700 mb-2"
              >
                <span className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4" />
                  Faili suurus
                </span>
                {(filters.minSize !== null || filters.maxSize !== null) && (
                  <span className="text-xs bg-[#279989]/10 text-[#279989] px-2 py-0.5 rounded">
                    Aktiivne
                  </span>
                )}
              </button>

              {(activeSection === 'size' || !activeSection) && (
                <div className="flex flex-wrap gap-2">
                  {SIZE_PRESETS.map((preset, idx) => {
                    const isActive = filters.minSize === preset.min && filters.maxSize === preset.max
                    return (
                      <button
                        key={idx}
                        onClick={() => handleSizeChange(preset.min, preset.max)}
                        className={`
                          px-2.5 py-1.5 rounded-lg text-sm transition-colors
                          ${isActive
                            ? 'bg-[#279989] text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }
                        `}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Date filter */}
            <div>
              <button
                onClick={() => setActiveSection(activeSection === 'date' ? null : 'date')}
                className="flex items-center justify-between w-full text-sm font-medium text-slate-700 mb-2"
              >
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Kuupäev
                </span>
                {filters.dateFrom && (
                  <span className="text-xs bg-[#279989]/10 text-[#279989] px-2 py-0.5 rounded">
                    Aktiivne
                  </span>
                )}
              </button>

              {(activeSection === 'date' || !activeSection) && (
                <div className="flex flex-wrap gap-2">
                  {DATE_PRESETS.map((preset, idx) => {
                    const now = new Date()
                    const from = new Date()
                    if (preset.days === 0) {
                      from.setHours(0, 0, 0, 0)
                    } else {
                      from.setDate(now.getDate() - preset.days)
                    }
                    const dateFrom = from.toISOString().split('T')[0]
                    const isActive = filters.dateFrom === dateFrom

                    return (
                      <button
                        key={idx}
                        onClick={() => handleDatePreset(preset.days)}
                        className={`
                          px-2.5 py-1.5 rounded-lg text-sm transition-colors
                          ${isActive
                            ? 'bg-[#279989] text-white'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          }
                        `}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-slate-100">
            <Button
              size="sm"
              className="w-full"
              style={{ backgroundColor: '#279989' }}
              onClick={() => setShowFilters(false)}
            >
              Rakenda filtrid
            </Button>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {activeFilterCount > 0 && !showFilters && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {activeCategory && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#279989]/10 text-[#279989] rounded text-xs">
              {activeCategory.label}
              <button onClick={() => handleMimeCategory(null)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {(filters.minSize !== null || filters.maxSize !== null) && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#279989]/10 text-[#279989] rounded text-xs">
              Suurus
              <button onClick={() => handleSizeChange(null, null)}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
          {filters.dateFrom && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#279989]/10 text-[#279989] rounded text-xs">
              Kuupäev
              <button onClick={() => onFiltersChange({ ...filters, dateFrom: null, dateTo: null })}>
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default SearchFilters
