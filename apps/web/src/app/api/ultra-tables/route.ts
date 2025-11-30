import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/ultra-tables - List all tables
export async function GET(request: Request) {
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

    // Fetch tables with columns and views
    const { data: tables, error } = await supabase
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
          unique_values
        ),
        views:ultra_views(
          id,
          name,
          type,
          is_default,
          config
        )
      `)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching tables:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Sort columns by position
    const tablesWithSortedColumns = tables?.map(table => ({
      ...table,
      columns: table.columns?.sort((a: any, b: any) => a.position - b.position) || [],
      views: table.views || [],
    }))

    return NextResponse.json(tablesWithSortedColumns)
  } catch (error) {
    console.error('Error in GET /api/ultra-tables:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/ultra-tables - Create a new table
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

    // Get user's tenant_id from profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 })
    }

    // Parse request body
    const body = await request.json()

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Tabeli nimi on kohustuslik' },
        { status: 400 }
      )
    }

    // Create table
    const { data: table, error } = await supabase
      .from('ultra_tables')
      .insert({
        tenant_id: profile.tenant_id,
        name: body.name,
        description: body.description || null,
        icon: body.icon || '📊',
        color: body.color || '#3B82F6',
        created_by: user.id,
        settings: body.settings || {},
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating table:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Create default columns
    const defaultColumns = [
      { table_id: table.id, name: 'Nimi', type: 'text', position: 0, width: 200, required: true },
      { table_id: table.id, name: 'Staatus', type: 'status', position: 1, width: 150, config: { options: [
        { value: 'active', label: 'Aktiivne', color: '#22C55E' },
        { value: 'pending', label: 'Ootel', color: '#F59E0B' },
        { value: 'completed', label: 'Lõpetatud', color: '#3B82F6' },
      ]}},
      { table_id: table.id, name: 'Loodud', type: 'created_time', position: 2, width: 150 },
    ]

    const { error: columnsError } = await supabase
      .from('ultra_columns')
      .insert(defaultColumns)

    if (columnsError) {
      console.error('Error creating default columns:', columnsError)
    }

    // Create default view
    const { error: viewError } = await supabase
      .from('ultra_views')
      .insert({
        table_id: table.id,
        name: 'Kõik kirjed',
        type: 'grid',
        is_default: true,
        created_by: user.id,
      })

    if (viewError) {
      console.error('Error creating default view:', viewError)
    }

    // Fetch complete table with columns and views
    const { data: completeTable } = await supabase
      .from('ultra_tables')
      .select(`
        *,
        columns:ultra_columns(*),
        views:ultra_views(*)
      `)
      .eq('id', table.id)
      .single()

    return NextResponse.json(completeTable, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/ultra-tables:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
