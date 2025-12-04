'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
  LayoutGrid,
  List,
} from 'lucide-react'
import { QuoteKanban, QuoteEditor, QuoteStatusTimeline, StatusBadge } from '@/components/quotes'
import type { Quote as QuoteType, QuoteStatus } from '@rivest/types'

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
  language?: string
  revision?: number
}


export default function QuotesPage() {
  const router = useRouter()
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban')
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
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'kanban' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Kanban vaade"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-colors ${
                viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'
              }`}
              title="Nimekirja vaade"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
            style={{ backgroundColor: '#279989' }}
          >
            <Plus className="w-4 h-4" />
            Uus pakkumine
          </button>
        </div>
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

      {/* Quotes Content - Kanban or List View */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12 bg-white border border-slate-200 rounded-lg">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#279989]" />
        </div>
      ) : viewMode === 'kanban' ? (
        <QuoteKanban
          onSelectQuote={(quote) => router.push(`/quotes/${quote.id}`)}
          onCreateQuote={() => setShowAddModal(true)}
        />
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          {filteredQuotes.length === 0 ? (
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
                  const expiringSoon = quote.status === 'sent' && isExpiringSoon(quote.valid_until)

                  return (
                    <tr key={quote.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => router.push(`/quotes/${quote.id}`)}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900 hover:text-[#279989]">
                          {quote.quote_number}
                        </div>
                        <div className="text-xs text-slate-500">{quote.title}</div>
                        <QuoteStatusTimeline currentStatus={quote.status as QuoteStatus} size="sm" className="mt-1" />
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
                        <StatusBadge status={quote.status as QuoteStatus} type="quote" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="text-sm font-medium text-slate-900">{formatCurrency(quote.total_amount)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-sm text-slate-600">{formatDate(quote.valid_until)}</span>
                          {expiringSoon && <span title="Aegub peagi"><AlertCircle className="w-3.5 h-3.5 text-amber-500" /></span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="p-1.5 hover:bg-slate-100 rounded"
                            title="Vaata"
                            onClick={() => router.push(`/quotes/${quote.id}`)}
                          >
                            <Eye className="w-4 h-4 text-slate-500" />
                          </button>
                          <button
                            className="p-1.5 hover:bg-slate-100 rounded"
                            title="Muuda"
                            onClick={() => router.push(`/quotes/${quote.id}?tab=edit`)}
                          >
                            <Edit className="w-4 h-4 text-slate-500" />
                          </button>
                          <button
                            className="p-1.5 hover:bg-slate-100 rounded"
                            title="Saada"
                            onClick={() => router.push(`/quotes/${quote.id}?action=send`)}
                          >
                            <Send className="w-4 h-4 text-slate-500" />
                          </button>
                          <button
                            className="p-1.5 hover:bg-red-50 rounded"
                            title="Kustuta"
                            onClick={async () => {
                              if (confirm('Kas olete kindel, et soovite selle pakkumise kustutada?')) {
                                try {
                                  await fetch(`/api/quotes/${quote.id}`, { method: 'DELETE' })
                                  fetchQuotes()
                                } catch (error) {
                                  console.error('Failed to delete quote:', error)
                                }
                              }
                            }}
                          >
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
      )}

      {/* Add Quote Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-5xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-semibold text-slate-900">Uus pakkumine</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 rounded">
                <XCircle className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="p-4">
              <QuoteEditor
                onSave={async (quoteData) => {
                  try {
                    const res = await fetch('/api/quotes', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(quoteData),
                    })
                    if (res.ok) {
                      const data = await res.json()
                      setShowAddModal(false)
                      router.push(`/quotes/${data.id}`)
                    }
                  } catch (error) {
                    console.error('Failed to create quote:', error)
                  }
                }}
                onClose={() => setShowAddModal(false)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
