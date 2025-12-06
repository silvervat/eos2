'use client'

/**
 * Tellija lepingud (Client Contracts) - Contracts with the client/owner
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
  Building,
  Edit,
  MoreVertical,
  X,
  Upload,
  ExternalLink,
  History,
  FileSignature,
} from 'lucide-react'

interface ClientContract {
  id: string
  number: string
  name: string
  client: string
  signedDate: string
  startDate: string
  endDate: string
  value: number
  status: 'draft' | 'active' | 'completed' | 'expired' | 'terminated'
  type: 'main' | 'amendment' | 'supplement'
  parentContractId?: string
  description?: string
  paymentTerms?: string
  warrantyPeriod?: number
  documentsCount: number
  lastModified: string
}

const mockContracts: ClientContract[] = [
  {
    id: '1',
    number: 'TL-2024-001',
    name: 'Põhileping - HVAC paigaldustööd',
    client: 'Kinnisvara Arendus OÜ',
    signedDate: '2024-01-15',
    startDate: '2024-02-01',
    endDate: '2024-08-31',
    value: 285000,
    status: 'active',
    type: 'main',
    description: 'Kütte-, ventilatsiooni- ja jahutussüsteemide projekteerimine ja paigaldamine',
    paymentTerms: '30 päeva, etappide kaupa',
    warrantyPeriod: 24,
    documentsCount: 5,
    lastModified: '2024-03-10',
  },
  {
    id: '2',
    number: 'TL-2024-001/L1',
    name: 'Lisa 1 - Lisatööd A-tsoon',
    client: 'Kinnisvara Arendus OÜ',
    signedDate: '2024-03-01',
    startDate: '2024-03-15',
    endDate: '2024-05-31',
    value: 32500,
    status: 'active',
    type: 'amendment',
    parentContractId: '1',
    description: 'Täiendavad ventilatsioonikanalid A-tsooni kontorialas',
    documentsCount: 2,
    lastModified: '2024-03-01',
  },
  {
    id: '3',
    number: 'TL-2024-001/M1',
    name: 'Muudatus 1 - Tähtaja pikendamine',
    client: 'Kinnisvara Arendus OÜ',
    signedDate: '2024-02-20',
    startDate: '2024-02-01',
    endDate: '2024-09-30',
    value: 0,
    status: 'active',
    type: 'supplement',
    parentContractId: '1',
    description: 'Projekti tähtaja pikendamine 1 kuu võrra ehitusgraafiku muutuse tõttu',
    documentsCount: 1,
    lastModified: '2024-02-20',
  },
  {
    id: '4',
    number: 'TL-2023-015',
    name: 'Hoolduslepung',
    client: 'Kinnisvara Arendus OÜ',
    signedDate: '2023-09-01',
    startDate: '2023-09-01',
    endDate: '2024-08-31',
    value: 12000,
    status: 'active',
    type: 'main',
    description: 'Tehnosüsteemide hooldus ja garantiitööd',
    paymentTerms: 'Kvartaalne ettemaks',
    documentsCount: 3,
    lastModified: '2024-01-15',
  },
]

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  draft: { label: 'Mustand', color: 'text-gray-700', bg: 'bg-gray-100', icon: Clock },
  active: { label: 'Kehtiv', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle2 },
  completed: { label: 'Lõpetatud', color: 'text-blue-700', bg: 'bg-blue-100', icon: CheckCircle2 },
  expired: { label: 'Aegunud', color: 'text-orange-700', bg: 'bg-orange-100', icon: AlertTriangle },
  terminated: { label: 'Lõpetatud', color: 'text-red-700', bg: 'bg-red-100', icon: AlertTriangle },
}

const typeConfig: Record<string, { label: string; color: string }> = {
  main: { label: 'Põhileping', color: 'bg-blue-100 text-blue-700' },
  amendment: { label: 'Lisa', color: 'bg-purple-100 text-purple-700' },
  supplement: { label: 'Muudatus', color: 'bg-orange-100 text-orange-700' },
}

export default function ClientContractsPage() {
  const params = useParams()
  const projectId = params.id as string

  const [contracts, setContracts] = useState<ClientContract[]>(mockContracts)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedContract, setSelectedContract] = useState<ClientContract | null>(null)

  // Stats
  const stats = useMemo(() => {
    const totalValue = contracts.reduce((sum, c) => sum + c.value, 0)
    const activeCount = contracts.filter(c => c.status === 'active').length
    const mainContracts = contracts.filter(c => c.type === 'main').length
    const amendments = contracts.filter(c => c.type === 'amendment' || c.type === 'supplement').length
    return { totalValue, activeCount, mainContracts, amendments }
  }, [contracts])

  // Filter contracts
  const filteredContracts = useMemo(() => {
    return contracts.filter(contract => {
      const matchesSearch = search === '' ||
        contract.name.toLowerCase().includes(search.toLowerCase()) ||
        contract.number.toLowerCase().includes(search.toLowerCase()) ||
        contract.client.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || contract.status === statusFilter
      const matchesType = typeFilter === 'all' || contract.type === typeFilter
      return matchesSearch && matchesStatus && matchesType
    })
  }, [contracts, search, statusFilter, typeFilter])

  // Group by main contract
  const groupedContracts = useMemo(() => {
    const mainContracts = filteredContracts.filter(c => c.type === 'main')
    const grouped: Record<string, ClientContract[]> = {}

    mainContracts.forEach(main => {
      grouped[main.id] = [
        main,
        ...filteredContracts.filter(c => c.parentContractId === main.id)
      ]
    })

    // Add standalone contracts (amendments without main in filter)
    filteredContracts
      .filter(c => c.type !== 'main' && !mainContracts.find(m => m.id === c.parentContractId))
      .forEach(c => {
        grouped[c.id] = [c]
      })

    return grouped
  }, [filteredContracts])

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

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const today = new Date()
    const diffTime = end.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Tellija lepingud</h1>
          <p className="text-sm text-gray-500">Lepingud tellijaga ja nende lisad</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Lisa leping
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Lepingute väärtus</p>
          <p className="text-xl font-bold text-gray-800">{formatCurrency(stats.totalValue)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Kehtivaid</p>
          <p className="text-2xl font-bold text-green-600">{stats.activeCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Põhilepingud</p>
          <p className="text-2xl font-bold text-blue-600">{stats.mainContracts}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Lisad/Muudatused</p>
          <p className="text-2xl font-bold text-purple-600">{stats.amendments}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Otsi lepinguid..."
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
          <option value="main">Põhilepingud</option>
          <option value="amendment">Lisad</option>
          <option value="supplement">Muudatused</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="all">Kõik staatused</option>
          <option value="active">Kehtiv</option>
          <option value="draft">Mustand</option>
          <option value="completed">Lõpetatud</option>
          <option value="expired">Aegunud</option>
        </select>
      </div>

      {/* Contracts list */}
      <div className="space-y-4">
        {Object.values(groupedContracts).map((contractGroup) => {
          const mainContract = contractGroup[0]
          const statusInfo = statusConfig[mainContract.status]
          const StatusIcon = statusInfo.icon
          const typeInfo = typeConfig[mainContract.type]
          const daysRemaining = getDaysRemaining(mainContract.endDate)

          return (
            <div key={mainContract.id} className="bg-white rounded-lg border overflow-hidden">
              {/* Main contract header */}
              <div className="p-4 border-b">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-sm text-gray-500">{mainContract.number}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${statusInfo.bg} ${statusInfo.color}`}>
                        <StatusIcon className="w-3 h-3" />
                        {statusInfo.label}
                      </span>
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1">{mainContract.name}</h3>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mb-2">
                      <Building className="w-4 h-4" />
                      {mainContract.client}
                    </div>
                    {mainContract.description && (
                      <p className="text-sm text-gray-600 mb-2">{mainContract.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(mainContract.startDate)} - {formatDate(mainContract.endDate)}
                      </span>
                      {mainContract.status === 'active' && daysRemaining > 0 && (
                        <span className={`${daysRemaining <= 30 ? 'text-orange-600 font-medium' : ''}`}>
                          ({daysRemaining} päeva jäänud)
                        </span>
                      )}
                      {mainContract.warrantyPeriod && (
                        <span>Garantii: {mainContract.warrantyPeriod} kuud</span>
                      )}
                      <span>{mainContract.documentsCount} dokumenti</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(mainContract.value)}</p>
                    {mainContract.paymentTerms && (
                      <p className="text-xs text-gray-500">{mainContract.paymentTerms}</p>
                    )}
                    <div className="flex items-center gap-1 mt-2 justify-end">
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

              {/* Amendments and supplements */}
              {contractGroup.length > 1 && (
                <div className="divide-y bg-gray-50">
                  {contractGroup.slice(1).map(contract => {
                    const subStatusInfo = statusConfig[contract.status]
                    const subTypeInfo = typeConfig[contract.type]
                    return (
                      <div key={contract.id} className="p-3 pl-8 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-gray-500">{contract.number}</span>
                            <span className={`px-1.5 py-0.5 rounded text-xs ${subTypeInfo.color}`}>
                              {subTypeInfo.label}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-xs ${subStatusInfo.bg} ${subStatusInfo.color}`}>
                              {subStatusInfo.label}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 mt-0.5">{contract.name}</p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {formatDate(contract.signedDate)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          {contract.value > 0 && (
                            <span className="font-medium text-gray-900">
                              {formatCurrency(contract.value)}
                            </span>
                          )}
                          <button className="p-1 hover:bg-gray-200 rounded">
                            <Eye className="w-4 h-4 text-gray-400" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Add amendment button */}
              {mainContract.type === 'main' && mainContract.status === 'active' && (
                <div className="p-2 bg-gray-50 border-t">
                  <button className="w-full px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded flex items-center justify-center gap-2">
                    <Plus className="w-4 h-4" />
                    Lisa muudatus või lisa
                  </button>
                </div>
              )}
            </div>
          )
        })}

        {Object.keys(groupedContracts).length === 0 && (
          <div className="text-center py-12 bg-white border rounded-lg">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Lepinguid ei leitud</p>
          </div>
        )}
      </div>

      {/* Add contract modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Lisa uus leping</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lepingu tüüp
                </label>
                <select className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="main">Põhileping</option>
                  <option value="amendment">Lisa olemasolevale lepingule</option>
                  <option value="supplement">Muudatus olemasolevale lepingule</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lepingu number
                </label>
                <input
                  type="text"
                  placeholder="Nt. TL-2024-002"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lepingu nimetus
                </label>
                <input
                  type="text"
                  placeholder="Lepingu lühikirjeldus"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tellija
                </label>
                <input
                  type="text"
                  placeholder="Ettevõtte nimi"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
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
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kirjeldus
                </label>
                <textarea
                  rows={2}
                  placeholder="Lepingu sisuline kirjeldus..."
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
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
