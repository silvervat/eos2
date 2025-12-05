'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
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
  AlertCircle,
  CheckCircle,
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

interface RegistryResult {
  companyId?: number
  name: string
  registryCode: string
  historicalNames?: string[]
  status?: string
  legalAddress?: string
  zipCode?: string
  url?: string
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

type SortField = 'name' | 'type' | 'vatNumber' | 'contactsCount' | 'created_at'
type SortDirection = 'asc' | 'desc'

// Validation helpers
const validateEmail = (email: string): boolean => {
  if (!email) return true // Empty is allowed
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validatePhone = (phone: string): boolean => {
  if (!phone) return true // Empty is allowed
  // Estonian phone format: +372 followed by 7-8 digits, or just 7-8 digits
  const phoneRegex = /^(\+372\s?)?\d{7,8}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}

const formatPhone = (phone: string): string => {
  if (!phone) return ''
  const cleaned = phone.replace(/\s/g, '')
  if (cleaned.startsWith('+372')) {
    return `+372 ${cleaned.slice(4)}`
  }
  if (cleaned.length === 7 || cleaned.length === 8) {
    return `+372 ${cleaned}`
  }
  return phone
}

export default function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set())
  const [rowDensity, setRowDensity] = useState<'compact' | 'normal'>('compact')
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; partnerId: string } | null>(null)

  // Inline editing state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Partner>>({})
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newRowData, setNewRowData] = useState({
    name: '',
    registryCode: '',
    vatNumber: '',
    type: 'client',
    email: '',
    phone: '',
    address: '',
  })
  const [isSaving, setIsSaving] = useState(false)

  // Registry search state
  const [registryResults, setRegistryResults] = useState<RegistryResult[]>([])
  const [showRegistryDropdown, setShowRegistryDropdown] = useState(false)
  const [isSearchingRegistry, setIsSearchingRegistry] = useState(false)
  const registrySearchRef = useRef<HTMLDivElement>(null)

  // Address autocomplete state
  const [addressResults, setAddressResults] = useState<{ address: string }[]>([])
  const [showAddressDropdown, setShowAddressDropdown] = useState(false)
  const [isSearchingAddress, setIsSearchingAddress] = useState(false)
  const addressSearchRef = useRef<HTMLDivElement>(null)

  // VAT validation state
  const [vatValidation, setVatValidation] = useState<{ valid: boolean; name?: string; address?: string } | null>(null)
  const [isValidatingVat, setIsValidatingVat] = useState(false)

  // E-invoice check state
  const [eInvoiceInfo, setEInvoiceInfo] = useState<{ capable: boolean; operator?: string } | null>(null)
  const [isCheckingEInvoice, setIsCheckingEInvoice] = useState(false)

  // Form state (for modal)
  const [formData, setFormData] = useState({
    name: '',
    registryCode: '',
    vatNumber: '',
    type: 'client',
    email: '',
    phone: '',
    address: '',
    zipCode: '',
    country: 'Eesti',
    registryUrl: '',
    eInvoiceCapable: false,
    eInvoiceOperator: '',
  })
  const [formErrors, setFormErrors] = useState<{ email?: string; phone?: string }>({})
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

  // Close registry dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (registrySearchRef.current && !registrySearchRef.current.contains(e.target as Node)) {
        setShowRegistryDropdown(false)
      }
      if (addressSearchRef.current && !addressSearchRef.current.contains(e.target as Node)) {
        setShowAddressDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Search Estonian Business Registry
  const searchRegistry = useCallback(async (query: string) => {
    if (query.length < 2) {
      setRegistryResults([])
      return
    }

    setIsSearchingRegistry(true)
    try {
      const response = await fetch(`/api/registry/search?q=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (response.ok && data.results) {
        setRegistryResults(data.results)
        setShowRegistryDropdown(true)
      }
    } catch (err) {
      console.error('Registry search error:', err)
    } finally {
      setIsSearchingRegistry(false)
    }
  }, [])

  // Debounced registry search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.name.length >= 2 && showAddModal) {
        searchRegistry(formData.name)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [formData.name, showAddModal, searchRegistry])

  // Search Estonian addresses (Maa-amet)
  const searchAddress = useCallback(async (query: string) => {
    if (query.length < 2) {
      setAddressResults([])
      return
    }

    setIsSearchingAddress(true)
    try {
      const response = await fetch(`/api/registry/address?q=${encodeURIComponent(query)}`)
      const data = await response.json()

      if (response.ok && data.results) {
        setAddressResults(data.results)
        setShowAddressDropdown(true)
      }
    } catch (err) {
      console.error('Address search error:', err)
    } finally {
      setIsSearchingAddress(false)
    }
  }, [])

  // Debounced address search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.address.length >= 2 && showAddModal) {
        searchAddress(formData.address)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [formData.address, showAddModal, searchAddress])

  // Validate VAT number
  const validateVatNumber = async (vatNumber: string) => {
    if (!vatNumber || vatNumber.length < 8) {
      setVatValidation(null)
      return
    }

    setIsValidatingVat(true)
    try {
      const response = await fetch(`/api/registry/vat?country=EE&number=${encodeURIComponent(vatNumber)}`)
      const data = await response.json()

      setVatValidation({
        valid: data.valid || false,
        name: data.name,
        address: data.address,
      })

      // If valid and we got company info, fill in the form
      if (data.valid && data.name && !formData.name) {
        setFormData(prev => ({
          ...prev,
          name: data.name,
          address: data.address || prev.address,
        }))
      }
    } catch (err) {
      console.error('VAT validation error:', err)
      setVatValidation({ valid: false })
    } finally {
      setIsValidatingVat(false)
    }
  }

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

  const selectRegistryResult = async (result: RegistryResult) => {
    // Fill in all available fields from registry
    setFormData(prev => ({
      ...prev,
      name: result.name,
      registryCode: result.registryCode,
      address: result.legalAddress || prev.address,
      zipCode: result.zipCode || prev.zipCode,
      registryUrl: result.url || '',
    }))
    setShowRegistryDropdown(false)
    setRegistryResults([])

    // Check e-invoice capability
    if (result.registryCode) {
      setIsCheckingEInvoice(true)
      try {
        const response = await fetch(`/api/registry/einvoice?code=${result.registryCode}`)
        const data = await response.json()
        if (response.ok) {
          setEInvoiceInfo({
            capable: data.eInvoiceCapable || false,
            operator: data.operators?.[0]?.name || undefined,
          })
          setFormData(prev => ({
            ...prev,
            eInvoiceCapable: data.eInvoiceCapable || false,
            eInvoiceOperator: data.operators?.[0]?.name || '',
          }))
        }
      } catch (err) {
        console.error('E-invoice check error:', err)
      } finally {
        setIsCheckingEInvoice(false)
      }
    }
  }

  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate
    const errors: { email?: string; phone?: string } = {}
    if (!validateEmail(formData.email)) {
      errors.email = 'Vigane e-posti formaat'
    }
    if (!validatePhone(formData.phone)) {
      errors.phone = 'Vigane telefoni formaat (nt +372 5123456)'
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      return
    }

    setIsSubmitting(true)
    setFormErrors({})

    try {
      const response = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          phone: formatPhone(formData.phone),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create partner')
      }

      setShowAddModal(false)
      setFormData({ name: '', registryCode: '', vatNumber: '', type: 'client', email: '', phone: '', address: '', zipCode: '', country: 'Eesti', registryUrl: '', eInvoiceCapable: false, eInvoiceOperator: '' })
      setVatValidation(null)
      setEInvoiceInfo(null)
      fetchPartners()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Inline editing functions
  const startEditing = (partner: Partner) => {
    setEditingId(partner.id)
    setEditData({
      name: partner.name,
      registryCode: partner.registryCode,
      vatNumber: partner.vatNumber,
      type: partner.type,
      email: partner.email,
      phone: partner.phone,
      address: partner.address,
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditData({})
  }

  const saveEditing = async () => {
    if (!editingId) return

    // Validate
    if (editData.email && !validateEmail(editData.email)) {
      alert('Vigane e-posti formaat')
      return
    }
    if (editData.phone && !validatePhone(editData.phone)) {
      alert('Vigane telefoni formaat')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch(`/api/partners/${editingId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...editData,
          phone: editData.phone ? formatPhone(editData.phone) : undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to update partner')
      }

      setEditingId(null)
      setEditData({})
      fetchPartners()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  const saveNewRow = async () => {
    if (!newRowData.name.trim()) return

    // Validate
    if (newRowData.email && !validateEmail(newRowData.email)) {
      alert('Vigane e-posti formaat')
      return
    }
    if (newRowData.phone && !validatePhone(newRowData.phone)) {
      alert('Vigane telefoni formaat')
      return
    }

    setIsSaving(true)

    try {
      const response = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRowData,
          phone: newRowData.phone ? formatPhone(newRowData.phone) : undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create partner')
      }

      setIsAddingNew(false)
      setNewRowData({ name: '', registryCode: '', vatNumber: '', type: 'client', email: '', phone: '', address: '' })
      fetchPartners()
    } catch (err) {
      alert((err as Error).message)
    } finally {
      setIsSaving(false)
    }
  }

  const cancelNewRow = () => {
    setIsAddingNew(false)
    setNewRowData({ name: '', registryCode: '', vatNumber: '', type: 'client', email: '', phone: '', address: '' })
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

  // Filter and sort partners (removed city filter)
  const filteredAndSortedPartners = useMemo(() => {
    let result = partners.filter(p => {
      const matchesSearch = !searchQuery ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.registryCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.vatNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.email?.toLowerCase().includes(searchQuery.toLowerCase())
      return matchesSearch
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
        case 'vatNumber':
          aVal = a.vatNumber?.toLowerCase() || ''
          bVal = b.vatNumber?.toLowerCase() || ''
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
  }, [partners, searchQuery, sortField, sortDirection])

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
              placeholder="Otsi nime, koodi, KMKR või e-posti..."
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

          {/* Search button */}
          <Button variant="outline" size="sm" onClick={handleSearch}>
            <Filter className="w-4 h-4 mr-1" />
            Otsi
          </Button>

          {/* Clear filters */}
          {(searchQuery || typeFilter) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setTypeFilter('')
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
                  <th
                    className={`${cellPadding} ${fontSize} font-medium text-slate-600 text-left hidden md:table-cell cursor-pointer hover:bg-slate-100`}
                    onClick={() => handleSort('vatNumber')}
                  >
                    <div className="flex items-center gap-1">
                      KMKR
                      <SortIcon field="vatNumber" />
                    </div>
                  </th>
                  <th className={`${cellPadding} ${fontSize} font-medium text-slate-600 text-left hidden lg:table-cell`}>
                    E-post
                  </th>
                  <th className={`${cellPadding} ${fontSize} font-medium text-slate-600 text-left hidden lg:table-cell`}>
                    Telefon
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
                {filteredAndSortedPartners.length === 0 && !isAddingNew ? (
                  <tr>
                    <td colSpan={11} className="text-center py-8">
                      <Building className="w-10 h-10 mx-auto text-slate-300" />
                      <p className="mt-2 text-sm text-slate-500">Ettevõtteid ei leitud</p>
                      <Button
                        onClick={() => setIsAddingNew(true)}
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
                  <>
                    {filteredAndSortedPartners.map((partner) => (
                      editingId === partner.id ? (
                        // Editing row
                        <tr key={partner.id} className={`${rowHeight} bg-blue-50`}>
                          <td className={cellPadding}>
                            <input
                              type="checkbox"
                              disabled
                              className="w-3.5 h-3.5 rounded border-slate-300"
                            />
                          </td>
                          <td className={`${cellPadding} ${fontSize}`}>
                            <input
                              type="text"
                              value={editData.name || ''}
                              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#279989]"
                              placeholder="Nimi"
                              autoFocus
                            />
                          </td>
                          <td className={`${cellPadding} ${fontSize}`}>
                            <select
                              value={editData.type || 'client'}
                              onChange={(e) => setEditData({ ...editData, type: e.target.value })}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#279989]"
                            >
                              <option value="client">Klient</option>
                              <option value="supplier">Tarnija</option>
                              <option value="subcontractor">Alltöövõtja</option>
                              <option value="partner">Partner</option>
                              <option value="manufacturer">Tootja</option>
                            </select>
                          </td>
                          <td className={`${cellPadding} ${fontSize} hidden md:table-cell`}>
                            <input
                              type="text"
                              value={editData.registryCode || ''}
                              onChange={(e) => setEditData({ ...editData, registryCode: e.target.value })}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#279989]"
                              placeholder="Reg. kood"
                            />
                          </td>
                          <td className={`${cellPadding} ${fontSize} hidden md:table-cell`}>
                            <input
                              type="text"
                              value={editData.vatNumber || ''}
                              onChange={(e) => setEditData({ ...editData, vatNumber: e.target.value })}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#279989]"
                              placeholder="KMKR"
                            />
                          </td>
                          <td className={`${cellPadding} ${fontSize} hidden lg:table-cell`}>
                            <input
                              type="email"
                              value={editData.email || ''}
                              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#279989]"
                              placeholder="E-post"
                            />
                          </td>
                          <td className={`${cellPadding} ${fontSize} hidden lg:table-cell`}>
                            <input
                              type="text"
                              value={editData.phone || ''}
                              onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                              className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#279989]"
                              placeholder="+372 5..."
                            />
                          </td>
                          <td className={`${cellPadding} ${fontSize} text-center text-slate-400`}>
                            {partner.contactsCount}
                          </td>
                          <td className={`${cellPadding} ${fontSize} text-center text-slate-400 hidden lg:table-cell`}>
                            {partner.stats?.invoices || 0}
                          </td>
                          <td className={`${cellPadding} ${fontSize} text-center text-slate-400 hidden lg:table-cell`}>
                            {partner.stats?.projects || 0}
                          </td>
                          <td className={cellPadding}>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={saveEditing}
                                disabled={isSaving}
                                className="p-1 rounded bg-[#279989] text-white hover:bg-[#1e7a6d]"
                              >
                                {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                              </button>
                              <button
                                onClick={cancelEditing}
                                className="p-1 rounded bg-slate-200 text-slate-600 hover:bg-slate-300"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        // Normal row
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
                          <td className={`${cellPadding} ${fontSize} text-slate-600 hidden md:table-cell`}>
                            {partner.vatNumber ? (
                              <span className="font-mono text-xs">{partner.vatNumber}</span>
                            ) : '-'}
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
                            <div className="flex items-center gap-1">
                              <button
                                className="p-1 rounded hover:bg-slate-100"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  startEditing(partner)
                                }}
                              >
                                <Edit className="w-3 h-3 text-slate-400" />
                              </button>
                              <button
                                className="p-1 rounded hover:bg-slate-100"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setContextMenu({ x: e.clientX, y: e.clientY, partnerId: partner.id })
                                }}
                              >
                                <MoreHorizontal className="w-4 h-4 text-slate-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    ))}

                    {/* Add new row */}
                    {isAddingNew ? (
                      <tr className={`${rowHeight} bg-green-50`}>
                        <td className={cellPadding}>
                          <Plus className="w-3.5 h-3.5 text-green-600" />
                        </td>
                        <td className={`${cellPadding} ${fontSize}`}>
                          <input
                            type="text"
                            value={newRowData.name}
                            onChange={(e) => setNewRowData({ ...newRowData, name: e.target.value })}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#279989]"
                            placeholder="Ettevõtte nimi *"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveNewRow()
                              if (e.key === 'Escape') cancelNewRow()
                            }}
                          />
                        </td>
                        <td className={`${cellPadding} ${fontSize}`}>
                          <select
                            value={newRowData.type}
                            onChange={(e) => setNewRowData({ ...newRowData, type: e.target.value })}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#279989]"
                          >
                            <option value="client">Klient</option>
                            <option value="supplier">Tarnija</option>
                            <option value="subcontractor">Alltöövõtja</option>
                            <option value="partner">Partner</option>
                            <option value="manufacturer">Tootja</option>
                          </select>
                        </td>
                        <td className={`${cellPadding} ${fontSize} hidden md:table-cell`}>
                          <input
                            type="text"
                            value={newRowData.registryCode}
                            onChange={(e) => setNewRowData({ ...newRowData, registryCode: e.target.value })}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#279989]"
                            placeholder="Reg. kood"
                          />
                        </td>
                        <td className={`${cellPadding} ${fontSize} hidden md:table-cell`}>
                          <input
                            type="text"
                            value={newRowData.vatNumber}
                            onChange={(e) => setNewRowData({ ...newRowData, vatNumber: e.target.value })}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#279989]"
                            placeholder="KMKR"
                          />
                        </td>
                        <td className={`${cellPadding} ${fontSize} hidden lg:table-cell`}>
                          <input
                            type="email"
                            value={newRowData.email}
                            onChange={(e) => setNewRowData({ ...newRowData, email: e.target.value })}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#279989]"
                            placeholder="E-post"
                          />
                        </td>
                        <td className={`${cellPadding} ${fontSize} hidden lg:table-cell`}>
                          <input
                            type="text"
                            value={newRowData.phone}
                            onChange={(e) => setNewRowData({ ...newRowData, phone: e.target.value })}
                            className="w-full px-2 py-1 border border-slate-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#279989]"
                            placeholder="+372 5..."
                          />
                        </td>
                        <td className={`${cellPadding} ${fontSize} text-center text-slate-400`}>-</td>
                        <td className={`${cellPadding} ${fontSize} text-center text-slate-400 hidden lg:table-cell`}>-</td>
                        <td className={`${cellPadding} ${fontSize} text-center text-slate-400 hidden lg:table-cell`}>-</td>
                        <td className={cellPadding}>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={saveNewRow}
                              disabled={isSaving || !newRowData.name.trim()}
                              className="p-1 rounded bg-[#279989] text-white hover:bg-[#1e7a6d] disabled:opacity-50"
                            >
                              {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                            </button>
                            <button
                              onClick={cancelNewRow}
                              className="p-1 rounded bg-slate-200 text-slate-600 hover:bg-slate-300"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      <tr
                        className={`${rowHeight} hover:bg-slate-50 transition-colors cursor-pointer border-t border-dashed border-slate-200`}
                        onClick={() => setIsAddingNew(true)}
                      >
                        <td colSpan={11} className={`${cellPadding} text-center`}>
                          <div className="flex items-center justify-center gap-2 text-slate-400 hover:text-[#279989]">
                            <Plus className="w-4 h-4" />
                            <span className={`${fontSize}`}>Lisa uus ettevõte</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
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

      {/* Add Partner Modal - Updated with registry search */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-lg bg-white rounded-xl shadow-xl">
            <form onSubmit={handleAddPartner}>
              <div className="p-5">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Lisa uus ettevõte</h3>
                <div className="space-y-3">
                  {/* Company name with registry search */}
                  <div ref={registrySearchRef} className="relative">
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Ettevõtte nimi *
                    </label>
                    <div className="relative">
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Alusta nime sisestamist..."
                        required
                      />
                      {isSearchingRegistry && (
                        <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
                      )}
                    </div>
                    {/* Registry search dropdown */}
                    {showRegistryDropdown && registryResults.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 max-h-48 overflow-y-auto">
                        <div className="px-3 py-1.5 text-xs text-slate-500 bg-slate-50 border-b">
                          Äriregistri tulemused
                        </div>
                        {registryResults.map((result, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => selectRegistryResult(result)}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center justify-between"
                          >
                            <span className="font-medium">{result.name}</span>
                            <span className="text-xs text-slate-500 font-mono">{result.registryCode}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Registrikood
                      </label>
                      <div className="flex gap-2">
                        <Input
                          value={formData.registryCode}
                          onChange={(e) => setFormData({ ...formData, registryCode: e.target.value })}
                          placeholder="12345678"
                          className="flex-1"
                        />
                        {formData.registryUrl && (
                          <a
                            href={formData.registryUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-2 border border-slate-300 rounded-lg text-slate-500 hover:bg-slate-50 hover:text-[#279989]"
                            title="Ava e-Äriregistris"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </div>
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

                  {/* E-invoice indicator */}
                  {(isCheckingEInvoice || eInvoiceInfo) && (
                    <div className={`p-2 rounded-lg text-sm flex items-center gap-2 ${eInvoiceInfo?.capable ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-600'}`}>
                      {isCheckingEInvoice ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Kontrollin e-arve võimekust...</span>
                        </>
                      ) : eInvoiceInfo?.capable ? (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>E-arve vastuvõtja{eInvoiceInfo.operator && ` (${eInvoiceInfo.operator})`}</span>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-4 h-4" />
                          <span>E-arvet ei saa saata</span>
                        </>
                      )}
                    </div>
                  )}

                  {/* KMKR with validation */}
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      KMKR number (käibemaksukohustuslase number)
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          value={formData.vatNumber}
                          onChange={(e) => {
                            setFormData({ ...formData, vatNumber: e.target.value })
                            setVatValidation(null)
                          }}
                          placeholder="EE123456789"
                          className={vatValidation ? (vatValidation.valid ? 'border-green-500' : 'border-red-500') : ''}
                        />
                        {vatValidation && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            {vatValidation.valid ? (
                              <CheckCircle className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => validateVatNumber(formData.vatNumber)}
                        disabled={isValidatingVat || !formData.vatNumber}
                      >
                        {isValidatingVat ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Kontrolli'
                        )}
                      </Button>
                    </div>
                    {vatValidation && (
                      <p className={`text-xs mt-1 ${vatValidation.valid ? 'text-green-600' : 'text-red-600'}`}>
                        {vatValidation.valid ? (
                          <>Kehtiv KMKR number{vatValidation.name && ` - ${vatValidation.name}`}</>
                        ) : (
                          'Kehtetu KMKR number'
                        )}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        E-post
                      </label>
                      <Input
                        type="email"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value })
                          setFormErrors({ ...formErrors, email: undefined })
                        }}
                        placeholder="info@ettevote.ee"
                        className={formErrors.email ? 'border-red-500' : ''}
                      />
                      {formErrors.email && (
                        <p className="text-xs text-red-600 mt-1">{formErrors.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Telefon
                      </label>
                      <Input
                        value={formData.phone}
                        onChange={(e) => {
                          setFormData({ ...formData, phone: e.target.value })
                          setFormErrors({ ...formErrors, phone: undefined })
                        }}
                        placeholder="+372 5123456"
                        className={formErrors.phone ? 'border-red-500' : ''}
                      />
                      {formErrors.phone && (
                        <p className="text-xs text-red-600 mt-1">{formErrors.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div ref={addressSearchRef} className="col-span-2 relative">
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Aadress
                      </label>
                      <div className="relative">
                        <Input
                          value={formData.address}
                          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                          placeholder="Alusta aadressi sisestamist..."
                        />
                        {isSearchingAddress && (
                          <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
                        )}
                      </div>
                      {/* Address autocomplete dropdown */}
                      {showAddressDropdown && addressResults.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 max-h-48 overflow-y-auto">
                          <div className="px-3 py-1.5 text-xs text-slate-500 bg-slate-50 border-b">
                            Aadressid (Maa-amet)
                          </div>
                          {addressResults.map((result, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => {
                                setFormData(prev => ({ ...prev, address: result.address }))
                                setShowAddressDropdown(false)
                                setAddressResults([])
                              }}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 truncate"
                            >
                              {result.address}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Riik
                      </label>
                      <Input
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        placeholder="Eesti"
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowAddModal(false)
                    setVatValidation(null)
                    setEInvoiceInfo(null)
                    setFormErrors({})
                  }}
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
