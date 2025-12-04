/**
 * FILE VAULT - Complete Chunked Upload API
 * POST /api/file-vault/upload-session/[id]/complete - Merge chunks and create file
 */

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import {
  FILE_VAULT_BUCKET,
  generateStorageKey,
  getFileExtension,
} from '@/lib/file-vault/storage/file-storage'
import {
  generateAllThumbnails,
  getImageDimensions,
} from '@/lib/file-vault/storage/thumbnail-generator'

export const dynamic = 'force-dynamic'
export const maxDuration = 300 // Allow up to 5 minutes for merging large files

// POST /api/file-vault/upload-session/[id]/complete - Merge chunks
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const sessionId = params.id

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get upload session
    const { data: session, error: sessionError } = await supabase
      .from('file_upload_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Upload session not found' }, { status: 404 })
    }

    // Verify all chunks are uploaded
    if (session.uploaded_chunks !== session.total_chunks) {
      return NextResponse.json(
        {
          error: 'Not all chunks uploaded',
          uploadedChunks: session.uploaded_chunks,
          totalChunks: session.total_chunks,
        },
        { status: 400 }
      )
    }

    // Check if already processing or completed
    if (session.status === 'completed') {
      return NextResponse.json({ error: 'Upload already completed' }, { status: 400 })
    }

    // Update status to processing
    await supabaseAdmin
      .from('file_upload_sessions')
      .update({ status: 'processing' })
      .eq('id', sessionId)

    try {
      // Download and merge all chunks
      const chunkKeys = session.chunk_keys || []
      const chunks: Buffer[] = []

      for (let i = 0; i < chunkKeys.length; i++) {
        const chunkKey = chunkKeys[i]
        if (!chunkKey) {
          throw new Error(`Missing chunk ${i}`)
        }

        const { data: chunkData, error: downloadError } = await supabaseAdmin.storage
          .from(FILE_VAULT_BUCKET)
          .download(chunkKey)

        if (downloadError || !chunkData) {
          throw new Error(`Failed to download chunk ${i}: ${downloadError?.message}`)
        }

        chunks.push(Buffer.from(await chunkData.arrayBuffer()))
      }

      // Merge chunks
      const mergedBuffer = Buffer.concat(chunks)

      // Verify size
      if (mergedBuffer.length !== session.file_size) {
        throw new Error(`Size mismatch: expected ${session.file_size}, got ${mergedBuffer.length}`)
      }

      // Verify checksum if provided
      if (session.expected_checksum) {
        const actualChecksum = crypto.createHash('sha256').update(mergedBuffer).digest('hex')
        if (actualChecksum !== session.expected_checksum) {
          throw new Error('Checksum verification failed')
        }
      }

      // Generate storage key
      const storageKey = generateStorageKey(session.vault_id, session.folder_id, session.file_name)
      const extension = getFileExtension(session.file_name)

      // Calculate checksums
      const checksumMd5 = crypto.createHash('md5').update(mergedBuffer).digest('hex')
      const checksumSha256 = crypto.createHash('sha256').update(mergedBuffer).digest('hex')

      // Upload merged file
      const { error: uploadError } = await supabaseAdmin.storage
        .from(FILE_VAULT_BUCKET)
        .upload(storageKey, mergedBuffer, {
          contentType: session.mime_type,
          upsert: false,
        })

      if (uploadError) {
        throw new Error(`Failed to upload merged file: ${uploadError.message}`)
      }

      // Generate thumbnails for images
      let thumbnailSmall: string | null = null
      let thumbnailMedium: string | null = null
      let thumbnailLarge: string | null = null
      let width: number | null = null
      let height: number | null = null

      if (session.mime_type.startsWith('image/')) {
        try {
          const dimensions = await getImageDimensions(mergedBuffer)
          if (dimensions) {
            width = dimensions.width
            height = dimensions.height
          }

          const storageKeyBase = storageKey.replace(/\.[^/.]+$/, '')
          const thumbnails = await generateAllThumbnails(mergedBuffer, storageKeyBase)
          thumbnailSmall = thumbnails.small
          thumbnailMedium = thumbnails.medium
          thumbnailLarge = thumbnails.large
        } catch (thumbError) {
          console.error('Error generating thumbnails:', thumbError)
        }
      }

      // Get folder path
      let folderPath = ''
      if (session.folder_id) {
        const { data: folder } = await supabaseAdmin
          .from('file_folders')
          .select('path')
          .eq('id', session.folder_id)
          .single()
        folderPath = folder?.path || ''
      }
      const filePath = `${folderPath}/${session.file_name}`.replace(/^\/+/, '/')

      // Generate slug
      const slug = session.file_name
        .replace(/\.[^/.]+$/, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 100)

      // Create file record
      const { data: fileRecord, error: insertError } = await supabaseAdmin
        .from('files')
        .insert({
          vault_id: session.vault_id,
          folder_id: session.folder_id,
          name: session.file_name,
          original_name: session.file_name,
          slug,
          path: filePath,
          storage_provider: 'supabase',
          storage_bucket: FILE_VAULT_BUCKET,
          storage_key: storageKey,
          mime_type: session.mime_type,
          size_bytes: session.file_size,
          extension,
          checksum_md5: checksumMd5,
          checksum_sha256: checksumSha256,
          width,
          height,
          thumbnail_small: thumbnailSmall,
          thumbnail_medium: thumbnailMedium,
          thumbnail_large: thumbnailLarge,
          metadata: session.metadata || {},
          processing_status: 'completed',
          processed_at: new Date().toISOString(),
          owner_id: user.id,
        })
        .select()
        .single()

      if (insertError) {
        // Cleanup uploaded file
        await supabaseAdmin.storage.from(FILE_VAULT_BUCKET).remove([storageKey])
        throw new Error(`Failed to create file record: ${insertError.message}`)
      }

      // Clean up chunk files
      const deleteChunks = chunkKeys.filter(Boolean)
      if (deleteChunks.length > 0) {
        await supabaseAdmin.storage.from(FILE_VAULT_BUCKET).remove(deleteChunks)
      }

      // Update session as completed
      await supabaseAdmin
        .from('file_upload_sessions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString(),
        })
        .eq('id', sessionId)

      // Log activity
      await supabaseAdmin.from('file_activities').insert({
        vault_id: session.vault_id,
        file_id: fileRecord.id,
        action: 'upload',
        user_id: user.id,
        user_email: user.email,
        bytes_transferred: session.file_size,
        details: {
          chunkedUpload: true,
          totalChunks: session.total_chunks,
          fileName: session.file_name,
        },
      })

      return NextResponse.json({
        success: true,
        file: {
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
        },
      })

    } catch (processError) {
      // Update session as failed
      const errorMessage = processError instanceof Error ? processError.message : 'Unknown error'
      await supabaseAdmin
        .from('file_upload_sessions')
        .update({
          status: 'failed',
          error_message: errorMessage,
        })
        .eq('id', sessionId)

      console.error('Error completing upload:', processError)
      return NextResponse.json({ error: errorMessage }, { status: 500 })
    }

  } catch (error) {
    console.error('Error in POST /api/file-vault/upload-session/[id]/complete:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
