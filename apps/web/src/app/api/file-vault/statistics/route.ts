/**
 * FILE VAULT - Statistics API Route
 * GET /api/file-vault/statistics - Get vault statistics
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

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('id, tenant_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 })
    }

    const { searchParams } = new URL(request.url)
    const vaultId = searchParams.get('vaultId')
    const period = searchParams.get('period') || '30' // days

    // Get vault
    const { data: vault } = await supabase
      .from('file_vaults')
      .select('id, name, quota_bytes, used_bytes')
      .eq('tenant_id', profile.tenant_id)
      .eq(vaultId ? 'id' : 'tenant_id', vaultId || profile.tenant_id)
      .is('deleted_at', null)
      .single()

    if (!vault) {
      return NextResponse.json({ error: 'Vault not found' }, { status: 404 })
    }

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - parseInt(period))

    // Get file counts by type
    const { data: filesByType } = await supabase
      .from('files')
      .select('mime_type, size_bytes')
      .eq('vault_id', vault.id)
      .is('deleted_at', null)

    const typeStats: Record<string, { count: number; totalSize: number }> = {}
    filesByType?.forEach(file => {
      const category = file.mime_type?.split('/')[0] || 'other'
      if (!typeStats[category]) {
        typeStats[category] = { count: 0, totalSize: 0 }
      }
      typeStats[category].count++
      typeStats[category].totalSize += file.size_bytes || 0
    })

    // Get total counts
    const { count: totalFiles } = await supabase
      .from('files')
      .select('id', { count: 'exact', head: true })
      .eq('vault_id', vault.id)
      .is('deleted_at', null)

    const { count: totalFolders } = await supabase
      .from('file_folders')
      .select('id', { count: 'exact', head: true })
      .eq('vault_id', vault.id)
      .is('deleted_at', null)

    const { count: totalShares } = await supabase
      .from('file_shares')
      .select('id', { count: 'exact', head: true })
      .eq('vault_id', vault.id)

    const { count: totalComments } = await supabase
      .from('file_comments')
      .select('id', { count: 'exact', head: true })
      .eq('vault_id', vault.id)
      .is('deleted_at', null)

    // Get recent activities
    const { data: recentActivities } = await supabase
      .from('file_activities')
      .select(`
        id,
        action,
        details,
        created_at,
        user_id,
        file:files!file_id(name)
      `)
      .eq('vault_id', vault.id)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(50)

    // Activity breakdown
    const activityBreakdown: Record<string, number> = {}
    recentActivities?.forEach(activity => {
      activityBreakdown[activity.action] = (activityBreakdown[activity.action] || 0) + 1
    })

    // Get top uploaders
    const { data: uploaderStats } = await supabase
      .from('files')
      .select('created_by')
      .eq('vault_id', vault.id)
      .is('deleted_at', null)

    const uploaderCounts: Record<string, number> = {}
    uploaderStats?.forEach(file => {
      uploaderCounts[file.created_by] = (uploaderCounts[file.created_by] || 0) + 1
    })

    // Get download stats
    const { data: downloadStats } = await supabase
      .from('file_accesses')
      .select('file_id, bytes_transferred')
      .eq('action', 'download')
      .gte('created_at', startDate.toISOString())

    const totalDownloads = downloadStats?.length || 0
    const totalBytesTransferred = downloadStats?.reduce((sum, d) => sum + (d.bytes_transferred || 0), 0) || 0

    // Storage usage over time (simplified - last 7 entries)
    const { data: storageHistory } = await supabase
      .from('files')
      .select('created_at, size_bytes')
      .eq('vault_id', vault.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: true })

    // Calculate cumulative storage
    let cumulativeSize = 0
    const storageOverTime = storageHistory?.map(file => {
      cumulativeSize += file.size_bytes || 0
      return {
        date: file.created_at,
        totalBytes: cumulativeSize,
      }
    }) || []

    return NextResponse.json({
      vault: {
        id: vault.id,
        name: vault.name,
        quotaBytes: vault.quota_bytes,
        usedBytes: vault.used_bytes,
        usagePercent: vault.quota_bytes ? Math.round((vault.used_bytes / vault.quota_bytes) * 100) : 0,
      },
      counts: {
        totalFiles: totalFiles || 0,
        totalFolders: totalFolders || 0,
        totalShares: totalShares || 0,
        totalComments: totalComments || 0,
        totalDownloads,
      },
      filesByType: Object.entries(typeStats).map(([type, stats]) => ({
        type,
        count: stats.count,
        totalSize: stats.totalSize,
      })),
      activityBreakdown,
      recentActivities: recentActivities?.slice(0, 10).map(a => ({
        id: a.id,
        action: a.action,
        fileName: (a.file as any)?.name,
        createdAt: a.created_at,
      })),
      storageOverTime: storageOverTime.slice(-30), // Last 30 data points
      totalBytesTransferred,
      period: parseInt(period),
    })
  } catch (error) {
    console.error('Error in GET /api/file-vault/statistics:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
