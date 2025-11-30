/**
 * FILE VAULT - Favorite API Route
 * POST /api/file-vault/files/[id]/favorite - Toggle favorite
 * GET /api/file-vault/files/[id]/favorite - Check if favorited
 */

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET - Check if file is favorited
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

    const { data: favorite } = await supabase
      .from('file_favorites')
      .select('id')
      .eq('file_id', fileId)
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({ isFavorited: !!favorite })
  } catch (error) {
    console.error('Error in GET /api/file-vault/files/[id]/favorite:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST - Toggle favorite
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
      .select('id, vault_id, vault:file_vaults!vault_id(tenant_id)')
      .eq('id', fileId)
      .is('deleted_at', null)
      .single()

    if (fileError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    if ((file.vault as any)?.tenant_id !== profile.tenant_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Check if already favorited
    const { data: existing } = await supabase
      .from('file_favorites')
      .select('id')
      .eq('file_id', fileId)
      .eq('user_id', user.id)
      .single()

    if (existing) {
      // Remove favorite
      await supabaseAdmin
        .from('file_favorites')
        .delete()
        .eq('id', existing.id)

      // Update file starred status
      await supabaseAdmin
        .from('files')
        .update({ is_starred: false })
        .eq('id', fileId)

      return NextResponse.json({ isFavorited: false })
    } else {
      // Add favorite
      await supabaseAdmin
        .from('file_favorites')
        .insert({
          file_id: fileId,
          user_id: user.id,
          vault_id: file.vault_id,
        })

      // Update file starred status
      await supabaseAdmin
        .from('files')
        .update({ is_starred: true })
        .eq('id', fileId)

      return NextResponse.json({ isFavorited: true })
    }
  } catch (error) {
    console.error('Error in POST /api/file-vault/files/[id]/favorite:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
