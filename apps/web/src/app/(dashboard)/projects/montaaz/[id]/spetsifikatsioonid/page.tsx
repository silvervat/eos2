'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Plus,
  Search,
  MoreVertical,
  ListChecks,
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  Upload,
  FileSpreadsheet,
  Filter,
  Eye,
} from 'lucide-react'

interface SpecificationItem {
  id: string
  code: string
  name: string
  category: string
  system: string
  manufacturer?: string
  model?: string
  quantity: number
  unit: string
  unitPrice: number
  totalPrice: number
  status: 'pending' | 'ordered' | 'delivered' | 'installed'
  specifications?: Record<string, string>
}

interface SpecificationCategory {
  name: string
  items: SpecificationItem[]
  totalValue: number
}

const mockSpecifications: SpecificationItem[] = [
  {
    id: '1',
    code: 'VEN-AGR-001',
    name: 'Ventilatsiooniaggregaat VKT 3200',
    category: 'Ventilatsioon',
    system: 'VEN-01',
    manufacturer: 'Systemair',
    model: 'VKT 3200/18',
    quantity: 1,
    unit: 'tk',
    unitPrice: 12500,
    totalPrice: 12500,
    status: 'installed',
    specifications: {
      'Õhuhulk': '3200 m³/h',
      'Survekadu': '450 Pa',
      'Võimsus': '18 kW',
      'Mõõtmed': '1800x1200x800 mm',
    },
  },
  {
    id: '2',
    code: 'VEN-KAN-001',
    name: 'Ümarkanal Ø200mm',
    category: 'Ventilatsioon',
    system: 'VEN-01',
    manufacturer: 'Lindab',
    model: 'Safe',
    quantity: 145,
    unit: 'jm',
    unitPrice: 18.5,
    totalPrice: 2682.5,
    status: 'installed',
    specifications: {
      'Materjal': 'Tsingitud plekk',
      'Paksus': '0.7 mm',
      'Isolatsioon': 'Ei',
    },
  },
  {
    id: '3',
    code: 'VEN-KAN-002',
    name: 'Ümarkanal Ø160mm',
    category: 'Ventilatsioon',
    system: 'VEN-02',
    manufacturer: 'Lindab',
    model: 'Safe',
    quantity: 85,
    unit: 'jm',
    unitPrice: 14.5,
    totalPrice: 1232.5,
    status: 'delivered',
    specifications: {
      'Materjal': 'Tsingitud plekk',
      'Paksus': '0.5 mm',
    },
  },
  {
    id: '4',
    code: 'KYT-TOR-001',
    name: 'PEX-AL-PEX torustik 16x2mm',
    category: 'Küte',
    system: 'KYT-01',
    manufacturer: 'Uponor',
    model: 'Comfort Pipe Plus',
    quantity: 450,
    unit: 'jm',
    unitPrice: 3.85,
    totalPrice: 1732.5,
    status: 'installed',
    specifications: {
      'Läbimõõt': '16x2 mm',
      'Max temp': '90°C',
      'Max rõhk': '10 bar',
    },
  },
  {
    id: '5',
    code: 'KYT-KOL-001',
    name: 'Põrandakütte kollektor 8-väljundiga',
    category: 'Küte',
    system: 'KYT-01',
    manufacturer: 'Uponor',
    model: 'Vario S',
    quantity: 2,
    unit: 'tk',
    unitPrice: 485,
    totalPrice: 970,
    status: 'ordered',
    specifications: {
      'Väljundid': '8 tk',
      'Ühendus': '1" sisekeere',
      'Materjal': 'Messingist',
    },
  },
  {
    id: '6',
    code: 'JAH-SEA-001',
    name: 'Jahutusseade VRF sisemoodul',
    category: 'Jahutus',
    system: 'JAH-01',
    manufacturer: 'Daikin',
    model: 'FXAQ-P',
    quantity: 12,
    unit: 'tk',
    unitPrice: 890,
    totalPrice: 10680,
    status: 'pending',
    specifications: {
      'Jahutus': '2.2 kW',
      'Küte': '2.5 kW',
      'Õhuhulk': '480 m³/h',
    },
  },
]

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pending: { label: 'Ootel', color: 'text-gray-600', bg: 'bg-gray-100', icon: Clock },
  ordered: { label: 'Tellitud', color: 'text-blue-600', bg: 'bg-blue-100', icon: Package },
  delivered: { label: 'Tarnitud', color: 'text-orange-600', bg: 'bg-orange-100', icon: CheckCircle2 },
  installed: { label: 'Paigaldatud', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2 },
}

