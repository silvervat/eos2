'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, useEffect, type ReactNode, lazy, Suspense } from 'react'
import { createQueryClient } from './query/config'

// Lazy load devtools only in development
const ReactQueryDevtoolsProduction = lazy(() =>
  import('@tanstack/react-query-devtools/build/modern/production.js').then(
    (d) => ({
      default: d.ReactQueryDevtools,
    }),
  ),
)

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient())
  const [showDevtools, setShowDevtools] = useState(false)

  // Listen for cache clear events from admin panel
  useEffect(() => {
    const handleClearCache = () => {
      queryClient.clear()
    }

    window.addEventListener('clear-query-cache', handleClearCache)
    return () => {
      window.removeEventListener('clear-query-cache', handleClearCache)
    }
  }, [queryClient])

  // Toggle devtools with keyboard shortcut (Ctrl/Cmd + Shift + Q)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Q') {
        setShowDevtools((prev) => !prev)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* Development devtools */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
      )}
      {/* Production devtools (lazy loaded, toggled with Ctrl+Shift+Q) */}
      {showDevtools && process.env.NODE_ENV === 'production' && (
        <Suspense fallback={null}>
          <ReactQueryDevtoolsProduction />
        </Suspense>
      )}
    </QueryClientProvider>
  )
}
