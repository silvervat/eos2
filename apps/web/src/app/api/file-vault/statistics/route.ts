/**
 * FILE VAULT STATISTICS API
 * GET /api/file-vault/statistics - Get user's file statistics
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Force dynamic rendering since this route uses cookies
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const vaultId = searchParams.get('vaultId')

    if (!vaultId) {
      return NextResponse.json({ error: 'vaultId is required' }, { status: 400 })
    }

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get total files and size
    const { data: totalStats, error: totalError } = await supabase
      .from('files')
      .select('id, size_bytes')
      .eq('vault_id', vaultId)
      .is('deleted_at', null)

    if (totalError) {
      console.error('Error fetching total stats:', totalError)
    }

    const totalFiles = totalStats?.length || 0
    const totalSize = totalStats?.reduce((acc, f) => acc + (f.size_bytes || 0), 0) || 0

    // Get my uploads
    const { count: myUploads } = await supabase
      .from('files')
      .select('id', { count: 'exact', head: true })
      .eq('vault_id', vaultId)
      .eq('uploaded_by', user.id)
      .is('deleted_at', null)

    // Get my shares
    const { count: myShares } = await supabase
      .from('file_shares')
      .select('id', { count: 'exact', head: true })
      .eq('created_by', user.id)

    // Get recent activity
    const { data: recentActivity } = await supabase
      .from('file_activity')
      .select(`
        id,
        action,
        created_at,
        file:files!file_id(name)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    // Get files by type
    const { data: filesByTypeData } = await supabase
      .from('files')
      .select('mime_type, size_bytes')
      .eq('vault_id', vaultId)
      .is('deleted_at', null)

    // Group by mime type category
    const typeCategories: Record<string, { count: number; size: number }> = {}
    filesByTypeData?.forEach(file => {
      const mimeType = file.mime_type || 'other'
      let category = 'Muu'

      // HEIC/HEIF are Apple's image format
      if (mimeType.startsWith('image/') || mimeType.includes('heic') || mimeType.includes('heif')) category = 'Pildid'
      else if (mimeType.startsWith('video/')) category = 'Videod'
      else if (mimeType.startsWith('audio/')) category = 'Heli'
      else if (mimeType === 'application/pdf') category = 'PDF'
      else if (mimeType.includes('document') || mimeType.includes('word')) category = 'Dokumendid'
      else if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) category = 'Tabelid'
      else if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) category = 'Esitlused'
      else if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('compressed')) category = 'Arhiivid'

      if (!typeCategories[category]) {
        typeCategories[category] = { count: 0, size: 0 }
      }
      typeCategories[category].count++
      typeCategories[category].size += file.size_bytes || 0
    })

    const filesByType = Object.entries(typeCategories).map(([type, data]) => ({
      type,
      count: data.count,
      size: data.size,
    })).sort((a, b) => b.count - a.count)

    // Format recent activity
    const formattedActivity = (recentActivity || []).map(a => ({
      date: a.created_at,
      action: a.action,
      fileName: Array.isArray(a.file) ? a.file[0]?.name : (a.file as { name?: string })?.name || 'Tundmatu fail',
    }))

    return NextResponse.json({
      totalFiles,
      totalSize,
      myUploads: myUploads || 0,
      myShares: myShares || 0,
      recentActivity: formattedActivity,
      filesByType,
    })
  } catch (error) {
    console.error('Error in GET /api/file-vault/statistics:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
