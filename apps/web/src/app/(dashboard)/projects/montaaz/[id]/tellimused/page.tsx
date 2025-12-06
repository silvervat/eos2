'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Plus,
  Search,
  MoreVertical,
  Package,
  Clock,
  CheckCircle2,
  Truck,
  AlertCircle,
  XCircle,
  Calendar,
  Building2,
  FileText,
  Download,
} from 'lucide-react'

interface Order {
  id: string
  orderNumber: string
  supplier: string
  description: string
  items: number
  totalValue: number
  status: 'draft' | 'sent' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'
  orderDate: string
  expectedDelivery?: string
  deliveredDate?: string
  createdBy: string
}

const mockOrders: Order[] = [
  {
    id: '1',
    orderNumber: 'ORD-2024-0156',
    supplier: 'Lindab AS',
    description: 'Ventilatsiooni kanalid ja liitmikud',
    items: 24,
    totalValue: 4580,
    status: 'delivered',
    orderDate: '2024-03-01',
    expectedDelivery: '2024-03-08',
    deliveredDate: '2024-03-07',
    createdBy: 'Jaan Tamm',
  },
  {
    id: '2',
    orderNumber: 'ORD-2024-0163',
    supplier: 'Onninen OY',
    description: 'Küttesüsteemi torud ja isolatsioon',
    items: 18,
    totalValue: 2340,
    status: 'shipped',
    orderDate: '2024-03-10',
    expectedDelivery: '2024-03-18',
    createdBy: 'Peeter Mets',
  },
  {
    id: '3',
    orderNumber: 'ORD-2024-0171',
    supplier: 'Daikin Eesti',
    description: 'Jahutusseadmed ja lisavarustus',
    items: 6,
    totalValue: 12800,
    status: 'confirmed',
    orderDate: '2024-03-12',
    expectedDelivery: '2024-03-25',
    createdBy: 'Jaan Tamm',
  },
  {
    id: '4',
    orderNumber: 'ORD-2024-0175',
    supplier: 'Elektroskandia',
    description: 'Automaatika komponendid',
    items: 42,
    totalValue: 3650,
    status: 'sent',
    orderDate: '2024-03-14',
    createdBy: 'Andres Kask',
  },
  {
    id: '5',
    orderNumber: 'ORD-2024-0178',
    supplier: 'Uponor',
    description: 'PEX-torustik ja kollektorid',
    items: 8,
    totalValue: 1890,
    status: 'draft',
    orderDate: '2024-03-15',
    createdBy: 'Jaan Tamm',
  },
]

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  draft: { label: 'Mustand', color: 'text-gray-600', bg: 'bg-gray-100', icon: FileText },
  sent: { label: 'Saadetud', color: 'text-blue-600', bg: 'bg-blue-100', icon: Clock },
  confirmed: { label: 'Kinnitatud', color: 'text-indigo-600', bg: 'bg-indigo-100', icon: CheckCircle2 },
  shipped: { label: 'Teel', color: 'text-orange-600', bg: 'bg-orange-100', icon: Truck },
  delivered: { label: 'Kohale jõudnud', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2 },
  cancelled: { label: 'Tühistatud', color: 'text-red-600', bg: 'bg-red-100', icon: XCircle },
}

export default function OrdersPage() {
  const params = useParams()
  const projectId = params.id as string

  const [orders] = useState<Order[]>(mockOrders)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredOrders = orders.filter(order => {
    const matchesSearch = search === '' ||
      order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      order.supplier.toLowerCase().includes(search.toLowerCase()) ||
      order.description.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    return matchesSearch && matchesStatus
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
  const totalOrders = orders.length
  const pendingOrders = orders.filter(o => ['draft', 'sent', 'confirmed'].includes(o.status)).length
  const inTransitOrders = orders.filter(o => o.status === 'shipped').length
  const totalValue = orders.reduce((sum, o) => sum + o.totalValue, 0)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Kokku tellimusi</p>
          <p className="text-2xl font-bold text-gray-900">{totalOrders}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600">Ootel</p>
          <p className="text-2xl font-bold text-blue-700">{pendingOrders}</p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-600">Teel</p>
          <p className="text-2xl font-bold text-orange-700">{inTransitOrders}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600">Koguväärtus</p>
          <p className="text-2xl font-bold text-green-700">{formatCurrency(totalValue)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Otsi tellimust..."
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
          <option value="sent">Saadetud</option>
          <option value="confirmed">Kinnitatud</option>
          <option value="shipped">Teel</option>
          <option value="delivered">Kohale jõudnud</option>
          <option value="cancelled">Tühistatud</option>
        </select>
        <button className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Uus tellimus
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tellimus</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tarnija</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Artiklid</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Summa</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Tarne</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Staatus</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredOrders.map((order) => {
              const statusInfo = statusConfig[order.status]
              const StatusIcon = statusInfo.icon

              return (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{order.description}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-400" />
                      <span>{order.supplier}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">{order.items} artiklit</span>
                  </td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(order.totalValue)}</td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {order.deliveredDate ? (
                      <span className="text-green-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        {formatDate(order.deliveredDate)}
                      </span>
                    ) : order.expectedDelivery ? (
                      <span className="text-gray-600 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(order.expectedDelivery)}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 w-fit ${statusInfo.bg} ${statusInfo.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="p-1 hover:bg-gray-100 rounded">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filteredOrders.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>Tellimusi ei leitud</p>
          </div>
        )}
      </div>
    </div>
  )
}
