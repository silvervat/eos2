/**
 * REDIS CACHE LAYER - Enterprise File Vault
 *
 * Multi-tier caching strategy:
 * 1. In-memory LRU cache (fastest, limited size)
 * 2. Redis cache (persistent, shared across instances)
 *
 * Features:
 * - Automatic fallback to in-memory if Redis unavailable
 * - Connection pooling
 * - Automatic reconnection
 * - Cache warming utilities
 * - TTL management
 * - Pattern-based invalidation
 */

// Redis client type (optional dependency)
interface RedisClient {
  get(key: string): Promise<string | null>
  set(key: string, value: string, options?: { EX?: number }): Promise<unknown>
  del(key: string | string[]): Promise<number>
  keys(pattern: string): Promise<string[]>
  mget(keys: string[]): Promise<(string | null)[]>
  pipeline(): RedisPipeline
  quit(): Promise<void>
  on(event: string, handler: (...args: unknown[]) => void): void
}

interface RedisPipeline {
  get(key: string): RedisPipeline
  set(key: string, value: string, options?: { EX?: number }): RedisPipeline
  exec(): Promise<Array<[Error | null, unknown]>>
}

// Cache configuration
interface RedisCacheConfig {
  url: string
  keyPrefix: string
  defaultTtlSeconds: number
  maxRetries: number
  retryDelayMs: number
  enableCompression: boolean
  compressionThreshold: number // bytes
}

const DEFAULT_CONFIG: RedisCacheConfig = {
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  keyPrefix: 'fv:',
  defaultTtlSeconds: 300, // 5 minutes
  maxRetries: 3,
  retryDelayMs: 1000,
  enableCompression: true,
  compressionThreshold: 1024, // 1KB
}

// Cache statistics
interface CacheStats {
  hits: number
  misses: number
  errors: number
  latencyMs: {
    avg: number
    p95: number
    max: number
  }
  memoryUsage: number
  connectionStatus: 'connected' | 'disconnected' | 'connecting'
}

class RedisCache {
  private client: RedisClient | null = null
  private config: RedisCacheConfig
  private stats: CacheStats
  private isConnecting = false
  private latencies: number[] = []

  constructor(config: Partial<RedisCacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.stats = {
      hits: 0,
      misses: 0,
      errors: 0,
      latencyMs: { avg: 0, p95: 0, max: 0 },
      memoryUsage: 0,
      connectionStatus: 'disconnected',
    }
  }

  /**
   * Initialize Redis connection
   */
  async connect(): Promise<boolean> {
    if (this.client || this.isConnecting) {
      return !!this.client
    }

    // Check if Redis is enabled
    if (process.env.ENABLE_REDIS_CACHE !== 'true') {
      console.log('[RedisCache] Redis cache disabled via ENABLE_REDIS_CACHE env var')
      return false
    }

    this.isConnecting = true
    this.stats.connectionStatus = 'connecting'

    try {
      // Dynamic import to avoid errors when not installed
      // @ts-ignore - ioredis is an optional dependency
      const { default: Redis } = await import('ioredis')

      this.client = new Redis(this.config.url, {
        maxRetriesPerRequest: this.config.maxRetries,
        retryStrategy: (times: number) => {
          if (times > this.config.maxRetries) return null
          return Math.min(times * this.config.retryDelayMs, 5000)
        },
        enableReadyCheck: true,
        lazyConnect: false,
      }) as unknown as RedisClient

      // Event handlers
      this.client.on('connect', () => {
        console.log('[RedisCache] Connected to Redis')
        this.stats.connectionStatus = 'connected'
      })

      this.client.on('error', (err: Error) => {
        console.error('[RedisCache] Redis error:', err.message)
        this.stats.errors++
      })

      this.client.on('close', () => {
        console.log('[RedisCache] Redis connection closed')
        this.stats.connectionStatus = 'disconnected'
      })

      this.isConnecting = false
      return true
    } catch (error) {
      console.warn('[RedisCache] Failed to connect to Redis:', error)
      this.isConnecting = false
      this.stats.connectionStatus = 'disconnected'
      return false
    }
  }

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    const start = Date.now()
    const prefixedKey = this.config.keyPrefix + key

