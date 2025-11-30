# Ultra Tables × File Vault Integratsioon

## 🎯 EESMÄRK

Kui tabelisse lisatakse media veerg (file, files, image, images, video, audio, attachment), siis failid:
- ✅ Salvestatakse automaatselt File Vault'i
- ✅ Kasutatakse struktuurseid kaustu: `TABELITE failid/{tabeli_nimi}/{rea_id}/`
- ✅ On nähtavad ja hallatavad File Vault UI's
- ✅ Kustutatakse automaatselt kui rida kustutatakse

## 📊 KAUSTADE STRUKTUUR

```
File Vault
└── TABELITE failid/
    ├── Kliendid/
    │   ├── c1a2b3c4-uuid/
    │   │   ├── profiilipilt.jpg
    │   │   ├── leping.pdf
    │   │   └── dokumendid/
    │   │       └── id-kaart.jpg
    │   └── d5e6f7g8-uuid/
    │       └── avatar.png
    ├── Projektid/
    │   └── a1b2c3d4-uuid/
    │       ├── plaan.pdf
    │       └── pildid/
    │           ├── foto1.jpg
    │           └── foto2.jpg
    └── Ülesanded/
        └── z9y8x7w6-uuid/
            └── screenshot.png
```

## 🔧 IMPLEMENTATSIOON

### 1. File Upload Handler

```typescript
// /apps/web/src/lib/ultra-tables/file-handler.ts

import { createClient } from '@/lib/supabase/client'

interface UploadConfig {
  tableId: string
  tableName: string
  recordId: string
  columnId: string
  columnName: string
}

export class TableFileHandler {
  private supabase = createClient()

  /**
   * Get or create File Vault folder for table record
   */
  async getRecordFolder(config: UploadConfig): Promise<string> {
    const { tableName, recordId } = config

    // Root folder: "TABELITE failid"
    let rootFolder = await this.findOrCreateFolder('TABELITE failid', null)

    // Table folder: "TABELITE failid/Kliendid"
    let tableFolder = await this.findOrCreateFolder(tableName, rootFolder.id)

    // Record folder: "TABELITE failid/Kliendid/uuid"
    let recordFolder = await this.findOrCreateFolder(recordId, tableFolder.id)

    return recordFolder.id
  }

  /**
   * Find or create folder in File Vault
   */
  private async findOrCreateFolder(
    name: string,
    parentId: string | null
  ): Promise<any> {
    // Check if folder exists
    const { data: existing } = await this.supabase
      .from('file_vault_folders')
      .select('id, name')
      .eq('name', name)
      .eq('parent_id', parentId)
      .single()

    if (existing) {
      return existing
    }

    // Create new folder
    const { data: newFolder, error } = await this.supabase
      .from('file_vault_folders')
      .insert({
        name,
        parent_id: parentId,
        type: 'folder',
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create folder: ${error.message}`)
    }

    return newFolder
  }

  /**
   * Upload file to table record folder
   */
  async uploadFile(
    file: File,
    config: UploadConfig
  ): Promise<any> {
    // Get or create folder
    const folderId = await this.getRecordFolder(config)

    // Generate unique filename
    const timestamp = Date.now()
    const extension = file.name.split('.').pop()
    const safeName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .substring(0, 100)
    const fileName = `${timestamp}_${safeName}`

    // Upload to Supabase Storage
    const storagePath = `tables/${config.tableId}/${config.recordId}/${fileName}`
    
    const { data: uploadData, error: uploadError } = await this.supabase.storage
      .from('table-files')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // Get public URL
    const { data: urlData } = this.supabase.storage
      .from('table-files')
      .getPublicUrl(storagePath)

    // Create file record in File Vault
    const { data: fileRecord, error: fileError } = await this.supabase
      .from('file_vault_files')
      .insert({
        name: file.name,
        folder_id: folderId,
        file_path: storagePath,
        file_url: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type,
        metadata: {
          table_id: config.tableId,
          table_name: config.tableName,
          record_id: config.recordId,
          column_id: config.columnId,
          column_name: config.columnName,
        },
      })
      .select()
      .single()

    if (fileError) {
      // Cleanup storage if File Vault insert fails
      await this.supabase.storage.from('table-files').remove([storagePath])
      throw new Error(`File record creation failed: ${fileError.message}`)
    }

    return {
      id: fileRecord.id,
      name: fileRecord.name,
      url: fileRecord.file_url,
      size: fileRecord.file_size,
      type: fileRecord.mime_type,
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: File[],
    config: UploadConfig
  ): Promise<any[]> {
    const uploadPromises = files.map((file) => this.uploadFile(file, config))
    return Promise.all(uploadPromises)
  }

  /**
   * Delete file from table record
   */
  async deleteFile(fileId: string): Promise<void> {
    // Get file record
    const { data: fileRecord } = await this.supabase
      .from('file_vault_files')
      .select('file_path')
      .eq('id', fileId)
      .single()

    if (!fileRecord) {
      throw new Error('File not found')
    }

    // Delete from storage
    await this.supabase.storage
      .from('table-files')
      .remove([fileRecord.file_path])

    // Delete from File Vault
    await this.supabase
      .from('file_vault_files')
      .delete()
      .eq('id', fileId)
  }

  /**
   * Delete all files for a record
   */
  async deleteRecordFiles(tableId: string, recordId: string): Promise<void> {
    // Get all files for this record
    const { data: files } = await this.supabase
      .from('file_vault_files')
      .select('id, file_path')
      .eq('metadata->>table_id', tableId)
      .eq('metadata->>record_id', recordId)

    if (!files || files.length === 0) return

    // Delete from storage
    const paths = files.map((f) => f.file_path)
    await this.supabase.storage.from('table-files').remove(paths)

    // Delete from File Vault
    const fileIds = files.map((f) => f.id)
    await this.supabase
      .from('file_vault_files')
      .delete()
      .in('id', fileIds)
  }

  /**
   * Get files for a record
   */
  async getRecordFiles(tableId: string, recordId: string): Promise<any[]> {
    const { data: files } = await this.supabase
      .from('file_vault_files')
      .select('*')
      .eq('metadata->>table_id', tableId)
      .eq('metadata->>record_id', recordId)
      .order('created_at', { ascending: false })

    return files || []
  }
}

