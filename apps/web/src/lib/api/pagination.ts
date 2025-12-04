/**
 * Cursor pagination parameters
 */
export interface CursorPaginationParams {
  limit?: number
  cursor?: string
  direction?: 'forward' | 'backward'
}

/**
 * Cursor pagination result
 */
export interface CursorPaginationResult<T> {
  items: T[]
  nextCursor: string | null
  prevCursor: string | null
  hasMore: boolean
}

/**
 * Apply cursor pagination to a data array
 * Use this after fetching data with order and limit from Supabase
 */
export function applyCursorPaginationToData<T extends { created_at: string; id: string }>(
  data: T[],
  params: CursorPaginationParams
): CursorPaginationResult<T> {
  const { limit = 50, cursor } = params

  const hasMore = data.length > limit
  const items = hasMore ? data.slice(0, limit) : data

  // Create cursors
  const nextCursor = hasMore && items.length > 0
    ? `${items[items.length - 1].created_at}|${items[items.length - 1].id}`
    : null

  const prevCursor = cursor && items.length > 0
    ? `${items[0].created_at}|${items[0].id}`
    : null

  return {
    items,
    nextCursor,
    prevCursor,
    hasMore,
  }
}

/**
 * Parse cursor for Supabase filter
 */
export function parseCursorForFilter(cursor: string | undefined): { timestamp: string; id: string } | null {
  if (!cursor) return null
  const [timestamp, id] = cursor.split('|')
  if (!timestamp || !id) return null
  return { timestamp, id }
}

/**
 * Build cursor filter string for Supabase .or() method
 */
export function buildCursorFilter(
  cursor: string | undefined,
  direction: 'forward' | 'backward' = 'forward',
  orderField: string = 'created_at'
): string | null {
  const parsed = parseCursorForFilter(cursor)
  if (!parsed) return null

  const { timestamp, id } = parsed

  if (direction === 'forward') {
    return `${orderField}.lt.${timestamp},and(${orderField}.eq.${timestamp},id.lt.${id})`
  } else {
    return `${orderField}.gt.${timestamp},and(${orderField}.eq.${timestamp},id.gt.${id})`
  }
}

/**
 * Hook-friendly infinite query fetcher
 */
export function createInfiniteFetcher<T>(
  fetchFn: (params: CursorPaginationParams) => Promise<CursorPaginationResult<T>>
) {
  return async ({ pageParam }: { pageParam?: string }) => {
    return fetchFn({ cursor: pageParam, limit: 50 })
  }
}

/**
 * Create next page param getter for useInfiniteQuery
 */
export function getNextPageParam<T>(lastPage: CursorPaginationResult<T>) {
  return lastPage.nextCursor ?? undefined
}

/**
 * Create previous page param getter for useInfiniteQuery
 */
export function getPreviousPageParam<T>(firstPage: CursorPaginationResult<T>) {
  return firstPage.prevCursor ?? undefined
}
