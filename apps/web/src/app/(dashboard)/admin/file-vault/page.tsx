'use client'

import { useState, useEffect } from 'react'
import {
  FolderArchive,
  HardDrive,
  Files,
  Folder,
  Share2,
  Image,
  Film,
  FileText,
  Music,
  Archive,
  RefreshCw,
  Loader2,
  Download,
  Eye,
  Clock,
  TrendingUp,
} from 'lucide-react'
import { Button, Card } from '@rivest/ui'

// Format file size
const formatFileSize = (bytes: number | string): string => {
  const numBytes = typeof bytes === 'string' ? parseInt(bytes) : bytes
  if (numBytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(numBytes) / Math.log(k))
  return `${parseFloat((numBytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`
}

// Format date
const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('et-EE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// Format action
const formatAction = (action: string): string => {
  const actions: Record<string, string> = {
    upload: 'Laadis üles',
    download: 'Laadis alla',
    view: 'Vaatas',
    delete: 'Kustutas',
    share_created: 'Jagas',
    share_view: 'Vaatas linki',
    share_download: 'Laadis jagatud',
  }
  return actions[action] || action
}

interface Stats {
  overview: {
    totalFiles: number
    totalFolders: number
    totalVaults: number
    activeShares: number
    totalQuotaBytes: string
    usedBytes: string
    usagePercent: number
  }
  filesByType: {
    images: number
    videos: number
    documents: number
    audio: number
    archives: number
    other: number
  }
  vaults: Array<{
    id: string
    name: string
    quotaBytes: number
    usedBytes: number
    usagePercent: number
  }>
  recentActivity: Array<{
    id: string
    action: string
    createdAt: string
    userId: string
    bytesTransferred: number
    fileName: string | null
  }>
  activeShares: Array<{
    id: string
    shortCode: string
    fileId: string | null
    folderId: string | null
    fileName: string | null
    expiresAt: string | null
    downloadsCount: number
    accessCount: number
    createdAt: string
  }>
}

export default function AdminFileVaultPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadStats = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/file-vault/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Statistika laadimine ebaõnnestus')
      }
    } catch {
      setError('Statistika laadimine ebaõnnestus')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadStats()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-600 mb-4">{error}</p>
        <Button variant="outline" onClick={loadStats}>
          Proovi uuesti
        </Button>
      </div>
    )
  }

  if (!stats) {
    return null
  }

  const typeIcons = {
    images: Image,
    videos: Film,
    documents: FileText,
    audio: Music,
    archives: Archive,
    other: Files,
  }

  const typeLabels = {
    images: 'Pildid',
    videos: 'Videod',
    documents: 'Dokumendid',
    audio: 'Audio',
    archives: 'Arhiivid',
    other: 'Muud',
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FolderArchive className="w-7 h-7" style={{ color: '#279989' }} />
            Failihoidla Haldus
          </h1>
          <p className="text-slate-600 mt-1">
            Ülevaade failisüsteemist ja kasutusstatistikast
          </p>
        </div>
        <Button variant="outline" onClick={loadStats} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Värskenda
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Files className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {stats.overview.totalFiles}
              </p>
              <p className="text-sm text-slate-500">Faili</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Folder className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {stats.overview.totalFolders}
              </p>
              <p className="text-sm text-slate-500">Kausta</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {stats.overview.activeShares}
              </p>
              <p className="text-sm text-slate-500">Aktiivsed lingid</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <HardDrive className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {stats.overview.usagePercent}%
              </p>
              <p className="text-sm text-slate-500">Kasutatud</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Storage Usage */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Salvestusruum
        </h2>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">
                Kasutatud: {formatFileSize(stats.overview.usedBytes)}
              </span>
              <span className="text-slate-600">
                Kokku: {formatFileSize(stats.overview.totalQuotaBytes)}
              </span>
            </div>
            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#279989] transition-all"
                style={{ width: `${Math.min(stats.overview.usagePercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Vaults breakdown */}
          {stats.vaults.length > 0 && (
            <div className="grid gap-3 mt-4">
              {stats.vaults.map((vault) => (
                <div key={vault.id} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-slate-700">{vault.name}</span>
                      <span className="text-slate-500">
                        {formatFileSize(vault.usedBytes)} / {formatFileSize(vault.quotaBytes)}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-slate-400 transition-all"
                        style={{ width: `${Math.min(vault.usagePercent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>

      {/* Files by Type */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Files className="w-5 h-5" />
          Failid tüübi järgi
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {Object.entries(stats.filesByType).map(([type, count]) => {
            const Icon = typeIcons[type as keyof typeof typeIcons]
            const label = typeLabels[type as keyof typeof typeLabels]
            return (
              <div
                key={type}
                className="flex flex-col items-center p-4 bg-slate-50 rounded-lg"
              >
                <Icon className="w-8 h-8 text-slate-400 mb-2" />
                <p className="text-xl font-bold text-slate-900">{count}</p>
                <p className="text-sm text-slate-500">{label}</p>
              </div>
            )
          })}
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Hiljutine tegevus
          </h2>
          <div className="space-y-3 max-h-80 overflow-auto">
            {stats.recentActivity.length === 0 ? (
              <p className="text-slate-500 text-center py-4">Tegevust pole</p>
            ) : (
              stats.recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 text-sm"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                    {activity.action === 'upload' && <Download className="w-4 h-4 text-green-600 rotate-180" />}
                    {activity.action === 'download' && <Download className="w-4 h-4 text-blue-600" />}
                    {activity.action === 'view' && <Eye className="w-4 h-4 text-slate-600" />}
                    {activity.action === 'delete' && <Files className="w-4 h-4 text-red-600" />}
                    {activity.action.startsWith('share') && <Share2 className="w-4 h-4 text-purple-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-slate-700 truncate">
                      {formatAction(activity.action)}
                      {activity.fileName && (
                        <span className="font-medium"> - {activity.fileName}</span>
                      )}
                    </p>
                    <p className="text-xs text-slate-400">
                      {formatDate(activity.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Active Shares */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Aktiivsed jagamislingid
          </h2>
          <div className="space-y-3 max-h-80 overflow-auto">
            {stats.activeShares.length === 0 ? (
              <p className="text-slate-500 text-center py-4">Aktiivseid linke pole</p>
            ) : (
              stats.activeShares.map((share) => (
                <div
                  key={share.id}
                  className="p-3 bg-slate-50 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-1">
                    <code className="text-sm font-mono bg-slate-200 px-2 py-0.5 rounded">
                      {share.shortCode}
                    </code>
                    <span className="text-xs text-slate-500">
                      {share.accessCount} vaatamist
                    </span>
                  </div>
                  {share.fileName && (
                    <p className="text-sm text-slate-700 truncate">
                      {share.fileName}
                    </p>
                  )}
                  <div className="flex items-center gap-4 mt-1 text-xs text-slate-500">
                    <span>{share.downloadsCount} allalaadimist</span>
                    {share.expiresAt && (
                      <span>Aegub: {formatDate(share.expiresAt)}</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
