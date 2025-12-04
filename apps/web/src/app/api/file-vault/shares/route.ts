/**
 * FILE VAULT - Shares API Route
 * POST /api/file-vault/shares - Create new share link
 * GET /api/file-vault/shares - List shares for vault
 */

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

/**
 * Generate a unique short code for share links
 */
function generateShortCode(length: number = 10): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  const randomBytes = crypto.randomBytes(length)
  for (let i = 0; i < length; i++) {
    result += chars[randomBytes[i] % chars.length]
  }
  return result
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
      viewLimit,
      allowDownload = true,
      allowPreview = true,
      allowUpload = false,
      title,
      message,
      recipientEmail,
      notifyOnAccess = false,
    } = body

    // Validate - must have either fileId or folderId
    if (!fileId && !folderId) {
      return NextResponse.json(
        { error: 'Either fileId or folderId is required' },
        { status: 400 }
      )
    }

    if (fileId && folderId) {
      return NextResponse.json(
        { error: 'Cannot share both file and folder at once' },
        { status: 400 }
      )
    }

    // Get vault ID from file or folder
    let targetVaultId = vaultId
    let fileName: string | null = null
    let folderName: string | null = null

    if (fileId) {
      const { data: file, error: fileError } = await supabase
        .from('files')
        .select('vault_id, name, vault:file_vaults!vault_id(tenant_id)')
        .eq('id', fileId)
        .is('deleted_at', null)
        .single()

      if (fileError || !file) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }

      // Verify tenant access
      if (file.vault?.tenant_id !== profile.tenant_id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      targetVaultId = file.vault_id
      fileName = file.name
    }

    if (folderId) {
      const { data: folder, error: folderError } = await supabase
        .from('file_folders')
        .select('vault_id, name, vault:file_vaults!vault_id(tenant_id)')
        .eq('id', folderId)
        .is('deleted_at', null)
        .single()

      if (folderError || !folder) {
        return NextResponse.json({ error: 'Folder not found' }, { status: 404 })
      }

      // Verify tenant access
      if (folder.vault?.tenant_id !== profile.tenant_id) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }

      targetVaultId = folder.vault_id
      folderName = folder.name
    }

    // Generate unique short code
    let shortCode = generateShortCode()
    let attempts = 0
    const maxAttempts = 5

    while (attempts < maxAttempts) {
      const { data: existing } = await supabaseAdmin
        .from('file_shares')
        .select('id')
        .eq('short_code', shortCode)
        .single()

      if (!existing) break

      shortCode = generateShortCode()
      attempts++
    }

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: 'Failed to generate unique share code' },
        { status: 500 }
      )
    }

    // Hash password if provided
    let passwordHash: string | null = null
    if (password) {
      passwordHash = await bcrypt.hash(password, 10)
    }

    // Build share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const shareUrl = `${baseUrl}/share/${shortCode}`

    // Create share record
    const { data: share, error: insertError } = await supabaseAdmin
      .from('file_shares')
      .insert({
        vault_id: targetVaultId,
        file_id: fileId || null,
        folder_id: folderId || null,
        short_code: shortCode,
        share_url: shareUrl,
        password_hash: passwordHash,
        allow_download: allowDownload,
        allow_preview: allowPreview,
        allow_upload: allowUpload,
        expires_at: expiresAt || null,
        download_limit: downloadLimit || null,
        view_limit: viewLimit || null,
        title: title || (fileName || folderName),
        message: message || null,
        recipient_email: recipientEmail || null,
        notify_on_access: notifyOnAccess,
        is_active: true,
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating share:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Log activity
    await supabaseAdmin.from('file_activities').insert({
      vault_id: targetVaultId,
      file_id: fileId || null,
      folder_id: folderId || null,
      share_id: share.id,
      action: 'share',
      user_id: user.id,
      user_email: user.email,
      details: {
        shortCode,
        hasPassword: !!password,
        expiresAt,
        downloadLimit,
      },
    })

    return NextResponse.json({
      id: share.id,
      shortCode: share.short_code,
      shareUrl: share.share_url,
      fileId: share.file_id,
      folderId: share.folder_id,
      hasPassword: !!passwordHash,
      allowDownload: share.allow_download,
      allowPreview: share.allow_preview,
      allowUpload: share.allow_upload,
      expiresAt: share.expires_at,
      downloadLimit: share.download_limit,
      viewLimit: share.view_limit,
      title: share.title,
      isActive: share.is_active,
      createdAt: share.created_at,
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/file-vault/shares:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// GET /api/file-vault/shares - List shares for vault
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
    const activeOnly = searchParams.get('activeOnly') !== 'false'

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

    // Build query
    let query = supabase
      .from('file_shares')
      .select(`
        id,
        short_code,
        share_url,
        file_id,
        folder_id,
        password_hash,
        allow_download,
        allow_preview,
        allow_upload,
        expires_at,
        download_limit,
        view_limit,
        downloads_count,
        views_count,
        title,
        message,
        is_active,
        last_accessed_at,
        created_at,
        created_by,
        file:files!file_id(id, name, mime_type, size_bytes, thumbnail_small),
        folder:file_folders!folder_id(id, name, path, file_count)
      `)
      .eq('vault_id', vaultId)

    // Apply filters
    if (fileId) {
      query = query.eq('file_id', fileId)
    }

    if (folderId) {
      query = query.eq('folder_id', folderId)
    }

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    query = query.order('created_at', { ascending: false })

    const { data: shares, error } = await query

    if (error) {
      console.error('Error fetching shares:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform response
    const transformedShares = shares?.map(share => ({
      id: share.id,
      shortCode: share.short_code,
      shareUrl: share.share_url,
      fileId: share.file_id,
      folderId: share.folder_id,
      hasPassword: !!share.password_hash,
      allowDownload: share.allow_download,
      allowPreview: share.allow_preview,
      allowUpload: share.allow_upload,
      expiresAt: share.expires_at,
      isExpired: share.expires_at ? new Date(share.expires_at) < new Date() : false,
      downloadLimit: share.download_limit,
      viewLimit: share.view_limit,
      downloadsCount: share.downloads_count,
      viewsCount: share.views_count,
      title: share.title,
      message: share.message,
      isActive: share.is_active,
      lastAccessedAt: share.last_accessed_at,
      createdAt: share.created_at,
      createdBy: share.created_by,
      file: share.file,
      folder: share.folder,
    })) || []

    return NextResponse.json({ shares: transformedShares })

  } catch (error) {
    console.error('Error in GET /api/file-vault/shares:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
