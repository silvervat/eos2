'use client'

/**
 * File Table Skeleton
 * Loading placeholder for file vault table
 */

interface FileTableSkeletonProps {
  rows?: number
  rowHeight?: number
  compact?: boolean
}

export function FileTableSkeleton({
  rows = 10,
  rowHeight = 48,
  compact = false,
}: FileTableSkeletonProps) {
  const height = compact ? 36 : rowHeight

  return (
    <div className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      {/* Header skeleton */}
      <div className="border-b border-slate-200 bg-slate-50 px-3 py-3">
        <div className="flex items-center gap-4">
          <div className="w-4 h-4 bg-slate-200 rounded animate-pulse" />
          <div className="w-20 h-4 bg-slate-200 rounded animate-pulse" />
          <div className="w-16 h-4 bg-slate-200 rounded animate-pulse hidden sm:block" />
          <div className="w-16 h-4 bg-slate-200 rounded animate-pulse hidden md:block" />
          <div className="w-20 h-4 bg-slate-200 rounded animate-pulse hidden lg:block" />
          <div className="ml-auto w-20 h-4 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Row skeletons */}
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-3"
            style={{ height }}
          >
            {/* Checkbox */}
            <div className="w-4 h-4 bg-slate-200 rounded animate-pulse" style={{ animationDelay: `${i * 50}ms` }} />

            {/* Icon + Name */}
            <div className="flex items-center gap-2 flex-1">
              <div
                className={`${compact ? 'w-6 h-6' : 'w-8 h-8'} bg-slate-200 rounded animate-pulse`}
                style={{ animationDelay: `${i * 50 + 25}ms` }}
              />
              <div
                className={`${compact ? 'h-3' : 'h-4'} bg-slate-200 rounded animate-pulse`}
                style={{
                  width: `${100 + Math.random() * 100}px`,
                  animationDelay: `${i * 50 + 50}ms`,
                }}
              />
            </div>

            {/* Type badge */}
            <div className="hidden sm:block">
              <div
                className="w-12 h-5 bg-slate-200 rounded animate-pulse"
                style={{ animationDelay: `${i * 50 + 75}ms` }}
              />
            </div>

            {/* Size */}
            <div className="hidden md:block w-16">
              <div
                className="w-12 h-4 bg-slate-200 rounded animate-pulse"
                style={{ animationDelay: `${i * 50 + 100}ms` }}
              />
            </div>

            {/* Date */}
            <div className="hidden lg:block w-24">
              <div
                className="w-20 h-4 bg-slate-200 rounded animate-pulse"
                style={{ animationDelay: `${i * 50 + 125}ms` }}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-1 w-24 justify-end">
              {[1, 2, 3].map((j) => (
                <div
                  key={j}
                  className="w-6 h-6 bg-slate-200 rounded animate-pulse"
                  style={{ animationDelay: `${i * 50 + 150 + j * 25}ms` }}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Stats Cards Skeleton
 */
export function StatsCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="bg-white rounded-lg border border-slate-200 p-4"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 bg-slate-200 rounded-lg animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
            <div className="flex-1">
              <div
                className="h-6 w-16 bg-slate-200 rounded animate-pulse mb-1"
                style={{ animationDelay: `${i * 100 + 50}ms` }}
              />
              <div
                className="h-3 w-12 bg-slate-200 rounded animate-pulse"
                style={{ animationDelay: `${i * 100 + 100}ms` }}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Folder Tree Skeleton
 */
export function FolderTreeSkeleton() {
  return (
    <div className="space-y-2 p-4">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-2">
          <div
            className="w-4 h-4 bg-slate-200 rounded animate-pulse"
            style={{ animationDelay: `${i * 75}ms` }}
          />
          <div
            className="w-5 h-5 bg-slate-200 rounded animate-pulse"
            style={{ animationDelay: `${i * 75 + 25}ms` }}
          />
          <div
            className="h-4 bg-slate-200 rounded animate-pulse"
            style={{
              width: `${60 + Math.random() * 60}px`,
              animationDelay: `${i * 75 + 50}ms`,
            }}
          />
        </div>
      ))}
    </div>
  )
}

/**
 * Full Page Skeleton (combines all elements)
 */
export function FileVaultPageSkeleton() {
  return (
    <div className="flex h-[calc(100vh-80px)]">
      {/* Sidebar skeleton */}
      <div className="w-64 flex-shrink-0 border-r border-slate-200 hidden lg:block">
        <div className="p-4 border-b border-slate-200">
          <div className="h-5 w-32 bg-slate-200 rounded animate-pulse" />
        </div>
        <FolderTreeSkeleton />
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 p-6">
        {/* Header skeleton */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-32 h-8 bg-slate-200 rounded animate-pulse" />
            <div className="w-24 h-8 bg-slate-200 rounded animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-64 h-9 bg-slate-200 rounded animate-pulse" />
            <div className="w-20 h-9 bg-slate-200 rounded animate-pulse" />
          </div>
        </div>

        {/* Table skeleton */}
        <FileTableSkeleton rows={15} />
      </div>
    </div>
  )
}

export default FileTableSkeleton
