'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Plus,
  Search,
  MoreVertical,
  BarChart3,
  TrendingUp,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  FileText,
  Download,
} from 'lucide-react'

interface CompletedVolume {
  id: string
  periodStart: string
  periodEnd: string
  reportNumber: string
  system: string
  workType: string
  unit: string
  plannedQuantity: number
  completedQuantity: number
  unitPrice: number
  totalValue: number
  status: 'draft' | 'submitted' | 'approved' | 'invoiced'
  submittedBy: string
  approvedBy?: string
  approvedDate?: string
}

const mockVolumes: CompletedVolume[] = [
  {
    id: '1',
    periodStart: '2024-03-01',
    periodEnd: '2024-03-15',
    reportNumber: 'TM-2024-003',
    system: 'VEN-01',
    workType: 'Ventilatsiooni kanalite paigaldus',
    unit: 'jm',
    plannedQuantity: 150,
    completedQuantity: 145,
    unitPrice: 28.5,
    totalValue: 4132.5,
    status: 'approved',
    submittedBy: 'Jaan Tamm',
    approvedBy: 'Mart Saar',
    approvedDate: '2024-03-18',
  },
  {
    id: '2',
    periodStart: '2024-03-01',
    periodEnd: '2024-03-15',
    reportNumber: 'TM-2024-003',
    system: 'VEN-02',
    workType: 'Väljatõmbe süsteemi paigaldus',
    unit: 'kompl',
    plannedQuantity: 4,
    completedQuantity: 4,
    unitPrice: 450,
    totalValue: 1800,
    status: 'approved',
    submittedBy: 'Jaan Tamm',
    approvedBy: 'Mart Saar',
    approvedDate: '2024-03-18',
  },
  {
    id: '3',
    periodStart: '2024-03-01',
    periodEnd: '2024-03-15',
    reportNumber: 'TM-2024-003',
    system: 'KYT-01',
    workType: 'Põrandakütte paigaldus',
    unit: 'm²',
    plannedQuantity: 280,
    completedQuantity: 265,
    unitPrice: 18.5,
    totalValue: 4902.5,
    status: 'submitted',
    submittedBy: 'Peeter Mets',
  },
  {
    id: '4',
    periodStart: '2024-03-16',
    periodEnd: '2024-03-31',
    reportNumber: 'TM-2024-004',
    system: 'VEN-03',
    workType: 'Kontoriala ventilatsioon',
    unit: 'jm',
    plannedQuantity: 180,
    completedQuantity: 95,
    unitPrice: 32,
    totalValue: 3040,
    status: 'draft',
    submittedBy: 'Jaan Tamm',
  },
]

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  draft: { label: 'Mustand', color: 'text-gray-600', bg: 'bg-gray-100', icon: FileText },
  submitted: { label: 'Esitatud', color: 'text-blue-600', bg: 'bg-blue-100', icon: Clock },
  approved: { label: 'Kinnitatud', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2 },
  invoiced: { label: 'Arveldatud', color: 'text-indigo-600', bg: 'bg-indigo-100', icon: FileText },
}

