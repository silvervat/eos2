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
import crypto from 'crypto'
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

    // Parse form data first (can start while auth happens)
    const formDataPromise = request.formData()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get form data (already started above)
    const formData = await formDataPromise
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

    // Parallel fetch: profile + vault validation
    const [profileResult, vaultResult] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('id, tenant_id')
        .eq('auth_user_id', user.id)
        .single(),
      supabase
        .from('file_vaults')
        .select('id, tenant_id, quota_bytes, used_bytes')
        .eq('id', vaultId)
        .is('deleted_at', null)
        .single(),
    ])

    const profile = profileResult.data
    const vault = vaultResult.data

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 })
    }

    // Verify vault belongs to user's tenant
    if (!vault || vault.tenant_id !== profile.tenant_id) {
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

    // Generate storage key and MD5 checksum (SHA256 calculated async later)
    const storageKey = generateStorageKey(vaultId, folderId, file.name)
    const checksumMd5 = calculateMd5(buffer)

    // Parallel: folder path lookup + duplicate check
    const [folderPath, duplicateResult] = await Promise.all([
      folderId ? getFolderPath(vaultId, folderId) : Promise.resolve(''),
      supabase
        .from('files')
        .select('id, name')
        .eq('vault_id', vaultId)
        .eq('checksum_md5', checksumMd5)
        .is('deleted_at', null)
        .maybeSingle(),
    ])

    // Build file path
    const filePath = `${folderPath}/${file.name}`.replace(/^\/+/, '/')

    // Check for duplicate files
    if (duplicateResult.data) {
      return NextResponse.json(
        {
          error: 'Duplicate file',
          existingFile: { id: duplicateResult.data.id, name: duplicateResult.data.name }
        },
        { status: 409 }
      )
    }

    // Parallel: upload file to storage + get image dimensions
    const isImageFile = isImage(mimeType)
    const [uploadResult, dimensions] = await Promise.all([
      uploadFileToStorage(buffer, storageKey, mimeType),
      isImageFile ? getImageDimensions(buffer) : Promise.resolve(null),
    ])

    const { path: storagePath, publicUrl } = uploadResult
    const width = dimensions?.width ?? null
    const height = dimensions?.height ?? null

    // Parse custom metadata
    let metadata = {}
    if (customMetadata) {
      try {
        metadata = JSON.parse(customMetadata)
      } catch {
        console.warn('Failed to parse custom metadata')
      }
    }

    // Create file record in database (thumbnails will be added async)
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
        width,
        height,
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

    // Log file access with performance data (non-blocking)
    tracker.finish({
      fileId: fileRecord.id,
      vaultId,
      tenantId: profile.tenant_id,
      userId: user.id,
      bytesTransferred: file.size,
      fileSizeBytes: file.size,
      mimeType,
    }).catch(err => console.warn('Performance log error:', err))

    // Generate thumbnails and SHA256 async (after response) - non-blocking
    if (isImageFile) {
      const storageKeyBase = storageKey.replace(/\.[^/.]+$/, '')
      const fileIdForUpdate = fileRecord.id

      // Fire-and-forget: generate thumbnails in background
      Promise.resolve().then(async () => {
        try {
          // Generate thumbnails in parallel
          const thumbnails = await generateAllThumbnails(buffer, storageKeyBase)

          // Update file record with thumbnail URLs
          await supabaseAdmin
            .from('files')
            .update({
              thumbnail_small: thumbnails.small,
              thumbnail_medium: thumbnails.medium,
              thumbnail_large: thumbnails.large,
            })
            .eq('id', fileIdForUpdate)
        } catch (err) {
          console.warn('Background thumbnail generation error:', err)
        }
      })
    }

    // Calculate SHA256 in background (non-blocking)
    const fileIdForSha = fileRecord.id
    Promise.resolve().then(async () => {
      try {
        const checksumSha256 = crypto.createHash('sha256').update(buffer).digest('hex')
        await supabaseAdmin
          .from('files')
          .update({ checksum_sha256: checksumSha256 })
          .eq('id', fileIdForSha)
      } catch (err) {
        console.warn('Background SHA256 calculation error:', err)
      }
    })

    return NextResponse.json({
      id: fileRecord.id,
      name: fileRecord.name,
      path: fileRecord.path,
      mimeType: fileRecord.mime_type,
      sizeBytes: fileRecord.size_bytes,
      thumbnailSmall: null, // Will be available after background generation
      thumbnailMedium: null,
      thumbnailLarge: null,
      width,
      height,
      processingThumbnails: isImageFile, // Indicator that thumbnails are being generated
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
