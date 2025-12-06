'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Plus,
  Search,
  MoreVertical,
  PenTool,
  FileText,
  Download,
  Upload,
  Eye,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Folder,
  Grid,
  List,
  Filter,
} from 'lucide-react'

interface Drawing {
  id: string
  number: string
  name: string
  category: string
  revision: string
  format: string
  scale: string
  status: 'draft' | 'for_review' | 'approved' | 'superseded'
  createdAt: string
  modifiedAt: string
  modifiedBy: string
  fileSize: string
  thumbnail?: string
}

const mockDrawings: Drawing[] = [
  {
    id: '1',
    number: 'HVAC-V-001',
    name: 'Ventilatsioon - 1. korruse plaan',
    category: 'Ventilatsioon',
    revision: 'C',
    format: 'A1',
    scale: '1:50',
    status: 'approved',
    createdAt: '2024-01-15',
    modifiedAt: '2024-03-10',
    modifiedBy: 'Jaan Tamm',
    fileSize: '2.4 MB',
  },
  {
    id: '2',
    number: 'HVAC-V-002',
    name: 'Ventilatsioon - 2. korruse plaan',
    category: 'Ventilatsioon',
    revision: 'B',
    format: 'A1',
    scale: '1:50',
    status: 'approved',
    createdAt: '2024-01-15',
    modifiedAt: '2024-03-08',
    modifiedBy: 'Jaan Tamm',
    fileSize: '2.1 MB',
  },
  {
    id: '3',
    number: 'HVAC-V-010',
    name: 'Ventilatsiooni lõiked A-A, B-B',
    category: 'Ventilatsioon',
    revision: 'A',
    format: 'A2',
    scale: '1:25',
    status: 'for_review',
    createdAt: '2024-03-01',
    modifiedAt: '2024-03-14',
    modifiedBy: 'Peeter Mets',
    fileSize: '1.8 MB',
  },
  {
    id: '4',
    number: 'HVAC-K-001',
    name: 'Küttesüsteem - 1. korruse plaan',
    category: 'Küte',
    revision: 'B',
    format: 'A1',
    scale: '1:50',
    status: 'approved',
    createdAt: '2024-01-20',
    modifiedAt: '2024-02-28',
    modifiedBy: 'Peeter Mets',
    fileSize: '1.9 MB',
  },
  {
    id: '5',
    number: 'HVAC-K-002',
    name: 'Küttesüsteem - 2. korruse plaan',
    category: 'Küte',
    revision: 'A',
    format: 'A1',
    scale: '1:50',
    status: 'draft',
    createdAt: '2024-02-15',
    modifiedAt: '2024-03-12',
    modifiedBy: 'Peeter Mets',
    fileSize: '1.7 MB',
  },
  {
    id: '6',
    number: 'HVAC-J-001',
    name: 'Jahutussüsteem - plaanid',
    category: 'Jahutus',
    revision: 'A',
    format: 'A1',
    scale: '1:50',
    status: 'for_review',
    createdAt: '2024-03-05',
    modifiedAt: '2024-03-13',
    modifiedBy: 'Andres Kask',
    fileSize: '2.8 MB',
  },
  {
    id: '7',
    number: 'HVAC-A-001',
    name: 'Agregaatide ruumi plaan',
    category: 'Tehniline ruum',
    revision: 'C',
    format: 'A2',
    scale: '1:25',
    status: 'approved',
    createdAt: '2024-01-25',
    modifiedAt: '2024-03-05',
    modifiedBy: 'Jaan Tamm',
    fileSize: '1.5 MB',
  },
]

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  draft: { label: 'Mustand', color: 'text-gray-600', bg: 'bg-gray-100', icon: FileText },
  for_review: { label: 'Ülevaatamisel', color: 'text-yellow-600', bg: 'bg-yellow-100', icon: Clock },
  approved: { label: 'Kinnitatud', color: 'text-green-600', bg: 'bg-green-100', icon: CheckCircle2 },
  superseded: { label: 'Asendatud', color: 'text-red-600', bg: 'bg-red-100', icon: AlertTriangle },
}

