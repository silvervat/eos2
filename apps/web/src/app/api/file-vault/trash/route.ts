/**
 * FILE VAULT - Trash API Route
 * GET /api/file-vault/trash - List trashed files
 * POST /api/file-vault/trash/restore - Restore file from trash
 * DELETE /api/file-vault/trash/empty - Empty trash permanently
 */

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { deleteFileFromStorage } from '@/lib/file-vault/storage/file-storage'
import { deleteThumbnails } from '@/lib/file-vault/storage/thumbnail-generator'

export const dynamic = 'force-dynamic'

// GET /api/file-vault/trash - List trashed files
export async function GET(request: Request) {
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

    // Parse query params
    const { searchParams } = new URL(request.url)
    const vaultId = searchParams.get('vaultId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!vaultId) {
      return NextResponse.json({ error: 'Vault ID is required' }, { status: 400 })
    }

    // Verify vault access
    const { data: vault, error: vaultError } = await supabase
      .from('file_vaults')
      .select('id')
      .eq('id', vaultId)
      .eq('tenant_id', profile.tenant_id)
      .is('deleted_at', null)
      .single()

    if (vaultError || !vault) {
      return NextResponse.json({ error: 'Vault not found or access denied' }, { status: 404 })
    }

    // Get trashed files
    const { data: files, error, count } = await supabase
      .from('files')
      .select(`
        id,
        name,
        path,
        mime_type,
        size_bytes,
        extension,
        thumbnail_small,
        trashed_at,
        created_at,
        folder:file_folders!folder_id(id, name, path)
      `, { count: 'exact' })
      .eq('vault_id', vaultId)
      .eq('is_trashed', true)
      .is('deleted_at', null)
      .order('trashed_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching trashed files:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const transformedFiles = files?.map(file => ({
      id: file.id,
      name: file.name,
      path: file.path,
      mimeType: file.mime_type,
      sizeBytes: file.size_bytes,
      extension: file.extension,
      thumbnailSmall: file.thumbnail_small,
      trashedAt: file.trashed_at,
      createdAt: file.created_at,
      folder: file.folder,
    })) || []

    return NextResponse.json({
      files: transformedFiles,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0),
      },
    })

  } catch (error) {
    console.error('Error in GET /api/file-vault/trash:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/file-vault/trash - Restore files from trash
export async function POST(request: Request) {
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

    // Parse body
    const body = await request.json()
    const { fileIds, vaultId } = body

    if (!fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json({ error: 'File IDs required' }, { status: 400 })
    }

    if (!vaultId) {
      return NextResponse.json({ error: 'Vault ID required' }, { status: 400 })
    }

    // Verify vault access
    const { data: vault, error: vaultError } = await supabase
      .from('file_vaults')
      .select('id, tenant_id')
      .eq('id', vaultId)
      .eq('tenant_id', profile.tenant_id)
      .is('deleted_at', null)
      .single()

    if (vaultError || !vault) {
      return NextResponse.json({ error: 'Vault not found or access denied' }, { status: 404 })
    }

    // Restore files
    const { data: restoredFiles, error: restoreError } = await supabaseAdmin
      .from('files')
      .update({
        is_trashed: false,
        trashed_at: null,
      })
      .eq('vault_id', vaultId)
      .in('id', fileIds)
      .eq('is_trashed', true)
      .select('id, name')

    if (restoreError) {
      console.error('Error restoring files:', restoreError)
      return NextResponse.json({ error: restoreError.message }, { status: 500 })
    }

    // Log activity
    for (const file of restoredFiles || []) {
      await supabaseAdmin.from('file_activities').insert({
        vault_id: vaultId,
        file_id: file.id,
        action: 'restore',
        user_id: user.id,
        user_email: user.email,
        details: { fileName: file.name },
      })
    }

    return NextResponse.json({
      success: true,
      restoredCount: restoredFiles?.length || 0,
      restoredFiles: restoredFiles?.map(f => f.id) || [],
    })

  } catch (error) {
    console.error('Error in POST /api/file-vault/trash:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/file-vault/trash - Empty trash permanently
export async function DELETE(request: Request) {
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

    // Parse query params
    const { searchParams } = new URL(request.url)
    const vaultId = searchParams.get('vaultId')
    const fileIdsParam = searchParams.get('fileIds')

    if (!vaultId) {
      return NextResponse.json({ error: 'Vault ID required' }, { status: 400 })
    }

    // Verify vault access
    const { data: vault, error: vaultError } = await supabase
      .from('file_vaults')
      .select('id, tenant_id, used_bytes')
      .eq('id', vaultId)
      .eq('tenant_id', profile.tenant_id)
      .is('deleted_at', null)
      .single()

    if (vaultError || !vault) {
      return NextResponse.json({ error: 'Vault not found or access denied' }, { status: 404 })
    }

    // Build query for trashed files
    let query = supabaseAdmin
      .from('files')
      .select('id, name, storage_key, size_bytes, thumbnail_small, thumbnail_medium, thumbnail_large')
      .eq('vault_id', vaultId)
      .eq('is_trashed', true)
      .is('deleted_at', null)

    // If specific file IDs provided, only delete those
    if (fileIdsParam) {
      const fileIds = fileIdsParam.split(',')
      query = query.in('id', fileIds)
    }

    const { data: filesToDelete, error: fetchError } = await query

    if (fetchError) {
      console.error('Error fetching files to delete:', fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    if (!filesToDelete || filesToDelete.length === 0) {
      return NextResponse.json({
        success: true,
        deletedCount: 0,
        freedBytes: 0,
      })
    }

    let freedBytes = 0
    const deletedIds: string[] = []
    const errors: string[] = []

    // Delete each file
    for (const file of filesToDelete) {
      try {
        // Delete from storage
        if (file.storage_key) {
          await deleteFileFromStorage(file.storage_key)
        }

        // Delete thumbnails
        if (file.thumbnail_small || file.thumbnail_medium || file.thumbnail_large) {
          const storageKeyBase = file.storage_key?.replace(/\.[^/.]+$/, '') || ''
          if (storageKeyBase) {
            await deleteThumbnails(storageKeyBase)
          }
        }

        // Delete from database
        await supabaseAdmin
          .from('files')
          .delete()
          .eq('id', file.id)

        freedBytes += file.size_bytes
        deletedIds.push(file.id)

        // Log activity
        await supabaseAdmin.from('file_activities').insert({
          vault_id: vaultId,
          action: 'delete',
          user_id: user.id,
          user_email: user.email,
          details: {
            permanent: true,
            fileName: file.name,
            sizeBytes: file.size_bytes,
          },
        })

      } catch (deleteError) {
        console.error(`Error deleting file ${file.id}:`, deleteError)
        errors.push(`Failed to delete ${file.name}`)
      }
    }

    // Update vault used_bytes
    if (freedBytes > 0) {
      await supabaseAdmin
        .from('file_vaults')
        .update({
          used_bytes: Math.max(0, Number(vault.used_bytes) - freedBytes),
        })
        .eq('id', vaultId)
    }

    return NextResponse.json({
      success: errors.length === 0,
      deletedCount: deletedIds.length,
      freedBytes,
      errors: errors.length > 0 ? errors : undefined,
    })

  } catch (error) {
    console.error('Error in DELETE /api/file-vault/trash:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
