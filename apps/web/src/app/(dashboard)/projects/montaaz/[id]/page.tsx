'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import {
  Building2,
  MapPin,
  User,
  Calendar,
  Phone,
  Mail,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Pause,
  Play,
} from 'lucide-react'

// Mock project data - will be replaced with API call
const mockProject = {
  id: '1',
  code: 'MON-2024-001',
  name: 'Ülemiste keskuse laiendus',
  description: 'Ülemiste keskuse uue tiiva ventilatsioonisüsteemide paigaldus ja käivitus. Projekt hõlmab 3 korrust ja ~15,000 m² pinda.',
  client: {
    name: 'Ülemiste OÜ',
    contact: 'Mart Saar',
    phone: '+372 5551 2345',
    email: 'mart@ulemiste.ee',
  },
  address: 'Suur-Sõjamäe 4, Tallinn',
  manager: 'Jaan Tamm',
  status: 'active',
  startDate: '2024-01-10',
  deadline: '2024-05-30',
  progress: 70,
  budget: 450000,
  spent: 315000,
  systems: 12,
  completedSystems: 8,
  openIssues: 3,
  team: ['Jaan Tamm', 'Peeter Mets', 'Andres Kask', 'Tiit Lepp'],
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  planning: { label: 'Planeerimisel', color: 'text-blue-700', bg: 'bg-blue-100', icon: Clock },
  active: { label: 'Aktiivne', color: 'text-green-700', bg: 'bg-green-100', icon: Play },
  paused: { label: 'Peatatud', color: 'text-yellow-700', bg: 'bg-yellow-100', icon: Pause },
  completed: { label: 'Lõpetatud', color: 'text-gray-700', bg: 'bg-gray-100', icon: CheckCircle2 },
}

export default function MontaazProjectOverviewPage() {
  const params = useParams()
  const projectId = params.id as string

  // In real implementation, fetch project data based on projectId
  const project = mockProject

  const statusInfo = statusConfig[project.status] || statusConfig.active
  const StatusIcon = statusInfo.icon
  const budgetUsedPercent = Math.round((project.spent / project.budget) * 100)
  const systemsPercent = Math.round((project.completedSystems / project.systems) * 100)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('et-EE', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('et-EE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="space-y-6">
      {/* Project Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
            <span className={`px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1.5 ${statusInfo.bg} ${statusInfo.color}`}>
              <StatusIcon className="w-4 h-4" />
              {statusInfo.label}
            </span>
          </div>
          <p className="text-gray-500">{project.code}</p>
        </div>

        <div className="flex items-center gap-2">
          <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            Muuda
          </button>
          <button className="px-4 py-2 text-sm font-medium text-white bg-[#279989] rounded-lg hover:bg-[#1f7a6d]">
            Ava tööplaan
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-[#279989]/10 to-[#279989]/5 rounded-xl p-4 border border-[#279989]/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Üldine progress</span>
            <TrendingUp className="w-4 h-4 text-[#279989]" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{project.progress}%</p>
          <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
            <div className="h-2 bg-[#279989] rounded-full" style={{ width: `${project.progress}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Süsteemid</span>
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{project.completedSystems}/{project.systems}</p>
          <div className="w-full h-2 bg-gray-200 rounded-full mt-2">
            <div className="h-2 bg-green-500 rounded-full" style={{ width: `${systemsPercent}%` }} />
          </div>
        </div>

        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Eelarve kasutatud</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{budgetUsedPercent}%</p>
          <p className="text-xs text-gray-500 mt-1">{formatCurrency(project.spent)} / {formatCurrency(project.budget)}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Avatud probleemid</span>
            <AlertCircle className="w-4 h-4 text-orange-500" />
          </div>
          <p className="text-2xl font-bold text-gray-900">{project.openIssues}</p>
          <p className="text-xs text-gray-500 mt-1">Vajavad lahendamist</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Project Details */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Projekti andmed</h3>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">{project.description}</p>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Asukoht</p>
                  <p className="text-sm text-gray-900">{project.address}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Projektijuht</p>
                  <p className="text-sm text-gray-900">{project.manager}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Alguskuupäev</p>
                  <p className="text-sm text-gray-900">{formatDate(project.startDate)}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock className="w-4 h-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-500">Tähtaeg</p>
                  <p className="text-sm text-gray-900">{formatDate(project.deadline)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Client Info */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Tellija</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{project.client.name}</p>
                <p className="text-sm text-gray-500">{project.client.contact}</p>
              </div>
            </div>

            <div className="space-y-2 pt-4 border-t">
              <a href={`tel:${project.client.phone}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-[#279989]">
                <Phone className="w-4 h-4" />
                {project.client.phone}
              </a>
              <a href={`mailto:${project.client.email}`} className="flex items-center gap-3 text-sm text-gray-600 hover:text-[#279989]">
                <Mail className="w-4 h-4" />
                {project.client.email}
              </a>
            </div>
          </div>
        </div>

        {/* Team Members */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Meeskond</h3>
          <div className="space-y-3">
            {project.team.map((member, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-500" />
                </div>
                <span className="text-sm text-gray-900">{member}</span>
                {index === 0 && (
                  <span className="px-2 py-0.5 text-xs bg-[#279989]/10 text-[#279989] rounded">Projektijuht</span>
                )}
              </div>
            ))}
          </div>
          <button className="mt-4 text-sm text-[#279989] hover:underline">
            + Lisa meeskonnaliige
          </button>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Kiired toimingud</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <p className="text-sm font-medium text-gray-900">Lisa ETP kanne</p>
              <p className="text-xs text-gray-500">Päeviku sisestus</p>
            </button>
            <button className="p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <p className="text-sm font-medium text-gray-900">Uus tellimus</p>
              <p className="text-xs text-gray-500">Loo materjali tellimus</p>
            </button>
            <button className="p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <p className="text-sm font-medium text-gray-900">Lisa lisatöö</p>
              <p className="text-xs text-gray-500">Registreeri muudatus</p>
            </button>
            <button className="p-3 text-left bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
              <p className="text-sm font-medium text-gray-900">Ava Trimble</p>
              <p className="text-xs text-gray-500">Vaata mudelit</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
