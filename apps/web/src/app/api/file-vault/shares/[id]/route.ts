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
        file:files!file_id(id, name, mime_type, size_bytes, thumbnail_small),
        folder:file_folders!folder_id(id, name, path)
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

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/share/${share.short_code}`

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
      downloadsCount: share.downloads_count,
      accessCount: share.access_count,
      lastAccessedAt: share.last_accessed_at,
      hasPassword: !!share.password_hash,
      title: share.title,
      message: share.message,
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
    const {
      password,
      removePassword,
      expiresAt,
      downloadLimit,
      allowDownload,
      allowUpload,
      title,
      message,
    } = body

    const updates: Record<string, unknown> = {}

    // Handle password update
    if (removePassword) {
      updates['password_hash'] = null
    } else if (password) {
      updates['password_hash'] = await bcrypt.hash(password, 10)
    }

    // Handle other updates
    if (expiresAt !== undefined) updates['expires_at'] = expiresAt
    if (downloadLimit !== undefined) updates['download_limit'] = downloadLimit
    if (allowDownload !== undefined) updates['allow_download'] = allowDownload
    if (allowUpload !== undefined) updates['allow_upload'] = allowUpload
    if (title !== undefined) updates['title'] = title
    if (message !== undefined) updates['message'] = message

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

    const shareUrl = `${process.env.NEXT_PUBLIC_APP_URL || ''}/share/${updatedShare.short_code}`

    return NextResponse.json({
      id: updatedShare.id,
      shortCode: updatedShare.short_code,
      shareUrl,
      allowDownload: updatedShare.allow_download,
      allowUpload: updatedShare.allow_upload,
      expiresAt: updatedShare.expires_at,
      downloadLimit: updatedShare.download_limit,
      hasPassword: !!updatedShare.password_hash,
      title: updatedShare.title,
      message: updatedShare.message,
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

    // Delete share
    const { error: deleteError } = await supabaseAdmin
      .from('file_shares')
      .delete()
      .eq('id', shareId)

    if (deleteError) {
      console.error('Error deleting share:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/file-vault/shares/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
