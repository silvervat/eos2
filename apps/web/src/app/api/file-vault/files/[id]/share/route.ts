/**
 * FILE VAULT - Share API Route
 * POST /api/file-vault/files/[id]/share - Create share link
 * GET /api/file-vault/files/[id]/share - Get existing shares
 * DELETE /api/file-vault/files/[id]/share - Remove share
 */

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'

// Generate short code for share link
function generateShortCode(length = 10): string {
  return randomBytes(length).toString('base64url').slice(0, length)
}

// GET - Get existing shares for file
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const fileId = params.id

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, tenant_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 })
    }

    // Get shares for this file
    const { data: shares, error } = await supabase
      .from('file_shares')
      .select(`
        id,
        short_code,
        allow_download,
        allow_upload,
        expires_at,
        download_limit,
        downloads_count,
        access_count,
        last_accessed_at,
        created_at
      `)
      .eq('file_id', fileId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching shares:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Add full share URLs
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const sharesWithUrls = shares?.map(share => ({
      ...share,
      shareUrl: `${baseUrl}/share/${share.short_code}`,
      isExpired: share.expires_at ? new Date(share.expires_at) < new Date() : false,
      isLimitReached: share.download_limit ? share.downloads_count >= share.download_limit : false,
    }))

    return NextResponse.json({ shares: sharesWithUrls })
  } catch (error) {
    console.error('Error in GET /api/file-vault/files/[id]/share:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST - Create new share link
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const fileId = params.id

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, tenant_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 })
    }

    // Get file to verify access and get vault_id
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select(`
        id,
        name,
        vault_id,
        vault:file_vaults!vault_id(id, tenant_id)
      `)
      .eq('id', fileId)
      .is('deleted_at', null)
      .single()

    if (fileError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    if ((file.vault as any)?.tenant_id !== profile.tenant_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const {
      allowDownload = true,
      allowUpload = false,
      expiresIn, // hours
      downloadLimit,
      password,
    } = body

    // Calculate expiry
    let expiresAt = null
    if (expiresIn) {
      expiresAt = new Date(Date.now() + expiresIn * 60 * 60 * 1000).toISOString()
    }

    // Hash password if provided
    let passwordHash = null
    if (password) {
      const bcrypt = await import('bcryptjs')
      passwordHash = await bcrypt.hash(password, 10)
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

    // Create share
    const { data: share, error: insertError } = await supabaseAdmin
      .from('file_shares')
      .insert({
        vault_id: file.vault_id,
        file_id: fileId,
        short_code: shortCode,
        password_hash: passwordHash,
        allow_download: allowDownload,
        allow_upload: allowUpload,
        expires_at: expiresAt,
        download_limit: downloadLimit || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating share:', insertError)
      return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
    }

    // Log activity
    await supabaseAdmin.from('file_activities').insert({
      vault_id: file.vault_id,
      file_id: fileId,
      action: 'share',
      user_id: user.id,
      details: { shortCode, expiresAt, hasPassword: !!password },
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    return NextResponse.json({
      id: share.id,
      shortCode: share.short_code,
      shareUrl: `${baseUrl}/share/${share.short_code}`,
      expiresAt: share.expires_at,
      downloadLimit: share.download_limit,
      hasPassword: !!passwordHash,
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/file-vault/files/[id]/share:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE - Remove share
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const fileId = params.id

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const shareId = searchParams.get('shareId')

    if (!shareId) {
      return NextResponse.json({ error: 'Share ID is required' }, { status: 400 })
    }

    // Delete share (RLS will verify access)
    const { error: deleteError } = await supabase
      .from('file_shares')
      .delete()
      .eq('id', shareId)
      .eq('file_id', fileId)

    if (deleteError) {
      console.error('Error deleting share:', deleteError)
      return NextResponse.json({ error: 'Failed to delete share' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/file-vault/files/[id]/share:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
