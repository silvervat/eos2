import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/personnel/leave-balances - Get leave balances
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
    const year = parseInt(searchParams.get('year') || new Date().getFullYear().toString())

    // If no employee ID provided, get current user's employee ID
    let targetEmployeeId = employeeId
    if (!targetEmployeeId) {
      const { data: employee } = await supabase
        .from('employees')
        .select('id')
        .eq('email', user.email)
        .single()

      if (employee) {
        targetEmployeeId = employee.id
      }
    }

    if (!targetEmployeeId) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 400 })
    }

    // Get leave balances with leave type info
    const { data, error } = await supabase
      .from('leave_balances')
      .select(`
        *,
        leave_type:leave_types(id, name, code, color, icon, days_per_year)
      `)
      .eq('employee_id', targetEmployeeId)
      .eq('year', year)
      .order('leave_type_id')

    if (error) {
      console.error('Error fetching leave balances:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // If no balances found, initialize them
    if (!data || data.length === 0) {
      // Get all active leave types
      const { data: leaveTypes } = await supabase
        .from('leave_types')
        .select('*')
        .eq('is_active', true)

      if (leaveTypes && leaveTypes.length > 0) {
        // Get employee's tenant_id
        const { data: employee } = await supabase
          .from('employees')
          .select('tenant_id')
          .eq('id', targetEmployeeId)
          .single()

        if (employee) {
          // Create balances for each leave type
          const balances = leaveTypes.map(lt => ({
            tenant_id: employee.tenant_id,
            employee_id: targetEmployeeId,
            leave_type_id: lt.id,
            year: year,
            total_days: lt.days_per_year || 0,
            used_days: 0,
            planned_days: 0,
          }))

          const { data: newBalances, error: insertError } = await supabase
            .from('leave_balances')
            .insert(balances)
            .select(`
              *,
              leave_type:leave_types(id, name, code, color, icon, days_per_year)
            `)

          if (insertError) {
            console.error('Error creating leave balances:', insertError)
          } else {
            return NextResponse.json({ data: newBalances })
          }
        }
      }
    }

    return NextResponse.json({ data: data || [] })
  } catch (error) {
    console.error('Error in GET /api/personnel/leave-balances:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/personnel/leave-balances - Adjust leave balance
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

    const body = await request.json()

    // Validate required fields
    if (!body.employeeId || !body.leaveTypeId || body.adjustmentDays === undefined) {
      return NextResponse.json(
        { error: 'Employee ID, leave type ID, and adjustment days are required' },
        { status: 400 }
      )
    }

    const year = body.year || new Date().getFullYear()

    // Update or create balance
    const { data: existingBalance } = await supabase
      .from('leave_balances')
      .select('id, total_days, adjustment_days')
      .eq('employee_id', body.employeeId)
      .eq('leave_type_id', body.leaveTypeId)
      .eq('year', year)
      .single()

    if (existingBalance) {
      // Update existing balance
      const { data, error } = await supabase
        .from('leave_balances')
        .update({
          adjustment_days: (existingBalance.adjustment_days || 0) + body.adjustmentDays,
          total_days: existingBalance.total_days + body.adjustmentDays,
          adjustment_reason: body.reason || null,
        })
        .eq('id', existingBalance.id)
        .select(`
          *,
          leave_type:leave_types(id, name, code, color)
        `)
        .single()

      if (error) {
        console.error('Error updating leave balance:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(data)
    } else {
      // Get employee's tenant_id and leave type's default days
      const { data: employee } = await supabase
        .from('employees')
        .select('tenant_id')
        .eq('id', body.employeeId)
        .single()

      const { data: leaveType } = await supabase
        .from('leave_types')
        .select('days_per_year')
        .eq('id', body.leaveTypeId)
        .single()

      // Create new balance
      const { data, error } = await supabase
        .from('leave_balances')
        .insert({
          tenant_id: employee?.tenant_id,
          employee_id: body.employeeId,
          leave_type_id: body.leaveTypeId,
          year: year,
          total_days: (leaveType?.days_per_year || 0) + body.adjustmentDays,
          adjustment_days: body.adjustmentDays,
          adjustment_reason: body.reason || null,
        })
        .select(`
          *,
          leave_type:leave_types(id, name, code, color)
        `)
        .single()

      if (error) {
        console.error('Error creating leave balance:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json(data, { status: 201 })
    }
  } catch (error) {
    console.error('Error in POST /api/personnel/leave-balances:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
