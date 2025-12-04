'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect, type ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  )

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

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
