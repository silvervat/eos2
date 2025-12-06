'use client'

/**
 * Aktid (Acts/Certificates) - Document generation for montaaž projects
 * Allows creating inspection acts, checklists, and certificates with auto PDF generation
 */

import React, { useState, useMemo } from 'react'
import { useParams } from 'next/navigation'
import {
  FileText,
  Plus,
  Search,
  Download,
  Eye,
  Trash2,
  Calendar,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Settings,
  Copy,
  MoreVertical,
  X,
  ChevronRight,
  FileCheck,
  Clipboard,
  Wrench,
  Shield,
  FileSignature,
  Building,
  Printer,
  Send,
  Edit,
} from 'lucide-react'

interface ActTemplate {
  id: string
  name: string
  category: string
  description: string
  fields: ActField[]
  checklistItems?: string[]
  isActive: boolean
}

interface ActField {
  id: string
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'signature' | 'checkbox'
  required: boolean
  options?: string[]
  placeholder?: string
  defaultValue?: string
}

interface GeneratedAct {
  id: string
  templateId: string
  templateName: string
  category: string
  actNumber: string
  createdAt: string
  createdBy: string
  status: 'draft' | 'completed' | 'signed' | 'sent'
  data: Record<string, unknown>
  signatures?: { name: string; date: string; role: string }[]
  pdfUrl?: string
}

