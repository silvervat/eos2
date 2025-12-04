/**
 * FILE VAULT - Chunked Upload Session API
 * POST /api/file-vault/upload-session - Initialize upload session
 * GET /api/file-vault/upload-session?token=xxx - Get session status
 */

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { CHUNK_SIZE, MAX_FILE_SIZE, detectMimeType, generateStorageKey } from '@/lib/file-vault/storage/file-storage'

export const dynamic = 'force-dynamic'

// POST /api/file-vault/upload-session - Initialize chunked upload session
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
      folderId,
      fileName,
      fileSize,
      mimeType,
      expectedChecksum,
      metadata = {},
    } = body

    // Validate required fields
    if (!vaultId || !fileName || !fileSize) {
      return NextResponse.json(
        { error: 'Missing required fields: vaultId, fileName, fileSize' },
        { status: 400 }
      )
    }

    // Validate file size (max 100GB for chunked uploads)
    const maxChunkedSize = 100 * 1024 * 1024 * 1024 // 100GB
    if (fileSize > maxChunkedSize) {
      return NextResponse.json(
        { error: `File size exceeds maximum allowed (${maxChunkedSize / 1024 / 1024 / 1024}GB)` },
        { status: 400 }
      )
    }

    // Verify vault exists and user has access
    const { data: vault, error: vaultError } = await supabase
      .from('file_vaults')
      .select('id, tenant_id, quota_bytes, used_bytes')
      .eq('id', vaultId)
      .eq('tenant_id', profile.tenant_id)
      .is('deleted_at', null)
      .single()

    if (vaultError || !vault) {
      return NextResponse.json({ error: 'Vault not found or access denied' }, { status: 404 })
    }

    // Check storage quota
    const newUsedBytes = BigInt(vault.used_bytes) + BigInt(fileSize)
    if (newUsedBytes > BigInt(vault.quota_bytes)) {
      return NextResponse.json(
        { error: 'Storage quota would be exceeded' },
        { status: 400 }
      )
    }

    // Generate resume token
    const resumeToken = crypto.randomBytes(32).toString('hex')

    // Calculate total chunks
    const chunkSize = CHUNK_SIZE // 10MB default
    const totalChunks = Math.ceil(fileSize / chunkSize)

    // Create upload session
    const { data: session, error: insertError } = await supabaseAdmin
      .from('file_upload_sessions')
      .insert({
        vault_id: vaultId,
        folder_id: folderId || null,
        file_name: fileName,
        file_size: fileSize,
        mime_type: mimeType || 'application/octet-stream',
        chunk_size: chunkSize,
        total_chunks: totalChunks,
        uploaded_chunks: 0,
        uploaded_bytes: 0,
        status: 'pending',
        resume_token: resumeToken,
        expected_checksum: expectedChecksum || null,
        metadata,
        user_id: user.id,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating upload session:', insertError)
      return NextResponse.json({ error: 'Failed to create upload session' }, { status: 500 })
    }

    return NextResponse.json({
      sessionId: session.id,
      resumeToken: session.resume_token,
      chunkSize,
      totalChunks,
      fileSize,
      expiresAt: session.expires_at,
      uploadUrl: `/api/file-vault/upload-session/${session.id}/chunk`,
    }, { status: 201 })

  } catch (error) {
    console.error('Error in POST /api/file-vault/upload-session:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// GET /api/file-vault/upload-session?token=xxx - Get session status
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

    // Parse query params
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const sessionId = searchParams.get('sessionId')

    if (!token && !sessionId) {
      return NextResponse.json({ error: 'Token or sessionId required' }, { status: 400 })
    }

    // Get session
    let query = supabase
      .from('file_upload_sessions')
      .select('*')
      .eq('user_id', user.id)

    if (token) {
      query = query.eq('resume_token', token)
    } else if (sessionId) {
      query = query.eq('id', sessionId)
    }

    const { data: session, error } = await query.single()

    if (error || !session) {
      return NextResponse.json({ error: 'Upload session not found' }, { status: 404 })
    }

    // Check if expired
    if (new Date(session.expires_at) < new Date()) {
      return NextResponse.json({
        ...formatSession(session),
        status: 'expired',
        error: 'Upload session has expired',
      })
    }

    return NextResponse.json(formatSession(session))

  } catch (error) {
    console.error('Error in GET /api/file-vault/upload-session:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

function formatSession(session: Record<string, unknown>) {
  return {
    sessionId: session.id,
    resumeToken: session.resume_token,
    fileName: session.file_name,
    fileSize: session.file_size,
    mimeType: session.mime_type,
    chunkSize: session.chunk_size,
    totalChunks: session.total_chunks,
    uploadedChunks: session.uploaded_chunks,
    uploadedBytes: session.uploaded_bytes,
    status: session.status,
    errorMessage: session.error_message,
    expiresAt: session.expires_at,
    createdAt: session.created_at,
    completedAt: session.completed_at,
  }
}
