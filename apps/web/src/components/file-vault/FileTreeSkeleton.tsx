'use client'

/**
 * FileTreeSkeleton - Loading skeleton for FileTree
 * Prevents layout shift by showing placeholder while tree loads
 */

export function FileTreeSkeleton() {
  return (
    <div className="h-full border-r border-slate-200 bg-slate-50/50">
      {/* Header skeleton */}
      <div className="p-3 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <div className="h-5 w-24 bg-slate-200 rounded animate-pulse" />
          <div className="h-6 w-6 bg-slate-200 rounded animate-pulse" />
        </div>
      </div>

      {/* Tree items skeleton */}
      <div className="p-2 space-y-1">
        {/* Root folder */}
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="w-4 h-4 bg-slate-200 rounded animate-pulse" />
          <div className="h-4 w-16 bg-slate-200 rounded animate-pulse" />
        </div>

        {/* Nested folders */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-2 px-2 py-1.5 ml-4">
            <div className="w-4 h-4 bg-slate-200 rounded animate-pulse" />
            <div
              className="h-4 bg-slate-200 rounded animate-pulse"
              style={{ width: `${60 + Math.random() * 40}%` }}
            />
          </div>
        ))}

        {/* Second level nesting */}
        {[1, 2].map((i) => (
          <div key={`nested-${i}`} className="flex items-center gap-2 px-2 py-1.5 ml-8">
            <div className="w-4 h-4 bg-slate-200 rounded animate-pulse" />
            <div
              className="h-4 bg-slate-200 rounded animate-pulse"
              style={{ width: `${50 + Math.random() * 30}%` }}
            />
          </div>
        ))}

        {/* More folders */}
        {[1, 2, 3].map((i) => (
          <div key={`more-${i}`} className="flex items-center gap-2 px-2 py-1.5 ml-4">
            <div className="w-4 h-4 bg-slate-200 rounded animate-pulse" />
            <div
              className="h-4 bg-slate-200 rounded animate-pulse"
              style={{ width: `${55 + Math.random() * 35}%` }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export default FileTreeSkeleton
