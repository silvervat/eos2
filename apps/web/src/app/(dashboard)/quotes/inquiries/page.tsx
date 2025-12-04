'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Mail,
  Plus,
  Search,
  Building2,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  User,
  FileText,
} from 'lucide-react'

interface Inquiry {
  id: string
  inquiry_number: string
  title: string
  company_id: string
  company_name: string
  contact_id?: string
  contact_name?: string
  status: 'new' | 'in_progress' | 'quoted' | 'won' | 'lost'
  description: string
  deadline?: string
  created_at: string
  source?: string
}

const statusLabels: Record<string, { label: string; color: string }> = {
  new: { label: 'Uus', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: 'Töös', color: 'bg-amber-100 text-amber-700' },
  quoted: { label: 'Pakkumine tehtud', color: 'bg-purple-100 text-purple-700' },
  won: { label: 'Võidetud', color: 'bg-green-100 text-green-700' },
  lost: { label: 'Kaotatud', color: 'bg-red-100 text-red-700' },
}

export default function InquiriesPage() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [stats, setStats] = useState({ total: 0, new: 0, inProgress: 0, quoted: 0, won: 0, lost: 0 })

  useEffect(() => {
    fetchInquiries()
  }, [])

  const fetchInquiries = async () => {
    try {
      const res = await fetch('/api/quotes/inquiries')
      if (res.ok) {
        const data = await res.json()
        setInquiries(data.inquiries || [])
        calculateStats(data.inquiries || [])
      }
    } catch (error) {
      console.error('Failed to fetch inquiries:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const calculateStats = (data: Inquiry[]) => {
    setStats({
      total: data.length,
      new: data.filter((i) => i.status === 'new').length,
      inProgress: data.filter((i) => i.status === 'in_progress').length,
      quoted: data.filter((i) => i.status === 'quoted').length,
      won: data.filter((i) => i.status === 'won').length,
      lost: data.filter((i) => i.status === 'lost').length,
    })
  }

  const filteredInquiries = inquiries.filter((inquiry) => {
    const matchesSearch =
      inquiry.inquiry_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inquiry.company_name?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === 'all' || inquiry.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatDate = (date: string) => new Date(date).toLocaleDateString('et-EE')

  const isOverdue = (deadline?: string) => {
    if (!deadline) return false
    return new Date(deadline) < new Date()
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link href="/quotes" className="hover:text-[#279989]">Hinnapakkumised</Link>
            <span>/</span>
            <span>Päringud</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Päringud</h1>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg"
          style={{ backgroundColor: '#279989' }}
        >
          <Plus className="w-4 h-4" />
          Uus päring
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><Mail className="w-3.5 h-3.5" />Kokku</div>
          <div className="text-xl font-bold text-slate-900">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-blue-500 text-xs mb-1"><Mail className="w-3.5 h-3.5" />Uued</div>
          <div className="text-xl font-bold text-blue-600">{stats.new}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-amber-500 text-xs mb-1"><Clock className="w-3.5 h-3.5" />Töös</div>
          <div className="text-xl font-bold text-amber-600">{stats.inProgress}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-purple-500 text-xs mb-1"><FileText className="w-3.5 h-3.5" />Pakkumine tehtud</div>
          <div className="text-xl font-bold text-purple-600">{stats.quoted}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-green-500 text-xs mb-1"><CheckCircle className="w-3.5 h-3.5" />Võidetud</div>
          <div className="text-xl font-bold text-green-600">{stats.won}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-red-500 text-xs mb-1"><XCircle className="w-3.5 h-3.5" />Kaotatud</div>
          <div className="text-xl font-bold text-red-600">{stats.lost}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Otsi päringut..."
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
          <option value="new">Uus</option>
          <option value="in_progress">Töös</option>
          <option value="quoted">Pakkumine tehtud</option>
          <option value="won">Võidetud</option>
          <option value="lost">Kaotatud</option>
        </select>
      </div>

      {/* List */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#279989]" />
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            {searchQuery || statusFilter !== 'all' ? 'Päringuid ei leitud' : 'Päringud puuduvad'}
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredInquiries.map((inquiry) => {
              const status = statusLabels[inquiry.status] || statusLabels.new
              const overdue = inquiry.status !== 'won' && inquiry.status !== 'lost' && isOverdue(inquiry.deadline)

              return (
                <div key={inquiry.id} className="p-4 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-slate-500">{inquiry.inquiry_number}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}>{status.label}</span>
                        {overdue && <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Tähtaeg ületatud</span>}
                      </div>
                      <h3 className="text-base font-medium text-slate-900 mb-1">{inquiry.title}</h3>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                        <div className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{inquiry.company_name}</div>
                        {inquiry.contact_name && <div className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{inquiry.contact_name}</div>}
                        <div className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(inquiry.created_at)}</div>
                        {inquiry.deadline && (
                          <div className={`flex items-center gap-1 ${overdue ? 'text-red-500' : ''}`}>
                            <Clock className="w-3.5 h-3.5" />Tähtaeg: {formatDate(inquiry.deadline)}
                          </div>
                        )}
                      </div>
                      {inquiry.description && <p className="text-sm text-slate-600 mt-2 line-clamp-2">{inquiry.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 hover:bg-slate-100 rounded-lg" title="Vaata"><Eye className="w-4 h-4 text-slate-500" /></button>
                      <button className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white rounded-lg" style={{ backgroundColor: '#279989' }} title="Koosta pakkumine">
                        <FileText className="w-3.5 h-3.5" />Pakkumine
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Uus päring</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 rounded"><XCircle className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="p-4 text-center text-slate-500 py-12">Päringu lisamine - tuleb peagi</div>
          </div>
        </div>
      )}
    </div>
  )
}
