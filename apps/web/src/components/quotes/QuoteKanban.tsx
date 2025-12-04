'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import {
  Plus,
  Building2,
  Euro,
  Calendar,
  Clock,
  Eye,
  Edit,
  Send,
  MessageSquare,
  FileText,
  MoreVertical,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  Globe,
  Filter,
} from 'lucide-react'
import { QuoteStatusTimeline, StatusBadge } from './QuoteStatusTimeline'
import type { Quote, QuoteStatus } from '@rivest/types'

interface KanbanColumn {
  id: QuoteStatus
  title: string
  color: string
  bgColor: string
}

const columns: KanbanColumn[] = [
  { id: 'draft', title: 'Mustandid', color: 'border-slate-400', bgColor: 'bg-slate-50' },
  { id: 'pending', title: 'Ootel', color: 'border-amber-400', bgColor: 'bg-amber-50' },
  { id: 'sent', title: 'Saadetud', color: 'border-blue-400', bgColor: 'bg-blue-50' },
  { id: 'viewed', title: 'Vaadatud', color: 'border-purple-400', bgColor: 'bg-purple-50' },
  { id: 'accepted', title: 'Kinnitatud', color: 'border-green-400', bgColor: 'bg-green-50' },
]

interface QuoteKanbanProps {
  onCreateQuote?: () => void
  onSelectQuote?: (quote: Quote) => void
}

