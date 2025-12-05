'use client'

import { useState, useEffect } from 'react'
import {
  ClipboardCheck,
  Plus,
  Search,
  Loader2,
  MoreHorizontal,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react'
import { Button } from '@rivest/ui'

interface IKVRecord {
  id: string
  number: string
  asset: {
    id: string
    name: string
    code: string
  }
  type: 'incoming' | 'outgoing' | 'internal'
  status: 'pending' | 'approved' | 'rejected' | 'completed'
  quantity: number
  fromLocation?: string
  toLocation?: string
  requestedBy: string
  approvedBy?: string
  createdAt: string
  completedAt?: string
  notes?: string
}

export default function IKVPage() {
  const [records, setRecords] = useState<IKVRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  useEffect(() => {
    // Mock data
    setRecords([
      {
        id: '1',
        number: 'IKV-2024-001',
        asset: { id: 'a1', name: 'Laser nivelliir', code: 'LN-001' },
        type: 'outgoing',
        status: 'completed',
        quantity: 1,
        fromLocation: 'Pealadu',
        toLocation: 'Projekt Tallinn',
        requestedBy: 'Mart Tamm',
        approvedBy: 'Jaan Kask',
        createdAt: '2024-12-01',
        completedAt: '2024-12-02',
      },
      {
        id: '2',
        number: 'IKV-2024-002',
        asset: { id: 'a2', name: 'Elektritrell Makita', code: 'TR-015' },
        type: 'incoming',
        status: 'pending',
        quantity: 2,
        toLocation: 'Pealadu',
        requestedBy: 'Anna Lepp',
        createdAt: '2024-12-03',
      },
      {
        id: '3',
        number: 'IKV-2024-003',
        asset: { id: 'a3', name: 'Generaator 5kW', code: 'GEN-003' },
        type: 'internal',
        status: 'approved',
        quantity: 1,
        fromLocation: 'Pealadu',
        toLocation: 'Filiaal Tartu',
        requestedBy: 'Peeter Mets',
        approvedBy: 'Jaan Kask',
        createdAt: '2024-12-04',
      },
    ])
    setIsLoading(false)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'approved': return <Clock className="w-4 h-4 text-blue-500" />
      case 'pending': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      case 'rejected': return <XCircle className="w-4 h-4 text-red-500" />
      default: return null
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'completed': return 'Lõpetatud'
      case 'approved': return 'Kinnitatud'
      case 'pending': return 'Ootel'
      case 'rejected': return 'Tagasilükatud'
      default: return status
    }
  }

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'incoming': return 'Sissetulek'
      case 'outgoing': return 'Väljaminek'
      case 'internal': return 'Sisemine'
      default: return type
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'incoming': return 'bg-green-100 text-green-700'
      case 'outgoing': return 'bg-red-100 text-red-700'
      case 'internal': return 'bg-blue-100 text-blue-700'
      default: return 'bg-slate-100 text-slate-700'
    }
  }

  const filteredRecords = records.filter(r => {
    const matchesSearch = !searchQuery ||
      r.number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.asset.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = !statusFilter || r.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5" style={{ color: '#279989' }} />
            IKV (Inventar Kontrolli Võtmine)
          </h1>
          <p className="text-sm text-slate-500">{filteredRecords.length} kirjet</p>
        </div>
        <Button size="sm" className="gap-1.5" style={{ backgroundColor: '#279989' }}>
          <Plus className="w-4 h-4" />
          Uus IKV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-slate-200 px-3 py-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-yellow-500" />
            <div>
              <p className="text-lg font-semibold">{records.filter(r => r.status === 'pending').length}</p>
              <p className="text-xs text-slate-500">Ootel</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 px-3 py-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-blue-500" />
            <div>
              <p className="text-lg font-semibold">{records.filter(r => r.status === 'approved').length}</p>
              <p className="text-xs text-slate-500">Kinnitatud</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 px-3 py-2">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-green-500" />
            <div>
              <p className="text-lg font-semibold">{records.filter(r => r.status === 'completed').length}</p>
              <p className="text-xs text-slate-500">Lõpetatud</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 px-3 py-2">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-500" />
            <div>
              <p className="text-lg font-semibold">{records.filter(r => r.status === 'rejected').length}</p>
              <p className="text-xs text-slate-500">Tagasilükatud</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-3">
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Otsi numbri või vara järgi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
          >
            <option value="">Kõik staatused</option>
            <option value="pending">Ootel</option>
            <option value="approved">Kinnitatud</option>
            <option value="completed">Lõpetatud</option>
            <option value="rejected">Tagasilükatud</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-3 py-2 text-xs font-medium text-slate-600 text-left">Number</th>
                <th className="px-3 py-2 text-xs font-medium text-slate-600 text-left">Vara</th>
                <th className="px-3 py-2 text-xs font-medium text-slate-600 text-center">Tüüp</th>
                <th className="px-3 py-2 text-xs font-medium text-slate-600 text-left hidden md:table-cell">Suund</th>
                <th className="px-3 py-2 text-xs font-medium text-slate-600 text-left hidden lg:table-cell">Taotleja</th>
                <th className="px-3 py-2 text-xs font-medium text-slate-600 text-center">Staatus</th>
                <th className="px-3 py-2 text-xs font-medium text-slate-600 text-left hidden lg:table-cell">Kuupäev</th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.map((record) => (
                <tr key={record.id} className="h-10 hover:bg-slate-50">
                  <td className="px-3 py-1.5 text-xs font-mono">{record.number}</td>
                  <td className="px-3 py-1.5 text-xs">
                    <div>
                      <span className="font-medium text-slate-900">{record.asset.name}</span>
                      <span className="text-slate-500 ml-1">×{record.quantity}</span>
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-center">
                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getTypeColor(record.type)}`}>
                      {getTypeLabel(record.type)}
                    </span>
                  </td>
                  <td className="px-3 py-1.5 text-xs text-slate-600 hidden md:table-cell">
                    {record.fromLocation && record.toLocation ? (
                      <span>{record.fromLocation} → {record.toLocation}</span>
                    ) : record.toLocation ? (
                      <span>→ {record.toLocation}</span>
                    ) : record.fromLocation ? (
                      <span>{record.fromLocation} →</span>
                    ) : '-'}
                  </td>
                  <td className="px-3 py-1.5 text-xs text-slate-600 hidden lg:table-cell">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {record.requestedBy}
                    </div>
                  </td>
                  <td className="px-3 py-1.5">
                    <div className="flex items-center justify-center gap-1">
                      {getStatusIcon(record.status)}
                      <span className="text-xs">{getStatusLabel(record.status)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-1.5 text-xs text-slate-500 hidden lg:table-cell">
                    {new Date(record.createdAt).toLocaleDateString('et-EE')}
                  </td>
                  <td className="px-3 py-1.5">
                    <button className="p-1 rounded hover:bg-slate-100">
                      <MoreHorizontal className="w-4 h-4 text-slate-400" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
