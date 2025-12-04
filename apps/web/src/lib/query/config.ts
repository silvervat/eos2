/**
 * React Query Configuration
 * Centralized caching configuration and utilities
 */

import { QueryClient } from '@tanstack/react-query'

// ============================================
// STALE TIMES (how long data is considered fresh)
// ============================================

export const staleTimes = {
  /** Real-time data - always refetch */
  realTime: 0,

  /** Fast-changing data - 30 seconds */
  fast: 30 * 1000,

  /** Standard data - 1 minute */
  standard: 60 * 1000,

  /** Slow-changing data - 5 minutes */
  slow: 5 * 60 * 1000,

  /** Reference data (rarely changes) - 30 minutes */
  reference: 30 * 60 * 1000,

  /** Static data - 1 hour */
  static: 60 * 60 * 1000,

  /** Infinite - never automatically refetch */
  infinite: Infinity,
} as const

// ============================================
// CACHE TIMES (how long to keep in cache)
// ============================================

export const cacheTimes = {
  /** Short-lived cache - 5 minutes */
  short: 5 * 60 * 1000,

  /** Standard cache - 10 minutes */
  standard: 10 * 60 * 1000,

  /** Long cache - 30 minutes */
  long: 30 * 60 * 1000,

  /** Extended cache - 1 hour */
  extended: 60 * 60 * 1000,

  /** Day cache - 24 hours */
  day: 24 * 60 * 60 * 1000,
} as const

// ============================================
// QUERY OPTIONS BY DATA TYPE
// ============================================

export const queryOptions = {
  /** Real-time data (attendance, notifications) */
  realTime: {
    staleTime: staleTimes.realTime,
    gcTime: cacheTimes.short,
    refetchOnWindowFocus: true,
    refetchInterval: 30 * 1000, // 30 seconds
  },

  /** Lists that update frequently */
  dynamicList: {
    staleTime: staleTimes.fast,
    gcTime: cacheTimes.standard,
    refetchOnWindowFocus: true,
  },

  /** Standard CRUD lists */
  standardList: {
    staleTime: staleTimes.standard,
    gcTime: cacheTimes.standard,
    refetchOnWindowFocus: true,
  },

  /** Detail pages */
  detail: {
    staleTime: staleTimes.standard,
    gcTime: cacheTimes.long,
    refetchOnWindowFocus: false,
  },

  /** Reference data (categories, types, units) */
  reference: {
    staleTime: staleTimes.reference,
    gcTime: cacheTimes.extended,
    refetchOnWindowFocus: false,
  },

  /** Static configuration */
  static: {
    staleTime: staleTimes.static,
    gcTime: cacheTimes.day,
    refetchOnWindowFocus: false,
  },

  /** User-specific data */
  user: {
    staleTime: staleTimes.slow,
    gcTime: cacheTimes.long,
    refetchOnWindowFocus: true,
  },

  /** Statistics and analytics */
  stats: {
    staleTime: staleTimes.slow,
    gcTime: cacheTimes.standard,
    refetchOnWindowFocus: true,
  },

  /** Infinite scroll lists */
  infinite: {
    staleTime: staleTimes.fast,
    gcTime: cacheTimes.long,
    refetchOnWindowFocus: false,
    getNextPageParam: <T extends { nextCursor: string | null }>(lastPage: T) =>
      lastPage.nextCursor ?? undefined,
    getPreviousPageParam: <T extends { prevCursor: string | null }>(firstPage: T) =>
      firstPage.prevCursor ?? undefined,
  },
} as const

// ============================================
// RECOMMENDED OPTIONS BY ENTITY
// ============================================

