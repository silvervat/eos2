'use client'

/**
 * Projektid - Rent
 */

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Search, MoreVertical, Home, Calendar, User, MapPin, Euro, Clock } from 'lucide-react'

interface Project {
  id: string
  number: string
  name: string
  tenant: string
  property: string
  address: string
  manager: string
  status: 'available' | 'reserved' | 'active' | 'ending' | 'ended'
  monthlyRent: number
  startDate: string
  endDate: string
}

const mockProjects: Project[] = [
  { id: '1', number: 'REN-2024-001', name: 'Ladu A1', tenant: 'Logistika OÜ', property: 'Ülemiste Laopark', address: 'Suur-Sõjamäe 10a, Tallinn', manager: 'Kristjan Kask', status: 'active', monthlyRent: 2500, startDate: '2024-01-01', endDate: '2025-12-31' },
  { id: '2', number: 'REN-2024-002', name: 'Büroo 301', tenant: 'IT Startup OÜ', property: 'Ülemiste City', address: 'Sepise 7, Tallinn', manager: 'Kristjan Kask', status: 'active', monthlyRent: 1800, startDate: '2024-02-01', endDate: '2025-01-31' },
  { id: '3', number: 'REN-2024-003', name: 'Tootmishall B', tenant: 'Otsitakse', property: 'Tööstuspark Tartu', address: 'Tööstuse 5, Tartu', manager: 'Marika Mets', status: 'available', monthlyRent: 4500, startDate: '', endDate: '' },
  { id: '4', number: 'REN-2024-004', name: 'Kaubanduspind', tenant: 'Retail AS', property: 'Viru Keskus', address: 'Viru väljak 4, Tallinn', manager: 'Kristjan Kask', status: 'ending', monthlyRent: 3200, startDate: '2023-03-01', endDate: '2024-02-29' },
  { id: '5', number: 'REN-2024-005', name: 'Ladu C3', tenant: 'E-pood OÜ', property: 'Ülemiste Laopark', address: 'Suur-Sõjamäe 10c, Tallinn', manager: 'Marika Mets', status: 'reserved', monthlyRent: 1900, startDate: '2024-03-01', endDate: '2026-02-28' },
]

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  available: { label: 'Vaba', color: 'text-green-700', bg: 'bg-green-100' },
  reserved: { label: 'Broneeritud', color: 'text-blue-700', bg: 'bg-blue-100' },
  active: { label: 'Aktiivne', color: 'text-purple-700', bg: 'bg-purple-100' },
  ending: { label: 'Lõppemas', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  ended: { label: 'Lõppenud', color: 'text-gray-700', bg: 'bg-gray-100' },
}

export default function RentProjectsPage() {
  const [projects] = useState<Project[]>(mockProjects)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.tenant.toLowerCase().includes(search.toLowerCase()) ||
        p.property.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [projects, search, statusFilter])

  const stats = {
    activeCount: projects.filter(p => p.status === 'active').length,
    monthlyIncome: projects.filter(p => p.status === 'active').reduce((sum, p) => sum + p.monthlyRent, 0),
    available: projects.filter(p => p.status === 'available').length,
    ending: projects.filter(p => p.status === 'ending').length,
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
            <Home className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Rendiprojektid</h1>
            <p className="text-gray-500 text-sm">Rendipindade ja üürilepingute haldus</p>
          </div>
        </div>
        <Link href="/projects/rent/new" className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Uus rendiprojekt
        </Link>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Aktiivseid lepinguid</p>
          <p className="text-2xl font-bold text-gray-800">{stats.activeCount}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Kuine tulu</p>
          <p className="text-2xl font-bold text-green-600">€{stats.monthlyIncome.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Vabu pindu</p>
          <p className="text-2xl font-bold text-blue-600">{stats.available}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Lõppevaid lepinguid</p>
          <p className="text-2xl font-bold text-yellow-600">{stats.ending}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-4 flex gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Otsi pinda, üürnikku, objekti..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="all">Kõik staatused</option>
          <option value="available">Vaba</option>
          <option value="reserved">Broneeritud</option>
          <option value="active">Aktiivne</option>
          <option value="ending">Lõppemas</option>
          <option value="ended">Lõppenud</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3">Pind</th>
              <th className="text-left px-4 py-3">Objekt / Asukoht</th>
              <th className="text-left px-4 py-3">Üürnik</th>
              <th className="text-left px-4 py-3">Kuumakse</th>
              <th className="text-left px-4 py-3">Periood</th>
              <th className="text-left px-4 py-3">Staatus</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredProjects.map((project) => (
              <tr key={project.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <p className="font-medium">{project.name}</p>
                  <p className="text-xs text-gray-500">{project.number}</p>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{project.property}</p>
                  <p className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {project.address}
                  </p>
                </td>
                <td className="px-4 py-3">
                  <span className={project.tenant === 'Otsitakse' ? 'text-gray-400 italic' : ''}>
                    {project.tenant}
                  </span>
                </td>
                <td className="px-4 py-3 font-medium">€{project.monthlyRent.toLocaleString()}/kuu</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {project.startDate && project.endDate ? (
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {project.startDate} - {project.endDate}
                    </div>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${statusConfig[project.status].bg} ${statusConfig[project.status].color}`}>
                    {statusConfig[project.status].label}
                  </span>
                </td>
                <td className="px-4 py-3"><button className="p-1 hover:bg-gray-100 rounded"><MoreVertical className="w-4 h-4 text-gray-400" /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
