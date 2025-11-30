# RIVEST FILE VAULT - OLUKORRA ANALÜÜS & TODO LIST

📅 **Kuupäev:** 30. November 2025  
🎯 **Eesmärk:** Dropbox + OneDrive + Google Drive + Airtable ületav lahendus  
⚠️ **Hetkeolukord:** Database schema puudu - süsteem ei tööta

---

## 🔴 KRIITILISED PROBLEEMID

### 1. Andmebaasi Tabelid Puuduvad

**Viga:**
```
Could not find the table 'public.file_vaults' in the schema cache
```

**Põhjus:**
- API routes ootavad `file_vaults`, `file_folders`, `files` jne tabeleid
- Supabase migratsioonides pole file-vault tabeleid üldse
- Ainult olemasolevad tabelid: `tenants`, `user_profiles`, `cms_system`, `warehouse_*`

**Mõjud:**
- ❌ File Vault leht ei tööta üldse
- ❌ API kutsed ebaõnnestuvad
- ❌ Failide üleslaadimine võimatu
- ❌ Kaustade loomine võimatu

---

## 📋 TEGEMATA FUNKTSIOONID

### 1.1 CORE DATABASE (PRIORITY: P0 - CRITICAL)

**Puuduvad Tabelid:**

#### A. `file_vaults` - Failihoidlad
```sql
CREATE TABLE public.file_vaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Settings
  config JSONB DEFAULT '{}',
  
  -- Storage quota
  quota_bytes BIGINT DEFAULT 107374182400, -- 100GB
  used_bytes BIGINT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_file_vaults_tenant ON file_vaults(tenant_id);
CREATE INDEX idx_file_vaults_deleted ON file_vaults(deleted_at);
```

#### B. `file_folders` - Kaustad
```sql
CREATE TABLE public.file_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES file_vaults(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES file_folders(id) ON DELETE CASCADE,
  
  -- Folder details
  name TEXT NOT NULL,
  path TEXT NOT NULL, -- e.g., "/Projects/RM2506"
  color TEXT,
  icon TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_file_folders_vault ON file_folders(vault_id);
CREATE INDEX idx_file_folders_parent ON file_folders(parent_id);
CREATE INDEX idx_file_folders_path ON file_folders(path);
```

#### C. `files` - Failid
```sql
CREATE TABLE public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES file_vaults(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES file_folders(id) ON DELETE SET NULL,
  
  -- File storage
  name TEXT NOT NULL,
  path TEXT NOT NULL, -- Supabase Storage path
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  extension TEXT,
  
  -- Hashes for deduplication
  hash_md5 TEXT,
  hash_sha256 TEXT,
  
  -- Thumbnails
  thumbnail_small TEXT, -- Supabase Storage URL
  thumbnail_medium TEXT,
  thumbnail_large TEXT,
  
  -- Custom metadata (Airtable-style)
  metadata JSONB DEFAULT '{}',
  
  -- Tags & search
  tags TEXT[] DEFAULT '{}',
  searchable_text TEXT, -- Full-text search column
  
  -- Version control
  version INTEGER DEFAULT 1,
  is_latest BOOLEAN DEFAULT true,
  parent_version_id UUID REFERENCES files(id),
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL,
  deleted_at TIMESTAMPTZ,
  
  -- Soft delete
  is_starred BOOLEAN DEFAULT false,
  is_trashed BOOLEAN DEFAULT false,
  trashed_at TIMESTAMPTZ
);

CREATE INDEX idx_files_vault ON files(vault_id);
CREATE INDEX idx_files_folder ON files(folder_id);
CREATE INDEX idx_files_hash ON files(hash_sha256);
CREATE INDEX idx_files_deleted ON files(deleted_at);
CREATE INDEX idx_files_search ON files USING GIN(to_tsvector('english', searchable_text));
CREATE INDEX idx_files_tags ON files USING GIN(tags);
CREATE INDEX idx_files_metadata ON files USING GIN(metadata);
```

