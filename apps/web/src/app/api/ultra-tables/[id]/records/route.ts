import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/ultra-tables/[id]/records - List records with pagination
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)
    const offset = (page - 1) * limit
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'position'
    const sortOrder = searchParams.get('sortOrder') === 'desc' ? false : true

    // Build query
    let query = supabase
      .from('ultra_records')
      .select('*', { count: 'exact' })
      .eq('table_id', params.id)

    // Apply search if provided (searches in JSONB data)
    if (search) {
      // Simple text search in data - searches all string values
      query = query.or(`data.cs.{"${search}"}`)
    }

    // Apply sorting
    if (sortBy === 'position') {
      query = query.order('position', { ascending: sortOrder })
    } else if (sortBy === 'created_at') {
      query = query.order('created_at', { ascending: sortOrder })
    } else if (sortBy === 'updated_at') {
      query = query.order('updated_at', { ascending: sortOrder })
    } else {
      // Sort by JSONB field
      query = query.order('data->' + sortBy, { ascending: sortOrder })
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: records, error, count } = await query

    if (error) {
      console.error('Error fetching records:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      records: records || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        hasMore: (offset + limit) < (count || 0),
      },
    })
  } catch (error) {
    console.error('Error in GET /api/ultra-tables/[id]/records:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/ultra-tables/[id]/records - Create a new record
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

    // Get current max position
    const { data: existingRecords } = await supabase
      .from('ultra_records')
      .select('position')
      .eq('table_id', params.id)
      .order('position', { ascending: false })
      .limit(1)

    const maxPosition = existingRecords?.[0]?.position ?? -1

    // Create record
    const { data: record, error } = await supabase
      .from('ultra_records')
      .insert({
        table_id: params.id,
        data: body.data || {},
        position: maxPosition + 1,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating record:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(record, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/ultra-tables/[id]/records:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PATCH /api/ultra-tables/[id]/records - Update a record
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
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 })
    }

    // Update record
    const { data: record, error } = await supabase
      .from('ultra_records')
      .update({
        data: body.data,
        updated_by: user.id,
      })
      .eq('id', body.id)
      .eq('table_id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating record:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(record)
  } catch (error) {
    console.error('Error in PATCH /api/ultra-tables/[id]/records:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/ultra-tables/[id]/records - Delete a record
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

    // Get record ID from URL
    const { searchParams } = new URL(request.url)
    const recordId = searchParams.get('recordId')

    if (!recordId) {
      return NextResponse.json({ error: 'Record ID is required' }, { status: 400 })
    }

    // Delete record
    const { error } = await supabase
      .from('ultra_records')
      .delete()
      .eq('id', recordId)
      .eq('table_id', params.id)

    if (error) {
      console.error('Error deleting record:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/ultra-tables/[id]/records:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
