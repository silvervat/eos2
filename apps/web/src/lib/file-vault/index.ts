/**
 * FILE VAULT - Enterprise File Management System
 *
 * 3-Tier Architecture:
 * - ElasticSearch for fast full-text search (1M+ files @ <50ms)
 * - Redis for instant metadata cache (O(1) lookup)
 * - PostgreSQL for data persistence
 *
 * @see manual/RIVEST-FILE-VAULT-SYSTEM.md for full documentation
 */

// Types
export * from './types'

// Search Engine (ElasticSearch)
export {
  FileSearchEngine,
  getFileSearchEngine,
} from './search/file-search-engine'

// Metadata Cache (Redis)
export {
  FileMetadataCache,
  getFileMetadataCache,
} from './cache/file-metadata-cache'

// Smart File Loader (3-Tier)
export {
  SmartFileLoader,
  createSmartFileLoader,
} from './data/smart-file-loader'
