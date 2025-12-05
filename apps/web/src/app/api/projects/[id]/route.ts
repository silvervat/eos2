import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Helper to safely get value from object with fallback
function safeGet<T>(obj: Record<string, unknown>, key: string, defaultValue: T): T {
  const value = obj?.[key]
  return value !== undefined && value !== null ? (value as T) : defaultValue
}

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

    // Use SELECT * to avoid column errors
    const { data, error } = await supabase
      .from('projects')
      .select('*')
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
    const clientId = safeGet<string | null>(data, 'client_id', null)
    let client = null
    if (clientId) {
      const { data: clientData } = await supabase
        .from('companies')
        .select('id, name')
        .eq('id', clientId)
        .single()
      client = clientData
    }

    // Fetch contact data if exists
    const contactId = safeGet<string | null>(data, 'contact_id', null)
    let contact = null
    if (contactId) {
      const { data: contactData } = await supabase
        .from('company_contacts')
        .select('id, first_name, last_name, email, phone')
        .eq('id', contactId)
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

    const id = safeGet<string>(data, 'id', '')
    const transformedData = {
      id,
      code: safeGet(data, 'code', id?.slice(0, 8) || ''),
      name: safeGet(data, 'name', 'Nimetu projekt'),
      description: safeGet<string | null>(data, 'description', null),
      type: safeGet(data, 'type', 'ptv'),
      clientId,
      client,
      contactId,
      contact,
      status: safeGet(data, 'status', 'starting'),
      currency: safeGet(data, 'currency', 'EUR'),
      startDate: safeGet<string | null>(data, 'start_date', null),
      endDate: safeGet<string | null>(data, 'end_date', null),
      address: safeGet<string | null>(data, 'address', null),
      city: safeGet<string | null>(data, 'city', null),
      country: safeGet(data, 'country', 'Estonia'),
      latitude: safeGet<number | null>(data, 'latitude', null),
      longitude: safeGet<number | null>(data, 'longitude', null),
      managerId: safeGet<string | null>(data, 'manager_id', null),
      thumbnailUrl: safeGet<string | null>(data, 'thumbnail_url', null),
      createdAt: safeGet(data, 'created_at', new Date().toISOString()),
      updatedAt: safeGet(data, 'updated_at', new Date().toISOString()),
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
    if (body.city !== undefined) updateData.city = body.city
    if (body.country !== undefined) updateData.country = body.country
    if (body.latitude !== undefined) updateData.latitude = body.latitude
    if (body.longitude !== undefined) updateData.longitude = body.longitude
    if (body.managerId !== undefined) updateData.manager_id = body.managerId
    if (body.thumbnailUrl !== undefined) updateData.thumbnail_url = body.thumbnailUrl
    if (body.metadata !== undefined) updateData.metadata = body.metadata

    // Update project using SELECT *
    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', params.id)
      .select('*')
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

    const id = safeGet<string>(data, 'id', '')
    const transformedData = {
      id,
      code: safeGet(data, 'code', id?.slice(0, 8) || ''),
      name: safeGet(data, 'name', 'Nimetu projekt'),
      description: safeGet<string | null>(data, 'description', null),
      type: safeGet(data, 'type', 'ptv'),
      clientId: safeGet<string | null>(data, 'client_id', null),
      contactId: safeGet<string | null>(data, 'contact_id', null),
      status: safeGet(data, 'status', 'starting'),
      currency: safeGet(data, 'currency', 'EUR'),
      startDate: safeGet<string | null>(data, 'start_date', null),
      endDate: safeGet<string | null>(data, 'end_date', null),
      address: safeGet<string | null>(data, 'address', null),
      city: safeGet<string | null>(data, 'city', null),
      country: safeGet(data, 'country', 'Estonia'),
      latitude: safeGet<number | null>(data, 'latitude', null),
      longitude: safeGet<number | null>(data, 'longitude', null),
      managerId: safeGet<string | null>(data, 'manager_id', null),
      thumbnailUrl: safeGet<string | null>(data, 'thumbnail_url', null),
      createdAt: safeGet(data, 'created_at', new Date().toISOString()),
      updatedAt: safeGet(data, 'updated_at', new Date().toISOString()),
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
