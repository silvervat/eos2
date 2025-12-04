/**
 * QUOTE DETAIL API
 * GET /api/quotes/[id] - Get quote details
 * PUT /api/quotes/[id] - Update quote
 * DELETE /api/quotes/[id] - Delete quote
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/quotes/[id]
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

    // Get quote
    const { data: quote, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      console.error('Error fetching quote:', error)
      return NextResponse.json({ error: 'Pakkumist ei leitud' }, { status: 404 })
    }

    // Get company and contact info
    let company = null
    let contact = null

    if (quote.company_id) {
      const { data: companyData } = await supabase
        .from('companies')
        .select('id, name')
        .eq('id', quote.company_id)
        .single()
      company = companyData
    }

    if (quote.contact_id) {
      const { data: contactData } = await supabase
        .from('company_contacts')
        .select('id, first_name, last_name, email')
        .eq('id', quote.contact_id)
        .single()
      contact = contactData
    }

    // Get project info
    let project = null
    if (quote.project_id) {
      const { data: projectData } = await supabase
        .from('projects')
        .select('id, code, name')
        .eq('id', quote.project_id)
        .single()
      project = projectData
    }

    // Get quote items
    const { data: items } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', id)
      .order('position', { ascending: true })

    // Get comments
    const { data: comments } = await supabase
      .from('quote_comments')
      .select('*')
      .eq('quote_id', id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    // Get revisions
    const { data: revisions } = await supabase
      .from('quotes')
      .select('id, revision, quote_number, created_at, status')
      .or(`id.eq.${id},previous_revision_id.eq.${id},next_revision_id.eq.${id}`)
      .is('deleted_at', null)
      .order('revision', { ascending: true })

    return NextResponse.json({
      quote: {
        id: quote.id,
        quoteNumber: quote.quote_number,
        revision: quote.revision,
        revisionNumber: quote.revision_number || quote.revision,
        year: quote.year,
        sequenceNumber: quote.sequence_number,
        title: quote.title,
        description: quote.description,
        language: quote.language || 'et',
        status: quote.status,
        validUntil: quote.valid_until,
        validDays: quote.valid_days || 30,
        sentAt: quote.sent_at,
        viewedAt: quote.viewed_at,
        respondedAt: quote.responded_at,
        createdAt: quote.created_at,
        updatedAt: quote.updated_at,
        companyId: quote.company_id,
        companyName: company?.name,
        contactId: quote.contact_id,
        contactName: contact ? `${contact.first_name} ${contact.last_name}` : null,
        contactEmail: contact?.email,
        projectId: quote.project_id,
        projectName: project ? `${project.code} - ${project.name}` : null,
        subtotal: quote.subtotal,
        discountAmount: quote.discount_amount,
        discountPercent: quote.discount_percent,
        vatAmount: quote.vat_amount,
        total: quote.total,
        currency: quote.currency || 'EUR',
        notesEt: quote.notes_et || quote.notes,
        notesEn: quote.notes_en,
        termsEt: quote.terms_et || quote.terms_and_conditions,
        termsEn: quote.terms_en,
        internalNotes: quote.internal_notes,
        filesFolder: quote.files_folder,
        pdfUrls: {
          et: quote.pdf_url_et,
          en: quote.pdf_url_en,
        },
        isLatestRevision: quote.is_latest_revision,
        previousRevisionId: quote.previous_revision_id,
        nextRevisionId: quote.next_revision_id,
        createdBy: quote.created_by,
      },
      items: items?.map((item) => ({
        id: item.id,
        quoteId: item.quote_id,
        groupId: item.group_id,
        articleId: item.article_id,
        position: item.position,
        code: item.code,
        name: item.name,
        nameEt: item.name_et || item.name,
        nameEn: item.name_en,
        description: item.description,
        descriptionEt: item.description_et || item.description,
        descriptionEn: item.description_en,
        quantity: item.quantity,
        unit: item.unit,
        unitId: item.unit_id,
        unitPrice: item.unit_price,
        discountPercent: item.discount_percent,
        vatRate: item.vat_rate,
        subtotal: item.subtotal,
        vatAmount: item.vat_amount,
        total: item.total,
        notes: item.notes,
        notesEt: item.notes_et || item.notes,
        notesEn: item.notes_en,
      })) || [],
      comments: comments?.map((c) => ({
        id: c.id,
        quoteId: c.quote_id,
        userId: c.user_id,
        userName: c.user_name,
        text: c.text,
        mentions: c.mentions || [],
        attachments: c.attachments || [],
        isEdited: c.is_edited,
        createdAt: c.created_at,
        updatedAt: c.updated_at,
      })) || [],
      revisions: revisions?.map((r) => ({
        id: r.id,
        revisionNumber: r.revision,
        quoteNumber: r.quote_number,
        createdAt: r.created_at,
        status: r.status,
      })) || [],
    })
  } catch (error) {
    console.error('Error in GET /api/quotes/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PUT /api/quotes/[id]
export async function PUT(
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

    // Build update object
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      last_modified_by: user.id,
    }

    // Map fields
    if (body.title !== undefined) updateData.title = body.title
    if (body.description !== undefined) updateData.description = body.description
    if (body.language !== undefined) updateData.language = body.language
    if (body.status !== undefined) {
      updateData.status = body.status
      if (body.status === 'sent' && !body.sentAt) {
        updateData.sent_at = new Date().toISOString()
      }
    }
    if (body.validUntil !== undefined) updateData.valid_until = body.validUntil
    if (body.validDays !== undefined) updateData.valid_days = body.validDays
    if (body.companyId !== undefined) updateData.company_id = body.companyId
    if (body.contactId !== undefined) updateData.contact_id = body.contactId
    if (body.projectId !== undefined) updateData.project_id = body.projectId
    if (body.notesEt !== undefined) {
      updateData.notes_et = body.notesEt
      updateData.notes = body.notesEt // Also update legacy field
    }
    if (body.notesEn !== undefined) updateData.notes_en = body.notesEn
    if (body.termsEt !== undefined) {
      updateData.terms_et = body.termsEt
      updateData.terms_and_conditions = body.termsEt
    }
    if (body.termsEn !== undefined) updateData.terms_en = body.termsEn
    if (body.internalNotes !== undefined) updateData.internal_notes = body.internalNotes
    if (body.subtotal !== undefined) updateData.subtotal = body.subtotal
    if (body.vatAmount !== undefined) updateData.vat_amount = body.vatAmount
    if (body.total !== undefined) updateData.total = body.total

    // Update quote
    const { data: quote, error } = await supabase
      .from('quotes')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating quote:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Update items if provided
    if (body.items && Array.isArray(body.items)) {
      // Delete existing items
      await supabase
        .from('quote_items')
        .delete()
        .eq('quote_id', id)

      // Insert new items
      if (body.items.length > 0) {
        const itemsToInsert = body.items.map((item: Record<string, unknown>, index: number) => ({
          quote_id: id,
          article_id: item.articleId || null,
          group_id: item.groupId || null,
          position: item.position ?? index,
          code: item.code || '',
          name: item.nameEt || item.name || '',
          name_et: item.nameEt || item.name || '',
          name_en: item.nameEn || item.nameEt || item.name || '',
          description: item.descriptionEt || item.description || null,
          description_et: item.descriptionEt || item.description || null,
          description_en: item.descriptionEn || null,
          quantity: item.quantity || 1,
          unit: item.unit || 'tk',
          unit_id: item.unitId || null,
          unit_price: item.unitPrice || 0,
          discount_percent: item.discountPercent || 0,
          vat_rate: item.vatRate || 22,
          subtotal: item.subtotal || 0,
          vat_amount: item.vatAmount || 0,
          total: item.total || 0,
          notes: item.notesEt || item.notes || null,
          notes_et: item.notesEt || item.notes || null,
          notes_en: item.notesEn || null,
        }))

        const { error: itemsError } = await supabase
          .from('quote_items')
          .insert(itemsToInsert)

        if (itemsError) {
          console.error('Error inserting items:', itemsError)
        }
      }
    }

    return NextResponse.json({
      id: quote.id,
      quoteNumber: quote.quote_number,
      title: quote.title,
      status: quote.status,
    })
  } catch (error) {
    console.error('Error in PUT /api/quotes/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/quotes/[id]
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

    // Soft delete
    const { error } = await supabase
      .from('quotes')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error deleting quote:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/quotes/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
