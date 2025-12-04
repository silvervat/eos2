/**
 * FILE VAULT - File Activity API Route
 * GET /api/file-vault/files/[id]/activity - Get file activity history
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient()
    const fileId = params.id

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, tenant_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 })
    }

    // Verify file exists and user has access
    const { data: file, error: fileError } = await supabase
      .from('files')
      .select(`
        id,
        vault_id,
        file_vaults!vault_id(tenant_id)
      `)
      .eq('id', fileId)
      .single()

    if (fileError || !file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Type assertion for the joined vault data (Supabase returns array for joins)
    const vaultArray = file.file_vaults as unknown as Array<{ tenant_id: string }> | null
    const vaultTenantId = vaultArray?.[0]?.tenant_id
    if (vaultTenantId !== profile.tenant_id) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 })
    }

    // Get activity history from file_accesses table
    const { data: activities, error: activityError } = await supabase
      .from('file_accesses')
      .select(`
        id,
        action,
        details,
        user_id,
        user_email,
        ip_address,
        bytes_transferred,
        created_at
      `)
      .eq('file_id', fileId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (activityError) {
      console.error('Error fetching activity:', activityError)
      return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 })
    }

    // Get user profiles for activity entries
    const userIds = [...new Set(activities?.filter(a => a.user_id).map(a => a.user_id) || [])]

    let userMap: Record<string, { fullName: string; email: string }> = {}

    if (userIds.length > 0) {
      const { data: users } = await supabase
        .from('user_profiles')
        .select('auth_user_id, full_name, email')
        .in('auth_user_id', userIds)

      if (users) {
        userMap = users.reduce((acc, u) => {
          acc[u.auth_user_id] = {
            fullName: u.full_name || 'Tundmatu',
            email: u.email || '',
          }
          return acc
        }, {} as Record<string, { fullName: string; email: string }>)
      }
    }

    // Transform activities
    const transformedActivities = activities?.map(activity => ({
      id: activity.id,
      action: activity.action,
      details: activity.details,
      createdAt: activity.created_at,
      bytesTransferred: activity.bytes_transferred,
      user: activity.user_id ? userMap[activity.user_id] : activity.user_email ? {
        fullName: activity.user_email,
        email: activity.user_email,
      } : null,
    })) || []

    return NextResponse.json({ activities: transformedActivities })
  } catch (error) {
    console.error('Error in GET /api/file-vault/files/[id]/activity:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
