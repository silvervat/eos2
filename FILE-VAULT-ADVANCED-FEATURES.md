# RIVEST FILE VAULT - ADVANCED FEATURES & EXTREME SCALE

**Lisafunktsionaalsused + 1M+ Failide Optimiseerimine**

Loodud: 29. November 2025

---

## 📋 SISUKORD

1. [Puuduvad Funktsioonid](#1-puuduvad-funktsioonid)
2. [1M+ Failide Jõudlus](#2-1m-failide-jõudlus)
3. [Täpsem Otsing](#3-täpsem-otsing)
4. [Koostöö Funktsioonid](#4-koostöö-funktsioonid)
5. [Automaatika](#5-automaatika)
6. [AI Funktsioonid](#6-ai-funktsioonid)
7. [Integratsioonid](#7-integratsioonid)
8. [Mobile & Offline](#8-mobile--offline)
9. [Compliance](#9-compliance)
10. [Prioriteedid](#10-prioriteedid)

---

## 1. PUUDUVAD FUNKTSIOONID

### 1.1 Võrdlus Konkurentidega

```
╔══════════════════════════════════════════════════════════════════╗
║  FUNKTSIOON            Dropbox  GDrive  Box  Notion  RIVEST     ║
╠══════════════════════════════════════════════════════════════════╣
║  FILE STORAGE             ✅      ✅     ✅    ✅      ✅         ║
║  TABLE VIEW               ❌      ❌     ❌    ⚠️      ✅         ║
║  CUSTOM METADATA          ❌      ❌     ❌    ❌      ✅         ║
║  ──────────────────────────────────────────────────────────────║
║  PUUDU RIVEST'IS:                                               ║
║  ──────────────────────────────────────────────────────────────║
║  Real-time Collab         ✅      ✅     ✅    ✅      ❌ TODO   ║
║  Comments                 ✅      ✅     ✅    ✅      ❌ TODO   ║
║  @Mentions                ✅      ✅     ✅    ✅      ❌ TODO   ║
║  Activity Feed            ✅      ✅     ✅    ✅      ❌ TODO   ║
║  Notifications            ✅      ✅     ✅    ✅      ❌ TODO   ║
║  ──────────────────────────────────────────────────────────────║
║  Full-Text Search         ✅      ✅     ✅    ✅      ❌ TODO   ║
║  OCR Search               ⚠️      ✅     ✅    ❌      ❌ TODO   ║
║  AI Semantic Search       ❌      ⚠️     ⚠️    ❌      ❌ TODO   ║
║  ──────────────────────────────────────────────────────────────║
║  Automation               ⚠️      ❌     ✅    ⚠️      ❌ TODO   ║
║  Workflows                ❌      ❌     ✅    ❌      ❌ TODO   ║
║  Webhooks                 ✅      ✅     ✅    ✅      ❌ TODO   ║
║  Zapier                   ✅      ✅     ✅    ✅      ❌ TODO   ║
║  ──────────────────────────────────────────────────────────────║
║  Mobile App               ✅      ✅     ✅    ✅      ❌ TODO   ║
║  Offline Mode             ✅      ✅     ✅    ✅      ❌ TODO   ║
║  Camera Upload            ✅      ✅     ✅    ❌      ❌ TODO   ║
║  ──────────────────────────────────────────────────────────────║
║  Version Diff             ⚠️      ⚠️     ✅    ❌      ❌ TODO   ║
║  PDF Annotation           ❌      ❌     ✅    ❌      ❌ TODO   ║
║  Embed in Website         ✅      ✅     ✅    ✅      ❌ TODO   ║
║  QR Code Sharing          ❌      ❌     ❌    ❌      ❌ TODO   ║
║  ──────────────────────────────────────────────────────────────║
║  Approval Workflows       ❌      ❌     ✅    ❌      ❌ TODO   ║
║  E-Signatures             ❌      ❌     ✅    ❌      ⚠️        ║
║  Audit Logs               ⚠️      ⚠️     ✅    ❌      ⚠️        ║
╚══════════════════════════════════════════════════════════════════╝
```

### 1.2 Prioriteedid

**P0 (CRITICAL for 1M+ files):**
```
1. ⭐ ElasticSearch / Typesense Integration
2. ⭐ Smart Pagination & Infinite Scroll
3. ⭐ Background Indexing
4. ⭐ Full-Text Search (PDFs, DOCX)
5. ⭐ Faceted Filters (type, project, status)
```

**P1 (HIGH PRIORITY):**
```
6. Real-time Collaboration (Supabase Realtime)
7. Comments System (on files)
8. @Mentions & Notifications
9. Activity Feed (who did what)
10. Automation/Workflows (if file uploaded, then...)
```

**P2 (NICE TO HAVE):**
```
11. Mobile Apps (React Native)
12. Offline Mode (Service Workers)
13. OCR Search (Tesseract.js)
14. AI Semantic Search (OpenAI Embeddings)
15. Version Diff Viewer
16. PDF Annotation
```

**P3 (FUTURE):**
```
17. Zapier Integration
18. Custom Domain Sharing
19. Branded Share Pages
20. Advanced Analytics Dashboard
21. AI Auto-Tagging
22. Video Transcoding
23. Image Editing
24. Approval Workflows
```

---

## 2. 1M+ FAILIDE JÕUDLUS

### 2.1 Probleem

```
┌──────────────────────────────────────────────────────┐
│  PRAEGUNE LÄHENEMINE (töötab kuni ~100k faili)      │
├──────────────────────────────────────────────────────┤
│                                                      │
│  SELECT * FROM files WHERE vault_id = ?              │
│  → Laadi kõik failid mällu                           │
│  → Virtual scrolling renderib visuaalselt           │
│                                                      │
│  PROBLEEMID 1M+ FAILIGA:                             │
│  ❌ PostgreSQL query: 2-5 sekundit                   │
│  ❌ JSONB scanning: aeglane                          │
│  ❌ Sortimine: kallis                                │
│  ❌ Filtreerimine: full table scan                   │
│  ❌ Otsing: väga aeglane                             │
│  ❌ Esmane laadimine: valulik                        │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 2.2 Lahendus: 3-Tasandiline Arhitektuur

```
┌──────────────────────────────────────────────────────────────┐
│  TIER 1: OTSINGU INDEX (ElasticSearch/Typesense)            │
│  ──────────────────────────────────────────────────────────│
│  Eesmärk: Kiire otsing ja filtreerimine                     │
│                                                              │
│  • Full-text search: <50ms                                   │
│  • Faceted filters: instant                                  │
│  • Aggregations: kiire                                       │
│  • Tagastab: ainult ID'd                                     │
│                                                              │
│  Näide Query:                                                │
│  "CAD failid projektile RM2506 mis heakskiidetud eelmisel"  │
│  → Tagastab: [id1, id2, id3, ...] 30ms'iga                  │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                ↓
┌──────────────────────────────────────────────────────────────┐
│  TIER 2: METADATA CACHE (Redis)                             │
│  ──────────────────────────────────────────────────────────│
│  Eesmärk: Instant metadata lookup                            │
│                                                              │
│  • File metadata: O(1) lookup                                │
│  • Recent files: cached                                      │
│  • Popular files: cached                                     │
│  • TTL: 1 tund                                               │
│                                                              │
│  Cache Structure:                                            │
│  files:meta:{id} → Hash {name, size, type, metadata}        │
│  files:recent:{vault} → Sorted Set by timestamp             │
│  files:popular → Sorted Set by views                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
                ↓
┌──────────────────────────────────────────────────────────────┐
│  TIER 3: DATABASE (PostgreSQL)                              │
│  ──────────────────────────────────────────────────────────│
│  Eesmärk: Source of truth                                    │
│                                                              │
│  • Partitioned tables (by tenant, date)                     │
│  • Accessed ainult kui vaja                                  │
│  • Write-through cache                                       │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 2.3 Query Flow 1M+ Failiga

```
KASUTAJA QUERY: "Näita CAD faile projektile RM2506"

┌──────────────────────────────────────────────────┐
│ STEP 1: Search Index (ElasticSearch) - 25ms     │
├──────────────────────────────────────────────────┤
│ POST /files/_search                              │
│ {                                                │
│   "query": {                                     │
│     "bool": {                                    │
│       "must": [                                  │
│         { "term": { "extension": "dwg" } },      │
│         { "term": { "metadata.project": "RM..." }}│
│       ]                                          │
│     }                                            │
│   },                                             │
│   "size": 100,                                   │
│   "from": 0                                      │
│ }                                                │
│                                                  │
│ Response:                                        │
│ {                                                │
│   "hits": {                                      │
│     "total": 1247,  ← Kokku leitud              │
│     "hits": [                                    │
│       { "_id": "file_001" },                     │
│       { "_id": "file_002" },                     │
│       ... (100 tk)                               │
│     ]                                            │
│   }                                              │
│ }                                                │
└──────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────┐
│ STEP 2: Fetch Metadata (Redis) - 5ms            │
├──────────────────────────────────────────────────┤
│ MGET files:meta:file_001 files:meta:file_002 ..│
│                                                  │
│ Response:                                        │
│ [                                                │
│   { name: "drawing1.dwg", size: 2MB, ... },     │
│   { name: "drawing2.dwg", size: 1.5MB, ... },   │
│   ... (100 tk)                                   │
│ ]                                                │
│                                                  │
│ Kui mõni puudu? → Load from DB → Cache it       │
└──────────────────────────────────────────────────┘
         ↓
┌──────────────────────────────────────────────────┐
│ STEP 3: Render Table (React) - instant          │
├──────────────────────────────────────────────────┤
│ Display 100 files in virtual table               │
│ Scroll smooth @ 60fps                            │
│ Prefetch next 100 in background                  │
└──────────────────────────────────────────────────┘

KOKKU: 30ms! ✅ (vs 3-5 sekundit praegu)
```

### 2.4 ElasticSearch Setup

```typescript
// apps/api/src/lib/file-vault/search/elasticsearch.ts

import { Client } from '@elastic/elasticsearch'

export class FileSearchEngine {
  private client: Client
  
  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
    })
  }
  
  /**
   * Index single file
   */
  async indexFile(file: File) {
    await this.client.index({
      index: 'files',
      id: file.id,
      document: {
        // Basic info
        name: file.name,
        extension: file.extension,
        mime_type: file.mime_type,
        size_bytes: file.size_bytes,
        
        // Content (extracted text)
        content: await this.extractContent(file),
        
        // Metadata
        metadata: file.metadata,
        
        // Relations
        vault_id: file.vault_id,
        folder_id: file.folder_id,
        owner_id: file.owner_id,
        
        // Timestamps
        created_at: file.created_at,
        updated_at: file.updated_at,
        
        // Tags
        tags: file.tags?.map(t => t.tag) || [],
        
        // Path for hierarchy search
        path: file.path,
      }
    })
  }
  
  /**
   * Bulk index files
   */
  async bulkIndex(files: File[]) {
    const operations = files.flatMap(file => [
      { index: { _index: 'files', _id: file.id } },
      {
        name: file.name,
        extension: file.extension,
        // ... same as above
      }
    ])
    
    await this.client.bulk({ operations })
  }
  
  /**
   * Search files
   */
  async search(params: {
    vaultId: string
    query?: string
    filters?: {
      extension?: string
      project?: string
      status?: string
      dateFrom?: Date
      dateTo?: Date
    }
    page?: number
    pageSize?: number
    sort?: { field: string; order: 'asc' | 'desc' }
  }) {
    const { 
      vaultId,
      query, 
      filters = {},
      page = 0,
      pageSize = 100,
      sort
    } = params
    
    // Build query
    const must: any[] = [
      { term: { vault_id: vaultId } }
    ]
    
    // Text search
    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ['name^3', 'content', 'tags'],
          fuzziness: 'AUTO'
        }
      })
    }
    
    // Filters
    const filter: any[] = []
    
    if (filters.extension) {
      filter.push({ term: { extension: filters.extension } })
    }
    
    if (filters.project) {
      filter.push({ term: { 'metadata.project': filters.project } })
    }
    
    if (filters.status) {
      filter.push({ term: { 'metadata.status': filters.status } })
    }
    
    if (filters.dateFrom || filters.dateTo) {
      filter.push({
        range: {
          created_at: {
            gte: filters.dateFrom,
            lte: filters.dateTo
          }
        }
      })
    }
    
    // Execute search
    const result = await this.client.search({
      index: 'files',
      from: page * pageSize,
      size: pageSize,
      query: {
        bool: { must, filter }
      },
      sort: sort ? [{ [sort.field]: sort.order }] : undefined,
      _source: false, // Only IDs
      
      // Facets for filtering
      aggs: {
        extensions: {
          terms: { field: 'extension', size: 50 }
        },
        projects: {
          terms: { field: 'metadata.project', size: 100 }
        },
        statuses: {
          terms: { field: 'metadata.status', size: 20 }
        }
      }
    })
    
    return {
      fileIds: result.hits.hits.map(hit => hit._id),
      total: result.hits.total.value,
      took: result.took,
      facets: {
        extensions: result.aggregations.extensions.buckets,
        projects: result.aggregations.projects.buckets,
        statuses: result.aggregations.statuses.buckets,
      }
    }
  }
  
  /**
   * Extract text content from file
   */
  private async extractContent(file: File): Promise<string> {
    // PDF
    if (file.mime_type === 'application/pdf') {
      return await extractPdfText(file.storage_path)
    }
    
    // Word documents
    if (file.mime_type.includes('word')) {
      return await extractDocxText(file.storage_path)
    }
    
    // Images (OCR)
    if (file.mime_type.startsWith('image/')) {
      return await extractImageText(file.storage_path)
    }
    
    return ''
  }
}
```

### 2.5 Redis Cache Layer

```typescript
// apps/api/src/lib/file-vault/cache/redis-cache.ts

import { Redis } from 'ioredis'

export class FileMetadataCache {
  private redis: Redis
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL)
  }
  
  /**
   * Get file metadata
   */
  async get(fileId: string): Promise<FileMetadata | null> {
    const data = await this.redis.hgetall(`file:${fileId}`)
    
    if (!data || Object.keys(data).length === 0) {
      return null
    }
    
    return {
      id: fileId,
      name: data.name,
      size_bytes: parseInt(data.size_bytes),
      mime_type: data.mime_type,
      metadata: JSON.parse(data.metadata || '{}'),
      created_at: new Date(data.created_at),
      // ... rest
    }
  }
  
  /**
   * Get multiple files
   */
  async getMany(fileIds: string[]): Promise<Record<string, FileMetadata>> {
    const pipeline = this.redis.pipeline()
    
    fileIds.forEach(id => {
      pipeline.hgetall(`file:${id}`)
    })
    
    const results = await pipeline.exec()
    
    const files: Record<string, FileMetadata> = {}
    
    results?.forEach((result, idx) => {
      const [err, data] = result
      if (!err && data && Object.keys(data).length > 0) {
        files[fileIds[idx]] = this.parseMetadata(fileIds[idx], data)
      }
    })
    
    return files
  }
  
  /**
   * Set file metadata
   */
  async set(file: File) {
    const key = `file:${file.id}`
    
    await this.redis.hmset(key, {
      name: file.name,
      size_bytes: file.size_bytes.toString(),
      mime_type: file.mime_type,
      extension: file.extension,
      metadata: JSON.stringify(file.metadata),
      owner_id: file.owner_id,
      created_at: file.created_at.toISOString(),
      updated_at: file.updated_at.toISOString(),
    })
    
    // Set expiry (1 hour)
    await this.redis.expire(key, 3600)
    
    // Add to recent files
    await this.redis.zadd(
      `vault:${file.vault_id}:recent`,
      Date.now(),
      file.id
    )
  }
  
  /**
   * Invalidate cache
   */
  async invalidate(fileId: string) {
    await this.redis.del(`file:${fileId}`)
  }
  
  /**
   * Get recent files
   */
  async getRecent(vaultId: string, limit: number = 100): Promise<string[]> {
    return await this.redis.zrevrange(
      `vault:${vaultId}:recent`,
      0,
      limit - 1
    )
  }
}
```

### 2.6 Smart Pagination

```typescript
// apps/web/src/lib/file-vault/pagination/smart-paginator.ts

export class SmartPaginator {
  private searchEngine: FileSearchEngine
  private cache: FileMetadataCache
  private db: PrismaClient
  
  async loadPage(params: {
    vaultId: string
    query?: string
    filters?: SearchFilters
    page: number
    pageSize: number
  }): Promise<PaginatedFiles> {
    const { vaultId, query, filters, page, pageSize } = params
    
    // 1. Search for file IDs (ElasticSearch)
    const searchResult = await this.searchEngine.search({
      vaultId,
      query,
      filters,
      page,
      pageSize
    })
    
    const fileIds = searchResult.fileIds
    
    // 2. Try to get metadata from cache (Redis)
    const cachedFiles = await this.cache.getMany(fileIds)
    
    // 3. Fetch missing files from database
    const missingIds = fileIds.filter(id => !cachedFiles[id])
    
    let dbFiles: File[] = []
    if (missingIds.length > 0) {
      dbFiles = await this.db.file.findMany({
        where: { id: { in: missingIds } }
      })
      
      // Cache them for next time
      await Promise.all(
        dbFiles.map(file => this.cache.set(file))
      )
    }
    
    // 4. Merge results in correct order
    const files = fileIds.map(id => 
      cachedFiles[id] || dbFiles.find(f => f.id === id)
    ).filter(Boolean)
    
    // 5. Prefetch next page in background
    this.prefetchNextPage(params, page + 1)
    
    return {
      files,
      total: searchResult.total,
      page,
      pageSize,
      hasMore: (page + 1) * pageSize < searchResult.total,
      facets: searchResult.facets,
      took: searchResult.took
    }
  }
  
  private async prefetchNextPage(
    params: any,
    nextPage: number
  ) {
    // Run in background (don't await)
    setTimeout(async () => {
      const result = await this.searchEngine.search({
        ...params,
        page: nextPage,
        pageSize: params.pageSize * 2 // Prefetch 2x
      })
      
      // Warm up cache
      const files = await this.db.file.findMany({
        where: { id: { in: result.fileIds } }
      })
      
      await Promise.all(files.map(f => this.cache.set(f)))
    }, 100)
  }
}
```

### 2.7 Performance Metrics

```
╔═══════════════════════════════════════════════════════════╗
║  OPERATION            CURRENT     WITH OPTIMIZATION       ║
╠═══════════════════════════════════════════════════════════╣
║  Initial Load         3-5s        <200ms              ✅  ║
║  Search               2-4s        <50ms               ✅  ║
║  Filter               1-3s        <30ms               ✅  ║
║  Sort                 2-5s        <50ms               ✅  ║
║  Pagination           500ms       <20ms               ✅  ║
║  Scroll (next)        300ms       <10ms (prefetched)  ✅  ║
║  Metadata Update      100ms       <100ms              ✅  ║
║  Complex Search       5-10s       <80ms               ✅  ║
╚═══════════════════════════════════════════════════════════╝

1M files = 30-50ms response time! 🚀
```

---

## 3. COLLABORATION FEATURES

### 3.1 Real-time Updates (Supabase Realtime)

```typescript
// apps/web/src/lib/file-vault/realtime/file-sync.ts

export function useFileSyncsupabaseUrl('vaultId: string) {
  const { data: files, mutate } = useFiles(vaultId)
  
  useEffect(() => {
    const channel = supabase
      .channel(`vault:${vaultId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'File',
          filter: `vault_id=eq.${vaultId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // New file uploaded
            mutate(current => [...current, payload.new], false)
            toast.info(`${payload.new.name} uploaded`)
          }
          
          if (payload.eventType === 'UPDATE') {
            // File updated
            mutate(
              current => current.map(f => 
                f.id === payload.new.id ? payload.new : f
              ),
              false
            )
          }
          
          if (payload.eventType === 'DELETE') {
            // File deleted
            mutate(
              current => current.filter(f => f.id !== payload.old.id),
              false
            )
            toast.info(`${payload.old.name} deleted`)
          }
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [vaultId])
}
```

### 3.2 Comments System

```prisma
// Add to schema.prisma

model FileComment {
  id         String   @id @default(cuid())
  file_id    String
  user_id    String
  content    String
  
  // Threading
  parent_id  String?
  
  // Mentions
  mentions   String[] // User IDs
  
  // Relations
  file       File @relation(fields: [file_id], references: [id], onDelete: Cascade)
  parent     FileComment? @relation("CommentThread", fields: [parent_id], references: [id])
  replies    FileComment[] @relation("CommentThread")
  
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  
  @@index([file_id])
  @@index([user_id])
}
```

```typescript
// apps/web/src/components/file-vault/FileComments.tsx

export function FileComments({ fileId }: { fileId: string }) {
  const [comment, setComment] = useState('')
  const { data: comments } = useComments(fileId)
  
  const handleSubmit = async () => {
    // Parse @mentions
    const mentions = comment.match(/@\w+/g)?.map(m => m.slice(1)) || []
    
    await createComment({
      fileId,
      content: comment,
      mentions
    })
    
    setComment('')
  }
  
  return (
    <div className="space-y-4">
      {/* Comment input */}
      <div>
        <MentionTextarea
          value={comment}
          onChange={setComment}
          placeholder="Add a comment... (use @ to mention)"
        />
        <Button onClick={handleSubmit}>Comment</Button>
      </div>
      
      {/* Comments list */}
      <div className="space-y-3">
        {comments?.map(comment => (
          <CommentItem key={comment.id} comment={comment} />
        ))}
      </div>
    </div>
  )
}
```

Continue with more advanced features...
