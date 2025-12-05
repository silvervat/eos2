/**
 * FILE VAULT - Upload API Route
 * POST /api/file-vault/upload - Upload file to storage
 */

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import {
  generateStorageKey,
  calculateMd5,
  calculateSha256,
  detectMimeType,
  getFileExtension,
  uploadFileToStorage,
  isImage,
  FILE_VAULT_BUCKET,
  MAX_FILE_SIZE,
} from '@/lib/file-vault/storage/file-storage'
import {
  generateAllThumbnails,
  getImageDimensions,
} from '@/lib/file-vault/storage/thumbnail-generator'
import {
  trackPerformance,
  getRequestMetadata,
} from '@/lib/file-vault/performance-logger'

export const maxDuration = 60 // Allow up to 60 seconds for large file uploads
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  // Start performance tracking
  const { ipAddress, userAgent } = getRequestMetadata(request)
  const tracker = trackPerformance({
    action: 'upload',
    operationType: 'file_upload',
    ipAddress,
    userAgent,
  })

  try {
    const supabase = createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile and tenant
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, tenant_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 })
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const vaultId = formData.get('vaultId') as string | null
    const folderId = formData.get('folderId') as string | null
    const customMetadata = formData.get('metadata') as string | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!vaultId) {
      return NextResponse.json({ error: 'Vault ID is required' }, { status: 400 })
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds maximum allowed (${MAX_FILE_SIZE / 1024 / 1024 / 1024}GB)` },
        { status: 400 }
      )
    }

    // Verify vault exists and user has access
    const { data: vault, error: vaultError } = await supabase
      .from('file_vaults')
      .select('id, tenant_id, quota_bytes, used_bytes')
      .eq('id', vaultId)
      .eq('tenant_id', profile.tenant_id)
      .is('deleted_at', null)
      .single()

    if (vaultError || !vault) {
      return NextResponse.json({ error: 'Vault not found or access denied' }, { status: 404 })
    }

    // Check storage quota
    const newUsedBytes = BigInt(vault.used_bytes) + BigInt(file.size)
    if (newUsedBytes > BigInt(vault.quota_bytes)) {
      return NextResponse.json(
        { error: 'Storage quota exceeded' },
        { status: 400 }
      )
    }

    // Read file buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Detect MIME type and validate
    const mimeType = detectMimeType(buffer, file.name)
    const extension = getFileExtension(file.name)

    // Generate storage key and checksums
    const storageKey = generateStorageKey(vaultId, folderId, file.name)
    const checksumMd5 = calculateMd5(buffer)
    const checksumSha256 = calculateSha256(buffer)

    // Build file path
    const folderPath = folderId ? await getFolderPath(vaultId, folderId) : ''
    const filePath = `${folderPath}/${file.name}`.replace(/^\/+/, '/')

    // Check for duplicate files (same checksum)
    const { data: existingFile } = await supabase
      .from('files')
      .select('id, name')
      .eq('vault_id', vaultId)
      .eq('checksum_md5', checksumMd5)
      .is('deleted_at', null)
      .maybeSingle()

    if (existingFile) {
      return NextResponse.json(
        {
          error: 'Duplicate file',
          existingFile: { id: existingFile.id, name: existingFile.name }
        },
        { status: 409 }
      )
    }

    // Upload file to storage
    const { path: storagePath, publicUrl } = await uploadFileToStorage(
      buffer,
      storageKey,
      mimeType
    )

    // Generate thumbnails for images
    let thumbnailSmall: string | null = null
    let thumbnailMedium: string | null = null
    let thumbnailLarge: string | null = null
    let width: number | null = null
    let height: number | null = null

    if (isImage(mimeType)) {
      const dimensions = await getImageDimensions(buffer)
      if (dimensions) {
        width = dimensions.width
        height = dimensions.height
      }

      const storageKeyBase = storageKey.replace(/\.[^/.]+$/, '')
      const thumbnails = await generateAllThumbnails(buffer, storageKeyBase)
      thumbnailSmall = thumbnails.small
      thumbnailMedium = thumbnails.medium
      thumbnailLarge = thumbnails.large
    }

    // Parse custom metadata
    let metadata = {}
    if (customMetadata) {
      try {
        metadata = JSON.parse(customMetadata)
      } catch {
        console.warn('Failed to parse custom metadata')
      }
    }

    // Create file record in database
    const { data: fileRecord, error: insertError } = await supabaseAdmin
      .from('files')
      .insert({
        vault_id: vaultId,
        folder_id: folderId || null,
        name: file.name,
        path: filePath,
        storage_provider: 'supabase',
        storage_bucket: FILE_VAULT_BUCKET,
        storage_path: storagePath,
        storage_key: storageKey,
        mime_type: mimeType,
        size_bytes: file.size,
        extension,
        checksum_md5: checksumMd5,
        checksum_sha256: checksumSha256,
        width,
        height,
        thumbnail_small: thumbnailSmall,
        thumbnail_medium: thumbnailMedium,
        thumbnail_large: thumbnailLarge,
        metadata,
        owner_id: user.id,
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      // Clean up uploaded file on error
      await supabaseAdmin.storage
        .from(FILE_VAULT_BUCKET)
        .remove([storageKey])

      console.error('Error creating file record:', insertError)
      return NextResponse.json({ error: 'Failed to create file record' }, { status: 500 })
    }

    // Update vault used bytes
    await supabaseAdmin
      .from('file_vaults')
      .update({ used_bytes: newUsedBytes.toString() })
      .eq('id', vaultId)

    // Log file access with performance data
    await tracker.finish({
      fileId: fileRecord.id,
      vaultId,
      tenantId: profile.tenant_id,
      userId: user.id,
      bytesTransferred: file.size,
      fileSizeBytes: file.size,
      mimeType,
    })

    return NextResponse.json({
      id: fileRecord.id,
      name: fileRecord.name,
      path: fileRecord.path,
      mimeType: fileRecord.mime_type,
      sizeBytes: fileRecord.size_bytes,
      thumbnailSmall,
      thumbnailMedium,
      thumbnailLarge,
      width,
      height,
    }, { status: 201 })

  } catch (error) {
    // Log error with performance data
    await tracker.error((error as Error).message)
    console.error('Error in POST /api/file-vault/upload:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * Get full path for a folder
 */
async function getFolderPath(vaultId: string, folderId: string): Promise<string> {
  const { data: folder } = await supabaseAdmin
    .from('file_folders')
    .select('path')
    .eq('id', folderId)
    .eq('vault_id', vaultId)
    .single()

  return folder?.path || ''
}
