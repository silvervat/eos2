/**
 * FILE VAULT - Single Share API Route
 * GET /api/file-vault/shares/[id] - Get share details
 * PATCH /api/file-vault/shares/[id] - Update share
 * DELETE /api/file-vault/shares/[id] - Delete share
 */

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

// GET /api/file-vault/shares/[id] - Get share details
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const shareId = params.id

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

    // Get share with vault verification
    const { data: share, error } = await supabase
      .from('file_shares')
      .select(`
        *,
        vault:file_vaults!vault_id(id, tenant_id, name),
        file:files!file_id(id, name, mime_type, size_bytes, thumbnail_small, thumbnail_medium, path),
        folder:file_folders!folder_id(id, name, path, file_count, total_size_bytes)
      `)
      .eq('id', shareId)
      .single()

    if (error || !share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 })
    }

    // Verify tenant access
    if (share.vault?.tenant_id !== profile.tenant_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    return NextResponse.json({
      id: share.id,
      shortCode: share.short_code,
      shareUrl: share.share_url,
      vaultId: share.vault_id,
      fileId: share.file_id,
      folderId: share.folder_id,
      hasPassword: !!share.password_hash,
      requireLogin: share.require_login,
      allowedEmails: share.allowed_emails,
      allowDownload: share.allow_download,
      allowPreview: share.allow_preview,
      allowUpload: share.allow_upload,
      allowComment: share.allow_comment,
      expiresAt: share.expires_at,
      isExpired: share.expires_at ? new Date(share.expires_at) < new Date() : false,
      downloadLimit: share.download_limit,
      viewLimit: share.view_limit,
      bandwidthLimitBytes: share.bandwidth_limit_bytes,
      downloadsCount: share.downloads_count,
      viewsCount: share.views_count,
      bandwidthUsedBytes: share.bandwidth_used_bytes,
      lastAccessedAt: share.last_accessed_at,
      accessLog: share.access_log,
      title: share.title,
      message: share.message,
      recipientEmail: share.recipient_email,
      notifyOnAccess: share.notify_on_access,
      showLogo: share.show_logo,
      customBackground: share.custom_background,
      isActive: share.is_active,
      createdAt: share.created_at,
      createdBy: share.created_by,
      vault: share.vault ? { id: share.vault.id, name: share.vault.name } : null,
      file: share.file,
      folder: share.folder,
    })

  } catch (error) {
    console.error('Error in GET /api/file-vault/shares/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PATCH /api/file-vault/shares/[id] - Update share
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const shareId = params.id

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

    // Get existing share
    const { data: existingShare, error: fetchError } = await supabase
      .from('file_shares')
      .select('*, vault:file_vaults!vault_id(tenant_id)')
      .eq('id', shareId)
      .single()

    if (fetchError || !existingShare) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 })
    }

    // Verify tenant access
    if (existingShare.vault?.tenant_id !== profile.tenant_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const updates: Record<string, unknown> = {}

    // Handle password update
    if (body.password !== undefined) {
      if (body.password === null || body.password === '') {
        updates['password_hash'] = null
      } else {
        updates['password_hash'] = await bcrypt.hash(body.password, 10)
      }
    }

    // Handle other allowed updates
    const allowedFields = [
      'allow_download',
      'allow_preview',
      'allow_upload',
      'allow_comment',
      'expires_at',
      'download_limit',
      'view_limit',
      'bandwidth_limit_bytes',
      'title',
      'message',
      'recipient_email',
      'notify_on_access',
      'show_logo',
      'custom_background',
      'is_active',
      'require_login',
      'allowed_emails',
    ]

    for (const field of allowedFields) {
      // Convert camelCase to snake_case
      const camelField = field.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      if (body[camelField] !== undefined) {
        updates[field] = body[camelField]
      }
    }

    // Also handle snake_case fields directly
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    // Update share
    const { data: updatedShare, error: updateError } = await supabaseAdmin
      .from('file_shares')
      .update(updates)
      .eq('id', shareId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating share:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      id: updatedShare.id,
      shortCode: updatedShare.short_code,
      shareUrl: updatedShare.share_url,
      hasPassword: !!updatedShare.password_hash,
      allowDownload: updatedShare.allow_download,
      allowPreview: updatedShare.allow_preview,
      allowUpload: updatedShare.allow_upload,
      expiresAt: updatedShare.expires_at,
      downloadLimit: updatedShare.download_limit,
      viewLimit: updatedShare.view_limit,
      title: updatedShare.title,
      isActive: updatedShare.is_active,
      updatedAt: updatedShare.updated_at,
    })

  } catch (error) {
    console.error('Error in PATCH /api/file-vault/shares/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/file-vault/shares/[id] - Delete share
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const shareId = params.id

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

    // Get existing share
    const { data: existingShare, error: fetchError } = await supabase
      .from('file_shares')
      .select('*, vault:file_vaults!vault_id(id, tenant_id)')
      .eq('id', shareId)
      .single()

    if (fetchError || !existingShare) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 })
    }

    // Verify tenant access
    if (existingShare.vault?.tenant_id !== profile.tenant_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Delete share
    const { error: deleteError } = await supabaseAdmin
      .from('file_shares')
      .delete()
      .eq('id', shareId)

    if (deleteError) {
      console.error('Error deleting share:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // Log activity
    await supabaseAdmin.from('file_activities').insert({
      vault_id: existingShare.vault.id,
      file_id: existingShare.file_id,
      folder_id: existingShare.folder_id,
      action: 'unshare',
      user_id: user.id,
      user_email: user.email,
      details: {
        shortCode: existingShare.short_code,
        title: existingShare.title,
      },
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error in DELETE /api/file-vault/shares/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
