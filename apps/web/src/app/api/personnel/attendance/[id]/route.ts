import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/personnel/attendance/[id] - Get attendance by ID
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
      .from('attendance')
      .select(`
        *,
        employee:employees(id, full_name, employee_code, email),
        project:projects(id, name, code),
        project_location:project_locations(id, name, address, latitude, longitude),
        comments:attendance_comments(
          id,
          comment,
          is_internal,
          created_at,
          created_by_employee:employees!created_by(id, full_name)
        ),
        audit_log:attendance_audit_log(
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
      .is('deleted_at', null)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Attendance not found' }, { status: 404 })
      }
      console.error('Error fetching attendance:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in GET /api/personnel/attendance/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PUT /api/personnel/attendance/[id] - Update attendance
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

    // Allowed fields to update
    if (body.timestamp !== undefined) updateData.timestamp = body.timestamp
    if (body.latitude !== undefined) updateData.latitude = body.latitude
    if (body.longitude !== undefined) updateData.longitude = body.longitude
    if (body.notes !== undefined) updateData.notes = body.notes
    if (body.worked_hours !== undefined) updateData.worked_hours = body.worked_hours
    if (body.overtime_hours !== undefined) updateData.overtime_hours = body.overtime_hours

    // Handle approval
    if (body.status === 'approved') {
      updateData.status = 'approved'
      updateData.approved_by = employee?.id
      updateData.approved_at = new Date().toISOString()
    } else if (body.status === 'rejected') {
      updateData.status = 'rejected'
      updateData.approved_by = employee?.id
      updateData.rejection_reason = body.rejectionReason || null
    } else if (body.status === 'modified') {
      updateData.status = 'modified'
      updateData.modified_by = employee?.id
      updateData.modified_at = new Date().toISOString()
      updateData.modification_reason = body.modificationReason || null
    }

    const { data, error } = await supabase
      .from('attendance')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating attendance:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error in PUT /api/personnel/attendance/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/personnel/attendance/[id] - Soft delete attendance
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

    const { error } = await supabase
      .from('attendance')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting attendance:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/personnel/attendance/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
