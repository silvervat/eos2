/**
 * FILE VAULT - Files API Route
 * GET /api/file-vault/files - List files
 * POST /api/file-vault/files - Create file record (for advanced use cases)
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/file-vault/files - List files with search and filters
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
    const folderId = searchParams.get('folderId')
    const search = searchParams.get('search')
    const mimeType = searchParams.get('mimeType')
    const extension = searchParams.get('extension')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const includeDeleted = searchParams.get('includeDeleted') === 'true'

    // Validate vault access
    if (!vaultId) {
      return NextResponse.json({ error: 'Vault ID is required' }, { status: 400 })
    }

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

    // Build query - simplified without relationships to avoid schema cache issues
    let query = supabase
      .from('files')
      .select(`
        id,
        name,
        path,
        mime_type,
        size_bytes,
        extension,
        width,
        height,
        thumbnail_small,
        thumbnail_medium,
        thumbnail_large,
        metadata,
        version,
        is_public,
        owner_id,
        folder_id,
        created_at,
        updated_at
      `, { count: 'exact' })
      .eq('vault_id', vaultId)

    // Apply folder filter
    if (folderId === 'root') {
      query = query.is('folder_id', null)
    } else if (folderId) {
      query = query.eq('folder_id', folderId)
    }

    // Apply soft delete filter
    if (!includeDeleted) {
      query = query.is('deleted_at', null)
    }

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,path.ilike.%${search}%`)
    }

    // Apply MIME type filter
    if (mimeType) {
      if (mimeType.endsWith('/*')) {
        const category = mimeType.slice(0, -2)
        query = query.like('mime_type', `${category}/%`)
      } else {
        query = query.eq('mime_type', mimeType)
      }
    }

    // Apply extension filter
    if (extension) {
      const extensions = extension.split(',').map(e => e.trim().toLowerCase())
      query = query.in('extension', extensions)
    }

    // Apply sorting
    const validSortColumns = ['created_at', 'updated_at', 'name', 'size_bytes', 'mime_type']
    const sortColumn = validSortColumns.includes(sortBy) ? sortBy : 'created_at'
    const ascending = sortOrder === 'asc'
    query = query.order(sortColumn, { ascending })

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: files, error, count } = await query

    if (error) {
      console.error('Error fetching files:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform response
    const transformedFiles = files?.map(file => ({
      id: file.id,
      name: file.name,
      path: file.path,
      mimeType: file.mime_type,
      sizeBytes: file.size_bytes,
      extension: file.extension,
      width: file.width,
      height: file.height,
      thumbnailSmall: file.thumbnail_small,
      thumbnailMedium: file.thumbnail_medium,
      thumbnailLarge: file.thumbnail_large,
      metadata: file.metadata,
      version: file.version,
      isPublic: file.is_public,
      ownerId: file.owner_id,
      folderId: file.folder_id,
      createdAt: file.created_at,
      updatedAt: file.updated_at,
      tags: [],
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
    console.error('Error in GET /api/file-vault/files:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
