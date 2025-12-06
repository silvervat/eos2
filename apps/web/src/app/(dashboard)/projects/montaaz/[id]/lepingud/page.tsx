'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Plus,
  Search,
  MoreVertical,
  FileText,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  Download,
  Eye,
  Calendar,
  Building2,
  DollarSign,
  PenLine,
} from 'lucide-react'

interface Contract {
  id: string
  contractNumber: string
  title: string
  type: 'main' | 'subcontract' | 'service' | 'supply'
  partner: string
  value: number
  startDate: string
  endDate: string
  status: 'draft' | 'pending_signature' | 'active' | 'completed' | 'terminated'
  signedDate?: string
  signatories: string[]
  attachments: number
  description?: string
}

const mockContracts: Contract[] = [
  {
    id: '1',
    contractNumber: 'LEP-2024-0045',
    title: 'Peatöövõtuleping',
    type: 'main',
    partner: 'Ülemiste OÜ',
    value: 450000,
    startDate: '2024-01-10',
    endDate: '2024-05-30',
    status: 'active',
    signedDate: '2024-01-08',
    signatories: ['Mart Saar', 'Rivest OÜ'],
    attachments: 5,
    description: 'HVAC süsteemide paigaldus ja seadistamine',
  },
  {
    id: '2',
    contractNumber: 'LEP-2024-0051',
    title: 'Alltöövõtuleping - elektritööd',
    type: 'subcontract',
    partner: 'ElektriMeister OÜ',
    value: 28500,
    startDate: '2024-02-01',
    endDate: '2024-04-30',
    status: 'active',
    signedDate: '2024-01-25',
    signatories: ['Tõnu Volt', 'Rivest OÜ'],
    attachments: 3,
    description: 'Automaatika ja juhtimissüsteemide elektritööd',
  },
  {
    id: '3',
    contractNumber: 'LEP-2024-0058',
    title: 'Materjalide tarnimine',
    type: 'supply',
    partner: 'Lindab AS',
    value: 85000,
    startDate: '2024-02-15',
    endDate: '2024-04-15',
    status: 'active',
    signedDate: '2024-02-10',
    signatories: ['Lindab AS', 'Rivest OÜ'],
    attachments: 2,
  },
  {
    id: '4',
    contractNumber: 'LEP-2024-0062',
    title: 'Hoolduslepingu lisaleht',
    type: 'service',
    partner: 'Ülemiste OÜ',
    value: 12000,
    startDate: '2024-06-01',
    endDate: '2025-05-31',
    status: 'pending_signature',
    signatories: ['Mart Saar', 'Rivest OÜ'],
    attachments: 1,
    description: 'Garantiiperioodile järgnev hooldusleping',
  },
]

const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
  main: { label: 'Peatöövõtt', color: 'text-blue-600', bg: 'bg-blue-100' },
  subcontract: { label: 'Alltöövõtt', color: 'text-purple-600', bg: 'bg-purple-100' },
  service: { label: 'Teenus', color: 'text-green-600', bg: 'bg-green-100' },
  supply: { label: 'Tarne', color: 'text-orange-600', bg: 'bg-orange-100' },
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  draft: { label: 'Mustand', color: 'text-gray-600', bg: 'bg-gray-100', icon: FileText },
  pending_signature: { label: 'Allkirjastamisel', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: PenLine },
  active: { label: 'Kehtiv', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2 },
  completed: { label: 'Lõppenud', color: 'text-blue-600', bg: 'bg-blue-100', icon: CheckCircle2 },
  terminated: { label: 'Lõpetatud', color: 'text-red-600', bg: 'bg-red-100', icon: XCircle },
}

export default function ContractsPage() {
  const params = useParams()
  const projectId = params.id as string

  const [contracts] = useState<Contract[]>(mockContracts)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = search === '' ||
      contract.title.toLowerCase().includes(search.toLowerCase()) ||
      contract.contractNumber.toLowerCase().includes(search.toLowerCase()) ||
      contract.partner.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' || contract.type === typeFilter
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter
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
  const totalValue = contracts.filter(c => c.status === 'active').reduce((sum, c) => sum + c.value, 0)
  const activeContracts = contracts.filter(c => c.status === 'active').length
  const pendingSignature = contracts.filter(c => c.status === 'pending_signature').length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Lepinguid kokku</p>
          <p className="text-2xl font-bold text-gray-900">{contracts.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600">Kehtivad</p>
          <p className="text-2xl font-bold text-green-700">{activeContracts}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-600">Allkirjastamisel</p>
          <p className="text-2xl font-bold text-yellow-700">{pendingSignature}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600">Kehtivate väärtus</p>
          <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalValue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Otsi lepingut..."
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
          <option value="main">Peatöövõtt</option>
          <option value="subcontract">Alltöövõtt</option>
          <option value="service">Teenus</option>
          <option value="supply">Tarne</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="all">Kõik staatused</option>
          <option value="draft">Mustand</option>
          <option value="pending_signature">Allkirjastamisel</option>
          <option value="active">Kehtiv</option>
          <option value="completed">Lõppenud</option>
          <option value="terminated">Lõpetatud</option>
        </select>
        <button className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Uus leping
        </button>
      </div>

      {/* Contracts List */}
      <div className="space-y-4">
        {filteredContracts.map((contract) => {
          const typeInfo = typeConfig[contract.type]
          const statusInfo = statusConfig[contract.status]
          const StatusIcon = statusInfo.icon

          return (
            <div key={contract.id} className="bg-white border rounded-lg p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-gray-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-500 text-sm">{contract.contractNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${typeInfo.bg} ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{contract.title}</h3>
                    <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                      <Building2 className="w-3 h-3" />
                      {contract.partner}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 ${statusInfo.bg} ${statusInfo.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {statusInfo.label}
                  </span>
                  <button className="p-1.5 hover:bg-gray-100 rounded">
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {contract.description && (
                <p className="text-sm text-gray-600 mb-4">{contract.description}</p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Väärtus
                  </p>
                  <p className="font-semibold text-gray-900">{formatCurrency(contract.value)}</p>
                </div>
                <div>
                  <p className="text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Kehtivus
                  </p>
                  <p className="font-medium">{formatDate(contract.startDate)} - {formatDate(contract.endDate)}</p>
                </div>
                <div>
                  <p className="text-gray-500">Allkirjastajad</p>
                  <p className="font-medium">{contract.signatories.join(', ')}</p>
                </div>
                <div>
                  <p className="text-gray-500">Lisad</p>
                  <p className="font-medium">{contract.attachments} faili</p>
                </div>
              </div>

              <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                <button className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  Vaata
                </button>
                <button className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  Laadi alla
                </button>
                {contract.status === 'pending_signature' && (
                  <button className="px-3 py-1.5 text-sm bg-[#279989] text-white hover:bg-[#1f7a6d] rounded-lg flex items-center gap-1">
                    <PenLine className="w-3 h-3" />
                    Allkirjasta
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {filteredContracts.length === 0 && (
          <div className="text-center py-12 bg-white border rounded-lg text-gray-500">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>Lepinguid ei leitud</p>
          </div>
        )}
      </div>
    </div>
  )
}
