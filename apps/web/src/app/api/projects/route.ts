import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Helper to safely get value from object with fallback
function safeGet<T>(obj: Record<string, unknown>, key: string, defaultValue: T): T {
  const value = obj?.[key]
  return value !== undefined && value !== null ? (value as T) : defaultValue
}

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

    // Use SELECT * to avoid column not found errors
    let query = supabase
      .from('projects')
      .select('*', { count: 'exact' })
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
      // Only search in name to avoid column errors
      query = query.ilike('name', `%${search}%`)
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1)

    const { data: projects, error, count } = await query

    if (error) {
      console.error('Error fetching projects:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Collect unique client_ids and contact_ids for batch fetching
    const clientIds = [
      ...new Set(
        (projects || [])
          .map((p: Record<string, unknown>) => p.client_id)
          .filter(Boolean)
      ),
    ]
    const contactIds = [
      ...new Set(
        (projects || [])
          .map((p: Record<string, unknown>) => p.contact_id)
          .filter(Boolean)
      ),
    ]

    // Fetch companies in batch
    let companiesMap: Record<string, { id: string; name: string }> = {}
    if (clientIds.length > 0) {
      const { data: companies } = await supabase
        .from('companies')
        .select('id, name')
        .in('id', clientIds)

      if (companies) {
        companiesMap = Object.fromEntries(companies.map((c) => [c.id, c]))
      }
    }

    // Fetch contacts in batch
    let contactsMap: Record<
      string,
      { id: string; first_name: string; last_name: string; email: string; phone: string }
    > = {}
    if (contactIds.length > 0) {
      const { data: contacts } = await supabase
        .from('company_contacts')
        .select('id, first_name, last_name, email, phone')
        .in('id', contactIds)

      if (contacts) {
        contactsMap = Object.fromEntries(contacts.map((c) => [c.id, c]))
      }
    }

    // Transform data - safely handle missing columns
    const transformedData = (projects || []).map((project: Record<string, unknown>) => {
      const clientId = safeGet<string | null>(project, 'client_id', null)
      const contactId = safeGet<string | null>(project, 'contact_id', null)
      const client = clientId ? companiesMap[clientId] : null
      const contact = contactId ? contactsMap[contactId] : null
      const id = safeGet<string>(project, 'id', '')

      return {
        id,
        code: safeGet(project, 'code', id?.slice(0, 8) || ''),
        name: safeGet(project, 'name', 'Nimetu projekt'),
        description: safeGet<string | null>(project, 'description', null),
        type: safeGet(project, 'type', 'ptv'),
        clientId,
        client: client ? { id: client.id, name: client.name } : null,
        contactId,
        contact: contact
          ? {
              id: contact.id,
              name: `${contact.first_name} ${contact.last_name}`.trim(),
              email: contact.email,
              phone: contact.phone,
            }
          : null,
        status: safeGet(project, 'status', 'starting'),
        currency: safeGet(project, 'currency', 'EUR'),
        startDate: safeGet<string | null>(project, 'start_date', null),
        endDate: safeGet<string | null>(project, 'end_date', null),
        address: safeGet<string | null>(project, 'address', null),
        city: safeGet<string | null>(project, 'city', null),
        country: safeGet(project, 'country', 'Estonia'),
        latitude: safeGet<number | null>(project, 'latitude', null),
        longitude: safeGet<number | null>(project, 'longitude', null),
        managerId: safeGet<string | null>(project, 'manager_id', null),
        thumbnailUrl: safeGet<string | null>(project, 'thumbnail_url', null),
        createdAt: safeGet(project, 'created_at', new Date().toISOString()),
        updatedAt: safeGet(project, 'updated_at', new Date().toISOString()),
      }
    })

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

    // Validate - only name is truly required
    if (!body.name) {
      return NextResponse.json({ error: 'Projekti nimi on kohustuslik' }, { status: 400 })
    }

    // Generate code if not provided
    const code = body.code || `PRJ-${Date.now().toString(36).toUpperCase()}`

    // Build insert data dynamically - only add fields that have values
    // Note: client_id, contact_id, manager_id require migration 027_ensure_projects_columns.sql
    const insertData: Record<string, unknown> = {
      tenant_id: profile.tenant_id,
      name: body.name,
    }

    // Add optional fields only if they have values
    // Core fields that should always exist
    if (code) insertData.code = code
    if (body.description) insertData.description = body.description
    if (body.type) insertData.type = body.type
    if (body.status) insertData.status = body.status
    if (body.currency) insertData.currency = body.currency
    if (body.startDate) insertData.start_date = body.startDate
    if (body.endDate) insertData.end_date = body.endDate
    if (body.address) insertData.address = body.address
    if (body.city) insertData.city = body.city
    if (body.country) insertData.country = body.country
    if (body.metadata) insertData.metadata = body.metadata

    // Create project using SELECT *
    const { data, error } = await supabase
      .from('projects')
      .insert(insertData)
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

    // Transform response safely
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

    return NextResponse.json(transformedData, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/projects:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
