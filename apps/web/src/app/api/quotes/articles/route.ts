/**
 * QUOTE ARTICLES API
 * GET /api/quotes/articles - List articles
 * POST /api/quotes/articles - Create article
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
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = supabase
      .from('quote_articles')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (category) {
      query = query.eq('category', category)
    }

    if (search) {
      query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`)
    }

    query = query.range(offset, offset + limit - 1)

    const { data: articles, error, count } = await query

    if (error) {
      console.error('Error fetching articles:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      articles: articles?.map(a => ({
        id: a.id,
        code: a.code,
        name: a.name,
        description: a.description,
        category: a.category,
        unit: a.unit,
        defaultPrice: a.default_price,
        costPrice: a.cost_price,
        vatRate: a.vat_rate,
        isActive: a.is_active,
        createdAt: a.created_at,
      })) || [],
      pagination: {
        total: count || 0,
        limit,
        offset,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/quotes/articles:', error)
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

    if (!body.code || !body.name) {
      return NextResponse.json({ error: 'Kood ja nimi on kohustuslikud' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('quote_articles')
      .insert({
        tenant_id: profile.tenant_id,
        code: body.code,
        name: body.name,
        description: body.description || null,
        category: body.category || null,
        unit: body.unit || 'tk',
        default_price: body.defaultPrice || null,
        cost_price: body.costPrice || null,
        vat_rate: body.vatRate || 22,
        is_active: true,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating article:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Selle koodiga artikkel on juba olemas' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      id: data.id,
      code: data.code,
      name: data.name,
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/quotes/articles:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
