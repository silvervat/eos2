/**
 * Cache Layer for File Vault
 *
 * Simple in-memory LRU cache with TTL support.
 * Can be easily swapped for Redis in production.
 */

interface CacheEntry<T> {
  value: T
  expiresAt: number
}

class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>>
  private maxSize: number

  constructor(maxSize: number = 1000) {
    this.cache = new Map()
    this.maxSize = maxSize
  }

  get(key: string): T | null {
    const entry = this.cache.get(key)

    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return null
    }

    // Move to end (most recently used)
    this.cache.delete(key)
    this.cache.set(key, entry)

    return entry.value
  }

  set(key: string, value: T, ttlSeconds: number): void {
    // Evict oldest entries if cache is full
    while (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }

    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttlSeconds * 1000,
    })
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  deletePattern(pattern: string): number {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'))
    let deletedCount = 0

    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
        deletedCount++
      }
    }

    return deletedCount
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  // Clean up expired entries
  cleanup(): number {
    const now = Date.now()
    let cleanedCount = 0

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
        cleanedCount++
      }
    }

    return cleanedCount
  }
}

// Singleton cache instance
const cache = new LRUCache<unknown>(2000)

// Periodic cleanup (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    cache.cleanup()
  }, 5 * 60 * 1000)
}

/**
 * Get value from cache
 */
export async function cacheGet<T>(key: string): Promise<T | null> {
  return cache.get(key) as T | null
}

/**
 * Set value in cache with TTL (in seconds)
 */
export async function cacheSet<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  cache.set(key, value, ttlSeconds)
}

/**
 * Delete specific key from cache
 */
export async function cacheDelete(key: string): Promise<boolean> {
  return cache.delete(key)
}

/**
 * Delete all keys matching pattern (supports * wildcard)
 */
export async function cacheInvalidate(pattern: string): Promise<number> {
  return cache.deletePattern(pattern)
}

/**
 * Clear entire cache
 */
export async function cacheClear(): Promise<void> {
  cache.clear()
}

/**
 * Get cache statistics
 */
export function cacheStats(): { size: number } {
  return { size: cache.size() }
}

/**
 * Wrapper for expensive operations with caching
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fn: () => Promise<T>
): Promise<T> {
  // Try cache first
  const cached = await cacheGet<T>(key)
  if (cached !== null) {
    return cached
  }

  // Execute function
  const result = await fn()

  // Store in cache
  await cacheSet(key, result, ttlSeconds)

  return result
}

// Cache TTL constants (in seconds)
export const CACHE_TTL = {
  FILE_LIST: 30,        // 30 seconds for file lists
  FOLDER_LIST: 60,      // 1 minute for folder lists
  VAULT_STATS: 300,     // 5 minutes for vault statistics
  FOLDER_STATS: 120,    // 2 minutes for folder statistics
  FILE_METADATA: 60,    // 1 minute for file metadata
  USER_PROFILE: 300,    // 5 minutes for user profile
}
