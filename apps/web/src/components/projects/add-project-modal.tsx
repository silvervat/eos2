'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button, Card, Input, Label } from '@rivest/ui'
import {
  X,
  Plus,
  Loader2,
  MapPin,
  Building2,
  User,
  ChevronDown,
  Image as ImageIcon,
  Map,
} from 'lucide-react'
import {
  useCreateProject,
  type ProjectInput,
  type ProjectType,
  PROJECT_TYPES,
  PROJECT_STATUSES,
} from '@/hooks/use-projects'

interface AddProjectModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultType?: ProjectType
}

interface Company {
  id: string
  name: string
}

interface Contact {
  id: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
}

const typeOptions = Object.entries(PROJECT_TYPES).map(([value, label]) => ({ value, label }))
const statusOptions = Object.entries(PROJECT_STATUSES).map(([value, { label }]) => ({
  value,
  label,
}))

export function AddProjectModal({ open, onOpenChange, defaultType }: AddProjectModalProps) {
  const [formData, setFormData] = useState<ProjectInput>({
    code: '',
    name: '',
    description: '',
    type: defaultType || 'ptv',
    status: 'starting',
    currency: 'EUR',
    startDate: '',
    endDate: '',
    address: '',
    country: 'Eesti',
    latitude: undefined,
    longitude: undefined,
    clientId: undefined,
    contactId: undefined,
    thumbnailUrl: undefined,
  })
  const [error, setError] = useState('')

  // Company/Contact selection state
  const [companies, setCompanies] = useState<Company[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [companySearch, setCompanySearch] = useState('')
  const [contactSearch, setContactSearch] = useState('')
  const [showCompanyDropdown, setShowCompanyDropdown] = useState(false)
  const [showContactDropdown, setShowContactDropdown] = useState(false)
  const [loadingCompanies, setLoadingCompanies] = useState(false)
  const [loadingContacts, setLoadingContacts] = useState(false)

  // Image upload state
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Map state
  const [showMapPicker, setShowMapPicker] = useState(false)
  const [geocoding, setGeocoding] = useState(false)

  // Address autocomplete state
  const [addressResults, setAddressResults] = useState<{ address: string; lat?: number; lon?: number }[]>([])
  const [showAddressDropdown, setShowAddressDropdown] = useState(false)
  const [isSearchingAddress, setIsSearchingAddress] = useState(false)
  const addressInputRef = useRef<HTMLDivElement>(null)

  const createProject = useCreateProject()

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      setShowCompanyDropdown(false)
      setShowContactDropdown(false)
      if (addressInputRef.current && !addressInputRef.current.contains(e.target as Node)) {
        setShowAddressDropdown(false)
      }
    }
    if (showCompanyDropdown || showContactDropdown || showAddressDropdown) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [showCompanyDropdown, showContactDropdown, showAddressDropdown])

  // Debounced address search (Nominatim - global)
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.address && formData.address.length >= 3) {
        setIsSearchingAddress(true)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.address)}&limit=8&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'EOS2-ERP/1.0',
              },
            }
          )
          if (response.ok) {
            const data = await response.json()
            setAddressResults(
              data.map((item: { display_name: string; lat: string; lon: string }) => ({
                address: item.display_name,
                lat: parseFloat(item.lat),
                lon: parseFloat(item.lon),
              }))
            )
            setShowAddressDropdown(true)
          }
        } catch (err) {
          console.error('Address search error:', err)
        } finally {
          setIsSearchingAddress(false)
        }
      } else {
        setAddressResults([])
        setShowAddressDropdown(false)
      }
    }, 400) // Slightly longer delay for external API
    return () => clearTimeout(timer)
  }, [formData.address])

  // Fetch companies - Fixed to use 'partners' from response
  const fetchCompanies = useCallback(async (search: string) => {
    setLoadingCompanies(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      params.set('limit', '20')

      const response = await fetch(`/api/partners?${params}`)
      if (response.ok) {
        const data = await response.json()
        // Partners API returns 'partners' not 'data'
        setCompanies(data.partners || [])
      }
    } catch (err) {
      console.error('Error fetching companies:', err)
    } finally {
      setLoadingCompanies(false)
    }
  }, [])

  // Fetch contacts for selected company
  const fetchContacts = useCallback(async (companyId: string, search: string) => {
    if (!companyId) {
      setContacts([])
      return
    }
    setLoadingContacts(true)
    try {
      const response = await fetch(`/api/partners/${companyId}/contacts`)
      if (response.ok) {
        const data = await response.json()
        const filteredContacts = (data || []).filter((c: any) => {
          if (!search) return true
          const fullName = `${c.first_name} ${c.last_name}`.toLowerCase()
          return fullName.includes(search.toLowerCase())
        })
        setContacts(
          filteredContacts.map((c: any) => ({
            id: c.id,
            firstName: c.first_name,
            lastName: c.last_name,
            email: c.email,
            phone: c.phone,
          }))
        )
      }
    } catch (err) {
      console.error('Error fetching contacts:', err)
    } finally {
      setLoadingContacts(false)
    }
  }, [])

  // Effect to fetch companies when search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (showCompanyDropdown) {
        fetchCompanies(companySearch)
      }
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [companySearch, showCompanyDropdown, fetchCompanies])

  // Effect to fetch contacts when company selected or search changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (selectedCompany && showContactDropdown) {
        fetchContacts(selectedCompany.id, contactSearch)
      }
    }, 300)
    return () => clearTimeout(timeoutId)
  }, [selectedCompany, contactSearch, showContactDropdown, fetchContacts])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleCompanySelect = (company: Company) => {
    setSelectedCompany(company)
    setFormData((prev) => ({ ...prev, clientId: company.id, contactId: undefined }))
    setSelectedContact(null)
    setCompanySearch(company.name)
    setShowCompanyDropdown(false)
  }

  const handleContactSelect = (contact: Contact) => {
    setSelectedContact(contact)
    setFormData((prev) => ({ ...prev, contactId: contact.id }))
    setContactSearch(`${contact.firstName} ${contact.lastName}`)
    setShowContactDropdown(false)
  }

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload to storage
    setUploading(true)
    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)
      formDataUpload.append('folder', 'projects')

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formDataUpload,
      })

      if (response.ok) {
        const { url } = await response.json()
        setFormData((prev) => ({ ...prev, thumbnailUrl: url }))
      } else {
        console.error('Upload failed')
      }
    } catch (err) {
      console.error('Upload error:', err)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.code.trim()) {
      setError('Projekti kood on kohustuslik')
      return
    }

    if (!formData.name.trim()) {
      setError('Projekti nimi on kohustuslik')
      return
    }

    try {
      await createProject.mutateAsync(formData)
      resetForm()
      onOpenChange(false)
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Projekti loomine ebaõnnestus')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      type: defaultType || 'ptv',
      status: 'starting',
      currency: 'EUR',
      startDate: '',
      endDate: '',
      address: '',
      country: 'Eesti',
      latitude: undefined,
      longitude: undefined,
      clientId: undefined,
      contactId: undefined,
      thumbnailUrl: undefined,
    })
    setSelectedCompany(null)
    setSelectedContact(null)
    setCompanySearch('')
    setContactSearch('')
    setImagePreview(null)
    setError('')
  }

  const handleClose = () => {
    setError('')
    onOpenChange(false)
  }

  // Geocode address to coordinates
  const geocodeAddress = async () => {
    if (!formData.address) return

    setGeocoding(true)
    try {
      const fullAddress = `${formData.address}, ${formData.country}`
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fullAddress)}&limit=1`,
        {
          headers: {
            'User-Agent': 'EOS2-ERP/1.0',
          },
        }
      )
      if (response.ok) {
        const data = await response.json()
        if (data.length > 0) {
          setFormData((prev) => ({
            ...prev,
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon),
          }))
        } else {
          setError('Aadressi ei leitud')
        }
      }
    } catch (err) {
      console.error('Geocoding failed:', err)
      setError('Aadressi otsing ebaõnnestus')
    } finally {
      setGeocoding(false)
    }
  }

  // Handle map click for location selection
  const handleMapClick = async (lat: number, lng: number) => {
    setFormData((prev) => ({
      ...prev,
      latitude: lat,
      longitude: lng,
    }))

    // Reverse geocode to get address
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        {
          headers: {
            'User-Agent': 'EOS2-ERP/1.0',
          },
        }
      )
      if (response.ok) {
        const data = await response.json()
        if (data.display_name) {
          setFormData((prev) => ({
            ...prev,
            address: data.display_name,
          }))
        }
      }
    } catch (err) {
      console.error('Reverse geocoding failed:', err)
    }
  }

  if (!open) return null

  // Map preview URL using OpenStreetMap static image
  const mapPreviewUrl =
    formData.latitude && formData.longitude
      ? `https://staticmap.openstreetmap.de/staticmap.php?center=${formData.latitude},${formData.longitude}&zoom=15&size=400x200&markers=${formData.latitude},${formData.longitude},red-pushpin`
      : null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl bg-white rounded-xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#279989]/10 flex items-center justify-center">
              <Plus className="w-5 h-5 text-[#279989]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Lisa uus projekt</h2>
              <p className="text-sm text-slate-500">Loo uus projekt</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            {/* Error */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Image Upload */}
            <div className="space-y-1.5">
              <Label>Projekti pilt</Label>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-lg p-4 cursor-pointer hover:border-[#279989] transition-colors"
              >
                {imagePreview ? (
                  <div className="relative">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    {uploading && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
                        <Loader2 className="w-6 h-6 animate-spin text-white" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <ImageIcon className="w-8 h-8 text-slate-400" />
                    <span className="text-sm text-slate-500">Kliki pildi üleslaadimiseks</span>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Type and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="type">Projekti tüüp *</Label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989] bg-white"
                >
                  {typeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="status">Staatus</Label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989] bg-white"
                >
                  {statusOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Code and Name */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="code">Projekti kood *</Label>
                <Input
                  id="code"
                  name="code"
                  value={formData.code}
                  onChange={handleChange}
                  placeholder="PRJ-001"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name">Projekti nimi *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Uus projekt"
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Kirjeldus</Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Projekti kirjeldus..."
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
              />
            </div>

            {/* Company Selection */}
            <div className="space-y-1.5">
              <Label>Ettevõte</Label>
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    value={companySearch}
                    onChange={(e) => {
                      setCompanySearch(e.target.value)
                      setShowCompanyDropdown(true)
                      if (!e.target.value) {
                        setSelectedCompany(null)
                        setFormData((prev) => ({
                          ...prev,
                          clientId: undefined,
                          contactId: undefined,
                        }))
                      }
                    }}
                    onFocus={() => {
                      setShowCompanyDropdown(true)
                      fetchCompanies(companySearch)
                    }}
                    placeholder="Otsi ettevõtet..."
                    className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
                  />
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                </div>
                {showCompanyDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 max-h-48 overflow-y-auto">
                    {loadingCompanies ? (
                      <div className="p-3 text-center text-sm text-slate-500">
                        <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                        Laadin...
                      </div>
                    ) : companies.length === 0 ? (
                      <div className="p-3 text-center text-sm text-slate-500">
                        Ettevõtteid ei leitud
                      </div>
                    ) : (
                      companies.map((company) => (
                        <button
                          key={company.id}
                          type="button"
                          onClick={() => handleCompanySelect(company)}
                          className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Building2 className="w-4 h-4 text-slate-400" />
                          {company.name}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Contact Selection (only show if company selected) */}
            {selectedCompany && (
              <div className="space-y-1.5">
                <Label>Kontaktisik</Label>
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      value={contactSearch}
                      onChange={(e) => {
                        setContactSearch(e.target.value)
                        setShowContactDropdown(true)
                      }}
                      onFocus={() => {
                        setShowContactDropdown(true)
                        fetchContacts(selectedCompany.id, contactSearch)
                      }}
                      placeholder="Otsi kontaktisikut..."
                      className="w-full pl-10 pr-10 py-2 border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
                    />
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                  {showContactDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 max-h-48 overflow-y-auto">
                      {loadingContacts ? (
                        <div className="p-3 text-center text-sm text-slate-500">
                          <Loader2 className="w-4 h-4 animate-spin inline mr-2" />
                          Laadin...
                        </div>
                      ) : contacts.length === 0 ? (
                        <div className="p-3 text-center text-sm text-slate-500">
                          Kontakte ei leitud
                        </div>
                      ) : (
                        contacts.map((contact) => (
                          <button
                            key={contact.id}
                            type="button"
                            onClick={() => handleContactSelect(contact)}
                            className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50"
                          >
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-slate-400" />
                              <div>
                                <div className="font-medium">
                                  {contact.firstName} {contact.lastName}
                                </div>
                                {contact.email && (
                                  <div className="text-xs text-slate-500">{contact.email}</div>
                                )}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Alguskuupäev</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="endDate">Lõppkuupäev</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Address Section */}
            <div className="space-y-3 p-4 bg-slate-50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <MapPin className="w-4 h-4" />
                  Asukoht
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMapPicker(!showMapPicker)}
                >
                  <Map className="w-4 h-4 mr-1" />
                  {showMapPicker ? 'Peida kaart' : 'Vali kaardilt'}
                </Button>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="address">Aadress</Label>
                <div className="flex gap-2">
                  <div ref={addressInputRef} className="relative flex-1" onClick={(e) => e.stopPropagation()}>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="Täisaadress (nt. Pärnu mnt 15, Tallinn)"
                      className="w-full"
                    />
                    {isSearchingAddress && (
                      <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-slate-400" />
                    )}
                    {/* Address autocomplete dropdown */}
                    {showAddressDropdown && addressResults.length > 0 && (
                      <div className="absolute z-20 w-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 max-h-48 overflow-y-auto">
                        <div className="px-3 py-1.5 text-xs text-slate-500 bg-slate-50 border-b">
                          OpenStreetMap
                        </div>
                        {addressResults.map((result, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                address: result.address,
                                latitude: result.lat,
                                longitude: result.lon,
                              }))
                              setShowAddressDropdown(false)
                              setAddressResults([])
                            }}
                            className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2"
                          >
                            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{result.address}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={geocodeAddress}
                    disabled={!formData.address || geocoding}
                  >
                    {geocoding ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MapPin className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Map Picker */}
              {showMapPicker && (
                <div className="mt-3">
                  <div
                    className="w-full h-64 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 relative cursor-crosshair"
                    onClick={(e) => {
                      // Simple click-to-select using iframe postMessage won't work easily
                      // Instead, show instructions
                    }}
                  >
                    <iframe
                      src={`https://www.openstreetmap.org/export/embed.html?bbox=${
                        formData.longitude
                          ? `${formData.longitude - 0.01},${formData.latitude! - 0.01},${formData.longitude + 0.01},${formData.latitude! + 0.01}`
                          : '24.7,59.4,24.8,59.5'
                      }&layer=mapnik${formData.latitude ? `&marker=${formData.latitude},${formData.longitude}` : ''}`}
                      className="w-full h-full border-0"
                    />
                    <div className="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur-sm rounded-lg p-2 text-xs text-slate-600">
                      Sisesta aadress ja vajuta{' '}
                      <MapPin className="w-3 h-3 inline" /> nuppu koordinaatide leidmiseks
                    </div>
                  </div>
                </div>
              )}

              {/* Coordinates display */}
              {formData.latitude && formData.longitude && (
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-slate-500">
                    Koordinaadid: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                  </span>
                </div>
              )}

              {/* Map Preview */}
              {mapPreviewUrl && !showMapPicker && (
                <div className="mt-2 rounded-lg overflow-hidden border border-slate-200">
                  <img src={mapPreviewUrl} alt="Asukoha eelvaade" className="w-full h-[150px] object-cover" />
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
            <Button type="button" variant="outline" onClick={handleClose}>
              Tühista
            </Button>
            <Button
              type="submit"
              className="bg-[#279989] hover:bg-[#1e7a6d] text-white"
              disabled={createProject.isPending || uploading}
            >
              {createProject.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvestan...
                </>
              ) : (
                'Lisa projekt'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

export default AddProjectModal
