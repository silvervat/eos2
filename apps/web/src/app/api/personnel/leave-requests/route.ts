import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/personnel/leave-requests - List leave requests
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const status = searchParams.get('status')
    const leaveTypeId = searchParams.get('leaveTypeId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('leave_requests')
      .select(`
        *,
        employee:employees(id, full_name, employee_code),
        leave_type:leave_types(id, name, code, color, icon),
        substitute:employees!substitute_id(id, full_name),
        approved_by_employee:employees!approved_by(id, full_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (leaveTypeId) {
      query = query.eq('leave_type_id', leaveTypeId)
    }

    if (startDate) {
      query = query.gte('start_date', startDate)
    }

    if (endDate) {
      query = query.lte('end_date', endDate)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching leave requests:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      data,
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/personnel/leave-requests:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/personnel/leave-requests - Create leave request
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

    // Get user's tenant_id and employee_id
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 })
    }

    const body = await request.json()

    // Get employee ID if not provided
    let employeeId = body.employeeId
    if (!employeeId) {
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('email', user.email)
        .single()

      if (employee) {
        employeeId = employee.id
      }
    }

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 400 })
    }

    // Validate required fields
    if (!body.leaveTypeId || !body.startDate || !body.endDate || !body.workingDays) {
      return NextResponse.json(
        { error: 'Leave type, start date, end date, and working days are required' },
        { status: 400 }
      )
    }

    // Check for overlapping leave requests
    const { data: existingLeave } = await supabase
      .from('leave_requests')
      .select('id')
      .eq('employee_id', employeeId)
      .in('status', ['pending', 'approved'])
      .or(`start_date.lte.${body.endDate},end_date.gte.${body.startDate}`)
      .limit(1)
      .maybeSingle()

    if (existingLeave) {
      return NextResponse.json({
        error: 'Sul on juba selleks perioodiks puhkusetaotlus esitatud',
      }, { status: 400 })
    }

    // Create leave request
    const { data, error } = await supabase
      .from('leave_requests')
      .insert({
        tenant_id: profile.tenant_id,
        employee_id: employeeId,
        leave_type_id: body.leaveTypeId,
        start_date: body.startDate,
        end_date: body.endDate,
        working_days: body.workingDays,
        is_half_day: body.isHalfDay || false,
        half_day_type: body.halfDayType || null,
        reason: body.reason || null,
        notes: body.notes || null,
        substitute_id: body.substituteId || null,
        documents: body.documents || [],
        status: 'pending',
        created_by: employeeId,
      })
      .select(`
        *,
        employee:employees(id, full_name),
        leave_type:leave_types(id, name, code, color)
      `)
      .single()

    if (error) {
      console.error('Error creating leave request:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/personnel/leave-requests:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
