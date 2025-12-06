'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Users,
  Plus,
  Search,
  Filter,
  Mail,
  Phone,
  Building,
  Loader2,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  X,
  Check,
} from 'lucide-react'
import { Button, Input, Card, Label } from '@rivest/ui'
import Link from 'next/link'

interface Company {
  id: string
  name: string
  type: string
}

interface Contact {
  id: string
  first_name: string
  last_name: string
  email?: string
  phone?: string
  mobile?: string
  position?: string
  department?: string
  is_primary: boolean
  is_billing_contact: boolean
  company: {
    id: string
    name: string
    type: string
  }
  created_at: string
}

type SortField = 'name' | 'company' | 'position' | 'email'
type SortDirection = 'asc' | 'desc'

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [rowDensity, setRowDensity] = useState<'compact' | 'normal'>('compact')

  // Add modal state
  const [showAddModal, setShowAddModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    companyId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    mobile: '',
    position: '',
    department: '',
    isPrimary: false,
    isBillingContact: false,
  })

  // Company search state
  const [companies, setCompanies] = useState<Company[]>([])
  const [companySearch, setCompanySearch] = useState('')
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('contacts-row-density')
    if (saved === 'normal' || saved === 'compact') {
      setRowDensity(saved)
    }
  }, [])

  const saveRowDensity = (density: 'compact' | 'normal') => {
    setRowDensity(density)
    localStorage.setItem('contacts-row-density', density)
  }

  useEffect(() => {
    fetchContacts()
  }, [])

  const fetchContacts = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/partners/contacts')
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch contacts')
      }

      setContacts(data.contacts || [])
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch companies for dropdown
  const fetchCompanies = useCallback(async (search: string) => {
    setIsLoadingCompanies(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      params.set('limit', '20')
      const response = await fetch(`/api/partners?${params.toString()}`)
      const data = await response.json()
      if (response.ok) {
        setCompanies(data.partners || [])
      }
    } catch (err) {
      console.error('Error fetching companies:', err)
    } finally {
      setIsLoadingCompanies(false)
    }
  }, [])

  // Debounced company search
  useEffect(() => {
    if (!showAddModal) return
    const timer = setTimeout(() => {
      fetchCompanies(companySearch)
    }, 300)
    return () => clearTimeout(timer)
  }, [companySearch, showAddModal, fetchCompanies])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.company-dropdown-container')) {
        setShowCompanyDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const selectCompany = (company: Company) => {
    setSelectedCompany(company)
    setFormData(prev => ({ ...prev, companyId: company.id }))
    setCompanySearch(company.name)
    setShowCompanyDropdown(false)
  }

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.companyId || !formData.firstName || !formData.lastName) {
      alert('Ettevõte, eesnimi ja perenimi on kohustuslikud')
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`/api/partners/${formData.companyId}/contacts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email || null,
          phone: formData.phone || null,
          mobile: formData.mobile || null,
          position: formData.position || null,
          department: formData.department || null,
          isPrimary: formData.isPrimary,
          isBillingContact: formData.isBillingContact,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Kontakti lisamine ebaõnnestus')
      }

      // Reset and close
      setShowAddModal(false)
      setFormData({
        companyId: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        mobile: '',
        position: '',
        department: '',
        isPrimary: false,
        isBillingContact: false,
      })
      setSelectedCompany(null)
      setCompanySearch('')
      fetchContacts()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const filteredAndSortedContacts = useMemo(() => {
    let result = contacts.filter(c => {
      const fullName = `${c.first_name} ${c.last_name}`.toLowerCase()
      const query = searchQuery.toLowerCase()
      return (
        fullName.includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.company.name.toLowerCase().includes(query) ||
        c.position?.toLowerCase().includes(query)
      )
    })

    result.sort((a, b) => {
      let aVal = ''
      let bVal = ''

      switch (sortField) {
        case 'name':
          aVal = `${a.first_name} ${a.last_name}`.toLowerCase()
          bVal = `${b.first_name} ${b.last_name}`.toLowerCase()
          break
        case 'company':
          aVal = a.company.name.toLowerCase()
          bVal = b.company.name.toLowerCase()
          break
        case 'position':
          aVal = a.position?.toLowerCase() || ''
          bVal = b.position?.toLowerCase() || ''
          break
        case 'email':
          aVal = a.email?.toLowerCase() || ''
          bVal = b.email?.toLowerCase() || ''
          break
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [contacts, searchQuery, sortField, sortDirection])

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="w-3 h-3 text-slate-400" />
    return sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />
  }

  const cellPadding = rowDensity === 'compact' ? 'px-3 py-1.5' : 'px-4 py-3'
  const fontSize = rowDensity === 'compact' ? 'text-xs' : 'text-sm'
  const rowHeight = rowDensity === 'compact' ? 'h-9' : 'h-12'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5" style={{ color: '#279989' }} />
            Kontaktid
          </h1>
          <p className="text-sm text-slate-500">
            {filteredAndSortedContacts.length} kontakti
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => saveRowDensity('compact')}
              className={`px-2 py-1.5 text-xs ${rowDensity === 'compact' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              ▤
            </button>
            <button
              onClick={() => saveRowDensity('normal')}
              className={`px-2 py-1.5 text-xs ${rowDensity === 'normal' ? 'bg-slate-100 text-slate-900' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              ▦
            </button>
          </div>
          <Button size="sm" className="gap-1.5" style={{ backgroundColor: '#279989' }} onClick={() => setShowAddModal(true)}>
            <Plus className="w-4 h-4" />
            Lisa
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Otsi nime, e-posti, ettevõtte või ametikoha järgi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20"
            />
          </div>
          {searchQuery && (
            <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
        </div>
      )}

      {/* Table */}
      {!isLoading && !error && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
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
                  className={`${cellPadding} ${fontSize} font-medium text-slate-600 text-left cursor-pointer hover:bg-slate-100`}
                  onClick={() => handleSort('company')}
                >
                  <div className="flex items-center gap-1">
                    Ettevõte
                    <SortIcon field="company" />
                  </div>
                </th>
                <th
                  className={`${cellPadding} ${fontSize} font-medium text-slate-600 text-left cursor-pointer hover:bg-slate-100 hidden md:table-cell`}
                  onClick={() => handleSort('position')}
                >
                  <div className="flex items-center gap-1">
                    Ametikoht
                    <SortIcon field="position" />
                  </div>
                </th>
                <th
                  className={`${cellPadding} ${fontSize} font-medium text-slate-600 text-left hidden lg:table-cell`}
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center gap-1">
                    E-post
                    <SortIcon field="email" />
                  </div>
                </th>
                <th className={`${cellPadding} ${fontSize} font-medium text-slate-600 text-left hidden lg:table-cell`}>
                  Telefon
                </th>
                <th className={`${cellPadding} ${fontSize} font-medium text-slate-600 text-center hidden md:table-cell w-20`}>
                  Roll
                </th>
                <th className={`${cellPadding} w-10`}></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAndSortedContacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8">
                    <Users className="w-10 h-10 mx-auto text-slate-300" />
                    <p className="mt-2 text-sm text-slate-500">Kontakte ei leitud</p>
                  </td>
                </tr>
              ) : (
                filteredAndSortedContacts.map((contact) => (
                  <tr key={contact.id} className={`${rowHeight} hover:bg-slate-50 transition-colors`}>
                    <td className={`${cellPadding} ${fontSize}`}>
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-xs font-medium text-slate-600">
                          {contact.first_name[0]}{contact.last_name[0]}
                        </div>
                        <span className="font-medium text-slate-900">
                          {contact.first_name} {contact.last_name}
                        </span>
                      </div>
                    </td>
                    <td className={`${cellPadding} ${fontSize}`}>
                      <Link
                        href={`/partners/${contact.company.id}`}
                        className="text-slate-700 hover:text-[#279989] flex items-center gap-1"
                      >
                        <Building className="w-3 h-3" />
                        {contact.company.name}
                      </Link>
                    </td>
                    <td className={`${cellPadding} ${fontSize} text-slate-600 hidden md:table-cell`}>
                      {contact.position || '-'}
                    </td>
                    <td className={`${cellPadding} ${fontSize} hidden lg:table-cell`}>
                      {contact.email ? (
                        <a href={`mailto:${contact.email}`} className="text-slate-600 hover:text-[#279989]">
                          {contact.email}
                        </a>
                      ) : '-'}
                    </td>
                    <td className={`${cellPadding} ${fontSize} hidden lg:table-cell`}>
                      {contact.phone || contact.mobile ? (
                        <a href={`tel:${contact.phone || contact.mobile}`} className="text-slate-600 hover:text-[#279989]">
                          {contact.phone || contact.mobile}
                        </a>
                      ) : '-'}
                    </td>
                    <td className={`${cellPadding} ${fontSize} text-center hidden md:table-cell`}>
                      <div className="flex items-center justify-center gap-1">
                        {contact.is_primary && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-blue-100 text-blue-700">Põhi</span>
                        )}
                        {contact.is_billing_contact && (
                          <span className="px-1.5 py-0.5 rounded text-xs bg-green-100 text-green-700">Arve</span>
                        )}
                      </div>
                    </td>
                    <td className={cellPadding}>
                      <button className="p-1 rounded hover:bg-slate-100">
                        <MoreHorizontal className="w-4 h-4 text-slate-400" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowAddModal(false)} />
          <Card className="relative w-full max-w-lg p-0 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50 rounded-t-xl">
              <h2 className="text-lg font-semibold text-slate-900">Lisa uus kontakt</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded hover:bg-slate-200">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <form onSubmit={handleAddContact} className="p-4 space-y-4">
              {/* Company selector */}
              <div>
                <Label htmlFor="company" className="text-sm font-medium text-slate-700">
                  Ettevõte <span className="text-red-500">*</span>
                </Label>
                <div className="relative mt-1 company-dropdown-container">
                  <div className="relative">
                    <Input
                      id="company"
                      value={companySearch}
                      onChange={(e) => {
                        setCompanySearch(e.target.value)
                        setShowCompanyDropdown(true)
                        if (selectedCompany && e.target.value !== selectedCompany.name) {
                          setSelectedCompany(null)
                          setFormData(prev => ({ ...prev, companyId: '' }))
                        }
                      }}
                      onFocus={() => setShowCompanyDropdown(true)}
                      placeholder="Otsi ettevõtet..."
                      className="pr-8"
                    />
                    {isLoadingCompanies && (
                      <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
                    )}
                    {selectedCompany && (
                      <Check className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-green-500" />
                    )}
                  </div>
                  {showCompanyDropdown && companies.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 max-h-48 overflow-y-auto">
                      {companies.map((company) => (
                        <button
                          key={company.id}
                          type="button"
                          onClick={() => selectCompany(company)}
                          className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between"
                        >
                          <span className="font-medium">{company.name}</span>
                          <span className="text-xs text-slate-500">{company.type}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Name fields */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium text-slate-700">
                    Eesnimi <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                    placeholder="Eesnimi"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium text-slate-700">
                    Perenimi <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                    placeholder="Perenimi"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Position and department */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="position" className="text-sm font-medium text-slate-700">
                    Ametikoht
                  </Label>
                  <Input
                    id="position"
                    value={formData.position}
                    onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
                    placeholder="Ametikoht"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="department" className="text-sm font-medium text-slate-700">
                    Osakond
                  </Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                    placeholder="Osakond"
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Contact info */}
              <div>
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  E-post
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@example.com"
                  className="mt-1"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                    Telefon
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+372 ..."
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="mobile" className="text-sm font-medium text-slate-700">
                    Mobiil
                  </Label>
                  <Input
                    id="mobile"
                    type="tel"
                    value={formData.mobile}
                    onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                    placeholder="+372 ..."
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Roles */}
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPrimary}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPrimary: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 text-[#279989] focus:ring-[#279989]"
                  />
                  <span className="text-sm text-slate-700">Põhikontakt</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isBillingContact}
                    onChange={(e) => setFormData(prev => ({ ...prev, isBillingContact: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 text-[#279989] focus:ring-[#279989]"
                  />
                  <span className="text-sm text-slate-700">Arvete kontakt</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-3 border-t border-slate-200">
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
                  disabled={isSubmitting || !formData.companyId || !formData.firstName || !formData.lastName}
                  className="flex-1"
                  style={{ backgroundColor: '#279989' }}
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Lisa kontakt
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  )
}
