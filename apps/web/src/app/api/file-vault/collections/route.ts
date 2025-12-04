/**
 * USER FILE COLLECTIONS API
 * GET /api/file-vault/collections - List user's collections
 * POST /api/file-vault/collections - Create a new collection
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Force dynamic rendering since this route uses cookies
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const vaultId = searchParams.get('vaultId')

    if (!vaultId) {
      return NextResponse.json({ error: 'vaultId is required' }, { status: 400 })
    }

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user's collections
    const { data: collections, error } = await supabase
      .from('user_file_collections')
      .select(`
        id,
        name,
        description,
        color,
        icon,
        created_at,
        updated_at
      `)
      .eq('user_id', user.id)
      .eq('vault_id', vaultId)
      .is('deleted_at', null)
      .order('name')

    if (error) {
      // Table might not exist yet - return empty array
      if (error.code === '42P01') {
        return NextResponse.json({ collections: [] })
      }
      console.error('Error fetching collections:', error)
      return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 })
    }

    // Get file counts for each collection
    const collectionsWithCounts = await Promise.all(
      (collections || []).map(async (collection) => {
        const { count } = await supabase
          .from('user_collection_files')
          .select('id', { count: 'exact', head: true })
          .eq('collection_id', collection.id)

        return {
          id: collection.id,
          name: collection.name,
          description: collection.description,
          color: collection.color,
          icon: collection.icon,
          fileCount: count || 0,
          createdAt: collection.created_at,
          updatedAt: collection.updated_at,
        }
      })
    )

    return NextResponse.json({ collections: collectionsWithCounts })
  } catch (error) {
    console.error('Error in GET /api/file-vault/collections:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { vaultId, name, description, color, icon } = body

    if (!vaultId || !name) {
      return NextResponse.json(
        { error: 'vaultId and name are required' },
        { status: 400 }
      )
    }

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create collection
    const { data: collection, error } = await supabase
      .from('user_file_collections')
      .insert({
        user_id: user.id,
        vault_id: vaultId,
        name: name.trim(),
        description: description?.trim() || null,
        color: color || '#279989',
        icon: icon || 'folder-heart',
      })
      .select()
      .single()

    if (error) {
      // Table might not exist - create it first
      if (error.code === '42P01') {
        return NextResponse.json(
          { error: 'Collections feature not yet configured. Please run migrations.' },
          { status: 500 }
        )
      }
      console.error('Error creating collection:', error)
      return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 })
    }

    return NextResponse.json({
      id: collection.id,
      name: collection.name,
      description: collection.description,
      color: collection.color,
      icon: collection.icon,
      fileCount: 0,
      createdAt: collection.created_at,
    })
  } catch (error) {
    console.error('Error in POST /api/file-vault/collections:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
