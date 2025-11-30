# FILE VAULT IMPLEMENTATSIOONI JUHEND

📅 **Kuupäev:** 30. November 2025  
⏱️ **Ajakava:** 2-3 päeva (põhifunktsionaalsus)  
👥 **Meeskond:** 1-2 arendajat

---

## 🎯 SAMM 1: DATABASE SETUP (30 min)

### 1.1 Lisa Migratsioon

```bash
# 1. Kopeeri SQL fail Supabase kausta
cp 006_file_vault_system.sql supabase/migrations/

# 2. Kontrolli, et fail on olemas
ls -la supabase/migrations/006_file_vault_system.sql

# 3. Rakenda migratsioon
supabase db push

# või kui kasutad local Supabase:
supabase db reset
```

### 1.2 Kontrolli Supabase Dashboard's

1. Mine: https://app.supabase.com
2. Vali projekt
3. Table Editor
4. Kontrolli, et on näha:
   - ✅ file_vaults
   - ✅ file_folders
   - ✅ files
   - ✅ file_shares
   - ✅ file_versions
   - ✅ file_activities

### 1.3 Testi RLS Policies

```sql
-- Mine SQL Editor ja käivita:
SELECT * FROM file_vaults; -- Peaks olema tühi
SELECT * FROM files; -- Peaks olema tühi
```

---

## 🎯 SAMM 2: SUPABASE STORAGE SETUP (15 min)

### 2.1 Loo Storage Bucket

1. Mine: Supabase Dashboard > Storage
2. Vajuta: "New bucket"
3. Seaded:
   ```
   Name: file-vault
   Public: false (unchecked!)
   File size limit: 50 GB
   Allowed MIME types: *
   ```
4. Vajuta: "Create bucket"

### 2.2 Lisa Storage RLS Policies

Mine: Storage > file-vault > Policies > New Policy

**Policy 1: Upload**
```sql
CREATE POLICY "Users can upload to their vault"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'file-vault' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM file_vaults 
    WHERE tenant_id = (
      SELECT tenant_id FROM user_profiles 
      WHERE auth_user_id = auth.uid()
    )
  )
);
```

**Policy 2: Download**
```sql
CREATE POLICY "Users can read their files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'file-vault' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM file_vaults 
    WHERE tenant_id = (
      SELECT tenant_id FROM user_profiles 
      WHERE auth_user_id = auth.uid()
    )
  )
);
```

**Policy 3: Delete**
```sql
CREATE POLICY "Users can delete their files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'file-vault' AND
  (storage.foldername(name))[1] IN (
    SELECT id::text FROM file_vaults 
    WHERE tenant_id = (
      SELECT tenant_id FROM user_profiles 
      WHERE auth_user_id = auth.uid()
    )
  )
);
```

---

## 🎯 SAMM 3: TEST FILE UPLOAD (10 min)

### 3.1 Käivita Rakendus

```bash
cd apps/web
npm run dev
```

### 3.2 Testi UI's

1. Mine: http://localhost:3000/file-vault
2. Peaks nägema:
   - ✅ Tühi failihoidla (kui esimene kord)
   - ✅ "Laadi fail" nupp
   - ✅ "Uus kaust" nupp

3. Vajuta: "Laadi fail"
4. Vali: väike pilt (nt. < 5MB)
5. Lae üles

**Oodatav tulemus:**
- ✅ Upload bar ilmub
- ✅ Progress bar liigub
- ✅ Fail ilmub nimekirja
- ✅ Thumbnail näha (kui pilt)

**Kui viga:**
- Vaata browser console (F12)
- Vaata terminal'i (server logs)
- Kontrolli Supabase Dashboard > Table Editor > files

---

## 🎯 SAMM 4: THUMBNAIL GENERATION (1-2 tundi)

### 4.1 Installi Sõltuvused

```bash
cd apps/web
npm install sharp pdf-parse mammoth
```

### 4.2 Loo Thumbnail Generator

