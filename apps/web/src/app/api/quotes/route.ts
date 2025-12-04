/**
 * QUOTES API
 * GET /api/quotes - List all quotes
 * POST /api/quotes - Create a new quote
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/quotes
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
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('quotes')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`quote_number.ilike.%${search}%,title.ilike.%${search}%`)
    }

    query = query.range(offset, offset + limit - 1)

    const { data: quotes, error, count } = await query

    if (error) {
      console.error('Error fetching quotes:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch company names
    const companyIds = [...new Set(quotes?.map(q => q.company_id).filter(Boolean))]
    let companies: Record<string, string> = {}
    if (companyIds.length > 0) {
      const { data: companiesData } = await supabase
        .from('companies')
        .select('id, name')
        .in('id', companyIds)

      companiesData?.forEach(c => {
        companies[c.id] = c.name
      })
    }

    return NextResponse.json({
      quotes: quotes?.map(q => ({
        id: q.id,
        quoteNumber: q.quote_number,
        revision: q.revision,
        title: q.title,
        description: q.description,
        status: q.status,
        companyId: q.company_id,
        companyName: companies[q.company_id] || null,
        validUntil: q.valid_until,
        sentAt: q.sent_at,
        subtotal: q.subtotal,
        discountAmount: q.discount_amount,
        vatAmount: q.vat_amount,
        total: q.total,
        currency: q.currency,
        createdAt: q.created_at,
        updatedAt: q.updated_at,
      })) || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0),
      },
    })
  } catch (error) {
    console.error('Error in GET /api/quotes:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/quotes
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

    if (!body.title) {
      return NextResponse.json({ error: 'Pealkiri on kohustuslik' }, { status: 400 })
    }

    // Generate quote number
    const { count } = await supabase
      .from('quotes')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', profile.tenant_id)

    const quoteNumber = `HP-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`

    const { data, error } = await supabase
      .from('quotes')
      .insert({
        tenant_id: profile.tenant_id,
        quote_number: quoteNumber,
        revision: 1,
        inquiry_id: body.inquiryId || null,
        company_id: body.companyId || null,
        contact_id: body.contactId || null,
        project_id: body.projectId || null,
        title: body.title,
        description: body.description || null,
        status: 'draft',
        valid_until: body.validUntil || null,
        currency: body.currency || 'EUR',
        terms_and_conditions: body.termsAndConditions || null,
        notes: body.notes || null,
        created_by: user.id,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating quote:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      id: data.id,
      quoteNumber: data.quote_number,
      title: data.title,
      status: data.status,
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/quotes:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