export default function SpecificationsPage() {
  const params = useParams()
  const projectId = params.id as string

  const [specifications] = useState<SpecificationItem[]>(mockSpecifications)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [expandedItem, setExpandedItem] = useState<string | null>(null)

  const categories = [...new Set(specifications.map(s => s.category))]

  const filteredSpecs = specifications.filter(spec => {
    const matchesSearch = search === '' ||
      spec.name.toLowerCase().includes(search.toLowerCase()) ||
      spec.code.toLowerCase().includes(search.toLowerCase()) ||
      spec.manufacturer?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || spec.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || spec.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('et-EE', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  // Group by category
  const groupedSpecs = filteredSpecs.reduce((acc, spec) => {
    if (!acc[spec.category]) {
      acc[spec.category] = { name: spec.category, items: [], totalValue: 0 }
    }
    acc[spec.category].items.push(spec)
    acc[spec.category].totalValue += spec.totalPrice
    return acc
  }, {} as Record<string, SpecificationCategory>)

  // Stats
  const totalValue = specifications.reduce((sum, s) => sum + s.totalPrice, 0)
  const installedValue = specifications.filter(s => s.status === 'installed').reduce((sum, s) => sum + s.totalPrice, 0)
  const totalItems = specifications.reduce((sum, s) => sum + s.quantity, 0)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Positsioonid</p>
          <p className="text-2xl font-bold text-gray-900">{specifications.length}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Artikleid kokku</p>
          <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600">Koguväärtus</p>
          <p className="text-2xl font-bold text-blue-700">{formatCurrency(totalValue)}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600">Paigaldatud</p>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(installedValue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Otsi seadmeid või materjale..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="all">Kõik kategooriad</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="all">Kõik staatused</option>
          <option value="pending">Ootel</option>
          <option value="ordered">Tellitud</option>
          <option value="delivered">Tarnitud</option>
          <option value="installed">Paigaldatud</option>
        </select>
        <button className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2">
          <Download className="w-4 h-4" />
          Ekspordi
        </button>
        <button className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Impordi
        </button>
        <button className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Lisa artikkel
        </button>
      </div>

      {/* Specifications by Category */}
      <div className="space-y-6">
        {Object.values(groupedSpecs).map((category) => (
          <div key={category.name} className="bg-white border rounded-lg overflow-hidden">
            {/* Category Header */}
            <div className="bg-gray-50 px-5 py-3 border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ListChecks className="w-5 h-5 text-gray-500" />
                <span className="font-semibold text-gray-900">{category.name}</span>
                <span className="text-sm text-gray-500">({category.items.length} artiklit)</span>
              </div>
              <span className="font-bold text-gray-900">{formatCurrency(category.totalValue)}</span>
            </div>

            {/* Items Table */}
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left px-5 py-2 font-medium text-gray-600">Kood</th>
                  <th className="text-left px-5 py-2 font-medium text-gray-600">Nimetus</th>
                  <th className="text-left px-5 py-2 font-medium text-gray-600 hidden lg:table-cell">Tootja/Mudel</th>
                  <th className="text-right px-5 py-2 font-medium text-gray-600">Kogus</th>
                  <th className="text-right px-5 py-2 font-medium text-gray-600 hidden md:table-cell">Ühiku hind</th>
                  <th className="text-right px-5 py-2 font-medium text-gray-600">Summa</th>
                  <th className="text-center px-5 py-2 font-medium text-gray-600">Staatus</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {category.items.map((item) => {
                  const statusInfo = statusConfig[item.status]
                  const StatusIcon = statusInfo.icon
                  const isExpanded = expandedItem === item.id

                  return (
                    <React.Fragment key={item.id}>
                      <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedItem(isExpanded ? null : item.id)}>
                        <td className="px-5 py-3 font-mono text-xs text-gray-600">{item.code}</td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">{item.system}</p>
                        </td>
                        <td className="px-5 py-3 hidden lg:table-cell text-gray-600">
                          {item.manufacturer && <span>{item.manufacturer}</span>}
                          {item.model && <span className="text-gray-400"> / {item.model}</span>}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <span className="font-medium">{item.quantity}</span>
                          <span className="text-gray-400 ml-1">{item.unit}</span>
                        </td>
                        <td className="px-5 py-3 text-right text-gray-600 hidden md:table-cell">
                          {formatCurrency(item.unitPrice)}
                        </td>
                        <td className="px-5 py-3 text-right font-medium">
                          {formatCurrency(item.totalPrice)}
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium inline-flex items-center gap-1 ${statusInfo.bg} ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <button className="p-1 hover:bg-gray-100 rounded" onClick={(e) => e.stopPropagation()}>
                            <MoreVertical className="w-4 h-4 text-gray-400" />
                          </button>
                        </td>
                      </tr>
                      {isExpanded && item.specifications && (
                        <tr>
                          <td colSpan={8} className="bg-gray-50 px-5 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              {Object.entries(item.specifications).map(([key, value]) => (
                                <div key={key}>
                                  <p className="text-gray-500 text-xs">{key}</p>
                                  <p className="font-medium">{value}</p>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        ))}

        {Object.keys(groupedSpecs).length === 0 && (
          <div className="text-center py-12 bg-white border rounded-lg text-gray-500">
            <ListChecks className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>Spetsifikatsioone ei leitud</p>
          </div>
        )}
      </div>
    </div>
  )
}
