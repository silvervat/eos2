'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Building,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Mail,
  Phone,
  MapPin,
  Users,
  FileText,
  FolderOpen,
  TrendingUp,
  Loader2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  X,
  Eye,
  Edit,
  Trash2,
  ExternalLink,
  Download,
  Copy,
  Check,
} from 'lucide-react'
import { Button, Input, Card } from '@rivest/ui'
import Link from 'next/link'

interface Partner {
  id: string
  name: string
  registryCode?: string
  vatNumber?: string
  type: string
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  contactsCount: number
  stats?: {
    invoices: number
    projects: number
    quotes: number
  }
  created_at?: string
}

const typeLabels: Record<string, string> = {
  client: 'Klient',
  supplier: 'Tarnija',
  subcontractor: 'Alltöövõtja',
  partner: 'Partner',
  manufacturer: 'Tootja',
}

const typeColors: Record<string, string> = {
  client: 'bg-blue-100 text-blue-700',
  supplier: 'bg-green-100 text-green-700',
  subcontractor: 'bg-orange-100 text-orange-700',
  partner: 'bg-purple-100 text-purple-700',
  manufacturer: 'bg-pink-100 text-pink-700',
}

type SortField = 'name' | 'type' | 'city' | 'contactsCount' | 'created_at'
type SortDirection = 'asc' | 'desc'

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [cityFilter, setCityFilter] = useState<string>('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [rowDensity, setRowDensity] = useState<'compact' | 'normal'>('compact')
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; partnerId: string } | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    registryCode: '',
    vatNumber: '',
    type: 'client',
    email: '',
    phone: '',
    address: '',
    city: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load row density preference
  useEffect(() => {
    const saved = localStorage.getItem('partners-row-density')
    if (saved === 'normal' || saved === 'compact') {
      setRowDensity(saved)
    }
  }, [])

  const saveRowDensity = (density: 'compact' | 'normal') => {
    setRowDensity(density)
    localStorage.setItem('partners-row-density', density)
  }

  const fetchPartners = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        includeStats: 'true',
        ...(typeFilter && { type: typeFilter }),
        ...(searchQuery && { search: searchQuery }),
      })

      const response = await fetch(`/api/partners?${params}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch partners')
      }

      setPartners(data.partners || [])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPartners()
  }, [typeFilter])

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  const handleSearch = () => {
    fetchPartners()
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create partner')
      }

      setShowAddModal(false)
      setFormData({ name: '', registryCode: '', vatNumber: '', type: 'client', email: '', phone: '', address: '', city: '' })
      fetchPartners()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const toggleSelectAll = () => {
    if (selectedRows.size === filteredAndSortedPartners.length) {
      setSelectedRows(new Set())
    } else {
      setSelectedRows(new Set(filteredAndSortedPartners.map(p => p.id)))
    }
  }

  const toggleSelectRow = (id: string) => {
    const newSelected = new Set(selectedRows)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedRows(newSelected)
  }

  const handleContextMenu = (e: React.MouseEvent, partnerId: string) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY, partnerId })
  }

  // Get unique cities for filter
  const uniqueCities = useMemo(() => {
    const cities = new Set(partners.map(p => p.city).filter(Boolean))
    return Array.from(cities).sort()
  }, [partners])

  // Filter and sort partners
  const filteredAndSortedPartners = useMemo(() => {
    let result = partners.filter(p => {
      const matchesSearch = !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.registryCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCity = !cityFilter || p.city === cityFilter
      return matchesSearch && matchesCity
    })

    result.sort((a, b) => {
      let aVal: string | number = ''
      let bVal: string | number = ''

      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase()
          bVal = b.name.toLowerCase()
          break
        case 'type':
          aVal = typeLabels[a.type] || a.type
          bVal = typeLabels[b.type] || b.type
          break
        case 'city':
          aVal = a.city?.toLowerCase() || ''
          bVal = b.city?.toLowerCase() || ''
          break
        case 'contactsCount':
          aVal = a.contactsCount
          bVal = b.contactsCount
          break
        case 'created_at':
          aVal = a.created_at || ''
          bVal = b.created_at || ''
          break
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [partners, searchQuery, cityFilter, sortField, sortDirection])

  // Stats
  const stats = useMemo(() => ({
    clients: partners.filter(p => p.type === 'client').length,
    suppliers: partners.filter(p => p.type === 'supplier').length,
    subcontractors: partners.filter(p => p.type === 'subcontractor').length,
    total: partners.length,
  }), [partners])

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-400" />
    return sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
  }

  const rowHeight = rowDensity === 'compact' ? 'h-9' : 'h-12'
  const cellPadding = rowDensity === 'compact' ? 'px-3 py-1.5' : 'px-4 py-3'
  const fontSize = rowDensity === 'compact' ? 'text-xs' : 'text-sm'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Building className="w-5 h-5" style={{ color: '#279989' }} />
            Ettevõtted
          </h1>
          <p className="text-sm text-slate-500">
            {filteredAndSortedPartners.length} ettevõtet
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Row density toggle */}
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => saveRowDensity('compact')}
              className={`px-2 py-1.5 text-xs ${rowDensity === 'compact' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
              title="Kompaktne"
            >
              ▤
            </button>
            <button
              onClick={() => saveRowDensity('normal')}
              className={`px-2 py-1.5 text-xs ${rowDensity === 'normal' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
              title="Tavaline"
            >
              ▦
            </button>
          </div>
          <Button
            size="sm"
            className="gap-1.5"
            style={{ backgroundColor: '#279989' }}
            onClick={() => setShowAddModal(true)}
          >
            <Plus className="w-4 h-4" />
            Lisa
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-lg border border-slate-200 px-3 py-2 flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-blue-100 flex items-center justify-center">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">{stats.clients}</p>
            <p className="text-xs text-slate-500">Kliendid</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 px-3 py-2 flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-green-100 flex items-center justify-center">
            <Building className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">{stats.suppliers}</p>
            <p className="text-xs text-slate-500">Tarnijad</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 px-3 py-2 flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-orange-100 flex items-center justify-center">
            <Building className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">{stats.subcontractors}</p>
            <p className="text-xs text-slate-500">Alltöövõtjad</p>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 px-3 py-2 flex items-center gap-2">
          <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-900">{stats.total}</p>
            <p className="text-xs text-slate-500">Kokku</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-3">
        <div className="flex flex-wrap gap-3">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Otsi nime, koodi või e-posti..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
            />
          </div>

          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20"
          >
            <option value="">Kõik tüübid</option>
            <option value="client">Kliendid</option>
            <option value="supplier">Tarnijad</option>
            <option value="subcontractor">Alltöövõtjad</option>
            <option value="partner">Partnerid</option>
            <option value="manufacturer">Tootjad</option>
          </select>

          {/* City filter */}
          <select
            value={cityFilter}
            onChange={(e) => setCityFilter(e.target.value)}
            className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20"
          >
            <option value="">Kõik linnad</option>
            {uniqueCities.map(city => (
              <option key={city} value={city}>{city}</option>
            ))}
          </select>

          {/* Search button */}
          <Button variant="outline" size="sm" onClick={handleSearch}>
            <Filter className="w-4 h-4 mr-1" />
            Otsi
          </Button>

          {/* Clear filters */}
          {(searchQuery || typeFilter || cityFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setTypeFilter('')
                setCityFilter('')
              }}
            >
              <X className="w-4 h-4 mr-1" />
              Tühjenda
            </Button>
          )}
        </div>
      </div>

      {/* Bulk actions */}
      {selectedRows.size > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 flex items-center gap-3">
          <span className="text-sm text-blue-700 font-medium">
            {selectedRows.size} valitud
          </span>
          <Button variant="ghost" size="sm" className="text-blue-700">
            <Mail className="w-4 h-4 mr-1" />
            Saada e-kiri
          </Button>
          <Button variant="ghost" size="sm" className="text-blue-700">
            <Download className="w-4 h-4 mr-1" />
            Ekspordi
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600"
            onClick={() => setSelectedRows(new Set())}
          >
            <X className="w-4 h-4 mr-1" />
            Tühista
          </Button>
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="text-center py-8">
          <p className="text-red-600 text-sm">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchPartners} className="mt-2">
            Proovi uuesti
          </Button>
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className={`${cellPadding} w-10`}>
                    <input
                      type="checkbox"
                      checked={selectedRows.size === filteredAndSortedPartners.length && filteredAndSortedPartners.length > 0}
                      onChange={toggleSelectAll}
                      className="w-3.5 h-3.5 rounded border-slate-300 text-[#279989] focus:ring-[#279989]"
                    />
                  </th>
                  <th
                    className={`${cellPadding} ${fontSize} font-medium text-slate-600 text-left cursor-pointer hover:bg-slate-100`}
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-1">
                      Nimi
                      <SortIcon field="name" />
                    </div>
                  </th>
                  <th
                    className={`${cellPadding} ${fontSize} font-medium text-slate-600 text-left cursor-pointer hover:bg-slate-100 w-28`}
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center gap-1">
                      Tüüp
                      <SortIcon field="type" />
                    </div>
                  </th>
                  <th className={`${cellPadding} ${fontSize} font-medium text-slate-600 text-left hidden md:table-cell`}>
                    Reg. kood
                  </th>
                  <th className={`${cellPadding} ${fontSize} font-medium text-slate-600 text-left hidden lg:table-cell`}>
                    E-post
                  </th>
                  <th className={`${cellPadding} ${fontSize} font-medium text-slate-600 text-left hidden lg:table-cell`}>
                    Telefon
                  </th>
                  <th
                    className={`${cellPadding} ${fontSize} font-medium text-slate-600 text-left cursor-pointer hover:bg-slate-100 hidden md:table-cell`}
                    onClick={() => handleSort('city')}
                  >
                    <div className="flex items-center gap-1">
                      Linn
                      <SortIcon field="city" />
                    </div>
                  </th>
                  <th
                    className={`${cellPadding} ${fontSize} font-medium text-slate-600 text-center cursor-pointer hover:bg-slate-100 w-20`}
                    onClick={() => handleSort('contactsCount')}
                  >
                    <div className="flex items-center justify-center gap-1">
                      <Users className="w-3 h-3" />
                      <SortIcon field="contactsCount" />
                    </div>
                  </th>
                  <th className={`${cellPadding} ${fontSize} font-medium text-slate-600 text-center hidden lg:table-cell w-16`}>
                    <FileText className="w-3 h-3 mx-auto" />
                  </th>
                  <th className={`${cellPadding} ${fontSize} font-medium text-slate-600 text-center hidden lg:table-cell w-16`}>
                    <FolderOpen className="w-3 h-3 mx-auto" />
                  </th>
                  <th className={`${cellPadding} w-10`}></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedPartners.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="text-center py-8">
                      <Building className="w-10 h-10 mx-auto text-slate-300" />
                      <p className="mt-2 text-sm text-slate-500">Ettevõtteid ei leitud</p>
                      <Button
                        onClick={() => setShowAddModal(true)}
                        size="sm"
                        className="mt-3 gap-1.5"
                        style={{ backgroundColor: '#279989' }}
                      >
                        <Plus className="w-4 h-4" />
                        Lisa ettevõte
                      </Button>
                    </td>
                  </tr>
                ) : (
                  filteredAndSortedPartners.map((partner) => (
                    <tr
                      key={partner.id}
                      className={`${rowHeight} hover:bg-slate-50 transition-colors cursor-pointer ${selectedRows.has(partner.id) ? 'bg-blue-50' : ''}`}
                      onClick={() => window.location.href = `/partners/${partner.id}`}
                      onContextMenu={(e) => handleContextMenu(e, partner.id)}
                    >
                      <td className={cellPadding} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedRows.has(partner.id)}
                          onChange={() => toggleSelectRow(partner.id)}
                          className="w-3.5 h-3.5 rounded border-slate-300 text-[#279989] focus:ring-[#279989]"
                        />
                      </td>
                      <td className={`${cellPadding} ${fontSize}`}>
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded bg-slate-100 flex items-center justify-center flex-shrink-0">
                            <Building className="w-3 h-3 text-slate-500" />
                          </div>
                          <span className="font-medium text-slate-900 truncate">{partner.name}</span>
                        </div>
                      </td>
                      <td className={`${cellPadding} ${fontSize}`}>
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${typeColors[partner.type] || 'bg-slate-100 text-slate-700'}`}>
                          {typeLabels[partner.type] || partner.type}
                        </span>
                      </td>
                      <td className={`${cellPadding} ${fontSize} text-slate-600 hidden md:table-cell`}>
                        {partner.registryCode || '-'}
                      </td>
                      <td className={`${cellPadding} ${fontSize} text-slate-600 hidden lg:table-cell`}>
                        {partner.email ? (
                          <a
                            href={`mailto:${partner.email}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-[#279989]"
                          >
                            {partner.email}
                          </a>
                        ) : '-'}
                      </td>
                      <td className={`${cellPadding} ${fontSize} text-slate-600 hidden lg:table-cell`}>
                        {partner.phone ? (
                          <a
                            href={`tel:${partner.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:text-[#279989]"
                          >
                            {partner.phone}
                          </a>
                        ) : '-'}
                      </td>
                      <td className={`${cellPadding} ${fontSize} text-slate-600 hidden md:table-cell`}>
                        {partner.city || '-'}
                      </td>
                      <td className={`${cellPadding} ${fontSize} text-center text-slate-600`}>
                        {partner.contactsCount}
                      </td>
                      <td className={`${cellPadding} ${fontSize} text-center text-slate-600 hidden lg:table-cell`}>
                        {partner.stats?.invoices || 0}
                      </td>
                      <td className={`${cellPadding} ${fontSize} text-center text-slate-600 hidden lg:table-cell`}>
                        {partner.stats?.projects || 0}
                      </td>
                      <td className={cellPadding} onClick={(e) => e.stopPropagation()}>
                        <button
                          className="p-1 rounded hover:bg-slate-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            setContextMenu({ x: e.clientX, y: e.clientY, partnerId: partner.id })
                          }}
                        >
                          <MoreHorizontal className="w-4 h-4 text-slate-400" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50 min-w-[160px]"
          style={{ top: contextMenu.y, left: contextMenu.x }}
          onClick={(e) => e.stopPropagation()}
        >
          <Link
            href={`/partners/${contextMenu.partnerId}`}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
          >
            <Eye className="w-4 h-4" />
            Vaata
          </Link>
          <Link
            href={`/partners/${contextMenu.partnerId}?edit=true`}
            className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100"
          >
            <Edit className="w-4 h-4" />
            Muuda
          </Link>
          <button className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100">
            <Copy className="w-4 h-4" />
            Kopeeri link
          </button>
          <hr className="my-1 border-slate-200" />
          <button className="w-full flex items-center gap-2 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50">
            <Trash2 className="w-4 h-4" />
            Kustuta
          </button>
        </div>
      )}

      {/* Add Partner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg bg-white rounded-xl shadow-xl">
            <form onSubmit={handleAddPartner}>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Lisa uus ettevõte</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Ettevõtte nimi *
                    </label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="OÜ Näidis"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Registrikood
                      </label>
                      <Input
                        value={formData.registryCode}
                        onChange={(e) => setFormData({ ...formData, registryCode: e.target.value })}
                        placeholder="12345678"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Tüüp
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20"
                      >
                        <option value="client">Klient</option>
                        <option value="supplier">Tarnija</option>
                        <option value="subcontractor">Alltöövõtja</option>
                        <option value="partner">Partner</option>
                        <option value="manufacturer">Tootja</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        E-post
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="info@ettevote.ee"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Telefon
                      </label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+372 5..."
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Aadress
                    </label>
                    <Input
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="Tänav 1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Linn
                    </label>
                    <Input
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      placeholder="Tallinn"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  Tühista
                </Button>
                <Button
                  type="submit"
                  disabled={!formData.name || isSubmitting}
                  className="flex-1 bg-[#279989] hover:bg-[#1e7a6d] text-white"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Lisan...
                    </>
                  ) : (
                    'Lisa ettevõte'
                  )}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
