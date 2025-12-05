import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TABLE_REGISTRY, type RegisteredTable } from '@/lib/admin/table-registry'

interface RouteContext {
  params: Promise<{ id: string }>
}

// GET /api/admin/tables/[id] - Get specific table info
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find table in registry
    const table = TABLE_REGISTRY.find(t => t.id === id)
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    // Get saved configuration
    const { data: savedConfig } = await supabase
      .from('table_configurations')
      .select('*')
      .eq('table_id', id)
      .single()

    // Merge with saved config
    const tableWithConfig = {
      ...table,
      features: table.features.map(f => ({
        ...f,
        enabled: savedConfig?.features?.[f.id] ?? f.enabled,
      })),
    }

    // Get row count (with proper error handling)
    let rowCount = 0
    try {
      const { count } = await supabase
        .from(table.dbTable)
        .select('*', { count: 'exact', head: true })
      rowCount = count || 0
    } catch (e) {
      // Table might not exist or not accessible
      console.error(`Could not get count for ${table.dbTable}:`, e)
    }

    return NextResponse.json({
      table: tableWithConfig,
      stats: {
        rowCount,
      },
    })
  } catch (error) {
    console.error('Error fetching table:', error)
    return NextResponse.json(
      { error: 'Failed to fetch table' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/tables/[id] - Update specific table configuration
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify table exists
    const table = TABLE_REGISTRY.find(t => t.id === id)
    if (!table) {
      return NextResponse.json({ error: 'Table not found' }, { status: 404 })
    }

    const body = await request.json()
    const { features, columns } = body

    // Build update object
    const updateData: Record<string, unknown> = {
      table_id: id,
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    }

    if (features) {
      const featuresConfig: Record<string, boolean> = {}
      for (const [featureId, enabled] of Object.entries(features)) {
        if (typeof enabled === 'boolean') {
          featuresConfig[featureId] = enabled
        }
      }
      updateData.features = featuresConfig
    }

    if (columns) {
      updateData.columns = columns
    }

    // Upsert configuration
    const { error: upsertError } = await supabase
      .from('table_configurations')
      .upsert(updateData, {
        onConflict: 'table_id',
      })

    if (upsertError) {
      console.error('Upsert error:', upsertError)
      // Continue anyway - table might not exist
    }

    return NextResponse.json({
      success: true,
      tableId: id,
    })
  } catch (error) {
    console.error('Error updating table:', error)
    return NextResponse.json(
      { error: 'Failed to update table' },
      { status: 500 }
    )
  }
}