Fail: `apps/web/src/lib/file-vault/storage/thumbnail-generator.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Server-side only!
)

export async function generateThumbnails(
  fileBuffer: ArrayBuffer,
  vaultId: string,
  fileId: string,
  mimeType: string
) {
  // Only for images
  if (!mimeType.startsWith('image/')) {
    return {
      thumbnailSmall: null,
      thumbnailMedium: null,
      thumbnailLarge: null,
    }
  }

  try {
    const buffer = Buffer.from(fileBuffer)
    
    // Generate 3 sizes
    const [small, medium, large] = await Promise.all([
      sharp(buffer)
        .resize(100, 100, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toBuffer(),
      
      sharp(buffer)
        .resize(400, 400, { fit: 'cover' })
        .jpeg({ quality: 85 })
        .toBuffer(),
      
      sharp(buffer)
        .resize(800, 800, { fit: 'inside' })
        .jpeg({ quality: 90 })
        .toBuffer(),
    ])

    // Upload to Supabase Storage
    const basePath = `${vaultId}/${fileId}`
    
    const [smallUpload, mediumUpload, largeUpload] = await Promise.all([
      supabase.storage.from('file-vault').upload(`${basePath}/thumb_small.jpg`, small, {
        contentType: 'image/jpeg',
        cacheControl: '31536000', // 1 year
      }),
      supabase.storage.from('file-vault').upload(`${basePath}/thumb_medium.jpg`, medium, {
        contentType: 'image/jpeg',
        cacheControl: '31536000',
      }),
      supabase.storage.from('file-vault').upload(`${basePath}/thumb_large.jpg`, large, {
        contentType: 'image/jpeg',
        cacheControl: '31536000',
      }),
    ])

    // Get public URLs (signed URLs would be better for production)
    const { data: { publicUrl: smallUrl } } = supabase.storage
      .from('file-vault')
      .getPublicUrl(`${basePath}/thumb_small.jpg`)
    
    const { data: { publicUrl: mediumUrl } } = supabase.storage
      .from('file-vault')
      .getPublicUrl(`${basePath}/thumb_medium.jpg`)
    
    const { data: { publicUrl: largeUrl } } = supabase.storage
      .from('file-vault')
      .getPublicUrl(`${basePath}/thumb_large.jpg`)

    return {
      thumbnailSmall: smallUrl,
      thumbnailMedium: mediumUrl,
      thumbnailLarge: largeUrl,
    }
  } catch (error) {
    console.error('Thumbnail generation failed:', error)
    return {
      thumbnailSmall: null,
      thumbnailMedium: null,
      thumbnailLarge: null,
    }
  }
}
```

### 4.3 Uuenda Upload API Route

Fail: `apps/web/src/app/api/file-vault/upload/route.ts`

Lisa thumbnail genereerimise kutse pärast faili üleslaadimist:

```typescript
// ... olemasolev upload kood ...

// After file is uploaded to storage:
const thumbnails = await generateThumbnails(
  await file.arrayBuffer(),
  vaultId,
  fileId,
  file.type
)

// Update file record with thumbnails
await supabase
  .from('files')
  .update({
    thumbnail_small: thumbnails.thumbnailSmall,
    thumbnail_medium: thumbnails.thumbnailMedium,
    thumbnail_large: thumbnails.thumbnailLarge,
  })
  .eq('id', fileId)
```

### 4.4 Test Thumbnails

1. Lae üles pilt
2. Kontrolli `files` tabelis, kas thumbnail_* veerud täituvad
3. Kontrolli Storage > file-vault, kas thumb_*.jpg failid on loodud

---

## 🎯 SAMM 5: FULL-TEXT SEARCH (2-3 tundi)

### 5.1 Installi PDF/DOCX Parserid

```bash
npm install pdf-parse mammoth
```

### 5.2 Loo Text Extractor

Fail: `apps/web/src/lib/file-vault/search/text-extractor.ts`

