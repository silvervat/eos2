import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET /api/partners/contacts - Get all contacts across all partners
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('company_contacts')
      .select(`
        id,
        first_name,
        last_name,
        email,
        phone,
        mobile,
        position,
        department,
        is_primary,
        is_billing_contact,
        created_at,
        company:companies(id, name, type)
      `)
      .is('deleted_at', null)
      .order('first_name', { ascending: true })
      .range(offset, offset + limit - 1)

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const { data: contacts, error } = await query

    if (error) {
      console.error('Error fetching contacts:', error)
      return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 })
    }

    return NextResponse.json({
      contacts: contacts || [],
      total: contacts?.length || 0,
    })
  } catch (error) {
    console.error('Error in contacts API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
