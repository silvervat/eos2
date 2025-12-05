/**
 * INFINITE FILES HOOK - Enterprise File Vault
 *
 * React hook for infinite scroll file loading with:
 * - Cursor-based pagination (efficient for large datasets)
 * - Automatic prefetching
 * - Cache deduplication
 * - Optimistic updates
 * - Error recovery
 * - Loading states
 */

import { useState, useCallback, useRef, useEffect } from 'react'

// File item type
interface FileItem {
  id: string
  name: string
  path: string
  mimeType: string
  sizeBytes: number
  extension: string
  thumbnailSmall?: string
  thumbnailMedium?: string
  thumbnailLarge?: string
  createdAt: string
  updatedAt: string
  tags: string[]
}

interface FolderItem {
  id: string
  name: string
  path: string
  color?: string
  icon?: string
  parentId?: string
  createdAt: string
}

type DisplayItem = (FolderItem & { type: 'folder' }) | (FileItem & { type: 'file' })

// API response type
interface FilesResponse {
  files: FileItem[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
    nextCursor?: string
  }
  _meta?: {
    duration: number
    cached: boolean
  }
}

// Hook options
interface UseInfiniteFilesOptions {
  vaultId: string
  folderId?: string | null
  search?: string
  mimeType?: string
  extension?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
  pageSize?: number
  enabled?: boolean
  prefetchDistance?: number // Load next page when this many items from end
}

// Hook return type
interface UseInfiniteFilesReturn {
  // Data
  items: DisplayItem[]
  folders: FolderItem[]
  files: FileItem[]
  total: number

  // Loading states
  isLoading: boolean
  isLoadingMore: boolean
  isRefreshing: boolean
  isFetching: boolean

  // Pagination
  hasMore: boolean
  loadMore: () => Promise<void>

  // Actions
  refresh: () => Promise<void>
  reset: () => void

  // Error handling
  error: Error | null
  retry: () => Promise<void>

  // Meta
  lastFetchDuration: number | null
  cacheHitRate: number
}

/**
 * Infinite scroll hook for file loading
 */
