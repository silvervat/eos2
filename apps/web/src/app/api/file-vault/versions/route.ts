/**
 * FILE VERSIONS API
 * GET /api/file-vault/versions - List versions for a file
 * POST /api/file-vault/versions - Create a new version (upload new file)
 */

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')

    if (!fileId) {
      return NextResponse.json({ error: 'fileId is required' }, { status: 400 })
    }

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get file info
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('id, name, version, size_bytes, mime_type, checksum_sha256, created_at, created_by')
      .eq('id', fileId)
      .is('deleted_at', null)
      .single()

    if (fileError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Fetch versions
    const { data: versions, error } = await supabase
      .from('file_versions')
      .select(`
        id,
        version,
        storage_path,
        size_bytes,
        checksum_sha256,
        mime_type,
        change_description,
        created_at,
        created_by
      `)
      .eq('file_id', fileId)
      .order('version', { ascending: false })

    if (error) {
      console.error('Error fetching versions:', error)
      return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 })
    }

    // Get user profiles for version creators
    const userIds = [...new Set([
      file.created_by,
      ...(versions?.map(v => v.created_by) || []),
    ])]
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('auth_user_id, full_name, avatar_url')
      .in('auth_user_id', userIds)

    const profileMap = new Map(profiles?.map(p => [p.auth_user_id, p]) || [])

    // Add current version as the first "version"
    const allVersions = [
      {
        id: file.id,
        version: file.version,
        size_bytes: file.size_bytes,
        checksum_sha256: file.checksum_sha256,
        mime_type: file.mime_type,
        change_description: 'Praegune versioon',
        created_at: file.created_at,
        created_by: file.created_by,
        user: profileMap.get(file.created_by) || { full_name: 'Unknown' },
        isCurrent: true,
      },
      ...(versions?.map(v => ({
        ...v,
        user: profileMap.get(v.created_by) || { full_name: 'Unknown' },
        isCurrent: false,
      })) || []),
    ]

    return NextResponse.json({
      versions: allVersions,
      currentVersion: file.version,
      total: allVersions.length,
    })
  } catch (error) {
    console.error('Error in GET /api/file-vault/versions:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

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

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const fileId = formData.get('fileId') as string | null
    const changeDescription = formData.get('changeDescription') as string | null

    if (!file || !fileId) {
      return NextResponse.json({ error: 'file and fileId are required' }, { status: 400 })
    }

    // Get existing file
    const { data: existingFile, error: fileError } = await supabase
      .from('files')
      .select('*')
      .eq('id', fileId)
      .is('deleted_at', null)
      .single()

    if (fileError || !existingFile) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Save current version to file_versions table
    const { error: versionError } = await supabaseAdmin
      .from('file_versions')
      .insert({
        file_id: fileId,
        version: existingFile.version,
        storage_path: existingFile.storage_path,
        size_bytes: existingFile.size_bytes,
        checksum_sha256: existingFile.checksum_sha256,
        mime_type: existingFile.mime_type,
        change_description: changeDescription || null,
        created_by: user.id,
      })

    if (versionError) {
      console.error('Error saving version:', versionError)
      return NextResponse.json({ error: 'Failed to save version' }, { status: 500 })
    }

    // Upload new file to storage
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Generate new storage key
    const newStorageKey = `${existingFile.vault_id}/${Date.now()}_v${existingFile.version + 1}_${file.name}`

    const { error: uploadError } = await supabaseAdmin.storage
      .from('file-vault')
      .upload(newStorageKey, buffer, {
        contentType: file.type || existingFile.mime_type,
        upsert: false,
      })

    if (uploadError) {
      console.error('Error uploading new version:', uploadError)
      return NextResponse.json({ error: 'Failed to upload new version' }, { status: 500 })
    }

    // Calculate checksum
    const crypto = await import('crypto')
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex')

    // Update file record
    const { data: updatedFile, error: updateError } = await supabaseAdmin
      .from('files')
      .update({
        version: existingFile.version + 1,
        storage_path: newStorageKey,
        storage_key: newStorageKey,
        size_bytes: file.size,
        checksum_sha256: checksum,
        mime_type: file.type || existingFile.mime_type,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', fileId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating file:', updateError)
      return NextResponse.json({ error: 'Failed to update file' }, { status: 500 })
    }

    // Log activity
    await supabaseAdmin.from('file_accesses').insert({
      file_id: fileId,
      action: 'version_upload',
      user_id: user.id,
      details: { new_version: existingFile.version + 1, description: changeDescription },
      bytes_transferred: file.size,
    })

    return NextResponse.json({
      file: updatedFile,
      newVersion: existingFile.version + 1,
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/file-vault/versions:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
