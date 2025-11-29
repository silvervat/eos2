/**
 * FILE SEARCH ENGINE - ElasticSearch Integration
 * Optimized for 1M+ files @ <50ms search
 */

import type {
  FileSearchParams,
  FileSearchResult,
  FileRecord,
  FileFacets,
} from '../types'

// ElasticSearch Client type (will be installed separately)
interface ElasticSearchClient {
  index(params: unknown): Promise<unknown>
  bulk(params: unknown): Promise<unknown>
  search(params: unknown): Promise<unknown>
  delete(params: unknown): Promise<unknown>
  indices: {
    exists(params: { index: string }): Promise<boolean>
    create(params: unknown): Promise<unknown>
    delete(params: { index: string }): Promise<unknown>
  }
}

export class FileSearchEngine {
  private client: ElasticSearchClient | null = null
  private index: string

  constructor() {
    this.index = process.env.ELASTICSEARCH_INDEX || 'files'
    this.initClient()
  }

  private async initClient() {
    // Only initialize if ElasticSearch is enabled
    if (process.env.ENABLE_ELASTICSEARCH !== 'true') {
      console.log('[FileSearchEngine] ElasticSearch disabled')
      return
    }

    try {
      // Dynamic import to avoid errors when not installed
      // @ts-ignore - @elastic/elasticsearch is an optional dependency
      const { Client } = await import('@elastic/elasticsearch')
      this.client = new Client({
        node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      })
      console.log('[FileSearchEngine] Connected to ElasticSearch')
    } catch (error) {
      console.warn('[FileSearchEngine] ElasticSearch not available:', error)
    }
  }

  /**
   * Check if ElasticSearch is available
   */
  isAvailable(): boolean {
    return this.client !== null
  }

