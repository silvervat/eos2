import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/projects - List all projects
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
    const type = searchParams.get('type')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build query with relationships
    let query = supabase
      .from('projects')
      .select(
        `
        *,
        client:companies!client_id(id, name),
        contact:company_contacts!contact_id(id, first_name, last_name, email, phone)
      `,
        { count: 'exact' }
      )
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    // Apply filters
    if (type) {
      query = query.eq('type', type)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%,address.ilike.%${search}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching projects:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform data to match frontend interface
    const transformedData = (data || []).map((project) => ({
      id: project.id,
      code: project.code,
      name: project.name,
      description: project.description,
      type: project.type || 'ptv',
      clientId: project.client_id,
      client: project.client,
      contactId: project.contact_id,
      contact: project.contact
        ? {
            id: project.contact.id,
            name: `${project.contact.first_name} ${project.contact.last_name}`.trim(),
            email: project.contact.email,
            phone: project.contact.phone,
          }
        : null,
      status: project.status || 'starting',
      budget: project.budget,
      currency: project.currency,
      startDate: project.start_date,
      endDate: project.end_date,
      address: project.address,
      city: project.city,
      country: project.country,
      latitude: project.latitude,
      longitude: project.longitude,
      managerId: project.manager_id,
      thumbnailUrl: project.thumbnail_url,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    }))

    return NextResponse.json({
      data: transformedData,
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/projects:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/projects - Create a new project
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
    if (!body.code || !body.name) {
      return NextResponse.json({ error: 'Code and name are required' }, { status: 400 })
    }

    // Create project
    const { data, error } = await supabase
      .from('projects')
      .insert({
        tenant_id: profile.tenant_id,
        code: body.code,
        name: body.name,
        description: body.description || null,
        type: body.type || 'ptv',
        client_id: body.clientId || null,
        contact_id: body.contactId || null,
        status: body.status || 'starting',
        budget: body.budget || null,
        currency: body.currency || 'EUR',
        start_date: body.startDate || null,
        end_date: body.endDate || null,
        address: body.address || null,
        city: body.city || null,
        country: body.country || 'Estonia',
        latitude: body.latitude || null,
        longitude: body.longitude || null,
        manager_id: body.managerId || null,
        thumbnail_url: body.thumbnailUrl || null,
        metadata: body.metadata || {},
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating project:', error)
      if (error.code === '23505') {
        return NextResponse.json(
          { error: 'Projekti koodiga projekt on juba olemas' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Transform response
    const transformedData = {
      id: data.id,
      code: data.code,
      name: data.name,
      description: data.description,
      type: data.type,
      clientId: data.client_id,
      contactId: data.contact_id,
      status: data.status,
      budget: data.budget,
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

    return NextResponse.json(transformedData, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/projects:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
