'use client'

import { useState, useEffect } from 'react'
import {
  BarChart3,
  Download,
  Share2,
  MessageSquare,
  HardDrive,
  Folder,
  File,
  TrendingUp,
  Users,
  Clock,
  Image,
  FileText,
  Film,
  Music,
  Archive,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { Button, Card } from '@rivest/ui'

interface VaultStats {
  vault: {
    id: string
    name: string
    quotaBytes: number
    usedBytes: number
    usagePercent: number
  }
  counts: {
    totalFiles: number
    totalFolders: number
    totalShares: number
    totalComments: number
    totalDownloads: number
  }
  filesByType: Array<{
    type: string
    count: number
    totalSize: number
  }>
  activityBreakdown: Record<string, number>
  recentActivities: Array<{
    id: string
    action: string
    fileName: string
    createdAt: string
  }>
  storageOverTime: Array<{
    date: string
    totalBytes: number
  }>
  totalBytesTransferred: number
  period: number
}

interface FileVaultStatisticsProps {
  vaultId: string
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('et-EE', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case 'image':
      return <Image className="w-4 h-4" />
    case 'video':
      return <Film className="w-4 h-4" />
    case 'audio':
      return <Music className="w-4 h-4" />
    case 'application':
      return <FileText className="w-4 h-4" />
    default:
      return <File className="w-4 h-4" />
  }
}

const getTypeColor = (type: string) => {
  switch (type) {
    case 'image':
      return 'bg-blue-100 text-blue-600'
    case 'video':
      return 'bg-purple-100 text-purple-600'
    case 'audio':
      return 'bg-pink-100 text-pink-600'
    case 'application':
      return 'bg-orange-100 text-orange-600'
    default:
      return 'bg-slate-100 text-slate-600'
  }
}

const getActionLabel = (action: string) => {
  const labels: Record<string, string> = {
    upload: 'Üleslaadimine',
    download: 'Allalaadimine',
    delete: 'Kustutamine',
    share: 'Jagamine',
    comment: 'Kommenteerimine',
    view: 'Vaatamine',
    move: 'Teisaldamine',
    rename: 'Ümbernimetamine',
  }
  return labels[action] || action
}

export function FileVaultStatistics({ vaultId }: FileVaultStatisticsProps) {
  const [stats, setStats] = useState<VaultStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState(30)

  const loadStats = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/file-vault/statistics?vaultId=${vaultId}&period=${period}`)
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error loading statistics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (vaultId) {
      loadStats()
    }
  }, [vaultId, period])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12 text-slate-500">
        Statistikat ei õnnestunud laadida
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6" style={{ color: '#279989' }} />
            Statistika
          </h2>
          <p className="text-slate-500 text-sm">Viimased {period} päeva</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(parseInt(e.target.value))}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value={7}>7 päeva</option>
            <option value={30}>30 päeva</option>
            <option value={90}>90 päeva</option>
            <option value={365}>1 aasta</option>
          </select>
          <Button variant="outline" size="icon" onClick={loadStats}>
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <File className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.counts.totalFiles}</p>
              <p className="text-xs text-slate-500">Faile kokku</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Folder className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.counts.totalFolders}</p>
              <p className="text-xs text-slate-500">Kaustu</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Download className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.counts.totalDownloads}</p>
              <p className="text-xs text-slate-500">Allalaadimisi</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Share2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.counts.totalShares}</p>
              <p className="text-xs text-slate-500">Jagamisi</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-pink-100 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{stats.counts.totalComments}</p>
              <p className="text-xs text-slate-500">Kommentaare</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{formatFileSize(stats.totalBytesTransferred)}</p>
              <p className="text-xs text-slate-500">Edastatud</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Storage Usage */}
      <Card className="p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <HardDrive className="w-5 h-5" style={{ color: '#279989' }} />
          Salvestusruum
        </h3>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-600">Kasutatud: {formatFileSize(stats.vault.usedBytes)}</span>
              <span className="text-slate-600">Kokku: {formatFileSize(stats.vault.quotaBytes)}</span>
            </div>
            <div className="h-4 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.min(stats.vault.usagePercent, 100)}%`,
                  backgroundColor: stats.vault.usagePercent > 90 ? '#ef4444' : stats.vault.usagePercent > 70 ? '#f59e0b' : '#279989',
                }}
              />
            </div>
            <p className="text-sm text-slate-500 mt-2">{stats.vault.usagePercent}% kasutatud</p>
          </div>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Files by Type */}
        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Failid tüübi järgi</h3>
          <div className="space-y-3">
            {stats.filesByType.map((item) => (
              <div key={item.type} className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTypeColor(item.type)}`}>
                  {getTypeIcon(item.type)}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-slate-900 capitalize">{item.type}</span>
                    <span className="text-slate-500">{item.count} faili</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full mt-1">
                    <div
                      className="h-full rounded-full bg-[#279989]"
                      style={{
                        width: `${(item.count / stats.counts.totalFiles) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{formatFileSize(item.totalSize)}</p>
                </div>
              </div>
            ))}
            {stats.filesByType.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-4">Faile pole veel</p>
            )}
          </div>
        </Card>

        {/* Activity Breakdown */}
        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">Tegevuste jaotus</h3>
          <div className="space-y-3">
            {Object.entries(stats.activityBreakdown).map(([action, count]) => (
              <div key={action} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{getActionLabel(action)}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-slate-100 rounded-full">
                    <div
                      className="h-full rounded-full bg-[#279989]"
                      style={{
                        width: `${(count / Math.max(...Object.values(stats.activityBreakdown))) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm font-medium text-slate-900 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
            {Object.keys(stats.activityBreakdown).length === 0 && (
              <p className="text-slate-400 text-sm text-center py-4">Tegevusi pole veel</p>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="p-6">
        <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" style={{ color: '#279989' }} />
          Viimased tegevused
        </h3>
        <div className="space-y-2">
          {stats.recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center gap-3 py-2 border-b last:border-0">
              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                {activity.action === 'upload' && <File className="w-4 h-4 text-green-600" />}
                {activity.action === 'download' && <Download className="w-4 h-4 text-blue-600" />}
                {activity.action === 'share' && <Share2 className="w-4 h-4 text-purple-600" />}
                {activity.action === 'delete' && <Archive className="w-4 h-4 text-red-600" />}
                {activity.action === 'comment' && <MessageSquare className="w-4 h-4 text-pink-600" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-slate-900 truncate">
                  {getActionLabel(activity.action)}: <span className="font-medium">{activity.fileName}</span>
                </p>
              </div>
              <span className="text-xs text-slate-400">{formatDate(activity.createdAt)}</span>
            </div>
          ))}
          {stats.recentActivities.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-4">Tegevusi pole veel</p>
          )}
        </div>
      </Card>
    </div>
  )
}