#### D. `file_shares` - Jagamislinkid
```sql
CREATE TABLE public.file_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES file_vaults(id) ON DELETE CASCADE,
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES file_folders(id) ON DELETE CASCADE,
  
  -- Share settings
  short_code TEXT UNIQUE NOT NULL, -- e.g., "abc123"
  password_hash TEXT, -- bcrypt
  
  -- Access control
  allow_download BOOLEAN DEFAULT true,
  allow_upload BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  download_limit INTEGER, -- NULL = unlimited
  downloads_count INTEGER DEFAULT 0,
  
  -- Tracking
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL,
  
  CONSTRAINT file_or_folder_required CHECK (
    (file_id IS NOT NULL AND folder_id IS NULL) OR
    (file_id IS NULL AND folder_id IS NOT NULL)
  )
);

CREATE INDEX idx_file_shares_short_code ON file_shares(short_code);
CREATE INDEX idx_file_shares_file ON file_shares(file_id);
CREATE INDEX idx_file_shares_expires ON file_shares(expires_at);
```

#### E. `file_versions` - Versioonid
```sql
CREATE TABLE public.file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES files(id) ON DELETE CASCADE,
  
  -- Version details
  version INTEGER NOT NULL,
  path TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  hash_sha256 TEXT NOT NULL,
  
  -- Change info
  change_description TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL
);

CREATE INDEX idx_file_versions_file ON file_versions(file_id);
```

#### F. `file_activities` - Tegevuste logi
```sql
CREATE TABLE public.file_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES file_vaults(id) ON DELETE CASCADE,
  file_id UUID REFERENCES files(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES file_folders(id) ON DELETE CASCADE,
  
  -- Activity details
  action TEXT NOT NULL, -- 'upload', 'download', 'delete', 'share', 'move', 'rename'
  details JSONB DEFAULT '{}',
  
  -- User
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_file_activities_vault ON file_activities(vault_id);
CREATE INDEX idx_file_activities_file ON file_activities(file_id);
CREATE INDEX idx_file_activities_created ON file_activities(created_at);
```

---

### 1.2 SUPABASE STORAGE (PRIORITY: P0)

**Puudub:**
- ❌ Supabase Storage bucket "file-vault"
- ❌ RLS policies failide jaoks
- ❌ Image transformation seaded

**Vaja luua:**

1. **Storage Bucket**
```sql
-- Supabase Dashboard > Storage > New Bucket
Name: file-vault
Public: false (kasutame signed URLs)
File size limit: 50GB
Allowed MIME types: *
```

2. **RLS Policies**
```sql
-- Storage policies
CREATE POLICY "Users can upload to their vault"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'file-vault' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM file_vaults WHERE tenant_id = auth.jwt() ->> 'tenant_id'
  )
);

CREATE POLICY "Users can read their files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'file-vault' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM file_vaults WHERE tenant_id = auth.jwt() ->> 'tenant_id'
  )
);
```

---

### 1.3 THUMBNAILIDE GENEREERIMINE (PRIORITY: P1)

**Puuduvad:**
- ❌ Pildi thumbnail'ide automaatne loomine
- ❌ PDF preview generaator
- ❌ Video thumbnail'id

**Vajad:**
```typescript
// apps/web/src/lib/file-vault/storage/thumbnail-generator.ts

import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

export async function generateThumbnails(
  file: File,
  vaultId: string,
  fileId: string
) {
  if (!file.type.startsWith('image/')) {
    return null
  }

  const buffer = await file.arrayBuffer()
  
  // Generate 3 sizes
  const thumbnails = await Promise.all([
    // Small (100x100)
    sharp(buffer)
      .resize(100, 100, { fit: 'cover' })
      .jpeg({ quality: 80 })
      .toBuffer(),
    
    // Medium (400x400)
    sharp(buffer)
      .resize(400, 400, { fit: 'cover' })
      .jpeg({ quality: 85 })
      .toBuffer(),
    
    // Large (800x800)
    sharp(buffer)
      .resize(800, 800, { fit: 'inside' })
      .jpeg({ quality: 90 })
      .toBuffer(),
  ])

  // Upload to storage
  const supabase = createClient(/* ... */)
  
  const paths = {
    small: `${vaultId}/${fileId}/thumb_small.jpg`,
    medium: `${vaultId}/${fileId}/thumb_medium.jpg`,
    large: `${vaultId}/${fileId}/thumb_large.jpg`,
  }

  await Promise.all([
    supabase.storage.from('file-vault').upload(paths.small, thumbnails[0]),
    supabase.storage.from('file-vault').upload(paths.medium, thumbnails[1]),
    supabase.storage.from('file-vault').upload(paths.large, thumbnails[2]),
  ])

  return paths
}
```