export const entityQueryOptions = {
  // Companies
  'companies.list': queryOptions.standardList,
  'companies.detail': queryOptions.detail,

  // Projects
  'projects.list': queryOptions.standardList,
  'projects.detail': queryOptions.detail,

  // Quotes
  'quotes.list': queryOptions.standardList,
  'quotes.detail': queryOptions.detail,
  'quotes.statistics': queryOptions.stats,

  // Quote Articles & Units (reference data)
  'quoteArticles.list': queryOptions.reference,
  'quoteUnits.list': queryOptions.reference,

  // Attendance (real-time)
  'attendance.current': queryOptions.realTime,
  'attendance.today': queryOptions.realTime,
  'attendance.list': queryOptions.dynamicList,

  // Leave Requests
  'leaveRequests.list': queryOptions.standardList,
  'leaveRequests.pending': queryOptions.dynamicList,
  'leaveRequests.current': queryOptions.realTime,

  // Leave Types & Balances
  'leaveTypes.list': queryOptions.reference,
  'leaveBalances': queryOptions.user,

  // Holidays
  'holidays.byYear': queryOptions.static,

  // File Vault
  'fileVault.files': queryOptions.standardList,
  'fileVault.filesInfinite': queryOptions.infinite,
  'fileVault.folders': queryOptions.standardList,
  'fileVault.stats': queryOptions.stats,

  // Warehouse
  'warehouse.locations': queryOptions.reference,
  'warehouse.categories': queryOptions.reference,
  'warehouse.assets': queryOptions.standardList,
  'warehouse.lowStock': queryOptions.dynamicList,

  // Notifications
  'notifications.unread': queryOptions.realTime,
  'notifications.count': queryOptions.realTime,

  // Dashboard
  'dashboard.stats': queryOptions.stats,
  'dashboard.recentActivity': queryOptions.dynamicList,

  // User
  'user.current': queryOptions.user,
  'user.profile': queryOptions.user,
} as const

// ============================================
// QUERY CLIENT FACTORY
// ============================================

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: staleTimes.standard,
        gcTime: cacheTimes.standard,
        refetchOnWindowFocus: false,
        retry: 1,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      },
      mutations: {
        retry: 0,
      },
    },
  })
}

// ============================================
// CACHE INVALIDATION HELPERS
// ============================================

/**
 * Invalidate all queries for an entity type
 */
export function invalidateEntity(queryClient: QueryClient, entity: string) {
  return queryClient.invalidateQueries({ queryKey: [entity] })
}

/**
 * Invalidate specific entity by ID
 */
export function invalidateEntityById(queryClient: QueryClient, entity: string, id: string) {
  return queryClient.invalidateQueries({ queryKey: [entity, 'detail', id] })
}

/**
 * Invalidate all lists for an entity
 */
export function invalidateEntityLists(queryClient: QueryClient, entity: string) {
  return queryClient.invalidateQueries({ queryKey: [entity, 'list'] })
}

/**
 * Prefetch entity detail
 */
export async function prefetchEntityDetail<T>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  fetchFn: () => Promise<T>
) {
  await queryClient.prefetchQuery({
    queryKey,
    queryFn: fetchFn,
    staleTime: staleTimes.slow,
  })
}

// ============================================
// OPTIMISTIC UPDATE HELPERS
// ============================================

export interface OptimisticContext<T> {
  previousData: T | undefined
}

/**
 * Create optimistic update handlers for list mutations
 */
export function createOptimisticListUpdate<TItem extends { id: string }, TVariables>(
  queryClient: QueryClient,
  queryKey: readonly unknown[],
  operation: 'add' | 'update' | 'delete'
) {
  return {
    onMutate: async (variables: TVariables): Promise<OptimisticContext<TItem[]>> => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey })

      // Snapshot previous value
      const previousData = queryClient.getQueryData<TItem[]>(queryKey)

      // Optimistically update
      if (previousData) {
        let newData: TItem[]

        switch (operation) {
          case 'add':
            newData = [...previousData, variables as unknown as TItem]
            break
          case 'update':
            newData = previousData.map((item) =>
              item.id === (variables as unknown as TItem).id
                ? { ...item, ...(variables as unknown as Partial<TItem>) }
                : item
            )
            break
          case 'delete':
            newData = previousData.filter(
              (item) => item.id !== (variables as unknown as { id: string }).id
            )
            break
          default:
            newData = previousData
        }

        queryClient.setQueryData(queryKey, newData)
      }

      return { previousData }
    },

    onError: (
      _err: Error,
      _variables: TVariables,
      context: OptimisticContext<TItem[]> | undefined
    ) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData)
      }
    },

    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey })
    },
  }
}

// ============================================
// INFINITE QUERY HELPERS
// ============================================

export interface InfiniteQueryPage<T> {
  items: T[]
  nextCursor: string | null
  prevCursor: string | null
  hasMore: boolean
}

/**
 * Get all items from infinite query pages
 */
export function flattenInfiniteData<T>(
  data: { pages: InfiniteQueryPage<T>[] } | undefined
): T[] {
  if (!data?.pages) return []
  return data.pages.flatMap((page) => page.items)
}

/**
 * Get total count from infinite query
 */
export function getInfiniteTotalCount<T>(
  data: { pages: InfiniteQueryPage<T>[] } | undefined
): number {
  return flattenInfiniteData(data).length
}
