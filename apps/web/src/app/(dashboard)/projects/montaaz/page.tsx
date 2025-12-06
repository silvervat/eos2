'use client'

/**
 * Projektid - Montaaž
 */

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Plus, Search, MoreVertical, Hammer, Calendar, User, MapPin, Eye } from 'lucide-react'

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
  { id: '1', number: 'MON-2024-001', name: 'Ülemiste keskuse laiendus', client: 'Ülemiste OÜ', address: 'Suur-Sõjamäe 4, Tallinn', manager: 'Jaan Tamm', status: 'active', startDate: '2024-01-10', deadline: '2024-05-30', progress: 70 },
  { id: '2', number: 'MON-2024-002', name: 'Tartu kontor', client: 'IT Solutions AS', address: 'Riia 142, Tartu', manager: 'Jaan Tamm', status: 'active', startDate: '2024-02-15', deadline: '2024-04-30', progress: 85 },
  { id: '3', number: 'MON-2024-003', name: 'Pärnu hotell', client: 'Hotell AS', address: 'Rüütli 44, Pärnu', manager: 'Toomas Kuusk', status: 'planning', startDate: '2024-04-01', deadline: '2024-08-30', progress: 5 },
  { id: '4', number: 'MON-2023-089', name: 'Viru keskus', client: 'Kaubanduskeskus OÜ', address: 'Viru väljak 4, Tallinn', manager: 'Jaan Tamm', status: 'completed', startDate: '2023-08-01', deadline: '2023-12-20', progress: 100 },
]

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  planning: { label: 'Planeerimisel', color: 'text-blue-700', bg: 'bg-blue-100' },
  active: { label: 'Aktiivne', color: 'text-green-700', bg: 'bg-green-100' },
  paused: { label: 'Peatatud', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  completed: { label: 'Lõpetatud', color: 'text-gray-700', bg: 'bg-gray-100' },
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

  return (
    <div className="space-y-4">
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

      <div className="bg-white rounded-lg border p-4 flex gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Otsi projekti..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="all">Kõik staatused</option>
          <option value="active">Aktiivne</option>
          <option value="planning">Planeerimisel</option>
          <option value="completed">Lõpetatud</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3">Projekt</th>
              <th className="text-left px-4 py-3">Klient</th>
              <th className="text-left px-4 py-3">Asukoht</th>
              <th className="text-left px-4 py-3">Projektijuht</th>
              <th className="text-left px-4 py-3">Progress</th>
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
                <td className="px-4 py-3">{project.client}</td>
                <td className="px-4 py-3 text-xs text-gray-500"><MapPin className="w-3 h-3 inline mr-1" />{project.address}</td>
                <td className="px-4 py-3"><User className="w-3 h-3 inline mr-1" />{project.manager}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-gray-200 rounded-full">
                      <div className="h-2 bg-[#279989] rounded-full" style={{ width: `${project.progress}%` }} />
                    </div>
                    <span className="text-xs">{project.progress}%</span>
                  </div>
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