---

### 1.4 CHUNKED UPLOAD (PRIORITY: P1)

**Hetkel:**
- ⚠️ Tavaline upload (limiteeritud ~50MB)
- ⚠️ Ei toeta resumable upload'i
- ⚠️ Võrgu katkemisel algab otsast

**Vaja:**
```typescript
// apps/web/src/lib/file-vault/upload/chunked-uploader.ts

export class ChunkedUploader {
  private chunkSize = 5 * 1024 * 1024 // 5MB
  
  async uploadFile(
    file: File,
    vaultId: string,
    onProgress?: (percent: number) => void
  ) {
    const chunks = Math.ceil(file.size / this.chunkSize)
    const uploadId = crypto.randomUUID()
    
    // Create upload session
    await fetch('/api/file-vault/upload/create-session', {
      method: 'POST',
      body: JSON.stringify({
        uploadId,
        fileName: file.name,
        fileSize: file.size,
        chunks,
        vaultId,
      })
    })
    
    // Upload chunks
    for (let i = 0; i < chunks; i++) {
      const start = i * this.chunkSize
      const end = Math.min(start + this.chunkSize, file.size)
      const chunk = file.slice(start, end)
      
      await fetch('/api/file-vault/upload/chunk', {
        method: 'POST',
        headers: {
          'X-Upload-Id': uploadId,
          'X-Chunk-Index': i.toString(),
          'Content-Type': 'application/octet-stream',
        },
        body: chunk,
      })
      
      if (onProgress) {
        onProgress(((i + 1) / chunks) * 100)
      }
    }
    
    // Complete upload
    const result = await fetch('/api/file-vault/upload/complete', {
      method: 'POST',
      body: JSON.stringify({ uploadId })
    })
    
    return result.json()
  }
}
```

---

### 1.5 FULL-TEXT SEARCH (PRIORITY: P1)

**Puudub:**
- ❌ PDF teksti ekstraheerimine
- ❌ DOCX teksti ekstraheerimine
- ❌ Full-text search indeks

**Vaja:**
```typescript
// apps/web/src/lib/file-vault/search/file-search-engine.ts

import { pdfToText } from 'pdf-parse'
import mammoth from 'mammoth'

export async function extractSearchableText(file: File): Promise<string> {
  if (file.type === 'application/pdf') {
    const buffer = await file.arrayBuffer()
    const data = await pdfToText(buffer)
    return data.text
  }
  
  if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const buffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  }
  
  // Text files
  if (file.type.startsWith('text/')) {
    return await file.text()
  }
  
  return ''
}

// Update file with searchable text
export async function indexFile(fileId: string, text: string) {
  await supabase
    .from('files')
    .update({ searchable_text: text })
    .eq('id', fileId)
}

// Search
export async function searchFiles(vaultId: string, query: string) {
  const { data } = await supabase
    .from('files')
    .select('*')
    .eq('vault_id', vaultId)
    .textSearch('searchable_text', query, {
      type: 'websearch',
      config: 'english'
    })
  
  return data
}
```

---

### 1.6 TABLE INTEGRATION (PRIORITY: P2)

**Kontseptsioon:**
Failid kui tabeli read - see on revolutsiooniline!

**Puudub:**
- ❌ Files tabel Ultra Table süsteemis
- ❌ Kohandatud metadata veerud
- ❌ Relations projektidele/klientidele
- ❌ Formulas (nt. "Days Until Due")

