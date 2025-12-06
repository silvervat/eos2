'use client'

/**
 * Montaaž Project - Puudused (Deficiencies/Punch List)
 * Track deficiencies with photos, location, and responsibility assignment
 */

import React, { useState, useMemo } from 'react'
import {
  AlertTriangle,
  Plus,
  Search,
  Camera,
  MapPin,
  User,
  Building,
  Users,
  X,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  Filter,
  Upload,
  ImageIcon,
  ChevronDown,
  Calendar,
  MessageSquare,
} from 'lucide-react'

interface Deficiency {
  id: string
  title: string
  description: string
  location: string
  photos: string[]
  responsibility: 'meie' | 'atv'
  atvCompanyId?: string
  atvCompanyName?: string
  status: 'open' | 'in_progress' | 'resolved' | 'verified'
  priority: 'low' | 'medium' | 'high' | 'critical'
  createdAt: string
  resolvedAt?: string
  createdBy: string
  comments: number
}

interface AtvCompany {
  id: string
  name: string
  specialty: string
}

const mockAtvCompanies: AtvCompany[] = [
  { id: '1', name: 'Soojus OÜ', specialty: 'Küttesüsteemid' },
  { id: '2', name: 'Elekter Plus AS', specialty: 'Elektritööd' },
  { id: '3', name: 'Ventilatsioon Pro OÜ', specialty: 'Ventilatsioon' },
  { id: '4', name: 'Torustik OÜ', specialty: 'Torutööd' },
  { id: '5', name: 'Isolatsioon AS', specialty: 'Isolatsioonitööd' },
]

const mockDeficiencies: Deficiency[] = [
  {
    id: '1',
    title: 'Lekke koht torus',
    description: 'Küttesüsteemi torus on nähtav leke 3. korruse tehnilises ruumis',
    location: '3. korrus, tehniline ruum TR-301',
    photos: ['/photos/def1-1.jpg', '/photos/def1-2.jpg'],
    responsibility: 'atv',
    atvCompanyId: '1',
    atvCompanyName: 'Soojus OÜ',
    status: 'in_progress',
    priority: 'high',
    createdAt: '2024-03-10',
    createdBy: 'Jaan Tamm',
    comments: 3,
  },
  {
    id: '2',
    title: 'Puuduv isolatsioon',
    description: 'Ventilatsiooni kanali isolatsioon puudub ~2m lõigul',
    location: '2. korrus, koridor K-205',
    photos: ['/photos/def2-1.jpg'],
    responsibility: 'atv',
    atvCompanyId: '5',
    atvCompanyName: 'Isolatsioon AS',
    status: 'open',
    priority: 'medium',
    createdAt: '2024-03-12',
    createdBy: 'Peeter Mets',
    comments: 1,
  },
  {
    id: '3',
    title: 'Vale kaldega drain',
    description: 'Kondensaadi äravoolu kalle ei vasta projektile',
    location: '1. korrus, ventilatsiooniruum VR-101',
    photos: ['/photos/def3-1.jpg', '/photos/def3-2.jpg', '/photos/def3-3.jpg'],
    responsibility: 'meie',
    status: 'resolved',
    priority: 'medium',
    createdAt: '2024-03-08',
    resolvedAt: '2024-03-14',
    createdBy: 'Andres Kask',
    comments: 5,
  },
  {
    id: '4',
    title: 'Kahjustatud seade',
    description: 'Jahutusseadme korpusel on transport kahjustus',
    location: 'Katus, jahutusseadmete ala',
    photos: ['/photos/def4-1.jpg'],
    responsibility: 'meie',
    status: 'verified',
    priority: 'low',
    createdAt: '2024-03-05',
    resolvedAt: '2024-03-10',
    createdBy: 'Jaan Tamm',
    comments: 2,
  },
  {
    id: '5',
    title: 'Elektri ühendus puudub',
    description: 'Ventilaatori elektriühendus tegemata, kaabel olemas',
    location: '4. korrus, serveriruum SR-401',
    photos: ['/photos/def5-1.jpg'],
    responsibility: 'atv',
    atvCompanyId: '2',
    atvCompanyName: 'Elekter Plus AS',
    status: 'open',
    priority: 'critical',
    createdAt: '2024-03-15',
    createdBy: 'Tiit Lepp',
    comments: 0,
  },
]

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  open: { label: 'Avatud', color: 'text-red-700', bg: 'bg-red-100', icon: AlertTriangle },
  in_progress: { label: 'Töös', color: 'text-orange-700', bg: 'bg-orange-100', icon: Clock },
  resolved: { label: 'Lahendatud', color: 'text-blue-700', bg: 'bg-blue-100', icon: CheckCircle2 },
  verified: { label: 'Kinnitatud', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle2 },
}

