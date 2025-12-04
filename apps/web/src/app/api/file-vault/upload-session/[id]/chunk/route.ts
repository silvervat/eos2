/**
 * FILE VAULT - Chunk Upload API
 * POST /api/file-vault/upload-session/[id]/chunk - Upload a chunk
 */

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { FILE_VAULT_BUCKET } from '@/lib/file-vault/storage/file-storage'

export const dynamic = 'force-dynamic'
export const maxDuration = 60 // Allow up to 60 seconds per chunk

// POST /api/file-vault/upload-session/[id]/chunk - Upload a chunk
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const sessionId = params.id

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get upload session
    const { data: session, error: sessionError } = await supabase
      .from('file_upload_sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ error: 'Upload session not found' }, { status: 404 })
    }

    // Check session status
    if (session.status === 'completed') {
      return NextResponse.json({ error: 'Upload already completed' }, { status: 400 })
    }

    if (session.status === 'failed' || session.status === 'cancelled') {
      return NextResponse.json({ error: `Upload session ${session.status}` }, { status: 400 })
    }

    // Check if expired
    if (new Date(session.expires_at) < new Date()) {
      await supabaseAdmin
        .from('file_upload_sessions')
        .update({ status: 'failed', error_message: 'Session expired' })
        .eq('id', sessionId)
      return NextResponse.json({ error: 'Upload session has expired' }, { status: 410 })
    }

    // Parse form data
    const formData = await request.formData()
    const chunkData = formData.get('chunk') as Blob | null
    const chunkIndex = parseInt(formData.get('chunkIndex') as string)

    if (!chunkData) {
      return NextResponse.json({ error: 'No chunk data provided' }, { status: 400 })
    }

    if (isNaN(chunkIndex) || chunkIndex < 0 || chunkIndex >= session.total_chunks) {
      return NextResponse.json(
        { error: `Invalid chunk index. Expected 0-${session.total_chunks - 1}` },
        { status: 400 }
      )
    }

    // Check if chunk already uploaded
    const chunkKeys = session.chunk_keys || []
    if (chunkKeys[chunkIndex]) {
      return NextResponse.json({
        message: 'Chunk already uploaded',
        chunkIndex,
        uploadedChunks: session.uploaded_chunks,
        totalChunks: session.total_chunks,
      })
    }

    // Update session to uploading status
    if (session.status === 'pending') {
      await supabaseAdmin
        .from('file_upload_sessions')
        .update({ status: 'uploading' })
        .eq('id', sessionId)
    }

    // Upload chunk to storage
    const chunkKey = `${session.vault_id}/chunks/${sessionId}/${chunkIndex}`
    const chunkBuffer = Buffer.from(await chunkData.arrayBuffer())

    const { error: uploadError } = await supabaseAdmin.storage
      .from(FILE_VAULT_BUCKET)
      .upload(chunkKey, chunkBuffer, {
        contentType: 'application/octet-stream',
        upsert: true,
      })

    if (uploadError) {
      console.error('Error uploading chunk:', uploadError)
      return NextResponse.json({ error: 'Failed to upload chunk' }, { status: 500 })
    }

    // Update chunk keys array
    const newChunkKeys = [...chunkKeys]
    newChunkKeys[chunkIndex] = chunkKey

    const newUploadedChunks = newChunkKeys.filter(Boolean).length
    const newUploadedBytes = (session.uploaded_bytes || 0) + chunkBuffer.length

    // Check if all chunks uploaded
    const isComplete = newUploadedChunks === session.total_chunks

    // Update session
    const updateData: Record<string, unknown> = {
      chunk_keys: newChunkKeys,
      uploaded_chunks: newUploadedChunks,
      uploaded_bytes: newUploadedBytes,
    }

    if (isComplete) {
      updateData.status = 'processing'
    }

    await supabaseAdmin
      .from('file_upload_sessions')
      .update(updateData)
      .eq('id', sessionId)

    // If complete, trigger merge process
    if (isComplete) {
      // In a production system, you'd trigger an async job here
      // For now, we'll return and let the client call the complete endpoint
    }

    return NextResponse.json({
      chunkIndex,
      uploadedChunks: newUploadedChunks,
      totalChunks: session.total_chunks,
      uploadedBytes: newUploadedBytes,
      totalBytes: session.file_size,
      progress: Math.round((newUploadedChunks / session.total_chunks) * 100),
      isComplete,
      completeUrl: isComplete ? `/api/file-vault/upload-session/${sessionId}/complete` : null,
    })

  } catch (error) {
    console.error('Error in POST /api/file-vault/upload-session/[id]/chunk:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