**Näide:**
```typescript
// Fail metadata:
{
  "project_id": "RM2506",           // Relation → Projects table
  "client_id": "nordec_oy",         // Relation → Clients table
  "drawing_number": "DWG-001",      // Text field
  "revision": 3,                    // Number field
  "status": "approved",             // Single select
  "due_date": "2025-12-15",         // Date field
  "assignee_id": "user_123",        // User field
  "days_until_due": 15              // Formula: DAYS(due_date, TODAY())
}
```

**Implementatsioon:**
1. Loo `files` tabel Ultra Table süsteemis
2. Lisa custom columns metadata JSONB'i
3. Ühenda Ultra Table column types süsteemiga
4. Luba bulk operations

---

### 1.7 SHARING SYSTEM (PRIORITY: P2)

**Olemas:**
- ✅ Database tabelid (kui lood)
- ✅ API routes (on juba)

**Puudub:**
- ❌ Public share page `/share/[shortCode]`
- ❌ Password verification UI
- ❌ Download tracking
- ❌ Email notifications
- ❌ QR code generation

**Vaja luua:**
```typescript
// apps/web/src/app/share/[shortCode]/page.tsx

export default async function SharePage({
  params: { shortCode }
}: {
  params: { shortCode: string }
}) {
  const share = await getShare(shortCode)
  
  // Check expiration
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return <ExpiredMessage />
  }
  
  // Check download limit
  if (share.download_limit && share.downloads_count >= share.download_limit) {
    return <LimitReachedMessage />
  }
  
  // Password protected?
  if (share.password_hash) {
    return <PasswordPrompt shareId={share.id} />
  }
  
  // Show file/folder
  return <ShareView share={share} />
}
```

---

### 1.8 ADMIN DASHBOARD (PRIORITY: P3)

**Puudub:**
- ❌ Storage analytics
- ❌ User quotas management
- ❌ Activity monitoring
- ❌ Large file reports

**Vaja:**
```typescript
// apps/web/src/app/(dashboard)/admin/file-vault/page.tsx

export default function FileVaultAdminPage() {
  return (
    <div className="space-y-6">
      {/* Storage Overview */}
      <StorageStats />
      
      {/* Recent Activity */}
      <ActivityFeed />
      
      {/* User Quotas */}
      <QuotaManagement />
      
      {/* Share Links */}
      <ActiveShares />
      
      {/* Large Files */}
      <LargeFilesReport />
    </div>
  )
}
```

---

### 1.9 ADVANCED FEATURES (PRIORITY: P4 - Future)

**Koostöö:**
- ❌ Real-time collaboration (Supabase Realtime)
- ❌ Comments süsteem
- ❌ @Mentions & notifications
- ❌ Activity feed

**Otsing:**
- ❌ ElasticSearch/Typesense integratsioon (1M+ files)
- ❌ Faceted filters
- ❌ OCR search (tesseract.js)
- ❌ AI semantic search (OpenAI embeddings)

**Automaatika:**
- ❌ Workflows ("kui fail laetakse, siis...")
- ❌ Webhooks
- ❌ Zapier integration

**Mobile:**
- ❌ React Native app
- ❌ Offline mode
- ❌ Camera upload

---

## ✅ MIS ON JUBA TEHTUD

### API Routes ✅
```
✅ apps/web/src/app/api/file-vault/vaults/route.ts
✅ apps/web/src/app/api/file-vault/folders/route.ts
✅ apps/web/src/app/api/file-vault/folders/[id]/route.ts
✅ apps/web/src/app/api/file-vault/files/route.ts
✅ apps/web/src/app/api/file-vault/files/[id]/route.ts
✅ apps/web/src/app/api/file-vault/upload/route.ts
```

### UI Components ✅
```
✅ apps/web/src/app/(dashboard)/file-vault/page.tsx (leht valmis!)
✅ apps/web/src/components/file-vault/FileUploadDialog.tsx
```

