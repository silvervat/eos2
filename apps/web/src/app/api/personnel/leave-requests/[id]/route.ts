import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/personnel/leave-requests/[id] - Get leave request by ID
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('leave_requests')
      .select(`
        *,
        employee:employees(id, full_name, employee_code, email),
        leave_type:leave_types(id, name, code, color, icon, description),
        substitute:employees!substitute_id(id, full_name),
        approved_by_employee:employees!approved_by(id, full_name),
        rejected_by_employee:employees!rejected_by(id, full_name),
        audit_log:leave_audit_log(
          id,
          action,
          performed_at,
          reason,
          old_values,
          new_values,
          performed_by_employee:employees!performed_by(id, full_name)
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Leave request not found' }, { status: 404 })
      }
      console.error('Error fetching leave request:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/personnel/leave-requests/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PUT /api/personnel/leave-requests/[id] - Update leave request (approve/reject/modify)
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Get employee ID for current user
    const { data: employee } = await supabase
      .from('employees')
      .select('id')
      .eq('email', user.email)
      .single()

    const updateData: Record<string, unknown> = {}

    // Handle different actions
    if (body.action === 'approve') {
      updateData.status = 'approved'
      updateData.approved_by = employee?.id
      updateData.approved_at = new Date().toISOString()
      updateData.manager_approved_at = new Date().toISOString()
      updateData.manager_notes = body.notes || null
    } else if (body.action === 'reject') {
      updateData.status = 'rejected'
      updateData.rejected_by = employee?.id
      updateData.rejected_at = new Date().toISOString()
      updateData.rejection_reason = body.rejectionReason || null
    } else if (body.action === 'cancel') {
      updateData.status = 'cancelled'
      updateData.cancelled_by = employee?.id
      updateData.cancelled_at = new Date().toISOString()
      updateData.cancellation_reason = body.cancellationReason || null
    } else {
      // Regular update
      if (body.startDate !== undefined) updateData.start_date = body.startDate
      if (body.endDate !== undefined) updateData.end_date = body.endDate
      if (body.workingDays !== undefined) updateData.working_days = body.workingDays
      if (body.reason !== undefined) updateData.reason = body.reason
      if (body.notes !== undefined) updateData.notes = body.notes
      if (body.substituteId !== undefined) updateData.substitute_id = body.substituteId
    }

    const { data, error } = await supabase
      .from('leave_requests')
      .update(updateData)
      .eq('id', params.id)
      .select(`
        *,
        employee:employees(id, full_name),
        leave_type:leave_types(id, name, code, color)
      `)
      .single()

    if (error) {
      console.error('Error updating leave request:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PUT /api/personnel/leave-requests/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/personnel/leave-requests/[id] - Cancel leave request
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get employee ID for current user
    const { data: employee } = await supabase
      .from('employees')
      .select('id')
      .eq('email', user.email)
      .single()

    const { error } = await supabase
      .from('leave_requests')
      .update({
        status: 'cancelled',
        cancelled_by: employee?.id,
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', params.id)

    if (error) {
      console.error('Error cancelling leave request:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/personnel/leave-requests/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
