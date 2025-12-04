'use client'

import useSWR from 'swr'
import useSWRInfinite from 'swr/infinite'
import { useCallback, useMemo } from 'react'

// Types
export interface FileItem {
  id: string
  name: string
  path: string
  mimeType: string
  sizeBytes: number
  extension: string | null
  width: number | null
  height: number | null
  thumbnailSmall: string | null
  thumbnailMedium: string | null
  thumbnailLarge: string | null
  metadata: Record<string, unknown>
  version: number
  isPublic: boolean
  ownerId: string | null
  folderId: string | null
  createdAt: string
  updatedAt: string
  tags: string[]
}

export interface FolderItem {
  id: string
  name: string
  path: string
  parentId: string | null
  createdAt: string
  updatedAt: string
  fileCount?: number
  totalSize?: number
}

interface FilesResponse {
  files: FileItem[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
  _meta?: {
    duration: number
    cached: boolean
  }
}

interface FoldersResponse {
  folders: FolderItem[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

// SWR fetcher with error handling
const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) {
    const error = new Error('Failed to fetch')
    const data = await res.json().catch(() => ({}))
    ;(error as Error & { info?: unknown }).info = data
    throw error
  }
  return res.json()
}

// Configuration
const SWR_CONFIG = {
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  dedupingInterval: 5000, // Dedupe requests within 5 seconds
  errorRetryCount: 3,
  errorRetryInterval: 1000,
}

const PAGE_SIZE = 100

/**
 * Hook for fetching files with infinite scroll and caching
 */
export function useFiles(
  vaultId: string | null,
  folderId: string | null,
  options?: {
    search?: string
    mimeType?: string
    sortBy?: string
    sortOrder?: 'asc' | 'desc'
    uploadedByMe?: boolean
  }
) {
  const getKey = useCallback(
    (pageIndex: number, previousPageData: FilesResponse | null) => {
      // Return null to stop fetching
      if (!vaultId) return null
      if (previousPageData && !previousPageData.pagination.hasMore) return null

      const params = new URLSearchParams({
        vaultId,
        limit: PAGE_SIZE.toString(),
        offset: (pageIndex * PAGE_SIZE).toString(),
      })

      if (folderId) params.set('folderId', folderId)
      if (options?.search) params.set('search', options.search)
      if (options?.mimeType) params.set('mimeType', options.mimeType)
      if (options?.sortBy) params.set('sortBy', options.sortBy)
      if (options?.sortOrder) params.set('sortOrder', options.sortOrder)
      if (options?.uploadedByMe) params.set('uploadedByMe', 'true')

      return `/api/file-vault/files?${params}`
    },
    [vaultId, folderId, options?.search, options?.mimeType, options?.sortBy, options?.sortOrder, options?.uploadedByMe]
  )

  const {
    data,
    error,
    isLoading,
    isValidating,
    size,
    setSize,
    mutate,
  } = useSWRInfinite<FilesResponse>(getKey, fetcher, {
    ...SWR_CONFIG,
    revalidateFirstPage: false,
    parallel: false, // Load pages sequentially
  })

  // Flatten pages into single array
  const files = useMemo(() => {
    if (!data) return []
    return data.flatMap(page => page.files)
  }, [data])

  // Get pagination info from last page
  const pagination = useMemo(() => {
    if (!data || data.length === 0) {
      return { total: 0, hasMore: false }
    }
    const lastPage = data[data.length - 1]
    return {
      total: lastPage.pagination.total,
      hasMore: lastPage.pagination.hasMore,
    }
  }, [data])

  // Load more function
  const loadMore = useCallback(() => {
    if (pagination.hasMore && !isValidating) {
      setSize(size + 1)
    }
  }, [pagination.hasMore, isValidating, setSize, size])

  // Refresh data
  const refresh = useCallback(() => {
    mutate()
  }, [mutate])

  // Optimistic update helper
  const optimisticUpdate = useCallback(
    (updateFn: (files: FileItem[]) => FileItem[]) => {
      mutate(
        (currentData) => {
          if (!currentData) return currentData
          // Apply update to all pages
          return currentData.map((page) => ({
            ...page,
            files: updateFn(page.files),
          }))
        },
        { revalidate: false }
      )
    },
    [mutate]
  )

  return {
    files,
    pagination,
    isLoading,
    isValidating,
    error,
    loadMore,
    refresh,
    optimisticUpdate,
  }
}

/**
 * Hook for fetching folders with caching
 */
export function useFolders(vaultId: string | null, parentId?: string | null) {
  const params = new URLSearchParams()
  if (vaultId) params.set('vaultId', vaultId)
  if (parentId) params.set('parentId', parentId)

  const { data, error, isLoading, mutate } = useSWR<FoldersResponse>(
    vaultId ? `/api/file-vault/folders?${params}` : null,
    fetcher,
    SWR_CONFIG
  )

  return {
    folders: data?.folders || [],
    isLoading,
    error,
    refresh: mutate,
  }
}

/**
 * Hook for fetching a single file with caching
 */
export function useFile(fileId: string | null, vaultId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ file: FileItem }>(
    fileId && vaultId ? `/api/file-vault/files/${fileId}?vaultId=${vaultId}` : null,
    fetcher,
    {
      ...SWR_CONFIG,
      revalidateOnMount: true,
    }
  )

  return {
    file: data?.file,
    isLoading,
    error,
    refresh: mutate,
  }
}

/**
 * Hook for prefetching files (e.g., on hover)
 */
export function usePrefetch() {
  return useCallback((url: string) => {
    // Trigger prefetch by calling the fetcher
    fetcher(url).catch(() => {
      // Ignore prefetch errors
    })
  }, [])
}