export default function QuoteKanban({ onCreateQuote, onSelectQuote }: QuoteKanbanProps) {
  const [quotes, setQuotes] = useState<Quote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLanguage, setSelectedLanguage] = useState<'all' | 'et' | 'en'>('all')
  const [draggedQuote, setDraggedQuote] = useState<Quote | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchQuotes = useCallback(async () => {
    try {
      const res = await fetch('/api/quotes')
      if (res.ok) {
        const data = await res.json()
        const transformedQuotes: Quote[] = (data.quotes || []).map((q: Record<string, unknown>) => ({
          id: q.id as string,
          tenantId: q.tenantId as string,
          quoteNumber: (q.quoteNumber || q.quote_number || '') as string,
          year: q.year as number,
          sequenceNumber: q.sequenceNumber as number,
          revisionNumber: (q.revisionNumber || q.revision || 1) as number,
          companyId: q.companyId as string,
          companyName: q.companyName as string,
          contactId: q.contactId as string,
          contactName: q.contactName as string,
          projectId: q.projectId as string,
          projectName: q.projectName as string,
          title: q.title as string,
          description: q.description as string,
          language: (q.language || 'et') as 'et' | 'en',
          status: q.status as QuoteStatus,
          validUntil: q.validUntil as string,
          validDays: (q.validDays || 30) as number,
          sentAt: q.sentAt as string,
          createdAt: q.createdAt as string,
          updatedAt: q.updatedAt as string,
          groups: [],
          itemsCount: (q.itemsCount || 0) as number,
          subtotal: (q.subtotal || 0) as number,
          discountAmount: (q.discountAmount || 0) as number,
          discountPercent: (q.discountPercent || 0) as number,
          vatAmount: (q.vatAmount || 0) as number,
          total: (q.total || 0) as number,
          currency: (q.currency || 'EUR') as string,
          isLatestRevision: q.isLatestRevision !== false,
          createdBy: q.createdBy as string,
        }))
        setQuotes(transformedQuotes)
      }
    } catch (err) {
      console.error('Failed to fetch quotes:', err)
      setError('Pakkumiste laadimine ebaõnnestus')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchQuotes()
  }, [fetchQuotes])

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchQuotes()
    setIsRefreshing(false)
  }

  const handleDragStart = (e: React.DragEvent, quote: Quote) => {
    setDraggedQuote(quote)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = async (e: React.DragEvent, newStatus: QuoteStatus) => {
    e.preventDefault()
    if (!draggedQuote || draggedQuote.status === newStatus) {
      setDraggedQuote(null)
      return
    }

    // Optimistic update
    setQuotes(quotes.map(q =>
      q.id === draggedQuote.id ? { ...q, status: newStatus } : q
    ))

    try {
      const res = await fetch(`/api/quotes/${draggedQuote.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      if (!res.ok) {
        throw new Error('Failed to update status')
      }
    } catch {
      // Revert on error
      setQuotes(quotes.map(q =>
        q.id === draggedQuote.id ? { ...q, status: draggedQuote.status } : q
      ))
      setError('Staatuse muutmine ebaõnnestus')
    }

    setDraggedQuote(null)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('et-EE', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('et-EE')
  }

  const isExpiringSoon = (validUntil: string) => {
    if (!validUntil) return false
    const days = Math.ceil((new Date(validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return days <= 7 && days > 0
  }

  const isExpired = (validUntil: string) => {
    if (!validUntil) return false
    return new Date(validUntil) < new Date()
  }

  const filteredQuotes = quotes.filter(q => {
    if (selectedLanguage === 'all') return true
    return q.language === selectedLanguage
  })

  const getColumnQuotes = (status: QuoteStatus) => {
    return filteredQuotes.filter(q => q.status === status)
  }

  const getColumnTotal = (status: QuoteStatus) => {
    return getColumnQuotes(status).reduce((sum, q) => sum + (q.total || 0), 0)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#279989]" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Pakkumiste töölaud</h2>
          <p className="text-sm text-slate-500">Lohista pakkumisi staatuse muutmiseks</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Language filter */}
          <div className="relative">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value as 'all' | 'et' | 'en')}
              className="appearance-none pl-8 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989] bg-white"
            >
              <option value="all">Kõik keeled</option>
              <option value="et">🇪🇪 Eesti</option>
              <option value="en">🇬🇧 English</option>
            </select>
            <Globe className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            title="Värskenda"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={onCreateQuote}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
            style={{ backgroundColor: '#279989' }}
          >
            <Plus className="w-4 h-4" />
            Uus pakkumine
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto text-red-500 hover:text-red-700">×</button>
        </div>
      )}

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((column) => {
          const columnQuotes = getColumnQuotes(column.id)
          const columnTotal = getColumnTotal(column.id)

          return (
            <div
              key={column.id}
              className="flex-shrink-0 w-72"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              {/* Column Header */}
              <div className={`p-3 rounded-t-lg border-t-4 ${column.color} ${column.bgColor}`}>
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-slate-900">{column.title}</h3>
                  <span className="text-sm text-slate-500">{columnQuotes.length}</span>
                </div>
                {columnQuotes.length > 0 && (
                  <div className="text-xs text-slate-500 mt-1">
                    {formatCurrency(columnTotal)}
                  </div>
                )}
              </div>

              {/* Column Content */}
              <div className="bg-slate-100 rounded-b-lg p-2 min-h-[400px] space-y-2">
                {columnQuotes.map((quote) => (
                  <div
                    key={quote.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, quote)}
                    onClick={() => onSelectQuote?.(quote)}
                    className={`
                      bg-white rounded-lg border border-slate-200 p-3 cursor-pointer
                      hover:shadow-md hover:border-slate-300 transition-all
                      ${draggedQuote?.id === quote.id ? 'opacity-50' : ''}
                    `}
                  >
                    {/* Quote Number & Language */}
                    <div className="flex items-center justify-between mb-2">
                      <Link
                        href={`/quotes/${quote.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="font-medium text-slate-900 hover:text-[#279989]"
                      >
                        {quote.quoteNumber}
                      </Link>
                      <div className="flex items-center gap-1">
                        <span className="text-xs" title={quote.language === 'et' ? 'Eesti keel' : 'English'}>
                          {quote.language === 'et' ? '🇪🇪' : '🇬🇧'}
                        </span>
                        {quote.revisionNumber > 1 && (
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">
                            R{quote.revisionNumber}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Title */}
                    <div className="text-sm text-slate-600 line-clamp-1 mb-2">{quote.title}</div>

                    {/* Pipeline/Timeline */}
                    <div className="mb-3">
                      <QuoteStatusTimeline currentStatus={quote.status} size="sm" />
                    </div>

                    {/* Company */}
                    {quote.companyName && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                        <Building2 className="w-3.5 h-3.5" />
                        <span className="truncate">{quote.companyName}</span>
                      </div>
                    )}

                    {/* Amount */}
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-slate-500">Summa:</span>
                      <span className="font-medium text-slate-900">{formatCurrency(quote.total)}</span>
                    </div>

                    {/* Valid Until */}
                    {quote.validUntil && (
                      <div className={`
                        flex items-center gap-1.5 text-xs
                        ${isExpired(quote.validUntil) ? 'text-red-500' : isExpiringSoon(quote.validUntil) ? 'text-amber-500' : 'text-slate-500'}
                      `}>
                        {isExpired(quote.validUntil) ? (
                          <AlertCircle className="w-3.5 h-3.5" />
                        ) : (
                          <Calendar className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {isExpired(quote.validUntil) ? 'Aegunud' : `Kehtib kuni ${formatDate(quote.validUntil)}`}
                        </span>
                      </div>
                    )}

                    {/* Footer actions */}
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-2 text-slate-400">
                        <button
                          onClick={(e) => { e.stopPropagation() }}
                          className="p-1 hover:bg-slate-100 rounded"
                          title="Vaata"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation() }}
                          className="p-1 hover:bg-slate-100 rounded"
                          title="Muuda"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation() }}
                          className="p-1 hover:bg-slate-100 rounded"
                          title="Saada"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-slate-400">
                        {quote.itemsCount > 0 && (
                          <span className="flex items-center gap-0.5">
                            <FileText className="w-3 h-3" />
                            {quote.itemsCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {/* Empty state */}
                {columnQuotes.length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    Pakkumised puuduvad
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {/* Completed/Rejected column */}
        <div className="flex-shrink-0 w-72">
          <div className="p-3 rounded-t-lg border-t-4 border-red-400 bg-red-50">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-900">Lõpetatud</h3>
              <span className="text-sm text-slate-500">
                {filteredQuotes.filter(q => q.status === 'rejected' || q.status === 'expired' || q.status === 'revised').length}
              </span>
            </div>
          </div>
          <div className="bg-slate-100 rounded-b-lg p-2 min-h-[400px] space-y-2">
            {filteredQuotes
              .filter(q => q.status === 'rejected' || q.status === 'expired' || q.status === 'revised')
              .map((quote) => (
                <div
                  key={quote.id}
                  onClick={() => onSelectQuote?.(quote)}
                  className="bg-white rounded-lg border border-slate-200 p-3 cursor-pointer hover:shadow-md hover:border-slate-300 transition-all opacity-75"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-700">{quote.quoteNumber}</span>
                    <StatusBadge status={quote.status} type="quote" size="sm" />
                  </div>
                  <div className="text-sm text-slate-500 line-clamp-1">{quote.title}</div>
                  {quote.companyName && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
                      <Building2 className="w-3.5 h-3.5" />
                      <span className="truncate">{quote.companyName}</span>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  )
}
