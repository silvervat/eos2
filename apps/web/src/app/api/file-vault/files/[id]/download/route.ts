/**
 * FILE VAULT - Download API Route
 * GET /api/file-vault/files/[id]/download - Download file
 */

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select(`
        id,
        name,
        storage_key,
        storage_bucket,
        mime_type,
        size_bytes,
        vault:file_vaults!vault_id(id, tenant_id)
      `)
      .eq('id', fileId)
      .is('deleted_at', null)
      .single()

    if (fileError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Verify tenant access
    if ((file.vault as any)?.tenant_id !== profile.tenant_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Generate signed URL for download
    const { data: signedUrl, error: signError } = await supabaseAdmin.storage
      .from(file.storage_bucket || 'file-vault')
      .createSignedUrl(file.storage_key, 3600) // 1 hour expiry

    if (signError || !signedUrl) {
      console.error('Error creating signed URL:', signError)
      return NextResponse.json({ error: 'Failed to generate download URL' }, { status: 500 })
    }

    // Log download activity
    await supabaseAdmin.from('file_activities').insert({
      vault_id: (file.vault as any).id,
      file_id: file.id,
      action: 'download',
      user_id: user.id,
      details: { fileName: file.name, fileSize: file.size_bytes },
    })

    // Update access log
    await supabaseAdmin.from('file_accesses').insert({
      file_id: file.id,
      action: 'download',
      user_id: user.id,
      ip_address: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent'),
      bytes_transferred: file.size_bytes,
    })

    return NextResponse.json({
      downloadUrl: signedUrl.signedUrl,
      fileName: file.name,
      mimeType: file.mime_type,
      sizeBytes: file.size_bytes,
    })
  } catch (error) {
    console.error('Error in GET /api/file-vault/files/[id]/download:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