const priorityConfig: Record<string, { label: string; color: string; bg: string }> = {
  low: { label: 'Madal', color: 'text-gray-600', bg: 'bg-gray-100' },
  medium: { label: 'Keskmine', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  high: { label: 'Kõrge', color: 'text-orange-700', bg: 'bg-orange-100' },
  critical: { label: 'Kriitiline', color: 'text-red-700', bg: 'bg-red-100' },
}

export default function DeficienciesPage() {
  const [deficiencies, setDeficiencies] = useState<Deficiency[]>(mockDeficiencies)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [responsibilityFilter, setResponsibilityFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedDeficiency, setSelectedDeficiency] = useState<Deficiency | null>(null)

  // Form state for new deficiency
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    responsibility: 'meie' as 'meie' | 'atv',
    atvCompanyId: '',
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical',
  })
  const [uploadedPhotos, setUploadedPhotos] = useState<File[]>([])

  // Stats
  const stats = useMemo(() => {
    const open = deficiencies.filter(d => d.status === 'open').length
    const inProgress = deficiencies.filter(d => d.status === 'in_progress').length
    const resolved = deficiencies.filter(d => d.status === 'resolved' || d.status === 'verified').length
    const meie = deficiencies.filter(d => d.responsibility === 'meie').length
    const atv = deficiencies.filter(d => d.responsibility === 'atv').length
    return { open, inProgress, resolved, meie, atv, total: deficiencies.length }
  }, [deficiencies])

  // Filter deficiencies
  const filteredDeficiencies = useMemo(() => {
    return deficiencies.filter(def => {
      const matchesSearch = search === '' ||
        def.title.toLowerCase().includes(search.toLowerCase()) ||
        def.description.toLowerCase().includes(search.toLowerCase()) ||
        def.location.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || def.status === statusFilter
      const matchesResponsibility = responsibilityFilter === 'all' || def.responsibility === responsibilityFilter
      const matchesPriority = priorityFilter === 'all' || def.priority === priorityFilter
      return matchesSearch && matchesStatus && matchesResponsibility && matchesPriority
    })
  }, [deficiencies, search, statusFilter, responsibilityFilter, priorityFilter])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('et-EE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      setUploadedPhotos(prev => [...prev, ...Array.from(files)])
    }
  }

  const removePhoto = (index: number) => {
    setUploadedPhotos(prev => prev.filter((_, i) => i !== index))
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      location: '',
      responsibility: 'meie',
      atvCompanyId: '',
      priority: 'medium',
    })
    setUploadedPhotos([])
  }

  const handleAddDeficiency = () => {
    const atvCompany = mockAtvCompanies.find(c => c.id === formData.atvCompanyId)
    const newDeficiency: Deficiency = {
      id: String(deficiencies.length + 1),
      title: formData.title,
      description: formData.description,
      location: formData.location,
      photos: uploadedPhotos.map(f => URL.createObjectURL(f)),
      responsibility: formData.responsibility,
      atvCompanyId: formData.responsibility === 'atv' ? formData.atvCompanyId : undefined,
      atvCompanyName: formData.responsibility === 'atv' ? atvCompany?.name : undefined,
      status: 'open',
      priority: formData.priority,
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: 'Praegune kasutaja',
      comments: 0,
    }
    setDeficiencies(prev => [newDeficiency, ...prev])
    setShowAddModal(false)
    resetForm()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-800">Puudused</h2>
          <p className="text-gray-500 text-sm">Ehitusdefektide ja puuduste haldus</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Lisa puudus
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avatud</p>
              <p className="text-2xl font-bold text-red-600">{stats.open}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Töös</p>
              <p className="text-2xl font-bold text-orange-600">{stats.inProgress}</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Lahendatud</p>
              <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Meie vastutus</p>
              <p className="text-2xl font-bold text-blue-600">{stats.meie}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Building className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">ATV vastutus</p>
              <p className="text-2xl font-bold text-purple-600">{stats.atv}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Otsi puudusi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">Kõik staatused</option>
            <option value="open">Avatud</option>
            <option value="in_progress">Töös</option>
            <option value="resolved">Lahendatud</option>
            <option value="verified">Kinnitatud</option>
          </select>
          <select
            value={responsibilityFilter}
            onChange={(e) => setResponsibilityFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">Kõik vastutajad</option>
            <option value="meie">Meie</option>
            <option value="atv">ATV</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">Kõik prioriteedid</option>
            <option value="critical">Kriitiline</option>
            <option value="high">Kõrge</option>
            <option value="medium">Keskmine</option>
            <option value="low">Madal</option>
          </select>
        </div>
      </div>

      {/* Deficiencies list */}
      <div className="space-y-4">
        {filteredDeficiencies.map(def => {
          const statusInfo = statusConfig[def.status]
          const priorityInfo = priorityConfig[def.priority]
          const StatusIcon = statusInfo.icon

          return (
            <div
              key={def.id}
              className="bg-white rounded-lg border overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setSelectedDeficiency(def)}
            >
              <div className="p-4">
                <div className="flex items-start gap-4">
                  {/* Photo preview */}
                  <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                    {def.photos.length > 0 ? (
                      <div className="relative w-full h-full">
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        {def.photos.length > 1 && (
                          <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 text-white text-xs rounded">
                            +{def.photos.length - 1}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Camera className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-medium text-gray-900">{def.title}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${statusInfo.bg} ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-xs ${priorityInfo.bg} ${priorityInfo.color}`}>
                            {priorityInfo.label}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1 line-clamp-1">{def.description}</p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {def.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(def.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {def.createdBy}
                      </span>
                      {def.comments > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {def.comments}
                        </span>
                      )}
                    </div>

                    {/* Responsibility badge */}
                    <div className="mt-3">
                      {def.responsibility === 'meie' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                          <Building className="w-3 h-3" />
                          Meie vastutus
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          <Users className="w-3 h-3" />
                          ATV: {def.atvCompanyName}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {filteredDeficiencies.length === 0 && (
          <div className="text-center py-12 bg-white border rounded-lg">
            <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Puudusi ei leitud</p>
          </div>
        )}
      </div>

      {/* Add deficiency modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-semibold">Lisa uus puudus</h2>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  resetForm()
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Photos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fotod
                </label>
                <div className="flex flex-wrap gap-2">
                  {uploadedPhotos.map((photo, index) => (
                    <div key={index} className="relative w-20 h-20">
                      <img
                        src={URL.createObjectURL(photo)}
                        alt={`Foto ${index + 1}`}
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removePhoto(index)}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <label className="w-20 h-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50">
                    <Camera className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-500 mt-1">Lisa</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pealkiri *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Nt. Lekke koht torus"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kirjeldus *
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Kirjelda probleemi täpsemalt..."
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Asukoht *
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Nt. 3. korrus, tehniline ruum TR-301"
                    className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioriteet
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as typeof formData.priority }))}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="low">Madal</option>
                  <option value="medium">Keskmine</option>
                  <option value="high">Kõrge</option>
                  <option value="critical">Kriitiline</option>
                </select>
              </div>

              {/* Responsibility */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Vastutaja *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, responsibility: 'meie', atvCompanyId: '' }))}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      formData.responsibility === 'meie'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Building className={`w-6 h-6 mb-2 ${formData.responsibility === 'meie' ? 'text-blue-600' : 'text-gray-400'}`} />
                    <div className="font-medium text-gray-900">Meie</div>
                    <div className="text-xs text-gray-500">Rivest vastutus</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, responsibility: 'atv' }))}
                    className={`p-4 rounded-lg border-2 text-left transition-colors ${
                      formData.responsibility === 'atv'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Users className={`w-6 h-6 mb-2 ${formData.responsibility === 'atv' ? 'text-purple-600' : 'text-gray-400'}`} />
                    <div className="font-medium text-gray-900">ATV</div>
                    <div className="text-xs text-gray-500">Alltöövõtja vastutus</div>
                  </button>
                </div>
              </div>

              {/* ATV Company selector */}
              {formData.responsibility === 'atv' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Alltöövõtja *
                  </label>
                  <select
                    value={formData.atvCompanyId}
                    onChange={(e) => setFormData(prev => ({ ...prev, atvCompanyId: e.target.value }))}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="">Vali alltöövõtja...</option>
                    {mockAtvCompanies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name} - {company.specialty}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2 sticky bottom-0">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  resetForm()
                }}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100"
              >
                Tühista
              </button>
              <button
                onClick={handleAddDeficiency}
                disabled={!formData.title || !formData.description || !formData.location || (formData.responsibility === 'atv' && !formData.atvCompanyId)}
                className="px-4 py-2 bg-[#279989] text-white rounded-lg text-sm hover:bg-[#1f7a6d] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Lisa puudus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selectedDeficiency && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-semibold">{selectedDeficiency.title}</h2>
              <button
                onClick={() => setSelectedDeficiency(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-6">
              {/* Photos */}
              {selectedDeficiency.photos.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Fotod</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedDeficiency.photos.map((_, index) => (
                      <div key={index} className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-12 h-12 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Info grid */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Staatus</h3>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm ${statusConfig[selectedDeficiency.status].bg} ${statusConfig[selectedDeficiency.status].color}`}>
                    {statusConfig[selectedDeficiency.status].label}
                  </span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">Prioriteet</h3>
                  <span className={`inline-flex px-2 py-1 rounded text-sm ${priorityConfig[selectedDeficiency.priority].bg} ${priorityConfig[selectedDeficiency.priority].color}`}>
                    {priorityConfig[selectedDeficiency.priority].label}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Kirjeldus</h3>
                <p className="text-gray-600">{selectedDeficiency.description}</p>
              </div>

              {/* Location */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Asukoht</h3>
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin className="w-4 h-4" />
                  {selectedDeficiency.location}
                </div>
              </div>

              {/* Responsibility */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-1">Vastutaja</h3>
                {selectedDeficiency.responsibility === 'meie' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    <Building className="w-4 h-4" />
                    Meie (Rivest)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                    <Users className="w-4 h-4" />
                    ATV: {selectedDeficiency.atvCompanyName}
                  </span>
                )}
              </div>

              {/* Metadata */}
              <div className="pt-4 border-t">
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Loodud: {formatDate(selectedDeficiency.createdAt)}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-4 h-4" />
                    {selectedDeficiency.createdBy}
                  </span>
                  {selectedDeficiency.resolvedAt && (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      Lahendatud: {formatDate(selectedDeficiency.resolvedAt)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-between sticky bottom-0">
              <div className="flex gap-2">
                <button className="px-3 py-2 text-sm border rounded-lg hover:bg-gray-100 flex items-center gap-2">
                  <Edit2 className="w-4 h-4" />
                  Muuda
                </button>
                <button className="px-3 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 flex items-center gap-2">
                  <Trash2 className="w-4 h-4" />
                  Kustuta
                </button>
              </div>
              {selectedDeficiency.status === 'open' && (
                <button className="px-4 py-2 bg-orange-500 text-white rounded-lg text-sm hover:bg-orange-600">
                  Märgi töös
                </button>
              )}
              {selectedDeficiency.status === 'in_progress' && (
                <button className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">
                  Märgi lahendatuks
                </button>
              )}
              {selectedDeficiency.status === 'resolved' && (
                <button className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600">
                  Kinnita
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
