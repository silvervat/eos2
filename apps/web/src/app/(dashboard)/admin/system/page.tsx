'use client'

/**
 * Admin - Süsteemi info
 *
 * Süsteemi seisund, versioonid ja konfiguratsioon
 */

import React, { useState, useEffect } from 'react'

interface SystemInfo {
  name: string
  version: string
  environment: string
  uptime: string
  lastDeploy: string
}

interface ServiceStatus {
  name: string
  status: 'healthy' | 'warning' | 'error'
  latency: string
  icon: string
}

interface PackageInfo {
  name: string
  version: string
  type: 'app' | 'package'
}

const mockSystemInfo: SystemInfo = {
  name: 'EOS2',
  version: '2.0.0',
  environment: 'production',
  uptime: '99.9%',
  lastDeploy: '2024-12-04 10:00',
}

const mockServices: ServiceStatus[] = [
  { name: 'Database (Supabase)', status: 'healthy', latency: '12ms', icon: '🗄️' },
  { name: 'API Server', status: 'healthy', latency: '45ms', icon: '🔌' },
  { name: 'File Storage', status: 'healthy', latency: '89ms', icon: '💾' },
  { name: 'Authentication', status: 'healthy', latency: '23ms', icon: '🔐' },
  { name: 'Cache (Redis)', status: 'warning', latency: '156ms', icon: '⚡' },
]

const mockPackages: PackageInfo[] = [
  { name: 'web', version: '1.0.0', type: 'app' },
  { name: '@rivest/ui', version: '1.0.0', type: 'package' },
  { name: '@rivest/db', version: '1.0.0', type: 'package' },
  { name: '@rivest/types', version: '1.0.0', type: 'package' },
  { name: '@eos2/ui-crud', version: '1.0.0', type: 'package' },
  { name: '@eos2/data-provider', version: '1.0.0', type: 'package' },
  { name: '@eos2/resources', version: '1.0.0', type: 'package' },
]

const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
  healthy: { bg: 'bg-green-50', text: 'text-green-700', dot: 'bg-green-500' },
  warning: { bg: 'bg-yellow-50', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  error: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
}

export default function SystemPage() {
  const [systemInfo] = useState<SystemInfo>(mockSystemInfo)
  const [services] = useState<ServiceStatus[]>(mockServices)
  const [packages] = useState<PackageInfo[]>(mockPackages)
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const healthyCount = services.filter(s => s.status === 'healthy').length
  const overallStatus = healthyCount === services.length ? 'healthy' : 'warning'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Süsteemi info</h1>
          <p className="text-gray-500">Süsteemi seisund ja konfiguratsioon</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Serveri aeg</p>
          <p className="font-mono text-lg">{currentTime.toLocaleTimeString('et-EE')}</p>
        </div>
      </div>

      {/* Üldine staatus */}
      <div className={`p-6 rounded-xl border ${statusColors[overallStatus].bg}`}>
        <div className="flex items-center gap-4">
          <div className={`w-4 h-4 rounded-full ${statusColors[overallStatus].dot} animate-pulse`}></div>
          <div>
            <h2 className={`text-xl font-bold ${statusColors[overallStatus].text}`}>
              {overallStatus === 'healthy' ? 'Kõik süsteemid töötavad' : 'Mõned süsteemid vajavad tähelepanu'}
            </h2>
            <p className="text-sm opacity-75">
              {healthyCount}/{services.length} teenust töökorras
            </p>
          </div>
        </div>
      </div>

      {/* Info kaardid */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border">
          <p className="text-sm text-gray-500">Versioon</p>
          <p className="text-2xl font-bold text-gray-800">{systemInfo.version}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <p className="text-sm text-gray-500">Keskkond</p>
          <p className="text-2xl font-bold text-blue-600 capitalize">{systemInfo.environment}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <p className="text-sm text-gray-500">Uptime</p>
          <p className="text-2xl font-bold text-green-600">{systemInfo.uptime}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <p className="text-sm text-gray-500">Viimane deploy</p>
          <p className="text-lg font-medium text-gray-800">{systemInfo.lastDeploy}</p>
        </div>
      </div>

      {/* Teenuste staatus */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">🏥 Teenuste seisund</h2>
        </div>
        <div className="divide-y">
          {services.map((service) => (
            <div key={service.name} className="flex items-center justify-between p-4 hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{service.icon}</span>
                <span className="font-medium">{service.name}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-gray-500 font-mono">{service.latency}</span>
                <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${statusColors[service.status].bg}`}>
                  <div className={`w-2 h-2 rounded-full ${statusColors[service.status].dot}`}></div>
                  <span className={`text-sm font-medium ${statusColors[service.status].text}`}>
                    {service.status === 'healthy' ? 'OK' : service.status === 'warning' ? 'Hoiatus' : 'Viga'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Paketid */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">📦 Monorepo paketid</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-2 gap-4">
            {packages.map((pkg) => (
              <div
                key={pkg.name}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <span className={pkg.type === 'app' ? 'text-blue-500' : 'text-gray-500'}>
                    {pkg.type === 'app' ? '🌐' : '📦'}
                  </span>
                  <code className="text-sm">{pkg.name}</code>
                </div>
                <span className="text-sm text-gray-500 font-mono">v{pkg.version}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tehnoloogiad */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">🛠️ Tehnoloogia stack</h2>
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
    </div>
  )
}
