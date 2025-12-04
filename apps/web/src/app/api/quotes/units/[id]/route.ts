/**
 * QUOTE UNIT DETAIL API
 * GET /api/quotes/units/[id] - Get unit
 * PUT /api/quotes/units/[id] - Update unit
 * DELETE /api/quotes/units/[id] - Delete unit
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/quotes/units/[id]
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

    const { data: unit, error } = await supabase
      .from('quote_units')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      console.error('Error fetching unit:', error)
      return NextResponse.json({ error: 'Ühikut ei leitud' }, { status: 404 })
    }

    return NextResponse.json({
      id: unit.id,
      code: unit.code,
      name: unit.name,
      nameEt: unit.name_et || unit.name,
      nameEn: unit.name_en,
      namePlural: unit.name_plural,
      namePluralEt: unit.name_plural_et || unit.name_plural,
      namePluralEn: unit.name_plural_en,
      symbol: unit.symbol,
      symbolEt: unit.symbol_et || unit.symbol,
      symbolEn: unit.symbol_en,
      category: unit.category,
      isDefault: unit.is_default,
      sortOrder: unit.sort_order || 0,
      isActive: unit.is_active !== false,
      conversionFactor: unit.conversion_factor || 1,
      createdAt: unit.created_at,
      updatedAt: unit.updated_at,
    })
  } catch (error) {
    console.error('Error in GET /api/quotes/units/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PUT /api/quotes/units/[id]
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
    }

    if (body.name !== undefined) updateData.name = body.name
    if (body.nameEt !== undefined) {
      updateData.name_et = body.nameEt
      updateData.name = body.nameEt // Also update main field
    }
    if (body.nameEn !== undefined) updateData.name_en = body.nameEn
    if (body.namePlural !== undefined) updateData.name_plural = body.namePlural
    if (body.namePluralEt !== undefined) {
      updateData.name_plural_et = body.namePluralEt
      updateData.name_plural = body.namePluralEt
    }
    if (body.namePluralEn !== undefined) updateData.name_plural_en = body.namePluralEn
    if (body.symbol !== undefined) updateData.symbol = body.symbol
    if (body.symbolEt !== undefined) {
      updateData.symbol_et = body.symbolEt
      updateData.symbol = body.symbolEt
    }
    if (body.symbolEn !== undefined) updateData.symbol_en = body.symbolEn
    if (body.category !== undefined) updateData.category = body.category
    if (body.isDefault !== undefined) updateData.is_default = body.isDefault
    if (body.sortOrder !== undefined) updateData.sort_order = body.sortOrder
    if (body.isActive !== undefined) updateData.is_active = body.isActive
    if (body.conversionFactor !== undefined) updateData.conversion_factor = body.conversionFactor

    const { data: unit, error } = await supabase
      .from('quote_units')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating unit:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      id: unit.id,
      code: unit.code,
      name: unit.name,
    })
  } catch (error) {
    console.error('Error in PUT /api/quotes/units/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/quotes/units/[id]
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

    // Check if unit is used in any quote items
    const { count } = await supabase
      .from('quote_items')
      .select('id', { count: 'exact', head: true })
      .eq('unit_id', id)

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Ühikut ei saa kustutada, kuna seda kasutatakse pakkumistes' },
        { status: 400 }
      )
    }

    // Soft delete
    const { error } = await supabase
      .from('quote_units')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error deleting unit:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/quotes/units/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
