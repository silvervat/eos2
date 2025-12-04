'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Send,
  Search,
  Building2,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Euro,
  Mail,
  AlertCircle,
} from 'lucide-react'

interface Quote {
  id: string
  quote_number: string
  title: string
  company_name: string
  contact_name?: string
  status: 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired'
  total_amount: number
  valid_until: string
  sent_at: string
}

const statusLabels: Record<string, { label: string; color: string }> = {
  sent: { label: 'Saadetud', color: 'bg-blue-100 text-blue-700' },
  viewed: { label: 'Vaadatud', color: 'bg-purple-100 text-purple-700' },
  accepted: { label: 'Kinnitatud', color: 'bg-green-100 text-green-700' },
  rejected: { label: 'Tagasi lükatud', color: 'bg-red-100 text-red-700' },
  expired: { label: 'Aegunud', color: 'bg-amber-100 text-amber-700' },
}

export default function SentQuotesPage() {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchSentQuotes()
  }, [])

  const fetchSentQuotes = async () => {
    try {
      const res = await fetch('/api/quotes?status=sent,viewed,accepted,rejected,expired')
      if (res.ok) {
        const data = await res.json()
        setQuotes(data.quotes || [])
      }
    } catch (error) {
      console.error('Failed to fetch quotes:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredQuotes = quotes.filter((quote) => {
    const matchesSearch =
      quote.quote_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quote.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || quote.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatCurrency = (amount: number) => new Intl.NumberFormat('et-EE', { style: 'currency', currency: 'EUR' }).format(amount)
  const formatDate = (date: string) => new Date(date).toLocaleDateString('et-EE')

  const isExpiringSoon = (validUntil: string, status: string) => {
    if (status !== 'sent' && status !== 'viewed') return false
    const days = Math.ceil((new Date(validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days <= 7 && days > 0
  }

  const stats = {
    sent: quotes.filter((q) => q.status === 'sent').length,
    viewed: quotes.filter((q) => q.status === 'viewed').length,
    accepted: quotes.filter((q) => q.status === 'accepted').length,
    rejected: quotes.filter((q) => q.status === 'rejected').length,
    expired: quotes.filter((q) => q.status === 'expired').length,
    totalValue: quotes.filter((q) => q.status === 'accepted').reduce((sum, q) => sum + (q.total_amount || 0), 0),
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link href="/quotes" className="hover:text-[#279989]">Hinnapakkumised</Link>
            <span>/</span>
            <span>Saadetud</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Saadetud pakkumised</h1>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-blue-500 text-xs mb-1"><Send className="w-3.5 h-3.5" />Saadetud</div>
          <div className="text-xl font-bold text-blue-600">{stats.sent}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-purple-500 text-xs mb-1"><Eye className="w-3.5 h-3.5" />Vaadatud</div>
          <div className="text-xl font-bold text-purple-600">{stats.viewed}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-green-500 text-xs mb-1"><CheckCircle className="w-3.5 h-3.5" />Kinnitatud</div>
          <div className="text-xl font-bold text-green-600">{stats.accepted}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-red-500 text-xs mb-1"><XCircle className="w-3.5 h-3.5" />Tagasi lükatud</div>
          <div className="text-xl font-bold text-red-600">{stats.rejected}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-amber-500 text-xs mb-1"><Clock className="w-3.5 h-3.5" />Aegunud</div>
          <div className="text-xl font-bold text-amber-600">{stats.expired}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-green-500 text-xs mb-1"><Euro className="w-3.5 h-3.5" />Kinnitatud väärtus</div>
          <div className="text-lg font-bold text-green-600">{formatCurrency(stats.totalValue)}</div>
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
          <option value="sent">Saadetud</option>
          <option value="viewed">Vaadatud</option>
          <option value="accepted">Kinnitatud</option>
          <option value="rejected">Tagasi lükatud</option>
          <option value="expired">Aegunud</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#279989]" />
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            {searchQuery || statusFilter !== 'all' ? 'Pakkumisi ei leitud' : 'Saadetud pakkumised puuduvad'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Pakkumine</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Ettevõte</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Staatus</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Summa</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Saadetud</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Kehtiv kuni</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Tegevused</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuotes.map((quote) => {
                const status = statusLabels[quote.status] || statusLabels.sent
                const expiringSoon = isExpiringSoon(quote.valid_until, quote.status)

                return (
                  <tr key={quote.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link href={`/quotes/${quote.id}`} className="font-medium text-slate-900 hover:text-[#279989]">{quote.quote_number}</Link>
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
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-sm font-medium text-slate-900">{formatCurrency(quote.total_amount)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-sm text-slate-600">{formatDate(quote.sent_at)}</span>
                      </div>
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
                        <button className="p-1.5 hover:bg-slate-100 rounded" title="Vaata"><Eye className="w-4 h-4 text-slate-500" /></button>
                        <button className="p-1.5 hover:bg-slate-100 rounded" title="Saada uuesti"><Send className="w-4 h-4 text-slate-500" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
