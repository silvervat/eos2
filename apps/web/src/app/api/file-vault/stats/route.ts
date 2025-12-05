/**
 * FILE VAULT - Statistics API
 * GET /api/file-vault/stats - Get vault statistics (uses materialized view)
 *
 * Fast statistics using pre-computed materialized view
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cacheGet, cacheSet, CACHE_TTL, withCache } from '@/lib/cache'
import { getVaultStatsCacheKey } from '@/lib/file-vault/cache-invalidation'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const startTime = Date.now()

  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const vaultId = searchParams.get('vaultId')

    if (!vaultId) {
      return NextResponse.json({ error: 'Vault ID is required' }, { status: 400 })
    }

    // Check cache first
    const cacheKey = getVaultStatsCacheKey(vaultId)
    const cached = await cacheGet<unknown>(cacheKey)

    if (cached) {
      const duration = Date.now() - startTime
      return NextResponse.json({
        stats: cached,
        _meta: { duration, cached: true },
      })
    }

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Validate vault access
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('auth_user_id', user.id)
      .single()

    if (!profile?.tenant_id) {
      return NextResponse.json({ error: 'User profile not found' }, { status: 400 })
    }

    const { data: vault } = await supabase
      .from('file_vaults')
      .select('tenant_id')
      .eq('id', vaultId)
      .is('deleted_at', null)
      .single()

    if (!vault || vault.tenant_id !== profile.tenant_id) {
      return NextResponse.json({ error: 'Vault not found or access denied' }, { status: 403 })
    }

    // Try to get stats from materialized view first (fast)
    let stats: Record<string, unknown> | null = null

    const { data: mvStats, error: mvError } = await supabase
      .from('file_vault_stats')
      .select('*')
      .eq('vault_id', vaultId)
      .single()

    if (!mvError && mvStats) {
      // Materialized view exists and has data
      stats = {
        totalFiles: mvStats.total_files,
        totalSizeBytes: mvStats.total_size_bytes,
        totalFolders: mvStats.total_folders,
        lastUploadAt: mvStats.last_upload_at,
        firstUploadAt: mvStats.first_upload_at,
        byType: {
          images: mvStats.image_count,
          videos: mvStats.video_count,
          audio: mvStats.audio_count,
          pdf: mvStats.pdf_count,
          excel: mvStats.excel_count,
          word: mvStats.word_count,
        },
        recentActivity: {
          last7Days: mvStats.files_last_7_days,
          last30Days: mvStats.files_last_30_days,
        },
        sizeByType: {
          images: mvStats.image_size_bytes,
          videos: mvStats.video_size_bytes,
        },
      }
    } else {
      // Fallback: compute stats directly (slower)
      const [filesCount, foldersCount, typeStats] = await Promise.all([
        // Total files and size
        supabase
          .from('files')
          .select('id, size_bytes', { count: 'exact' })
          .eq('vault_id', vaultId)
          .is('deleted_at', null),

        // Total folders
        supabase
          .from('file_folders')
          .select('id', { count: 'exact' })
          .eq('vault_id', vaultId)
          .is('deleted_at', null),

        // Files by type
        supabase
          .from('files')
          .select('mime_type, size_bytes')
          .eq('vault_id', vaultId)
          .is('deleted_at', null),
      ])

      const files = filesCount.data || []
      const totalSize = files.reduce((sum, f) => sum + (f.size_bytes || 0), 0)

      const typeFiles = typeStats.data || []
      const images = typeFiles.filter(f => f.mime_type?.startsWith('image/'))
      const videos = typeFiles.filter(f => f.mime_type?.startsWith('video/'))
      const audio = typeFiles.filter(f => f.mime_type?.startsWith('audio/'))
      const pdfs = typeFiles.filter(f => f.mime_type === 'application/pdf')

      stats = {
        totalFiles: filesCount.count || 0,
        totalSizeBytes: totalSize,
        totalFolders: foldersCount.count || 0,
        byType: {
          images: images.length,
          videos: videos.length,
          audio: audio.length,
          pdf: pdfs.length,
        },
        sizeByType: {
          images: images.reduce((sum, f) => sum + (f.size_bytes || 0), 0),
          videos: videos.reduce((sum, f) => sum + (f.size_bytes || 0), 0),
        },
      }
    }

    // Cache result
    await cacheSet(cacheKey, stats, CACHE_TTL.VAULT_STATS)

    const duration = Date.now() - startTime

    return NextResponse.json({
      stats,
      _meta: {
        duration,
        cached: false,
        usedMaterializedView: !mvError && !!mvStats,
      },
    }, {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=300',
      },
    })
  } catch (error) {
    console.error('Error in GET /api/file-vault/stats:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * POST /api/file-vault/stats/refresh - Refresh materialized view
 * Admin only
 */
export async function POST(request: Request) {
  try {
    const supabase = createClient()

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role')
      .eq('auth_user_id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Refresh materialized view
    const { error } = await supabase.rpc('refresh_vault_stats')

    if (error) {
      console.error('Error refreshing vault stats:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Stats refreshed' })
  } catch (error) {
    console.error('Error in POST /api/file-vault/stats/refresh:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
