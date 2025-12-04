/**
 * FILE COMMENTS API
 * GET /api/file-vault/comments - List comments for a file
 * POST /api/file-vault/comments - Create a new comment
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Force dynamic rendering since this route uses cookies
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const fileId = searchParams.get('fileId')

    if (!fileId) {
      return NextResponse.json({ error: 'fileId is required' }, { status: 400 })
    }

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch comments with user info
    const { data: comments, error } = await supabase
      .from('file_comments')
      .select(`
        id,
        content,
        parent_id,
        mentions,
        is_edited,
        edited_at,
        created_at,
        created_by
      `)
      .eq('file_id', fileId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 })
    }

    // Get user profiles for comment authors
    const userIds = [...new Set(comments?.map(c => c.created_by) || [])]
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('auth_user_id, full_name, avatar_url')
      .in('auth_user_id', userIds)

    const profileMap = new Map(profiles?.map(p => [p.auth_user_id, p]) || [])

    // Enrich comments with user info
    const enrichedComments = comments?.map(comment => ({
      ...comment,
      user: profileMap.get(comment.created_by) || { full_name: 'Unknown', avatar_url: null },
    }))

    // Organize into threads
    const rootComments = enrichedComments?.filter(c => !c.parent_id) || []
    const replies = enrichedComments?.filter(c => c.parent_id) || []

    const commentsWithReplies = rootComments.map(comment => ({
      ...comment,
      replies: replies.filter(r => r.parent_id === comment.id),
    }))

    return NextResponse.json({
      comments: commentsWithReplies,
      total: comments?.length || 0,
    })
  } catch (error) {
    console.error('Error in GET /api/file-vault/comments:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fileId, content, parentId, mentions } = body

    if (!fileId || !content?.trim()) {
      return NextResponse.json({ error: 'fileId and content are required' }, { status: 400 })
    }

    // Verify file exists
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select('id, vault_id')
      .eq('id', fileId)
      .is('deleted_at', null)
      .single()

    if (fileError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Create comment
    const { data: comment, error: insertError } = await supabase
      .from('file_comments')
      .insert({
        file_id: fileId,
        content: content.trim(),
        parent_id: parentId || null,
        mentions: mentions || [],
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating comment:', insertError)
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('full_name, avatar_url')
      .eq('auth_user_id', user.id)
      .single()

    // Log activity
    await supabase.from('file_accesses').insert({
      file_id: fileId,
      action: 'comment',
      user_id: user.id,
      details: { comment_id: comment.id },
    })

    return NextResponse.json({
      comment: {
        ...comment,
        user: profile || { full_name: 'Unknown', avatar_url: null },
        replies: [],
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/file-vault/comments:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