// Predefined act templates
const actTemplates: ActTemplate[] = [
  {
    id: '1',
    name: 'Keevise visuaalne kontroll',
    category: 'Kvaliteedikontroll',
    description: 'Keevitustööde visuaalse kontrolli akt vastavalt standardile EN 13018',
    isActive: true,
    fields: [
      { id: 'weld_number', name: 'weld_number', label: 'Keevisliite number', type: 'text', required: true, placeholder: 'Nt. KL-001' },
      { id: 'location', name: 'location', label: 'Asukoht', type: 'text', required: true, placeholder: 'Nt. 2. korrus, A-tsoon' },
      { id: 'material', name: 'material', label: 'Materjal', type: 'select', required: true, options: ['Teras S235', 'Teras S355', 'Roostevaba teras', 'Alumiinium', 'Muu'] },
      { id: 'pipe_diameter', name: 'pipe_diameter', label: 'Toru läbimõõt (mm)', type: 'number', required: false },
      { id: 'wall_thickness', name: 'wall_thickness', label: 'Seinapaksus (mm)', type: 'number', required: false },
      { id: 'welder', name: 'welder', label: 'Keevitaja nimi', type: 'text', required: true },
      { id: 'welder_cert', name: 'welder_cert', label: 'Keevitaja sertifikaat', type: 'text', required: true },
      { id: 'inspection_date', name: 'inspection_date', label: 'Kontrolli kuupäev', type: 'date', required: true },
      { id: 'result', name: 'result', label: 'Tulemus', type: 'select', required: true, options: ['Vastab', 'Ei vasta', 'Parandada'] },
      { id: 'notes', name: 'notes', label: 'Märkused', type: 'textarea', required: false, placeholder: 'Lisainfo kontrolli kohta...' },
    ],
    checklistItems: [
      'Keevisõmbluse täidis on ühtlane',
      'Puuduvad praod ja poorid',
      'Keevisõmbluse laius vastab nõuetele',
      'Puudub alusmaterjali allalõige',
      'Liitekoht on puhas',
      'Keevisõmbluse kõrgus vastab nõuetele',
    ],
  },
  {
    id: '2',
    name: 'Poltide pingutamine',
    category: 'Kvaliteedikontroll',
    description: 'Poltliidete pingutamise ja kontrollimise akt',
    isActive: true,
    fields: [
      { id: 'connection_id', name: 'connection_id', label: 'Liite ID', type: 'text', required: true },
      { id: 'location', name: 'location', label: 'Asukoht', type: 'text', required: true },
      { id: 'bolt_type', name: 'bolt_type', label: 'Poldi tüüp', type: 'select', required: true, options: ['M8', 'M10', 'M12', 'M16', 'M20', 'M24', 'Muu'] },
      { id: 'bolt_class', name: 'bolt_class', label: 'Tugevusklass', type: 'select', required: true, options: ['8.8', '10.9', '12.9', 'A2-70', 'A4-70'] },
      { id: 'bolt_count', name: 'bolt_count', label: 'Poltide arv', type: 'number', required: true },
      { id: 'torque_required', name: 'torque_required', label: 'Nõutav moment (Nm)', type: 'number', required: true },
      { id: 'torque_applied', name: 'torque_applied', label: 'Rakendatud moment (Nm)', type: 'number', required: true },
      { id: 'torque_tool', name: 'torque_tool', label: 'Kasutatud tööriist', type: 'text', required: true, placeholder: 'Momentvõti kalibreerimisnumbriga' },
      { id: 'technician', name: 'technician', label: 'Tehnik', type: 'text', required: true },
      { id: 'date', name: 'date', label: 'Kuupäev', type: 'date', required: true },
      { id: 'notes', name: 'notes', label: 'Märkused', type: 'textarea', required: false },
    ],
  },
  {
    id: '3',
    name: 'Survekatse protokoll',
    category: 'Katsetused',
    description: 'Torustiku survekatse protokoll vastavalt standardile',
    isActive: true,
    fields: [
      { id: 'system', name: 'system', label: 'Süsteemi kood', type: 'text', required: true, placeholder: 'Nt. KYT-01' },
      { id: 'system_name', name: 'system_name', label: 'Süsteemi nimetus', type: 'text', required: true },
      { id: 'test_section', name: 'test_section', label: 'Katsetatav lõik', type: 'text', required: true },
      { id: 'pipe_material', name: 'pipe_material', label: 'Torude materjal', type: 'select', required: true, options: ['Teras', 'Vask', 'PE-Xa', 'Mitmekihiline', 'Roostevaba'] },
      { id: 'test_pressure', name: 'test_pressure', label: 'Katsesurve (bar)', type: 'number', required: true },
      { id: 'test_duration', name: 'test_duration', label: 'Katse kestus (min)', type: 'number', required: true, defaultValue: '30' },
      { id: 'start_pressure', name: 'start_pressure', label: 'Algne rõhk (bar)', type: 'number', required: true },
      { id: 'end_pressure', name: 'end_pressure', label: 'Lõplik rõhk (bar)', type: 'number', required: true },
      { id: 'pressure_drop', name: 'pressure_drop', label: 'Rõhu langus (bar)', type: 'number', required: true },
      { id: 'test_medium', name: 'test_medium', label: 'Katsekeskkond', type: 'select', required: true, options: ['Vesi', 'Õhk', 'Inertgaas'] },
      { id: 'ambient_temp', name: 'ambient_temp', label: 'Ümbritsev temp (°C)', type: 'number', required: false },
      { id: 'test_date', name: 'test_date', label: 'Katse kuupäev', type: 'date', required: true },
      { id: 'result', name: 'result', label: 'Tulemus', type: 'select', required: true, options: ['VASTAB', 'EI VASTA'] },
      { id: 'technician', name: 'technician', label: 'Tehnik', type: 'text', required: true },
      { id: 'notes', name: 'notes', label: 'Märkused', type: 'textarea', required: false },
    ],
  },
  {
    id: '4',
    name: 'Varjatud tööde akt',
    category: 'Dokumentatsioon',
    description: 'Varjatud konstruktsioonide ja torustike ülevaatuse akt enne katmist',
    isActive: true,
    fields: [
      { id: 'work_description', name: 'work_description', label: 'Tööde kirjeldus', type: 'textarea', required: true },
      { id: 'location', name: 'location', label: 'Asukoht', type: 'text', required: true },
      { id: 'drawing_ref', name: 'drawing_ref', label: 'Joonise viide', type: 'text', required: false },
      { id: 'systems', name: 'systems', label: 'Süsteemid', type: 'text', required: true },
      { id: 'inspection_date', name: 'inspection_date', label: 'Ülevaatuse kuupäev', type: 'date', required: true },
      { id: 'contractor_rep', name: 'contractor_rep', label: 'Töövõtja esindaja', type: 'text', required: true },
      { id: 'client_rep', name: 'client_rep', label: 'Tellija esindaja', type: 'text', required: false },
      { id: 'supervisor_rep', name: 'supervisor_rep', label: 'Omanikujärelevalve', type: 'text', required: false },
      { id: 'result', name: 'result', label: 'Otsus', type: 'select', required: true, options: ['Lubatud katta', 'Parandada', 'Ei ole lubatud'] },
      { id: 'conditions', name: 'conditions', label: 'Tingimused/Märkused', type: 'textarea', required: false },
    ],
  },
  {
    id: '5',
    name: 'Seadme üleandmise akt',
    category: 'Üleandmine',
    description: 'Paigaldatud seadme üleandmise-vastuvõtmise akt',
    isActive: true,
    fields: [
      { id: 'equipment_name', name: 'equipment_name', label: 'Seadme nimetus', type: 'text', required: true },
      { id: 'equipment_model', name: 'equipment_model', label: 'Mudel/Tüüp', type: 'text', required: true },
      { id: 'serial_number', name: 'serial_number', label: 'Seerianumber', type: 'text', required: true },
      { id: 'manufacturer', name: 'manufacturer', label: 'Tootja', type: 'text', required: true },
      { id: 'location', name: 'location', label: 'Paigalduskoht', type: 'text', required: true },
      { id: 'system', name: 'system', label: 'Süsteemi kood', type: 'text', required: true },
      { id: 'installation_date', name: 'installation_date', label: 'Paigalduse kuupäev', type: 'date', required: true },
      { id: 'handover_date', name: 'handover_date', label: 'Üleandmise kuupäev', type: 'date', required: true },
      { id: 'warranty_period', name: 'warranty_period', label: 'Garantiiaeg (kuud)', type: 'number', required: true, defaultValue: '24' },
      { id: 'contractor_rep', name: 'contractor_rep', label: 'Töövõtja esindaja', type: 'text', required: true },
      { id: 'client_rep', name: 'client_rep', label: 'Tellija esindaja', type: 'text', required: true },
      { id: 'notes', name: 'notes', label: 'Märkused', type: 'textarea', required: false },
    ],
  },
  {
    id: '6',
    name: 'Isolatsiooni kontrollakt',
    category: 'Kvaliteedikontroll',
    description: 'Torude ja kanalite isolatsiooni paigalduse kontroll',
    isActive: true,
    fields: [
      { id: 'system', name: 'system', label: 'Süsteemi kood', type: 'text', required: true },
      { id: 'location', name: 'location', label: 'Asukoht', type: 'text', required: true },
      { id: 'insulation_type', name: 'insulation_type', label: 'Isolatsiooni tüüp', type: 'select', required: true, options: ['Kivivill', 'Klaaskiud', 'Kummiisolatsioon', 'PE-vaht', 'Muu'] },
      { id: 'insulation_thickness', name: 'insulation_thickness', label: 'Paksus (mm)', type: 'number', required: true },
      { id: 'covering', name: 'covering', label: 'Kattematerjalid', type: 'select', required: true, options: ['Alumiiniumplekk', 'PVC kate', 'Puudub', 'Muu'] },
      { id: 'inspection_date', name: 'inspection_date', label: 'Kontrolli kuupäev', type: 'date', required: true },
      { id: 'inspector', name: 'inspector', label: 'Kontrollija', type: 'text', required: true },
      { id: 'result', name: 'result', label: 'Tulemus', type: 'select', required: true, options: ['Vastab', 'Ei vasta', 'Parandada'] },
      { id: 'notes', name: 'notes', label: 'Märkused', type: 'textarea', required: false },
    ],
    checklistItems: [
      'Isolatsiooni paksus vastab projektile',
      'Liitekohad on tihendatud',
      'Kaitsekate on korrektselt paigaldatud',
      'Toestusvahendid on paigas',
      'Puuduvad nähtavad kahjustused',
    ],
  },
]

