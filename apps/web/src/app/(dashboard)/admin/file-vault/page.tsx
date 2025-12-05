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
  Upload,
  Gauge,
  Activity,
  Zap,
  BarChart3,
  Timer,
  AlertCircle,
  CheckCircle,
  Server,
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

interface PerformanceMetrics {
  downloads: {
    totalCount: number
    totalBytes: number
    avgSpeedMBps: number
    avgDurationMs: number
    last24h: number
    last7d: number
    byHour: { hour: number; count: number }[]
    slowestFiles: { name: string; sizeMb: number; durationMs: number; speedMBps: number }[]
  }
  uploads: {
    totalCount: number
    totalBytes: number
    avgSpeedMBps: number
    avgDurationMs: number
    last24h: number
    last7d: number
    byHour: { hour: number; count: number }[]
    largestFiles: { name: string; sizeMb: number; durationMs: number; speedMBps: number }[]
  }
  views: {
    totalCount: number
    avgLoadTimeMs: number
    last24h: number
    last7d: number
    mostViewedFiles: { name: string; viewCount: number; avgLoadTimeMs: number }[]
    byFileType: { type: string; count: number; avgLoadTimeMs: number }[]
  }
  api: {
    avgResponseTimeMs: number
    p95ResponseTimeMs: number
    cacheHitRate: number
    totalRequests: number
    errorRate: number
    byEndpoint: { endpoint: string; avgMs: number; count: number }[]
  }
  realtime: {
    activeConnections: number
    currentTransfers: number
    queuedOperations: number
  }
}

type TabType = 'overview' | 'performance'

