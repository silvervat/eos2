'use client'

import { ChevronDown, Loader2, Search, X, FolderOpen } from 'lucide-react'
import { Button } from '@rivest/ui'

interface SearchResultsBarProps {
  query: string
  showing: number
  total: number
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
  onClear: () => void
  onNavigateToFolder?: (folderId: string, folderName: string) => void
  groupedResults?: {
    folderId: string | null
    folderName: string
    folderPath: string
    count: number
  }[]
}

/**
 * Search results status bar
 * Shows count, load more, and folder grouping for search results
 */
export function SearchResultsBar({
  query,
  showing,
  total,
  hasMore,
  isLoading,
  onLoadMore,
  onClear,
  onNavigateToFolder,
  groupedResults,
}: SearchResultsBarProps) {
  const remaining = total - showing

  return (
    <div className="bg-slate-50 border-b border-slate-200">
      {/* Main status bar */}
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400" />
          <span className="text-sm text-slate-600">
            Otsing: <span className="font-medium text-slate-900">"{query}"</span>
          </span>
          <span className="text-slate-400">|</span>
          <span className="text-sm text-slate-600">
            Näitan <span className="font-medium">{showing}</span>
            {total > 0 && (
              <>
                {' '}failist{' '}
                <span className="font-medium">{total}</span>
              </>
            )}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Load more button */}
          {hasMore && remaining > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onLoadMore}
              disabled={isLoading}
              className="gap-1.5"
            >
              {isLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
              + veel {Math.min(remaining, 100)} faili
            </Button>
          )}

          {/* Clear search button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onClear}
            className="gap-1.5"
          >
            <X className="w-3.5 h-3.5" />
            Tühista otsing
          </Button>
        </div>
      </div>

      {/* Folder grouping (optional) */}
      {groupedResults && groupedResults.length > 1 && (
        <div className="px-4 py-2 border-t border-slate-200">
          <p className="text-xs text-slate-500 mb-2">Tulemused kaustade kaupa:</p>
          <div className="flex flex-wrap gap-2">
            {groupedResults.map((group) => (
              <button
                key={group.folderId || 'root'}
                onClick={() => {
                  if (onNavigateToFolder && group.folderId) {
                    onNavigateToFolder(group.folderId, group.folderName)
                  }
                }}
                className="inline-flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded text-xs hover:bg-slate-50 transition-colors"
              >
                <FolderOpen className="w-3 h-3 text-slate-400" />
                <span className="text-slate-700">{group.folderName || 'Juurkaust'}</span>
                <span className="text-slate-400">({group.count})</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SearchResultsBar
