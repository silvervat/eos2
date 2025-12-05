/**
 * FILE VAULT - Batch Operations API
 * POST /api/file-vault/files/batch - Execute batch operations on files
 *
 * Supported actions:
 * - delete: Soft delete multiple files
 * - move: Move files to another folder
 * - tag: Add tags to files
 * - restore: Restore deleted files
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { onBatchOperation } from '@/lib/file-vault/cache-invalidation'

export const dynamic = 'force-dynamic'

interface BatchRequest {
  action: 'delete' | 'move' | 'tag' | 'restore'
  fileIds: string[]
  vaultId: string
  folderId?: string | null // For move action
  tags?: string[] // For tag action
}

export async function POST(request: Request) {
  const startTime = Date.now()

  try {
    const supabase = createClient()

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body: BatchRequest = await request.json()
    const { action, fileIds, vaultId, folderId, tags } = body

    // Validate required fields
    if (!action || !fileIds || !Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json(
        { error: 'Action and fileIds are required' },
        { status: 400 }
      )
    }

    if (!vaultId) {
      return NextResponse.json(
        { error: 'vaultId is required' },
        { status: 400 }
      )
    }

    // Limit batch size to prevent abuse
    if (fileIds.length > 1000) {
      return NextResponse.json(
        { error: 'Maximum 1000 files per batch' },
        { status: 400 }
      )
    }

    // Validate user has access to vault
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 })
    }

    const { data: vault } = await supabase
      .from('file_vaults')
      .select('tenant_id')
      .eq('id', vaultId)
      .is('deleted_at', null)
      .single()

    if (!vault || vault.tenant_id !== profile.tenant_id) {
      return NextResponse.json({ error: 'Vault not found or access denied' }, { status: 403 })
    }

    // Get affected folders for cache invalidation
    const { data: affectedFiles } = await supabase
      .from('files')
      .select('folder_id')
      .in('id', fileIds)
      .eq('vault_id', vaultId)

    const affectedFolderIds = affectedFiles?.map(f => f.folder_id) || []

    let result: { success: boolean; processedCount: number; error?: string }

    switch (action) {
      case 'delete': {
        // Soft delete using database function for performance
        const { data, error } = await supabase.rpc('batch_soft_delete_files', {
          file_ids: fileIds,
          deleted_by_user: user.id,
        })

        if (error) {
          // Fallback to regular update if function doesn't exist
          const { error: updateError } = await supabase
            .from('files')
            .update({
              deleted_at: new Date().toISOString(),
              deleted_by: user.id,
            })
            .in('id', fileIds)
            .eq('vault_id', vaultId)

          if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 })
          }
          result = { success: true, processedCount: fileIds.length }
        } else {
          result = { success: true, processedCount: data || fileIds.length }
        }
        break
      }

      case 'move': {
        if (folderId === undefined) {
          return NextResponse.json(
            { error: 'folderId is required for move action' },
            { status: 400 }
          )
        }

        // Verify target folder exists (if not moving to root)
        if (folderId !== null) {
          const { data: targetFolder } = await supabase
            .from('file_folders')
            .select('id')
            .eq('id', folderId)
            .eq('vault_id', vaultId)
            .is('deleted_at', null)
            .single()

          if (!targetFolder) {
            return NextResponse.json(
              { error: 'Target folder not found' },
              { status: 404 }
            )
          }
        }

        // Move files using database function
        const { data, error } = await supabase.rpc('batch_move_files', {
          file_ids: fileIds,
          target_folder_id: folderId,
        })

        if (error) {
          // Fallback to regular update
          const { error: updateError } = await supabase
            .from('files')
            .update({
              folder_id: folderId,
              updated_at: new Date().toISOString(),
            })
            .in('id', fileIds)
            .eq('vault_id', vaultId)
            .is('deleted_at', null)

          if (updateError) {
            return NextResponse.json({ error: updateError.message }, { status: 500 })
          }
          result = { success: true, processedCount: fileIds.length }
        } else {
          result = { success: true, processedCount: data || fileIds.length }
        }

        // Add target folder to affected folders for cache invalidation
        if (folderId) {
          affectedFolderIds.push(folderId)
        }
        break
      }

      case 'tag': {
        if (!tags || !Array.isArray(tags) || tags.length === 0) {
          return NextResponse.json(
            { error: 'tags array is required for tag action' },
            { status: 400 }
          )
        }

        // Add tags using database function
        const { data, error } = await supabase.rpc('batch_add_tags', {
          file_ids: fileIds,
          new_tags: tags,
        })

        if (error) {
          // Fallback: Update each file's metadata
          const { error: updateError } = await supabase.rpc('batch_add_tags_fallback', {
            p_file_ids: fileIds,
            p_tags: tags,
          })

          if (updateError) {
            // Ultimate fallback: do individual updates
            let successCount = 0
            for (const fileId of fileIds) {
              const { data: file } = await supabase
                .from('files')
                .select('metadata')
                .eq('id', fileId)
                .single()

              if (file) {
                const existingTags = (file.metadata as Record<string, unknown>)?.tags || []
                const newTags = [...new Set([...(existingTags as string[]), ...tags])]

                const { error: tagError } = await supabase
                  .from('files')
                  .update({
                    metadata: { ...(file.metadata as Record<string, unknown>), tags: newTags },
                  })
                  .eq('id', fileId)

                if (!tagError) successCount++
              }
            }
            result = { success: true, processedCount: successCount }
          } else {
            result = { success: true, processedCount: fileIds.length }
          }
        } else {
          result = { success: true, processedCount: data || fileIds.length }
        }
        break
      }

      case 'restore': {
        const { error } = await supabase
          .from('files')
          .update({
            deleted_at: null,
            deleted_by: null,
            updated_at: new Date().toISOString(),
          })
          .in('id', fileIds)
          .eq('vault_id', vaultId)
          .not('deleted_at', 'is', null)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        result = { success: true, processedCount: fileIds.length }
        break
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        )
    }

    // Invalidate cache for affected folders
    await onBatchOperation(vaultId, affectedFolderIds)

    const duration = Date.now() - startTime

    return NextResponse.json({
      ...result,
      _meta: {
        duration,
        action,
        fileCount: fileIds.length,
      },
    })
  } catch (error) {
    console.error('Error in POST /api/file-vault/files/batch:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
