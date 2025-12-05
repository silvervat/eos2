/**
 * FILE VAULT - Single Folder API Route
 * GET /api/file-vault/folders/[id] - Get folder details
 * PATCH /api/file-vault/folders/[id] - Update folder
 * DELETE /api/file-vault/folders/[id] - Delete folder
 */

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/file-vault/folders/[id] - Get folder with contents
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const folderId = params.id

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

    // Get folder
    const { data: folder, error } = await supabase
      .from('file_folders')
      .select(`
        *,
        vault:file_vaults!vault_id(id, tenant_id, name),
        parent:file_folders!parent_id(id, name, path)
      `)
      .eq('id', folderId)
      .is('deleted_at', null)
      .single()

    if (error || !folder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    // Verify tenant access
    if (folder.vault?.tenant_id !== profile.tenant_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get subfolders
    const { data: subfolders } = await supabase
      .from('file_folders')
      .select('id, name, path, color, icon')
      .eq('parent_id', folderId)
      .is('deleted_at', null)
      .order('name')

    // Get files count
    const { count: fileCount } = await supabase
      .from('files')
      .select('id', { count: 'exact', head: true })
      .eq('folder_id', folderId)
      .is('deleted_at', null)

    return NextResponse.json({
      id: folder.id,
      name: folder.name,
      path: folder.path,
      color: folder.color,
      icon: folder.icon,
      isPublic: folder.is_public,
      parentId: folder.parent_id,
      ownerId: folder.owner_id,
      createdAt: folder.created_at,
      updatedAt: folder.updated_at,
      vault: folder.vault ? { id: folder.vault.id, name: folder.vault.name } : null,
      parent: folder.parent,
      subfolders: subfolders || [],
      fileCount: fileCount || 0,
    })
  } catch (error) {
    console.error('Error in GET /api/file-vault/folders/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PATCH /api/file-vault/folders/[id] - Update folder
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const folderId = params.id

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

    // Get existing folder
    const { data: existingFolder, error: fetchError } = await supabase
      .from('file_folders')
      .select('*, vault:file_vaults!vault_id(tenant_id)')
      .eq('id', folderId)
      .is('deleted_at', null)
      .single()

    if (fetchError || !existingFolder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    // Verify tenant access
    if (existingFolder.vault?.tenant_id !== profile.tenant_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { name, color, icon, isPublic, parentId } = body

    const updates: Record<string, unknown> = {
      updated_by: user.id,
    }

    // Handle name change
    if (name !== undefined && name !== existingFolder.name) {
      // Validate folder name
      const invalidChars = /[<>:"/\\|?*]/
      if (invalidChars.test(name)) {
        return NextResponse.json(
          { error: 'Folder name contains invalid characters' },
          { status: 400 }
        )
      }

      updates['name'] = name.trim()

      // Update path
      const pathParts = existingFolder.path.split('/')
      pathParts[pathParts.length - 1] = name.trim()
      const newPath = pathParts.join('/')
      updates['path'] = newPath

      // Update all child paths
      await updateChildPaths(
        existingFolder.vault_id,
        existingFolder.path,
        newPath
      )
    }

    // Handle other updates
    if (color !== undefined) updates['color'] = color
    if (icon !== undefined) updates['icon'] = icon
    if (isPublic !== undefined) updates['is_public'] = isPublic

    // Handle parent change (move folder)
    if (parentId !== undefined && parentId !== existingFolder.parent_id) {
      // Validate new parent
      if (parentId) {
        // Check parent exists and is in same vault
        const { data: newParent, error: parentError } = await supabase
          .from('file_folders')
          .select('id, path')
          .eq('id', parentId)
          .eq('vault_id', existingFolder.vault_id)
          .is('deleted_at', null)
          .single()

        if (parentError || !newParent) {
          return NextResponse.json({ error: 'Parent folder not found' }, { status: 404 })
        }

        // Prevent moving folder into its own descendant
        if (newParent.path.startsWith(existingFolder.path + '/')) {
          return NextResponse.json(
            { error: 'Cannot move folder into its own subfolder' },
            { status: 400 }
          )
        }

        updates['parent_id'] = parentId

        // Update path to new location
        const folderName = updates['name'] || existingFolder.name
        const newPath = `${newParent.path}/${folderName}`

        // Update child paths
        await updateChildPaths(
          existingFolder.vault_id,
          existingFolder.path,
          newPath
        )

        updates['path'] = newPath
      } else {
        // Moving to root
        updates['parent_id'] = null
        const folderName = updates['name'] || existingFolder.name
        const newPath = `/${folderName}`

        await updateChildPaths(
          existingFolder.vault_id,
          existingFolder.path,
          newPath
        )

        updates['path'] = newPath
      }
    }

    // Update folder
    const { data: updatedFolder, error: updateError } = await supabaseAdmin
      .from('file_folders')
      .update(updates)
      .eq('id', folderId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating folder:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      id: updatedFolder.id,
      name: updatedFolder.name,
      path: updatedFolder.path,
      color: updatedFolder.color,
      icon: updatedFolder.icon,
      isPublic: updatedFolder.is_public,
      parentId: updatedFolder.parent_id,
      updatedAt: updatedFolder.updated_at,
    })
  } catch (error) {
    console.error('Error in PATCH /api/file-vault/folders/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/file-vault/folders/[id] - Delete folder
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const folderId = params.id

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

    // Check for permanent delete and recursive flags
    const { searchParams } = new URL(request.url)
    const permanent = searchParams.get('permanent') === 'true'
    const recursive = searchParams.get('recursive') === 'true'

    // Get existing folder
    const { data: existingFolder, error: fetchError } = await supabase
      .from('file_folders')
      .select('*, vault:file_vaults!vault_id(tenant_id)')
      .eq('id', folderId)
      .is('deleted_at', null)
      .single()

    if (fetchError || !existingFolder) {
      return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
    }

    // Verify tenant access
    if (existingFolder.vault?.tenant_id !== profile.tenant_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check for contents
    const { count: fileCount } = await supabase
      .from('files')
      .select('id', { count: 'exact', head: true })
      .eq('folder_id', folderId)
      .is('deleted_at', null)

    const { count: subfolderCount } = await supabase
      .from('file_folders')
      .select('id', { count: 'exact', head: true })
      .eq('parent_id', folderId)
      .is('deleted_at', null)

    const hasContents = (fileCount || 0) > 0 || (subfolderCount || 0) > 0

    if (hasContents && !recursive) {
      return NextResponse.json(
        {
          error: 'Folder is not empty',
          fileCount,
          subfolderCount,
          hint: 'Use ?recursive=true to delete folder and all contents'
        },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()

    if (permanent) {
      // Permanent delete - cascade to children
      if (recursive) {
        // Delete all files in folder and subfolders
        await supabaseAdmin
          .from('files')
          .delete()
          .like('path', `${existingFolder.path}/%`)

        // Delete all subfolders
        await supabaseAdmin
          .from('file_folders')
          .delete()
          .like('path', `${existingFolder.path}/%`)
      }

      // Delete the folder
      const { error: deleteError } = await supabaseAdmin
        .from('file_folders')
        .delete()
        .eq('id', folderId)

      if (deleteError) {
        console.error('Error deleting folder:', deleteError)
        return NextResponse.json({ error: deleteError.message }, { status: 500 })
      }
    } else {
      // Soft delete
      if (recursive) {
        // Soft delete all files in folder and subfolders
        await supabaseAdmin
          .from('files')
          .update({ deleted_at: now })
          .like('path', `${existingFolder.path}/%`)

        // Soft delete all subfolders
        await supabaseAdmin
          .from('file_folders')
          .update({ deleted_at: now })
          .like('path', `${existingFolder.path}/%`)
      }

      // Soft delete the folder
      const { error: updateError } = await supabaseAdmin
        .from('file_folders')
        .update({ deleted_at: now })
        .eq('id', folderId)

      if (updateError) {
        console.error('Error soft deleting folder:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true, permanent, recursive })
  } catch (error) {
    console.error('Error in DELETE /api/file-vault/folders/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * Update paths of all child folders and files when parent path changes
 */
async function updateChildPaths(
  vaultId: string,
  oldPath: string,
  newPath: string
): Promise<void> {
  // Update child folder paths
  const { data: childFolders } = await supabaseAdmin
    .from('file_folders')
    .select('id, path')
    .eq('vault_id', vaultId)
    .like('path', `${oldPath}/%`)

  if (childFolders && childFolders.length > 0) {
    for (const folder of childFolders) {
      const updatedPath = folder.path.replace(oldPath, newPath)
      await supabaseAdmin
        .from('file_folders')
        .update({ path: updatedPath })
        .eq('id', folder.id)
    }
  }

  // Update child file paths
  const { data: childFiles } = await supabaseAdmin
    .from('files')
    .select('id, path')
    .eq('vault_id', vaultId)
    .like('path', `${oldPath}/%`)

  if (childFiles && childFiles.length > 0) {
    for (const file of childFiles) {
      const updatedPath = file.path.replace(oldPath, newPath)
      await supabaseAdmin
        .from('files')
        .update({ path: updatedPath })
        .eq('id', file.id)
    }
  }
}
