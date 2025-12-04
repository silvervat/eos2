/**
 * QUOTE ARTICLE DETAIL API
 * GET /api/quotes/articles/[id] - Get article
 * PUT /api/quotes/articles/[id] - Update article
 * DELETE /api/quotes/articles/[id] - Delete article
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/quotes/articles/[id]
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

    const { data: article, error } = await supabase
      .from('quote_articles')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) {
      console.error('Error fetching article:', error)
      return NextResponse.json({ error: 'Artiklit ei leitud' }, { status: 404 })
    }

    return NextResponse.json({
      id: article.id,
      code: article.code,
      name: article.name,
      nameEt: article.name_et || article.name,
      nameEn: article.name_en,
      description: article.description,
      descriptionEt: article.description_et || article.description,
      descriptionEn: article.description_en,
      category: article.category,
      unit: article.unit,
      unitId: article.unit_id,
      defaultPrice: article.default_price,
      costPrice: article.cost_price,
      vatRate: article.vat_rate || 22,
      minPrice: article.min_price,
      maxPrice: article.max_price,
      avgPrice: article.avg_price,
      lastUsedPrice: article.last_used_price,
      usageCount: article.usage_count || 0,
      lastUsedAt: article.last_used_at,
      totalRevenue: article.total_revenue || 0,
      isActive: article.is_active !== false,
      createdAt: article.created_at,
      updatedAt: article.updated_at,
    })
  } catch (error) {
    console.error('Error in GET /api/quotes/articles/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PUT /api/quotes/articles/[id]
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
      updateData.name = body.nameEt
    }
    if (body.nameEn !== undefined) updateData.name_en = body.nameEn
    if (body.description !== undefined) updateData.description = body.description
    if (body.descriptionEt !== undefined) {
      updateData.description_et = body.descriptionEt
      updateData.description = body.descriptionEt
    }
    if (body.descriptionEn !== undefined) updateData.description_en = body.descriptionEn
    if (body.category !== undefined) updateData.category = body.category
    if (body.unit !== undefined) updateData.unit = body.unit
    if (body.unitId !== undefined) updateData.unit_id = body.unitId
    if (body.defaultPrice !== undefined) updateData.default_price = body.defaultPrice
    if (body.costPrice !== undefined) updateData.cost_price = body.costPrice
    if (body.vatRate !== undefined) updateData.vat_rate = body.vatRate
    if (body.isActive !== undefined) updateData.is_active = body.isActive

    const { data: article, error } = await supabase
      .from('quote_articles')
      .update(updateData)
      .eq('id', id)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating article:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      id: article.id,
      code: article.code,
      name: article.name,
    })
  } catch (error) {
    console.error('Error in PUT /api/quotes/articles/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE /api/quotes/articles/[id]
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

    // Check if article is used in any quote items
    const { count } = await supabase
      .from('quote_items')
      .select('id', { count: 'exact', head: true })
      .eq('article_id', id)

    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Artiklit ei saa kustutada, kuna seda kasutatakse pakkumistes' },
        { status: 400 }
      )
    }

    // Soft delete
    const { error } = await supabase
      .from('quote_articles')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) {
      console.error('Error deleting article:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/quotes/articles/[id]:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
