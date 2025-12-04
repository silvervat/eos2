/**
 * FILE SEARCH API
 * GET /api/file-vault/search - Full-text search across files
 * Supports recursive search across all folders with grouping
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
    const recursive = searchParams.get('recursive') === 'true' // Search all subfolders
    const groupByFolder = searchParams.get('groupByFolder') === 'true' // Return results grouped
    const previewLimit = parseInt(searchParams.get('previewLimit') || '3') // Files per folder in preview
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
        folder_id,
        folder:file_folders!folder_id(id, name, path, parent_id)
      `, { count: 'exact' })
      .eq('vault_id', vaultId)
      .is('deleted_at', null)

    // Full-text search on name and extracted_text
    if (query && query.trim()) {
      searchQuery = searchQuery.or(
        `name.ilike.%${query}%,extracted_text.ilike.%${query}%`
      )
    }

    // Filter by folder (only if not recursive or if groupByFolder with specific folder)
    if (folderId && !recursive) {
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

    // Order and paginate (higher limit for grouping)
    const effectiveLimit = groupByFolder ? 200 : limit
    searchQuery = searchQuery
      .order('updated_at', { ascending: false })
      .range(offset, offset + effectiveLimit - 1)

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
      folderId: file.folder_id,
      folder: Array.isArray(file.folder) ? file.folder[0] : file.folder,
    })) || []

    // If groupByFolder, group results by folder
    if (groupByFolder && query) {
      interface FolderInfo {
        id: string | null
        name: string
        path: string
      }

      interface GroupedResult {
        folder: FolderInfo
        files: typeof results
        totalCount: number
      }

      const groupedResults: Map<string, GroupedResult> = new Map()

      for (const file of results) {
        const folderKey = file.folderId || 'root'

        if (!groupedResults.has(folderKey)) {
          groupedResults.set(folderKey, {
            folder: file.folder || { id: null, name: 'Juurkaust', path: '/' },
            files: [],
            totalCount: 0,
          })
        }

        const group = groupedResults.get(folderKey)!
        group.totalCount++

        // Only add files up to preview limit
        if (group.files.length < previewLimit) {
          group.files.push(file)
        }
      }

      // Convert to array and sort by total count (most matches first)
      const folderGroups = Array.from(groupedResults.values())
        .sort((a, b) => b.totalCount - a.totalCount)

      return NextResponse.json({
        grouped: true,
        folderGroups,
        totalFolders: folderGroups.length,
        totalFiles: count || 0,
        query: query || null,
      })
    }

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