export default function AdminFileVaultPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabType>('overview')

  const loadStats = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [statsRes, perfRes] = await Promise.all([
        fetch('/api/admin/file-vault/stats'),
        fetch('/api/admin/file-vault/performance'),
      ])

      if (statsRes.ok) {
        const data = await statsRes.json()
        setStats(data)
      } else {
        const errorData = await statsRes.json()
        setError(errorData.error || 'Statistika laadimine ebaõnnestus')
      }

      if (perfRes.ok) {
        const perfData = await perfRes.json()
        setPerformance(perfData)
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

  // Render performance section
  const renderPerformanceSection = () => {
    if (!performance) {
      return (
        <div className="text-center py-12 text-slate-500">
          Jõudluse andmeid ei leitud
        </div>
      )
    }

    const maxHourlyDownloads = Math.max(...performance.downloads.byHour.map(h => h.count), 1)
    const maxHourlyUploads = Math.max(...performance.uploads.byHour.map(h => h.count), 1)

    return (
      <div className="space-y-6">
        {/* Performance Overview Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <Download className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {performance.downloads.avgSpeedMBps.toFixed(1)}
                </p>
                <p className="text-sm text-slate-500">MB/s allalaadimine</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Upload className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {performance.uploads.avgSpeedMBps.toFixed(1)}
                </p>
                <p className="text-sm text-slate-500">MB/s üleslaadimine</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <Eye className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {performance.views.avgLoadTimeMs}
                </p>
                <p className="text-sm text-slate-500">ms avamine</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <Zap className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900">
                  {Math.round(performance.api.cacheHitRate * 100)}%
                </p>
                <p className="text-sm text-slate-500">cache hit rate</p>
              </div>
            </div>
          </Card>
        </div>

        {/* API Performance */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Server className="w-5 h-5" />
            API Jõudlus
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-900">{performance.api.avgResponseTimeMs}</p>
              <p className="text-xs text-slate-500">Keskm. vastus (ms)</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-900">{performance.api.p95ResponseTimeMs}</p>
              <p className="text-xs text-slate-500">P95 vastus (ms)</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-900">{performance.api.totalRequests}</p>
              <p className="text-xs text-slate-500">Päringuid kokku</p>
            </div>
            <div className="text-center p-3 bg-slate-50 rounded-lg">
              <p className="text-2xl font-bold text-slate-900">{(performance.api.errorRate * 100).toFixed(1)}%</p>
              <p className="text-xs text-slate-500">Vigade %</p>
            </div>
          </div>

          {/* API Endpoints */}
          <div className="space-y-2">
            {performance.api.byEndpoint.map((ep) => (
              <div key={ep.endpoint} className="flex items-center gap-3">
                <code className="text-xs font-mono text-slate-600 flex-1 truncate">{ep.endpoint}</code>
                <span className="text-sm text-slate-500 w-20 text-right">{ep.avgMs}ms</span>
                <span className="text-sm text-slate-400 w-16 text-right">{ep.count}x</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Downloads & Uploads Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Downloads */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Download className="w-5 h-5" />
              Allalaadimised
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-xl font-bold text-slate-900">{performance.downloads.totalCount}</p>
                <p className="text-xs text-slate-500">Kokku</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-slate-900">{performance.downloads.last24h}</p>
                <p className="text-xs text-slate-500">24h</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-slate-900">{performance.downloads.last7d}</p>
                <p className="text-xs text-slate-500">7 päeva</p>
              </div>
            </div>

            {/* Hourly chart */}
            <div className="mb-4">
              <p className="text-xs text-slate-500 mb-2">Allalaadimised tunni järgi (24h)</p>
              <div className="flex items-end gap-0.5 h-16">
                {performance.downloads.byHour.map((h) => (
                  <div
                    key={h.hour}
                    className="flex-1 bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                    style={{ height: `${(h.count / maxHourlyDownloads) * 100}%`, minHeight: h.count > 0 ? '4px' : '0' }}
                    title={`${h.hour}:00 - ${h.count} allalaadimist`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>00:00</span>
                <span>12:00</span>
                <span>23:00</span>
              </div>
            </div>

            {/* Slowest files */}
            {performance.downloads.slowestFiles.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                  <Timer className="w-3 h-3" />
                  Aeglaseimad failid
                </p>
                <div className="space-y-1.5">
                  {performance.downloads.slowestFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-slate-600 truncate flex-1">{f.name}</span>
                      <span className="text-slate-400">{f.sizeMb.toFixed(1)} MB</span>
                      <span className="text-amber-600">{(f.durationMs / 1000).toFixed(1)}s</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Uploads */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Üleslaadimised
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-xl font-bold text-slate-900">{performance.uploads.totalCount}</p>
                <p className="text-xs text-slate-500">Kokku</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-slate-900">{performance.uploads.last24h}</p>
                <p className="text-xs text-slate-500">24h</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-slate-900">{performance.uploads.last7d}</p>
                <p className="text-xs text-slate-500">7 päeva</p>
              </div>
            </div>

            {/* Hourly chart */}
            <div className="mb-4">
              <p className="text-xs text-slate-500 mb-2">Üleslaadimised tunni järgi (24h)</p>
              <div className="flex items-end gap-0.5 h-16">
                {performance.uploads.byHour.map((h) => (
                  <div
                    key={h.hour}
                    className="flex-1 bg-green-500 rounded-t transition-all hover:bg-green-600"
                    style={{ height: `${(h.count / maxHourlyUploads) * 100}%`, minHeight: h.count > 0 ? '4px' : '0' }}
                    title={`${h.hour}:00 - ${h.count} üleslaadimist`}
                  />
                ))}
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                <span>00:00</span>
                <span>12:00</span>
                <span>23:00</span>
              </div>
            </div>

            {/* Largest files */}
            {performance.uploads.largestFiles.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                  <HardDrive className="w-3 h-3" />
                  Suurimad failid
                </p>
                <div className="space-y-1.5">
                  {performance.uploads.largestFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-slate-600 truncate flex-1">{f.name}</span>
                      <span className="text-blue-600">{f.sizeMb.toFixed(1)} MB</span>
                      <span className="text-slate-400">{f.speedMBps.toFixed(1)} MB/s</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Views & Realtime */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Views */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Failide avamised
            </h2>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <p className="text-xl font-bold text-slate-900">{performance.views.totalCount}</p>
                <p className="text-xs text-slate-500">Kokku</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-slate-900">{performance.views.last24h}</p>
                <p className="text-xs text-slate-500">24h</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-slate-900">{performance.views.avgLoadTimeMs}</p>
                <p className="text-xs text-slate-500">ms keskm.</p>
              </div>
            </div>

            {/* Most viewed files */}
            {performance.views.mostViewedFiles.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Populaarsemad failid
                </p>
                <div className="space-y-1.5">
                  {performance.views.mostViewedFiles.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-slate-600 truncate flex-1">{f.name}</span>
                      <span className="text-purple-600">{f.viewCount}x</span>
                      <span className="text-slate-400">{f.avgLoadTimeMs.toFixed(0)}ms</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* By file type */}
            {performance.views.byFileType.length > 0 && (
              <div>
                <p className="text-xs text-slate-500 mb-2">Tüübi järgi</p>
                <div className="space-y-1.5">
                  {performance.views.byFileType.map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="text-slate-600 flex-1">{t.type}</span>
                      <span className="text-slate-500">{t.count} avamist</span>
                      <span className="text-slate-400">{t.avgLoadTimeMs.toFixed(0)}ms</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {/* Realtime Status */}
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Reaalajas
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse mx-auto mb-2" />
                <p className="text-2xl font-bold text-green-700">{performance.realtime.activeConnections}</p>
                <p className="text-xs text-green-600">Aktiivsed ühendused</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse mx-auto mb-2" />
                <p className="text-2xl font-bold text-blue-700">{performance.realtime.currentTransfers}</p>
                <p className="text-xs text-blue-600">Ülekanded</p>
              </div>
              <div className="text-center p-4 bg-amber-50 rounded-lg">
                <div className="w-3 h-3 bg-amber-500 rounded-full mx-auto mb-2" />
                <p className="text-2xl font-bold text-amber-700">{performance.realtime.queuedOperations}</p>
                <p className="text-xs text-amber-600">Ootel</p>
              </div>
            </div>

            {/* System health */}
            <div className="mt-6">
              <p className="text-xs text-slate-500 mb-3">Süsteemi seisund</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-slate-600">Failihoidla teenus</span>
                  <span className="ml-auto text-xs text-green-600">Töökorras</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-slate-600">Thumbnail teenus</span>
                  <span className="ml-auto text-xs text-green-600">Töökorras</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-slate-600">Cache süsteem</span>
                  <span className="ml-auto text-xs text-green-600">Töökorras</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    )
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

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="-mb-px flex gap-4">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-2 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'overview'
                ? 'border-[#279989] text-[#279989]'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Ülevaade
            </span>
          </button>
          <button
            onClick={() => setActiveTab('performance')}
            className={`py-2 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeTab === 'performance'
                ? 'border-[#279989] text-[#279989]'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              Jõudlus
            </span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'performance' ? (
        renderPerformanceSection()
      ) : (
        <>
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
        </>
      )}
    </div>
  )
}
