'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Ruler,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Check,
  GripVertical,
  ChevronDown,
  Globe,
  AlertCircle,
} from 'lucide-react'
import type { QuoteUnit, QuoteUnitCreateInput, UnitCategory } from '@rivest/types'

interface UnitFormData {
  code: string
  nameEt: string
  nameEn: string
  namePluralEt: string
  namePluralEn: string
  symbolEt: string
  symbolEn: string
  category: UnitCategory
  isDefault: boolean
}

const categoryLabels: Record<UnitCategory, { et: string; en: string }> = {
  quantity: { et: 'Kogus', en: 'Quantity' },
  length: { et: 'Pikkus', en: 'Length' },
  area: { et: 'Pindala', en: 'Area' },
  volume: { et: 'Maht', en: 'Volume' },
  weight: { et: 'Kaal', en: 'Weight' },
  time: { et: 'Aeg', en: 'Time' },
}

const defaultFormData: UnitFormData = {
  code: '',
  nameEt: '',
  nameEn: '',
  namePluralEt: '',
  namePluralEn: '',
  symbolEt: '',
  symbolEn: '',
  category: 'quantity',
  isDefault: false,
}

export default function UnitsManager() {
  const [units, setUnits] = useState<QuoteUnit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingUnit, setEditingUnit] = useState<QuoteUnit | null>(null)
  const [formData, setFormData] = useState<UnitFormData>(defaultFormData)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'et' | 'en'>('et')

  const fetchUnits = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/quotes/units')
      if (res.ok) {
        const data = await res.json()
        // Transform API response to match our types
        const transformedUnits: QuoteUnit[] = (data.units || []).map((u: Record<string, unknown>) => ({
          id: u.id as string,
          code: u.code as string,
          name: {
            et: (u.nameEt || u.name || '') as string,
            en: (u.nameEn || u.name || '') as string,
          },
          namePlural: {
            et: (u.namePluralEt || u.namePlural || '') as string,
            en: (u.namePluralEn || '') as string,
          },
          symbol: {
            et: (u.symbolEt || u.symbol || '') as string,
            en: (u.symbolEn || u.symbol || '') as string,
          },
          category: (u.category || 'quantity') as UnitCategory,
          isDefault: u.isDefault as boolean,
          sortOrder: (u.sortOrder || 0) as number,
          isActive: u.isActive !== false,
          conversionFactor: (u.conversionFactor || 1) as number,
          createdAt: u.createdAt as string,
          updatedAt: u.updatedAt as string,
        }))
        setUnits(transformedUnits)
      }
    } catch (err) {
      console.error('Failed to fetch units:', err)
      setError('Ühikute laadimine ebaõnnestus')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchUnits()
  }, [fetchUnits])

  const handleOpenModal = (unit?: QuoteUnit) => {
    if (unit) {
      setEditingUnit(unit)
      setFormData({
        code: unit.code,
        nameEt: unit.name.et,
        nameEn: unit.name.en,
        namePluralEt: unit.namePlural.et,
        namePluralEn: unit.namePlural.en,
        symbolEt: unit.symbol.et,
        symbolEn: unit.symbol.en,
        category: unit.category,
        isDefault: unit.isDefault,
      })
    } else {
      setEditingUnit(null)
      setFormData(defaultFormData)
    }
    setError(null)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingUnit(null)
    setFormData(defaultFormData)
    setError(null)
  }

  const handleSave = async () => {
    if (!formData.code || !formData.nameEt) {
      setError('Kood ja eestikeelne nimetus on kohustuslikud')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const payload = {
        code: formData.code,
        name: formData.nameEt,
        nameEt: formData.nameEt,
        nameEn: formData.nameEn || formData.nameEt,
        namePlural: formData.namePluralEt,
        namePluralEt: formData.namePluralEt,
        namePluralEn: formData.namePluralEn || formData.namePluralEt,
        symbol: formData.symbolEt,
        symbolEt: formData.symbolEt,
        symbolEn: formData.symbolEn || formData.symbolEt,
        category: formData.category,
        isDefault: formData.isDefault,
      }

      const url = editingUnit ? `/api/quotes/units/${editingUnit.id}` : '/api/quotes/units'
      const method = editingUnit ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Salvestamine ebaõnnestus')
      }

      await fetchUnits()
      handleCloseModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Salvestamine ebaõnnestus')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (unit: QuoteUnit) => {
    if (!confirm(`Kas olete kindel, et soovite kustutada ühiku "${unit.name.et}"?`)) {
      return
    }

    try {
      const res = await fetch(`/api/quotes/units/${unit.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Kustutamine ebaõnnestus')
      }
      await fetchUnits()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kustutamine ebaõnnestus')
    }
  }

  const handleToggleActive = async (unit: QuoteUnit) => {
    try {
      const res = await fetch(`/api/quotes/units/${unit.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !unit.isActive }),
      })
      if (!res.ok) {
        throw new Error('Staatuse muutmine ebaõnnestus')
      }
      await fetchUnits()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Staatuse muutmine ebaõnnestus')
    }
  }

  const filteredUnits = units.filter((unit) => {
    const matchesSearch =
      unit.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.name.et.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.name.en.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || unit.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const categories = [...new Set(units.map((u) => u.category))]

  const stats = {
    total: units.length,
    active: units.filter((u) => u.isActive).length,
    categories: categories.length,
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Ühikute haldus</h2>
          <p className="text-sm text-slate-500">Halda mõõtühikuid pakkumiste jaoks (EST/ENG)</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
          style={{ backgroundColor: '#279989' }}
        >
          <Plus className="w-4 h-4" />
          Lisa ühik
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <Ruler className="w-3.5 h-3.5" />
            Ühikuid kokku
          </div>
          <div className="text-xl font-bold text-slate-900">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-green-500 text-xs mb-1">
            <Check className="w-3.5 h-3.5" />
            Aktiivsed
          </div>
          <div className="text-xl font-bold text-green-600">{stats.active}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <Globe className="w-3.5 h-3.5" />
            Kategooriaid
          </div>
          <div className="text-xl font-bold text-slate-900">{stats.categories}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Otsi ühikut..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
          />
        </div>
        <div className="relative">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="appearance-none pl-3 pr-8 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989] bg-white"
          >
            <option value="all">Kõik kategooriad</option>
            {Object.entries(categoryLabels).map(([key, label]) => (
              <option key={key} value={key}>
                {label.et}
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#279989]" />
          </div>
        ) : filteredUnits.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            {searchQuery || categoryFilter !== 'all' ? 'Ühikuid ei leitud' : 'Ühikud puuduvad'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="w-8 px-2 py-3"></th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Kood</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] bg-blue-100 text-blue-700 px-1 rounded">ET</span>
                      Nimetus
                    </div>
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] bg-purple-100 text-purple-700 px-1 rounded">EN</span>
                      Nimetus
                    </div>
                  </th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Lühend</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Kategooria</th>
                  <th className="text-center text-xs font-medium text-slate-500 uppercase px-4 py-3">Staatus</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Tegevused</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUnits.map((unit) => (
                  <tr key={unit.id} className="hover:bg-slate-50 group">
                    <td className="px-2 py-3">
                      <GripVertical className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 cursor-grab" />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-medium text-slate-900">{unit.code}</span>
                      {unit.isDefault && (
                        <span className="ml-2 text-[10px] bg-amber-100 text-amber-700 px-1 rounded">Default</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-900">{unit.name.et}</div>
                      {unit.namePlural.et && <div className="text-xs text-slate-500">{unit.namePlural.et}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-slate-900">{unit.name.en}</div>
                      {unit.namePlural.en && <div className="text-xs text-slate-500">{unit.namePlural.en}</div>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-slate-600">{unit.symbol.et}</span>
                        {unit.symbol.en !== unit.symbol.et && (
                          <>
                            <span className="text-slate-300">/</span>
                            <span className="font-mono text-sm text-slate-600">{unit.symbol.en}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                        {categoryLabels[unit.category]?.et || unit.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleToggleActive(unit)}
                        className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium transition-colors ${
                          unit.isActive ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        {unit.isActive ? 'Aktiivne' : 'Mitteaktiivne'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenModal(unit)}
                          className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                          title="Muuda"
                        >
                          <Edit className="w-4 h-4 text-slate-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(unit)}
                          className="p-1.5 hover:bg-red-50 rounded transition-colors"
                          title="Kustuta"
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto m-4">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingUnit ? 'Muuda ühikut' : 'Lisa uus ühik'}
              </h2>
              <button onClick={handleCloseModal} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Code */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Kood <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="tk, m, kg, h..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989] font-mono"
                  disabled={!!editingUnit}
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kategooria</label>
                <div className="relative">
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as UnitCategory })}
                    className="w-full appearance-none px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989] bg-white"
                  >
                    {Object.entries(categoryLabels).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label.et} ({label.en})
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Language Tabs */}
              <div className="border-b border-slate-200">
                <div className="flex gap-4">
                  <button
                    onClick={() => setActiveTab('et')}
                    className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'et'
                        ? 'border-[#279989] text-[#279989]'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    🇪🇪 Eesti keel
                  </button>
                  <button
                    onClick={() => setActiveTab('en')}
                    className={`pb-2 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'en'
                        ? 'border-[#279989] text-[#279989]'
                        : 'border-transparent text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    🇬🇧 English
                  </button>
                </div>
              </div>

              {/* Estonian Fields */}
              {activeTab === 'et' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Nimetus (ainsus) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.nameEt}
                      onChange={(e) => setFormData({ ...formData, nameEt: e.target.value })}
                      placeholder="tükk, meeter, kilogramm..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nimetus (mitmus)</label>
                    <input
                      type="text"
                      value={formData.namePluralEt}
                      onChange={(e) => setFormData({ ...formData, namePluralEt: e.target.value })}
                      placeholder="tükki, meetrit, kilogrammi..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Lühend</label>
                    <input
                      type="text"
                      value={formData.symbolEt}
                      onChange={(e) => setFormData({ ...formData, symbolEt: e.target.value })}
                      placeholder="tk, m, kg..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989] font-mono"
                    />
                  </div>
                </div>
              )}

              {/* English Fields */}
              {activeTab === 'en' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name (singular)</label>
                    <input
                      type="text"
                      value={formData.nameEn}
                      onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                      placeholder="piece, meter, kilogram..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
                    />
                    <p className="mt-1 text-xs text-slate-500">Kui tühi, kasutatakse eestikeelset nimetust</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name (plural)</label>
                    <input
                      type="text"
                      value={formData.namePluralEn}
                      onChange={(e) => setFormData({ ...formData, namePluralEn: e.target.value })}
                      placeholder="pieces, meters, kilograms..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Abbreviation</label>
                    <input
                      type="text"
                      value={formData.symbolEn}
                      onChange={(e) => setFormData({ ...formData, symbolEn: e.target.value })}
                      placeholder="pcs, m, kg..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989] font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Default checkbox */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-[#279989] focus:ring-[#279989]"
                />
                <span className="text-sm text-slate-700">Vaikimisi ühik</span>
              </label>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 rounded-lg">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={handleCloseModal}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Tühista
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !formData.code || !formData.nameEt}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-colors hover:opacity-90"
                style={{ backgroundColor: '#279989' }}
              >
                {isSaving ? 'Salvestab...' : editingUnit ? 'Salvesta' : 'Lisa ühik'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
