/**
 * INDIVIDUAL CONTACT API
 * GET /api/partners/[id]/contacts/[contactId] - Get single contact
 * PATCH /api/partners/[id]/contacts/[contactId] - Update contact
 * DELETE /api/partners/[id]/contacts/[contactId] - Delete contact
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/partners/[id]/contacts/[contactId]
export async function GET(
  request: Request,
  { params }: { params: { id: string; contactId: string } }
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

    const { contactId } = params

    const { data: contact, error } = await supabase
      .from('company_contacts')
      .select('*')
      .eq('id', contactId)
      .is('deleted_at', null)
      .single()

    if (error || !contact) {
      return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
    }

    return NextResponse.json({
      contact: {
        id: contact.id,
        companyId: contact.company_id,
        firstName: contact.first_name,
        lastName: contact.last_name,
        fullName: `${contact.first_name} ${contact.last_name}`,
        email: contact.email,
        phone: contact.phone,
        mobile: contact.mobile,
        position: contact.position,
        department: contact.department,
        isPrimary: contact.is_primary,
        isBillingContact: contact.is_billing_contact,
        notes: contact.notes,
        createdAt: contact.created_at,
        updatedAt: contact.updated_at,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/partners/[id]/contacts/[contactId]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PATCH /api/partners/[id]/contacts/[contactId]
export async function PATCH(
  request: Request,
  { params }: { params: { id: string; contactId: string } }
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

    const { id, contactId } = params
    const body = await request.json()

    // If setting as primary, unset other primary contacts first
    if (body.isPrimary === true) {
      await supabase
        .from('company_contacts')
        .update({ is_primary: false })
        .eq('company_id', id)
        .neq('id', contactId)
    }

    const updateData: Record<string, unknown> = {}
    if (body.firstName !== undefined) updateData.first_name = body.firstName
    if (body.lastName !== undefined) updateData.last_name = body.lastName
    if (body.email !== undefined) updateData.email = body.email
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.mobile !== undefined) updateData.mobile = body.mobile
    if (body.position !== undefined) updateData.position = body.position
    if (body.department !== undefined) updateData.department = body.department
    if (body.isPrimary !== undefined) updateData.is_primary = body.isPrimary
    if (body.isBillingContact !== undefined) updateData.is_billing_contact = body.isBillingContact
    if (body.notes !== undefined) updateData.notes = body.notes

    const { data, error } = await supabase
      .from('company_contacts')
      .update(updateData)
      .eq('id', contactId)
      .is('deleted_at', null)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating contact:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      id: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      fullName: `${data.first_name} ${data.last_name}`,
    })
  } catch (error) {
    console.error('Error in PATCH /api/partners/[id]/contacts/[contactId]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/partners/[id]/contacts/[contactId]
export async function DELETE(
  request: Request,
  { params }: { params: { id: string; contactId: string } }
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

    const { contactId } = params

    // Soft delete
    const { error } = await supabase
      .from('company_contacts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', contactId)

    if (error) {
      console.error('Error deleting contact:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/partners/[id]/contacts/[contactId]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
