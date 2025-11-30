/**
 * FILE VAULT - Comments API Route
 * GET /api/file-vault/files/[id]/comments - Get comments
 * POST /api/file-vault/files/[id]/comments - Add comment
 */

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET - Get comments for file
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const fileId = params.id

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get comments with user info
    const { data: comments, error } = await supabase
      .from('file_comments')
      .select(`
        id,
        content,
        position_x,
        position_y,
        marker_number,
        parent_id,
        is_resolved,
        resolved_at,
        created_at,
        updated_at,
        created_by
      `)
      .eq('file_id', fileId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get user profiles for comment authors
    const userIds = [...new Set(comments?.map(c => c.created_by) || [])]
    const { data: users } = await supabase
      .from('user_profiles')
      .select('auth_user_id, full_name, avatar_url')
      .in('auth_user_id', userIds)

    const userMap = new Map(users?.map(u => [u.auth_user_id, u]) || [])

    // Separate location-based and general comments
    const locationComments = comments?.filter(c => c.position_x !== null) || []
    const generalComments = comments?.filter(c => c.position_x === null) || []

    // Transform with user data
    const transformComment = (comment: any) => ({
      id: comment.id,
      content: comment.content,
      positionX: comment.position_x,
      positionY: comment.position_y,
      markerNumber: comment.marker_number,
      parentId: comment.parent_id,
      isResolved: comment.is_resolved,
      resolvedAt: comment.resolved_at,
      createdAt: comment.created_at,
      updatedAt: comment.updated_at,
      author: userMap.get(comment.created_by) || { full_name: 'Unknown', avatar_url: null },
    })

    return NextResponse.json({
      locationComments: locationComments.map(transformComment),
      generalComments: generalComments.map(transformComment),
      totalCount: comments?.length || 0,
    })
  } catch (error) {
    console.error('Error in GET /api/file-vault/files/[id]/comments:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// POST - Add comment
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const fileId = params.id

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, tenant_id, full_name, avatar_url')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 })
    }

    // Get file to verify access
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select(`
        id,
        vault_id,
        vault:file_vaults!vault_id(id, tenant_id)
      `)
      .eq('id', fileId)
      .is('deleted_at', null)
      .single()

    if (fileError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    if ((file.vault as any)?.tenant_id !== profile.tenant_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Parse request body
    const body = await request.json()
    const { content, positionX, positionY, parentId } = body

    if (!content || content.trim().length === 0) {
      return NextResponse.json({ error: 'Comment content is required' }, { status: 400 })
    }

    // Get marker number if this is a location-based comment
    let markerNumber = null
    if (positionX !== undefined && positionY !== undefined) {
      const { data: maxMarker } = await supabase
        .from('file_comments')
        .select('marker_number')
        .eq('file_id', fileId)
        .not('position_x', 'is', null)
        .is('deleted_at', null)
        .order('marker_number', { ascending: false })
        .limit(1)
        .single()

      markerNumber = (maxMarker?.marker_number || 0) + 1
    }

    // Create comment
    const { data: comment, error: insertError } = await supabaseAdmin
      .from('file_comments')
      .insert({
        file_id: fileId,
        vault_id: file.vault_id,
        content: content.trim(),
        position_x: positionX ?? null,
        position_y: positionY ?? null,
        marker_number: markerNumber,
        parent_id: parentId || null,
        created_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error creating comment:', insertError)
      return NextResponse.json({ error: 'Failed to create comment' }, { status: 500 })
    }

    // Log activity
    await supabaseAdmin.from('file_activities').insert({
      vault_id: file.vault_id,
      file_id: fileId,
      action: 'comment',
      user_id: user.id,
      details: {
        commentId: comment.id,
        isLocationBased: markerNumber !== null,
        markerNumber,
      },
    })

    return NextResponse.json({
      id: comment.id,
      content: comment.content,
      positionX: comment.position_x,
      positionY: comment.position_y,
      markerNumber: comment.marker_number,
      parentId: comment.parent_id,
      isResolved: comment.is_resolved,
      createdAt: comment.created_at,
      author: {
        full_name: profile.full_name,
        avatar_url: profile.avatar_url,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/file-vault/files/[id]/comments:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// PATCH - Update comment (resolve/edit)
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

    const body = await request.json()
    const { commentId, content, isResolved } = body

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 })
    }

    const updates: Record<string, any> = {}
    if (content !== undefined) updates.content = content.trim()
    if (isResolved !== undefined) {
      updates.is_resolved = isResolved
      updates.resolved_at = isResolved ? new Date().toISOString() : null
      updates.resolved_by = isResolved ? user.id : null
    }

    const { data: comment, error: updateError } = await supabaseAdmin
      .from('file_comments')
      .update(updates)
      .eq('id', commentId)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating comment:', updateError)
      return NextResponse.json({ error: 'Failed to update comment' }, { status: 500 })
    }

    return NextResponse.json(comment)
  } catch (error) {
    console.error('Error in PATCH /api/file-vault/files/[id]/comments:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

// DELETE - Delete comment
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

    const { searchParams } = new URL(request.url)
    const commentId = searchParams.get('commentId')

    if (!commentId) {
      return NextResponse.json({ error: 'Comment ID is required' }, { status: 400 })
    }

    // Soft delete
    const { error: deleteError } = await supabaseAdmin
      .from('file_comments')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', commentId)
      .eq('created_by', user.id)

    if (deleteError) {
      console.error('Error deleting comment:', deleteError)
      return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/file-vault/files/[id]/comments:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
