/**
 * PARTNER DETAIL API
 * GET /api/partners/[id] - Get partner with contacts and relations
 * PATCH /api/partners/[id] - Update partner
 * DELETE /api/partners/[id] - Delete partner
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/partners/[id] - Get partner details with all relations
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

    // Fetch company
    const { data: company, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error || !company) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 })
    }

    // Fetch contacts
    const { data: contacts } = await supabase
      .from('company_contacts')
      .select('*')
      .eq('company_id', id)
      .is('deleted_at', null)
      .order('is_primary', { ascending: false })
      .order('last_name', { ascending: true })

    // Fetch invoices summary
    const { data: invoices } = await supabase
      .from('invoices')
      .select('id, invoice_number, type, status, total, issue_date')
      .eq('company_id', id)
      .is('deleted_at', null)
      .order('issue_date', { ascending: false })
      .limit(10)

    // Fetch projects
    const { data: projects } = await supabase
      .from('projects')
      .select('id, code, name, status')
      .eq('client_id', id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(10)

    // Calculate statistics
    const { data: allInvoices } = await supabase
      .from('invoices')
      .select('type, status, total')
      .eq('company_id', id)
      .is('deleted_at', null)

    const stats = {
      totalInvoices: allInvoices?.length || 0,
      sentInvoices: allInvoices?.filter(i => i.type === 'sales').length || 0,
      receivedInvoices: allInvoices?.filter(i => i.type === 'purchase').length || 0,
      paidInvoices: allInvoices?.filter(i => i.status === 'paid').length || 0,
      totalRevenue: allInvoices?.filter(i => i.type === 'sales').reduce((sum, i) => sum + Number(i.total), 0) || 0,
      totalExpenses: allInvoices?.filter(i => i.type === 'purchase').reduce((sum, i) => sum + Number(i.total), 0) || 0,
      projectsCount: projects?.length || 0,
    }

    return NextResponse.json({
      partner: {
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
        createdAt: company.created_at,
        updatedAt: company.updated_at,
      },
      contacts: contacts?.map(c => ({
        id: c.id,
        firstName: c.first_name,
        lastName: c.last_name,
        email: c.email,
        phone: c.phone,
        mobile: c.mobile,
        position: c.position,
        department: c.department,
        isPrimary: c.is_primary,
        isBillingContact: c.is_billing_contact,
      })) || [],
      invoices: invoices?.map(i => ({
        id: i.id,
        invoiceNumber: i.invoice_number,
        type: i.type,
        status: i.status,
        total: i.total,
        issueDate: i.issue_date,
      })) || [],
      projects: projects?.map(p => ({
        id: p.id,
        code: p.code,
        name: p.name,
        status: p.status,
      })) || [],
      stats,
    })
  } catch (error) {
    console.error('Error in GET /api/partners/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PATCH /api/partners/[id] - Update partner
export async function PATCH(
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
    const body = await request.json()

    const updateData: Record<string, unknown> = {}

    if (body.name !== undefined) updateData.name = body.name
    if (body.registryCode !== undefined) updateData.registry_code = body.registryCode
    if (body.vatNumber !== undefined) updateData.vat_number = body.vatNumber
    if (body.type !== undefined) updateData.type = body.type
    if (body.email !== undefined) updateData.email = body.email
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.address !== undefined) updateData.address = body.address
    if (body.city !== undefined) updateData.city = body.city
    if (body.country !== undefined) updateData.country = body.country
    if (body.bankAccount !== undefined) updateData.bank_account = body.bankAccount
    if (body.paymentTermDays !== undefined) updateData.payment_term_days = body.paymentTermDays
    if (body.creditLimit !== undefined) updateData.credit_limit = body.creditLimit
    if (body.notes !== undefined) updateData.notes = body.notes

    const { data, error } = await supabase
      .from('companies')
      .update(updateData)
      .eq('id', id)
      .is('deleted_at', null)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating partner:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      id: data.id,
      name: data.name,
      type: data.type,
    })
  } catch (error) {
    console.error('Error in PATCH /api/partners/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/partners/[id] - Soft delete partner
export async function DELETE(
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

    const { error } = await supabase
      .from('companies')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error deleting partner:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/partners/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
