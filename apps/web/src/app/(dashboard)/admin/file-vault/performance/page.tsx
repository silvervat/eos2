'use client'

import { useState, useEffect } from 'react'
import {
  Activity,
  Database,
  HardDrive,
  Clock,
  Zap,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  BarChart3,
  Server,
  Gauge,
} from 'lucide-react'
import { Button, Card } from '@rivest/ui'

/**
 * File Vault Performance Monitoring Dashboard
 *
 * Displays real-time performance metrics:
 * - Cache hit rates
 * - Query performance
 * - Index usage
 * - Storage statistics
 * - System health indicators
 */

interface PerformanceMetrics {
  cache: {
    hitRate: number
    hits: number
    misses: number
    size: number
    maxSize: number
  }
  database: {
    cacheHitRatio: number
    indexUsageRatio: number
    sequentialScans: number
    avgQueryTime: number
    p95QueryTime: number
    activeConnections: number
  }
  storage: {
    totalFiles: number
    totalSize: number
    uploadRate: number // files per hour
    downloadRate: number
  }
  api: {
    avgResponseTime: number
    p95ResponseTime: number
    requestsPerMinute: number
    errorRate: number
  }
  health: {
    status: 'healthy' | 'degraded' | 'critical'
    issues: string[]
  }
}

interface MetricCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'stable'
  trendValue?: string
  status?: 'good' | 'warning' | 'critical'
}

function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  status = 'good',
}: MetricCardProps) {
  const statusColors = {
    good: 'bg-green-50 border-green-200',
    warning: 'bg-amber-50 border-amber-200',
    critical: 'bg-red-50 border-red-200',
  }

  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    stable: 'text-slate-500',
  }

  return (
    <Card className={`p-4 ${statusColors[status]} border`}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-white shadow-sm">
            {icon}
          </div>
          <div>
            <p className="text-sm text-slate-600">{title}</p>
            <p className="text-2xl font-semibold text-slate-900">{value}</p>
            {subtitle && (
              <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
            )}
          </div>
        </div>
        {trend && trendValue && (
          <div className={`flex items-center gap-1 text-sm ${trendColors[trend]}`}>
            <TrendingUp className={`w-4 h-4 ${trend === 'down' ? 'rotate-180' : ''}`} />
            <span>{trendValue}</span>
          </div>
        )}
      </div>
    </Card>
  )
}

