'use client'

/**
 * Projektid - Montaaž - Ülevaade
 */

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  MoreVertical,
  Hammer,
  User,
  MapPin,
  Eye,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Truck,
  FileText,
  Users,
  Calendar,
  ArrowRight,
  Package,
} from 'lucide-react'

interface Project {
  id: string
  number: string
  name: string
  client: string
  address: string
  manager: string
  status: 'planning' | 'active' | 'paused' | 'completed'
  startDate: string
  deadline: string
  progress: number
  // Additional stats for overview
  openTasks: number
  pendingDeliveries: number
  teamSize: number
}

const mockProjects: Project[] = [
  { id: '1', number: 'MON-2024-001', name: 'Ülemiste keskuse laiendus', client: 'Ülemiste OÜ', address: 'Suur-Sõjamäe 4, Tallinn', manager: 'Jaan Tamm', status: 'active', startDate: '2024-01-10', deadline: '2024-05-30', progress: 70, openTasks: 8, pendingDeliveries: 2, teamSize: 4 },
  { id: '2', number: 'MON-2024-002', name: 'Tartu kontor', client: 'IT Solutions AS', address: 'Riia 142, Tartu', manager: 'Jaan Tamm', status: 'active', startDate: '2024-02-15', deadline: '2024-04-30', progress: 85, openTasks: 3, pendingDeliveries: 1, teamSize: 3 },
  { id: '3', number: 'MON-2024-003', name: 'Pärnu hotell', client: 'Hotell AS', address: 'Rüütli 44, Pärnu', manager: 'Toomas Kuusk', status: 'planning', startDate: '2024-04-01', deadline: '2024-08-30', progress: 5, openTasks: 12, pendingDeliveries: 0, teamSize: 0 },
  { id: '4', number: 'MON-2023-089', name: 'Viru keskus', client: 'Kaubanduskeskus OÜ', address: 'Viru väljak 4, Tallinn', manager: 'Jaan Tamm', status: 'completed', startDate: '2023-08-01', deadline: '2023-12-20', progress: 100, openTasks: 0, pendingDeliveries: 0, teamSize: 0 },
]

// Mock upcoming tasks across all projects
const upcomingTasks = [
  { id: '1', projectId: '1', projectName: 'Ülemiste keskuse laiendus', task: 'Daikin inspektori visiit', dueDate: '2024-03-19', priority: 'urgent' },
  { id: '2', projectId: '1', projectName: 'Ülemiste keskuse laiendus', task: 'Kanalite paigaldus lõpetada', dueDate: '2024-03-20', priority: 'high' },
  { id: '3', projectId: '2', projectName: 'Tartu kontor', task: 'Käivitustest VEN-01', dueDate: '2024-03-21', priority: 'medium' },
  { id: '4', projectId: '1', projectName: 'Ülemiste keskuse laiendus', task: 'Põrandakütte survetestid', dueDate: '2024-03-22', priority: 'medium' },
]

// Mock upcoming deliveries
const upcomingDeliveries = [
  { id: '1', projectId: '1', projectName: 'Ülemiste keskuse laiendus', supplier: 'Onninen OY', description: 'Küttesüsteemi torud', date: '2024-03-18', status: 'in_transit' },
  { id: '2', projectId: '1', projectName: 'Ülemiste keskuse laiendus', supplier: 'Daikin Eesti', description: 'Jahutusseadmed', date: '2024-03-25', status: 'scheduled' },
  { id: '3', projectId: '2', projectName: 'Tartu kontor', supplier: 'Lindab AS', description: 'Ventilatsiooni kanalid', date: '2024-03-20', status: 'scheduled' },
]

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  planning: { label: 'Planeerimisel', color: 'text-blue-700', bg: 'bg-blue-100' },
  active: { label: 'Aktiivne', color: 'text-green-700', bg: 'bg-green-100' },
  paused: { label: 'Peatatud', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  completed: { label: 'Lõpetatud', color: 'text-gray-700', bg: 'bg-gray-100' },
}

const priorityColors: Record<string, string> = {
  low: 'text-gray-500',
  medium: 'text-blue-600',
  high: 'text-orange-600',
  urgent: 'text-red-600',
}

