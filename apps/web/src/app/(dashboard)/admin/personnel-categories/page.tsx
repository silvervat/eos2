'use client'

/**
 * Admin - Personnel Categories Management
 * Manage competency types and document types with translations and statistics
 */

import React, { useState, useMemo } from 'react'
import {
  Award,
  FileText,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Languages,
  BarChart3,
  ChevronDown,
  ChevronUp,
  GripVertical,
} from 'lucide-react'

interface CompetencyCategory {
  id: string
  nameEt: string
  nameEn: string
  code: string
  validityYears: number
  isActive: boolean
  stats: {
    total: number
    valid: number
    expiringSoon: number
    expired: number
  }
}

interface DocumentCategory {
  id: string
  nameEt: string
  nameEn: string
  code: string
  requiresExpiry: boolean
  isActive: boolean
  stats: {
    total: number
    valid: number
    expired: number
  }
}

const mockCompetencyCategories: CompetencyCategory[] = [
  { id: '1', nameEt: 'Tulitööde tunnistus', nameEn: 'Hot Work Certificate', code: 'HOT_WORK', validityYears: 5, isActive: true, stats: { total: 8, valid: 6, expiringSoon: 1, expired: 1 } },
  { id: '2', nameEt: 'Elektritööde tunnistus', nameEn: 'Electrical Work Certificate', code: 'ELECTRICAL', validityYears: 5, isActive: true, stats: { total: 5, valid: 4, expiringSoon: 1, expired: 0 } },
  { id: '3', nameEt: 'Esmaabi tunnistus', nameEn: 'First Aid Certificate', code: 'FIRST_AID', validityYears: 3, isActive: true, stats: { total: 12, valid: 8, expiringSoon: 3, expired: 1 } },
  { id: '4', nameEt: 'Tööohutuse tunnistus', nameEn: 'Occupational Safety Certificate', code: 'SAFETY', validityYears: 3, isActive: true, stats: { total: 15, valid: 12, expiringSoon: 2, expired: 1 } },
  { id: '5', nameEt: 'Tõstuki juhi tunnistus', nameEn: 'Forklift Operator License', code: 'FORKLIFT', validityYears: 5, isActive: true, stats: { total: 4, valid: 3, expiringSoon: 1, expired: 0 } },
  { id: '6', nameEt: 'Kraana juhi tunnistus', nameEn: 'Crane Operator License', code: 'CRANE', validityYears: 5, isActive: true, stats: { total: 2, valid: 2, expiringSoon: 0, expired: 0 } },
  { id: '7', nameEt: 'Keevitaja tunnistus', nameEn: 'Welder Certificate', code: 'WELDING', validityYears: 2, isActive: true, stats: { total: 6, valid: 4, expiringSoon: 1, expired: 1 } },
  { id: '8', nameEt: 'F-gaaside tunnistus', nameEn: 'F-Gas Certificate', code: 'F_GAS', validityYears: 5, isActive: true, stats: { total: 3, valid: 3, expiringSoon: 0, expired: 0 } },
  { id: '9', nameEt: 'Kõrgustööde tunnistus', nameEn: 'Working at Heights Certificate', code: 'HEIGHTS', validityYears: 3, isActive: true, stats: { total: 7, valid: 5, expiringSoon: 2, expired: 0 } },
  { id: '10', nameEt: 'ADR tunnistus', nameEn: 'ADR Certificate', code: 'ADR', validityYears: 5, isActive: false, stats: { total: 1, valid: 0, expiringSoon: 0, expired: 1 } },
]

const mockDocumentCategories: DocumentCategory[] = [
  { id: '1', nameEt: 'Isikutunnistuse koopia', nameEn: 'ID Card Copy', code: 'ID_CARD', requiresExpiry: true, isActive: true, stats: { total: 18, valid: 16, expired: 2 } },
  { id: '2', nameEt: 'Passi koopia', nameEn: 'Passport Copy', code: 'PASSPORT', requiresExpiry: true, isActive: true, stats: { total: 5, valid: 5, expired: 0 } },
  { id: '3', nameEt: 'Maksuresidentsuse tõend', nameEn: 'Tax Residency Certificate', code: 'TAX_RESIDENCY', requiresExpiry: false, isActive: true, stats: { total: 12, valid: 12, expired: 0 } },
  { id: '4', nameEt: 'ID06 kaardi koopia', nameEn: 'ID06 Card Copy', code: 'ID06', requiresExpiry: true, isActive: true, stats: { total: 10, valid: 9, expired: 1 } },
  { id: '5', nameEt: 'Tööluba', nameEn: 'Work Permit', code: 'WORK_PERMIT', requiresExpiry: true, isActive: true, stats: { total: 3, valid: 2, expired: 1 } },
  { id: '6', nameEt: 'Tervisetõend', nameEn: 'Health Certificate', code: 'HEALTH_CERT', requiresExpiry: true, isActive: true, stats: { total: 8, valid: 6, expired: 2 } },
  { id: '7', nameEt: 'Juhiloa koopia', nameEn: 'Driving License Copy', code: 'DRIVING_LICENSE', requiresExpiry: true, isActive: true, stats: { total: 14, valid: 13, expired: 1 } },
  { id: '8', nameEt: 'Pangaandmed', nameEn: 'Bank Details', code: 'BANK_DETAILS', requiresExpiry: false, isActive: true, stats: { total: 20, valid: 20, expired: 0 } },
  { id: '9', nameEt: 'Tööleping', nameEn: 'Employment Contract', code: 'CONTRACT', requiresExpiry: false, isActive: true, stats: { total: 22, valid: 22, expired: 0 } },
  { id: '10', nameEt: 'Konfidentsiaalsuskohustus', nameEn: 'Non-Disclosure Agreement', code: 'NDA', requiresExpiry: false, isActive: true, stats: { total: 18, valid: 18, expired: 0 } },
]

