import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/ultra-tables/[id] - Get a single table
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

    // Fetch table with columns and views
    const { data: table, error } = await supabase
      .from('ultra_tables')
      .select(`
        *,
        columns:ultra_columns(
          id,
          name,
          type,
          position,
          width,
          config,
          required,
          unique_values,
          created_at
        ),
        views:ultra_views(
          id,
          name,
          type,
          is_default,
          is_public,
          position,
          config,
          filters,
          sorts,
          groups
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Error fetching table:', error)
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Tabelit ei leitud' }, { status: 404 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Sort columns by position
    if (table.columns) {
      table.columns.sort((a: any, b: any) => a.position - b.position)
    }

    // Sort views by position
    if (table.views) {
      table.views.sort((a: any, b: any) => a.position - b.position)
    }

    return NextResponse.json(table)
  } catch (error) {
    console.error('Error in GET /api/ultra-tables/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PATCH /api/ultra-tables/[id] - Update a table
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

    // Update table
    const { data: table, error } = await supabase
      .from('ultra_tables')
      .update({
        name: body.name,
        description: body.description,
        icon: body.icon,
        color: body.color,
        settings: body.settings,
      })
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating table:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(table)
  } catch (error) {
    console.error('Error in PATCH /api/ultra-tables/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/ultra-tables/[id] - Delete a table
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

    // Delete table (cascade deletes columns, views, and records)
    const { error } = await supabase
      .from('ultra_tables')
      .delete()
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting table:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/ultra-tables/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
