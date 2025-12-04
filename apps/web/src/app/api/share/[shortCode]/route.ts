/**
 * FILE VAULT - Public Share API Route
 * GET /api/share/[shortCode] - Get shared file/folder info
 * POST /api/share/[shortCode] - Verify password and get download URL
 */

import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSignedDownloadUrl } from '@/lib/file-vault/storage/file-storage'

export const dynamic = 'force-dynamic'

// GET /api/share/[shortCode] - Get shared content info
export async function GET(
  request: Request,
  { params }: { params: { shortCode: string } }
) {
  try {
    const shortCode = params.shortCode

    // Get share by short code
    const { data: share, error } = await supabaseAdmin
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
        password_hash,
        title,
        message
      `)
      .eq('short_code', shortCode)
      .single()

    if (error || !share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 })
    }

    // Check if expired
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This share link has expired' }, { status: 410 })
    }

    // Check download limit
    if (share.download_limit && share.downloads_count >= share.download_limit) {
      return NextResponse.json({ error: 'Download limit reached' }, { status: 410 })
    }

    // Update access count
    await supabaseAdmin
      .from('file_shares')
      .update({
        access_count: (share as { access_count?: number }).access_count ? (share as { access_count: number }).access_count + 1 : 1,
        last_accessed_at: new Date().toISOString(),
      })
      .eq('id', share.id)

    // Get file or folder info
    let content = null

    if (share.file_id) {
      const { data: file } = await supabaseAdmin
        .from('files')
        .select(`
          id,
          name,
          mime_type,
          size_bytes,
          extension,
          thumbnail_small,
          thumbnail_medium,
          width,
          height
        `)
        .eq('id', share.file_id)
        .is('deleted_at', null)
        .single()

      if (file) {
        content = {
          type: 'file',
          ...file,
        }
      }
    }

    if (share.folder_id) {
      const { data: folder } = await supabaseAdmin
        .from('file_folders')
        .select(`
          id,
          name,
          path
        `)
        .eq('id', share.folder_id)
        .is('deleted_at', null)
        .single()

      if (folder) {
        // Get files in folder
        const { data: files } = await supabaseAdmin
          .from('files')
          .select(`
            id,
            name,
            mime_type,
            size_bytes,
            extension,
            thumbnail_small
          `)
          .eq('folder_id', share.folder_id)
          .is('deleted_at', null)
          .order('name')

        content = {
          type: 'folder',
          ...folder,
          files: files || [],
          fileCount: files?.length || 0,
        }
      }
    }

    if (!content) {
      return NextResponse.json({ error: 'Shared content not found' }, { status: 404 })
    }

    // Log access
    await supabaseAdmin.from('file_accesses').insert({
      file_id: share.file_id || null,
      folder_id: share.folder_id || null,
      share_id: share.id,
      action: 'share_view',
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent'),
    })

    return NextResponse.json({
      shortCode: share.short_code,
      title: share.title,
      message: share.message,
      allowDownload: share.allow_download,
      allowUpload: share.allow_upload,
      requiresPassword: !!share.password_hash,
      content,
    })
  } catch (error) {
    console.error('Error in GET /api/share/[shortCode]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/share/[shortCode] - Verify password and get download
export async function POST(
  request: Request,
  { params }: { params: { shortCode: string } }
) {
  try {
    const shortCode = params.shortCode
    const body = await request.json()
    const { password, action, fileId } = body

    // Get share by short code
    const { data: share, error } = await supabaseAdmin
      .from('file_shares')
      .select(`
        id,
        file_id,
        folder_id,
        allow_download,
        expires_at,
        download_limit,
        downloads_count,
        password_hash
      `)
      .eq('short_code', shortCode)
      .single()

    if (error || !share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 })
    }

    // Check if expired
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This share link has expired' }, { status: 410 })
    }

    // Check download limit
    if (share.download_limit && share.downloads_count >= share.download_limit) {
      return NextResponse.json({ error: 'Download limit reached' }, { status: 410 })
    }

    // Verify password if required
    if (share.password_hash) {
      if (!password) {
        return NextResponse.json({ error: 'Password required' }, { status: 401 })
      }

      const isValid = await bcrypt.compare(password, share.password_hash)
      if (!isValid) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
      }
    }

    // Handle download action
    if (action === 'download') {
      if (!share.allow_download) {
        return NextResponse.json({ error: 'Downloads not allowed' }, { status: 403 })
      }

      // Get file to download
      let targetFileId = share.file_id

      // If it's a folder share and a specific fileId was provided
      if (share.folder_id && fileId) {
        // Verify file is in the shared folder
        const { data: file } = await supabaseAdmin
          .from('files')
          .select('id, folder_id')
          .eq('id', fileId)
          .eq('folder_id', share.folder_id)
          .is('deleted_at', null)
          .single()

        if (!file) {
          return NextResponse.json({ error: 'File not found in shared folder' }, { status: 404 })
        }

        targetFileId = fileId
      }

      if (!targetFileId) {
        return NextResponse.json({ error: 'No file to download' }, { status: 400 })
      }

      // Get file details
      const { data: file } = await supabaseAdmin
        .from('files')
        .select('id, name, mime_type, size_bytes, storage_key')
        .eq('id', targetFileId)
        .is('deleted_at', null)
        .single()

      if (!file) {
        return NextResponse.json({ error: 'File not found' }, { status: 404 })
      }

      // Generate signed download URL
      const downloadUrl = await getSignedDownloadUrl(file.storage_key, 3600)

      // Update downloads count
      await supabaseAdmin
        .from('file_shares')
        .update({
          downloads_count: share.downloads_count + 1,
          last_accessed_at: new Date().toISOString(),
        })
        .eq('id', share.id)

      // Log download
      await supabaseAdmin.from('file_accesses').insert({
        file_id: targetFileId,
        share_id: share.id,
        action: 'share_download',
        ip_address: request.headers.get('x-forwarded-for') || 'unknown',
        user_agent: request.headers.get('user-agent'),
        bytes_transferred: file.size_bytes,
      })

      return NextResponse.json({
        downloadUrl,
        fileName: file.name,
        mimeType: file.mime_type,
        sizeBytes: file.size_bytes,
      })
    }

    // Default: return success for password verification
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in POST /api/share/[shortCode]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
