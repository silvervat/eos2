'use client'

/**
 * ATV lepingud (Subcontractor Contracts) - Contracts with subcontractors
 */

import React, { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import {
  FileText,
  Plus,
  Search,
  Download,
  Eye,
  Calendar,
  Euro,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Users,
  Edit,
  X,
  Upload,
  Building,
  Phone,
  Mail,
  Shield,
  FileCheck,
  AlertCircle,
} from 'lucide-react'

interface SubcontractorContract {
  id: string
  number: string
  name: string
  subcontractor: {
    name: string
    regCode: string
    contact: string
    phone: string
    email: string
  }
  signedDate: string
  startDate: string
  endDate: string
  value: number
  status: 'draft' | 'active' | 'completed' | 'on_hold' | 'terminated'
  workScope: string
  systems: string[]
  paymentTerms: string
  retentionPercent: number
  insuranceValid: boolean
  insuranceExpiry?: string
  safetyDocsValid: boolean
  performancePercent: number
  invoicedAmount: number
  paidAmount: number
  documentsCount: number
}

const mockContracts: SubcontractorContract[] = [
  {
    id: '1',
    number: 'ATV-2024-001',
    name: 'Ventilatsioonikanalite paigaldus',
    subcontractor: {
      name: 'Kanalitööd OÜ',
      regCode: '12345678',
      contact: 'Mati Kanal',
      phone: '+372 5551 1234',
      email: 'mati@kanalitood.ee',
    },
    signedDate: '2024-02-01',
    startDate: '2024-02-15',
    endDate: '2024-06-30',
    value: 85000,
    status: 'active',
    workScope: 'VEN-01, VEN-02, VEN-03 süsteemide kanalite paigaldus',
    systems: ['VEN-01', 'VEN-02', 'VEN-03'],
    paymentTerms: '14 päeva, etappide kaupa',
    retentionPercent: 5,
    insuranceValid: true,
    insuranceExpiry: '2024-12-31',
    safetyDocsValid: true,
    performancePercent: 65,
    invoicedAmount: 55250,
    paidAmount: 48000,
    documentsCount: 8,
  },
  {
    id: '2',
    number: 'ATV-2024-002',
    name: 'Põrandakütte paigaldus',
    subcontractor: {
      name: 'Küttetööd AS',
      regCode: '87654321',
      contact: 'Peeter Küte',
      phone: '+372 5552 2345',
      email: 'peeter@kuttetood.ee',
    },
    signedDate: '2024-02-10',
    startDate: '2024-02-20',
    endDate: '2024-05-15',
    value: 42000,
    status: 'active',
    workScope: 'KYT-01, KYT-02 põrandakütte torustiku paigaldus',
    systems: ['KYT-01', 'KYT-02'],
    paymentTerms: '21 päeva',
    retentionPercent: 5,
    insuranceValid: true,
    insuranceExpiry: '2025-03-15',
    safetyDocsValid: true,
    performancePercent: 80,
    invoicedAmount: 33600,
    paidAmount: 29400,
    documentsCount: 5,
  },
  {
    id: '3',
    number: 'ATV-2024-003',
    name: 'Isolatsioonitööd',
    subcontractor: {
      name: 'Isolatsioon Grupp OÜ',
      regCode: '11223344',
      contact: 'Jüri Isol',
      phone: '+372 5553 3456',
      email: 'juri@isolatsioon.ee',
    },
    signedDate: '2024-03-01',
    startDate: '2024-04-01',
    endDate: '2024-07-31',
    value: 28500,
    status: 'draft',
    workScope: 'Kõikide HVAC torude ja kanalite isolatsioon',
    systems: ['VEN-01', 'VEN-02', 'VEN-03', 'KYT-01', 'KYT-02', 'JAH-01'],
    paymentTerms: '30 päeva',
    retentionPercent: 5,
    insuranceValid: false,
    safetyDocsValid: false,
    performancePercent: 0,
    invoicedAmount: 0,
    paidAmount: 0,
    documentsCount: 2,
  },
  {
    id: '4',
    number: 'ATV-2024-004',
    name: 'Automaatika paigaldus',
    subcontractor: {
      name: 'Automaatika Partner OÜ',
      regCode: '55667788',
      contact: 'Andres Auto',
      phone: '+372 5554 4567',
      email: 'andres@automaatika.ee',
    },
    signedDate: '2024-01-20',
    startDate: '2024-05-01',
    endDate: '2024-08-15',
    value: 65000,
    status: 'draft',
    workScope: 'BMS süsteemi paigaldus ja programmeerimine',
    systems: ['ELE-01', 'ELE-02'],
    paymentTerms: '30 päeva, 3 etappi',
    retentionPercent: 10,
    insuranceValid: true,
    insuranceExpiry: '2024-11-30',
    safetyDocsValid: true,
    performancePercent: 0,
    invoicedAmount: 0,
    paidAmount: 0,
    documentsCount: 3,
  },
]

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  draft: { label: 'Mustand', color: 'text-gray-700', bg: 'bg-gray-100', icon: Clock },
  active: { label: 'Aktiivne', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle2 },
  completed: { label: 'Lõpetatud', color: 'text-blue-700', bg: 'bg-blue-100', icon: CheckCircle2 },
  on_hold: { label: 'Peatatud', color: 'text-orange-700', bg: 'bg-orange-100', icon: Clock },
  terminated: { label: 'Lõpetatud', color: 'text-red-700', bg: 'bg-red-100', icon: AlertTriangle },
}

