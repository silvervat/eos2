/**
 * QUOTE UNITS API
 * GET /api/quotes/units - List units
 * POST /api/quotes/units - Create unit
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

    let query = supabase
      .from('quote_units')
      .select('*')
      .is('deleted_at', null)
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (category) {
      query = query.eq('category', category)
    }

    const { data: units, error } = await query

    if (error) {
      console.error('Error fetching units:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      units: units?.map(u => ({
        id: u.id,
        code: u.code,
        name: u.name,
        namePlural: u.name_plural,
        symbol: u.symbol,
        isDefault: u.is_default,
        category: u.category,
        conversionFactor: u.conversion_factor,
      })) || [],
    })
  } catch (error) {
    console.error('Error in GET /api/quotes/units:', error)
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
      .from('quote_units')
      .insert({
        tenant_id: profile.tenant_id,
        code: body.code,
        name: body.name,
        name_plural: body.namePlural || null,
        symbol: body.symbol || null,
        category: body.category || 'quantity',
        is_default: body.isDefault || false,
        conversion_factor: body.conversionFactor || 1,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating unit:', error)
      if (error.code === '23505') {
        return NextResponse.json({ error: 'Selle koodiga ühik on juba olemas' }, { status: 409 })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      id: data.id,
      code: data.code,
      name: data.name,
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/quotes/units:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
