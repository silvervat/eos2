'use client'

import { useState, useEffect } from 'react'
import {
  Building2,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Mail,
  Phone,
  MapPin,
  Users,
  FileText,
  FolderOpen,
  TrendingUp,
  Loader2,
  ChevronRight,
} from 'lucide-react'
import { Button, Input, Card } from '@rivest/ui'
import Link from 'next/link'

interface Partner {
  id: string
  name: string
  registryCode?: string
  type: string
  email?: string
  phone?: string
  city?: string
  contactsCount: number
  stats?: {
    invoices: number
    projects: number
    quotes: number
  }
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

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [showAddModal, setShowAddModal] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    registryCode: '',
    type: 'client',
    email: '',
    phone: '',
    address: '',
    city: '',
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

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

  const handleSearch = () => {
    fetchPartners()
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
      setFormData({ name: '', registryCode: '', type: 'client', email: '', phone: '', address: '', city: '' })
      fetchPartners()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const filteredPartners = partners.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.registryCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-7 h-7" style={{ color: '#279989' }} />
            Partnerid
          </h1>
          <p className="text-slate-600 mt-1">
            Halda kliente, tarnijaid ja partnereid
          </p>
        </div>
        <Button
          className="gap-2"
          style={{ backgroundColor: '#279989' }}
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="w-4 h-4" />
          Lisa partner
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Otsi nime, registrikoodi või e-posti järgi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pl-10"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20"
          >
            <option value="">Kõik tüübid</option>
            <option value="client">Kliendid</option>
            <option value="supplier">Tarnijad</option>
            <option value="subcontractor">Alltöövõtjad</option>
            <option value="partner">Partnerid</option>
            <option value="manufacturer">Tootjad</option>
          </select>
          <Button variant="outline" onClick={handleSearch}>
            <Filter className="w-4 h-4 mr-2" />
            Otsi
          </Button>
        </div>
      </Card>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Kliendid</p>
              <p className="text-xl font-bold text-slate-900">
                {partners.filter(p => p.type === 'client').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Tarnijad</p>
              <p className="text-xl font-bold text-slate-900">
                {partners.filter(p => p.type === 'supplier').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Alltöövõtjad</p>
              <p className="text-xl font-bold text-slate-900">
                {partners.filter(p => p.type === 'subcontractor').length}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-slate-500">Kokku</p>
              <p className="text-xl font-bold text-slate-900">{partners.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      )}

      {/* Error */}
      {error && !isLoading && (
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
          <Button variant="outline" onClick={fetchPartners} className="mt-4">
            Proovi uuesti
          </Button>
        </div>
      )}

      {/* Partners List */}
      {!isLoading && !error && (
        <Card>
          <div className="divide-y divide-slate-100">
            {filteredPartners.length === 0 ? (
              <div className="text-center py-12">
                <Building2 className="w-12 h-12 mx-auto text-slate-300" />
                <h3 className="mt-4 text-lg font-medium text-slate-900">Partnereid ei leitud</h3>
                <p className="mt-2 text-slate-500">Lisa esimene partner</p>
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="mt-4 gap-2"
                  style={{ backgroundColor: '#279989' }}
                >
                  <Plus className="w-4 h-4" />
                  Lisa partner
                </Button>
              </div>
            ) : (
              filteredPartners.map((partner) => (
                <Link
                  key={partner.id}
                  href={`/partners/${partner.id}`}
                  className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="w-6 h-6 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-slate-900 truncate">{partner.name}</p>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[partner.type] || 'bg-slate-100 text-slate-700'}`}>
                        {typeLabels[partner.type] || partner.type}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                      {partner.registryCode && (
                        <span>Reg: {partner.registryCode}</span>
                      )}
                      {partner.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="w-3 h-3" />
                          {partner.email}
                        </span>
                      )}
                      {partner.city && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {partner.city}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-6 text-sm text-slate-500">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4" />
                      <span>{partner.contactsCount} kontakti</span>
                    </div>
                    {partner.stats && (
                      <>
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          <span>{partner.stats.invoices} arvet</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <FolderOpen className="w-4 h-4" />
                          <span>{partner.stats.projects} projekti</span>
                        </div>
                      </>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </Link>
              ))
            )}
          </div>
        </Card>
      )}

      {/* Add Partner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg bg-white rounded-xl shadow-xl">
            <form onSubmit={handleAddPartner}>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Lisa uus partner</h3>
                <div className="space-y-4">
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
                  <div className="grid grid-cols-2 gap-4">
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
                  <div className="grid grid-cols-2 gap-4">
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
                    'Lisa partner'
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