### Library Code ⚠️
```
✅ apps/web/src/lib/file-vault/types/index.ts
✅ apps/web/src/lib/file-vault/storage/file-storage.ts
⚠️ apps/web/src/lib/file-vault/storage/thumbnail-generator.ts (incomplete)
⚠️ apps/web/src/lib/file-vault/search/file-search-engine.ts (incomplete)
```

---

## 🎯 JÄRGMISED SAMMUD (PRIORITEEDIJÄRJEKORRAS)

### SAMM 1: Database Setup (1 päev) - KRIITLILINE ❗❗❗

**Ülesanded:**
1. Loo Supabase migratsioon:
   ```bash
   cd supabase
   supabase migration new file_vault_system
   ```

2. Lisa kõik tabelid (vt jaotis 1.1):
   - file_vaults
   - file_folders
   - files
   - file_shares
   - file_versions
   - file_activities

3. Rakenda migratsioon:
   ```bash
   supabase db push
   ```

4. Kontrolli Supabase Dashboard's, kas tabelid on loodud

---

### SAMM 2: Storage Setup (2 tundi)

1. Loo Supabase Storage bucket:
   - Mine: Supabase Dashboard > Storage
   - New Bucket: `file-vault`
   - Public: false
   - Max file size: 50GB

2. Lisa RLS policies (vt jaotis 1.2)

3. Test faili üleslaadimist

---

### SAMM 3: Thumbnail Generation (1 päev)

1. Installi sõltuvused:
   ```bash
   npm install sharp pdf-parse mammoth
   ```

2. Implementeeri thumbnail-generator.ts (vt jaotis 1.3)

3. Lisa API route thumbnail genereerimiseks

4. Testi piltide thumbna upload'iga

---

### SAMM 4: Chunked Upload (2 päeva)

1. Implementeeri ChunkedUploader (vt jaotis 1.4)

2. Lisa API routes:
   - POST /api/file-vault/upload/create-session
   - POST /api/file-vault/upload/chunk
   - POST /api/file-vault/upload/complete

3. Testi suurte failidega (>100MB)

---

### SAMM 5: Search & Filters (2 päeva)

1. Implementeeri full-text search (vt jaotis 1.5)

2. Lisa PDF/DOCX teksti ekstraheerimine

3. Testi otsingu tööd

---

### SAMM 6: Table Integration (3 päeva)

1. Integreeri files Ultra Table süsteemiga

2. Lisa custom metadata columns

3. Implementeeri relations

4. Testi bulk operations

---

### SAMM 7: Sharing System (2 päeva)

1. Loo share public page (vt jaotis 1.7)

2. Implementeeri password protection

3. Lisa download tracking

4. Testi jagamist

---

### SAMM 8: Admin Dashboard (2 päeva)

1. Loo admin dashboard (vt jaotis 1.8)

2. Lisa analytics

3. Implementeeri quota management

---

## 📊 KOKKUVÕTE

### Praegune Olukord
- ✅ UI komponendid: 80% valmis
- ✅ API routes: 100% valmis
- ❌ Database: 0% (KRIITLINE PUUDUJÄÄK!)
- ⚠️ Storage: 0% (bucket puudu)
- ⚠️ Thumbnails: 30%
- ❌ Upload: 50% (chunked puudu)
- ❌ Search: 20%
- ❌ Sharing: 40%
- ❌ Admin: 0%

### Ajakava (1-2 arendajat)
- **Week 1 (Days 1-2):** Database + Storage ← **START HERE!**
- **Week 1 (Days 3-5):** Upload + Thumbnails
- **Week 2 (Days 6-8):** Search + Table Integration
- **Week 2 (Days 9-10):** Sharing + Admin
- **Week 3:** Testing + Optimizations

### Konkurentsieelis
Kui kõik on tehtud, on teil:
- ✅ Dropbox-level file management
- ✅ Airtable-style metadata & relations ← AINULAADNE!
- ✅ Box-level sharing & security
- ✅ Better than ALL competitors combined!

---

**ESMANE FOOKUS: Lisa database migration! Ilma selleta ei tööta süsteem üldse.** 🚀
