/**
 * FILE VAULT - Shares API Route
 * GET /api/file-vault/shares - List shares
 * POST /api/file-vault/shares - Create share link
 */

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

/**
 * Generate a short code for share links
 */
function generateShortCode(length: number = 8): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let result = ''
  const randomBytes = crypto.randomBytes(length)
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length]
  }
  return result
}

// GET /api/file-vault/shares - List shares for a file or folder, or all user's shares
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
    const fileId = searchParams.get('fileId')
    const folderId = searchParams.get('folderId')
    const listAll = searchParams.get('listAll') === 'true' // List all user's shares
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') // 'active' | 'expired' | null
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
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

    // Build query - include file info for display
    let query = supabase
      .from('file_shares')
      .select(`
        id,
        short_code,
        file_id,
        folder_id,
        allow_download,
        allow_upload,
        expires_at,
        download_limit,
        downloads_count,
        access_count,
        last_accessed_at,
        title,
        message,
        password_hash,
        shared_with_email,
        created_at,
        created_by,
        files:file_id (
          id,
          name,
          mime_type,
          size_bytes
        ),
        file_folders:folder_id (
          id,
          name,
          path
        )
      `, { count: 'exact' })
      .eq('vault_id', vaultId)

    // If listing all user's shares, filter by created_by
    if (listAll) {
      query = query.eq('created_by', user.id)
    } else {
      // Original behavior: filter by specific file/folder
      if (fileId) {
        query = query.eq('file_id', fileId)
      }

      if (folderId) {
        query = query.eq('folder_id', folderId)
      }
    }

    // Filter by status (active/expired)
    const now = new Date().toISOString()
    if (status === 'active') {
      query = query.or(`expires_at.is.null,expires_at.gt.${now}`)
    } else if (status === 'expired') {
      query = query.not('expires_at', 'is', null).lt('expires_at', now)
    }

    // Sorting
    const validSortFields = ['created_at', 'expires_at', 'downloads_count', 'access_count']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'created_at'
    query = query.order(sortField, { ascending: sortOrder === 'asc' })

    // Pagination for listAll mode
    if (listAll) {
      query = query.range(offset, offset + limit - 1)
    }

    const { data: shares, error, count } = await query

    if (error) {
      console.error('Error fetching shares:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform response - Supabase returns arrays for joined tables
    const transformedShares = (shares || []).map((share: {
      id: string
      short_code: string
      file_id: string | null
      folder_id: string | null
      allow_download: boolean
      allow_upload: boolean
      expires_at: string | null
      download_limit: number | null
      downloads_count: number
      access_count: number
      last_accessed_at: string | null
      title: string | null
      message: string | null
      password_hash: string | null
      shared_with_email: string | null
      created_at: string
      created_by: string
      files: { id: string; name: string; mime_type: string; size_bytes: number }[] | { id: string; name: string; mime_type: string; size_bytes: number } | null
      file_folders: { id: string; name: string; path: string }[] | { id: string; name: string; path: string } | null
    }) => {
      const isExpired = share.expires_at && new Date(share.expires_at) < new Date()
      const isLimitReached = share.download_limit && share.downloads_count >= share.download_limit

      // Handle both array and single object cases from Supabase
      const fileInfo = Array.isArray(share.files) ? share.files[0] : share.files
      const folderInfo = Array.isArray(share.file_folders) ? share.file_folders[0] : share.file_folders

      return {
        id: share.id,
        shortCode: share.short_code,
        shareUrl: `${process.env.NEXT_PUBLIC_APP_URL || ''}/share/${share.short_code}`,
        fileId: share.file_id,
        folderId: share.folder_id,
        // File/folder info for display
        fileName: fileInfo?.name || null,
        fileMimeType: fileInfo?.mime_type || null,
        fileSizeBytes: fileInfo?.size_bytes || null,
        folderName: folderInfo?.name || null,
        folderPath: folderInfo?.path || null,
        // Share settings
        allowDownload: share.allow_download,
        allowUpload: share.allow_upload,
        expiresAt: share.expires_at,
        downloadLimit: share.download_limit,
        downloadsCount: share.downloads_count,
        accessCount: share.access_count,
        lastAccessedAt: share.last_accessed_at,
        title: share.title,
        message: share.message,
        sharedWithEmail: share.shared_with_email,
        createdAt: share.created_at,
        createdBy: share.created_by,
        hasPassword: !!share.password_hash,
        // Status
        status: isExpired ? 'expired' : isLimitReached ? 'limit_reached' : 'active',
      }
    })

    // Filter by search (after query due to nested fields)
    let filteredShares = transformedShares
    if (search && listAll) {
      const searchLower = search.toLowerCase()
      filteredShares = transformedShares.filter((share: {
        fileName: string | null
        folderName: string | null
        sharedWithEmail: string | null
        title: string | null
      }) =>
        (share.fileName?.toLowerCase().includes(searchLower)) ||
        (share.folderName?.toLowerCase().includes(searchLower)) ||
        (share.sharedWithEmail?.toLowerCase().includes(searchLower)) ||
        (share.title?.toLowerCase().includes(searchLower))
      )
    }

    return NextResponse.json({
      shares: filteredShares,
      pagination: listAll ? {
        total: count || 0,
        limit,
        offset,
        hasMore: (count || 0) > offset + limit,
      } : undefined,
    })
  } catch (error) {
    console.error('Error in GET /api/file-vault/shares:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/file-vault/shares - Create new share link
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
    const {
      vaultId,
      fileId,
      folderId,
      password,
      expiresAt,
      downloadLimit,
      allowDownload = true,
      allowUpload = false,
      title,
      message,
    } = body

    if (!vaultId) {
      return NextResponse.json({ error: 'Vault ID is required' }, { status: 400 })
    }

    if (!fileId && !folderId) {
      return NextResponse.json({ error: 'File ID or Folder ID is required' }, { status: 400 })
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

    // Verify file/folder exists and belongs to vault
    if (fileId) {
      const { data: file, error: fileError } = await supabase
        .from('files')
        .select('id')
        .eq('id', fileId)
        .eq('vault_id', vaultId)
        .is('deleted_at', null)
        .single()

      if (fileError || !file) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }
    }

    if (folderId) {
      const { data: folder, error: folderError } = await supabase
        .from('file_folders')
        .select('id')
        .eq('id', folderId)
        .eq('vault_id', vaultId)
        .is('deleted_at', null)
        .single()

      if (folderError || !folder) {
        return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
      }
    }

    // Generate unique short code
    let shortCode = generateShortCode()
    let attempts = 0
    while (attempts < 5) {
      const { data: existing } = await supabase
        .from('file_shares')
        .select('id')
        .eq('short_code', shortCode)
        .single()

      if (!existing) break
      shortCode = generateShortCode()
      attempts++
    }

    // Hash password if provided
    let passwordHash = null
    if (password) {
      passwordHash = await bcrypt.hash(password, 10)
    }

    // Create share
    console.log('Creating share with data:', {
      vault_id: vaultId,
      file_id: fileId || null,
      folder_id: folderId || null,
      short_code: shortCode,
      has_password: !!passwordHash,
      allow_download: allowDownload,
      allow_upload: allowUpload,
      expires_at: expiresAt || null,
      download_limit: downloadLimit || null,
      created_by: user.id,
    })

    const { data: share, error: insertError } = await supabaseAdmin
      .from('file_shares')
      .insert({
        vault_id: vaultId,
        file_id: fileId || null,
        folder_id: folderId || null,
        short_code: shortCode,
        password_hash: passwordHash,
        allow_download: allowDownload,
        allow_upload: allowUpload,
        expires_at: expiresAt || null,
        download_limit: downloadLimit || null,
        title: title || null,
        message: message || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating share:', insertError)
      console.error('Insert error details:', JSON.stringify(insertError, null, 2))
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Log share creation
    await supabaseAdmin.from('file_accesses').insert({
      file_id: fileId || null,
      folder_id: folderId || null,
      share_id: share.id,
      action: 'share_created',
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent'),
      user_id: user.id,
    })

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/share/${shortCode}`

    return NextResponse.json({
      id: share.id,
      shortCode: share.short_code,
      shareUrl,
      fileId: share.file_id,
      folderId: share.folder_id,
      allowDownload: share.allow_download,
      allowUpload: share.allow_upload,
      expiresAt: share.expires_at,
      downloadLimit: share.download_limit,
      hasPassword: !!passwordHash,
      title: share.title,
      message: share.message,
      createdAt: share.created_at,
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/file-vault/shares:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
