/**
 * PARTNERS API
 * GET /api/partners - List all partners (companies)
 * POST /api/partners - Create a new partner
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/partners - List partners with contacts and statistics
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

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') // client, supplier, subcontractor
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const includeStats = searchParams.get('includeStats') === 'true'

    // Build query
    let query = supabase
      .from('companies')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('name', { ascending: true })

    if (type) {
      query = query.eq('type', type)
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,registry_code.ilike.%${search}%,email.ilike.%${search}%`)
    }

    query = query.range(offset, offset + limit - 1)

    const { data: companies, error, count } = await query

    if (error) {
      console.error('Error fetching partners:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch contacts count for each company
    const companyIds = companies?.map(c => c.id) || []

    let contactsCounts: Record<string, number> = {}
    if (companyIds.length > 0) {
      const { data: contactsData } = await supabase
        .from('company_contacts')
        .select('company_id')
        .in('company_id', companyIds)
        .is('deleted_at', null)

      if (contactsData) {
        contactsData.forEach(c => {
          contactsCounts[c.company_id] = (contactsCounts[c.company_id] || 0) + 1
        })
      }
    }

    // Optionally fetch statistics
    let stats: Record<string, { invoices: number; projects: number; quotes: number }> = {}
    if (includeStats && companyIds.length > 0) {
      // Count invoices
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('company_id')
        .in('company_id', companyIds)
        .is('deleted_at', null)

      // Count projects
      const { data: projectsData } = await supabase
        .from('projects')
        .select('client_id')
        .in('client_id', companyIds)
        .is('deleted_at', null)

      companyIds.forEach(id => {
        stats[id] = {
          invoices: invoicesData?.filter(i => i.company_id === id).length || 0,
          projects: projectsData?.filter(p => p.client_id === id).length || 0,
          quotes: 0, // Will be added when quotes table exists
        }
      })
    }

    // Transform response
    const partners = companies?.map(company => ({
      id: company.id,
      registryCode: company.registry_code,
      vatNumber: company.vat_number,
      name: company.name,
      type: company.type,
      email: company.email,
      phone: company.phone,
      address: company.address,
      city: company.city,
      country: company.country,
      bankAccount: company.bank_account,
      paymentTermDays: company.payment_term_days,
      creditLimit: company.credit_limit,
      notes: company.notes,
      metadata: company.metadata,
      contactsCount: contactsCounts[company.id] || 0,
      stats: stats[company.id] || null,
      createdAt: company.created_at,
      updatedAt: company.updated_at,
    })) || []

    return NextResponse.json({
      partners,
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0),
      },
    })
  } catch (error) {
    console.error('Error in GET /api/partners:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/partners - Create new partner
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

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 })
    }

    const body = await request.json()

    if (!body.name) {
      return NextResponse.json({ error: 'Ettevõtte nimi on kohustuslik' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('companies')
      .insert({
        tenant_id: profile.tenant_id,
        registry_code: body.registryCode || null,
        vat_number: body.vatNumber || null,
        name: body.name,
        type: body.type || 'client',
        email: body.email || null,
        phone: body.phone || null,
        address: body.address || null,
        city: body.city || null,
        country: body.country || 'Estonia',
        bank_account: body.bankAccount || null,
        payment_term_days: body.paymentTermDays || 14,
        credit_limit: body.creditLimit || null,
        notes: body.notes || null,
        metadata: body.metadata || {},
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating partner:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Selle registrikoodiga ettevõte on juba olemas' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      id: data.id,
      name: data.name,
      registryCode: data.registry_code,
      type: data.type,
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/partners:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
