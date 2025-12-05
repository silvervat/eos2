import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/personnel/leave-types - List leave types
export async function GET(request: Request) {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's tenant_id
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('auth_user_id', user.id)
      .single()

    // Build query to get both global (tenant_id is null) and tenant-specific leave types
    const { data, error } = await supabase
      .from('leave_types')
      .select('*')
      .or(`tenant_id.is.null,tenant_id.eq.${profile?.tenant_id || 'null'}`)
      .eq('is_active', true)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching leave types:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    console.error('Error in GET /api/personnel/leave-types:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/personnel/leave-types - Create leave type (tenant-specific)
export async function POST(request: Request) {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's tenant_id
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.code || !body.name) {
      return NextResponse.json(
        { error: 'Code and name are required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('leave_types')
      .insert({
        tenant_id: profile.tenant_id,
        code: body.code,
        name: body.name,
        description: body.description || null,
        days_per_year: body.daysPerYear || null,
        requires_approval: body.requiresApproval !== false,
        requires_document: body.requiresDocument || false,
        requires_substitute: body.requiresSubstitute !== false,
        min_notice_days: body.minNoticeDays || 14,
        max_consecutive_days: body.maxConsecutiveDays || null,
        allow_carryover: body.allowCarryover !== false,
        carryover_max_days: body.carryoverMaxDays || 10,
        is_paid: body.isPaid !== false,
        affects_balance: body.affectsBalance !== false,
        color: body.color || '#3B82F6',
        icon: body.icon || null,
        sort_order: body.sortOrder || 0,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating leave type:', error)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Leave type with this code already exists' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/personnel/leave-types:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