```typescript
import pdfParse from 'pdf-parse'
import mammoth from 'mammoth'

export async function extractTextFromFile(
  fileBuffer: ArrayBuffer,
  mimeType: string
): Promise<string> {
  try {
    // PDF
    if (mimeType === 'application/pdf') {
      const buffer = Buffer.from(fileBuffer)
      const data = await pdfParse(buffer)
      return data.text
    }
    
    // DOCX
    if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      const buffer = Buffer.from(fileBuffer)
      const result = await mammoth.extractRawText({ buffer })
      return result.value
    }
    
    // Text files
    if (mimeType.startsWith('text/')) {
      const decoder = new TextDecoder('utf-8')
      return decoder.decode(fileBuffer)
    }
    
    return ''
  } catch (error) {
    console.error('Text extraction failed:', error)
    return ''
  }
}
```

### 5.3 Uuenda Upload API

Lisa text ekstraheerimine upload route'i:

```typescript
// After file upload:
const searchableText = await extractTextFromFile(
  await file.arrayBuffer(),
  file.type
)

await supabase
  .from('files')
  .update({ searchable_text: searchableText })
  .eq('id', fileId)
```

### 5.4 Implementeeri Search API

Fail: `apps/web/src/app/api/file-vault/search/route.ts`

```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const supabase = createClient()
  const { searchParams } = new URL(request.url)
  
  const vaultId = searchParams.get('vaultId')
  const query = searchParams.get('q')
  
  if (!vaultId || !query) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  // Full-text search
  const { data: files, error } = await supabase
    .from('files')
    .select('*')
    .eq('vault_id', vaultId)
    .textSearch('searchable_text', query, {
      type: 'websearch',
      config: 'english'
    })
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ files })
}
```

### 5.5 Lisa Search UI

Uuenda: `apps/web/src/app/(dashboard)/file-vault/page.tsx`

Lisa search query handling:

```typescript
const handleSearch = async (query: string) => {
  if (!vault || !query) {
    // Load normal files
    await fetchContent(vault.id, currentFolderId)
    return
  }

  // Search
  const response = await fetch(
    `/api/file-vault/search?vaultId=${vault.id}&q=${encodeURIComponent(query)}`
  )
  const data = await response.json()
  setFiles(data.files || [])
}

// In search input onChange:
onChange={(e) => {
  setSearchQuery(e.target.value)
  // Debounce search
  clearTimeout(searchTimeout)
  searchTimeout = setTimeout(() => {
    handleSearch(e.target.value)
  }, 300)
}}
```

---

## 🎯 SAMM 6: SHARING SYSTEM (2-3 tundi)

### 6.1 Loo Share Link Generator

Fail: `apps/web/src/lib/file-vault/sharing/generate-share-link.ts`

