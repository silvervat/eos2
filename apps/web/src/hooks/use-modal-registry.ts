'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  getRegisteredModals,
  subscribeToRegistry,
  registerModal,
  unregisterModal,
  registryEntryToTemplate,
  type ModalRegistryEntry,
} from '@/lib/modal-registry'
import type { ModalTemplate } from '@/components/admin/modal-designer/types'

/**
 * Hook for accessing and managing the modal registry
 */
export function useModalRegistry() {
  const [modals, setModals] = useState<ModalRegistryEntry[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Subscribe to registry changes
    const unsubscribe = subscribeToRegistry((entries) => {
      setModals(entries)
      setIsLoading(false)
    })

    return unsubscribe
  }, [])

  // Convert registry entries to CMS templates
  const getAsTemplates = useCallback((): Partial<ModalTemplate>[] => {
    return modals.map(registryEntryToTemplate)
  }, [modals])

  // Group modals by category
  const groupedByCategory = useCallback(() => {
    const groups: Record<string, ModalRegistryEntry[]> = {}
    modals.forEach((modal) => {
      if (!groups[modal.category]) {
        groups[modal.category] = []
      }
      groups[modal.category].push(modal)
    })
    return groups
  }, [modals])

  // Group modals by component path
  const groupedByComponent = useCallback(() => {
    const groups: Record<string, ModalRegistryEntry[]> = {}
    modals.forEach((modal) => {
      if (!groups[modal.componentPath]) {
        groups[modal.componentPath] = []
      }
      groups[modal.componentPath].push(modal)
    })
    return groups
  }, [modals])

  // Get modal count by type
  const countByType = useCallback(() => {
    const counts: Record<string, number> = {}
    modals.forEach((modal) => {
      counts[modal.type] = (counts[modal.type] || 0) + 1
    })
    return counts
  }, [modals])

  // Search modals
  const searchModals = useCallback(
    (query: string): ModalRegistryEntry[] => {
      const lowerQuery = query.toLowerCase()
      return modals.filter(
        (modal) =>
          modal.name.toLowerCase().includes(lowerQuery) ||
          modal.key.toLowerCase().includes(lowerQuery) ||
          modal.description?.toLowerCase().includes(lowerQuery) ||
          modal.componentPath.toLowerCase().includes(lowerQuery)
      )
    },
    [modals]
  )

  return {
    modals,
    isLoading,
    count: modals.length,
    getAsTemplates,
    groupedByCategory,
    groupedByComponent,
    countByType,
    searchModals,
    registerModal,
    unregisterModal,
  }
}

/**
 * Hook for getting modals by category
 */
export function useModalsByCategory(category: string) {
  const { modals } = useModalRegistry()
  return modals.filter((modal) => modal.category === category)
}

/**
 * Hook for getting modal by key
 */
export function useModalByKey(key: string) {
  const { modals } = useModalRegistry()
  return modals.find((modal) => modal.key === key)
}

export type { ModalRegistryEntry }
