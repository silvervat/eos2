'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Plus,
  Search,
  MoreVertical,
  PlusCircle,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  MessageSquare,
  DollarSign,
  Calendar,
  User,
} from 'lucide-react'

interface AdditionalWork {
  id: string
  number: string
  title: string
  description: string
  type: 'change_order' | 'extra_work' | 'claim'
  status: 'draft' | 'submitted' | 'approved' | 'rejected' | 'invoiced'
  estimatedCost: number
  approvedCost?: number
  requestedBy: string
  requestDate: string
  approvedBy?: string
  approvedDate?: string
  reason: string
  impact?: string
}

const mockAdditionalWorks: AdditionalWork[] = [
  {
    id: '1',
    number: 'LT-2024-001',
    title: 'Kanalitrassi muutmine A-tsoonis',
    description: 'Projektis ette nähtud kanalitrass tuleb ümber paigutada konstruktsioonide tõttu. Vajalik lisatöö ~45m uut kanalit.',
    type: 'change_order',
    status: 'approved',
    estimatedCost: 2850,
    approvedCost: 2650,
    requestedBy: 'Jaan Tamm',
    requestDate: '2024-02-28',
    approvedBy: 'Mart Saar',
    approvedDate: '2024-03-02',
    reason: 'Ehituslikud takistused',
    impact: 'Tööde tähtaega ei mõjuta',
  },
  {
    id: '2',
    number: 'LT-2024-002',
    title: 'Lisa väljatõmbe punkt konverentsiruumis',
    description: 'Kliendi soovil lisandus üks väljatõmbe punkt, mida algses projektis ei olnud.',
    type: 'extra_work',
    status: 'submitted',
    estimatedCost: 890,
    requestedBy: 'Peeter Mets',
    requestDate: '2024-03-10',
    reason: 'Kliendi lisasoov',
  },
  {
    id: '3',
    number: 'LT-2024-003',
    title: 'Isolatsiooni paksuse suurendamine',
    description: 'Energiaauditi tulemusel nõutakse paksema isolatsiooni kasutamist teatud lõikudel.',
    type: 'change_order',
    status: 'draft',
    estimatedCost: 1250,
    requestedBy: 'Jaan Tamm',
    requestDate: '2024-03-14',
    reason: 'Normatiivne nõue',
    impact: 'Võimalik 2-päevane viivitus',
  },
  {
    id: '4',
    number: 'LT-2024-004',
    title: 'Puudulik pääs tehnoruumi',
    description: 'Ehitaja ei ole taganud ligipääsu, ootel konstruktsioonide valmimist.',
    type: 'claim',
    status: 'submitted',
    estimatedCost: 450,
    requestedBy: 'Andres Kask',
    requestDate: '2024-03-08',
    reason: 'Peatöövõtja viivitus',
    impact: '3 päeva ootamist',
  },
]

const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
  change_order: { label: 'Muudatus', color: 'text-blue-600', bg: 'bg-blue-100' },
  extra_work: { label: 'Lisatöö', color: 'text-purple-600', bg: 'bg-purple-100' },
  claim: { label: 'Pretensioon', color: 'text-orange-600', bg: 'bg-orange-100' },
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  draft: { label: 'Mustand', color: 'text-gray-600', bg: 'bg-gray-100', icon: FileText },
  submitted: { label: 'Esitatud', color: 'text-blue-600', bg: 'bg-blue-100', icon: Clock },
  approved: { label: 'Kinnitatud', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2 },
  rejected: { label: 'Tagasi lükatud', color: 'text-red-600', bg: 'bg-red-100', icon: XCircle },
  invoiced: { label: 'Arveldatud', color: 'text-indigo-600', bg: 'bg-indigo-100', icon: DollarSign },
}

export default function AdditionalWorksPage() {
  const params = useParams()
  const projectId = params.id as string

  const [works] = useState<AdditionalWork[]>(mockAdditionalWorks)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredWorks = works.filter(work => {
    const matchesSearch = search === '' ||
      work.title.toLowerCase().includes(search.toLowerCase()) ||
      work.number.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' || work.type === typeFilter
    const matchesStatus = statusFilter === 'all' || work.status === statusFilter
    return matchesSearch && matchesType && matchesStatus
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('et-EE', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('et-EE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  // Stats
  const totalEstimated = works.reduce((sum, w) => sum + w.estimatedCost, 0)
  const totalApproved = works.filter(w => w.status === 'approved').reduce((sum, w) => sum + (w.approvedCost || 0), 0)
  const pendingCount = works.filter(w => ['draft', 'submitted'].includes(w.status)).length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Kokku</p>
          <p className="text-2xl font-bold text-gray-900">{works.length}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-600">Ootel kinnitust</p>
          <p className="text-2xl font-bold text-yellow-700">{pendingCount}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600">Hinnanguline</p>
          <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalEstimated)}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600">Kinnitatud</p>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(totalApproved)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Otsi lisatööd..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="all">Kõik tüübid</option>
          <option value="change_order">Muudatused</option>
          <option value="extra_work">Lisatööd</option>
          <option value="claim">Pretensioonid</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="all">Kõik staatused</option>
          <option value="draft">Mustand</option>
          <option value="submitted">Esitatud</option>
          <option value="approved">Kinnitatud</option>
          <option value="rejected">Tagasi lükatud</option>
          <option value="invoiced">Arveldatud</option>
        </select>
        <button className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Uus lisatöö
        </button>
      </div>

      {/* Works List */}
      <div className="space-y-4">
        {filteredWorks.map((work) => {
          const typeInfo = typeConfig[work.type]
          const statusInfo = statusConfig[work.status]
          const StatusIcon = statusInfo.icon

          return (
            <div key={work.id} className="bg-white border rounded-lg p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <PlusCircle className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">{work.number}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${typeInfo.bg} ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900">{work.title}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${statusInfo.bg} ${statusInfo.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusInfo.label}
                  </span>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4">{work.description}</p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                <div>
                  <p className="text-gray-500">Põhjus</p>
                  <p className="font-medium">{work.reason}</p>
                </div>
                <div>
                  <p className="text-gray-500">Hinnang</p>
                  <p className="font-medium">{formatCurrency(work.estimatedCost)}</p>
                </div>
                {work.approvedCost && (
                  <div>
                    <p className="text-gray-500">Kinnitatud summa</p>
                    <p className="font-medium text-green-600">{formatCurrency(work.approvedCost)}</p>
                  </div>
                )}
                {work.impact && (
                  <div>
                    <p className="text-gray-500">Mõju</p>
                    <p className="font-medium text-orange-600">{work.impact}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-3 border-t text-xs text-gray-500">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {work.requestedBy}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formatDate(work.requestDate)}
                  </span>
                </div>
                {work.approvedBy && (
                  <span>Kinnitas: {work.approvedBy} ({formatDate(work.approvedDate!)})</span>
                )}
              </div>
            </div>
          )
        })}

        {filteredWorks.length === 0 && (
          <div className="text-center py-12 bg-white border rounded-lg text-gray-500">
            <PlusCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>Lisatöid ei leitud</p>
          </div>
        )}
      </div>
    </div>
  )
}
