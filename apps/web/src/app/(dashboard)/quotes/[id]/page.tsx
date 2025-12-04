'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Edit,
  Send,
  FileText,
  MessageSquare,
  History,
  Building2,
  User,
  Calendar,
  Euro,
  Copy,
  Trash2,
  MoreVertical,
  RefreshCw,
  Eye,
  Mail,
  Download,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
} from 'lucide-react'
import {
  QuoteStatusTimeline,
  StatusBadge,
  QuoteEditor,
  CommentsThread,
  EmailComposer,
  QuotePDFGenerator,
} from '@/components/quotes'
import type { Quote, QuoteItem, QuoteComment, QuoteStatus } from '@rivest/types'

interface QuoteDetailData {
  quote: Quote
  items: QuoteItem[]
  comments: QuoteComment[]
  revisions: {
    id: string
    revisionNumber: number
    quoteNumber: string
    createdAt: string
    status: QuoteStatus
  }[]
}

export default function QuoteDetailPage() {
  const router = useRouter()
  const params = useParams()
  const quoteId = params.id as string

  const [data, setData] = useState<QuoteDetailData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'edit' | 'comments' | 'history'>('overview')
  const [showEmailComposer, setShowEmailComposer] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

  const fetchQuote = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/quotes/${quoteId}`)
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Pakkumist ei leitud')
        }
        throw new Error('Pakkumise laadimine ebaõnnestus')
      }
      const responseData = await res.json()
      setData(responseData)
    } catch (err) {
      console.error('Failed to fetch quote:', err)
      setError(err instanceof Error ? err.message : 'Pakkumise laadimine ebaõnnestus')
    } finally {
      setIsLoading(false)
    }
  }, [quoteId])

  useEffect(() => {
    fetchQuote()
  }, [fetchQuote])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('et-EE', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('et-EE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const formatDateTime = (date: string) => {
    return new Date(date).toLocaleString('et-EE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const handleDelete = async () => {
    if (!confirm('Kas olete kindel, et soovite selle pakkumise kustutada?')) return

    try {
      const res = await fetch(`/api/quotes/${quoteId}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Kustutamine ebaõnnestus')
      router.push('/quotes')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kustutamine ebaõnnestus')
    }
  }

  const handleCreateRevision = async () => {
    try {
      const res = await fetch(`/api/quotes/${quoteId}/create-revision`, { method: 'POST' })
      if (!res.ok) throw new Error('Uue revisjoni loomine ebaõnnestus')
      const newQuote = await res.json()
      router.push(`/quotes/${newQuote.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Uue revisjoni loomine ebaõnnestus')
    }
  }

  const handleDuplicate = async () => {
    try {
      const res = await fetch(`/api/quotes/${quoteId}/duplicate`, { method: 'POST' })
      if (!res.ok) throw new Error('Kopeerimine ebaõnnestus')
      const newQuote = await res.json()
      router.push(`/quotes/${newQuote.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kopeerimine ebaõnnestus')
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#279989]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Link href="/quotes" className="flex items-center gap-2 text-sm text-slate-600 hover:text-[#279989]">
          <ArrowLeft className="w-4 h-4" />
          Tagasi
        </Link>
        <div className="flex items-center gap-2 p-4 text-red-700 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          {error}
        </div>
      </div>
    )
  }

  if (!data) return null

  const { quote, items, comments, revisions } = data

  const isExpired = quote.validUntil && new Date(quote.validUntil) < new Date()
  const isExpiringSoon = quote.validUntil && !isExpired &&
    Math.ceil((new Date(quote.validUntil).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) <= 7

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <Link href="/quotes" className="flex items-center gap-2 text-sm text-slate-600 hover:text-[#279989]">
        <ArrowLeft className="w-4 h-4" />
        Hinnapakkumised
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-slate-900">{quote.quoteNumber}</h1>
            <span className="text-lg" title={quote.language === 'et' ? 'Eesti keel' : 'English'}>
              {quote.language === 'et' ? '🇪🇪' : '🇬🇧'}
            </span>
            <StatusBadge status={quote.status} type="quote" />
            {quote.revisionNumber > 1 && (
              <span className="text-sm bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                Revisjon {quote.revisionNumber}
              </span>
            )}
          </div>
          <p className="text-slate-600 mt-1">{quote.title}</p>

          {/* Pipeline */}
          <div className="mt-4">
            <QuoteStatusTimeline currentStatus={quote.status} size="lg" showLabels />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowEmailComposer(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
            style={{ backgroundColor: '#279989' }}
          >
            <Send className="w-4 h-4" />
            Saada
          </button>

          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                <button
                  onClick={() => { setActiveTab('edit'); setShowMenu(false) }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Edit className="w-4 h-4" />
                  Muuda
                </button>
                <button
                  onClick={() => { handleDuplicate(); setShowMenu(false) }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Copy className="w-4 h-4" />
                  Kopeeri
                </button>
                <button
                  onClick={() => { handleCreateRevision(); setShowMenu(false) }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <RefreshCw className="w-4 h-4" />
                  Loo uus revisjon
                </button>
                <hr className="my-1" />
                <button
                  onClick={() => { handleDelete(); setShowMenu(false) }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                  Kustuta
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200">
        <nav className="flex gap-6">
          {[
            { id: 'overview', label: 'Ülevaade', icon: Eye },
            { id: 'edit', label: 'Muuda', icon: Edit },
            { id: 'comments', label: `Arutelu (${comments.length})`, icon: MessageSquare },
            { id: 'history', label: `Ajalugu (${revisions.length})`, icon: History },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`
                flex items-center gap-2 px-1 py-3 text-sm font-medium border-b-2 -mb-px transition-colors
                ${activeTab === tab.id
                  ? 'border-[#279989] text-[#279989]'
                  : 'border-transparent text-slate-500 hover:text-slate-700'}
              `}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quote details card */}
            <div className="bg-white border border-slate-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Pakkumise andmed</h2>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Ettevõte:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Building2 className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-900">
                      {quote.companyName || '-'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500">Kontaktisik:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <User className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-900">
                      {quote.contactName || '-'}
                    </span>
                  </div>
                  {quote.contactEmail && (
                    <a
                      href={`mailto:${quote.contactEmail}`}
                      className="text-xs text-[#279989] hover:underline flex items-center gap-1 mt-0.5"
                    >
                      <Mail className="w-3 h-3" />
                      {quote.contactEmail}
                    </a>
                  )}
                </div>

                <div>
                  <span className="text-slate-500">Projekt:</span>
                  <div className="flex items-center gap-2 mt-1">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span className="font-medium text-slate-900">
                      {quote.projectName || '-'}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-slate-500">Kehtib kuni:</span>
                  <div className={`flex items-center gap-2 mt-1 ${isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : ''}`}>
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">
                      {quote.validUntil ? formatDate(quote.validUntil) : '-'}
                    </span>
                    {isExpired && <span className="text-xs">(Aegunud)</span>}
                    {isExpiringSoon && <span className="text-xs">(Aegub varsti)</span>}
                  </div>
                </div>
              </div>

              {quote.description && (
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <span className="text-slate-500 text-sm">Kirjeldus:</span>
                  <p className="text-slate-700 mt-1">{quote.description}</p>
                </div>
              )}
            </div>

            {/* Items table */}
            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
              <div className="p-4 border-b border-slate-200">
                <h2 className="text-lg font-semibold text-slate-900">Read ({items.length})</h2>
              </div>
              {items.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  Pakkumisel puuduvad read
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Kood</th>
                        <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Nimetus</th>
                        <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Kogus</th>
                        <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Ühik</th>
                        <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Ühikuhind</th>
                        <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Summa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50">
                          <td className="px-4 py-3 text-sm font-mono text-slate-600">{item.code || '-'}</td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-slate-900">
                              {quote.language === 'et' ? item.nameEt : item.nameEn}
                            </div>
                            {(quote.language === 'et' ? item.descriptionEt : item.descriptionEn) && (
                              <div className="text-xs text-slate-500">
                                {quote.language === 'et' ? item.descriptionEt : item.descriptionEn}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-right text-slate-900">{item.quantity}</td>
                          <td className="px-4 py-3 text-sm text-slate-600">{item.unit}</td>
                          <td className="px-4 py-3 text-sm text-right text-slate-900">{formatCurrency(item.unitPrice)}</td>
                          <td className="px-4 py-3 text-sm text-right font-medium text-slate-900">{formatCurrency(item.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50">
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-sm text-right font-medium text-slate-600">Vahesumma:</td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-slate-900">{formatCurrency(quote.subtotal)}</td>
                      </tr>
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-sm text-right text-slate-600">KM (22%):</td>
                        <td className="px-4 py-3 text-sm text-right text-slate-900">{formatCurrency(quote.vatAmount)}</td>
                      </tr>
                      <tr>
                        <td colSpan={5} className="px-4 py-3 text-right font-bold text-slate-900">KOKKU:</td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 text-lg">{formatCurrency(quote.total)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Notes */}
            {(quote.notesEt || quote.notesEn) && (
              <div className="bg-white border border-slate-200 rounded-lg p-6">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Märkused</h2>
                <p className="text-slate-700 whitespace-pre-wrap">
                  {quote.language === 'et' ? quote.notesEt : quote.notesEn}
                </p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Totals */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h3 className="font-medium text-slate-900 mb-4">Kokkuvõte</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Vahesumma:</span>
                  <span className="font-medium text-slate-900">{formatCurrency(quote.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">KM (22%):</span>
                  <span className="font-medium text-slate-900">{formatCurrency(quote.vatAmount)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between text-lg">
                  <span className="font-medium text-slate-900">Kokku:</span>
                  <span className="font-bold text-slate-900">{formatCurrency(quote.total)}</span>
                </div>
              </div>
            </div>

            {/* PDF */}
            <div className="bg-white border border-slate-200 rounded-lg p-4">
              <h3 className="font-medium text-slate-900 mb-4">PDF dokumendid</h3>
              <QuotePDFGenerator
                quote={quote}
                onGenerated={() => fetchQuote()}
              />
            </div>

            {/* Metadata */}
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <h3 className="font-medium text-slate-900 mb-3 text-sm">Info</h3>
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Loodud:</span>
                  <span>{formatDateTime(quote.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Muudetud:</span>
                  <span>{formatDateTime(quote.updatedAt)}</span>
                </div>
                {quote.sentAt && (
                  <div className="flex justify-between">
                    <span>Saadetud:</span>
                    <span>{formatDateTime(quote.sentAt)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Read:</span>
                  <span>{items.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Keel:</span>
                  <span>{quote.language === 'et' ? 'Eesti' : 'English'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'edit' && (
        <QuoteEditor
          quoteId={quoteId}
          onSave={() => {
            setActiveTab('overview')
            fetchQuote()
          }}
          onClose={() => setActiveTab('overview')}
        />
      )}

      {activeTab === 'comments' && (
        <div className="bg-white border border-slate-200 rounded-lg h-[600px]">
          <CommentsThread
            quoteId={quoteId}
            currentUserId="current-user-id" // TODO: Get from auth context
            currentUserName="Kasutaja" // TODO: Get from auth context
          />
        </div>
      )}

      {activeTab === 'history' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Revisjonide ajalugu</h2>

          {revisions.length === 0 ? (
            <p className="text-slate-500">Teisi revisione pole</p>
          ) : (
            <div className="space-y-3">
              {revisions.map((rev) => (
                <div
                  key={rev.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    rev.id === quoteId
                      ? 'border-[#279989] bg-[#279989]/5'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      rev.id === quoteId ? 'bg-[#279989] text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      R{rev.revisionNumber}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{rev.quoteNumber}</div>
                      <div className="text-xs text-slate-500">{formatDateTime(rev.createdAt)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={rev.status} type="quote" size="sm" />
                    {rev.id !== quoteId && (
                      <Link
                        href={`/quotes/${rev.id}`}
                        className="text-sm text-[#279989] hover:underline flex items-center gap-1"
                      >
                        Vaata
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={handleCreateRevision}
            className="mt-4 flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" />
            Loo uus revisjon
          </button>
        </div>
      )}

      {/* Email Composer Modal */}
      {showEmailComposer && (
        <EmailComposer
          quote={quote}
          onClose={() => setShowEmailComposer(false)}
          onSend={() => {
            setShowEmailComposer(false)
            fetchQuote()
          }}
        />
      )}
    </div>
  )
}
