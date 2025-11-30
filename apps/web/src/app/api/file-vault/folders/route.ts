/**
 * FILE VAULT - Folders API Route
 * GET /api/file-vault/folders - List folders (tree structure)
 * POST /api/file-vault/folders - Create new folder
 */

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/file-vault/folders - Get folder tree
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const vaultId = searchParams.get('vaultId')
    const parentId = searchParams.get('parentId')
    const includeFiles = searchParams.get('includeFiles') === 'true'
    const flat = searchParams.get('flat') === 'true'

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

    // Build query for folders
    let query = supabase
      .from('file_folders')
      .select(`
        id,
        name,
        path,
        color,
        icon,
        is_public,
        parent_id,
        owner_id,
        created_at,
        updated_at
      `)
      .eq('vault_id', vaultId)
      .is('deleted_at', null)
      .order('name', { ascending: true })

    // Filter by parent if specified
    if (parentId === 'root') {
      query = query.is('parent_id', null)
    } else if (parentId) {
      query = query.eq('parent_id', parentId)
    }

    const { data: folders, error } = await query

    if (error) {
      console.error('Error fetching folders:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform and optionally build tree
    const transformedFolders = folders?.map(folder => ({
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
    })) || []

    // If flat mode, return as list
    if (flat || parentId) {
      // Get file counts for each folder
      const folderIds = transformedFolders.map(f => f.id)
      if (folderIds.length > 0) {
        const { data: fileCounts } = await supabase
          .from('files')
          .select('folder_id')
          .eq('vault_id', vaultId)
          .in('folder_id', folderIds)
          .is('deleted_at', null)

        const countMap: Record<string, number> = {}
        fileCounts?.forEach(f => {
          countMap[f.folder_id] = (countMap[f.folder_id] || 0) + 1
        })

        transformedFolders.forEach(folder => {
          (folder as Record<string, unknown>).fileCount = countMap[folder.id] || 0
        })
      }

      return NextResponse.json({ folders: transformedFolders })
    }

    // Build tree structure
    const tree = buildFolderTree(transformedFolders)

    return NextResponse.json({ folders: tree })
  } catch (error) {
    console.error('Error in GET /api/file-vault/folders:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/file-vault/folders - Create new folder
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

    // Parse request body
    const body = await request.json()
    const { vaultId, parentId, name, color, icon } = body

    if (!vaultId) {
      return NextResponse.json({ error: 'Vault ID is required' }, { status: 400 })
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Folder name is required' }, { status: 400 })
    }

    // Validate folder name
    const invalidChars = /[<>:"/\\|?*]/
    if (invalidChars.test(name)) {
      return NextResponse.json(
        { error: 'Folder name contains invalid characters' },
        { status: 400 }
      )
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

    // Get parent folder path if parentId provided
    let parentPath = ''
    if (parentId) {
      const { data: parentFolder, error: parentError } = await supabase
        .from('file_folders')
        .select('path')
        .eq('id', parentId)
        .eq('vault_id', vaultId)
        .is('deleted_at', null)
        .single()

      if (parentError || !parentFolder) {
        return NextResponse.json({ error: 'Parent folder not found' }, { status: 404 })
      }
      parentPath = parentFolder.path
    }

    // Build folder path
    const folderPath = parentPath ? `${parentPath}/${name.trim()}` : `/${name.trim()}`

    // Check for duplicate folder name in same location
    let duplicateQuery = supabase
      .from('file_folders')
      .select('id')
      .eq('vault_id', vaultId)
      .eq('path', folderPath)
      .is('deleted_at', null)

    const { data: existingFolder } = await duplicateQuery

    if (existingFolder && existingFolder.length > 0) {
      return NextResponse.json(
        { error: 'A folder with this name already exists in this location' },
        { status: 409 }
      )
    }

    // Create folder
    const { data: newFolder, error: insertError } = await supabaseAdmin
      .from('file_folders')
      .insert({
        vault_id: vaultId,
        parent_id: parentId || null,
        name: name.trim(),
        path: folderPath,
        color: color || null,
        icon: icon || null,
        owner_id: user.id,
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating folder:', insertError)
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'A folder with this path already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      id: newFolder.id,
      name: newFolder.name,
      path: newFolder.path,
      color: newFolder.color,
      icon: newFolder.icon,
      parentId: newFolder.parent_id,
      createdAt: newFolder.created_at,
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/file-vault/folders:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * Build nested tree structure from flat folder list
 */
interface FolderNode {
  id: string
  name: string
  path: string
  color?: string
  icon?: string
  isPublic: boolean
  parentId: string | null
  ownerId: string
  createdAt: string
  updatedAt: string
  children?: FolderNode[]
}

function buildFolderTree(folders: FolderNode[]): FolderNode[] {
  const folderMap = new Map<string, FolderNode>()
  const rootFolders: FolderNode[] = []

  // Create map of all folders
  folders.forEach(folder => {
    folderMap.set(folder.id, { ...folder, children: [] })
  })

  // Build tree
  folders.forEach(folder => {
    const node = folderMap.get(folder.id)!
    if (folder.parentId) {
      const parent = folderMap.get(folder.parentId)
      if (parent) {
        parent.children = parent.children || []
        parent.children.push(node)
      } else {
        // Parent not in this set, treat as root
        rootFolders.push(node)
      }
    } else {
      rootFolders.push(node)
    }
  })

  return rootFolders
}
