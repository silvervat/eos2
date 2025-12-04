/**
 * FILE VAULT - Admin Statistics API
 * GET /api/file-vault/admin/stats - Get vault statistics
 */

import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// GET /api/file-vault/admin/stats - Get comprehensive vault statistics
export async function GET(request: Request) {
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

    // Get user's profile and tenant
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, tenant_id, role')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 })
    }

    // Parse query params
    const { searchParams } = new URL(request.url)
    const vaultId = searchParams.get('vaultId')

    // Get vault statistics
    let vaultQuery = supabase
      .from('file_vaults')
      .select('id, name, quota_bytes, used_bytes, file_count, folder_count, status, created_at')
      .eq('tenant_id', profile.tenant_id)
      .is('deleted_at', null)

    if (vaultId) {
      vaultQuery = vaultQuery.eq('id', vaultId)
    }

    const { data: vaults, error: vaultsError } = await vaultQuery

    if (vaultsError) {
      console.error('Error fetching vaults:', vaultsError)
      return NextResponse.json({ error: vaultsError.message }, { status: 500 })
    }

    // Calculate totals
    let totalQuotaBytes = 0
    let totalUsedBytes = 0
    let totalFileCount = 0
    let totalFolderCount = 0

    const vaultStats = vaults?.map(vault => {
      totalQuotaBytes += Number(vault.quota_bytes || 0)
      totalUsedBytes += Number(vault.used_bytes || 0)
      totalFileCount += Number(vault.file_count || 0)
      totalFolderCount += Number(vault.folder_count || 0)

      return {
        id: vault.id,
        name: vault.name,
        quotaBytes: vault.quota_bytes,
        usedBytes: vault.used_bytes,
        fileCount: vault.file_count || 0,
        folderCount: vault.folder_count || 0,
        usagePercent: Math.round((Number(vault.used_bytes || 0) / Number(vault.quota_bytes)) * 100),
        status: vault.status,
        createdAt: vault.created_at,
      }
    }) || []

    // Get file type distribution (for specific vault or all)
    const fileTypeQuery = vaultId
      ? supabase.from('files').select('category').eq('vault_id', vaultId).eq('is_trashed', false).is('deleted_at', null)
      : supabase.from('files').select('category, vault_id').eq('is_trashed', false).is('deleted_at', null)

    const { data: files } = await fileTypeQuery

    const filesByType: Record<string, number> = {}
    files?.forEach(file => {
      const category = file.category || 'other'
      filesByType[category] = (filesByType[category] || 0) + 1
    })

    // Get recent activities
    let activityQuery = supabase
      .from('file_activities')
      .select(`
        id,
        action,
        details,
        user_email,
        created_at,
        file:files!file_id(id, name),
        folder:file_folders!folder_id(id, name)
      `)
      .order('created_at', { ascending: false })
      .limit(20)

    if (vaultId) {
      activityQuery = activityQuery.eq('vault_id', vaultId)
    }

    const { data: activities } = await activityQuery

    const recentActivities = activities?.map(activity => ({
      id: activity.id,
      action: activity.action,
      details: activity.details,
      userEmail: activity.user_email,
      createdAt: activity.created_at,
      fileName: activity.file?.name,
      folderName: activity.folder?.name,
    })) || []

    // Get active shares count
    let sharesQuery = supabase
      .from('file_shares')
      .select('id, downloads_count, views_count, expires_at, is_active')
      .eq('is_active', true)

    if (vaultId) {
      sharesQuery = sharesQuery.eq('vault_id', vaultId)
    }

    const { data: shares } = await sharesQuery

    const activeShares = shares?.filter(s => s.is_active && (!s.expires_at || new Date(s.expires_at) > new Date())).length || 0
    const totalDownloads = shares?.reduce((sum, s) => sum + (s.downloads_count || 0), 0) || 0
    const totalViews = shares?.reduce((sum, s) => sum + (s.views_count || 0), 0) || 0

    // Get trash statistics
    let trashQuery = supabase
      .from('files')
      .select('id, size_bytes')
      .eq('is_trashed', true)
      .is('deleted_at', null)

    if (vaultId) {
      trashQuery = trashQuery.eq('vault_id', vaultId)
    }

    const { data: trashedFiles } = await trashQuery

    const trashedCount = trashedFiles?.length || 0
    const trashedSizeBytes = trashedFiles?.reduce((sum, f) => sum + Number(f.size_bytes), 0) || 0

    // Get largest files
    let largestFilesQuery = supabase
      .from('files')
      .select('id, name, size_bytes, mime_type, created_at')
      .eq('is_trashed', false)
      .is('deleted_at', null)
      .order('size_bytes', { ascending: false })
      .limit(10)

    if (vaultId) {
      largestFilesQuery = largestFilesQuery.eq('vault_id', vaultId)
    }

    const { data: largestFiles } = await largestFilesQuery

    // Get upload activity by day (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    let uploadActivityQuery = supabase
      .from('file_activities')
      .select('created_at')
      .eq('action', 'upload')
      .gte('created_at', thirtyDaysAgo.toISOString())

    if (vaultId) {
      uploadActivityQuery = uploadActivityQuery.eq('vault_id', vaultId)
    }

    const { data: uploadActivity } = await uploadActivityQuery

    const uploadsByDay: Record<string, number> = {}
    uploadActivity?.forEach(activity => {
      const date = new Date(activity.created_at).toISOString().split('T')[0]
      uploadsByDay[date] = (uploadsByDay[date] || 0) + 1
    })

    return NextResponse.json({
      summary: {
        totalVaults: vaults?.length || 0,
        totalQuotaBytes,
        totalUsedBytes,
        totalUsagePercent: Math.round((totalUsedBytes / totalQuotaBytes) * 100) || 0,
        totalFileCount,
        totalFolderCount,
        activeShares,
        totalShareDownloads: totalDownloads,
        totalShareViews: totalViews,
        trashedFiles: trashedCount,
        trashedSizeBytes,
      },
      vaults: vaultStats,
      filesByType,
      largestFiles: largestFiles?.map(f => ({
        id: f.id,
        name: f.name,
        sizeBytes: f.size_bytes,
        mimeType: f.mime_type,
        createdAt: f.created_at,
      })) || [],
      recentActivities,
      uploadsByDay,
    })

  } catch (error) {
    console.error('Error in GET /api/file-vault/admin/stats:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