export const tableFileHandler = new TableFileHandler()
```

### 2. File Upload Component

```typescript
// /apps/web/src/components/admin/ultra-tables/FileUpload.tsx

'use client'

import { useState, useRef } from 'react'
import { Upload, X, File, Loader2 } from 'lucide-react'
import { Button } from '@/packages/ui/src/components/button'
import { tableFileHandler } from '@/lib/ultra-tables/file-handler'

interface FileUploadProps {
  tableId: string
  tableName: string
  recordId: string
  columnId: string
  columnName: string
  value: any[]
  onChange: (files: any[]) => void
  multiple?: boolean
  accept?: string
}

export function FileUpload({
  tableId,
  tableName,
  recordId,
  columnId,
  columnName,
  value = [],
  onChange,
  multiple = false,
  accept = '*/*',
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setUploading(true)
    try {
      const config = {
        tableId,
        tableName,
        recordId,
        columnId,
        columnName,
      }

      const uploadedFiles = await tableFileHandler.uploadFiles(files, config)
      
      if (multiple) {
        onChange([...value, ...uploadedFiles])
      } else {
        onChange(uploadedFiles)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Faili üleslaadimine ebaõnnestus')
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  const handleRemove = async (fileId: string) => {
    try {
      await tableFileHandler.deleteFile(fileId)
      onChange(value.filter((f) => f.id !== fileId))
    } catch (error) {
      console.error('Delete error:', error)
      alert('Faili kustutamine ebaõnnestus')
    }
  }

  return (
    <div className="space-y-2">
      {/* File List */}
      {value.length > 0 && (
        <div className="space-y-1">
          {value.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200"
            >
              <File className="w-4 h-4 text-slate-600" />
              <span className="flex-1 text-sm truncate">{file.name}</span>
              <span className="text-xs text-slate-500">
                {formatFileSize(file.size)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleRemove(file.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      <div>
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Laadin üles...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              {value.length > 0 ? 'Lisa veel' : 'Lae fail üles'}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}
```

### 3. Update DynamicCell for File Types

```typescript
// /apps/web/src/components/shared/ultra-table/DynamicCell.tsx
// Lisa file handling

import { FileUpload } from '@/components/admin/ultra-tables/FileUpload'

export function DynamicCell({ type, value, config, onChange, metadata }: any) {
  // ... existing code ...

  // File types
  if (type === 'file') {
    return (
      <FileUpload
        tableId={metadata.tableId}
        tableName={metadata.tableName}
        recordId={metadata.recordId}
        columnId={metadata.columnId}
        columnName={metadata.columnName}
        value={value ? [value] : []}
        onChange={(files) => onChange(files[0] || null)}
        multiple={false}
        accept="*/*"
      />
    )
  }

  if (type === 'files') {
    return (
      <FileUpload
        tableId={metadata.tableId}
        tableName={metadata.tableName}
        recordId={metadata.recordId}
        columnId={metadata.columnId}
        columnName={metadata.columnName}
        value={value || []}
        onChange={onChange}
        multiple={true}
        accept="*/*"
      />
    )
  }

  if (type === 'image') {
    return (
      <FileUpload
        tableId={metadata.tableId}
        tableName={metadata.tableName}
        recordId={metadata.recordId}
        columnId={metadata.columnId}
        columnName={metadata.columnName}
        value={value ? [value] : []}
        onChange={(files) => onChange(files[0] || null)}
        multiple={false}
        accept="image/*"
      />
    )
  }

  if (type === 'images') {
    return (
      <FileUpload
        tableId={metadata.tableId}
        tableName={metadata.tableName}
        recordId={metadata.recordId}
        columnId={metadata.columnId}
        columnName={metadata.columnName}
        value={value || []}
        onChange={onChange}
        multiple={true}
        accept="image/*"
      />
    )
  }

  // ... rest of types ...
}
```

### 4. Update VirtualTable to Pass Metadata

```typescript
// /apps/web/src/components/admin/ultra-tables/VirtualTable.tsx
// Update Row callback

const Row = useCallback(
  ({ index, style }: any) => {
    // ... existing code ...

    return (
      <div style={style} className="...">
        {columns.map((column) => (
          <div key={column.id} className="...">
            <DynamicCell
              type={column.type}
              value={record.data?.[column.id]}
              config={column.config || {}}
              metadata={{
                tableId: tableId,
                tableName: tableName,
                recordId: record.id,
                columnId: column.id,
                columnName: column.name,
              }}
              onChange={(value) => {
                onRecordUpdate(record.id, {
                  ...record.data,
                  [column.id]: value,
                })
              }}
            />
          </div>
        ))}
      </div>
    )
  },
  [columns, records, tableId, tableName]
)
```

### 5. Cleanup on Record Delete

```typescript
// /apps/web/src/app/api/ultra-tables/[id]/records/[recordId]/route.ts

import { tableFileHandler } from '@/lib/ultra-tables/file-handler'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; recordId: string } }
) {
  const supabase = createClient()

  // Delete all files associated with this record
  await tableFileHandler.deleteRecordFiles(params.id, params.recordId)

  // Delete record
  const { error } = await supabase
    .from('ultra_records')
    .delete()
    .eq('id', params.recordId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

### 6. Storage Bucket Setup

```sql
-- /supabase/migrations/007_table_files_storage.sql

-- Create storage bucket for table files
INSERT INTO storage.buckets (id, name, public)
VALUES ('table-files', 'table-files', true);

-- RLS policies for table-files bucket
CREATE POLICY "Users can upload table files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'table-files' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can view table files in their tenant"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'table-files' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Users can delete table files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'table-files' AND
    auth.role() = 'authenticated'
  );
```

### 7. File Vault Schema Update

```sql
-- Add metadata column to file_vault_files if not exists
ALTER TABLE file_vault_files 
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Index for table file queries
CREATE INDEX IF NOT EXISTS idx_file_vault_files_table_metadata 
ON file_vault_files USING gin(metadata);

-- Function to clean up empty folders
CREATE OR REPLACE FUNCTION cleanup_empty_table_folders()
RETURNS void AS $$
BEGIN
  DELETE FROM file_vault_folders
  WHERE parent_id IN (
    SELECT id FROM file_vault_folders
    WHERE name = 'TABELITE failid'
  )
  AND NOT EXISTS (
    SELECT 1 FROM file_vault_files
    WHERE folder_id = file_vault_folders.id
  )
  AND NOT EXISTS (
    SELECT 1 FROM file_vault_folders f2
    WHERE f2.parent_id = file_vault_folders.id
  );
END;
$$ LANGUAGE plpgsql;
```

## 📋 FILE VAULT UI UPDATE

Update File Vault UI to show table file metadata:

```typescript
// /apps/web/src/app/(dashboard)/file-vault/page.tsx

// Add badge to show table files
{file.metadata?.table_name && (
  <Badge variant="secondary" className="text-xs">
    📊 {file.metadata.table_name}
  </Badge>
)}

// Add link to open record
{file.metadata?.record_id && (
  <Button
    variant="link"
    size="sm"
    onClick={() => {
      router.push(
        `/admin/ultra-tables/${file.metadata.table_id}?record=${file.metadata.record_id}`
      )
    }}
  >
    Ava tabelis
  </Button>
)}
```

## ✅ FEATURES

### Automaatne Kaustade Loomine
✅ Root: "TABELITE failid"  
✅ Tabel: "TABELITE failid/Kliendid"  
✅ Rida: "TABELITE failid/Kliendid/uuid"  

### File Types Tugi
✅ file - üksik fail  
✅ files - mitu faili  
✅ image - üks pilt  
✅ images - mitu pilti  
✅ video - video fail  
✅ audio - audio fail  
✅ attachment - üldine manus  

### Failide Haldus
✅ Upload File Vault'i  
✅ Nähtav File Vault UI's  
✅ Metadata säilitamine (tabel, veerg, rida)  
✅ Automaatne kustutamine rea kustutamisel  
✅ Link tagasi tabelisse  

### Performance
✅ Paralleelne upload (Promise.all)  
✅ Progress indicator  
✅ Error handling  
✅ Storage cleanup on failure  

## 🧪 TESTIMINE

### Test 1: File Upload
1. Loo tabel "Kliendid"
2. Lisa veerg "Dokumendid" (type: files)
3. Lisa rida ja lae üles 3 faili
4. ✅ Failid ilmuvad File Vault'is: TABELITE failid/Kliendid/[uuid]/

### Test 2: File Vault Integration
1. Mine File Vault'i
2. Ava "TABELITE failid" kaust
3. ✅ Näed kõiki tabelite faile kaustade struktuuris

### Test 3: Record Delete
1. Kustuta rida tabelis
2. Kontrolli File Vault'i
3. ✅ Rea failid on kustutatud

### Test 4: Multiple Tables
1. Loo 2 tabelit media veergudega
2. Lae mõlemasse faile
3. ✅ Failid on eraldi kaustades

## 🚀 DEPENDENCIES

```json
{
  "dependencies": {
    "react-window": "^1.8.10",
    "react-window-infinite-loader": "^1.0.9"
  }
}
```

## 📝 CHECKLIST

- [ ] TableFileHandler klass loodud
- [ ] FileUpload komponent loodud
- [ ] DynamicCell uuendatud media tüüpidele
- [ ] VirtualTable edastab metadata
- [ ] Record DELETE cleanup
- [ ] Storage bucket seadistatud
- [ ] File Vault schema uuendatud
- [ ] File Vault UI uuendatud
- [ ] Testitud kõik media tüübid

---

**See integratsioon teeb Ultra Tables ja File Vault süsteemid täielikult ühilduvaks!** 🎉
