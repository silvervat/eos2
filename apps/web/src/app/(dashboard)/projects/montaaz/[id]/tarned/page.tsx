'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Plus,
  Search,
  MoreVertical,
  Truck,
  Package,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MapPin,
  Calendar,
  User,
  Camera,
  FileCheck,
} from 'lucide-react'

interface Delivery {
  id: string
  deliveryNumber: string
  orderNumber: string
  supplier: string
  description: string
  items: number
  status: 'scheduled' | 'in_transit' | 'arrived' | 'unloading' | 'completed' | 'issue'
  scheduledDate: string
  scheduledTime?: string
  arrivedAt?: string
  completedAt?: string
  receiver?: string
  location: string
  notes?: string
  hasPhotos: boolean
  hasDeliveryNote: boolean
}

const mockDeliveries: Delivery[] = [
  {
    id: '1',
    deliveryNumber: 'DEL-2024-089',
    orderNumber: 'ORD-2024-0163',
    supplier: 'Onninen OY',
    description: 'Küttesüsteemi torud ja isolatsioon',
    items: 18,
    status: 'in_transit',
    scheduledDate: '2024-03-18',
    scheduledTime: '09:00-12:00',
    location: 'Peauks - rambi juures',
    hasPhotos: false,
    hasDeliveryNote: false,
  },
  {
    id: '2',
    deliveryNumber: 'DEL-2024-088',
    orderNumber: 'ORD-2024-0156',
    supplier: 'Lindab AS',
    description: 'Ventilatsiooni kanalid - 2. osa',
    items: 12,
    status: 'completed',
    scheduledDate: '2024-03-15',
    arrivedAt: '2024-03-15T10:30:00',
    completedAt: '2024-03-15T11:45:00',
    receiver: 'Peeter Mets',
    location: 'Tagauks - laadimisala',
    hasPhotos: true,
    hasDeliveryNote: true,
  },
  {
    id: '3',
    deliveryNumber: 'DEL-2024-087',
    orderNumber: 'ORD-2024-0156',
    supplier: 'Lindab AS',
    description: 'Ventilatsiooni kanalid - 1. osa',
    items: 12,
    status: 'completed',
    scheduledDate: '2024-03-12',
    arrivedAt: '2024-03-12T08:45:00',
    completedAt: '2024-03-12T10:00:00',
    receiver: 'Jaan Tamm',
    location: 'Tagauks - laadimisala',
    hasPhotos: true,
    hasDeliveryNote: true,
  },
  {
    id: '4',
    deliveryNumber: 'DEL-2024-090',
    orderNumber: 'ORD-2024-0171',
    supplier: 'Daikin Eesti',
    description: 'Jahutusseadmed',
    items: 6,
    status: 'scheduled',
    scheduledDate: '2024-03-25',
    scheduledTime: '08:00-10:00',
    location: 'Peauks - kraanaga vastuvõtt',
    notes: 'Vajalik kraana ja 2 abilist',
    hasPhotos: false,
    hasDeliveryNote: false,
  },
]

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  scheduled: { label: 'Planeeritud', color: 'text-gray-600', bg: 'bg-gray-100', icon: Calendar },
  in_transit: { label: 'Teel', color: 'text-blue-600', bg: 'bg-blue-100', icon: Truck },
  arrived: { label: 'Kohal', color: 'text-orange-600', bg: 'bg-orange-100', icon: MapPin },
  unloading: { label: 'Mahalaadimine', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Package },
  completed: { label: 'Vastu võetud', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2 },
  issue: { label: 'Probleem', color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle },
}

export default function DeliveriesPage() {
  const params = useParams()
  const projectId = params.id as string

  const [deliveries] = useState<Delivery[]>(mockDeliveries)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredDeliveries = deliveries.filter(delivery => {
    const matchesSearch = search === '' ||
      delivery.deliveryNumber.toLowerCase().includes(search.toLowerCase()) ||
      delivery.supplier.toLowerCase().includes(search.toLowerCase()) ||
      delivery.description.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || delivery.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('et-EE', {
      day: 'numeric',
      month: 'short',
    })
  }

  const formatTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleTimeString('et-EE', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Stats
  const totalDeliveries = deliveries.length
  const upcomingDeliveries = deliveries.filter(d => ['scheduled', 'in_transit'].includes(d.status)).length
  const completedDeliveries = deliveries.filter(d => d.status === 'completed').length
  const issueDeliveries = deliveries.filter(d => d.status === 'issue').length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Kokku tarneid</p>
          <p className="text-2xl font-bold text-gray-900">{totalDeliveries}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600">Tulemas</p>
          <p className="text-2xl font-bold text-blue-700">{upcomingDeliveries}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600">Vastu võetud</p>
          <p className="text-2xl font-bold text-green-700">{completedDeliveries}</p>
        </div>
        {issueDeliveries > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-600">Probleemid</p>
            <p className="text-2xl font-bold text-red-700">{issueDeliveries}</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Otsi tarnet..."
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
          <option value="scheduled">Planeeritud</option>
          <option value="in_transit">Teel</option>
          <option value="arrived">Kohal</option>
          <option value="completed">Vastu võetud</option>
          <option value="issue">Probleem</option>
        </select>
        <button className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Lisa tarne
        </button>
      </div>

      {/* Deliveries List */}
      <div className="space-y-3">
        {filteredDeliveries.map((delivery) => {
          const statusInfo = statusConfig[delivery.status]
          const StatusIcon = statusInfo.icon

          return (
            <div key={delivery.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center gap-4">
                {/* Left: Status & Date */}
                <div className="flex items-center gap-4 md:w-48">
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${statusInfo.bg}`}>
                    <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{formatDate(delivery.scheduledDate)}</p>
                    {delivery.scheduledTime && (
                      <p className="text-sm text-gray-500">{delivery.scheduledTime}</p>
                    )}
                  </div>
                </div>

                {/* Middle: Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium text-gray-900">{delivery.deliveryNumber}</p>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-500">{delivery.orderNumber}</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{delivery.description}</p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Package className="w-3 h-3" />
                      {delivery.items} artiklit
                    </span>
                    <span>{delivery.supplier}</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {delivery.location}
                    </span>
                    {delivery.receiver && (
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {delivery.receiver}
                      </span>
                    )}
                  </div>
                  {delivery.notes && (
                    <p className="mt-2 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded inline-block">
                      {delivery.notes}
                    </p>
                  )}
                </div>

                {/* Right: Status & Actions */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    {delivery.hasPhotos && (
                      <span className="p-1.5 bg-gray-100 rounded" title="Fotod lisatud">
                        <Camera className="w-4 h-4 text-gray-500" />
                      </span>
                    )}
                    {delivery.hasDeliveryNote && (
                      <span className="p-1.5 bg-gray-100 rounded" title="Saateleht lisatud">
                        <FileCheck className="w-4 h-4 text-gray-500" />
                      </span>
                    )}
                  </div>
                  <span className={`px-3 py-1.5 rounded-lg text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {filteredDeliveries.length === 0 && (
          <div className="text-center py-12 bg-white border rounded-lg text-gray-500">
            <Truck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>Tarneid ei leitud</p>
          </div>
        )}
      </div>
    </div>
  )
}
