'use client'

import { useState, useEffect } from 'react'
import {
  TrendingUp,
  Building,
  Users,
  FileText,
  FolderOpen,
  Euro,
  ArrowUp,
  ArrowDown,
  Loader2,
  PieChart,
  BarChart3,
} from 'lucide-react'
import { Card } from '@rivest/ui'

interface PartnerStats {
  totalPartners: number
  byType: Record<string, number>
  totalContacts: number
  totalInvoices: number
  totalRevenue: number
  totalProjects: number
  topPartners: Array<{
    id: string
    name: string
    type: string
    revenue: number
    projects: number
  }>
  monthlyGrowth: number
}

export default function PartnerStatisticsPage() {
  const [stats, setStats] = useState<PartnerStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      setIsLoading(true)
      // For now, use mock data
      setStats({
        totalPartners: 156,
        byType: {
          client: 89,
          supplier: 34,
          subcontractor: 21,
          partner: 8,
          manufacturer: 4,
        },
        totalContacts: 423,
        totalInvoices: 1247,
        totalRevenue: 2456789.50,
        totalProjects: 89,
        topPartners: [
          { id: '1', name: 'AS Ehitus', type: 'client', revenue: 456789, projects: 12 },
          { id: '2', name: 'OÜ Materjalid', type: 'supplier', revenue: 234567, projects: 8 },
          { id: '3', name: 'Elekter AS', type: 'subcontractor', revenue: 189456, projects: 15 },
          { id: '4', name: 'Betoon OÜ', type: 'supplier', revenue: 145678, projects: 6 },
          { id: '5', name: 'Kinnisvara AS', type: 'client', revenue: 134567, projects: 4 },
        ],
        monthlyGrowth: 12.5,
      })
    } finally {
      setIsLoading(false)
    }
  }

  const typeLabels: Record<string, string> = {
    client: 'Kliendid',
    supplier: 'Tarnijad',
    subcontractor: 'Alltöövõtjad',
    partner: 'Partnerid',
    manufacturer: 'Tootjad',
  }

  const typeColors: Record<string, string> = {
    client: 'bg-blue-500',
    supplier: 'bg-green-500',
    subcontractor: 'bg-orange-500',
    partner: 'bg-purple-500',
    manufacturer: 'bg-pink-500',
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('et-EE', { style: 'currency', currency: 'EUR' }).format(value)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5" style={{ color: '#279989' }} />
          Statistika
        </h1>
        <p className="text-sm text-slate-500">Ettevõtete ülevaade ja analüütika</p>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Ettevõtteid</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalPartners}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Building className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          <div className="flex items-center gap-1 mt-2 text-sm">
            <ArrowUp className="w-3 h-3 text-green-500" />
            <span className="text-green-600 font-medium">{stats.monthlyGrowth}%</span>
            <span className="text-slate-500">sel kuul</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Kontakte</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalContacts}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Käive</p>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.totalRevenue)}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Euro className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-500">Projekte</p>
              <p className="text-2xl font-bold text-slate-900">{stats.totalProjects}</p>
            </div>
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <FolderOpen className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Partners by Type */}
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-slate-400" />
            Ettevõtted tüübi järgi
          </h2>
          <div className="space-y-3">
            {Object.entries(stats.byType).map(([type, count]) => {
              const percentage = Math.round((count / stats.totalPartners) * 100)
              return (
                <div key={type} className="flex items-center gap-3">
                  <div className="w-24 text-sm text-slate-600">{typeLabels[type]}</div>
                  <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${typeColors[type]} transition-all duration-500`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <div className="w-16 text-sm text-slate-600 text-right">
                    {count} ({percentage}%)
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        {/* Top Partners */}
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-slate-400" />
            Top 5 ettevõtet
          </h2>
          <div className="space-y-3">
            {stats.topPartners.map((partner, index) => (
              <div key={partner.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50">
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                  {index + 1}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{partner.name}</p>
                  <p className="text-xs text-slate-500">{typeLabels[partner.type]}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-slate-900">{formatCurrency(partner.revenue)}</p>
                  <p className="text-xs text-slate-500">{partner.projects} projekti</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
