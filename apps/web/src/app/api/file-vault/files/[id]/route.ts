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

export const dynamic = 'force-dynamic'

// GET /api/file-vault/files/[id] - Get single file with details
export async function GET(
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

    // Get file with vault verification
    const { data: file, error } = await supabase
      .from('files')
      .select(`
        *,
        vault:file_vaults!vault_id(id, tenant_id, name),
        folder:file_folders!folder_id(id, name, path)
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

    // Log view activity
    await supabaseAdmin.from('file_activities').insert({
      vault_id: file.vault_id,
      file_id: fileId,
      action: 'view',
      user_id: user.id,
      user_email: user.email,
      ip_address: request.headers.get('x-forwarded-for') || null,
      user_agent: request.headers.get('user-agent'),
    })

    // Transform response
    return NextResponse.json({
      id: file.id,
      name: file.name,
      originalName: file.original_name,
      path: file.path,
      slug: file.slug,
      mimeType: file.mime_type,
      sizeBytes: file.size_bytes,
      extension: file.extension,
      category: file.category,
      width: file.width,
      height: file.height,
      durationSeconds: file.duration_seconds,
      storageKey: file.storage_key,
      thumbnailSmall: file.thumbnail_small,
      thumbnailMedium: file.thumbnail_medium,
      thumbnailLarge: file.thumbnail_large,
      processingStatus: file.processing_status,
      previewUrl: file.preview_url,
      metadata: file.metadata,
      tags: file.tags || [],
      searchableText: file.searchable_text,
      version: file.version,
      isLatest: file.is_latest,
      isPublic: file.is_public,
      isStarred: file.is_starred,
      isPinned: file.is_pinned,
      isTrashed: file.is_trashed,
      trashedAt: file.trashed_at,
      ownerId: file.owner_id,
      checksumMd5: file.checksum_md5,
      checksumSha256: file.checksum_sha256,
      createdAt: file.created_at,
      updatedAt: file.updated_at,
      vault: file.vault ? { id: file.vault.id, name: file.vault.name } : null,
      folder: file.folder,
    })
  } catch (error) {
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

    // Build update object
    const updates: Record<string, unknown> = {}

    // Handle name change - update path and slug
    if (body.name !== undefined && body.name !== existingFile.name) {
      updates['name'] = body.name
      const pathParts = existingFile.path.split('/')
      pathParts[pathParts.length - 1] = body.name
      updates['path'] = pathParts.join('/')
      updates['slug'] = body.name
        .replace(/\.[^/.]+$/, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .substring(0, 100)
    }

    // Handle folder change
    if (body.folderId !== undefined) {
      updates['folder_id'] = body.folderId || null
    }

    // Handle public status
    if (body.isPublic !== undefined) {
      updates['is_public'] = body.isPublic
    }

    // Handle starred status
    if (body.isStarred !== undefined) {
      updates['is_starred'] = body.isStarred
    }

    // Handle pinned status
    if (body.isPinned !== undefined) {
      updates['is_pinned'] = body.isPinned
    }

    // Handle metadata
    if (body.metadata !== undefined) {
      updates['metadata'] = body.metadata
    }

    // Handle tags (now stored directly in files table as array)
    if (body.tags !== undefined) {
      updates['tags'] = body.tags.map((tag: string) => tag.trim().toLowerCase())
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

    return NextResponse.json({
      id: updatedFile.id,
      name: updatedFile.name,
      path: updatedFile.path,
      slug: updatedFile.slug,
      isPublic: updatedFile.is_public,
      isStarred: updatedFile.is_starred,
      isPinned: updatedFile.is_pinned,
      metadata: updatedFile.metadata,
      tags: updatedFile.tags || [],
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
      // Soft delete (move to trash)
      const { error: updateError } = await supabaseAdmin
        .from('files')
        .update({
          is_trashed: true,
          trashed_at: new Date().toISOString(),
        })
        .eq('id', fileId)

      if (updateError) {
        console.error('Error soft deleting file:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    }

    // Log delete activity
    await supabaseAdmin.from('file_activities').insert({
      vault_id: existingFile.vault.id,
      file_id: fileId,
      action: permanent ? 'delete' : 'trash',
      user_id: user.id,
      user_email: user.email,
      ip_address: request.headers.get('x-forwarded-for') || null,
      user_agent: request.headers.get('user-agent'),
      details: { permanent, fileName: existingFile.name },
    })

    return NextResponse.json({ success: true, permanent })
  } catch (error) {
    console.error('Error in DELETE /api/file-vault/files/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
