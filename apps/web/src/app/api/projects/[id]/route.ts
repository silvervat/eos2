import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/projects/[id] - Get a single project
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    const { data, error } = await supabase
      .from('projects')
      .select(
        'id, code, name, description, type, client_id, contact_id, status, currency, start_date, end_date, address, city, country, latitude, longitude, manager_id, thumbnail_url, metadata, created_at, updated_at'
      )
      .eq('id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }
      console.error('Error fetching project:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch client data if exists
    let client = null
    if (data.client_id) {
      const { data: clientData } = await supabase
        .from('companies')
        .select('id, name')
        .eq('id', data.client_id)
        .single()
      client = clientData
    }

    // Fetch contact data if exists
    let contact = null
    if (data.contact_id) {
      const { data: contactData } = await supabase
        .from('company_contacts')
        .select('id, first_name, last_name, email, phone')
        .eq('id', data.contact_id)
        .single()
      if (contactData) {
        contact = {
          id: contactData.id,
          name: `${contactData.first_name} ${contactData.last_name}`.trim(),
          email: contactData.email,
          phone: contactData.phone,
        }
      }
    }

    const transformedData = {
      id: data.id,
      code: data.code,
      name: data.name,
      description: data.description,
      type: data.type || 'ptv',
      clientId: data.client_id,
      client,
      contactId: data.contact_id,
      contact,
      status: data.status || 'starting',
      currency: data.currency,
      startDate: data.start_date,
      endDate: data.end_date,
      address: data.address,
      city: data.city,
      country: data.country,
      latitude: data.latitude,
      longitude: data.longitude,
      managerId: data.manager_id,
      thumbnailUrl: data.thumbnail_url,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Error in GET /api/projects/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PATCH /api/projects/[id] - Update a project
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Parse request body
    const body = await request.json()

    // Build update object (only include provided fields)
    const updateData: Record<string, unknown> = {}

    if (body.code !== undefined) updateData.code = body.code
    if (body.name !== undefined) updateData.name = body.name
    if (body.description !== undefined) updateData.description = body.description
    if (body.type !== undefined) updateData.type = body.type
    if (body.clientId !== undefined) updateData.client_id = body.clientId
    if (body.contactId !== undefined) updateData.contact_id = body.contactId
    if (body.status !== undefined) updateData.status = body.status
    if (body.currency !== undefined) updateData.currency = body.currency
    if (body.startDate !== undefined) updateData.start_date = body.startDate
    if (body.endDate !== undefined) updateData.end_date = body.endDate
    if (body.address !== undefined) updateData.address = body.address
    if (body.country !== undefined) updateData.country = body.country
    if (body.latitude !== undefined) updateData.latitude = body.latitude
    if (body.longitude !== undefined) updateData.longitude = body.longitude
    if (body.managerId !== undefined) updateData.manager_id = body.managerId
    if (body.thumbnailUrl !== undefined) updateData.thumbnail_url = body.thumbnailUrl
    if (body.metadata !== undefined) updateData.metadata = body.metadata

    // Update project
    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', params.id)
      .select(
        'id, code, name, description, type, client_id, contact_id, status, currency, start_date, end_date, address, city, country, latitude, longitude, manager_id, thumbnail_url, created_at, updated_at'
      )
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Projekti koodiga projekt on juba olemas' },
          { status: 409 }
        )
      }
      console.error('Error updating project:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const transformedData = {
      id: data.id,
      code: data.code,
      name: data.name,
      description: data.description,
      type: data.type,
      clientId: data.client_id,
      contactId: data.contact_id,
      status: data.status,
      currency: data.currency,
      startDate: data.start_date,
      endDate: data.end_date,
      address: data.address,
      city: data.city,
      country: data.country,
      latitude: data.latitude,
      longitude: data.longitude,
      managerId: data.manager_id,
      thumbnailUrl: data.thumbnail_url,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }

    return NextResponse.json(transformedData)
  } catch (error) {
    console.error('Error in PATCH /api/projects/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/projects/[id] - Delete a project (soft delete)
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
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

    // Soft delete project
    const { error } = await supabase
      .from('projects')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', params.id)

    if (error) {
      console.error('Error deleting project:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Error in DELETE /api/projects/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
