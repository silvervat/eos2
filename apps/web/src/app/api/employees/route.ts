import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/employees - List all employees
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
    const status = searchParams.get('status')
    const department = searchParams.get('department')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query
    let query = supabase
      .from('employees')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('last_name', { ascending: true })

    // Apply filters
    if (status) {
      query = query.eq('status', status)
    }

    if (department) {
      query = query.eq('department', department)
    }

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%,employee_code.ilike.%${search}%`
      )
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching employees:', error)
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
    console.error('Error in GET /api/employees:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/employees - Create a new employee
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
    if (!body.employeeCode || !body.firstName || !body.lastName) {
      return NextResponse.json(
        { error: 'Employee code, first name, and last name are required' },
        { status: 400 }
      )
    }

    // Create employee
    const { data, error } = await supabase
      .from('employees')
      .insert({
        tenant_id: profile.tenant_id,
        employee_code: body.employeeCode,
        first_name: body.firstName,
        last_name: body.lastName,
        email: body.email || null,
        phone: body.phone || null,
        personal_code: body.personalCode || null,
        position: body.position || null,
        department: body.department || null,
        employment_type: body.employmentType || 'full_time',
        start_date: body.startDate || null,
        end_date: body.endDate || null,
        hourly_rate: body.hourlyRate || null,
        monthly_rate: body.monthlyRate || null,
        status: body.status || 'active',
        metadata: body.metadata || {},
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating employee:', error)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Tootaja koodiga tootaja on juba olemas' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/employees:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
