'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  FileText,
  Plus,
  Search,
  Building2,
  Euro,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Eye,
  Edit,
  Trash2,
  Mail,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  Calendar,
} from 'lucide-react'

interface Quote {
  id: string
  quote_number: string
  title: string
  company_id: string
  company_name: string
  contact_id?: string
  contact_name?: string
  status: 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired'
  total_amount: number
  valid_until: string
  created_at: string
  items_count: number
}

const statusLabels: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Mustand', color: 'bg-slate-100 text-slate-700', icon: Edit },
  sent: { label: 'Saadetud', color: 'bg-blue-100 text-blue-700', icon: Send },
  viewed: { label: 'Vaadatud', color: 'bg-purple-100 text-purple-700', icon: Eye },
  accepted: { label: 'Kinnitatud', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'Tagasi lükatud', color: 'bg-red-100 text-red-700', icon: XCircle },
  expired: { label: 'Aegunud', color: 'bg-amber-100 text-amber-700', icon: Clock },
}

export default function QuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    sent: 0,
    accepted: 0,
    totalValue: 0,
    acceptedValue: 0,
  })

  useEffect(() => {
    fetchQuotes()
  }, [])

  const fetchQuotes = async () => {
    try {
      const res = await fetch('/api/quotes')
      if (res.ok) {
        const data = await res.json()
        setQuotes(data.quotes || [])
        calculateStats(data.quotes || [])
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = (data: Quote[]) => {
    setStats({
      total: data.length,
      draft: data.filter((q) => q.status === 'draft').length,
      sent: data.filter((q) => q.status === 'sent' || q.status === 'viewed').length,
      accepted: data.filter((q) => q.status === 'accepted').length,
      totalValue: data.reduce((sum, q) => sum + (q.total_amount || 0), 0),
      acceptedValue: data
        .filter((q) => q.status === 'accepted')
        .reduce((sum, q) => sum + (q.total_amount || 0), 0),
    })
  }

  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch =
      quote.quote_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('et-EE', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('et-EE')
  }

  const isExpiringSoon = (validUntil: string) => {
    const days = Math.ceil((new Date(validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days <= 7 && days > 0
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Hinnapakkumised</h1>
          <p className="text-sm text-slate-500">Halda pakkumisi ja päringuid</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors"
          style={{ backgroundColor: '#279989' }}
        >
          <Plus className="w-4 h-4" />
          Uus pakkumine
        </button>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <Link
          href="/quotes/inquiries"
          className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg hover:border-[#279989] transition-colors"
        >
          <Mail className="w-4 h-4 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">Päringud</span>
          <ArrowRight className="w-3 h-3 text-slate-400 ml-auto" />
        </Link>
        <Link
          href="/quotes/sent"
          className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg hover:border-[#279989] transition-colors"
        >
          <Send className="w-4 h-4 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">Saadetud</span>
          <ArrowRight className="w-3 h-3 text-slate-400 ml-auto" />
        </Link>
        <Link
          href="/quotes/articles"
          className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg hover:border-[#279989] transition-colors"
        >
          <FileText className="w-4 h-4 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">Artiklid</span>
          <ArrowRight className="w-3 h-3 text-slate-400 ml-auto" />
        </Link>
        <Link
          href="/quotes/units"
          className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg hover:border-[#279989] transition-colors"
        >
          <Clock className="w-4 h-4 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">Ühikud</span>
          <ArrowRight className="w-3 h-3 text-slate-400 ml-auto" />
        </Link>
        <Link
          href="/quotes/statistics"
          className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-lg hover:border-[#279989] transition-colors"
        >
          <TrendingUp className="w-4 h-4 text-slate-600" />
          <span className="text-sm font-medium text-slate-700">Statistika</span>
          <ArrowRight className="w-3 h-3 text-slate-400 ml-auto" />
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <FileText className="w-3.5 h-3.5" />
            Kokku
          </div>
          <div className="text-xl font-bold text-slate-900">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <Edit className="w-3.5 h-3.5" />
            Mustandid
          </div>
          <div className="text-xl font-bold text-slate-900">{stats.draft}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-blue-500 text-xs mb-1">
            <Send className="w-3.5 h-3.5" />
            Saadetud
          </div>
          <div className="text-xl font-bold text-blue-600">{stats.sent}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-green-500 text-xs mb-1">
            <CheckCircle className="w-3.5 h-3.5" />
            Kinnitatud
          </div>
          <div className="text-xl font-bold text-green-600">{stats.accepted}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <Euro className="w-3.5 h-3.5" />
            Koguväärtus
          </div>
          <div className="text-lg font-bold text-slate-900">{formatCurrency(stats.totalValue)}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-green-500 text-xs mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            Kinnitatud
          </div>
          <div className="text-lg font-bold text-green-600">{formatCurrency(stats.acceptedValue)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Otsi pakkumist..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
        >
          <option value="all">Kõik staatused</option>
          <option value="draft">Mustand</option>
          <option value="sent">Saadetud</option>
          <option value="viewed">Vaadatud</option>
          <option value="accepted">Kinnitatud</option>
          <option value="rejected">Tagasi lükatud</option>
          <option value="expired">Aegunud</option>
        </select>
      </div>

      {/* Quotes Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#279989]" />
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            {searchQuery || statusFilter !== 'all' ? 'Pakkumisi ei leitud' : 'Pakkumised puuduvad'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Pakkumine</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Ettevõte</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Staatus</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Summa</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Kehtiv kuni</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Tegevused</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotes.map((quote) => {
                const status = statusLabels[quote.status] || statusLabels.draft
                const StatusIcon = status.icon
                const expiringSoon = quote.status === 'sent' && isExpiringSoon(quote.valid_until)

                return (
                  <tr key={quote.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/quotes/${quote.id}`} className="font-medium text-slate-900 hover:text-[#279989]">
                        {quote.quote_number}
                      </Link>
                      <div className="text-xs text-slate-500">{quote.title}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <div>
                          <div className="text-sm text-slate-900">{quote.company_name}</div>
                          {quote.contact_name && <div className="text-xs text-slate-500">{quote.contact_name}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-slate-900">{formatCurrency(quote.total_amount)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-sm text-slate-600">{formatDate(quote.valid_until)}</span>
                        {expiringSoon && <AlertCircle className="w-3.5 h-3.5 text-amber-500" title="Aegub peagi" />}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button className="p-1.5 hover:bg-slate-100 rounded" title="Vaata">
                          <Eye className="w-4 h-4 text-slate-500" />
                        </button>
                        <button className="p-1.5 hover:bg-slate-100 rounded" title="Muuda">
                          <Edit className="w-4 h-4 text-slate-500" />
                        </button>
                        <button className="p-1.5 hover:bg-slate-100 rounded" title="Saada">
                          <Send className="w-4 h-4 text-slate-500" />
                        </button>
                        <button className="p-1.5 hover:bg-red-50 rounded" title="Kustuta">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Quote Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Uus pakkumine</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <XCircle className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-4 text-center text-slate-500 py-12">Pakkumise loomine - tuleb peagi</div>
          </div>
        </div>
      )}
    </div>
  )
}