  /**
   * Setup ElasticSearch index with mappings
   */
  async setupIndex(): Promise<void> {
    if (!this.client) return

    const indexExists = await this.client.indices.exists({ index: this.index })

    if (!indexExists) {
      await this.client.indices.create({
        index: this.index,
        body: {
          settings: {
            number_of_shards: 3,
            number_of_replicas: 1,
            analysis: {
              analyzer: {
                file_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: ['lowercase', 'asciifolding'],
                },
              },
            },
          },
          mappings: {
            properties: {
              // Basic fields
              name: {
                type: 'text',
                analyzer: 'file_analyzer',
                fields: {
                  keyword: { type: 'keyword' },
                  suggest: { type: 'completion' },
                },
              },
              content: {
                type: 'text',
                analyzer: 'file_analyzer',
              },
              extension: { type: 'keyword' },
              mime_type: { type: 'keyword' },
              size_bytes: { type: 'long' },

              // Metadata (dynamic)
              metadata: {
                type: 'object',
                dynamic: true,
                properties: {
                  project: { type: 'keyword' },
                  status: { type: 'keyword' },
                  priority: { type: 'keyword' },
                },
              },

              // Timestamps
              created_at: { type: 'date' },
              updated_at: { type: 'date' },

              // Relations
              vault_id: { type: 'keyword' },
              folder_id: { type: 'keyword' },
              owner_id: { type: 'keyword' },

              // Tags
              tags: { type: 'keyword' },

              // Path
              path: {
                type: 'text',
                fields: {
                  keyword: { type: 'keyword' },
                },
              },
            },
          },
        },
      })

      console.log(`[FileSearchEngine] Created index: ${this.index}`)
    }
  }

  /**
   * Index single file
   */
  async indexFile(file: FileRecord, content?: string): Promise<void> {
    if (!this.client) return

    await this.client.index({
      index: this.index,
      id: file.id,
      document: {
        name: file.name,
        extension: file.extension,
        mime_type: file.mimeType,
        size_bytes: Number(file.sizeBytes),
        content: content || '',
        metadata: file.metadata,
        vault_id: file.vaultId,
        folder_id: file.folderId,
        owner_id: file.ownerId,
        tags: file.tags || [],
        path: file.path,
        created_at: file.createdAt,
        updated_at: file.updatedAt,
      },
    })
  }

  /**
   * Bulk index files (for batch operations)
   */
  async bulkIndex(files: FileRecord[]): Promise<void> {
    if (!this.client || files.length === 0) return

    const operations = files.flatMap((file) => [
      { index: { _index: this.index, _id: file.id } },
      {
        name: file.name,
        extension: file.extension,
        mime_type: file.mimeType,
        size_bytes: Number(file.sizeBytes),
        metadata: file.metadata,
        vault_id: file.vaultId,
        folder_id: file.folderId,
        owner_id: file.ownerId,
        tags: file.tags || [],
        path: file.path,
        created_at: file.createdAt,
        updated_at: file.updatedAt,
      },
    ])

    await this.client.bulk({ operations })
  }

  /**
   * Search files with facets
   */
  async search(params: FileSearchParams): Promise<FileSearchResult> {
    // Return empty results if ElasticSearch not available
    if (!this.client) {
      return {
        fileIds: [],
        total: 0,
        took: 0,
        facets: {
          extensions: [],
          projects: [],
          statuses: [],
          tags: [],
        },
      }
    }

    const {
      vaultId,
      query,
      filters = {},
      page = 0,
      pageSize = 100,
      sort,
    } = params

    // Build query
    const must: unknown[] = [{ term: { vault_id: vaultId } }]
    const filter: unknown[] = []

    // Text search
    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ['name^3', 'content', 'tags^2', 'metadata.*'],
          fuzziness: 'AUTO',
        },
      })
    }

    // Filters
    if (filters.extension) {
      filter.push({ term: { extension: filters.extension } })
    }

    if (filters.project) {
      filter.push({ term: { 'metadata.project': filters.project } })
    }

    if (filters.status) {
      filter.push({ term: { 'metadata.status': filters.status } })
    }

    if (filters.tags && filters.tags.length > 0) {
      filter.push({ terms: { tags: filters.tags } })
    }

    if (filters.mimeType) {
      filter.push({ term: { mime_type: filters.mimeType } })
    }

    if (filters.folderId) {
      filter.push({ term: { folder_id: filters.folderId } })
    }

    if (filters.ownerId) {
      filter.push({ term: { owner_id: filters.ownerId } })
    }

    if (filters.minSize || filters.maxSize) {
      filter.push({
        range: {
          size_bytes: {
            ...(filters.minSize && { gte: filters.minSize }),
            ...(filters.maxSize && { lte: filters.maxSize }),
          },
        },
      })
    }

    if (filters.dateFrom || filters.dateTo) {
      filter.push({
        range: {
          created_at: {
            ...(filters.dateFrom && { gte: filters.dateFrom }),
            ...(filters.dateTo && { lte: filters.dateTo }),
          },
        },
      })
    }

    // Execute search
    const result = (await this.client.search({
      index: this.index,
      from: page * pageSize,
      size: pageSize,
      query: {
        bool: { must, filter },
      },
      sort: sort ? [{ [sort.field]: sort.order }] : undefined,
      _source: false, // Only return IDs
      aggs: {
        extensions: {
          terms: { field: 'extension', size: 50 },
        },
        projects: {
          terms: { field: 'metadata.project', size: 100 },
        },
        statuses: {
          terms: { field: 'metadata.status', size: 20 },
        },
        tags: {
          terms: { field: 'tags', size: 50 },
        },
      },
    })) as {
      hits: {
        hits: Array<{ _id: string }>
        total: { value: number } | number
      }
      took: number
      aggregations?: {
        extensions?: { buckets: Array<{ key: string; doc_count: number }> }
        projects?: { buckets: Array<{ key: string; doc_count: number }> }
        statuses?: { buckets: Array<{ key: string; doc_count: number }> }
        tags?: { buckets: Array<{ key: string; doc_count: number }> }
      }
    }

    const total =
      typeof result.hits.total === 'number'
        ? result.hits.total
        : result.hits.total.value

    return {
      fileIds: result.hits.hits.map((hit) => hit._id),
      total,
      took: result.took,
      facets: {
        extensions: result.aggregations?.extensions?.buckets || [],
        projects: result.aggregations?.projects?.buckets || [],
        statuses: result.aggregations?.statuses?.buckets || [],
        tags: result.aggregations?.tags?.buckets || [],
      },
    }
  }

  /**
   * Delete file from index
   */
  async deleteFile(fileId: string): Promise<void> {
    if (!this.client) return

    try {
      await this.client.delete({
        index: this.index,
        id: fileId,
      })
    } catch {
      // Ignore if not found
    }
  }

  /**
   * Delete all files in a vault
   */
  async deleteVaultFiles(vaultId: string): Promise<void> {
    if (!this.client) return

    await this.client.delete({
      index: this.index,
      body: {
        query: {
          term: { vault_id: vaultId },
        },
      },
    })
  }

  /**
   * Get search suggestions (autocomplete)
   */
  async getSuggestions(
    vaultId: string,
    prefix: string,
    limit = 10
  ): Promise<string[]> {
    if (!this.client || !prefix) return []

    const result = (await this.client.search({
      index: this.index,
      body: {
        suggest: {
          file_suggest: {
            prefix,
            completion: {
              field: 'name.suggest',
              size: limit,
              skip_duplicates: true,
              contexts: {
                vault_id: vaultId,
              },
            },
          },
        },
      },
    })) as {
      suggest?: {
        file_suggest?: Array<{
          options: Array<{ text: string }>
        }>
      }
    }

    return (
      result.suggest?.file_suggest?.[0]?.options.map((opt) => opt.text) || []
    )
  }
}

// Singleton instance
let searchEngineInstance: FileSearchEngine | null = null

export function getFileSearchEngine(): FileSearchEngine {
  if (!searchEngineInstance) {
    searchEngineInstance = new FileSearchEngine()
  }
  return searchEngineInstance
}