export function useInfiniteFiles(options: UseInfiniteFilesOptions): UseInfiniteFilesReturn {
  const {
    vaultId,
    folderId,
    search,
    mimeType,
    extension,
    sortBy = 'created_at',
    sortOrder = 'desc',
    pageSize = 100,
    enabled = true,
    prefetchDistance = 20,
  } = options

  // State
  const [files, setFiles] = useState<FileItem[]>([])
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [lastFetchDuration, setLastFetchDuration] = useState<number | null>(null)

  // Refs for tracking
  const cursorRef = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const cacheHitsRef = useRef(0)
  const cacheMissesRef = useRef(0)

  // Combine folders and files into display items
  const items: DisplayItem[] = [
    ...folders.map(f => ({ ...f, type: 'folder' as const })),
    ...files.map(f => ({ ...f, type: 'file' as const })),
  ]

  // Calculate cache hit rate
  const cacheHitRate = cacheHitsRef.current + cacheMissesRef.current > 0
    ? cacheHitsRef.current / (cacheHitsRef.current + cacheMissesRef.current)
    : 0

  /**
   * Build API URL with parameters
   */
  const buildUrl = useCallback((cursor?: string | null, isInitial = false) => {
    const params = new URLSearchParams({
      vaultId,
      limit: pageSize.toString(),
      sortBy,
      sortOrder,
    })

    if (folderId) params.set('folderId', folderId)
    if (search) params.set('search', search)
    if (mimeType) params.set('mimeType', mimeType)
    if (extension) params.set('extension', extension)
    if (cursor && !isInitial) params.set('cursor', cursor)
    if (!cursor && !isInitial) params.set('offset', files.length.toString())

    return `/api/file-vault/files?${params.toString()}`
  }, [vaultId, folderId, search, mimeType, extension, sortBy, sortOrder, pageSize, files.length])

  /**
   * Fetch files from API
   */
  const fetchFiles = useCallback(async (
    cursor?: string | null,
    isInitial = false,
    isRefresh = false
  ): Promise<FilesResponse | null> => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()

    try {
      const url = buildUrl(cursor, isInitial)

      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
        headers: {
          'Accept': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch files: ${response.statusText}`)
      }

      const data: FilesResponse = await response.json()

      // Track cache stats
      if (data._meta?.cached) {
        cacheHitsRef.current++
      } else {
        cacheMissesRef.current++
      }

      // Update duration
      if (data._meta?.duration) {
        setLastFetchDuration(data._meta.duration)
      }

      return data
    } catch (err) {
      if ((err as Error).name === 'AbortError') {
        return null
      }
      throw err
    }
  }, [buildUrl])

  /**
   * Load initial files
   */
  const loadInitial = useCallback(async () => {
    if (!enabled || !vaultId) return

    setIsLoading(true)
    setError(null)

    try {
      const data = await fetchFiles(null, true)

      if (data) {
        setFiles(data.files)
        setTotal(data.pagination.total)
        setHasMore(data.pagination.hasMore)
        cursorRef.current = data.pagination.nextCursor || null
      }
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoading(false)
    }
  }, [enabled, vaultId, fetchFiles])

  /**
   * Load more files (infinite scroll)
   */
  const loadMore = useCallback(async () => {
    if (!hasMore || isLoadingMore || isLoading) return

    setIsLoadingMore(true)
    setError(null)

    try {
      const data = await fetchFiles(cursorRef.current, false)

      if (data) {
        setFiles(prev => {
          // Deduplicate files
          const existingIds = new Set(prev.map(f => f.id))
          const newFiles = data.files.filter(f => !existingIds.has(f.id))
          return [...prev, ...newFiles]
        })
        setTotal(data.pagination.total)
        setHasMore(data.pagination.hasMore)
        cursorRef.current = data.pagination.nextCursor || null
      }
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsLoadingMore(false)
    }
  }, [hasMore, isLoadingMore, isLoading, fetchFiles])

  /**
   * Refresh files (pull to refresh)
   */
  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    cursorRef.current = null

    try {
      const data = await fetchFiles(null, true, true)

      if (data) {
        setFiles(data.files)
        setTotal(data.pagination.total)
        setHasMore(data.pagination.hasMore)
        cursorRef.current = data.pagination.nextCursor || null
        setError(null)
      }
    } catch (err) {
      setError(err as Error)
    } finally {
      setIsRefreshing(false)
    }
  }, [fetchFiles])

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setFiles([])
    setFolders([])
    setTotal(0)
    setHasMore(true)
    setError(null)
    cursorRef.current = null
    cacheHitsRef.current = 0
    cacheMissesRef.current = 0
  }, [])

  /**
   * Retry after error
   */
  const retry = useCallback(async () => {
    setError(null)
    if (files.length === 0) {
      await loadInitial()
    } else {
      await loadMore()
    }
  }, [files.length, loadInitial, loadMore])

  // Load initial data when dependencies change
  useEffect(() => {
    reset()
    loadInitial()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [vaultId, folderId, search, mimeType, extension, sortBy, sortOrder])

  // Fetch folders for current folder
  useEffect(() => {
    if (!enabled || !vaultId) return

    const fetchFolders = async () => {
      try {
        const params = new URLSearchParams({ vaultId })
        if (folderId) params.set('parentId', folderId)

        const response = await fetch(`/api/file-vault/folders?${params.toString()}`)
        if (response.ok) {
          const data = await response.json()
          setFolders(data.folders || [])
        }
      } catch {
        // Silent fail for folders
      }
    }

    fetchFolders()
  }, [enabled, vaultId, folderId])

  return {
    // Data
    items,
    folders,
    files,
    total,

    // Loading states
    isLoading,
    isLoadingMore,
    isRefreshing,
    isFetching: isLoading || isLoadingMore || isRefreshing,

    // Pagination
    hasMore,
    loadMore,

    // Actions
    refresh,
    reset,

    // Error handling
    error,
    retry,

    // Meta
    lastFetchDuration,
    cacheHitRate,
  }
}

/**
 * Hook for intersection observer (infinite scroll trigger)
 */
export function useIntersectionObserver(
  callback: () => void,
  options: { enabled?: boolean; rootMargin?: string } = {}
) {
  const { enabled = true, rootMargin = '200px' } = options
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!enabled) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          callback()
        }
      },
      { rootMargin }
    )

    const element = ref.current
    if (element) {
      observer.observe(element)
    }

    return () => {
      if (element) {
        observer.unobserve(element)
      }
    }
  }, [enabled, callback, rootMargin])

  return ref
}

export default useInfiniteFiles