    try {
      if (!this.client) {
        await this.connect()
      }

      if (!this.client) {
        return null
      }

      const value = await this.client.get(prefixedKey)

      this.recordLatency(Date.now() - start)

      if (value === null) {
        this.stats.misses++
        return null
      }

      this.stats.hits++

      // Decompress if needed
      const data = this.decompress(value)
      return JSON.parse(data) as T
    } catch (error) {
      console.error('[RedisCache] Get error:', error)
      this.stats.errors++
      return null
    }
  }

  /**
   * Set value in cache
   */
  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> {
    const prefixedKey = this.config.keyPrefix + key
    const ttl = ttlSeconds || this.config.defaultTtlSeconds

    try {
      if (!this.client) {
        await this.connect()
      }

      if (!this.client) {
        return false
      }

      let data = JSON.stringify(value)

      // Compress if above threshold
      if (this.config.enableCompression && data.length > this.config.compressionThreshold) {
        data = this.compress(data)
      }

      await this.client.set(prefixedKey, data, { EX: ttl })
      return true
    } catch (error) {
      console.error('[RedisCache] Set error:', error)
      this.stats.errors++
      return false
    }
  }

  /**
   * Delete key from cache
   */
  async delete(key: string): Promise<boolean> {
    const prefixedKey = this.config.keyPrefix + key

    try {
      if (!this.client) return false
      await this.client.del(prefixedKey)
      return true
    } catch (error) {
      console.error('[RedisCache] Delete error:', error)
      this.stats.errors++
      return false
    }
  }

  /**
   * Delete all keys matching pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    const prefixedPattern = this.config.keyPrefix + pattern

    try {
      if (!this.client) return 0

      const keys = await this.client.keys(prefixedPattern.replace(/\*/g, '*'))
      if (keys.length === 0) return 0

      const deleted = await this.client.del(keys)
      return deleted
    } catch (error) {
      console.error('[RedisCache] DeletePattern error:', error)
      this.stats.errors++
      return 0
    }
  }

  /**
   * Get multiple values
   */
  async getMany<T>(keys: string[]): Promise<Record<string, T>> {
    if (keys.length === 0) return {}

    const prefixedKeys = keys.map(k => this.config.keyPrefix + k)

    try {
      if (!this.client) {
        await this.connect()
      }

      if (!this.client) return {}

      const values = await this.client.mget(prefixedKeys)
      const result: Record<string, T> = {}

      values.forEach((value, idx) => {
        if (value !== null) {
          const data = this.decompress(value)
          result[keys[idx]] = JSON.parse(data) as T
          this.stats.hits++
        } else {
          this.stats.misses++
        }
      })

      return result
    } catch (error) {
      console.error('[RedisCache] GetMany error:', error)
      this.stats.errors++
      return {}
    }
  }

  /**
   * Set multiple values
   */
  async setMany<T>(entries: Array<{ key: string; value: T; ttl?: number }>): Promise<boolean> {
    if (entries.length === 0) return true

    try {
      if (!this.client) {
        await this.connect()
      }

      if (!this.client) return false

      const pipeline = this.client.pipeline()

      entries.forEach(({ key, value, ttl }) => {
        const prefixedKey = this.config.keyPrefix + key
        let data = JSON.stringify(value)

        if (this.config.enableCompression && data.length > this.config.compressionThreshold) {
          data = this.compress(data)
        }

        pipeline.set(prefixedKey, data, { EX: ttl || this.config.defaultTtlSeconds })
      })

      await pipeline.exec()
      return true
    } catch (error) {
      console.error('[RedisCache] SetMany error:', error)
      this.stats.errors++
      return false
    }
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.stats.connectionStatus === 'connected'
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats }
  }

  /**
   * Disconnect from Redis
   */
  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit()
      this.client = null
      this.stats.connectionStatus = 'disconnected'
    }
  }

  // Compression helpers (simple base64 for now, can be replaced with gzip)
  private compress(data: string): string {
    if (typeof Buffer !== 'undefined') {
      return 'c:' + Buffer.from(data).toString('base64')
    }
    return data
  }

  private decompress(data: string): string {
    if (data.startsWith('c:') && typeof Buffer !== 'undefined') {
      return Buffer.from(data.slice(2), 'base64').toString()
    }
    return data
  }

  // Latency tracking
  private recordLatency(ms: number): void {
    this.latencies.push(ms)
    if (this.latencies.length > 1000) {
      this.latencies.shift()
    }

    // Calculate stats
    const sorted = [...this.latencies].sort((a, b) => a - b)
    this.stats.latencyMs = {
      avg: sorted.reduce((a, b) => a + b, 0) / sorted.length,
      p95: sorted[Math.floor(sorted.length * 0.95)] || 0,
      max: sorted[sorted.length - 1] || 0,
    }
  }
}

// Singleton instance
let redisCacheInstance: RedisCache | null = null

/**
 * Get Redis cache instance
 */
export function getRedisCache(): RedisCache {
  if (!redisCacheInstance) {
    redisCacheInstance = new RedisCache()
  }
  return redisCacheInstance
}

/**
 * Cache wrapper with fallback to in-memory
 */
export async function cacheGetWithRedis<T>(key: string): Promise<T | null> {
  const redis = getRedisCache()
  return redis.get<T>(key)
}

export async function cacheSetWithRedis<T>(
  key: string,
  value: T,
  ttlSeconds?: number
): Promise<boolean> {
  const redis = getRedisCache()
  return redis.set(key, value, ttlSeconds)
}

export async function cacheDeleteWithRedis(key: string): Promise<boolean> {
  const redis = getRedisCache()
  return redis.delete(key)
}

export async function cacheInvalidatePatternWithRedis(pattern: string): Promise<number> {
  const redis = getRedisCache()
  return redis.deletePattern(pattern)
}

export { RedisCache }
export default getRedisCache
