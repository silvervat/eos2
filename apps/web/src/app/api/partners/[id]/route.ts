/**
 * PARTNER DETAIL API
 * GET /api/partners/[id] - Get partner with contacts and relations
 * PATCH /api/partners/[id] - Update partner
 * DELETE /api/partners/[id] - Delete partner
 *
 * Robust against missing tables/columns in schema cache
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Helper to safely get field value with fallback
function safeGet<T>(obj: Record<string, unknown>, key: string, defaultValue: T): T {
  const value = obj?.[key]
  return value !== undefined && value !== null ? (value as T) : defaultValue
}

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

    // Fetch contacts - wrapped for robustness
    let contacts: Record<string, unknown>[] = []
    let contactsTableExists = true
    try {
      const { data: contactsData, error: contactsError } = await supabase
        .from('company_contacts')
        .select('*')
        .eq('company_id', id)
        .is('deleted_at', null)
        .order('is_primary', { ascending: false })
        .order('last_name', { ascending: true })

      if (contactsError) {
        if (contactsError.message.includes('company_contacts') || contactsError.code === '42P01') {
          contactsTableExists = false
        }
      }
      if (!contactsError && contactsData) {
        contacts = contactsData
      }
    } catch (e) {
      console.warn('Could not fetch contacts (table may not exist):', e)
      contactsTableExists = false
    }

    // Fetch invoices summary - wrapped
    let invoices: Record<string, unknown>[] = []
    let allInvoices: Record<string, unknown>[] = []
    try {
      const { data: invoicesData, error: invError } = await supabase
        .from('invoices')
        .select('id, invoice_number, type, status, total, issue_date')
        .eq('company_id', id)
        .is('deleted_at', null)
        .order('issue_date', { ascending: false })
        .limit(10)

      if (!invError && invoicesData) {
        invoices = invoicesData
      }

      // Calculate all invoices for stats
      const { data: allInvData, error: allInvError } = await supabase
        .from('invoices')
        .select('type, status, total')
        .eq('company_id', id)
        .is('deleted_at', null)

      if (!allInvError && allInvData) {
        allInvoices = allInvData
      }
    } catch (e) {
      console.warn('Could not fetch invoices:', e)
    }

    // Fetch projects - wrapped
    let projects: Record<string, unknown>[] = []
    try {
      const { data: projectsData, error: projError } = await supabase
        .from('projects')
        .select('id, code, name, status')
        .eq('client_id', id)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(10)

      if (!projError && projectsData) {
        projects = projectsData
      }
    } catch (e) {
      console.warn('Could not fetch projects:', e)
    }

    // Calculate statistics with safe access
    const stats = {
      totalInvoices: allInvoices.length,
      sentInvoices: allInvoices.filter(i => i.type === 'sales').length,
      receivedInvoices: allInvoices.filter(i => i.type === 'purchase').length,
      paidInvoices: allInvoices.filter(i => i.status === 'paid').length,
      totalRevenue: allInvoices
        .filter(i => i.type === 'sales')
        .reduce((sum, i) => sum + Number(i.total || 0), 0),
      totalExpenses: allInvoices
        .filter(i => i.type === 'purchase')
        .reduce((sum, i) => sum + Number(i.total || 0), 0),
      projectsCount: projects.length,
    }

    return NextResponse.json({
      partner: {
        id: company.id,
        registryCode: safeGet(company, 'registry_code', null),
        vatNumber: safeGet(company, 'vat_number', null),
        name: safeGet(company, 'name', 'Nimetu'),
        type: safeGet(company, 'type', 'client'),
        email: safeGet(company, 'email', null),
        phone: safeGet(company, 'phone', null),
        address: safeGet(company, 'address', null),
        city: safeGet(company, 'city', null),
        country: safeGet(company, 'country', 'Estonia'),
        bankAccount: safeGet(company, 'bank_account', null),
        paymentTermDays: safeGet(company, 'payment_term_days', 14),
        creditLimit: safeGet(company, 'credit_limit', null),
        notes: safeGet(company, 'notes', null),
        metadata: safeGet(company, 'metadata', {}),
        createdAt: company.created_at,
        updatedAt: company.updated_at,
      },
      contacts: contacts.map(c => ({
        id: c.id,
        firstName: safeGet(c, 'first_name', ''),
        lastName: safeGet(c, 'last_name', ''),
        email: safeGet(c, 'email', null),
        phone: safeGet(c, 'phone', null),
        mobile: safeGet(c, 'mobile', null),
        position: safeGet(c, 'position', null),
        department: safeGet(c, 'department', null),
        isPrimary: safeGet(c, 'is_primary', false),
        isBillingContact: safeGet(c, 'is_billing_contact', false),
      })),
      invoices: invoices.map(i => ({
        id: i.id,
        invoiceNumber: safeGet(i, 'invoice_number', ''),
        type: safeGet(i, 'type', 'sales'),
        status: safeGet(i, 'status', 'draft'),
        total: safeGet(i, 'total', 0),
        issueDate: safeGet(i, 'issue_date', null),
      })),
      projects: projects.map(p => ({
        id: p.id,
        code: safeGet(p, 'code', ''),
        name: safeGet(p, 'name', 'Nimetu'),
        status: safeGet(p, 'status', 'active'),
      })),
      stats,
      contactsTableExists,
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

    // Only include fields that exist in the database schema
    if (body.name !== undefined) updateData.name = body.name
    if (body.registryCode !== undefined) updateData.registry_code = body.registryCode
    if (body.vatNumber !== undefined) updateData.vat_number = body.vatNumber
    if (body.type !== undefined) updateData.type = body.type
    if (body.email !== undefined) updateData.email = body.email
    if (body.phone !== undefined) updateData.phone = body.phone
    if (body.address !== undefined) updateData.address = body.address
    if (body.city !== undefined) updateData.city = body.city
    if (body.country !== undefined) updateData.country = body.country
    if (body.notes !== undefined) updateData.notes = body.notes
    // Note: bank_account, payment_term_days, credit_limit, zip_code columns don't exist in schema

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
