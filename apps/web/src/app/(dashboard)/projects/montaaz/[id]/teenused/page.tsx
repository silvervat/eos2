'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Plus,
  Search,
  MoreVertical,
  Wrench,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Calendar,
  User,
  Building2,
  DollarSign,
  FileText,
} from 'lucide-react'

interface Service {
  id: string
  serviceNumber: string
  title: string
  type: 'commissioning' | 'maintenance' | 'repair' | 'inspection' | 'training'
  provider: string
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  scheduledDate: string
  completedDate?: string
  cost: number
  technician?: string
  description?: string
  systemsAffected: string[]
  hours?: number
}

const mockServices: Service[] = [
  {
    id: '1',
    serviceNumber: 'SRV-2024-021',
    title: 'VKT agregaadi käivitus',
    type: 'commissioning',
    provider: 'Rivest OÜ',
    status: 'completed',
    scheduledDate: '2024-03-10',
    completedDate: '2024-03-10',
    cost: 850,
    technician: 'Andres Kask',
    description: 'Ventilatsiooniaggregaadi seadistamine ja käivitamine',
    systemsAffected: ['VEN-01', 'VEN-02'],
    hours: 6,
  },
  {
    id: '2',
    serviceNumber: 'SRV-2024-024',
    title: 'Küttesüsteemi tasakaalustamine',
    type: 'commissioning',
    provider: 'Rivest OÜ',
    status: 'in_progress',
    scheduledDate: '2024-03-15',
    cost: 1200,
    technician: 'Tiit Lepp',
    description: 'Põrandakütte tasakaalustamine ja termostaatide seadistamine',
    systemsAffected: ['KYT-01', 'KYT-02'],
    hours: 8,
  },
  {
    id: '3',
    serviceNumber: 'SRV-2024-028',
    title: 'Jahutussüsteemi inspekteerimine',
    type: 'inspection',
    provider: 'Daikin Eesti',
    status: 'planned',
    scheduledDate: '2024-03-20',
    cost: 450,
    description: 'Tehase poolne inspekteerimine enne garantiiperioodi algust',
    systemsAffected: ['JAH-01'],
  },
  {
    id: '4',
    serviceNumber: 'SRV-2024-030',
    title: 'Automaatika koolitus',
    type: 'training',
    provider: 'Rivest OÜ',
    status: 'planned',
    scheduledDate: '2024-04-05',
    cost: 600,
    description: 'Kliendi hoolduspersonali koolitus BMS süsteemi kasutamiseks',
    systemsAffected: [],
    hours: 4,
  },
]

const typeConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  commissioning: { label: 'Käivitus', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2 },
  maintenance: { label: 'Hooldus', color: 'text-blue-600', bg: 'bg-blue-100', icon: Wrench },
  repair: { label: 'Remont', color: 'text-orange-600', bg: 'bg-orange-100', icon: AlertTriangle },
  inspection: { label: 'Inspekteerimine', color: 'text-purple-600', bg: 'bg-purple-100', icon: FileText },
  training: { label: 'Koolitus', color: 'text-indigo-600', bg: 'bg-indigo-100', icon: User },
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  planned: { label: 'Planeeritud', color: 'text-gray-600', bg: 'bg-gray-100' },
  in_progress: { label: 'Käimas', color: 'text-blue-600', bg: 'bg-blue-100' },
  completed: { label: 'Tehtud', color: 'text-green-600', bg: 'bg-green-100' },
  cancelled: { label: 'Tühistatud', color: 'text-red-600', bg: 'bg-red-100' },
}

export default function ServicesPage() {
  const params = useParams()
  const projectId = params.id as string

  const [services] = useState<Service[]>(mockServices)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredServices = services.filter(service => {
    const matchesSearch = search === '' ||
      service.title.toLowerCase().includes(search.toLowerCase()) ||
      service.serviceNumber.toLowerCase().includes(search.toLowerCase())
    const matchesType = typeFilter === 'all' || service.type === typeFilter
    const matchesStatus = statusFilter === 'all' || service.status === statusFilter
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
  const totalCost = services.reduce((sum, s) => sum + s.cost, 0)
  const completedServices = services.filter(s => s.status === 'completed').length
  const plannedServices = services.filter(s => s.status === 'planned').length

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Teenuseid kokku</p>
          <p className="text-2xl font-bold text-gray-900">{services.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600">Tehtud</p>
          <p className="text-2xl font-bold text-green-700">{completedServices}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600">Planeeritud</p>
          <p className="text-2xl font-bold text-blue-700">{plannedServices}</p>
        </div>
        <div className="bg-gray-50 border rounded-lg p-4">
          <p className="text-sm text-gray-500">Kogumaksumus</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCost)}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Otsi teenust..."
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
          <option value="commissioning">Käivitus</option>
          <option value="maintenance">Hooldus</option>
          <option value="repair">Remont</option>
          <option value="inspection">Inspekteerimine</option>
          <option value="training">Koolitus</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="all">Kõik staatused</option>
          <option value="planned">Planeeritud</option>
          <option value="in_progress">Käimas</option>
          <option value="completed">Tehtud</option>
          <option value="cancelled">Tühistatud</option>
        </select>
        <button className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Uus teenus
        </button>
      </div>

      {/* Services List */}
      <div className="space-y-4">
        {filteredServices.map((service) => {
          const typeInfo = typeConfig[service.type]
          const statusInfo = statusConfig[service.status]
          const TypeIcon = typeInfo.icon

          return (
            <div key={service.id} className="bg-white border rounded-lg p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeInfo.bg}`}>
                    <TypeIcon className={`w-5 h-5 ${typeInfo.color}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm text-gray-500">{service.serviceNumber}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${typeInfo.bg} ${typeInfo.color}`}>
                        {typeInfo.label}
                      </span>
                    </div>
                    <h3 className="font-semibold text-gray-900">{service.title}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>

              {service.description && (
                <p className="text-sm text-gray-600 mb-4">{service.description}</p>
              )}

              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    Kuupäev
                  </p>
                  <p className="font-medium">{formatDate(service.scheduledDate)}</p>
                </div>
                <div>
                  <p className="text-gray-500 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    Teenusepakkuja
                  </p>
                  <p className="font-medium">{service.provider}</p>
                </div>
                {service.technician && (
                  <div>
                    <p className="text-gray-500 flex items-center gap-1">
                      <User className="w-3 h-3" />
                      Tehnik
                    </p>
                    <p className="font-medium">{service.technician}</p>
                  </div>
                )}
                <div>
                  <p className="text-gray-500 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Maksumus
                  </p>
                  <p className="font-medium">{formatCurrency(service.cost)}</p>
                </div>
                {service.hours && (
                  <div>
                    <p className="text-gray-500 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Aeg
                    </p>
                    <p className="font-medium">{service.hours}h</p>
                  </div>
                )}
              </div>

              {service.systemsAffected.length > 0 && (
                <div className="mt-4 pt-3 border-t">
                  <p className="text-xs text-gray-500 mb-2">Seotud süsteemid:</p>
                  <div className="flex flex-wrap gap-2">
                    {service.systemsAffected.map((system, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-700">
                        {system}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filteredServices.length === 0 && (
          <div className="text-center py-12 bg-white border rounded-lg text-gray-500">
            <Wrench className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>Teenuseid ei leitud</p>
          </div>
        )}
      </div>
    </div>
  )
}