const mockGeneratedActs: GeneratedAct[] = [
  {
    id: '1',
    templateId: '1',
    templateName: 'Keevise visuaalne kontroll',
    category: 'Kvaliteedikontroll',
    actNumber: 'AKT-2024-001',
    createdAt: '2024-03-15',
    createdBy: 'Jaan Tamm',
    status: 'signed',
    data: { weld_number: 'KL-001', location: '2. korrus, A-tsoon', result: 'Vastab' },
    signatures: [{ name: 'Jaan Tamm', date: '2024-03-15', role: 'Kontrollija' }],
    pdfUrl: '/files/act-001.pdf',
  },
  {
    id: '2',
    templateId: '3',
    templateName: 'Survekatse protokoll',
    category: 'Katsetused',
    actNumber: 'AKT-2024-002',
    createdAt: '2024-03-14',
    createdBy: 'Andres Kask',
    status: 'completed',
    data: { system: 'KYT-01', test_pressure: 6, result: 'VASTAB' },
    pdfUrl: '/files/act-002.pdf',
  },
  {
    id: '3',
    templateId: '2',
    templateName: 'Poltide pingutamine',
    category: 'Kvaliteedikontroll',
    actNumber: 'AKT-2024-003',
    createdAt: '2024-03-13',
    createdBy: 'Peeter Mets',
    status: 'draft',
    data: { connection_id: 'FL-015', bolt_type: 'M16' },
  },
  {
    id: '4',
    templateId: '4',
    templateName: 'Varjatud tööde akt',
    category: 'Dokumentatsioon',
    actNumber: 'AKT-2024-004',
    createdAt: '2024-03-12',
    createdBy: 'Jaan Tamm',
    status: 'sent',
    data: { location: '1. korrus, laes', result: 'Lubatud katta' },
    signatures: [
      { name: 'Jaan Tamm', date: '2024-03-12', role: 'Töövõtja' },
      { name: 'Mart Kivi', date: '2024-03-12', role: 'Tellija' },
    ],
    pdfUrl: '/files/act-004.pdf',
  },
]

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Mustand', color: 'text-gray-700', bg: 'bg-gray-100' },
  completed: { label: 'Täidetud', color: 'text-blue-700', bg: 'bg-blue-100' },
  signed: { label: 'Allkirjastatud', color: 'text-green-700', bg: 'bg-green-100' },
  sent: { label: 'Saadetud', color: 'text-purple-700', bg: 'bg-purple-100' },
}

