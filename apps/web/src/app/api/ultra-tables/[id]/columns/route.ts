import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/ultra-tables/[id]/columns - List all columns for a table
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

    // Fetch columns
    const { data: columns, error } = await supabase
      .from('ultra_columns')
      .select('*')
      .eq('table_id', params.id)
      .order('position', { ascending: true })

    if (error) {
      console.error('Error fetching columns:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(columns)
  } catch (error) {
    console.error('Error in GET /api/ultra-tables/[id]/columns:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/ultra-tables/[id]/columns - Create a new column
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
        { error: 'Veeru nimi ja tüüp on kohustuslikud' },
        { status: 400 }
      )
    }

    // Get current max position
    const { data: existingColumns } = await supabase
      .from('ultra_columns')
      .select('position')
      .eq('table_id', params.id)
      .order('position', { ascending: false })
      .limit(1)

    const maxPosition = existingColumns?.[0]?.position ?? -1

    // Create column
    const { data: column, error } = await supabase
      .from('ultra_columns')
      .insert({
        table_id: params.id,
        name: body.name,
        type: body.type,
        position: maxPosition + 1,
        width: body.width || 150,
        config: body.config || {},
        required: body.required || false,
        unique_values: body.unique_values || false,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating column:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(column, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/ultra-tables/[id]/columns:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PATCH /api/ultra-tables/[id]/columns - Update multiple columns (for reordering)
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

    // Update single column
    if (body.id) {
      const { data: column, error } = await supabase
        .from('ultra_columns')
        .update({
          name: body.name,
          type: body.type,
          width: body.width,
          config: body.config,
          required: body.required,
          unique_values: body.unique_values,
          position: body.position,
        })
        .eq('id', body.id)
        .eq('table_id', params.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating column:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(column)
    }

    // Bulk update positions
    if (body.columns && Array.isArray(body.columns)) {
      const updates = body.columns.map((col: any, index: number) =>
        supabase
          .from('ultra_columns')
          .update({ position: index })
          .eq('id', col.id)
          .eq('table_id', params.id)
      )

      await Promise.all(updates)

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (error) {
    console.error('Error in PATCH /api/ultra-tables/[id]/columns:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/ultra-tables/[id]/columns - Delete a column
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

    // Get column ID from URL
    const { searchParams } = new URL(request.url)
    const columnId = searchParams.get('columnId')

    if (!columnId) {
      return NextResponse.json({ error: 'Column ID is required' }, { status: 400 })
    }

    // Delete column
    const { error } = await supabase
      .from('ultra_columns')
      .delete()
      .eq('id', columnId)
      .eq('table_id', params.id)

    if (error) {
      console.error('Error deleting column:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/ultra-tables/[id]/columns:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