```typescript
import { nanoid } from 'nanoid'
import bcrypt from 'bcryptjs'
import { createClient } from '@supabase/supabase-js'

export async function createShareLink({
  vaultId,
  fileId,
  folderId,
  password,
  expiresIn, // hours
  downloadLimit,
}: {
  vaultId: string
  fileId?: string
  folderId?: string
  password?: string
  expiresIn?: number
  downloadLimit?: number
}) {
  const supabase = createClient(/* ... */)
  
  const shortCode = nanoid(10) // e.g., "abc123xyz0"
  const passwordHash = password ? await bcrypt.hash(password, 10) : null
  const expiresAt = expiresIn
    ? new Date(Date.now() + expiresIn * 60 * 60 * 1000).toISOString()
    : null

  const { data, error } = await supabase
    .from('file_shares')
    .insert({
      vault_id: vaultId,
      file_id: fileId,
      folder_id: folderId,
      short_code: shortCode,
      password_hash: passwordHash,
      expires_at: expiresAt,
      download_limit: downloadLimit,
      created_by: (await supabase.auth.getUser()).data.user?.id,
    })
    .select()
    .single()

  if (error) throw error

  return {
    shortCode,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/share/${shortCode}`,
  }
}
```

### 6.2 Loo Public Share Page

Fail: `apps/web/src/app/share/[shortCode]/page.tsx`

```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function SharePage({
  params,
}: {
  params: { shortCode: string }
}) {
  const supabase = createClient()
  
  // Get share
  const { data: share } = await supabase
    .from('file_shares')
    .select(`
      *,
      file:files(*),
      folder:file_folders(*)
    `)
    .eq('short_code', params.shortCode)
    .single()

  if (!share) {
    return <div>Share not found</div>
  }

  // Check expiration
  if (share.expires_at && new Date(share.expires_at) < new Date()) {
    return <div>This share link has expired</div>
  }

  // Check download limit
  if (
    share.download_limit &&
    share.downloads_count >= share.download_limit
  ) {
    return <div>Download limit reached</div>
  }

  // Password protected?
  if (share.password_hash) {
    return <PasswordPrompt shareId={share.id} />
  }

  // Show file/folder
  if (share.file) {
    return <FileDownloadPage file={share.file} shareId={share.id} />
  }

  if (share.folder) {
    return <FolderBrowsePage folder={share.folder} shareId={share.id} />
  }
}
```

### 6.3 Test Sharing

1. Mine file-vault'i
2. Vali fail
3. Vajuta "Share" (lisa see nupp kui veel pole)
4. Loo share link
5. Kopeeri link
6. Ava incognito window
7. Kleebi link
8. Peaks nägema faili

---

## 🎯 SAMM 7: PRODUCTION CHECKLIST

### 7.1 Environment Variables

Kontrolli `.env.local`:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx... # Server-side only!

# App
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### 7.2 Storage Limits

Supabase Dashboard > Settings > Storage:
- ✅ Max file size: 50GB
- ✅ Total storage: vastavalt plaanile

### 7.3 Database Indexes

Kontrolli, et kõik indeksid on loodud:

```sql
-- Kontrolli indekseid:
SELECT
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename LIKE 'file_%'
ORDER BY tablename, indexname;
```

### 7.4 RLS Policies

Test, et RLS töötab:

```sql
-- Logi sisse testikasutajana
SET SESSION "request.jwt.claims" = '{"sub": "test-user-id"}';

-- Peaks nägema ainult oma faile:
SELECT * FROM files;
```

---

## 🎉 VALMIS!

### Mis On Nüüd Töös

✅ Database schema (kõik tabelid)  
✅ Supabase Storage (file-vault bucket)  
✅ File upload & download  
✅ Folder structure  
✅ Thumbnails (piltidele)  
✅ Full-text search (PDF/DOCX)  
✅ Sharing system  
✅ RLS security  

### Järgmised Sammud (Valikulised)

1. **Chunked upload** (suurte failide jaoks)
2. **Version control** (file_versions tabel)
3. **Table integration** (metadata Ultra Table'is)
4. **Admin dashboard** (analytics, quotas)
5. **Activity tracking** (file_activities detail)
6. **Real-time collaboration** (Supabase Realtime)

### Testimine

```bash
# 1. Upload väike fail (<5MB)
# 2. Upload suur fail (>100MB) - kui chunked upload
# 3. Loo kauststruktuur
# 4. Liiguta faile kaustade vahel
# 5. Otsi teksti (PDF/DOCX)
# 6. Loo share link
# 7. Testi share link'i incognito mode's
# 8. Kontrolli thumbnails ilmuvad
```

---

**Küsimused?** Vaata täielikku dokumentatsiooni:
- `FILE-VAULT-STATUS-JA-TODO.md` - Detailne olukorra ülevaade
- `manual/RIVEST-FILE-VAULT-SYSTEM.md` - Täielik tehniline spetsifikatsioon
- `manual/FILE-VAULT-ADVANCED-FEATURES.md` - Täiendavad võimalused

**Edu! 🚀**
