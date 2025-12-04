'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  TrendingUp,
  TrendingDown,
  Euro,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  Building2,
  Calendar,
  BarChart3,
  PieChart,
} from 'lucide-react'

interface QuoteStats {
  totalQuotes: number
  totalValue: number
  acceptedQuotes: number
  acceptedValue: number
  rejectedQuotes: number
  pendingQuotes: number
  expiredQuotes: number
  conversionRate: number
  avgQuoteValue: number
  avgResponseTime: number
  topPartners: { name: string; count: number; value: number }[]
  monthlyStats: { month: string; quotes: number; accepted: number; value: number }[]
}

export default function QuoteStatisticsPage() {
  const [stats, setStats] = useState<QuoteStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('year')

  useEffect(() => {
    fetchStats()
  }, [period])

  const fetchStats = async () => {
    setIsLoading(true)
    try {
      // In real app, this would fetch from API
      // For now, using sample data
      setStats({
        totalQuotes: 156,
        totalValue: 485000,
        acceptedQuotes: 89,
        acceptedValue: 312000,
        rejectedQuotes: 34,
        pendingQuotes: 18,
        expiredQuotes: 15,
        conversionRate: 57.1,
        avgQuoteValue: 3109.62,
        avgResponseTime: 4.2,
        topPartners: [
          { name: 'Elektrilevi OÜ', count: 23, value: 78500 },
          { name: 'Eesti Energia AS', count: 18, value: 65000 },
          { name: 'Tallinna Linn', count: 15, value: 52000 },
          { name: 'SWECO Projekt AS', count: 12, value: 41000 },
          { name: 'Nordecon AS', count: 10, value: 38500 },
        ],
        monthlyStats: [
          { month: 'Jan', quotes: 12, accepted: 7, value: 24500 },
          { month: 'Feb', quotes: 15, accepted: 9, value: 31200 },
          { month: 'Mar', quotes: 11, accepted: 6, value: 19800 },
          { month: 'Apr', quotes: 18, accepted: 11, value: 42100 },
          { month: 'May', quotes: 14, accepted: 8, value: 28900 },
          { month: 'Jun', quotes: 16, accepted: 10, value: 35600 },
          { month: 'Jul', quotes: 10, accepted: 5, value: 18200 },
          { month: 'Aug', quotes: 13, accepted: 7, value: 26400 },
          { month: 'Sep', quotes: 17, accepted: 10, value: 38100 },
          { month: 'Oct', quotes: 12, accepted: 7, value: 24800 },
          { month: 'Nov', quotes: 9, accepted: 5, value: 17500 },
          { month: 'Dec', quotes: 9, accepted: 4, value: 14900 },
        ],
      })
    } catch (error) {
      console.error('Failed to fetch statistics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => new Intl.NumberFormat('et-EE', { style: 'currency', currency: 'EUR' }).format(amount)

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#279989]" />
      </div>
    )
  }

  if (!stats) return null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link href="/quotes" className="hover:text-[#279989]">Hinnapakkumised</Link>
            <span>/</span>
            <span>Statistika</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Pakkumiste statistika</h1>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as 'month' | 'quarter' | 'year')}
            className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
          >
            <option value="month">Viimane kuu</option>
            <option value="quarter">Viimane kvartal</option>
            <option value="year">Viimane aasta</option>
          </select>
        </div>
      </div>

      {/* Main Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><FileText className="w-3.5 h-3.5" />Pakkumisi kokku</div>
          <div className="text-2xl font-bold text-slate-900">{stats.totalQuotes}</div>
          <div className="text-xs text-slate-500 mt-1">Koguväärtus: {formatCurrency(stats.totalValue)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-green-500 text-xs mb-1"><CheckCircle className="w-3.5 h-3.5" />Kinnitatud</div>
          <div className="text-2xl font-bold text-green-600">{stats.acceptedQuotes}</div>
          <div className="text-xs text-green-600 mt-1">{formatCurrency(stats.acceptedValue)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-red-500 text-xs mb-1"><XCircle className="w-3.5 h-3.5" />Tagasi lükatud</div>
          <div className="text-2xl font-bold text-red-600">{stats.rejectedQuotes}</div>
          <div className="text-xs text-slate-500 mt-1">Ootel: {stats.pendingQuotes}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-[#279989] text-xs mb-1"><TrendingUp className="w-3.5 h-3.5" />Konversioon</div>
          <div className="text-2xl font-bold text-[#279989]">{stats.conversionRate}%</div>
          <div className="text-xs text-slate-500 mt-1">Keskmine: {formatCurrency(stats.avgQuoteValue)}</div>
        </div>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Monthly Chart */}
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-slate-500" />
              Kuude lõikes
            </h3>
          </div>
          <div className="space-y-3">
            {stats.monthlyStats.map((month) => (
              <div key={month.month} className="flex items-center gap-3">
                <div className="w-8 text-xs font-medium text-slate-500">{month.month}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 h-6">
                    <div
                      className="h-4 rounded bg-slate-200"
                      style={{ width: `${(month.quotes / 20) * 100}%` }}
                    />
                    <div
                      className="h-4 rounded"
                      style={{ width: `${(month.accepted / 20) * 100}%`, backgroundColor: '#279989' }}
                    />
                  </div>
                </div>
                <div className="text-xs text-slate-500 w-20 text-right">
                  {month.accepted}/{month.quotes}
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-slate-200" />
              <span>Kokku</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: '#279989' }} />
              <span>Kinnitatud</span>
            </div>
          </div>
        </div>

        {/* Top Partners */}
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-500" />
              Top partnerid
            </h3>
          </div>
          <div className="space-y-3">
            {stats.topPartners.map((partner, index) => (
              <div key={partner.name} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium" style={{ backgroundColor: index === 0 ? '#279989' : '#e2e8f0', color: index === 0 ? 'white' : '#64748b' }}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-900">{partner.name}</div>
                    <div className="text-xs text-slate-500">{partner.count} pakkumist</div>
                  </div>
                </div>
                <div className="text-sm font-medium text-slate-900">{formatCurrency(partner.value)}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-2"><Euro className="w-3.5 h-3.5" />Keskmine pakkumise väärtus</div>
          <div className="text-xl font-bold text-slate-900">{formatCurrency(stats.avgQuoteValue)}</div>
          <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
            <TrendingUp className="w-3 h-3" />
            +12% võrreldes eelmise perioodiga
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-2"><Clock className="w-3.5 h-3.5" />Keskmine vastamise aeg</div>
          <div className="text-xl font-bold text-slate-900">{stats.avgResponseTime} päeva</div>
          <div className="flex items-center gap-1 text-xs text-green-600 mt-1">
            <TrendingDown className="w-3 h-3" />
            -0.8 päeva võrreldes eelmise perioodiga
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-amber-500 text-xs mb-2"><Clock className="w-3.5 h-3.5" />Aegunud pakkumised</div>
          <div className="text-xl font-bold text-amber-600">{stats.expiredQuotes}</div>
          <div className="text-xs text-slate-500 mt-1">{((stats.expiredQuotes / stats.totalQuotes) * 100).toFixed(1)}% kõigist pakkumistest</div>
        </div>
      </div>
    </div>
  )
}
