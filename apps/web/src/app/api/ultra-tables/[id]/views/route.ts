import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/ultra-tables/[id]/views - List all views for a table
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Fetch views
    const { data: views, error } = await supabase
      .from('ultra_views')
      .select('*')
      .eq('table_id', params.id)
      .order('position', { ascending: true })

    if (error) {
      console.error('Error fetching views:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(views)
  } catch (error) {
    console.error('Error in GET /api/ultra-tables/[id]/views:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/ultra-tables/[id]/views - Create a new view
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.name || !body.type) {
      return NextResponse.json(
        { error: 'Vaate nimi ja tüüp on kohustuslikud' },
        { status: 400 }
      )
    }

    // Get current max position
    const { data: existingViews } = await supabase
      .from('ultra_views')
      .select('position')
      .eq('table_id', params.id)
      .order('position', { ascending: false })
      .limit(1)

    const maxPosition = existingViews?.[0]?.position ?? -1

    // Create view
    const { data: view, error } = await supabase
      .from('ultra_views')
      .insert({
        table_id: params.id,
        name: body.name,
        type: body.type,
        position: maxPosition + 1,
        config: body.config || {},
        filters: body.filters || [],
        sorts: body.sorts || [],
        groups: body.groups || [],
        is_default: body.is_default || false,
        is_public: body.is_public || false,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating view:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(view, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/ultra-tables/[id]/views:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PATCH /api/ultra-tables/[id]/views - Update a view
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Parse request body
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: 'View ID is required' }, { status: 400 })
    }

    // Update view
    const { data: view, error } = await supabase
      .from('ultra_views')
      .update({
        name: body.name,
        type: body.type,
        config: body.config,
        filters: body.filters,
        sorts: body.sorts,
        groups: body.groups,
        is_default: body.is_default,
        is_public: body.is_public,
        position: body.position,
      })
      .eq('id', body.id)
      .eq('table_id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating view:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(view)
  } catch (error) {
    console.error('Error in PATCH /api/ultra-tables/[id]/views:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/ultra-tables/[id]/views - Delete a view
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Get view ID from URL
    const { searchParams } = new URL(request.url)
    const viewId = searchParams.get('viewId')

    if (!viewId) {
      return NextResponse.json({ error: 'View ID is required' }, { status: 400 })
    }

    // Check if this is the default view
    const { data: view } = await supabase
      .from('ultra_views')
      .select('is_default')
      .eq('id', viewId)
      .single()

    if (view?.is_default) {
      return NextResponse.json(
        { error: 'Vaikimisi vaadet ei saa kustutada' },
        { status: 400 }
      )
    }

    // Delete view
    const { error } = await supabase
      .from('ultra_views')
      .delete()
      .eq('id', viewId)
      .eq('table_id', params.id)

    if (error) {
      console.error('Error deleting view:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/ultra-tables/[id]/views:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
