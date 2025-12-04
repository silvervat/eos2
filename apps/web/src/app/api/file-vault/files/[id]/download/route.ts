/**
 * FILE VAULT - Download API Route
 * GET /api/file-vault/files/[id]/download - Get signed download URL
 */

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'
import { getSignedDownloadUrl } from '@/lib/file-vault/storage/file-storage'

export const dynamic = 'force-dynamic'

// GET /api/file-vault/files/[id]/download - Get signed download URL
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Get file with vault verification
    const { data: file, error } = await supabase
      .from('files')
      .select(`
        id,
        name,
        original_name,
        mime_type,
        size_bytes,
        storage_key,
        vault_id,
        vault:file_vaults!vault_id(id, tenant_id)
      `)
      .eq('id', fileId)
      .is('deleted_at', null)
      .eq('is_trashed', false)
      .single()

    if (error || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Verify tenant access
    if (file.vault?.tenant_id !== profile.tenant_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const expiresIn = parseInt(searchParams.get('expiresIn') || '3600') // Default 1 hour
    const maxExpires = 86400 // Max 24 hours
    const actualExpires = Math.min(Math.max(expiresIn, 60), maxExpires)

    // Generate signed URL
    const signedUrl = await getSignedDownloadUrl(file.storage_key, actualExpires)

    // Log download activity
    await supabaseAdmin.from('file_activities').insert({
      vault_id: file.vault_id,
      file_id: fileId,
      action: 'download',
      user_id: user.id,
      user_email: user.email,
      ip_address: request.headers.get('x-forwarded-for') || null,
      user_agent: request.headers.get('user-agent'),
      bytes_transferred: file.size_bytes,
    })

    return NextResponse.json({
      downloadUrl: signedUrl,
      fileName: file.original_name || file.name,
      mimeType: file.mime_type,
      sizeBytes: file.size_bytes,
      expiresIn: actualExpires,
    })

  } catch (error) {
    console.error('Error in GET /api/file-vault/files/[id]/download:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
