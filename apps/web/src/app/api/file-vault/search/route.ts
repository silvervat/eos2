/**
 * FILE SEARCH API
 * GET /api/file-vault/search - Full-text search across files
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Force dynamic rendering since this route uses cookies
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)

    const vaultId = searchParams.get('vaultId')
    const query = searchParams.get('q')
    const folderId = searchParams.get('folderId')
    const mimeType = searchParams.get('mimeType')
    const extension = searchParams.get('extension')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (!vaultId) {
      return NextResponse.json({ error: 'vaultId is required' }, { status: 400 })
    }

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Build query
    let searchQuery = supabase
      .from('files')
      .select(`
        id,
        name,
        path,
        mime_type,
        size_bytes,
        extension,
        thumbnail_small,
        thumbnail_medium,
        created_at,
        updated_at,
        tags,
        folder:file_folders!folder_id(id, name, path)
      `, { count: 'exact' })
      .eq('vault_id', vaultId)
      .is('deleted_at', null)

    // Full-text search on name and extracted_text
    if (query && query.trim()) {
      // Use PostgreSQL full-text search
      const searchTerms = query.trim().split(/\s+/).join(' & ')
      searchQuery = searchQuery.or(
        `name.ilike.%${query}%,extracted_text.ilike.%${query}%`
      )
    }

    // Filter by folder
    if (folderId) {
      if (folderId === 'root') {
        searchQuery = searchQuery.is('folder_id', null)
      } else {
        searchQuery = searchQuery.eq('folder_id', folderId)
      }
    }

    // Filter by mime type
    if (mimeType) {
      searchQuery = searchQuery.ilike('mime_type', `${mimeType}%`)
    }

    // Filter by extension
    if (extension) {
      searchQuery = searchQuery.eq('extension', extension.toLowerCase())
    }

    // Order and paginate
    searchQuery = searchQuery
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: files, error, count } = await searchQuery

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json({ error: 'Search failed' }, { status: 500 })
    }

    // Transform results
    const results = files?.map(file => ({
      id: file.id,
      name: file.name,
      path: file.path,
      mimeType: file.mime_type,
      sizeBytes: file.size_bytes,
      extension: file.extension,
      thumbnailSmall: file.thumbnail_small,
      thumbnailMedium: file.thumbnail_medium,
      createdAt: file.created_at,
      updatedAt: file.updated_at,
      tags: file.tags,
      folder: Array.isArray(file.folder) ? file.folder[0] : file.folder,
    })) || []

    return NextResponse.json({
      files: results,
      total: count || 0,
      limit,
      offset,
      query: query || null,
    })
  } catch (error) {
    console.error('Error in GET /api/file-vault/search:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
