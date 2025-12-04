/**
 * QUOTE COMMENTS API
 * GET /api/quotes/[id]/comments - List comments
 * POST /api/quotes/[id]/comments - Add comment
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/quotes/[id]/comments
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

    const { data: comments, error } = await supabase
      .from('quote_comments')
      .select('*')
      .eq('quote_id', id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
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
    })
  } catch (error) {
    console.error('Error in GET /api/quotes/[id]/comments:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST /api/quotes/[id]/comments
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
      .select('tenant_id, first_name, last_name')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 })
    }

    const { id } = params
    const body = await request.json()

    if (!body.text?.trim()) {
      return NextResponse.json({ error: 'Kommentaar on kohustuslik' }, { status: 400 })
    }

    const userName = profile.first_name && profile.last_name
      ? `${profile.first_name} ${profile.last_name}`
      : user.email || 'Kasutaja'

    const { data: comment, error } = await supabase
      .from('quote_comments')
      .insert({
        tenant_id: profile.tenant_id,
        quote_id: id,
        user_id: user.id,
        user_name: userName,
        text: body.text.trim(),
        mentions: body.mentions || [],
        attachments: body.attachments || [],
        is_edited: false,
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error creating comment:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // TODO: Send notifications to mentioned users

    return NextResponse.json({
      id: comment.id,
      quoteId: comment.quote_id,
      userId: comment.user_id,
      userName: comment.user_name,
      text: comment.text,
      mentions: comment.mentions,
      attachments: comment.attachments,
      isEdited: comment.is_edited,
      createdAt: comment.created_at,
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/quotes/[id]/comments:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
