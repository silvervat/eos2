import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/personnel/attendance - List attendance records
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const employeeId = searchParams.get('employeeId')
    const projectId = searchParams.get('projectId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('attendance')
      .select(`
        *,
        employee:employees(id, full_name, employee_code),
        project:projects(id, name, code),
        project_location:project_locations(id, name, address)
      `, { count: 'exact' })
      .is('deleted_at', null)
      .order('timestamp', { ascending: false })

    // Apply filters
    if (employeeId) {
      query = query.eq('employee_id', employeeId)
    }

    if (projectId) {
      query = query.eq('project_id', projectId)
    }

    if (startDate) {
      query = query.gte('date', startDate)
    }

    if (endDate) {
      query = query.lte('date', endDate)
    }

    if (status) {
      query = query.eq('status', status)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching attendance:', error)
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
    console.error('Error in GET /api/personnel/attendance:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/personnel/attendance - Create check-in/check-out record
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

    // Get user's tenant_id and employee_id from profile
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
    if (!body.type) {
      return NextResponse.json(
        { error: 'Type is required (check_in, check_out, break_start, break_end)' },
        { status: 400 }
      )
    }

    // Check for existing active session if check_in
    if (body.type === 'check_in') {
      const { data: existingSession } = await supabase
        .from('attendance')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('type', 'check_in')
        .eq('date', new Date().toISOString().split('T')[0])
        .is('deleted_at', null)
        .maybeSingle()

      // Check if there's an unclosed session
      const { data: unclosedSession } = await supabase
        .from('attendance')
        .select('id, timestamp')
        .eq('employee_id', employeeId)
        .eq('type', 'check_in')
        .is('deleted_at', null)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (unclosedSession) {
        // Check if there's a corresponding check_out
        const { data: checkOut } = await supabase
          .from('attendance')
          .select('id')
          .eq('employee_id', employeeId)
          .eq('type', 'check_out')
          .gt('timestamp', unclosedSession.timestamp)
          .is('deleted_at', null)
          .maybeSingle()

        if (!checkOut) {
          return NextResponse.json({
            error: 'Sul on juba aktiivne tööaeg. Palun lõpeta see enne uue alustamist.',
            existingSession: unclosedSession,
          }, { status: 400 })
        }
      }
    }

    // Get IP address from headers
    const forwardedFor = request.headers.get('x-forwarded-for')
    const ip = forwardedFor ? forwardedFor.split(',')[0].trim() : null

    // Create attendance record
    const { data, error } = await supabase
      .from('attendance')
      .insert({
        tenant_id: profile.tenant_id,
        employee_id: employeeId,
        type: body.type,
        project_id: body.projectId || null,
        project_location_id: body.projectLocationId || null,
        timestamp: body.timestamp || new Date().toISOString(),
        date: body.date || new Date().toISOString().split('T')[0],
        latitude: body.latitude || null,
        longitude: body.longitude || null,
        gps_accuracy: body.gpsAccuracy || null,
        notes: body.notes || null,
        photo_url: body.photoUrl || null,
        device_id: body.deviceId || null,
        device_model: body.deviceModel || null,
        ip_address: ip,
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating attendance:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/personnel/attendance:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