export default function DrawingsPage() {
  const params = useParams()
  const projectId = params.id as string

  const [drawings] = useState<Drawing[]>(mockDrawings)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list')

  const categories = [...new Set(drawings.map(d => d.category))]

  const filteredDrawings = drawings.filter(drawing => {
    const matchesSearch = search === '' ||
      drawing.name.toLowerCase().includes(search.toLowerCase()) ||
      drawing.number.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || drawing.category === categoryFilter
    const matchesStatus = statusFilter === 'all' || drawing.status === statusFilter
    return matchesSearch && matchesCategory && matchesStatus
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('et-EE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  // Stats
  const totalDrawings = drawings.length
  const approvedDrawings = drawings.filter(d => d.status === 'approved').length
  const pendingReview = drawings.filter(d => d.status === 'for_review').length

  // Group by category
  const groupedDrawings = filteredDrawings.reduce((acc, drawing) => {
    if (!acc[drawing.category]) {
      acc[drawing.category] = []
    }
    acc[drawing.category].push(drawing)
    return acc
  }, {} as Record<string, Drawing[]>)

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Jooniseid kokku</p>
          <p className="text-2xl font-bold text-gray-900">{totalDrawings}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600">Kinnitatud</p>
          <p className="text-2xl font-bold text-green-700">{approvedDrawings}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-600">Ülevaatamisel</p>
          <p className="text-2xl font-bold text-yellow-700">{pendingReview}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600">Kategooriaid</p>
          <p className="text-2xl font-bold text-blue-700">{categories.length}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Otsi joonist..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="all">Kõik kategooriad</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="all">Kõik staatused</option>
          <option value="draft">Mustand</option>
          <option value="for_review">Ülevaatamisel</option>
          <option value="approved">Kinnitatud</option>
          <option value="superseded">Asendatud</option>
        </select>
        <div className="flex items-center border rounded-lg">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
          >
            <Grid className="w-4 h-4" />
          </button>
        </div>
        <button className="px-3 py-2 border rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2">
          <Upload className="w-4 h-4" />
          Laadi üles
        </button>
        <button className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Uus joonis
        </button>
      </div>

      {/* Drawings List */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {Object.entries(groupedDrawings).map(([category, categoryDrawings]) => (
            <div key={category} className="bg-white border rounded-lg overflow-hidden">
              <div className="bg-gray-50 px-5 py-3 border-b flex items-center gap-3">
                <Folder className="w-5 h-5 text-gray-500" />
                <span className="font-semibold text-gray-900">{category}</span>
                <span className="text-sm text-gray-500">({categoryDrawings.length} joonist)</span>
              </div>

              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left px-5 py-2 font-medium text-gray-600">Number</th>
                    <th className="text-left px-5 py-2 font-medium text-gray-600">Nimetus</th>
                    <th className="text-center px-5 py-2 font-medium text-gray-600">Rev</th>
                    <th className="text-center px-5 py-2 font-medium text-gray-600 hidden md:table-cell">Formaat</th>
                    <th className="text-left px-5 py-2 font-medium text-gray-600 hidden lg:table-cell">Muudetud</th>
                    <th className="text-center px-5 py-2 font-medium text-gray-600">Staatus</th>
                    <th className="w-20"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {categoryDrawings.map((drawing) => {
                    const statusInfo = statusConfig[drawing.status]
                    const StatusIcon = statusInfo.icon

                    return (
                      <tr key={drawing.id} className="hover:bg-gray-50">
                        <td className="px-5 py-3">
                          <span className="font-mono text-sm font-medium">{drawing.number}</span>
                        </td>
                        <td className="px-5 py-3">
                          <p className="font-medium text-gray-900">{drawing.name}</p>
                          <p className="text-xs text-gray-500">Mõõtkava: {drawing.scale} • {drawing.fileSize}</p>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium text-xs">
                            {drawing.revision}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-center hidden md:table-cell text-gray-600">
                          {drawing.format}
                        </td>
                        <td className="px-5 py-3 hidden lg:table-cell">
                          <p className="text-gray-900">{formatDate(drawing.modifiedAt)}</p>
                          <p className="text-xs text-gray-500">{drawing.modifiedBy}</p>
                        </td>
                        <td className="px-5 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs font-medium inline-flex items-center gap-1 ${statusInfo.bg} ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1">
                            <button className="p-1.5 hover:bg-gray-100 rounded" title="Vaata">
                              <Eye className="w-4 h-4 text-gray-400" />
                            </button>
                            <button className="p-1.5 hover:bg-gray-100 rounded" title="Laadi alla">
                              <Download className="w-4 h-4 text-gray-400" />
                            </button>
                            <button className="p-1.5 hover:bg-gray-100 rounded">
                              <MoreVertical className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredDrawings.map((drawing) => {
            const statusInfo = statusConfig[drawing.status]

            return (
              <div key={drawing.id} className="bg-white border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                {/* Thumbnail placeholder */}
                <div className="aspect-[4/3] bg-gray-100 flex items-center justify-center">
                  <PenTool className="w-12 h-12 text-gray-300" />
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-xs font-medium text-gray-600">{drawing.number}</span>
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                      {drawing.revision}
                    </span>
                  </div>
                  <p className="font-medium text-sm text-gray-900 truncate">{drawing.name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`px-1.5 py-0.5 rounded text-xs ${statusInfo.bg} ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    <div className="flex items-center gap-1">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Eye className="w-3 h-3 text-gray-400" />
                      </button>
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <Download className="w-3 h-3 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {filteredDrawings.length === 0 && (
        <div className="text-center py-12 bg-white border rounded-lg text-gray-500">
          <PenTool className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p>Jooniseid ei leitud</p>
        </div>
      )}
    </div>
  )
}
