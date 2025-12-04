'use client'

/**
 * Admin - Süsteemi info
 *
 * REAALNE süsteemi seisund, versioonid ja konfiguratsioon
 */

import React, { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { RefreshCw, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

interface ServiceStatus {
  name: string
  status: 'healthy' | 'warning' | 'error' | 'checking'
  latency: number | null
  message: string
  icon: string
}

interface SystemStats {
  users: number | null
  projects: number | null
  assets: number | null
  documents: number | null
}

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  healthy: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  warning: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  error: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  checking: { bg: 'bg-gray-50', text: 'text-gray-700', dot: 'bg-gray-400' },
}

export default function SystemPage() {
  const [services, setServices] = useState<ServiceStatus[]>([
    { name: 'Database (Supabase)', status: 'checking', latency: null, message: 'Kontrollimine...', icon: '🗄️' },
    { name: 'Authentication', status: 'checking', latency: null, message: 'Kontrollimine...', icon: '🔐' },
    { name: 'Storage', status: 'checking', latency: null, message: 'Kontrollimine...', icon: '💾' },
  ])
  const [stats, setStats] = useState<SystemStats>({ users: null, projects: null, assets: null, documents: null })
  const [currentTime, setCurrentTime] = useState(new Date())
  const [lastChecked, setLastChecked] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const checkServices = useCallback(async () => {
    setIsRefreshing(true)
    const supabase = createClient()

    // Check Database
    const dbStart = performance.now()
    try {
      const { error } = await supabase.from('tenants').select('count').limit(1).single()
      const dbLatency = Math.round(performance.now() - dbStart)
      setServices(prev => prev.map(s => s.name.includes('Database') ? {
        ...s,
        status: error ? 'error' : dbLatency > 500 ? 'warning' : 'healthy',
        latency: dbLatency,
        message: error ? error.message : dbLatency > 500 ? 'Aeglane ühendus' : 'Töökorras'
      } : s))
    } catch {
      setServices(prev => prev.map(s => s.name.includes('Database') ? {
        ...s, status: 'error', latency: null, message: 'Ühendus ebaõnnestus'
      } : s))
    }

    // Check Auth
    const authStart = performance.now()
    try {
      const { error } = await supabase.auth.getSession()
      const authLatency = Math.round(performance.now() - authStart)
      setServices(prev => prev.map(s => s.name.includes('Authentication') ? {
        ...s,
        status: error ? 'error' : authLatency > 500 ? 'warning' : 'healthy',
        latency: authLatency,
        message: error ? error.message : authLatency > 500 ? 'Aeglane vastus' : 'Töökorras'
      } : s))
    } catch {
      setServices(prev => prev.map(s => s.name.includes('Authentication') ? {
        ...s, status: 'error', latency: null, message: 'Ühendus ebaõnnestus'
      } : s))
    }

    // Check Storage (list buckets)
    const storageStart = performance.now()
    try {
      const { error } = await supabase.storage.listBuckets()
      const storageLatency = Math.round(performance.now() - storageStart)
      setServices(prev => prev.map(s => s.name.includes('Storage') ? {
        ...s,
        status: error ? 'warning' : storageLatency > 1000 ? 'warning' : 'healthy',
        latency: storageLatency,
        message: error ? 'Piiratud ligipääs' : storageLatency > 1000 ? 'Aeglane vastus' : 'Töökorras'
      } : s))
    } catch {
      setServices(prev => prev.map(s => s.name.includes('Storage') ? {
        ...s, status: 'warning', latency: null, message: 'Ei saa kontrollida'
      } : s))
    }

    // Get stats
    try {
      const [usersRes, projectsRes, assetsRes, documentsRes] = await Promise.all([
        supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
        supabase.from('projects').select('*', { count: 'exact', head: true }),
        supabase.from('assets').select('*', { count: 'exact', head: true }),
        supabase.from('documents').select('*', { count: 'exact', head: true }),
      ])
      setStats({
        users: usersRes.count,
        projects: projectsRes.count,
        assets: assetsRes.count,
        documents: documentsRes.count,
      })
    } catch {
      // Stats fetch failed, keep nulls
    }

    setLastChecked(new Date())
    setIsRefreshing(false)
  }, [])

  useEffect(() => {
    checkServices()
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [checkServices])

  const healthyCount = services.filter(s => s.status === 'healthy').length
  const overallStatus = services.some(s => s.status === 'error') ? 'error'
    : services.some(s => s.status === 'warning') ? 'warning'
    : services.some(s => s.status === 'checking') ? 'checking'
    : 'healthy'

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'healthy') return <CheckCircle className="w-5 h-5 text-green-500" />
    if (status === 'error') return <XCircle className="w-5 h-5 text-red-500" />
    if (status === 'warning') return <AlertTriangle className="w-5 h-5 text-yellow-500" />
    return <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Süsteemi info</h1>
          <p className="text-gray-500">Reaalne süsteemi seisund</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={checkServices}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Värskenda
          </button>
          <div className="text-right">
            <p className="text-sm text-gray-500">Serveri aeg</p>
            <p className="font-mono text-lg">{currentTime.toLocaleTimeString('et-EE')}</p>
          </div>
        </div>
      </div>

      {/* Üldine staatus */}
      <div className={`p-6 rounded-xl border ${statusColors[overallStatus].bg}`}>
        <div className="flex items-center gap-4">
          <StatusIcon status={overallStatus} />
          <div>
            <h2 className={`text-xl font-bold ${statusColors[overallStatus].text}`}>
              {overallStatus === 'healthy' ? 'Kõik süsteemid töötavad' :
               overallStatus === 'warning' ? 'Mõned süsteemid vajavad tähelepanu' :
               overallStatus === 'error' ? 'Süsteemivigu tuvastatud' :
               'Kontrollimine...'}
            </h2>
            <p className="text-sm opacity-75">
              {healthyCount}/{services.length} teenust töökorras
              {lastChecked && ` • Viimati kontrollitud: ${lastChecked.toLocaleTimeString('et-EE')}`}
            </p>
          </div>
        </div>
      </div>

      {/* Statistika */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border">
          <p className="text-sm text-gray-500">Kasutajaid</p>
          <p className="text-2xl font-bold text-gray-800">{stats.users ?? '-'}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <p className="text-sm text-gray-500">Projekte</p>
          <p className="text-2xl font-bold text-blue-600">{stats.projects ?? '-'}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <p className="text-sm text-gray-500">Varasid</p>
          <p className="text-2xl font-bold text-green-600">{stats.assets ?? '-'}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <p className="text-sm text-gray-500">Dokumente</p>
          <p className="text-2xl font-bold text-purple-600">{stats.documents ?? '-'}</p>
        </div>
      </div>

      {/* Teenuste staatus */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold">Teenuste seisund</h2>
          <span className="text-xs text-gray-400">Reaalne kontroll</span>
        </div>
        <div className="divide-y">
          {services.map((service) => (
            <div key={service.name} className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{service.icon}</span>
                <div>
                  <span className="font-medium">{service.name}</span>
                  <p className="text-xs text-gray-500">{service.message}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {service.latency !== null && (
                  <span className={`text-sm font-mono ${service.latency > 500 ? 'text-yellow-600' : 'text-gray-500'}`}>
                    {service.latency}ms
                  </span>
                )}
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusColors[service.status].bg}`}>
                  <div className={`w-2 h-2 rounded-full ${statusColors[service.status].dot} ${service.status === 'checking' ? 'animate-pulse' : ''}`}></div>
                  <span className={`text-sm font-medium ${statusColors[service.status].text}`}>
                    {service.status === 'healthy' ? 'OK' :
                     service.status === 'warning' ? 'Hoiatus' :
                     service.status === 'error' ? 'Viga' :
                     'Kontroll'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tehnoloogia stack */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Tehnoloogia stack</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl mb-1">⚛️</p>
              <p className="font-medium">Next.js 14</p>
              <p className="text-xs text-gray-500">App Router</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl mb-1">🗄️</p>
              <p className="font-medium">Supabase</p>
              <p className="text-xs text-gray-500">PostgreSQL + RLS</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl mb-1">📦</p>
              <p className="font-medium">Turborepo 2</p>
              <p className="text-xs text-gray-500">Monorepo</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl mb-1">🎨</p>
              <p className="font-medium">Tailwind CSS</p>
              <p className="text-xs text-gray-500">@rivest/ui</p>
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <p className="text-blue-800 text-sm">
          <strong>ℹ️ Info:</strong> See leht kontrollib reaalselt Supabase teenuste seisundit.
          Latency näitab vastuse aega millisekundites. Üle 500ms loetakse aeglaseks.
        </p>
      </div>
    </div>
  )
}
