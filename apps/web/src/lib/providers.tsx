'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect, type ReactNode } from 'react'
import { createQueryClient } from './query/config'

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => createQueryClient())

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
