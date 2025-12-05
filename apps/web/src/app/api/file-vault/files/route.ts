/**
 * FILE VAULT - Files API Route (OPTIMIZED v3)
 * GET /api/file-vault/files - List files
 * POST /api/file-vault/files - Create file record (for advanced use cases)
 *
 * Performance optimizations:
 * - Parallel auth + profile + vault validation
 * - Optimized query with composite indexes
 * - Multi-tier caching (browser, CDN, server)
 * - Cursor-based pagination for large datasets
 * - CDN thumbnail URL generation
 * - Extended cache TTLs
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cacheGet, cacheSet, CACHE_TTL } from '@/lib/cache'
import { getFileListCacheKey } from '@/lib/file-vault/cache-invalidation'

export const dynamic = 'force-dynamic'

// Extended cache TTLs for better hit rates
const EXTENDED_TTL = {
  FILE_LIST: 60,         // 1 minute
  SEARCH: 30,            // 30 seconds for search
  VAULT_VALIDATION: 300, // 5 minutes
}

// CDN cache headers for different scenarios
const CACHE_HEADERS = {
  standard: 'private, max-age=10, stale-while-revalidate=60',
  search: 'private, max-age=5, stale-while-revalidate=30',
  cached: 'private, max-age=30, stale-while-revalidate=120',
}

// GET /api/file-vault/files - List files with search and filters
export async function GET(request: Request) {
  const startTime = Date.now()

  try {
    const supabase = createClient()

    // Parse query parameters early
    const { searchParams } = new URL(request.url)
    const vaultId = searchParams.get('vaultId')
    const folderId = searchParams.get('folderId')
    const search = searchParams.get('search')?.trim()
    const mimeType = searchParams.get('mimeType')
    const extension = searchParams.get('extension')
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500) // Increased cap to 500
    const offset = parseInt(searchParams.get('offset') || '0')
    const includeDeleted = searchParams.get('includeDeleted') === 'true'
    const trashedOnly = searchParams.get('trashedOnly') === 'true'
    const uploadedByMe = searchParams.get('uploadedByMe') === 'true'
    const cursor = searchParams.get('cursor') // For cursor-based pagination

    // Validate vault ID early
    if (!vaultId) {
      return NextResponse.json({ error: 'Vault ID is required' }, { status: 400 })
    }

    // Generate cache key
    const cacheKey = getFileListCacheKey({
      vaultId,
      folderId,
      search,
      mimeType,
      extension,
      sortBy,
      sortOrder,
      limit,
      offset,
    })

    // Determine if this is a special query (non-cacheable)
    const isSpecialQuery = search || includeDeleted || trashedOnly || uploadedByMe

    // Try cache first (skip if searching or getting deleted files)
    if (!isSpecialQuery) {
      const cached = await cacheGet<{
        files: unknown[]
        pagination: { total: number; limit: number; offset: number; hasMore: boolean; nextCursor?: string }
      }>(cacheKey)

      if (cached) {
        const duration = Date.now() - startTime
        const response = NextResponse.json({
          ...cached,
          _meta: { duration, cached: true },
        })
        response.headers.set('Cache-Control', CACHE_HEADERS.cached)
        response.headers.set('X-Cache', 'HIT')
        response.headers.set('X-Query-Duration', `${duration}ms`)
        return response
      }
    }

    // OPTIMIZATION: Get auth user first (required for subsequent queries)
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // OPTIMIZATION: Parallel profile + vault validation
    const [profileResult, vaultResult] = await Promise.all([
      supabase
        .from('user_profiles')
        .select('id, tenant_id')
        .eq('auth_user_id', user.id)
        .single(),
      supabase
        .from('file_vaults')
        .select('id, tenant_id')
        .eq('id', vaultId)
        .is('deleted_at', null)
        .single()
    ])

    const profile = profileResult.data
    const vault = vaultResult.data

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 })
    }

    // Verify vault belongs to user's tenant
    if (!vault || vault.tenant_id !== profile.tenant_id) {
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
        updated_at,
        created_by,
        tags,
        deleted_at,
        deleted_by
      `, { count: 'exact' })
      .eq('vault_id', vaultId)

    // Apply folder filter
    if (folderId === 'root') {
      query = query.is('folder_id', null)
    } else if (folderId) {
      query = query.eq('folder_id', folderId)
    }

    // Apply soft delete filter
    if (trashedOnly) {
      // Only show trashed/deleted files
      query = query.not('deleted_at', 'is', null)
    } else if (!includeDeleted) {
      query = query.is('deleted_at', null)
    }

    // Filter by current user's uploads
    if (uploadedByMe) {
      query = query.eq('uploaded_by', user.id)
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

    // Apply size filters
    const minSize = searchParams.get('minSize')
    const maxSize = searchParams.get('maxSize')
    if (minSize) {
      query = query.gte('size_bytes', parseInt(minSize))
    }
    if (maxSize) {
      query = query.lte('size_bytes', parseInt(maxSize))
    }

    // Apply date filters
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    if (dateFrom) {
      query = query.gte('created_at', `${dateFrom}T00:00:00.000Z`)
    }
    if (dateTo) {
      query = query.lte('created_at', `${dateTo}T23:59:59.999Z`)
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

    // Fetch uploader profiles and comment counts for all files in parallel
    const fileIds = files?.map(f => f.id) || []
    const creatorIds = [...new Set(files?.map(f => f.created_by).filter(Boolean) || [])]

    const [profilesResult, commentCountsResult] = await Promise.all([
      // Fetch uploader profiles
      creatorIds.length > 0
        ? supabase
            .from('user_profiles')
            .select('auth_user_id, full_name, avatar_url')
            .in('auth_user_id', creatorIds)
        : Promise.resolve({ data: [] }),
      // Fetch comment counts per file
      fileIds.length > 0
        ? supabase
            .from('file_comments')
            .select('file_id')
            .in('file_id', fileIds)
            .is('deleted_at', null)
        : Promise.resolve({ data: [] }),
    ])

    // Build uploader map
    let uploaderMap = new Map<string, { fullName: string; avatarUrl: string | null }>()
    if (profilesResult.data) {
      uploaderMap = new Map(
        profilesResult.data.map(p => [p.auth_user_id, { fullName: p.full_name || 'Tundmatu', avatarUrl: p.avatar_url }])
      )
    }

    // Build comment count map
    const commentCountMap = new Map<string, number>()
    if (commentCountsResult.data) {
      for (const comment of commentCountsResult.data) {
        const current = commentCountMap.get(comment.file_id) || 0
        commentCountMap.set(comment.file_id, current + 1)
      }
    }

    // CDN base URL for thumbnails
    const cdnBase = process.env.CDN_URL || ''

    // Transform response with CDN thumbnail URLs and uploader info
    const transformedFiles = files?.map(file => ({
      id: file.id,
      name: file.name,
      path: file.path,
      mimeType: file.mime_type,
      sizeBytes: file.size_bytes,
      extension: file.extension,
      width: file.width,
      height: file.height,
      // CDN URLs for thumbnails if CDN is configured
      thumbnailSmall: cdnBase && file.thumbnail_small
        ? `${cdnBase}${file.thumbnail_small}`
        : file.thumbnail_small,
      thumbnailMedium: cdnBase && file.thumbnail_medium
        ? `${cdnBase}${file.thumbnail_medium}`
        : file.thumbnail_medium,
      thumbnailLarge: cdnBase && file.thumbnail_large
        ? `${cdnBase}${file.thumbnail_large}`
        : file.thumbnail_large,
      metadata: file.metadata,
      version: file.version,
      isPublic: file.is_public,
      ownerId: file.owner_id,
      folderId: file.folder_id,
      createdAt: file.created_at,
      updatedAt: file.updated_at,
      createdBy: file.created_by,
      uploader: uploaderMap.get(file.created_by) || { fullName: 'Tundmatu', avatarUrl: null },
      tags: file.tags || [],
      commentCount: commentCountMap.get(file.id) || 0,
      deletedAt: file.deleted_at,
      deletedBy: file.deleted_by,
    })) || []

    // Generate next cursor for efficient pagination on large datasets
    let nextCursor: string | undefined
    if (files && files.length === limit) {
      const lastFile = files[files.length - 1]
      nextCursor = Buffer.from(JSON.stringify({
        createdAt: lastFile.created_at,
        id: lastFile.id,
      })).toString('base64')
    }

    const duration = Date.now() - startTime

    // Prepare result for caching
    const result = {
      files: transformedFiles,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0),
        nextCursor, // For cursor-based pagination
      },
    }

    // Store in cache (only if not a special query)
    if (!isSpecialQuery) {
      await cacheSet(cacheKey, result, EXTENDED_TTL.FILE_LIST)
    }

    // Select appropriate cache header
    const cacheControl = search ? CACHE_HEADERS.search : CACHE_HEADERS.standard

    // Create response with caching headers
    const response = NextResponse.json({
      ...result,
      _meta: {
        duration,
        cached: false,
      },
    })

    // Add cache headers - optimized for performance
    response.headers.set('Cache-Control', cacheControl)
    response.headers.set('X-Cache', 'MISS')
    response.headers.set('X-Query-Duration', `${duration}ms`)
    response.headers.set('X-Total-Count', String(count || 0))

    return response
  } catch (error) {
    console.error('Error in GET /api/file-vault/files:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