export default function SubcontractorContractsPage() {
  const params = useParams()
  const projectId = params.id as string

  const [contracts, setContracts] = useState<SubcontractorContract[]>(mockContracts)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedContract, setSelectedContract] = useState<SubcontractorContract | null>(null)

  // Stats
  const stats = useMemo(() => {
    const totalValue = contracts.reduce((sum, c) => sum + c.value, 0)
    const totalInvoiced = contracts.reduce((sum, c) => sum + c.invoicedAmount, 0)
    const totalPaid = contracts.reduce((sum, c) => sum + c.paidAmount, 0)
    const activeCount = contracts.filter(c => c.status === 'active').length
    const issuesCount = contracts.filter(c => !c.insuranceValid || !c.safetyDocsValid).length
    return { totalValue, totalInvoiced, totalPaid, activeCount, issuesCount }
  }, [contracts])

  // Filter contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      const matchesSearch = search === '' ||
        contract.name.toLowerCase().includes(search.toLowerCase()) ||
        contract.number.toLowerCase().includes(search.toLowerCase()) ||
        contract.subcontractor.name.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || contract.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [contracts, search, statusFilter])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('et-EE', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('et-EE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">ATV lepingud</h1>
          <p className="text-sm text-gray-500">Alltöövõtjate lepingud ja nende haldus</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Lisa ATV leping
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Lepingute väärtus</p>
          <p className="text-xl font-bold text-gray-800">{formatCurrency(stats.totalValue)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Arveldatud</p>
          <p className="text-xl font-bold text-blue-600">{formatCurrency(stats.totalInvoiced)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Makstud</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(stats.totalPaid)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Aktiivseid</p>
          <p className="text-2xl font-bold text-[#279989]">{stats.activeCount}</p>
        </div>
        {stats.issuesCount > 0 && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <p className="text-sm text-red-600">Probleeme</p>
            <p className="text-2xl font-bold text-red-700">{stats.issuesCount}</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Otsi ATV lepinguid..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="all">Kõik staatused</option>
          <option value="active">Aktiivne</option>
          <option value="draft">Mustand</option>
          <option value="completed">Lõpetatud</option>
          <option value="on_hold">Peatatud</option>
        </select>
      </div>

      {/* Contracts list */}
      <div className="space-y-4">
        {filteredContracts.map((contract) => {
          const statusInfo = statusConfig[contract.status]
          const StatusIcon = statusInfo.icon
          const hasIssues = !contract.insuranceValid || !contract.safetyDocsValid

          return (
            <div
              key={contract.id}
              className={`bg-white rounded-lg border overflow-hidden ${hasIssues ? 'border-orange-300' : ''}`}
            >
              {/* Warning banner for issues */}
              {hasIssues && (
                <div className="px-4 py-2 bg-orange-50 border-b border-orange-200 flex items-center gap-2 text-sm">
                  <AlertCircle className="w-4 h-4 text-orange-600" />
                  <span className="text-orange-700">
                    {!contract.insuranceValid && 'Kindlustus puudu/aegunud'}
                    {!contract.insuranceValid && !contract.safetyDocsValid && ' • '}
                    {!contract.safetyDocsValid && 'Tööohutuse dokumendid puudu'}
                  </span>
                </div>
              )}

              <div className="p-4">
                <div className="flex items-start justify-between gap-4">
                  {/* Left side - contract info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-gray-500">{contract.number}</span>
                      <span className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${statusInfo.bg} ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2">{contract.name}</h3>

                    {/* Subcontractor info */}
                    <div className="bg-gray-50 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Building className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-gray-900">{contract.subcontractor.name}</span>
                        <span className="text-xs text-gray-500">({contract.subcontractor.regCode})</span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {contract.subcontractor.contact}
                        </span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {contract.subcontractor.phone}
                        </span>
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {contract.subcontractor.email}
                        </span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-600 mb-2">{contract.workScope}</p>

                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {contract.systems.map(sys => (
                        <span key={sys} className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                          {sys}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                      </span>
                      <span>Maksetingimused: {contract.paymentTerms}</span>
                      <span>Garantiireserv: {contract.retentionPercent}%</span>
                      <span className="flex items-center gap-1">
                        {contract.insuranceValid ? (
                          <Shield className="w-3 h-3 text-green-600" />
                        ) : (
                          <Shield className="w-3 h-3 text-red-600" />
                        )}
                        Kindlustus
                      </span>
                      <span className="flex items-center gap-1">
                        {contract.safetyDocsValid ? (
                          <FileCheck className="w-3 h-3 text-green-600" />
                        ) : (
                          <FileCheck className="w-3 h-3 text-red-600" />
                        )}
                        Tööohutus
                      </span>
                    </div>
                  </div>

                  {/* Right side - financials and progress */}
                  <div className="text-right w-48">
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(contract.value)}</p>
                    <p className="text-xs text-gray-500 mb-3">Lepingu väärtus</p>

                    {/* Progress bar */}
                    {contract.status === 'active' && (
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-500">Teostatud</span>
                          <span className="font-medium">{contract.performancePercent}%</span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-[#279989] rounded-full"
                            style={{ width: `${contract.performancePercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Financial summary */}
                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Arveldatud:</span>
                        <span className="font-medium">{formatCurrency(contract.invoicedAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Makstud:</span>
                        <span className="font-medium text-green-600">{formatCurrency(contract.paidAmount)}</span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t">
                        <span className="text-gray-500">Maksmata:</span>
                        <span className="font-medium text-orange-600">
                          {formatCurrency(contract.invoicedAmount - contract.paidAmount)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 mt-3 justify-end">
                      <button className="p-1.5 hover:bg-gray-100 rounded" title="Vaata">
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                      <button className="p-1.5 hover:bg-gray-100 rounded" title="Laadi alla">
                        <Download className="w-4 h-4 text-gray-400" />
                      </button>
                      <button className="p-1.5 hover:bg-gray-100 rounded" title="Muuda">
                        <Edit className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {filteredContracts.length === 0 && (
          <div className="text-center py-12 bg-white border rounded-lg">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">ATV lepinguid ei leitud</p>
          </div>
        )}
      </div>

      {/* Add contract modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Lisa ATV leping</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Subcontractor section */}
              <div className="border-b pb-4">
                <h3 className="font-medium text-gray-900 mb-3">Alltöövõtja andmed</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Ettevõtte nimi
                    </label>
                    <input
                      type="text"
                      placeholder="Alltöövõtja OÜ"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Registrikood
                    </label>
                    <input
                      type="text"
                      placeholder="12345678"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Kontaktisik
                    </label>
                    <input
                      type="text"
                      placeholder="Nimi"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefon
                    </label>
                    <input
                      type="text"
                      placeholder="+372 5551 1234"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      E-post
                    </label>
                    <input
                      type="email"
                      placeholder="email@ettevote.ee"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Contract section */}
              <div className="space-y-4">
                <h3 className="font-medium text-gray-900">Lepingu andmed</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lepingu number
                    </label>
                    <input
                      type="text"
                      placeholder="ATV-2024-XXX"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lepingu väärtus (EUR)
                    </label>
                    <input
                      type="number"
                      placeholder="0"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lepingu nimetus
                    </label>
                    <input
                      type="text"
                      placeholder="Töö kirjeldus"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Alguskuupäev
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lõppkuupäev
                    </label>
                    <input
                      type="date"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Maksetähtaeg (päevi)
                    </label>
                    <input
                      type="number"
                      placeholder="30"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Garantiireserv (%)
                    </label>
                    <input
                      type="number"
                      placeholder="5"
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tööde ulatus
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Täpsem kirjeldus tehtavatest töödest..."
                      className="w-full px-3 py-2 border rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Documents */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lepingu fail
                </label>
                <div className="border-2 border-dashed rounded-lg p-4 text-center">
                  <Upload className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Lohista fail siia või{' '}
                    <button className="text-[#279989] hover:underline">vali fail</button>
                  </p>
                </div>
              </div>

              {/* Compliance checks */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Nõuetele vastavus</h4>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-gray-700">Kindlustus kehtiv</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-gray-700">Tööohutuse dokumendid esitatud</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input type="checkbox" className="rounded" />
                    <span className="text-sm text-gray-700">Maksuvõlgnevus kontrollitud</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100"
              >
                Tühista
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-[#279989] text-white rounded-lg text-sm hover:bg-[#1f7a6d]"
              >
                Lisa leping
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