const categoryColors: Record<string, string> = {
  'Kvaliteedikontroll': 'bg-blue-100 text-blue-700',
  'Katsetused': 'bg-green-100 text-green-700',
  'Dokumentatsioon': 'bg-orange-100 text-orange-700',
  'Üleandmine': 'bg-purple-100 text-purple-700',
}

export default function ActsPage() {
  const params = useParams()
  const projectId = params.id as string

  const [acts, setActs] = useState<GeneratedAct[]>(mockGeneratedActs)
  const [templates, setTemplates] = useState<ActTemplate[]>(actTemplates)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<ActTemplate | null>(null)
  const [showTemplatesModal, setShowTemplatesModal] = useState(false)
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [checklistState, setChecklistState] = useState<Record<string, boolean>>({})

  // Stats
  const stats = useMemo(() => {
    const total = acts.length
    const draft = acts.filter(a => a.status === 'draft').length
    const signed = acts.filter(a => a.status === 'signed' || a.status === 'sent').length
    const thisMonth = acts.filter(a => {
      const date = new Date(a.createdAt)
      const now = new Date()
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    }).length
    return { total, draft, signed, thisMonth }
  }, [acts])

  // Filter acts
  const filteredActs = useMemo(() => {
    return acts.filter(act => {
      const matchesSearch = search === '' ||
        act.templateName.toLowerCase().includes(search.toLowerCase()) ||
        act.actNumber.toLowerCase().includes(search.toLowerCase()) ||
        act.createdBy.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || act.status === statusFilter
      const matchesCategory = categoryFilter === 'all' || act.category === categoryFilter
      return matchesSearch && matchesStatus && matchesCategory
    })
  }, [acts, search, statusFilter, categoryFilter])

  // Categories
  const categories = [...new Set(templates.map(t => t.category))]

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('et-EE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const handleSelectTemplate = (template: ActTemplate) => {
    setSelectedTemplate(template)
    setFormData({})
    // Initialize checklist state
    if (template.checklistItems) {
      const initialChecklist: Record<string, boolean> = {}
      template.checklistItems.forEach((_, idx) => {
        initialChecklist[`check_${idx}`] = false
      })
      setChecklistState(initialChecklist)
    }
    setShowCreateModal(true)
  }

  const handleFieldChange = (fieldName: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [fieldName]: value }))
  }

  const handleChecklistChange = (key: string, checked: boolean) => {
    setChecklistState(prev => ({ ...prev, [key]: checked }))
  }

  const generateActNumber = () => {
    const year = new Date().getFullYear()
    const count = acts.filter(a => a.actNumber.includes(String(year))).length + 1
    return `AKT-${year}-${String(count).padStart(3, '0')}`
  }

  const handleCreateAct = () => {
    if (!selectedTemplate) return

    const newAct: GeneratedAct = {
      id: String(acts.length + 1),
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      category: selectedTemplate.category,
      actNumber: generateActNumber(),
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: 'Kasutaja', // Would come from auth context
      status: 'draft',
      data: { ...formData, checklist: checklistState },
    }

    setActs([newAct, ...acts])
    setShowCreateModal(false)
    setSelectedTemplate(null)
    setFormData({})
    setChecklistState({})
  }

  const generatePDF = (actId: string) => {
    // In production, this would call an API to generate the PDF
    console.log('Generating PDF for act:', actId)
    alert('PDF genereeritakse... (demo)')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Aktid</h1>
          <p className="text-sm text-gray-500">Kvaliteedikontrolli ja dokumentatsiooni aktide koostamine</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTemplatesModal(true)}
            className="px-4 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Mallid
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Uus akt
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Kokku akte</p>
          <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Mustandid</p>
          <p className="text-2xl font-bold text-orange-600">{stats.draft}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Allkirjastatud</p>
          <p className="text-2xl font-bold text-green-600">{stats.signed}</p>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <p className="text-sm text-gray-500">Sel kuul</p>
          <p className="text-2xl font-bold text-blue-600">{stats.thisMonth}</p>
        </div>
      </div>

      {/* Quick access templates */}
      <div className="bg-white rounded-lg border p-4">
        <h3 className="font-medium text-gray-900 mb-3">Kiirvalik - loo uus akt</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
          {templates.filter(t => t.isActive).slice(0, 6).map(template => (
            <button
              key={template.id}
              onClick={() => handleSelectTemplate(template)}
              className="p-3 border rounded-lg hover:bg-gray-50 hover:border-[#279989] transition-colors text-left"
            >
              <div className="flex items-center gap-2 mb-1">
                <FileCheck className="w-4 h-4 text-[#279989]" />
                <span className={`text-xs px-1.5 py-0.5 rounded ${categoryColors[template.category] || 'bg-gray-100'}`}>
                  {template.category.split(' ')[0]}
                </span>
              </div>
              <p className="text-sm font-medium text-gray-900 line-clamp-2">{template.name}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Otsi akte..."
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
          <option value="completed">Täidetud</option>
          <option value="signed">Allkirjastatud</option>
          <option value="sent">Saadetud</option>
        </select>
      </div>

      {/* Acts list */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b text-xs">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Akti number</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Tüüp</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Kategooria</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Kuupäev</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Koostaja</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Staatus</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Allkirjad</th>
              <th className="text-right px-4 py-3 font-medium text-gray-600">Tegevused</th>
            </tr>
          </thead>
          <tbody className="divide-y text-sm">
            {filteredActs.map(act => {
              const statusInfo = statusConfig[act.status]
              return (
                <tr key={act.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className="font-mono font-medium text-gray-900">{act.actNumber}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{act.templateName}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${categoryColors[act.category] || 'bg-gray-100'}`}>
                      {act.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(act.createdAt)}</td>
                  <td className="px-4 py-3 text-gray-600">{act.createdBy}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${statusInfo.bg} ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {act.signatures && act.signatures.length > 0 ? (
                      <span className="text-green-600 text-xs">{act.signatures.length} allkirja</span>
                    ) : (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 hover:bg-gray-100 rounded" title="Vaata">
                        <Eye className="w-4 h-4 text-gray-400" />
                      </button>
                      {act.status === 'draft' && (
                        <button className="p-1.5 hover:bg-gray-100 rounded" title="Muuda">
                          <Edit className="w-4 h-4 text-gray-400" />
                        </button>
                      )}
                      <button
                        onClick={() => generatePDF(act.id)}
                        className="p-1.5 hover:bg-gray-100 rounded"
                        title="Genereeri PDF"
                      >
                        <Download className="w-4 h-4 text-gray-400" />
                      </button>
                      {act.pdfUrl && (
                        <button className="p-1.5 hover:bg-gray-100 rounded" title="Prindi">
                          <Printer className="w-4 h-4 text-gray-400" />
                        </button>
                      )}
                      {(act.status === 'signed' || act.status === 'completed') && (
                        <button className="p-1.5 hover:bg-gray-100 rounded" title="Saada">
                          <Send className="w-4 h-4 text-gray-400" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filteredActs.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Akte ei leitud</p>
          </div>
        )}
      </div>

      {/* Create Act Modal - Template Selection */}
      {showCreateModal && !selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-semibold">Vali akti mall</h2>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {templates.filter(t => t.isActive).map(template => (
                  <button
                    key={template.id}
                    onClick={() => handleSelectTemplate(template)}
                    className="p-4 border rounded-lg hover:border-[#279989] hover:bg-gray-50 text-left transition-colors"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs ${categoryColors[template.category] || 'bg-gray-100'}`}>
                        {template.category}
                      </span>
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                    <h3 className="font-medium text-gray-900 mb-1">{template.name}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2">{template.description}</p>
                    <p className="text-xs text-gray-400 mt-2">{template.fields.length} välja</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Act Modal - Fill Form */}
      {showCreateModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h2 className="text-lg font-semibold">{selectedTemplate.name}</h2>
                <p className="text-sm text-gray-500">Akti number: {generateActNumber()}</p>
              </div>
              <button
                onClick={() => {
                  setSelectedTemplate(null)
                  setFormData({})
                }}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Form fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedTemplate.fields.map(field => (
                  <div key={field.id} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {field.type === 'text' && (
                      <input
                        type="text"
                        placeholder={field.placeholder}
                        value={(formData[field.name] as string) || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    )}
                    {field.type === 'number' && (
                      <input
                        type="number"
                        placeholder={field.placeholder}
                        value={(formData[field.name] as string) || field.defaultValue || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    )}
                    {field.type === 'date' && (
                      <input
                        type="date"
                        value={(formData[field.name] as string) || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    )}
                    {field.type === 'select' && (
                      <select
                        value={(formData[field.name] as string) || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      >
                        <option value="">Vali...</option>
                        {field.options?.map(opt => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    )}
                    {field.type === 'textarea' && (
                      <textarea
                        rows={3}
                        placeholder={field.placeholder}
                        value={(formData[field.name] as string) || ''}
                        onChange={(e) => handleFieldChange(field.name, e.target.value)}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Checklist if available */}
              {selectedTemplate.checklistItems && selectedTemplate.checklistItems.length > 0 && (
                <div className="border-t pt-4">
                  <h3 className="font-medium text-gray-900 mb-3">Kontrollnimekiri</h3>
                  <div className="space-y-2">
                    {selectedTemplate.checklistItems.map((item, idx) => (
                      <label key={idx} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                        <input
                          type="checkbox"
                          checked={checklistState[`check_${idx}`] || false}
                          onChange={(e) => handleChecklistChange(`check_${idx}`, e.target.checked)}
                          className="w-4 h-4 rounded border-gray-300 text-[#279989]"
                        />
                        <span className="text-sm text-gray-700">{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Signature section */}
              <div className="border-t pt-4">
                <h3 className="font-medium text-gray-900 mb-3">Allkirjad</h3>
                <div className="bg-gray-50 rounded-lg p-4 text-center">
                  <FileSignature className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Digitaalallkiri lisatakse pärast akti salvestamist</p>
                </div>
              </div>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-between sticky bottom-0">
              <button
                onClick={() => setSelectedTemplate(null)}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100"
              >
                Tagasi
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handleCreateAct}
                  className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100"
                >
                  Salvesta mustandina
                </button>
                <button
                  onClick={() => {
                    handleCreateAct()
                    // Would trigger PDF generation
                  }}
                  className="px-4 py-2 bg-[#279989] text-white rounded-lg text-sm hover:bg-[#1f7a6d] flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Salvesta ja genereeri PDF
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Templates Management Modal */}
      {showTemplatesModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
              <h2 className="text-lg font-semibold">Aktide mallid</h2>
              <button
                onClick={() => setShowTemplatesModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">Halda aktide malle ja lisa uusi tüüpe</p>
                <button className="px-4 py-2 bg-[#279989] text-white rounded-lg text-sm hover:bg-[#1f7a6d] flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Lisa mall
                </button>
              </div>
              <div className="space-y-3">
                {templates.map(template => (
                  <div
                    key={template.id}
                    className="border rounded-lg p-4 hover:bg-gray-50"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-gray-900">{template.name}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs ${categoryColors[template.category] || 'bg-gray-100'}`}>
                            {template.category}
                          </span>
                          {template.isActive ? (
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">Aktiivne</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs">Mitteaktiivne</span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mb-2">{template.description}</p>
                        <p className="text-xs text-gray-400">
                          {template.fields.length} välja
                          {template.checklistItems && ` • ${template.checklistItems.length} kontrollpunkti`}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="p-2 hover:bg-gray-100 rounded" title="Muuda">
                          <Edit className="w-4 h-4 text-gray-400" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded" title="Kopeeri">
                          <Copy className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
