/**
 * FILE VAULT - Single File API Route
 * GET /api/file-vault/files/[id] - Get single file
 * PATCH /api/file-vault/files/[id] - Update file metadata
 * DELETE /api/file-vault/files/[id] - Soft delete file
 */

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { deleteFileFromStorage, FILE_VAULT_BUCKET } from '@/lib/file-vault/storage/file-storage'
import { deleteThumbnails } from '@/lib/file-vault/storage/thumbnail-generator'
import {
  trackPerformance,
  getRequestMetadata,
} from '@/lib/file-vault/performance-logger'

export const dynamic = 'force-dynamic'

// GET /api/file-vault/files/[id] - Get single file with details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Start performance tracking
  const { ipAddress, userAgent } = getRequestMetadata(request)
  const tracker = trackPerformance({
    action: 'view',
    operationType: 'file_view',
    ipAddress,
    userAgent,
  })

  try {
    const supabase = createClient()
    const fileId = params.id

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

    // Get file with vault verification
    const { data: file, error } = await supabase
      .from('files')
      .select(`
        *,
        vault:file_vaults!vault_id(id, tenant_id, name),
        folder:file_folders!folder_id(id, name, path),
        tags:file_tags(id, tag),
        accesses:file_accesses(id, action, created_at, user_id)
      `)
      .eq('id', fileId)
      .is('deleted_at', null)
      .single()

    if (error || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Verify tenant access
    if (file.vault?.tenant_id !== profile.tenant_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Log view access with performance data (non-blocking)
    tracker.finish({
      fileId,
      vaultId: file.vault_id,
      tenantId: profile.tenant_id,
      userId: user.id,
      fileSizeBytes: file.size_bytes,
      mimeType: file.mime_type,
    }).catch(err => console.warn('Performance log error:', err))

    // Transform response
    return NextResponse.json({
      id: file.id,
      name: file.name,
      path: file.path,
      mimeType: file.mime_type,
      sizeBytes: file.size_bytes,
      extension: file.extension,
      width: file.width,
      height: file.height,
      duration: file.duration,
      exifData: file.exif_data,
      cameraMake: file.camera_make,
      cameraModel: file.camera_model,
      lens: file.lens,
      iso: file.iso,
      aperture: file.aperture,
      shutterSpeed: file.shutter_speed,
      focalLength: file.focal_length,
      takenAt: file.taken_at,
      gpsLatitude: file.gps_latitude,
      gpsLongitude: file.gps_longitude,
      gpsLocation: file.gps_location,
      thumbnailSmall: file.thumbnail_small,
      thumbnailMedium: file.thumbnail_medium,
      thumbnailLarge: file.thumbnail_large,
      metadata: file.metadata,
      version: file.version,
      isPublic: file.is_public,
      ownerId: file.owner_id,
      checksumMd5: file.checksum_md5,
      extractedText: file.extracted_text,
      createdAt: file.created_at,
      updatedAt: file.updated_at,
      vault: file.vault ? { id: file.vault.id, name: file.vault.name } : null,
      folder: file.folder,
      tags: file.tags?.map((t: { tag: string }) => t.tag) || [],
      recentAccesses: file.accesses?.slice(0, 10) || [],
    })
  } catch (error) {
    // Log error with performance data
    await tracker.error((error as Error).message)
    console.error('Error in GET /api/file-vault/files/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PATCH /api/file-vault/files/[id] - Update file metadata
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const fileId = params.id

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

    // Get existing file
    const { data: existingFile, error: fetchError } = await supabase
      .from('files')
      .select('*, vault:file_vaults!vault_id(tenant_id)')
      .eq('id', fileId)
      .is('deleted_at', null)
      .single()

    if (fetchError || !existingFile) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Verify tenant access
    if (existingFile.vault?.tenant_id !== profile.tenant_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()

    // Allowed update fields
    const allowedFields = [
      'name',
      'folder_id',
      'is_public',
      'metadata',
      'mime_type',
    ]

    const updates: Record<string, unknown> = {
      updated_by: user.id,
    }

    // Build update object
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        // Handle camelCase to snake_case conversion
        if (field === 'folderId') {
          updates['folder_id'] = body.folderId
        } else if (field === 'isPublic') {
          updates['is_public'] = body.isPublic
        } else {
          updates[field] = body[field]
        }
      }
    }

    // Also accept camelCase versions
    if (body.mimeType !== undefined) {
      updates['mime_type'] = body.mimeType
    }
    if (body.folderId !== undefined) {
      updates['folder_id'] = body.folderId
    }
    if (body.isPublic !== undefined) {
      updates['is_public'] = body.isPublic
    }

    // Handle name change - update path
    if (body.name && body.name !== existingFile.name) {
      updates['name'] = body.name
      const pathParts = existingFile.path.split('/')
      pathParts[pathParts.length - 1] = body.name
      updates['path'] = pathParts.join('/')
    }

    // Update file
    const { data: updatedFile, error: updateError } = await supabaseAdmin
      .from('files')
      .update(updates)
      .eq('id', fileId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating file:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // Handle tags update
    if (body.tags !== undefined) {
      // Delete existing tags
      await supabaseAdmin
        .from('file_tags')
        .delete()
        .eq('file_id', fileId)

      // Insert new tags
      if (body.tags.length > 0) {
        await supabaseAdmin.from('file_tags').insert(
          body.tags.map((tag: string) => ({
            file_id: fileId,
            tag: tag.trim().toLowerCase(),
          }))
        )
      }
    }

    return NextResponse.json({
      id: updatedFile.id,
      name: updatedFile.name,
      path: updatedFile.path,
      isPublic: updatedFile.is_public,
      metadata: updatedFile.metadata,
      updatedAt: updatedFile.updated_at,
    })
  } catch (error) {
    console.error('Error in PATCH /api/file-vault/files/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/file-vault/files/[id] - Soft delete file
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Start performance tracking
  const { ipAddress, userAgent } = getRequestMetadata(request)
  const tracker = trackPerformance({
    action: 'delete',
    operationType: 'file_delete',
    ipAddress,
    userAgent,
  })

  try {
    const supabase = createClient()
    const fileId = params.id

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

    // Check for permanent delete flag
    const { searchParams } = new URL(request.url)
    const permanent = searchParams.get('permanent') === 'true'

    // Get existing file
    const { data: existingFile, error: fetchError } = await supabase
      .from('files')
      .select('*, vault:file_vaults!vault_id(id, tenant_id, used_bytes)')
      .eq('id', fileId)
      .is('deleted_at', null)
      .single()

    if (fetchError || !existingFile) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Verify tenant access
    if (existingFile.vault?.tenant_id !== profile.tenant_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (permanent) {
      // Permanent delete - remove from storage and database
      try {
        // Delete from storage
        await deleteFileFromStorage(existingFile.storage_key)

        // Delete thumbnails if they exist
        if (existingFile.thumbnail_small || existingFile.thumbnail_medium || existingFile.thumbnail_large) {
          const storageKeyBase = existingFile.storage_key.replace(/\.[^/.]+$/, '')
          await deleteThumbnails(storageKeyBase)
        }
      } catch (storageError) {
        console.error('Error deleting from storage:', storageError)
        // Continue with database deletion even if storage fails
      }

      // Delete from database
      const { error: deleteError } = await supabaseAdmin
        .from('files')
        .delete()
        .eq('id', fileId)

      if (deleteError) {
        console.error('Error deleting file:', deleteError)
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }

      // Update vault used bytes
      const newUsedBytes = BigInt(existingFile.vault.used_bytes) - BigInt(existingFile.size_bytes)
      await supabaseAdmin
        .from('file_vaults')
        .update({ used_bytes: Math.max(0, Number(newUsedBytes)).toString() })
        .eq('id', existingFile.vault.id)

    } else {
      // Soft delete
      const { error: updateError } = await supabaseAdmin
        .from('files')
        .update({
          deleted_at: new Date().toISOString(),
          deleted_by: user.id,
        })
        .eq('id', fileId)

      if (updateError) {
        console.error('Error soft deleting file:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    }

    // Log delete access with performance data (non-blocking)
    tracker.finish({
      fileId,
      vaultId: existingFile.vault_id,
      tenantId: profile.tenant_id,
      userId: user.id,
      fileSizeBytes: existingFile.size_bytes,
      mimeType: existingFile.mime_type,
      details: { permanent },
    }).catch(err => console.warn('Performance log error:', err))

    return NextResponse.json({ success: true, permanent })
  } catch (error) {
    // Log error with performance data
    await tracker.error((error as Error).message)
    console.error('Error in DELETE /api/file-vault/files/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
