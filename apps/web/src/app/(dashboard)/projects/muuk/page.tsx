'use client'

/**
 * Projektid - Müük
 */

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Search, MoreVertical, ShoppingCart, Calendar, User, Euro } from 'lucide-react'

interface Project {
  id: string
  number: string
  name: string
  client: string
  contactPerson: string
  manager: string
  status: 'lead' | 'proposal' | 'negotiation' | 'won' | 'lost'
  value: number
  probability: number
  expectedClose: string
}

const mockProjects: Project[] = [
  { id: '1', number: 'MUU-2024-001', name: 'Tööstusseadmed', client: 'Tehas AS', contactPerson: 'Mart Mets', manager: 'Kati Kask', status: 'negotiation', value: 85000, probability: 75, expectedClose: '2024-03-15' },
  { id: '2', number: 'MUU-2024-002', name: 'Kontorimööbel', client: 'IT Firma OÜ', contactPerson: 'Liis Lepp', manager: 'Kati Kask', status: 'proposal', value: 15000, probability: 50, expectedClose: '2024-02-28' },
  { id: '3', number: 'MUU-2024-003', name: 'Laoseadmed', client: 'Logistika AS', contactPerson: 'Peeter Pärn', manager: 'Anna Saar', status: 'lead', value: 45000, probability: 25, expectedClose: '2024-04-30' },
  { id: '4', number: 'MUU-2024-004', name: 'Tootmisliin', client: 'Tootja OÜ', contactPerson: 'Jaan Tamm', manager: 'Kati Kask', status: 'won', value: 120000, probability: 100, expectedClose: '2024-01-20' },
  { id: '5', number: 'MUU-2024-005', name: 'Valgustus', client: 'Kaubandus AS', contactPerson: 'Mari Mets', manager: 'Anna Saar', status: 'lost', value: 8000, probability: 0, expectedClose: '2024-02-10' },
]

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  lead: { label: 'Lead', color: 'text-blue-700', bg: 'bg-blue-100' },
  proposal: { label: 'Pakkumine', color: 'text-purple-700', bg: 'bg-purple-100' },
  negotiation: { label: 'Läbirääkimised', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  won: { label: 'Võidetud', color: 'text-green-700', bg: 'bg-green-100' },
  lost: { label: 'Kaotatud', color: 'text-red-700', bg: 'bg-red-100' },
}

export default function MuukProjectsPage() {
  const [projects] = useState<Project[]>(mockProjects)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchesSearch = search === '' || p.name.toLowerCase().includes(search.toLowerCase()) || p.client.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [projects, search, statusFilter])

  const pipeline = {
    total: projects.filter(p => !['won', 'lost'].includes(p.status)).reduce((sum, p) => sum + p.value * (p.probability / 100), 0),
    won: projects.filter(p => p.status === 'won').reduce((sum, p) => sum + p.value, 0),
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
            <ShoppingCart className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Müügiprojektid</h1>
            <p className="text-gray-500 text-sm">Müügitoru ja tehingud</p>
          </div>
        </div>
        <Link href="/projects/muuk/new" className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Uus müügiprojekt
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Pipeline väärtus</p>
          <p className="text-2xl font-bold text-gray-800">€{pipeline.total.toLocaleString()}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Võidetud tehingud</p>
          <p className="text-2xl font-bold text-green-600">€{pipeline.won.toLocaleString()}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border p-4 flex gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" placeholder="Otsi..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 border rounded-lg text-sm">
          <option value="all">Kõik staatused</option>
          <option value="lead">Lead</option>
          <option value="proposal">Pakkumine</option>
          <option value="negotiation">Läbirääkimised</option>
          <option value="won">Võidetud</option>
          <option value="lost">Kaotatud</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3">Projekt</th>
              <th className="text-left px-4 py-3">Klient</th>
              <th className="text-left px-4 py-3">Vastutaja</th>
              <th className="text-left px-4 py-3">Väärtus</th>
              <th className="text-left px-4 py-3">Tõenäosus</th>
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
                  <p>{project.client}</p>
                  <p className="text-xs text-gray-500">{project.contactPerson}</p>
                </td>
                <td className="px-4 py-3"><User className="w-3 h-3 inline mr-1" />{project.manager}</td>
                <td className="px-4 py-3 font-medium">€{project.value.toLocaleString()}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-gray-200 rounded-full">
                      <div className={`h-2 rounded-full ${project.probability >= 50 ? 'bg-green-500' : 'bg-yellow-500'}`} style={{ width: `${project.probability}%` }} />
                    </div>
                    <span className="text-xs">{project.probability}%</span>
                  </div>
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
