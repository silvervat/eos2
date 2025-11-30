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
    const rootFolder = await this.findOrCreateFolder('TABELITE failid', null)

    // Table folder: "TABELITE failid/Kliendid"
    const tableFolder = await this.findOrCreateFolder(tableName, rootFolder.id)

    // Record folder: "TABELITE failid/Kliendid/uuid"
    const recordFolder = await this.findOrCreateFolder(recordId, tableFolder.id)

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
    let query = this.supabase
      .from('file_vault_folders')
      .select('id, name')
      .eq('name', name)

    if (parentId) {
      query = query.eq('parent_id', parentId)
    } else {
      query = query.is('parent_id', null)
    }

    const { data: existing } = await query.single()

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
  async uploadFile(file: File, config: UploadConfig): Promise<any> {
    // Get or create folder
    const folderId = await this.getRecordFolder(config)

    // Generate unique filename
    const timestamp = Date.now()
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
  async uploadFiles(files: File[], config: UploadConfig): Promise<any[]> {
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
    await this.supabase.from('file_vault_files').delete().eq('id', fileId)
  }

  /**
   * Delete all files for a record
   */
  async deleteRecordFiles(tableId: string, recordId: string): Promise<void> {
    // Get all files for this record
    const { data: files } = await this.supabase
      .from('file_vault_files')
      .select('id, file_path')
      .contains('metadata', { table_id: tableId, record_id: recordId })

    if (!files || files.length === 0) return

    // Delete from storage
    const paths = files.map((f) => f.file_path)
    await this.supabase.storage.from('table-files').remove(paths)

    // Delete from File Vault
    const fileIds = files.map((f) => f.id)
    await this.supabase.from('file_vault_files').delete().in('id', fileIds)
  }

  /**
   * Get files for a record
   */
  async getRecordFiles(tableId: string, recordId: string): Promise<any[]> {
    const { data: files } = await this.supabase
      .from('file_vault_files')
      .select('*')
      .contains('metadata', { table_id: tableId, record_id: recordId })
      .order('created_at', { ascending: false })

    return files || []
  }
}

export const tableFileHandler = new TableFileHandler()
