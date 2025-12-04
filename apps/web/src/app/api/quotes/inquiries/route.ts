/**
 * INQUIRIES API
 * GET /api/quotes/inquiries - List inquiries
 * POST /api/quotes/inquiries - Create inquiry
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

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
      .from('inquiries')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('received_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`inquiry_number.ilike.%${search}%,subject.ilike.%${search}%`)
    }

    query = query.range(offset, offset + limit - 1)

    const { data: inquiries, error, count } = await query

    if (error) {
      console.error('Error fetching inquiries:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Fetch company names
    const companyIds = [...new Set(inquiries?.map(i => i.company_id).filter(Boolean))]
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
      inquiries: inquiries?.map(i => ({
        id: i.id,
        inquiryNumber: i.inquiry_number,
        subject: i.subject,
        description: i.description,
        status: i.status,
        priority: i.priority,
        source: i.source,
        companyId: i.company_id,
        companyName: companies[i.company_id] || null,
        receivedAt: i.received_at,
        responseDeadline: i.response_deadline,
        createdAt: i.created_at,
      })) || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
        hasMore: (offset + limit) < (count || 0),
      },
    })
  } catch (error) {
    console.error('Error in GET /api/quotes/inquiries:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

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

    if (!body.subject) {
      return NextResponse.json({ error: 'Teema on kohustuslik' }, { status: 400 })
    }

    // Generate inquiry number
    const { count } = await supabase
      .from('inquiries')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', profile.tenant_id)

    const inquiryNumber = `PR-${new Date().getFullYear()}-${String((count || 0) + 1).padStart(4, '0')}`

    const { data, error } = await supabase
      .from('inquiries')
      .insert({
        tenant_id: profile.tenant_id,
        inquiry_number: inquiryNumber,
        company_id: body.companyId || null,
        contact_id: body.contactId || null,
        project_id: body.projectId || null,
        subject: body.subject,
        description: body.description || null,
        status: 'new',
        priority: body.priority || 'normal',
        source: body.source || null,
        response_deadline: body.responseDeadline || null,
        notes: body.notes || null,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating inquiry:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      id: data.id,
      inquiryNumber: data.inquiry_number,
      subject: data.subject,
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/quotes/inquiries:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
