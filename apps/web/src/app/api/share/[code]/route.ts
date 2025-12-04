/**
 * PUBLIC SHARE ACCESS API
 * GET /api/share/[code] - Get shared content info (no auth required)
 * POST /api/share/[code] - Verify password and get access token
 * POST /api/share/[code]/download - Download shared file
 */

import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { getSignedDownloadUrl } from '@/lib/file-vault/storage/file-storage'

export const dynamic = 'force-dynamic'

// GET /api/share/[code] - Get shared content info
export async function GET(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const shortCode = params.code

    // Get share by short code
    const { data: share, error } = await supabaseAdmin
      .from('file_shares')
      .select(`
        id,
        short_code,
        file_id,
        folder_id,
        password_hash,
        allow_download,
        allow_preview,
        expires_at,
        download_limit,
        view_limit,
        downloads_count,
        views_count,
        title,
        message,
        show_logo,
        custom_background,
        is_active,
        created_at,
        file:files!file_id(
          id, name, original_name, mime_type, size_bytes, extension, category,
          thumbnail_small, thumbnail_medium, thumbnail_large,
          width, height, duration_seconds
        ),
        folder:file_folders!folder_id(
          id, name, path, file_count, total_size_bytes
        ),
        vault:file_vaults!vault_id(name)
      `)
      .eq('short_code', shortCode)
      .single()

    if (error || !share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 })
    }

    // Check if share is active
    if (!share.is_active) {
      return NextResponse.json({ error: 'This share link is no longer active' }, { status: 410 })
    }

    // Check if expired
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This share link has expired' }, { status: 410 })
    }

    // Check view limit
    if (share.view_limit && share.views_count >= share.view_limit) {
      return NextResponse.json({ error: 'View limit reached for this share' }, { status: 410 })
    }

    // Check download limit for download-only shares
    if (share.download_limit && share.downloads_count >= share.download_limit && !share.allow_preview) {
      return NextResponse.json({ error: 'Download limit reached for this share' }, { status: 410 })
    }

    // Record view and get client info
    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Update view count and access log
    const accessLog = share.access_log || []
    accessLog.push({
      ip: clientIp,
      userAgent: userAgent.substring(0, 200),
      action: 'view',
      timestamp: new Date().toISOString(),
    })

    // Keep only last 100 access entries
    const trimmedLog = accessLog.slice(-100)

    await supabaseAdmin
      .from('file_shares')
      .update({
        views_count: (share.views_count || 0) + 1,
        last_accessed_at: new Date().toISOString(),
        access_log: trimmedLog,
      })
      .eq('id', share.id)

    // Log activity
    await supabaseAdmin.from('file_activities').insert({
      vault_id: share.vault_id,
      file_id: share.file_id,
      folder_id: share.folder_id,
      share_id: share.id,
      action: 'share_access',
      ip_address: clientIp,
      user_agent: userAgent,
      details: { action: 'view', shortCode },
    })

    // Return share info (without sensitive data)
    return NextResponse.json({
      id: share.id,
      title: share.title,
      message: share.message,
      requiresPassword: !!share.password_hash,
      allowDownload: share.allow_download,
      allowPreview: share.allow_preview,
      showLogo: share.show_logo,
      customBackground: share.custom_background,
      expiresAt: share.expires_at,
      createdAt: share.created_at,
      vaultName: share.vault?.name,
      // Include file/folder info only if no password required
      ...(share.password_hash ? {} : {
        file: share.file ? {
          id: share.file.id,
          name: share.file.name,
          mimeType: share.file.mime_type,
          sizeBytes: share.file.size_bytes,
          extension: share.file.extension,
          category: share.file.category,
          thumbnailSmall: share.file.thumbnail_small,
          thumbnailMedium: share.file.thumbnail_medium,
          thumbnailLarge: share.file.thumbnail_large,
          width: share.file.width,
          height: share.file.height,
          durationSeconds: share.file.duration_seconds,
        } : null,
        folder: share.folder ? {
          id: share.folder.id,
          name: share.folder.name,
          path: share.folder.path,
          fileCount: share.folder.file_count,
          totalSizeBytes: share.folder.total_size_bytes,
        } : null,
      }),
    })

  } catch (error) {
    console.error('Error in GET /api/share/[code]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/share/[code] - Verify password and get full access
export async function POST(
  request: Request,
  { params }: { params: { code: string } }
) {
  try {
    const shortCode = params.code
    const body = await request.json()
    const { password, action } = body

    // Get share by short code
    const { data: share, error } = await supabaseAdmin
      .from('file_shares')
      .select(`
        *,
        file:files!file_id(
          id, name, original_name, mime_type, size_bytes, extension, category,
          storage_key, thumbnail_small, thumbnail_medium, thumbnail_large,
          width, height, duration_seconds, preview_url
        ),
        folder:file_folders!folder_id(
          id, name, path, file_count, total_size_bytes
        )
      `)
      .eq('short_code', shortCode)
      .single()

    if (error || !share) {
      return NextResponse.json({ error: 'Share not found' }, { status: 404 })
    }

    // Check if share is active
    if (!share.is_active) {
      return NextResponse.json({ error: 'This share link is no longer active' }, { status: 410 })
    }

    // Check if expired
    if (share.expires_at && new Date(share.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This share link has expired' }, { status: 410 })
    }

    // Verify password if required
    if (share.password_hash) {
      if (!password) {
        return NextResponse.json({ error: 'Password required' }, { status: 401 })
      }

      const isValidPassword = await bcrypt.compare(password, share.password_hash)
      if (!isValidPassword) {
        return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
      }
    }

    const clientIp = request.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Handle download action
    if (action === 'download') {
      // Check if download is allowed
      if (!share.allow_download) {
        return NextResponse.json({ error: 'Downloads not allowed for this share' }, { status: 403 })
      }

      // Check download limit
      if (share.download_limit && share.downloads_count >= share.download_limit) {
        return NextResponse.json({ error: 'Download limit reached' }, { status: 410 })
      }

      // For file shares, generate signed URL
      if (share.file && share.file.storage_key) {
        const signedUrl = await getSignedDownloadUrl(share.file.storage_key, 3600) // 1 hour

        // Update download count
        await supabaseAdmin
          .from('file_shares')
          .update({
            downloads_count: (share.downloads_count || 0) + 1,
            bandwidth_used_bytes: (share.bandwidth_used_bytes || 0) + share.file.size_bytes,
            last_accessed_at: new Date().toISOString(),
          })
          .eq('id', share.id)

        // Log activity
        await supabaseAdmin.from('file_activities').insert({
          vault_id: share.vault_id,
          file_id: share.file_id,
          share_id: share.id,
          action: 'download',
          ip_address: clientIp,
          user_agent: userAgent,
          bytes_transferred: share.file.size_bytes,
          details: { viaShare: true, shortCode },
        })

        return NextResponse.json({
          downloadUrl: signedUrl,
          fileName: share.file.name,
          mimeType: share.file.mime_type,
          sizeBytes: share.file.size_bytes,
        })
      }

      // For folder shares, we would need to implement ZIP download
      return NextResponse.json({ error: 'Folder download not yet implemented' }, { status: 501 })
    }

    // Return full share info after password verification
    return NextResponse.json({
      id: share.id,
      title: share.title,
      message: share.message,
      allowDownload: share.allow_download,
      allowPreview: share.allow_preview,
      showLogo: share.show_logo,
      file: share.file ? {
        id: share.file.id,
        name: share.file.name,
        mimeType: share.file.mime_type,
        sizeBytes: share.file.size_bytes,
        extension: share.file.extension,
        category: share.file.category,
        thumbnailSmall: share.file.thumbnail_small,
        thumbnailMedium: share.file.thumbnail_medium,
        thumbnailLarge: share.file.thumbnail_large,
        width: share.file.width,
        height: share.file.height,
        durationSeconds: share.file.duration_seconds,
        previewUrl: share.file.preview_url,
      } : null,
      folder: share.folder ? {
        id: share.folder.id,
        name: share.folder.name,
        path: share.folder.path,
        fileCount: share.folder.file_count,
        totalSizeBytes: share.folder.total_size_bytes,
      } : null,
    })

  } catch (error) {
    console.error('Error in POST /api/share/[code]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
