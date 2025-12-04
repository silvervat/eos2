/**
 * PARTNER CONTACTS API
 * GET /api/partners/[id]/contacts - List contacts for a partner
 * POST /api/partners/[id]/contacts - Create a contact
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/partners/[id]/contacts
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

    const { id } = params

    const { data: contacts, error } = await supabase
      .from('company_contacts')
      .select('*')
      .eq('company_id', id)
      .is('deleted_at', null)
      .order('is_primary', { ascending: false })
      .order('last_name', { ascending: true })

    if (error) {
      console.error('Error fetching contacts:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      contacts: contacts?.map(c => ({
        id: c.id,
        firstName: c.first_name,
        lastName: c.last_name,
        fullName: `${c.first_name} ${c.last_name}`,
        email: c.email,
        phone: c.phone,
        mobile: c.mobile,
        position: c.position,
        department: c.department,
        isPrimary: c.is_primary,
        isBillingContact: c.is_billing_contact,
        notes: c.notes,
        createdAt: c.created_at,
      })) || [],
    })
  } catch (error) {
    console.error('Error in GET /api/partners/[id]/contacts:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/partners/[id]/contacts
export async function POST(
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

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 })
    }

    const { id } = params
    const body = await request.json()

    if (!body.firstName || !body.lastName) {
      return NextResponse.json({ error: 'Ees- ja perekonnanimi on kohustuslikud' }, { status: 400 })
    }

    // If this is primary contact, unset other primary contacts
    if (body.isPrimary) {
      await supabase
        .from('company_contacts')
        .update({ is_primary: false })
        .eq('company_id', id)
    }

    const { data, error } = await supabase
      .from('company_contacts')
      .insert({
        tenant_id: profile.tenant_id,
        company_id: id,
        first_name: body.firstName,
        last_name: body.lastName,
        email: body.email || null,
        phone: body.phone || null,
        mobile: body.mobile || null,
        position: body.position || null,
        department: body.department || null,
        is_primary: body.isPrimary || false,
        is_billing_contact: body.isBillingContact || false,
        notes: body.notes || null,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating contact:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      fullName: `${data.first_name} ${data.last_name}`,
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/partners/[id]/contacts:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