export default function MontaazProjectsPage() {
  const router = useRouter()
  const [projects] = useState<Project[]>(mockProjects)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.number.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [projects, search, statusFilter])

  // Calculate overview stats
  const activeProjects = projects.filter(p => p.status === 'active').length
  const totalOpenTasks = projects.reduce((sum, p) => sum + p.openTasks, 0)
  const totalPendingDeliveries = projects.reduce((sum, p) => sum + p.pendingDeliveries, 0)
  const totalTeamMembers = new Set(projects.filter(p => p.status === 'active').map(p => p.manager)).size +
    projects.filter(p => p.status === 'active').reduce((sum, p) => sum + p.teamSize, 0)
  const avgProgress = Math.round(
    projects.filter(p => p.status === 'active').reduce((sum, p) => sum + p.progress, 0) /
    Math.max(activeProjects, 1)
  )

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (dateString === today.toISOString().split('T')[0]) return 'Täna'
    if (dateString === tomorrow.toISOString().split('T')[0]) return 'Homme'
    return date.toLocaleDateString('et-EE', { day: 'numeric', month: 'short' })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <Hammer className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Montaaži projektid</h1>
            <p className="text-gray-500 text-sm">Paigaldus- ja ehitustööd</p>
          </div>
        </div>
        <Link href="/projects/montaaz/new" className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Uus projekt
        </Link>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-[#279989] to-[#1f7a6d] rounded-xl p-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white/80 text-sm">Aktiivseid projekte</p>
              <p className="text-3xl font-bold">{activeProjects}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-white/50" />
          </div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Keskmine progress</p>
              <p className="text-3xl font-bold text-gray-900">{avgProgress}%</p>
            </div>
            <div className="w-12 h-12 rounded-full border-4 border-[#279989] flex items-center justify-center">
              <span className="text-xs font-bold text-[#279989]">{avgProgress}%</span>
            </div>
          </div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Avatud ülesandeid</p>
              <p className="text-3xl font-bold text-gray-900">{totalOpenTasks}</p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-orange-400" />
          </div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Ootel tarned</p>
              <p className="text-3xl font-bold text-gray-900">{totalPendingDeliveries}</p>
            </div>
            <Truck className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        <div className="bg-white border rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Töötajaid</p>
              <p className="text-3xl font-bold text-gray-900">{totalTeamMembers}</p>
            </div>
            <Users className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Quick Views */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Upcoming Tasks */}
        <div className="bg-white border rounded-xl">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Lähipäevade ülesanded</h3>
            </div>
            <span className="text-xs text-gray-500">Kõik projektid</span>
          </div>
          <div className="divide-y">
            {upcomingTasks.slice(0, 4).map((task) => (
              <Link
                key={task.id}
                href={`/projects/montaaz/${task.projectId}/uleesanded`}
                className="p-3 flex items-center gap-3 hover:bg-gray-50"
              >
                <div className={`w-2 h-2 rounded-full ${
                  task.priority === 'urgent' ? 'bg-red-500' :
                  task.priority === 'high' ? 'bg-orange-500' : 'bg-blue-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{task.task}</p>
                  <p className="text-xs text-gray-500">{task.projectName}</p>
                </div>
                <span className={`text-xs font-medium ${priorityColors[task.priority]}`}>
                  {formatDate(task.dueDate)}
                </span>
              </Link>
            ))}
          </div>
          <div className="p-3 border-t">
            <Link href="#" className="text-sm text-[#279989] hover:underline flex items-center gap-1">
              Vaata kõiki ülesandeid <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Upcoming Deliveries */}
        <div className="bg-white border rounded-xl">
          <div className="p-4 border-b flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-gray-400" />
              <h3 className="font-semibold text-gray-900">Ootel tarned</h3>
            </div>
            <span className="text-xs text-gray-500">Kõik projektid</span>
          </div>
          <div className="divide-y">
            {upcomingDeliveries.map((delivery) => (
              <Link
                key={delivery.id}
                href={`/projects/montaaz/${delivery.projectId}/tarned`}
                className="p-3 flex items-center gap-3 hover:bg-gray-50"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  delivery.status === 'in_transit' ? 'bg-blue-100' : 'bg-gray-100'
                }`}>
                  <Package className={`w-4 h-4 ${
                    delivery.status === 'in_transit' ? 'text-blue-600' : 'text-gray-500'
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{delivery.description}</p>
                  <p className="text-xs text-gray-500">{delivery.supplier} • {delivery.projectName}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-900">{formatDate(delivery.date)}</p>
                  <p className={`text-xs ${delivery.status === 'in_transit' ? 'text-blue-600' : 'text-gray-500'}`}>
                    {delivery.status === 'in_transit' ? 'Teel' : 'Planeeritud'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
          <div className="p-3 border-t">
            <Link href="#" className="text-sm text-[#279989] hover:underline flex items-center gap-1">
              Vaata kõiki tarneid <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="p-4 border-b flex flex-wrap gap-4 items-center justify-between">
          <h3 className="font-semibold text-gray-900">Projektide nimekiri</h3>
          <div className="flex gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Otsi projekti..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 border rounded-lg text-sm w-48"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border rounded-lg text-sm"
            >
              <option value="all">Kõik staatused</option>
              <option value="active">Aktiivne</option>
              <option value="planning">Planeerimisel</option>
              <option value="completed">Lõpetatud</option>
            </select>
          </div>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3">Projekt</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Klient</th>
              <th className="text-left px-4 py-3 hidden lg:table-cell">Asukoht</th>
              <th className="text-left px-4 py-3 hidden md:table-cell">Projektijuht</th>
              <th className="text-left px-4 py-3">Progress</th>
              <th className="text-center px-4 py-3 hidden lg:table-cell">Ülesanded</th>
              <th className="text-left px-4 py-3">Staatus</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredProjects.map((project) => (
              <tr
                key={project.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => router.push(`/projects/montaaz/${project.id}`)}
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/projects/montaaz/${project.id}`}
                    className="block"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <p className="font-medium text-[#279989] hover:underline">{project.name}</p>
                    <p className="text-xs text-gray-500">{project.number}</p>
                  </Link>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">{project.client}</td>
                <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                  <MapPin className="w-3 h-3 inline mr-1" />{project.address}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <User className="w-3 h-3 inline mr-1" />{project.manager}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full">
                      <div className="h-2 bg-[#279989] rounded-full" style={{ width: `${project.progress}%` }} />
                    </div>
                    <span className="text-xs">{project.progress}%</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-center hidden lg:table-cell">
                  {project.openTasks > 0 ? (
                    <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs">
                      {project.openTasks}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${statusConfig[project.status].bg} ${statusConfig[project.status].color}`}>
                    {statusConfig[project.status].label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Link
                      href={`/projects/montaaz/${project.id}`}
                      className="p-1 hover:bg-[#279989]/10 rounded text-[#279989]"
                      onClick={(e) => e.stopPropagation()}
                      title="Ava projekt"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <button
                      className="p-1 hover:bg-gray-100 rounded"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
