/**
 * SMART FILE LOADER - 3-Tier Data Loading
 * ElasticSearch → Redis → PostgreSQL
 * Optimized for 1M+ files @ <50ms response
 */

import type {
  FileSearchParams,
  PaginatedFiles,
  FileRecord,
  FileFacets,
} from '../types'
import { getFileSearchEngine } from '../search/file-search-engine'
import { getFileMetadataCache } from '../cache/file-metadata-cache'

// Prisma client type
interface PrismaClient {
  file: {
    findMany(params: {
      where: Record<string, unknown>
      include?: Record<string, boolean>
    }): Promise<DbFileRecord[]>
  }
}

// Database file record (with tag relations)
interface DbFileRecord extends Omit<FileRecord, 'tags'> {
  tags?: Array<{ tag: string }> | string[]
}

// Helper to normalize tags from DB format to string array
function normalizeTags(tags?: Array<{ tag: string }> | string[]): string[] {
  if (!tags) return []
  if (tags.length === 0) return []
  // Check if first element is string or object
  if (typeof tags[0] === 'string') {
    return tags as string[]
  }
  return (tags as Array<{ tag: string }>).map(t => t.tag)
}

export class SmartFileLoader {
  constructor(private db: PrismaClient) {}

  /**
   * Load page of files with 3-tier strategy
   * 1. Search ElasticSearch for IDs (fast)
   * 2. Get metadata from Redis cache (instant)
   * 3. Fallback to PostgreSQL for cache misses
   */
  async loadPage(params: FileSearchParams): Promise<PaginatedFiles> {
    const searchEngine = getFileSearchEngine()
    const cache = getFileMetadataCache()

    const startTime = Date.now()

    // Step 1: Search ElasticSearch for file IDs
    const searchResult = await searchEngine.search(params)

    // If ElasticSearch is not available, fallback to direct DB query
    if (!searchEngine.isAvailable() || searchResult.fileIds.length === 0) {
      return this.loadFromDatabase(params)
    }

    const fileIds = searchResult.fileIds

    // Step 2: Try to get metadata from Redis cache
    let cachedFiles: Record<string, FileRecord> = {}
    if (cache.isAvailable()) {
      cachedFiles = await cache.getMany(fileIds)
    }

    // Step 3: Load missing files from database
    const missingIds = fileIds.filter((id) => !cachedFiles[id])
    let dbFiles: DbFileRecord[] = []

    if (missingIds.length > 0) {
      dbFiles = await this.db.file.findMany({
        where: { id: { in: missingIds } },
        include: { tags: true },
      })

      // Cache the fetched files for next time
      if (cache.isAvailable()) {
        await cache.setMany(
          dbFiles.map((file) => ({
            ...file,
            tags: normalizeTags(file.tags),
          }))
        )
      }
    }

    // Step 4: Merge results in correct order (preserve search ranking)
    const files = fileIds
      .map((id) => {
        const cached = cachedFiles[id]
        if (cached) return cached

        const db = dbFiles.find((f) => f.id === id)
        if (db) {
          return {
            ...db,
            tags: normalizeTags(db.tags),
          }
        }

        return null
      })
      .filter((f): f is FileRecord => f !== null)

    // Step 5: Prefetch next page in background (non-blocking)
    if (searchResult.total > (params.page || 0 + 1) * (params.pageSize || 100)) {
      this.prefetchNextPage(params)
    }

    const took = Date.now() - startTime

    return {
      files,
      total: searchResult.total,
      page: params.page || 0,
      pageSize: params.pageSize || 100,
      hasMore:
        ((params.page || 0) + 1) * (params.pageSize || 100) < searchResult.total,
      facets: searchResult.facets,
      took,
    }
  }

  /**
   * Fallback: Load directly from database
   * Used when ElasticSearch is not available
   */
  private async loadFromDatabase(
    params: FileSearchParams
  ): Promise<PaginatedFiles> {
    const startTime = Date.now()

    // Build query conditions
    const where: Record<string, unknown> = {
      vaultId: params.vaultId,
    }

    if (params.filters?.folderId) {
      where.folderId = params.filters.folderId
    }

    if (params.filters?.extension) {
      where.extension = params.filters.extension
    }

    if (params.filters?.ownerId) {
      where.ownerId = params.filters.ownerId
    }

    if (params.query) {
      where.name = { contains: params.query, mode: 'insensitive' }
    }

    // Note: This is a simplified fallback
    // For full functionality, use ElasticSearch
    const files = await this.db.file.findMany({
      where,
      include: { tags: true },
    })

    const processedFiles = files.map((file) => ({
      ...file,
      tags: normalizeTags(file.tags),
    }))

    const page = params.page || 0
    const pageSize = params.pageSize || 100
    const paginatedFiles = processedFiles.slice(
      page * pageSize,
      (page + 1) * pageSize
    )

    const took = Date.now() - startTime

    return {
      files: paginatedFiles,
      total: files.length,
      page,
      pageSize,
      hasMore: (page + 1) * pageSize < files.length,
      facets: this.buildFacets(processedFiles),
      took,
    }
  }

