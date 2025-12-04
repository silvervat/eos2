'use client'

/**
 * Projektid - PTV
 */

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Search, ArrowUpDown, MoreVertical, Zap, Calendar, User, MapPin } from 'lucide-react'

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
}

const mockProjects: Project[] = [
  { id: '1', number: 'PTV-2024-001', name: 'Tallinna PV park', client: 'Energia OÜ', address: 'Energia tee 5, Tallinn', manager: 'Mari Maasikas', status: 'active', startDate: '2024-01-15', deadline: '2024-06-30', progress: 65 },
  { id: '2', number: 'PTV-2024-002', name: 'Tartu päikesepark', client: 'Green Energy AS', address: 'Päikese 12, Tartu', manager: 'Jaan Tamm', status: 'active', startDate: '2024-02-01', deadline: '2024-08-15', progress: 40 },
  { id: '3', number: 'PTV-2024-003', name: 'Pärnu katusepaneelid', client: 'Solar Pro OÜ', address: 'Ranna pst 25, Pärnu', manager: 'Mari Maasikas', status: 'planning', startDate: '2024-03-01', deadline: '2024-05-30', progress: 10 },
  { id: '4', number: 'PTV-2023-045', name: 'Rakvere tehas', client: 'Tööstus AS', address: 'Tehase 8, Rakvere', manager: 'Peeter Pärn', status: 'completed', startDate: '2023-06-01', deadline: '2023-12-15', progress: 100 },
  { id: '5', number: 'PTV-2024-004', name: 'Viljandi laohall', client: 'Ladu OÜ', address: 'Lao tee 3, Viljandi', manager: 'Jaan Tamm', status: 'paused', startDate: '2024-01-20', deadline: '2024-07-01', progress: 25 },
]

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  planning: { label: 'Planeerimisel', color: 'text-blue-700', bg: 'bg-blue-100' },
  active: { label: 'Aktiivne', color: 'text-green-700', bg: 'bg-green-100' },
  paused: { label: 'Peatatud', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  completed: { label: 'Lõpetatud', color: 'text-gray-700', bg: 'bg-gray-100' },
}

export default function PTVProjectsPage() {
  const [projects] = useState<Project[]>(mockProjects)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.number.toLowerCase().includes(search.toLowerCase()) ||
        p.client.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [projects, search, statusFilter])

  const stats = {
    total: projects.length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-yellow-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">PTV projektid</h1>
            <p className="text-gray-500 text-sm">Päikeseenergia ja tuuleparkide projektid</p>
          </div>
        </div>
        <Link
          href="/projects/ptv/new"
          className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Uus PTV projekt
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
          <p className="text-sm text-gray-500">Kokku projekte</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-2xl font-bold text-green-600">{stats.active}</p>
          <p className="text-sm text-gray-500">Aktiivsed</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-2xl font-bold text-gray-600">{stats.completed}</p>
          <p className="text-sm text-gray-500">Lõpetatud</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4 flex gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Otsi projekti..."
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
          <option value="planning">Planeerimisel</option>
          <option value="active">Aktiivne</option>
          <option value="paused">Peatatud</option>
          <option value="completed">Lõpetatud</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Projekt</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Klient</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Asukoht</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Projektijuht</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tähtaeg</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Progress</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Staatus</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredProjects.map((project) => (
              <tr key={project.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900">{project.name}</p>
                    <p className="text-xs text-gray-500">{project.number}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{project.client}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-gray-500 text-xs">
                    <MapPin className="w-3 h-3" />
                    {project.address}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-gray-600">
                    <User className="w-3 h-3" />
                    {project.manager}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-gray-500 text-xs">
                    <Calendar className="w-3 h-3" />
                    {project.deadline}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-[#279989] rounded-full"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{project.progress}%</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${statusConfig[project.status].bg} ${statusConfig[project.status].color}`}>
                    {statusConfig[project.status].label}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button className="p-1 hover:bg-gray-100 rounded">
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
