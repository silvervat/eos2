'use client'

import { useEffect, useState, type ReactNode } from 'react'

interface ClientOnlyProps {
  children: ReactNode
  fallback?: ReactNode
}

/**
 * Wrapper that only renders children on the client side.
 * Useful for components that don't work with SSR (like charts).
 */
export function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return fallback
  }

  return <>{children}</>
}

export default ClientOnly