  /**
   * Build facets from file list (for database fallback)
   */
  private buildFacets(files: FileRecord[]): FileFacets {
    const extensions: Record<string, number> = {}
    const projects: Record<string, number> = {}
    const statuses: Record<string, number> = {}
    const tags: Record<string, number> = {}

    files.forEach((file) => {
      // Count extensions
      extensions[file.extension] = (extensions[file.extension] || 0) + 1

      // Count projects from metadata
      const project = (file.metadata as Record<string, unknown>)?.project as
        | string
        | undefined
      if (project) {
        projects[project] = (projects[project] || 0) + 1
      }

      // Count statuses from metadata
      const status = (file.metadata as Record<string, unknown>)?.status as
        | string
        | undefined
      if (status) {
        statuses[status] = (statuses[status] || 0) + 1
      }

      // Count tags
      file.tags?.forEach((tag) => {
        tags[tag] = (tags[tag] || 0) + 1
      })
    })

    return {
      extensions: Object.entries(extensions).map(([key, doc_count]) => ({
        key,
        doc_count,
      })),
      projects: Object.entries(projects).map(([key, doc_count]) => ({
        key,
        doc_count,
      })),
      statuses: Object.entries(statuses).map(([key, doc_count]) => ({
        key,
        doc_count,
      })),
      tags: Object.entries(tags).map(([key, doc_count]) => ({
        key,
        doc_count,
      })),
    }
  }

  /**
   * Prefetch next page in background
   * Warms cache for smoother scrolling
   */
  private async prefetchNextPage(params: FileSearchParams): Promise<void> {
    const searchEngine = getFileSearchEngine()
    const cache = getFileMetadataCache()

    // Run in background (don't await)
    setTimeout(async () => {
      try {
        const nextPage = (params.page || 0) + 1
        const prefetchSize = (params.pageSize || 100) * 2 // Prefetch 2x

        const result = await searchEngine.search({
          ...params,
          page: nextPage,
          pageSize: prefetchSize,
        })

        if (result.fileIds.length > 0 && cache.isAvailable()) {
          // Load files from DB and warm cache
          const files = await this.db.file.findMany({
            where: { id: { in: result.fileIds } },
            include: { tags: true },
          })

          await cache.setMany(
            files.map((file) => ({
              ...file,
              tags: normalizeTags(file.tags),
            }))
          )
        }
      } catch (error) {
        // Silently fail - prefetch is non-critical
        console.warn('[SmartFileLoader] Prefetch failed:', error)
      }
    }, 100) // Small delay to not block current request
  }

  /**
   * Get single file by ID
   * Uses cache-first strategy
   */
  async getFile(fileId: string): Promise<FileRecord | null> {
    const cache = getFileMetadataCache()

    // Try cache first
    if (cache.isAvailable()) {
      const cached = await cache.get(fileId)
      if (cached) return cached
    }

    // Fallback to database
    const files = await this.db.file.findMany({
      where: { id: { in: [fileId] } },
      include: { tags: true },
    })

    if (files.length === 0) return null

    const file = {
      ...files[0],
      tags: normalizeTags(files[0].tags),
    }

    // Cache for next time
    if (cache.isAvailable()) {
      await cache.set(file)
    }

    return file
  }

  /**
   * Invalidate cache after file update/delete
   */
  async invalidateFile(fileId: string): Promise<void> {
    const cache = getFileMetadataCache()
    const searchEngine = getFileSearchEngine()

    await Promise.all([cache.invalidate(fileId), searchEngine.deleteFile(fileId)])
  }

  /**
   * Reindex file after update
   */
  async reindexFile(fileId: string): Promise<void> {
    const searchEngine = getFileSearchEngine()
    const cache = getFileMetadataCache()

    // Fetch fresh data
    const files = await this.db.file.findMany({
      where: { id: { in: [fileId] } },
      include: { tags: true },
    })

    if (files.length === 0) return

    const file = {
      ...files[0],
      tags: normalizeTags(files[0].tags),
    }

    // Update both cache and search index
    await Promise.all([
      cache.set(file),
      searchEngine.indexFile(file),
    ])
  }
}

// Factory function
export function createSmartFileLoader(db: PrismaClient): SmartFileLoader {
  return new SmartFileLoader(db)
}
