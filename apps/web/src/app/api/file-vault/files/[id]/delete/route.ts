/**
 * FILE VAULT - Delete API Route
 * DELETE /api/file-vault/files/[id]/delete - Soft delete or permanent delete
 */

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function DELETE(
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

    // Parse query params
    const { searchParams } = new URL(request.url)
    const permanent = searchParams.get('permanent') === 'true'

    // Get file with vault verification
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select(`
        id,
        name,
        storage_key,
        storage_bucket,
        size_bytes,
        vault_id,
        vault:file_vaults!vault_id(id, tenant_id)
      `)
      .eq('id', fileId)
      .single()

    if (fileError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Verify tenant access
    if ((file.vault as any)?.tenant_id !== profile.tenant_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    if (permanent) {
      // Permanent delete - remove from storage and database

      // Delete from storage
      if (file.storage_key) {
        await supabaseAdmin.storage
          .from(file.storage_bucket || 'file-vault')
          .remove([file.storage_key])
      }

      // Delete from database
      const { error: deleteError } = await supabaseAdmin
        .from('files')
        .delete()
        .eq('id', fileId)

      if (deleteError) {
        console.error('Error permanently deleting file:', deleteError)
        return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
      }

      // Log activity
      await supabaseAdmin.from('file_activities').insert({
        vault_id: file.vault_id,
        action: 'permanent_delete',
        user_id: user.id,
        details: { fileName: file.name, fileSize: file.size_bytes },
      })
    } else {
      // Soft delete - mark as trashed
      const { error: updateError } = await supabaseAdmin
        .from('files')
        .update({
          is_trashed: true,
          trashed_at: new Date().toISOString(),
          deleted_at: new Date().toISOString(),
        })
        .eq('id', fileId)

      if (updateError) {
        console.error('Error soft deleting file:', updateError)
        return NextResponse.json({ error: 'Failed to delete file' }, { status: 500 })
      }

      // Log activity
      await supabaseAdmin.from('file_activities').insert({
        vault_id: file.vault_id,
        file_id: file.id,
        action: 'delete',
        user_id: user.id,
        details: { fileName: file.name },
      })
    }

    return NextResponse.json({ success: true, permanent })
  } catch (error) {
    console.error('Error in DELETE /api/file-vault/files/[id]/delete:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