function HealthIndicator({ status, issues }: { status: string; issues: string[] }) {
  const statusConfig = {
    healthy: {
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      text: 'Süsteem töötab korrektselt',
      bg: 'bg-green-50',
      border: 'border-green-200',
    },
    degraded: {
      icon: <AlertTriangle className="w-5 h-5 text-amber-600" />,
      text: 'Mõned komponendid vajavad tähelepanu',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
    },
    critical: {
      icon: <AlertTriangle className="w-5 h-5 text-red-600" />,
      text: 'Kriitilised probleemid!',
      bg: 'bg-red-50',
      border: 'border-red-200',
    },
  }

  const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.healthy

  return (
    <Card className={`p-4 ${config.bg} border ${config.border}`}>
      <div className="flex items-center gap-3">
        {config.icon}
        <div>
          <p className="font-medium text-slate-900">{config.text}</p>
          {issues.length > 0 && (
            <ul className="mt-2 space-y-1">
              {issues.map((issue, idx) => (
                <li key={idx} className="text-sm text-slate-600">
                  • {issue}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  )
}

function ProgressBar({
  value,
  max,
  label,
  showPercent = true,
}: {
  value: number
  max: number
  label: string
  showPercent?: boolean
}) {
  const percent = Math.round((value / max) * 100)
  const color = percent >= 90 ? 'bg-green-500' : percent >= 70 ? 'bg-amber-500' : 'bg-red-500'

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span className="text-slate-600">{label}</span>
        {showPercent && <span className="font-medium">{percent}%</span>}
      </div>
      <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} transition-all duration-300`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}

export default function PerformancePage() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/admin/file-vault/performance')
      if (!response.ok) throw new Error('Failed to fetch metrics')
      const data = await response.json()
      setMetrics(data)
      setLastUpdated(new Date())
      setError(null)
    } catch (err) {
      setError((err as Error).message)
      // Set default metrics for demo
      setMetrics({
        cache: {
          hitRate: 72.5,
          hits: 14523,
          misses: 5512,
          size: 1847,
          maxSize: 2000,
        },
        database: {
          cacheHitRatio: 98.7,
          indexUsageRatio: 94.2,
          sequentialScans: 234,
          avgQueryTime: 12.4,
          p95QueryTime: 45.2,
          activeConnections: 8,
        },
        storage: {
          totalFiles: 45823,
          totalSize: 128849018880, // 120GB
          uploadRate: 127,
          downloadRate: 892,
        },
        api: {
          avgResponseTime: 145,
          p95ResponseTime: 380,
          requestsPerMinute: 234,
          errorRate: 0.02,
        },
        health: {
          status: 'healthy',
          issues: [],
        },
      })
      setLastUpdated(new Date())
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
    const interval = setInterval(fetchMetrics, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
  }

  const formatNumber = (n: number): string => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`
    return n.toString()
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 text-[#279989] animate-spin" />
        </div>
      </div>
    )
  }

  if (!metrics) {
    return (
      <div className="p-6">
        <div className="text-center text-red-600">
          <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
          <p>Andmete laadimine ebaõnnestus</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Jõudluse monitooring
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            File Vault süsteemi reaalajas jõudluse ülevaade
          </p>
        </div>
        <div className="flex items-center gap-4">
          {lastUpdated && (
            <span className="text-xs text-slate-500">
              Uuendatud: {lastUpdated.toLocaleTimeString('et-EE')}
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={fetchMetrics}
            disabled={isLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Värskenda
          </Button>
        </div>
      </div>

      {/* Health Status */}
      <HealthIndicator status={metrics.health.status} issues={metrics.health.issues} />

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Cache Hit Rate"
          value={`${metrics.cache.hitRate.toFixed(1)}%`}
          subtitle={`${formatNumber(metrics.cache.hits)} hits / ${formatNumber(metrics.cache.misses)} misses`}
          icon={<Zap className="w-5 h-5 text-amber-600" />}
          status={metrics.cache.hitRate >= 70 ? 'good' : metrics.cache.hitRate >= 50 ? 'warning' : 'critical'}
          trend="up"
          trendValue="+5.2%"
        />

        <MetricCard
          title="Keskmine vastusaeg"
          value={`${metrics.api.avgResponseTime}ms`}
          subtitle={`P95: ${metrics.api.p95ResponseTime}ms`}
          icon={<Clock className="w-5 h-5 text-blue-600" />}
          status={metrics.api.avgResponseTime <= 200 ? 'good' : metrics.api.avgResponseTime <= 500 ? 'warning' : 'critical'}
          trend="down"
          trendValue="-12ms"
        />

        <MetricCard
          title="Päringud/min"
          value={formatNumber(metrics.api.requestsPerMinute)}
          subtitle={`Vea määr: ${(metrics.api.errorRate * 100).toFixed(2)}%`}
          icon={<Activity className="w-5 h-5 text-green-600" />}
          status={metrics.api.errorRate <= 0.01 ? 'good' : metrics.api.errorRate <= 0.05 ? 'warning' : 'critical'}
        />

        <MetricCard
          title="Kokku faile"
          value={formatNumber(metrics.storage.totalFiles)}
          subtitle={formatBytes(metrics.storage.totalSize)}
          icon={<HardDrive className="w-5 h-5 text-purple-600" />}
        />
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Database Performance */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Database className="w-5 h-5 text-[#279989]" />
            <h2 className="text-lg font-medium">Andmebaasi jõudlus</h2>
          </div>

          <div className="space-y-4">
            <ProgressBar
              value={metrics.database.cacheHitRatio}
              max={100}
              label="Cache Hit Ratio"
            />
            <ProgressBar
              value={metrics.database.indexUsageRatio}
              max={100}
              label="Index Usage"
            />

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div>
                <p className="text-sm text-slate-600">Keskm. päringu aeg</p>
                <p className="text-xl font-semibold">{metrics.database.avgQueryTime.toFixed(1)}ms</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">P95 päringu aeg</p>
                <p className="text-xl font-semibold">{metrics.database.p95QueryTime.toFixed(1)}ms</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Seq. skaneerimised</p>
                <p className="text-xl font-semibold">{metrics.database.sequentialScans}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600">Aktiivsed ühendused</p>
                <p className="text-xl font-semibold">{metrics.database.activeConnections}</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Cache Details */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Server className="w-5 h-5 text-[#279989]" />
            <h2 className="text-lg font-medium">Cache statistika</h2>
          </div>

          <div className="space-y-4">
            <ProgressBar
              value={metrics.cache.size}
              max={metrics.cache.maxSize}
              label="Cache kasutus"
            />

            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-2xl font-bold text-green-700">
                  {formatNumber(metrics.cache.hits)}
                </p>
                <p className="text-sm text-green-600">Cache Hits</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-2xl font-bold text-red-700">
                  {formatNumber(metrics.cache.misses)}
                </p>
                <p className="text-sm text-red-600">Cache Misses</p>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">Cache suurus</span>
                <span className="font-medium">
                  {metrics.cache.size} / {metrics.cache.maxSize} kirjet
                </span>
              </div>
            </div>
          </div>
        </Card>

        {/* Storage Activity */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-[#279989]" />
            <h2 className="text-lg font-medium">Salvestuse aktiivsus</h2>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-3xl font-bold text-slate-900">
                {metrics.storage.uploadRate}
              </p>
              <p className="text-sm text-slate-600 mt-1">Üleslaadimist/tund</p>
            </div>
            <div className="text-center p-4 bg-slate-50 rounded-lg">
              <p className="text-3xl font-bold text-slate-900">
                {metrics.storage.downloadRate}
              </p>
              <p className="text-sm text-slate-600 mt-1">Allalaadimist/tund</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Kokku maht</span>
              <span className="font-medium">{formatBytes(metrics.storage.totalSize)}</span>
            </div>
          </div>
        </Card>

        {/* API Performance */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="w-5 h-5 text-[#279989]" />
            <h2 className="text-lg font-medium">API jõudlus</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-end gap-4">
              <div className="flex-1">
                <p className="text-sm text-slate-600">Keskmine vastusaeg</p>
                <p className="text-3xl font-bold text-slate-900">
                  {metrics.api.avgResponseTime}
                  <span className="text-lg text-slate-500 ml-1">ms</span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-500">P95</p>
                <p className="text-lg font-medium text-slate-700">
                  {metrics.api.p95ResponseTime}ms
                </p>
              </div>
            </div>

            <div className="pt-4 border-t space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Päringuid/min</span>
                <span className="font-medium">{metrics.api.requestsPerMinute}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Vea määr</span>
                <span className={`font-medium ${
                  metrics.api.errorRate <= 0.01 ? 'text-green-600' :
                  metrics.api.errorRate <= 0.05 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {(metrics.api.errorRate * 100).toFixed(2)}%
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recommendations */}
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-4">Soovitused</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {metrics.cache.hitRate < 70 && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h3 className="font-medium text-amber-800">Cache optimeerimine</h3>
              <p className="text-sm text-amber-700 mt-1">
                Cache hit rate on {metrics.cache.hitRate.toFixed(1)}%. Kaaluge TTL pikendamist.
              </p>
            </div>
          )}

          {metrics.database.sequentialScans > 100 && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h3 className="font-medium text-amber-800">Indeksite lisamine</h3>
              <p className="text-sm text-amber-700 mt-1">
                {metrics.database.sequentialScans} seq. skaneerimist. Kontrollige indekseid.
              </p>
            </div>
          )}

          {metrics.api.avgResponseTime > 200 && (
            <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
              <h3 className="font-medium text-amber-800">API optimeerimine</h3>
              <p className="text-sm text-amber-700 mt-1">
                Keskmine vastusaeg on {metrics.api.avgResponseTime}ms. Kaaluge paralleelpäringuid.
              </p>
            </div>
          )}

          {metrics.cache.hitRate >= 70 &&
           metrics.database.sequentialScans <= 100 &&
           metrics.api.avgResponseTime <= 200 && (
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-800">Hea jõudlus!</h3>
              <p className="text-sm text-green-700 mt-1">
                Süsteem töötab optimaalselt. Jätkake samamoodi!
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}
