# FILE VAULT OPTION B - PRODUCTION-READY IMPLEMENTATION

**Built for 1M+ Files from Day 1**

Implementeerimise aeg: 20 päeva
Tulemus: Töötab 1M+ failiga @ <50ms

---

## 📋 TABLE OF CONTENTS

1. [Overview](#1-overview)
2. [Day 1-2: Infrastructure Setup](#2-day-1-2-infrastructure-setup)
3. [Day 3-4: Database & Search](#3-day-3-4-database--search)
4. [Day 5-8: Core File System](#4-day-5-8-core-file-system)
5. [Day 9-12: Table Integration](#5-day-9-12-table-integration)
6. [Day 13-15: Sharing System](#6-day-13-15-sharing-system)
7. [Day 16-18: Admin & Testing](#7-day-16-18-admin--testing)
8. [Day 19-20: Deploy & Optimize](#8-day-19-20-deploy--optimize)
9. [Claude Code Commands](#9-claude-code-commands)
10. [Production Checklist](#10-production-checklist)

---

## 1. OVERVIEW

### 1.1 What We're Building

```
┌────────────────────────────────────────────────────────┐
│  FILE VAULT - PRODUCTION ARCHITECTURE                 │
├────────────────────────────────────────────────────────┤
│                                                        │
│  [USER] ←→ [Next.js App]                              │
│              ↓                                         │
│     ┌────────┴─────────┐                              │
│     ↓                  ↓                               │
│  [ElasticSearch]   [Redis Cache]                      │
│  - Full-text        - Metadata                        │
│  - Facets           - Hot files                       │
│  - <50ms            - <5ms                            │
│     ↓                  ↓                               │
│  [PostgreSQL + Supabase Storage]                      │
│  - Source of truth                                     │
│  - File storage                                        │
│  - Permissions                                         │
│                                                        │
│  RESULT:                                               │
│  ✅ 1M+ files supported                               │
│  ✅ <50ms search                                       │
│  ✅ <200ms initial load                               │
│  ✅ Smooth 60fps scrolling                            │
│  ✅ Production-ready                                   │
│                                                        │
└────────────────────────────────────────────────────────┘
```

### 1.2 Tech Stack

```
Frontend:
- Next.js 14 (App Router)
- React 18 + TypeScript
- TanStack Query (caching)
- TanStack Virtual (scrolling)
- shadcn/ui + Tailwind CSS

Backend:
- PostgreSQL (Supabase)
- Prisma ORM
- Supabase Storage (files)

Search & Cache:
- ElasticSearch 8.11 (search index)
- Redis 7 (metadata cache)
- Bull (job queue)

Performance:
- 1M+ files @ <50ms
- Virtual scrolling @ 60fps
- Smart prefetching
```

### 1.3 Timeline

```
Week 1: Infrastructure + Core
├─ Day 1-2: Docker setup (ElasticSearch, Redis, PostgreSQL)
├─ Day 3-4: Database schema + Search index
├─ Day 5-6: Upload system (chunked, resumable)
└─ Day 7-8: Download & file management

Week 2: Table Integration + Sharing
├─ Day 9-10: File Table (with Ultra Table)
├─ Day 11-12: Custom metadata + bulk editing
├─ Day 13-14: Sharing system (links, passwords)
└─ Day 15: Permissions

Week 3: Admin + Deploy
├─ Day 16-17: Admin dashboard
├─ Day 18: Testing (1M files!)
├─ Day 19: Deploy to production
└─ Day 20: Monitoring & optimization

TOTAL: 20 days
```

---

## 2. DAY 1-2: INFRASTRUCTURE SETUP

### 2.1 Docker Compose Setup

```yaml
# docker-compose.yml (project root)

version: '3.8'

services:
  # PostgreSQL (Development only - use Supabase in prod)
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: rivest
      POSTGRES_PASSWORD: rivest123
      POSTGRES_DB: rivest_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  # ElasticSearch
  elasticsearch:
    image: elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    ports:
      - "9200:9200"
      - "9300:9300"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:9200"]
      interval: 10s
      timeout: 5s
      retries: 5
  
  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes
  
  # Kibana (ElasticSearch UI - Optional)
  kibana:
    image: kibana:8.11.0
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

volumes:
  postgres_data:
  elasticsearch_data:
  redis_data:
```

### 2.2 Environment Setup

```bash
# .env.local (apps/web)

# Database (Development - use Supabase URL in production)
DATABASE_URL="postgresql://rivest:rivest123@localhost:5432/rivest_dev"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="https://cohhjvtmmchrttntoizw.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Storage
FILE_VAULT_BUCKET="file-vault"
FILE_VAULT_MAX_SIZE="104857600" # 100MB per file

# ElasticSearch
ELASTICSEARCH_URL="http://localhost:9200"
ELASTICSEARCH_INDEX="files"

# Redis
REDIS_URL="redis://localhost:6379"

# Upload settings
CHUNK_SIZE="5242880" # 5MB chunks
MAX_CONCURRENT_CHUNKS="8"

# Feature flags
ENABLE_ELASTICSEARCH="true"
ENABLE_REDIS_CACHE="true"
ENABLE_BACKGROUND_INDEXING="true"
```

### 2.3 Start Infrastructure

```bash
# 1. Start all services
docker-compose up -d

# 2. Wait for services to be ready
docker-compose ps

# 3. Verify ElasticSearch
curl http://localhost:9200
# Should return cluster info

# 4. Verify Redis
docker exec -it rivest-platform-redis-1 redis-cli ping
# Should return PONG

# 5. Create Supabase Storage bucket
# Go to: https://supabase.com/dashboard
# Storage > Create bucket: "file-vault"
# Make it private

# 6. Install dependencies
cd apps/web
npm install @elastic/elasticsearch ioredis bull
```

---

## 3. DAY 3-4: DATABASE & SEARCH

### 3.1 Prisma Schema

```prisma
// packages/db/prisma/schema.prisma

// Add File Vault models

model FileVault {
  id          String   @id @default(cuid())
  tenant_id   String
  name        String
  description String?
  
  // Storage quota
  quota_bytes BigInt   @default(107374182400) // 100GB
  used_bytes  BigInt   @default(0)
  
  // Relations
  folders     FileFolder[]
  files       File[]
  shares      FileShare[]
  
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  created_by  String
  
  @@index([tenant_id])
}

model FileFolder {
  id          String   @id @default(cuid())
  vault_id    String
  parent_id   String?
  
  name        String
  path        String   // Full path: /parent/child
  color       String?
  icon        String?
  
  is_public   Boolean  @default(false)
  owner_id    String
  
  vault       FileVault @relation(fields: [vault_id], references: [id], onDelete: Cascade)
  parent      FileFolder? @relation("FolderHierarchy", fields: [parent_id], references: [id])
  children    FileFolder[] @relation("FolderHierarchy")
  files       File[]
  
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  
  @@unique([vault_id, path])
  @@index([vault_id])
  @@index([parent_id])
  @@index([owner_id])
}

model File {
  id          String   @id @default(cuid())
  vault_id    String
  folder_id   String?
  
  // File info
  name        String
  path        String
  
  // Storage
  storage_provider  String  @default("supabase")
  storage_bucket    String
  storage_path      String
  storage_key       String  @unique
  
  // Metadata
  mime_type   String
  size_bytes  BigInt
  extension   String
  checksum_md5 String
  
  // Media metadata
  width       Int?
  height      Int?
  duration    Int?
  
  // Thumbnails
  thumbnail_small  String?
  thumbnail_medium String?
  thumbnail_large  String?
  
  // Custom metadata (for Ultra Table!)
  metadata    Json     @default("{}")
  
  // Versioning
  version     Int      @default(1)
  is_latest   Boolean  @default(true)
  parent_file_id String?
  
  // Security
  is_public   Boolean  @default(false)
  owner_id    String
  
  // Indexed flag
  indexed_at  DateTime?
  
  // Relations
  vault       FileVault @relation(fields: [vault_id], references: [id], onDelete: Cascade)
  folder      FileFolder? @relation(fields: [folder_id], references: [id])
  parent_file File? @relation("FileVersions", fields: [parent_file_id], references: [id])
  versions    File[] @relation("FileVersions")
  shares      FileShare[]
  accesses    FileAccess[]
  tags        FileTag[]
  
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  
  @@unique([vault_id, path])
  @@index([vault_id])
  @@index([folder_id])
  @@index([owner_id])
  @@index([storage_key])
  @@index([checksum_md5])
  @@index([indexed_at]) // For background indexing
  @@index([created_at])
}

model FileShare {
  id          String   @id @default(cuid())
  vault_id    String
  file_id     String?
  folder_id   String?
  
  short_code  String   @unique
  permission  SharePermission
  
  password_hash    String?
  require_email    Boolean @default(false)
  allowed_emails   String[]
  
  expires_at       DateTime?
  max_downloads    Int?
  download_count   Int @default(0)
  view_count       Int @default(0)
  last_accessed_at DateTime?
  
  vault       FileVault @relation(fields: [vault_id], references: [id], onDelete: Cascade)
  file        File? @relation(fields: [file_id], references: [id], onDelete: Cascade)
  folder      FileFolder? @relation(fields: [folder_id], references: [id], onDelete: Cascade)
  accesses    FileAccess[]
  
  created_at  DateTime @default(now())
  created_by  String
  
  @@index([vault_id])
  @@index([file_id])
  @@index([folder_id])
  @@index([short_code])
  @@index([expires_at])
}

enum SharePermission {
  view
  download
  edit
}

model FileAccess {
  id          String   @id @default(cuid())
  file_id     String?
  share_id    String?
  
  action      FileAction
  ip_address  String
  user_agent  String?
  user_id     String?
  
  bytes_transferred BigInt?
  
  file        File? @relation(fields: [file_id], references: [id], onDelete: Cascade)
  share       FileShare? @relation(fields: [share_id], references: [id], onDelete: Cascade)
  
  created_at  DateTime @default(now())
  
  @@index([file_id])
  @@index([share_id])
  @@index([user_id])
  @@index([created_at])
}

enum FileAction {
  view
  download
  upload
  delete
  share
  rename
  move
}

model FileTag {
  id          String   @id @default(cuid())
  file_id     String
  tag         String
  
  file        File @relation(fields: [file_id], references: [id], onDelete: Cascade)
  
  created_at  DateTime @default(now())
  
  @@unique([file_id, tag])
  @@index([tag])
}

model FileUploadSession {
  id              String   @id @default(cuid())
  vault_id        String
  
  filename        String
  size_bytes      BigInt
  mime_type       String
  
  chunk_size      Int      @default(5242880)
  total_chunks    Int
  uploaded_chunks Int[]
  
  storage_provider String
  storage_bucket   String
  storage_key      String
  upload_id        String?
  
  metadata        Json     @default("{}")
  
  status          UploadStatus @default(in_progress)
  error_message   String?
  
  resume_token    String   @unique
  
  created_at      DateTime @default(now())
  updated_at      DateTime @updatedAt
  expires_at      DateTime
  
  @@index([vault_id])
  @@index([resume_token])
  @@index([expires_at])
}

enum UploadStatus {
  in_progress
  completed
  failed
  cancelled
}
```

### 3.2 Run Migration

```bash
cd packages/db

# Generate migration
npx prisma migrate dev --name add_file_vault_system

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio to verify
npx prisma studio
```

### 3.3 ElasticSearch Index Setup

```typescript
// apps/api/src/lib/file-vault/search/elasticsearch-setup.ts

import { Client } from '@elastic/elasticsearch'

export async function setupElasticSearchIndex() {
  const client = new Client({
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
  })
  
  const indexName = process.env.ELASTICSEARCH_INDEX || 'files'
  
  // Check if index exists
  const indexExists = await client.indices.exists({ index: indexName })
  
  if (!indexExists) {
    // Create index with mappings
    await client.indices.create({
      index: indexName,
      body: {
        settings: {
          number_of_shards: 3,
          number_of_replicas: 1,
          analysis: {
            analyzer: {
              file_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'asciifolding']
              }
            }
          }
        },
        mappings: {
          properties: {
            // Basic fields
            name: {
              type: 'text',
              analyzer: 'file_analyzer',
              fields: {
                keyword: { type: 'keyword' },
                suggest: {
                  type: 'completion'
                }
              }
            },
            content: {
              type: 'text',
              analyzer: 'file_analyzer'
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
              }
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
                keyword: { type: 'keyword' }
              }
            }
          }
        }
      }
    })
    
    console.log(`✅ Created ElasticSearch index: ${indexName}`)
  } else {
    console.log(`✅ ElasticSearch index already exists: ${indexName}`)
  }
}

// Run this once
setupElasticSearchIndex().catch(console.error)
```

---

## 4. DAY 5-8: CORE FILE SYSTEM

### 4.1 Search Engine Implementation

```typescript
// apps/api/src/lib/file-vault/search/file-search-engine.ts

import { Client } from '@elastic/elasticsearch'

export class FileSearchEngine {
  private client: Client
  private index = 'files'
  
  constructor() {
    this.client = new Client({
      node: process.env.ELASTICSEARCH_URL!
    })
  }
  
  /**
   * Index single file
   */
  async indexFile(file: {
    id: string
    name: string
    extension: string
    mime_type: string
    size_bytes: number
    metadata: any
    vault_id: string
    folder_id?: string
    owner_id: string
    tags: string[]
    path: string
    created_at: Date
    updated_at: Date
  }) {
    await this.client.index({
      index: this.index,
      id: file.id,
      document: {
        name: file.name,
        extension: file.extension,
        mime_type: file.mime_type,
        size_bytes: file.size_bytes,
        metadata: file.metadata,
        vault_id: file.vault_id,
        folder_id: file.folder_id,
        owner_id: file.owner_id,
        tags: file.tags,
        path: file.path,
        created_at: file.created_at,
        updated_at: file.updated_at,
      }
    })
  }
  
  /**
   * Search files with facets
   */
  async search(params: {
    vaultId: string
    query?: string
    filters?: {
      extension?: string
      project?: string
      status?: string
      tags?: string[]
    }
    page?: number
    pageSize?: number
    sort?: { field: string; order: 'asc' | 'desc' }
  }) {
    const { vaultId, query, filters = {}, page = 0, pageSize = 100, sort } = params
    
    const must: any[] = [{ term: { vault_id: vaultId } }]
    const filter: any[] = []
    
    if (query) {
      must.push({
        multi_match: {
          query,
          fields: ['name^3', 'tags^2', 'metadata.*'],
          fuzziness: 'AUTO'
        }
      })
    }
    
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
    
    const result = await this.client.search({
      index: this.index,
      from: page * pageSize,
      size: pageSize,
      query: { bool: { must, filter } },
      sort: sort ? [{ [sort.field]: sort.order }] : undefined,
      _source: false,
      aggs: {
        extensions: { terms: { field: 'extension', size: 50 } },
        projects: { terms: { field: 'metadata.project', size: 100 } },
        statuses: { terms: { field: 'metadata.status', size: 20 } },
        tags: { terms: { field: 'tags', size: 50 } }
      }
    })
    
    return {
      fileIds: result.hits.hits.map(hit => hit._id as string),
      total: (result.hits.total as any).value,
      took: result.took,
      facets: {
        extensions: result.aggregations?.extensions.buckets || [],
        projects: result.aggregations?.projects.buckets || [],
        statuses: result.aggregations?.statuses.buckets || [],
        tags: result.aggregations?.tags.buckets || [],
      }
    }
  }
}
```

### 4.2 Redis Cache Layer

```typescript
// apps/api/src/lib/file-vault/cache/redis-cache.ts

import Redis from 'ioredis'

export class FileMetadataCache {
  private redis: Redis
  private ttl = 3600 // 1 hour
  
  constructor() {
    this.redis = new Redis(process.env.REDIS_URL!)
  }
  
  async get(fileId: string) {
    const data = await this.redis.hgetall(`file:${fileId}`)
    if (!data || Object.keys(data).length === 0) return null
    
    return {
      id: fileId,
      name: data.name,
      size_bytes: parseInt(data.size_bytes),
      mime_type: data.mime_type,
      extension: data.extension,
      metadata: JSON.parse(data.metadata || '{}'),
      owner_id: data.owner_id,
      created_at: new Date(data.created_at),
      updated_at: new Date(data.updated_at),
    }
  }
  
  async getMany(fileIds: string[]) {
    const pipeline = this.redis.pipeline()
    fileIds.forEach(id => pipeline.hgetall(`file:${id}`))
    
    const results = await pipeline.exec()
    const files: Record<string, any> = {}
    
    results?.forEach((result, idx) => {
      const [err, data] = result
      if (!err && data && Object.keys(data).length > 0) {
        files[fileIds[idx]] = {
          id: fileIds[idx],
          name: data.name,
          size_bytes: parseInt(data.size_bytes),
          mime_type: data.mime_type,
          extension: data.extension,
          metadata: JSON.parse(data.metadata || '{}'),
          owner_id: data.owner_id,
          created_at: new Date(data.created_at),
          updated_at: new Date(data.updated_at),
        }
      }
    })
    
    return files
  }
  
  async set(file: any) {
    await this.redis.hmset(`file:${file.id}`, {
      name: file.name,
      size_bytes: file.size_bytes.toString(),
      mime_type: file.mime_type,
      extension: file.extension,
      metadata: JSON.stringify(file.metadata),
      owner_id: file.owner_id,
      created_at: file.created_at.toISOString(),
      updated_at: file.updated_at.toISOString(),
    })
    
    await this.redis.expire(`file:${file.id}`, this.ttl)
  }
  
  async invalidate(fileId: string) {
    await this.redis.del(`file:${fileId}`)
  }
}
```

### 4.3 Smart Data Loader

```typescript
// apps/api/src/lib/file-vault/data/smart-loader.ts

export class SmartFileLoader {
  constructor(
    private searchEngine: FileSearchEngine,
    private cache: FileMetadataCache,
    private db: PrismaClient
  ) {}
  
  async loadPage(params: {
    vaultId: string
    query?: string
    filters?: any
    page: number
    pageSize: number
  }) {
    // 1. Search ElasticSearch for IDs
    const searchResult = await this.searchEngine.search(params)
    
    // 2. Try cache first
    const cachedFiles = await this.cache.getMany(searchResult.fileIds)
    
    // 3. Load missing from DB
    const missingIds = searchResult.fileIds.filter(id => !cachedFiles[id])
    let dbFiles: any[] = []
    
    if (missingIds.length > 0) {
      dbFiles = await this.db.file.findMany({
        where: { id: { in: missingIds } }
      })
      
      // Cache them
      await Promise.all(dbFiles.map(f => this.cache.set(f)))
    }
    
    // 4. Merge in correct order
    const files = searchResult.fileIds.map(id => 
      cachedFiles[id] || dbFiles.find(f => f.id === id)
    ).filter(Boolean)
    
    // 5. Prefetch next page
    this.prefetchNextPage(params, params.page + 1)
    
    return {
      files,
      total: searchResult.total,
      page: params.page,
      pageSize: params.pageSize,
      hasMore: (params.page + 1) * params.pageSize < searchResult.total,
      facets: searchResult.facets,
      took: searchResult.took
    }
  }
  
  private async prefetchNextPage(params: any, nextPage: number) {
    setTimeout(async () => {
      const result = await this.searchEngine.search({
        ...params,
        page: nextPage,
        pageSize: params.pageSize * 2
      })
      
      const files = await this.db.file.findMany({
        where: { id: { in: result.fileIds } }
      })
      
      await Promise.all(files.map(f => this.cache.set(f)))
    }, 100)
  }
}
```

---

## 5. DAY 9-12: TABLE INTEGRATION

### 5.1 File Table Component

```typescript
// apps/web/src/components/file-vault/FileTable.tsx

import { UltraTable } from '@/components/shared/ultra-table'
import { useFileSearch } from '@/lib/file-vault/hooks/useFileSearch'

export function FileTable({ vaultId }: { vaultId: string }) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState({})
  const [page, setPage] = useState(0)
  
  const { data, isLoading } = useFileSearch({
    vaultId,
    query,
    filters,
    page,
    pageSize: 100
  })
  
  const columns = [
    // Preview
    {
      id: 'preview',
      key: 'thumbnail_small',
      name: '',
      type: 'image',
      width: 60,
    },
    
    // Name
    {
      id: 'name',
      key: 'name',
      name: 'Name',
      type: 'text',
      width: 300,
      pinned: 'left',
    },
    
    // Type
    {
      id: 'type',
      key: 'extension',
      name: 'Type',
      type: 'dropdown',
      width: 100,
    },
    
    // Size
    {
      id: 'size',
      key: 'size_bytes',
      name: 'Size',
      type: 'number',
      width: 100,
      config: {
        number: { format: 'bytes' }
      }
    },
    
    // Project (custom metadata!)
    {
      id: 'project',
      key: 'metadata.project',
      name: 'Project',
      type: 'relation',
      width: 200,
      config: {
        relation: {
          tableId: 'projects',
          displayField: 'code'
        }
      }
    },
    
    // Status (custom metadata!)
    {
      id: 'status',
      key: 'metadata.status',
      name: 'Status',
      type: 'status',
      width: 120,
    },
    
    // Created
    {
      id: 'created',
      key: 'created_at',
      name: 'Created',
      type: 'datetime',
      width: 150,
    },
  ]
  
  return (
    <div className="space-y-4">
      {/* Search & Filters */}
      <div className="flex gap-4">
        <Input
          placeholder="Search files..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="max-w-md"
        />
        
        <FacetedFilters
          facets={data?.facets}
          filters={filters}
          onChange={setFilters}
        />
      </div>
      
      {/* Stats */}
      <div className="text-sm text-gray-600">
        Found {data?.total.toLocaleString()} files in {data?.took}ms
      </div>
      
      {/* Table */}
      <UltraTable
        columns={columns}
        rows={data?.files || []}
        loading={isLoading}
        enableVirtualization
        onLoadMore={() => setPage(page + 1)}
        hasMore={data?.hasMore}
      />
    </div>
  )
}
```

---

## 6. DAY 13-15: SHARING SYSTEM

Same as in RIVEST-FILE-VAULT-SYSTEM.md Section 6

---

## 7. DAY 16-18: ADMIN & TESTING

### 7.1 Load Testing with 1M Files

```typescript
// scripts/load-test-1m-files.ts

async function generateMockFiles(count: number) {
  console.log(`Generating ${count} mock files...`)
  
  const batchSize = 1000
  const batches = Math.ceil(count / batchSize)
  
  for (let i = 0; i < batches; i++) {
    const files = Array.from({ length: batchSize }, (_, j) => ({
      id: `file_${i * batchSize + j}`,
      name: `test-file-${i * batchSize + j}.pdf`,
      extension: 'pdf',
      mime_type: 'application/pdf',
      size_bytes: Math.floor(Math.random() * 10000000),
      metadata: {
        project: `RM${2500 + Math.floor(Math.random() * 10)}`,
        status: ['draft', 'review', 'approved'][Math.floor(Math.random() * 3)],
      },
      vault_id: 'test-vault',
      owner_id: 'test-user',
      tags: ['test', 'generated'],
      path: `/test/file-${i * batchSize + j}.pdf`,
      created_at: new Date(),
      updated_at: new Date(),
    }))
    
    // Index in ElasticSearch
    await searchEngine.bulkIndex(files)
    
    // Save to DB (sample only)
    if (i < 10) {
      await db.file.createMany({ data: files })
    }
    
    console.log(`Progress: ${((i + 1) / batches * 100).toFixed(1)}%`)
  }
  
  console.log(`✅ Generated ${count} files`)
}

// Run load test
async function runLoadTest() {
  console.log('Starting load test...')
  
  // Generate 1M files
  await generateMockFiles(1000000)
  
  // Test search performance
  const start = Date.now()
  const result = await searchEngine.search({
    vaultId: 'test-vault',
    query: 'test',
    filters: { project: 'RM2506' },
    pageSize: 100
  })
  const took = Date.now() - start
  
  console.log(`Search took: ${took}ms`)
  console.log(`Found: ${result.total} files`)
  console.log(`ES took: ${result.took}ms`)
  
  if (took < 100) {
    console.log('✅ PASS: Search under 100ms')
  } else {
    console.log('❌ FAIL: Search too slow')
  }
}

runLoadTest()
```

---

## 8. DAY 19-20: DEPLOY & OPTIMIZE

### 8.1 Production Deployment

```bash
# 1. Setup production services

# ElasticSearch Cloud
# Sign up: https://cloud.elastic.co
# Create deployment (4GB RAM recommended)
# Get connection URL + API key

# Redis Cloud
# Sign up: https://redis.com/try-free
# Create database
# Get connection URL

# Supabase
# Already have: cohhjvtmmchrttntoizw.supabase.co
# Ensure bucket "file-vault" exists

# 2. Update environment variables
ELASTICSEARCH_URL="https://your-es-cloud.es.cloud.io:9243"
ELASTICSEARCH_API_KEY="your-api-key"
REDIS_URL="rediss://user:pass@your-redis.cloud:6379"

# 3. Run migrations
npx prisma migrate deploy

# 4. Setup ElasticSearch index
node scripts/setup-elasticsearch.js

# 5. Deploy to Vercel
vercel --prod

# 6. Start background indexing worker
# Deploy as separate service (Railway/Render)
```

---

## 9. CLAUDE CODE COMMANDS

### START HERE - Complete Implementation

```
Loe läbi manual/OPTION-B-IMPLEMENTATION.md

See on File Vault implementatsioon mis on optimiseeritud 1M+ failidele.

Alusta järjest:

PHASE 1: Infrastructure (Day 1-2)
──────────────────────────────────
1. Loo docker-compose.yml fail (Section 2.1)
2. Start services: docker-compose up -d
3. Create .env.local (Section 2.2)
4. Verify services working

PHASE 2: Database & Search (Day 3-4)
──────────────────────────────────
1. Add Prisma models (Section 3.1)
2. Run: npx prisma migrate dev --name add_file_vault
3. Setup ElasticSearch index (Section 3.3)
4. Test connection

PHASE 3: Search Engine (Day 5-6)
──────────────────────────────────
1. Create FileSearchEngine class (Section 4.1)
2. Create FileMetadataCache class (Section 4.2)
3. Create SmartFileLoader class (Section 4.3)
4. Test with sample files

PHASE 4: File Table (Day 9-10)
──────────────────────────────────
1. Create FileTable component (Section 5.1)
2. Integrate with Ultra Table
3. Add custom metadata columns
4. Test performance

PHASE 5: Sharing (Day 13-14)
──────────────────────────────────
1. Implement share link generation
2. Create share access pages
3. Add password protection
4. Test sharing flows

PHASE 6: Testing (Day 18)
──────────────────────────────────
1. Run load test script (Section 7.1)
2. Generate 1M mock files
3. Measure performance
4. Optimize if needed

TARGET METRICS:
- Search: <50ms ✅
- Initial load: <200ms ✅
- Scroll: 60fps ✅

Teavita mind kui valmis!
```

---

## 10. PRODUCTION CHECKLIST

```
Infrastructure:
[ ] Docker containers running
[ ] ElasticSearch accessible
[ ] Redis accessible
[ ] Supabase bucket created

Database:
[ ] Prisma models added
[ ] Migration successful
[ ] Tables created
[ ] Indexes in place

Search:
[ ] ElasticSearch index created
[ ] Mappings configured
[ ] Analyzer setup
[ ] Test queries working

Cache:
[ ] Redis connection working
[ ] TTL configured
[ ] Cache hit rate >80%

Performance:
[ ] Search <50ms
[ ] Initial load <200ms
[ ] Scroll smooth 60fps
[ ] 1M files tested

Features:
[ ] File upload working
[ ] File download working
[ ] Search working
[ ] Filters working
[ ] Table view working
[ ] Custom metadata working
[ ] Sharing working
[ ] Permissions working

Production:
[ ] Environment variables set
[ ] Services deployed
[ ] Monitoring enabled
[ ] Backups configured
[ ] Load tested
```

---

## SUMMARY

```
╔═══════════════════════════════════════════════════╗
║  OPTION B IMPLEMENTATION SUMMARY                  ║
╠═══════════════════════════════════════════════════╣
║                                                   ║
║  Timeline:          20 days                       ║
║  Team size:         1-2 developers                ║
║                                                   ║
║  What you get:                                    ║
║  ✅ Production-ready file vault                   ║
║  ✅ 1M+ files supported                           ║
║  ✅ <50ms search                                  ║
║  ✅ <200ms initial load                           ║
║  ✅ Smooth 60fps scrolling                        ║
║  ✅ Advanced search (ElasticSearch)               ║
║  ✅ Fast metadata (Redis cache)                   ║
║  ✅ Table view with custom metadata               ║
║  ✅ Sharing system                                ║
║  ✅ Admin dashboard                               ║
║                                                   ║
║  Services needed:                                 ║
║  - PostgreSQL (Supabase)                          ║
║  - ElasticSearch (Cloud or self-hosted)           ║
║  - Redis (Cloud or self-hosted)                   ║
║  - Supabase Storage                               ║
║                                                   ║
║  Monthly cost (estimate):                         ║
║  - Supabase Pro: €25                              ║
║  - ElasticSearch (4GB): €50                       ║
║  - Redis (2GB): €20                               ║
║  ────────────────────────────────                ║
║  TOTAL: ~€95/month = €1,140/year                  ║
║                                                   ║
║  vs. Dropbox Business: €2,400/year                ║
║  SAVINGS: €1,260/year! 💰                         ║
║                                                   ║
╚═══════════════════════════════════════════════════╝
```

**READY TO START? 🚀**

Follow the implementation day by day!
Use Claude Code commands to automate!

---

**Contact:** silver@rivest.ee
**Guide:** manual/OPTION-B-IMPLEMENTATION.md
**Status:** READY TO BUILD! ✅
