/**
 * FILE METADATA CACHE - Redis Integration
 * O(1) metadata lookup for instant performance
 */

import type { FileRecord } from '../types'

// Redis Client type (will be installed separately)
interface RedisClient {
  hgetall(key: string): Promise<Record<string, string>>
  hmset(key: string, data: Record<string, string>): Promise<unknown>
  expire(key: string, seconds: number): Promise<unknown>
  del(key: string): Promise<unknown>
  zadd(key: string, score: number, member: string): Promise<unknown>
  zrevrange(key: string, start: number, stop: number): Promise<string[]>
  pipeline(): RedisPipeline
}

interface RedisPipeline {
  hgetall(key: string): RedisPipeline
  exec(): Promise<Array<[Error | null, Record<string, string>]>>
}

export class FileMetadataCache {
  private redis: RedisClient | null = null
  private ttl = 3600 // 1 hour

  constructor() {
    this.initClient()
  }

  private async initClient() {
    // Only initialize if Redis cache is enabled
    if (process.env.ENABLE_REDIS_CACHE !== 'true') {
      console.log('[FileMetadataCache] Redis cache disabled')
      return
    }

    try {
      // Dynamic import to avoid errors when not installed
      // @ts-ignore - ioredis is an optional dependency
      const { default: Redis } = await import('ioredis')
      this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379')
      console.log('[FileMetadataCache] Connected to Redis')
    } catch (error) {
      console.warn('[FileMetadataCache] Redis not available:', error)
    }
  }

  /**
   * Check if Redis is available
   */
  isAvailable(): boolean {
    return this.redis !== null
  }

  /**
   * Get file metadata from cache
   */
  async get(fileId: string): Promise<FileRecord | null> {
    if (!this.redis) return null

    const data = await this.redis.hgetall(`file:${fileId}`)

    if (!data || Object.keys(data).length === 0) {
      return null
    }

    return this.parseFileRecord(fileId, data)
  }

  /**
   * Get multiple files from cache
   */
  async getMany(fileIds: string[]): Promise<Record<string, FileRecord>> {
    if (!this.redis || fileIds.length === 0) return {}

    const pipeline = this.redis.pipeline()

    fileIds.forEach((id) => {
      pipeline.hgetall(`file:${id}`)
    })

    const results = await pipeline.exec()
    const files: Record<string, FileRecord> = {}

    results?.forEach((result, idx) => {
      const [err, data] = result
      if (!err && data && Object.keys(data).length > 0) {
        files[fileIds[idx]] = this.parseFileRecord(fileIds[idx], data)
      }
    })

    return files
  }

  /**
   * Set file metadata in cache
   */
  async set(file: FileRecord): Promise<void> {
    if (!this.redis) return

    const key = `file:${file.id}`

    await this.redis.hmset(key, {
      name: file.name,
      path: file.path,
      vault_id: file.vaultId,
      folder_id: file.folderId || '',
      size_bytes: file.sizeBytes.toString(),
      mime_type: file.mimeType,
      extension: file.extension,
      storage_key: file.storageKey,
      metadata: JSON.stringify(file.metadata || {}),
      owner_id: file.ownerId,
      is_public: file.isPublic ? '1' : '0',
      version: file.version.toString(),
      is_latest: file.isLatest ? '1' : '0',
      thumbnail_small: file.thumbnailSmall || '',
      thumbnail_medium: file.thumbnailMedium || '',
      thumbnail_large: file.thumbnailLarge || '',
      tags: JSON.stringify(file.tags || []),
      created_at: file.createdAt.toISOString(),
      updated_at: file.updatedAt.toISOString(),
    })

    // Set expiry
    await this.redis.expire(key, this.ttl)

    // Add to recent files
    await this.redis.zadd(
      `vault:${file.vaultId}:recent`,
      Date.now(),
      file.id
    )
  }

  /**
   * Set multiple files in cache (batch)
   */
  async setMany(files: FileRecord[]): Promise<void> {
    if (!this.redis || files.length === 0) return

    await Promise.all(files.map((file) => this.set(file)))
  }

  /**
   * Invalidate cache for a file
   */
  async invalidate(fileId: string): Promise<void> {
    if (!this.redis) return

    await this.redis.del(`file:${fileId}`)
  }

  /**
   * Invalidate cache for multiple files
   */
  async invalidateMany(fileIds: string[]): Promise<void> {
    if (!this.redis || fileIds.length === 0) return

    await Promise.all(fileIds.map((id) => this.invalidate(id)))
  }

  /**
   * Get recent files for a vault
   */
  async getRecent(vaultId: string, limit = 100): Promise<string[]> {
    if (!this.redis) return []

    return await this.redis.zrevrange(
      `vault:${vaultId}:recent`,
      0,
      limit - 1
    )
  }

  /**
   * Parse cached data to FileRecord
   */
  private parseFileRecord(
    fileId: string,
    data: Record<string, string>
  ): FileRecord {
    return {
      id: fileId,
      name: data.name,
      path: data.path,
      vaultId: data.vault_id,
      folderId: data.folder_id || undefined,
      sizeBytes: BigInt(data.size_bytes || '0'),
      mimeType: data.mime_type,
      extension: data.extension,
      storageKey: data.storage_key,
      storageProvider: data.storage_provider || 'supabase',
      storageBucket: data.storage_bucket || '',
      storagePath: data.storage_path || '',
      checksumMd5: data.checksum_md5 || '',
      metadata: JSON.parse(data.metadata || '{}'),
      ownerId: data.owner_id,
      isPublic: data.is_public === '1',
      version: parseInt(data.version || '1', 10),
      isLatest: data.is_latest !== '0',
      thumbnailSmall: data.thumbnail_small || undefined,
      thumbnailMedium: data.thumbnail_medium || undefined,
      thumbnailLarge: data.thumbnail_large || undefined,
      tags: JSON.parse(data.tags || '[]'),
      isSafe: true,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    }
  }
}

// Singleton instance
let cacheInstance: FileMetadataCache | null = null

export function getFileMetadataCache(): FileMetadataCache {
  if (!cacheInstance) {
    cacheInstance = new FileMetadataCache()
  }
  return cacheInstance
}
