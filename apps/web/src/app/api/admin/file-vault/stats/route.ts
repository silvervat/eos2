/**
 * FILE VAULT - Admin Stats API Route
 * GET /api/admin/file-vault/stats - Get file vault statistics
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
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

    // Get vaults statistics
    const { data: vaults } = await supabase
      .from('file_vaults')
      .select('id, name, quota_bytes, used_bytes')
      .eq('tenant_id', profile.tenant_id)
      .is('deleted_at', null)

    // Calculate totals
    let totalQuota = BigInt(0)
    let totalUsed = BigInt(0)

    vaults?.forEach(vault => {
      totalQuota += BigInt(vault.quota_bytes || 0)
      totalUsed += BigInt(vault.used_bytes || 0)
    })

    // Get files count
    const vaultIds = vaults?.map(v => v.id) || []
    let totalFiles = 0
    let totalFolders = 0

    if (vaultIds.length > 0) {
      const { count: filesCount } = await supabase
        .from('files')
        .select('id', { count: 'exact', head: true })
        .in('vault_id', vaultIds)
        .is('deleted_at', null)

      totalFiles = filesCount || 0

      const { count: foldersCount } = await supabase
        .from('file_folders')
        .select('id', { count: 'exact', head: true })
        .in('vault_id', vaultIds)
        .is('deleted_at', null)

      totalFolders = foldersCount || 0
    }

    // Get files by type
    const { data: filesByType } = await supabase
      .from('files')
      .select('mime_type')
      .in('vault_id', vaultIds)
      .is('deleted_at', null)

    const typeStats: Record<string, number> = {
      images: 0,
      videos: 0,
      documents: 0,
      audio: 0,
      archives: 0,
      other: 0,
    }

    filesByType?.forEach(file => {
      const mimeType = file.mime_type || ''
      if (mimeType.startsWith('image/')) typeStats.images++
      else if (mimeType.startsWith('video/')) typeStats.videos++
      else if (mimeType.startsWith('audio/')) typeStats.audio++
      else if (mimeType === 'application/pdf' || mimeType.includes('document') || mimeType.includes('word') || mimeType.includes('excel') || mimeType.includes('spreadsheet')) typeStats.documents++
      else if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('rar') || mimeType.includes('tar')) typeStats.archives++
      else typeStats.other++
    })

    // Get shares count
    const { count: sharesCount } = await supabase
      .from('file_shares')
      .select('id', { count: 'exact', head: true })
      .in('vault_id', vaultIds)

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from('file_accesses')
      .select(`
        id,
        action,
        created_at,
        user_id,
        bytes_transferred,
        file:files!file_id(id, name)
      `)
      .order('created_at', { ascending: false })
      .limit(20)

    // Get active shares (not expired)
    const { data: activeShares } = await supabase
      .from('file_shares')
      .select(`
        id,
        short_code,
        file_id,
        folder_id,
        expires_at,
        downloads_count,
        access_count,
        created_at,
        file:files!file_id(id, name)
      `)
      .in('vault_id', vaultIds)
      .or('expires_at.is.null,expires_at.gt.now()')
      .order('created_at', { ascending: false })
      .limit(10)

    return NextResponse.json({
      overview: {
        totalFiles,
        totalFolders,
        totalVaults: vaults?.length || 0,
        activeShares: sharesCount || 0,
        totalQuotaBytes: totalQuota.toString(),
        usedBytes: totalUsed.toString(),
        usagePercent: totalQuota > 0 ? Math.round(Number(totalUsed * BigInt(100) / totalQuota)) : 0,
      },
      filesByType: typeStats,
      vaults: vaults?.map(vault => ({
        id: vault.id,
        name: vault.name,
        quotaBytes: vault.quota_bytes,
        usedBytes: vault.used_bytes,
        usagePercent: Math.round((Number(vault.used_bytes) / Number(vault.quota_bytes)) * 100),
      })) || [],
      recentActivity: recentActivity?.map(activity => ({
        id: activity.id,
        action: activity.action,
        createdAt: activity.created_at,
        userId: activity.user_id,
        bytesTransferred: activity.bytes_transferred,
        fileName: activity.file?.name || null,
      })) || [],
      activeShares: activeShares?.map(share => ({
        id: share.id,
        shortCode: share.short_code,
        fileId: share.file_id,
        folderId: share.folder_id,
        fileName: share.file?.name || null,
        expiresAt: share.expires_at,
        downloadsCount: share.downloads_count,
        accessCount: share.access_count,
        createdAt: share.created_at,
      })) || [],
    })
  } catch (error) {
    console.error('Error in GET /api/admin/file-vault/stats:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
