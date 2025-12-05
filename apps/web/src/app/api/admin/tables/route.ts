import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { TABLE_REGISTRY, type RegisteredTable, type TableFeature } from '@/lib/admin/table-registry'

// GET /api/admin/tables - Get all registered tables
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get saved configurations from database (if any)
    const { data: savedConfigs } = await supabase
      .from('table_configurations')
      .select('*')
      .order('table_id')

    // Merge saved configs with registry
    const tablesWithConfigs = TABLE_REGISTRY.map(table => {
      const savedConfig = savedConfigs?.find(c => c.table_id === table.id)
      if (savedConfig) {
        return {
          ...table,
          features: table.features.map(f => ({
            ...f,
            enabled: savedConfig.features?.[f.id] ?? f.enabled,
          })),
        }
      }
      return table
    })

    // Get row counts for each table (optional, can be slow)
    const searchParams = request.nextUrl.searchParams
    const includeStats = searchParams.get('stats') === 'true'

    if (includeStats) {
      // This would need proper implementation with RLS
      // For now, return basic counts
    }

    return NextResponse.json({
      tables: tablesWithConfigs,
      total: tablesWithConfigs.length,
    })
  } catch (error) {
    console.error('Error fetching tables:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tables' },
      { status: 500 }
    )
  }
}

// PATCH /api/admin/tables - Update table configuration
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { tableId, features } = body

    if (!tableId || !features) {
      return NextResponse.json(
        { error: 'Missing required fields: tableId, features' },
        { status: 400 }
      )
    }

    // Verify table exists in registry
    const table = TABLE_REGISTRY.find(t => t.id === tableId)
    if (!table) {
      return NextResponse.json(
        { error: 'Table not found in registry' },
        { status: 404 }
      )
    }

    // Build features object
    const featuresConfig: Record<string, boolean> = {}
    for (const [featureId, enabled] of Object.entries(features)) {
      if (typeof enabled === 'boolean') {
        featuresConfig[featureId] = enabled
      }
    }

    // Upsert configuration
    const { error: upsertError } = await supabase
      .from('table_configurations')
      .upsert({
        table_id: tableId,
        features: featuresConfig,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      }, {
        onConflict: 'table_id',
      })

    if (upsertError) {
      // Table might not exist yet, try to create it
      console.error('Upsert error:', upsertError)
    }

    return NextResponse.json({
      success: true,
      tableId,
      features: featuresConfig,
    })
  } catch (error) {
    console.error('Error updating table config:', error)
    return NextResponse.json(
      { error: 'Failed to update table configuration' },
      { status: 500 }
    )
  }
}