type TabType = 'competencies' | 'documents'

export default function PersonnelCategoriesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('competencies')
  const [competencyCategories, setCompetencyCategories] = useState<CompetencyCategory[]>(mockCompetencyCategories)
  const [documentCategories, setDocumentCategories] = useState<DocumentCategory[]>(mockDocumentCategories)
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showInactive, setShowInactive] = useState(false)

  // Form state for adding/editing
  const [formData, setFormData] = useState({
    nameEt: '',
    nameEn: '',
    code: '',
    validityYears: 5,
    requiresExpiry: true,
    isActive: true,
  })

  // Stats summary
  const competencyStats = useMemo(() => {
    const active = competencyCategories.filter(c => c.isActive)
    return {
      categories: active.length,
      totalCerts: active.reduce((sum, c) => sum + c.stats.total, 0),
      validCerts: active.reduce((sum, c) => sum + c.stats.valid, 0),
      expiringSoon: active.reduce((sum, c) => sum + c.stats.expiringSoon, 0),
      expired: active.reduce((sum, c) => sum + c.stats.expired, 0),
    }
  }, [competencyCategories])

  const documentStats = useMemo(() => {
    const active = documentCategories.filter(c => c.isActive)
    return {
      categories: active.length,
      totalDocs: active.reduce((sum, c) => sum + c.stats.total, 0),
      validDocs: active.reduce((sum, c) => sum + c.stats.valid, 0),
      expired: active.reduce((sum, c) => sum + c.stats.expired, 0),
    }
  }, [documentCategories])

  // Filtered categories
  const filteredCompetencies = useMemo(() => {
    return competencyCategories.filter(cat => {
      const matchesSearch = search === '' ||
        cat.nameEt.toLowerCase().includes(search.toLowerCase()) ||
        cat.nameEn.toLowerCase().includes(search.toLowerCase()) ||
        cat.code.toLowerCase().includes(search.toLowerCase())
      const matchesActive = showInactive || cat.isActive
      return matchesSearch && matchesActive
    })
  }, [competencyCategories, search, showInactive])

  const filteredDocuments = useMemo(() => {
    return documentCategories.filter(cat => {
      const matchesSearch = search === '' ||
        cat.nameEt.toLowerCase().includes(search.toLowerCase()) ||
        cat.nameEn.toLowerCase().includes(search.toLowerCase()) ||
        cat.code.toLowerCase().includes(search.toLowerCase())
      const matchesActive = showInactive || cat.isActive
      return matchesSearch && matchesActive
    })
  }, [documentCategories, search, showInactive])

  const handleAddNew = () => {
    setFormData({
      nameEt: '',
      nameEn: '',
      code: '',
      validityYears: 5,
      requiresExpiry: true,
      isActive: true,
    })
    setEditingId(null)
    setShowAddModal(true)
  }

  const handleEdit = (id: string) => {
    if (activeTab === 'competencies') {
      const cat = competencyCategories.find(c => c.id === id)
      if (cat) {
        setFormData({
          nameEt: cat.nameEt,
          nameEn: cat.nameEn,
          code: cat.code,
          validityYears: cat.validityYears,
          requiresExpiry: true,
          isActive: cat.isActive,
        })
      }
    } else {
      const cat = documentCategories.find(c => c.id === id)
      if (cat) {
        setFormData({
          nameEt: cat.nameEt,
          nameEn: cat.nameEn,
          code: cat.code,
          validityYears: 0,
          requiresExpiry: cat.requiresExpiry,
          isActive: cat.isActive,
        })
      }
    }
    setEditingId(id)
    setShowAddModal(true)
  }

  const handleSave = () => {
    if (activeTab === 'competencies') {
      if (editingId) {
        setCompetencyCategories(cats => cats.map(c =>
          c.id === editingId
            ? { ...c, nameEt: formData.nameEt, nameEn: formData.nameEn, code: formData.code, validityYears: formData.validityYears, isActive: formData.isActive }
            : c
        ))
      } else {
        const newCat: CompetencyCategory = {
          id: String(competencyCategories.length + 1),
          nameEt: formData.nameEt,
          nameEn: formData.nameEn,
          code: formData.code,
          validityYears: formData.validityYears,
          isActive: formData.isActive,
          stats: { total: 0, valid: 0, expiringSoon: 0, expired: 0 },
        }
        setCompetencyCategories([...competencyCategories, newCat])
      }
    } else {
      if (editingId) {
        setDocumentCategories(cats => cats.map(c =>
          c.id === editingId
            ? { ...c, nameEt: formData.nameEt, nameEn: formData.nameEn, code: formData.code, requiresExpiry: formData.requiresExpiry, isActive: formData.isActive }
            : c
        ))
      } else {
        const newCat: DocumentCategory = {
          id: String(documentCategories.length + 1),
          nameEt: formData.nameEt,
          nameEn: formData.nameEn,
          code: formData.code,
          requiresExpiry: formData.requiresExpiry,
          isActive: formData.isActive,
          stats: { total: 0, valid: 0, expired: 0 },
        }
        setDocumentCategories([...documentCategories, newCat])
      }
    }
    setShowAddModal(false)
    setEditingId(null)
  }

  const toggleActive = (id: string) => {
    if (activeTab === 'competencies') {
      setCompetencyCategories(cats => cats.map(c =>
        c.id === id ? { ...c, isActive: !c.isActive } : c
      ))
    } else {
      setDocumentCategories(cats => cats.map(c =>
        c.id === id ? { ...c, isActive: !c.isActive } : c
      ))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Personali kategooriad</h1>
          <p className="text-gray-500">Kompetentside ja dokumentide kategooriate haldus</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('competencies')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'competencies'
                ? 'border-[#279989] text-[#279989]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Award className="w-4 h-4" />
            Kompetentsid
            <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
              {competencyCategories.filter(c => c.isActive).length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`pb-3 px-1 border-b-2 font-medium text-sm flex items-center gap-2 transition-colors ${
              activeTab === 'documents'
                ? 'border-[#279989] text-[#279989]'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            Dokumendid
            <span className="px-2 py-0.5 bg-gray-100 rounded-full text-xs">
              {documentCategories.filter(c => c.isActive).length}
            </span>
          </button>
        </div>
      </div>

      {/* Stats summary */}
      {activeTab === 'competencies' ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-500">Kategooriaid</p>
            <p className="text-2xl font-bold text-gray-800">{competencyStats.categories}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-500">Tunnistusi kokku</p>
            <p className="text-2xl font-bold text-gray-800">{competencyStats.totalCerts}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-500">Kehtivaid</p>
            <p className="text-2xl font-bold text-green-600">{competencyStats.validCerts}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-500">Aegub varsti</p>
            <p className="text-2xl font-bold text-orange-600">{competencyStats.expiringSoon}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-500">Aegunud</p>
            <p className="text-2xl font-bold text-red-600">{competencyStats.expired}</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-500">Kategooriaid</p>
            <p className="text-2xl font-bold text-gray-800">{documentStats.categories}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-500">Dokumente kokku</p>
            <p className="text-2xl font-bold text-gray-800">{documentStats.totalDocs}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-500">Kehtivaid</p>
            <p className="text-2xl font-bold text-green-600">{documentStats.validDocs}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border">
            <p className="text-sm text-gray-500">Aegunud</p>
            <p className="text-2xl font-bold text-red-600">{documentStats.expired}</p>
          </div>
        </div>
      )}

      {/* Filters and actions */}
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Otsi kategooriaid..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-lg text-sm w-64"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded"
            />
            Näita mitteaktiivseid
          </label>
        </div>
        <button
          onClick={handleAddNew}
          className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Lisa kategooria
        </button>
      </div>

      {/* Categories table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Kood</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                <div className="flex items-center gap-1">
                  Nimetus (ET)
                </div>
              </th>
              <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                <div className="flex items-center gap-1">
                  <Languages className="w-3 h-3" />
                  Nimetus (EN)
                </div>
              </th>
              {activeTab === 'competencies' && (
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Kehtivus</th>
              )}
              {activeTab === 'documents' && (
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Aegub?</th>
              )}
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                <div className="flex items-center justify-center gap-1">
                  <BarChart3 className="w-3 h-3" />
                  Statistika
                </div>
              </th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">Staatus</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">Tegevused</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {activeTab === 'competencies' ? (
              filteredCompetencies.map(cat => (
                <tr key={cat.id} className={`hover:bg-gray-50 ${!cat.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{cat.code}</code>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{cat.nameEt}</td>
                  <td className="px-4 py-3 text-gray-600">{cat.nameEn}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm">{cat.validityYears} a</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                        {cat.stats.total}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                        <CheckCircle2 className="w-3 h-3" />
                        {cat.stats.valid}
                      </span>
                      {cat.stats.expiringSoon > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                          <Clock className="w-3 h-3" />
                          {cat.stats.expiringSoon}
                        </span>
                      )}
                      {cat.stats.expired > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                          <AlertTriangle className="w-3 h-3" />
                          {cat.stats.expired}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(cat.id)}
                      className={`px-2 py-1 rounded text-xs ${
                        cat.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {cat.isActive ? 'Aktiivne' : 'Mitteaktiivne'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleEdit(cat.id)}
                      className="p-1.5 hover:bg-gray-100 rounded"
                    >
                      <Edit className="w-4 h-4 text-gray-400" />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              filteredDocuments.map(cat => (
                <tr key={cat.id} className={`hover:bg-gray-50 ${!cat.isActive ? 'opacity-50' : ''}`}>
                  <td className="px-4 py-3">
                    <code className="text-xs bg-gray-100 px-2 py-1 rounded">{cat.code}</code>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{cat.nameEt}</td>
                  <td className="px-4 py-3 text-gray-600">{cat.nameEn}</td>
                  <td className="px-4 py-3 text-center">
                    {cat.requiresExpiry ? (
                      <span className="text-green-600">Jah</span>
                    ) : (
                      <span className="text-gray-400">Ei</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                        {cat.stats.total}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                        <CheckCircle2 className="w-3 h-3" />
                        {cat.stats.valid}
                      </span>
                      {cat.stats.expired > 0 && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                          <AlertTriangle className="w-3 h-3" />
                          {cat.stats.expired}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(cat.id)}
                      className={`px-2 py-1 rounded text-xs ${
                        cat.isActive
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {cat.isActive ? 'Aktiivne' : 'Mitteaktiivne'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleEdit(cat.id)}
                      className="p-1.5 hover:bg-gray-100 rounded"
                    >
                      <Edit className="w-4 h-4 text-gray-400" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {((activeTab === 'competencies' && filteredCompetencies.length === 0) ||
          (activeTab === 'documents' && filteredDocuments.length === 0)) && (
          <div className="text-center py-12">
            <p className="text-gray-500">Kategooriaid ei leitud</p>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="bg-gray-50 rounded-lg p-4 border">
        <h3 className="text-sm font-medium text-gray-700 mb-2">Statistika selgitus</h3>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded">
            Kokku kirjeid
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded">
            <CheckCircle2 className="w-3 h-3" />
            Kehtivad
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 rounded">
            <Clock className="w-3 h-3" />
            Aegub 90p jooksul
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 rounded">
            <AlertTriangle className="w-3 h-3" />
            Aegunud
          </span>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                {editingId ? 'Muuda kategooriat' : 'Lisa uus kategooria'}
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kood <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase().replace(/\s/g, '_') })}
                  placeholder="Nt. HOT_WORK"
                  className="w-full px-3 py-2 border rounded-lg text-sm font-mono"
                />
                <p className="text-xs text-gray-500 mt-1">Ainult suured tähed ja alakriipsud</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nimetus (eesti keeles) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.nameEt}
                  onChange={(e) => setFormData({ ...formData, nameEt: e.target.value })}
                  placeholder="Nt. Tulitööde tunnistus"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <span className="flex items-center gap-1">
                    <Languages className="w-4 h-4" />
                    Nimetus (inglise keeles) <span className="text-red-500">*</span>
                  </span>
                </label>
                <input
                  type="text"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  placeholder="E.g. Hot Work Certificate"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              {activeTab === 'competencies' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kehtivusaeg (aastates)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={formData.validityYears}
                    onChange={(e) => setFormData({ ...formData, validityYears: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              )}
              {activeTab === 'documents' && (
                <div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={formData.requiresExpiry}
                      onChange={(e) => setFormData({ ...formData, requiresExpiry: e.target.checked })}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Dokument aegub (nõuab aegumiskuupäeva)</span>
                  </label>
                </div>
              )}
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Kategooria on aktiivne</span>
                </label>
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100"
              >
                Tühista
              </button>
              <button
                onClick={handleSave}
                disabled={!formData.nameEt || !formData.nameEn || !formData.code}
                className="px-4 py-2 bg-[#279989] text-white rounded-lg text-sm hover:bg-[#1f7a6d] disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Salvesta
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