export default function CompletedVolumesPage() {
  const params = useParams()
  const projectId = params.id as string

  const [volumes] = useState<CompletedVolume[]>(mockVolumes)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredVolumes = volumes.filter(volume => {
    const matchesSearch = search === '' ||
      volume.workType.toLowerCase().includes(search.toLowerCase()) ||
      volume.system.toLowerCase().includes(search.toLowerCase()) ||
      volume.reportNumber.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || volume.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('et-EE', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('et-EE', {
      day: 'numeric',
      month: 'short',
    })
  }

  // Stats
  const totalValue = volumes.reduce((sum, v) => sum + v.totalValue, 0)
  const approvedValue = volumes.filter(v => v.status === 'approved' || v.status === 'invoiced').reduce((sum, v) => sum + v.totalValue, 0)
  const pendingValue = volumes.filter(v => v.status === 'draft' || v.status === 'submitted').reduce((sum, v) => sum + v.totalValue, 0)

  // Group by report number
  const groupedVolumes = filteredVolumes.reduce((acc, volume) => {
    if (!acc[volume.reportNumber]) {
      acc[volume.reportNumber] = {
        reportNumber: volume.reportNumber,
        periodStart: volume.periodStart,
        periodEnd: volume.periodEnd,
        items: [],
        totalValue: 0,
      }
    }
    acc[volume.reportNumber].items.push(volume)
    acc[volume.reportNumber].totalValue += volume.totalValue
    return acc
  }, {} as Record<string, { reportNumber: string; periodStart: string; periodEnd: string; items: CompletedVolume[]; totalValue: number }>)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Kokku teostatud</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalValue)}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600">Kinnitatud</p>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(approvedValue)}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-600">Ootel kinnitust</p>
          <p className="text-2xl font-bold text-yellow-700">{formatCurrency(pendingValue)}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600">Täitmise %</p>
          <p className="text-2xl font-bold text-blue-700">
            {Math.round((volumes.reduce((sum, v) => sum + v.completedQuantity, 0) / volumes.reduce((sum, v) => sum + v.plannedQuantity, 0)) * 100)}%
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Otsi tööd või süsteemi..."
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
          <option value="draft">Mustand</option>
          <option value="submitted">Esitatud</option>
          <option value="approved">Kinnitatud</option>
          <option value="invoiced">Arveldatud</option>
        </select>
        <button className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2">
          <Download className="w-4 h-4" />
          Ekspordi
        </button>
        <button className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Uus akt
        </button>
      </div>

      {/* Grouped Volumes */}
      <div className="space-y-6">
        {Object.values(groupedVolumes).map((group) => (
          <div key={group.reportNumber} className="bg-white border rounded-lg overflow-hidden">
            {/* Group Header */}
            <div className="bg-gray-50 px-5 py-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-gray-500" />
                  <span className="font-semibold text-gray-900">{group.reportNumber}</span>
                </div>
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {formatDate(group.periodStart)} - {formatDate(group.periodEnd)}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Kokku</p>
                <p className="font-bold text-gray-900">{formatCurrency(group.totalValue)}</p>
              </div>
            </div>

            {/* Items Table */}
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-5 py-2 font-medium text-gray-600">Süsteem</th>
                  <th className="text-left px-5 py-2 font-medium text-gray-600">Tööliik</th>
                  <th className="text-right px-5 py-2 font-medium text-gray-600">Maht</th>
                  <th className="text-right px-5 py-2 font-medium text-gray-600">Ühiku hind</th>
                  <th className="text-right px-5 py-2 font-medium text-gray-600">Summa</th>
                  <th className="text-center px-5 py-2 font-medium text-gray-600">Staatus</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {group.items.map((volume) => {
                  const statusInfo = statusConfig[volume.status]
                  const StatusIcon = statusInfo.icon
                  const completionPercent = Math.round((volume.completedQuantity / volume.plannedQuantity) * 100)

                  return (
                    <tr key={volume.id} className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <span className="font-medium">{volume.system}</span>
                      </td>
                      <td className="px-5 py-3">
                        <p>{volume.workType}</p>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <span className="font-medium">{volume.completedQuantity}</span>
                          <span className="text-gray-400">/</span>
                          <span className="text-gray-500">{volume.plannedQuantity}</span>
                          <span className="text-gray-400">{volume.unit}</span>
                          <span className={`text-xs px-1.5 py-0.5 rounded ${completionPercent >= 100 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {completionPercent}%
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-right text-gray-600">
                        {formatCurrency(volume.unitPrice)}
                      </td>
                      <td className="px-5 py-3 text-right font-medium">
                        {formatCurrency(volume.totalValue)}
                      </td>
                      <td className="px-5 py-3 text-center">
                        <span className={`px-2 py-1 rounded text-xs font-medium inline-flex items-center gap-1 ${statusInfo.bg} ${statusInfo.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        <button className="p-1 hover:bg-gray-100 rounded">
                          <MoreVertical className="w-4 h-4 text-gray-400" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))}

        {Object.keys(groupedVolumes).length === 0 && (
          <div className="text-center py-12 bg-white border rounded-lg text-gray-500">
            <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>Teostatud mahtude andmeid ei leitud</p>
          </div>
        )}
      </div>
    </div>
  )
}
