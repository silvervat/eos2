/**
 * FILE VAULT - Download API Route
 * GET /api/file-vault/download/[id] - Download file
 */

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { getSignedDownloadUrl, FILE_VAULT_BUCKET } from '@/lib/file-vault/storage/file-storage'
import {
  trackPerformance,
  getRequestMetadata,
} from '@/lib/file-vault/performance-logger'

export const dynamic = 'force-dynamic'

// GET /api/file-vault/download/[id] - Get download URL or stream file
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  // Start performance tracking
  const { ipAddress, userAgent } = getRequestMetadata(request)
  const tracker = trackPerformance({
    action: 'download',
    operationType: 'file_download',
    ipAddress,
    userAgent,
  })

  try {
    const supabase = createClient()
    const fileId = params.id

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

    // Get file
    const { data: file, error } = await supabase
      .from('files')
      .select(`
        *,
        vault:file_vaults!vault_id(id, tenant_id)
      `)
      .eq('id', fileId)
      .is('deleted_at', null)
      .single()

    if (error || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Verify tenant access
    if (file.vault?.tenant_id !== profile.tenant_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check query params
    const { searchParams } = new URL(request.url)
    const inline = searchParams.get('inline') === 'true'
    const redirect = searchParams.get('redirect') === 'true'

    // Generate signed download URL
    const signedUrl = await getSignedDownloadUrl(file.storage_key, 3600) // 1 hour

    // Log download access with performance data (non-blocking)
    tracker.finish({
      fileId,
      vaultId: file.vault_id,
      tenantId: profile.tenant_id,
      userId: user.id,
      bytesTransferred: file.size_bytes,
      fileSizeBytes: file.size_bytes,
      mimeType: file.mime_type,
    }).catch(err => console.warn('Performance log error:', err))

    // If redirect requested, redirect to signed URL
    if (redirect) {
      return NextResponse.redirect(signedUrl)
    }

    // Return download URL
    return NextResponse.json({
      downloadUrl: signedUrl,
      fileName: file.name,
      mimeType: file.mime_type,
      sizeBytes: file.size_bytes,
      contentDisposition: inline ? 'inline' : 'attachment',
    })
  } catch (error) {
    // Log error with performance data
    await tracker.error((error as Error).message)
    console.error('Error in GET /api/file-vault/download/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
