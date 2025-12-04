'use client'

/**
 * Projektid - Vahendus
 */

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Search, MoreVertical, Handshake, Calendar, User, Building2, ArrowRightLeft } from 'lucide-react'

interface Project {
  id: string
  number: string
  name: string
  buyer: string
  seller: string
  manager: string
  status: 'searching' | 'matching' | 'negotiation' | 'contract' | 'completed' | 'cancelled'
  commission: number
  estimatedValue: number
  startDate: string
}

const mockProjects: Project[] = [
  { id: '1', number: 'VAH-2024-001', name: 'Tööstushoone Tartus', buyer: 'Investor OÜ', seller: 'Kinnisvara AS', manager: 'Piret Paju', status: 'negotiation', commission: 15000, estimatedValue: 500000, startDate: '2024-01-15' },
  { id: '2', number: 'VAH-2024-002', name: 'Laoruumid Tallinnas', buyer: 'Logistika AS', seller: 'Haldur OÜ', manager: 'Piret Paju', status: 'matching', commission: 8000, estimatedValue: 280000, startDate: '2024-02-01' },
  { id: '3', number: 'VAH-2024-003', name: 'Büroohoone Pärnus', buyer: 'Otsitakse', seller: 'Arendaja AS', manager: 'Meelis Mänd', status: 'searching', commission: 25000, estimatedValue: 850000, startDate: '2024-02-20' },
  { id: '4', number: 'VAH-2024-004', name: 'Kaubanduspind', buyer: 'Retail OÜ', seller: 'Keskus AS', manager: 'Piret Paju', status: 'contract', commission: 12000, estimatedValue: 400000, startDate: '2024-01-05' },
  { id: '5', number: 'VAH-2023-089', name: 'Tootmishoone', buyer: 'Tootja AS', seller: 'Omanik OÜ', manager: 'Meelis Mänd', status: 'completed', commission: 30000, estimatedValue: 1000000, startDate: '2023-09-10' },
]

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  searching: { label: 'Otsing', color: 'text-blue-700', bg: 'bg-blue-100' },
  matching: { label: 'Sobitamine', color: 'text-purple-700', bg: 'bg-purple-100' },
  negotiation: { label: 'Läbirääkimised', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  contract: { label: 'Lepingu sõlmimine', color: 'text-orange-700', bg: 'bg-orange-100' },
  completed: { label: 'Lõpetatud', color: 'text-green-700', bg: 'bg-green-100' },
  cancelled: { label: 'Tühistatud', color: 'text-red-700', bg: 'bg-red-100' },
}

export default function VahendusProjectsPage() {
  const [projects] = useState<Project[]>(mockProjects)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = search === '' ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.buyer.toLowerCase().includes(search.toLowerCase()) ||
        p.seller.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [projects, search, statusFilter])

  const stats = {
    active: projects.filter(p => !['completed', 'cancelled'].includes(p.status)).length,
    potentialCommission: projects.filter(p => !['completed', 'cancelled'].includes(p.status)).reduce((sum, p) => sum + p.commission, 0),
    completed: projects.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.commission, 0),
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Handshake className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Vahendusprojektid</h1>
            <p className="text-gray-500 text-sm">Kinnisvara ja tehingute vahendus</p>
          </div>
        </div>
        <Link href="/projects/vahendus/new" className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Uus vahendus
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Aktiivseid projekte</p>
          <p className="text-2xl font-bold text-gray-800">{stats.active}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Potentsiaalne komisjon</p>
          <p className="text-2xl font-bold text-purple-600">€{stats.potentialCommission.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Teenitud komisjon</p>
          <p className="text-2xl font-bold text-green-600">€{stats.completed.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-4 flex gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Otsi projekti, ostjat, müüjat..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="all">Kõik staatused</option>
          <option value="searching">Otsing</option>
          <option value="matching">Sobitamine</option>
          <option value="negotiation">Läbirääkimised</option>
          <option value="contract">Lepingu sõlmimine</option>
          <option value="completed">Lõpetatud</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3">Projekt</th>
              <th className="text-left px-4 py-3">Ostja</th>
              <th className="text-left px-4 py-3">Müüja</th>
              <th className="text-left px-4 py-3">Väärtus</th>
              <th className="text-left px-4 py-3">Komisjon</th>
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
                  <div className="flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-green-500" />
                    <span className={project.buyer === 'Otsitakse' ? 'text-gray-400 italic' : ''}>{project.buyer}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-blue-500" />
                    {project.seller}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">€{project.estimatedValue.toLocaleString()}</td>
                <td className="px-4 py-3 font-medium text-purple-600">€{project.commission.toLocaleString()}</td>
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
