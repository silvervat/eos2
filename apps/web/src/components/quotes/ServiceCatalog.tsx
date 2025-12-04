'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Package,
  Plus,
  Search,
  Edit,
  Trash2,
  X,
  Tag,
  Euro,
  TrendingUp,
  TrendingDown,
  BarChart3,
  AlertCircle,
  ChevronDown,
  FileText,
  Clock,
  Sparkles,
  GripVertical,
  Upload,
  Download,
} from 'lucide-react'
import type { QuoteArticle, QuoteUnit, UnitCategory } from '@rivest/types'

interface ArticleFormData {
  code: string
  nameEt: string
  nameEn: string
  descriptionEt: string
  descriptionEn: string
  category: string
  unitId: string
  defaultPrice: number
  costPrice: number
  vatRate: number
}

interface PriceStats {
  minPrice: number
  maxPrice: number
  avgPrice: number
  lastUsedPrice: number | null
  usageCount: number
  lastUsedAt: string | null
  totalRevenue: number
}

const defaultFormData: ArticleFormData = {
  code: '',
  nameEt: '',
  nameEn: '',
  descriptionEt: '',
  descriptionEn: '',
  category: '',
  unitId: '',
  defaultPrice: 0,
  costPrice: 0,
  vatRate: 22,
}

interface ServiceCatalogProps {
  onSelectArticle?: (article: QuoteArticle) => void
  selectable?: boolean
  language?: 'et' | 'en'
  compact?: boolean
}

export default function ServiceCatalog({
  onSelectArticle,
  selectable = false,
  language = 'et',
  compact = false
}: ServiceCatalogProps) {
  const [articles, setArticles] = useState<QuoteArticle[]>([])
  const [units, setUnits] = useState<QuoteUnit[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showModal, setShowModal] = useState(false)
  const [editingArticle, setEditingArticle] = useState<QuoteArticle | null>(null)
  const [formData, setFormData] = useState<ArticleFormData>(defaultFormData)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'et' | 'en'>('et')
  const [newCategory, setNewCategory] = useState('')
  const [showPriceStats, setShowPriceStats] = useState<string | null>(null)

  const fetchArticles = useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await fetch('/api/quotes/articles')
      if (res.ok) {
        const data = await res.json()
        const transformedArticles: QuoteArticle[] = (data.articles || []).map((a: Record<string, unknown>) => ({
          id: a.id as string,
          code: a.code as string,
          name: {
            et: (a.nameEt || a.name || '') as string,
            en: (a.nameEn || a.name || '') as string,
          },
          description: {
            et: (a.descriptionEt || a.description || '') as string,
            en: (a.descriptionEn || '') as string,
          },
          category: (a.category || '') as string,
          unitId: (a.unitId || '') as string,
          unitCode: (a.unitCode || a.unit || '') as string,
          unitName: a.unitName as { et: string; en: string } | undefined,
          defaultPrice: (a.defaultPrice || a.default_price || 0) as number,
          costPrice: (a.costPrice || a.cost_price || 0) as number,
          vatRate: (a.vatRate || a.vat_rate || 22) as number,
          priceStats: {
            basePrice: (a.defaultPrice || 0) as number,
            minPrice: (a.minPrice || a.min_price || a.defaultPrice || 0) as number,
            maxPrice: (a.maxPrice || a.max_price || a.defaultPrice || 0) as number,
            avgPrice: (a.avgPrice || a.avg_price || a.defaultPrice || 0) as number,
            lastUsedPrice: (a.lastUsedPrice || a.last_used_price || null) as number | null,
            usageCount: (a.usageCount || a.usage_count || 0) as number,
            lastUsedAt: (a.lastUsedAt || a.last_used_at || null) as string | null,
            totalRevenue: (a.totalRevenue || a.total_revenue || 0) as number,
          },
          isActive: a.isActive !== false && a.is_active !== false,
          createdAt: a.createdAt as string || a.created_at as string,
          updatedAt: a.updatedAt as string || a.updated_at as string,
        }))
        setArticles(transformedArticles)

        // Extract unique categories
        const cats = [...new Set(transformedArticles.map((a) => a.category).filter(Boolean))]
        setCategories(cats)
      }
    } catch (err) {
      console.error('Failed to fetch articles:', err)
      setError('Artiklite laadimine ebaõnnestus')
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchUnits = useCallback(async () => {
    try {
      const res = await fetch('/api/quotes/units')
      if (res.ok) {
        const data = await res.json()
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
    }
  }, [])

  useEffect(() => {
    fetchArticles()
    fetchUnits()
  }, [fetchArticles, fetchUnits])

  const handleOpenModal = (article?: QuoteArticle) => {
    if (article) {
      setEditingArticle(article)
      setFormData({
        code: article.code,
        nameEt: article.name.et,
        nameEn: article.name.en,
        descriptionEt: article.description.et,
        descriptionEn: article.description.en,
        category: article.category,
        unitId: article.unitId,
        defaultPrice: article.defaultPrice,
        costPrice: article.costPrice || 0,
        vatRate: article.vatRate,
      })
    } else {
      setEditingArticle(null)
      setFormData(defaultFormData)
    }
    setError(null)
    setNewCategory('')
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingArticle(null)
    setFormData(defaultFormData)
    setError(null)
    setNewCategory('')
  }

  const handleSave = async () => {
    if (!formData.code || !formData.nameEt) {
      setError('Kood ja eestikeelne nimetus on kohustuslikud')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const categoryToUse = newCategory || formData.category

      const payload = {
        code: formData.code,
        name: formData.nameEt,
        nameEt: formData.nameEt,
        nameEn: formData.nameEn || formData.nameEt,
        description: formData.descriptionEt,
        descriptionEt: formData.descriptionEt,
        descriptionEn: formData.descriptionEn || formData.descriptionEt,
        category: categoryToUse,
        unitId: formData.unitId,
        unit: units.find(u => u.id === formData.unitId)?.code || 'tk',
        defaultPrice: formData.defaultPrice,
        costPrice: formData.costPrice,
        vatRate: formData.vatRate,
      }

      const url = editingArticle ? `/api/quotes/articles/${editingArticle.id}` : '/api/quotes/articles'
      const method = editingArticle ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Salvestamine ebaõnnestus')
      }

      await fetchArticles()
      handleCloseModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Salvestamine ebaõnnestus')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (article: QuoteArticle) => {
    if (!confirm(`Kas olete kindel, et soovite kustutada artikli "${article.name.et}"?`)) {
      return
    }

    try {
      const res = await fetch(`/api/quotes/articles/${article.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Kustutamine ebaõnnestus')
      }
      await fetchArticles()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kustutamine ebaõnnestus')
    }
  }

  const handleSelect = (article: QuoteArticle) => {
    if (onSelectArticle) {
      onSelectArticle(article)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('et-EE', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const formatDate = (date: string | null) => {
    if (!date) return '-'
    return new Date(date).toLocaleDateString('et-EE')
  }

  const filteredArticles = articles.filter((article) => {
    const searchLower = searchQuery.toLowerCase()
    const matchesSearch =
      article.code.toLowerCase().includes(searchLower) ||
      article.name.et.toLowerCase().includes(searchLower) ||
      article.name.en.toLowerCase().includes(searchLower) ||
      article.description.et.toLowerCase().includes(searchLower)
    const matchesCategory = categoryFilter === 'all' || article.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const stats = {
    total: articles.length,
    active: articles.filter((a) => a.isActive).length,
    categories: categories.length,
    avgPrice: articles.length > 0
      ? articles.reduce((sum, a) => sum + a.defaultPrice, 0) / articles.length
      : 0,
  }

  const getPriceIndicator = (article: QuoteArticle) => {
    const { priceStats, defaultPrice } = article
    if (!priceStats.avgPrice || priceStats.usageCount === 0) return null

    const diff = ((defaultPrice - priceStats.avgPrice) / priceStats.avgPrice) * 100
    if (Math.abs(diff) < 5) return null

    return diff > 0 ? (
      <span className="flex items-center text-amber-500 text-xs" title={`${diff.toFixed(0)}% kõrgem kui keskmine`}>
        <TrendingUp className="w-3 h-3 mr-0.5" />
      </span>
    ) : (
      <span className="flex items-center text-green-500 text-xs" title={`${Math.abs(diff).toFixed(0)}% madalam kui keskmine`}>
        <TrendingDown className="w-3 h-3 mr-0.5" />
      </span>
    )
  }

  if (compact) {
    return (
      <div className="space-y-2">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Otsi artiklit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
          />
        </div>

        <div className="max-h-64 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
          {filteredArticles.map((article) => (
            <button
              key={article.id}
              onClick={() => handleSelect(article)}
              className="w-full px-3 py-2 text-left hover:bg-slate-50 flex items-center gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-slate-500">{article.code}</span>
                  <span className="text-sm font-medium text-slate-900 truncate">
                    {language === 'et' ? article.name.et : article.name.en}
                  </span>
                </div>
                {article.priceStats.usageCount > 0 && (
                  <div className="text-xs text-slate-500 mt-0.5">
                    Keskmine: {formatCurrency(article.priceStats.avgPrice)} ({article.priceStats.usageCount}x)
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-slate-900">{formatCurrency(article.defaultPrice)}</div>
                <div className="text-xs text-slate-500">{article.unitCode}</div>
              </div>
            </button>
          ))}
          {filteredArticles.length === 0 && (
            <div className="px-3 py-8 text-center text-sm text-slate-500">Artikleid ei leitud</div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Teenuste kataloog</h2>
          <p className="text-sm text-slate-500">Halda artikleid ja teenuseid hinnasoovitustega</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Download className="w-4 h-4" />
            Eksport
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
            style={{ backgroundColor: '#279989' }}
          >
            <Plus className="w-4 h-4" />
            Lisa artikkel
          </button>
        </div>
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <Package className="w-3.5 h-3.5" />
            Artikleid kokku
          </div>
          <div className="text-xl font-bold text-slate-900">{stats.total}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-green-500 text-xs mb-1">
            <FileText className="w-3.5 h-3.5" />
            Aktiivsed
          </div>
          <div className="text-xl font-bold text-green-600">{stats.active}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <Tag className="w-3.5 h-3.5" />
            Kategooriaid
          </div>
          <div className="text-xl font-bold text-slate-900">{stats.categories}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1">
            <Euro className="w-3.5 h-3.5" />
            Keskmine hind
          </div>
          <div className="text-lg font-bold text-slate-900">{formatCurrency(stats.avgPrice)}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Otsi artiklit..."
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
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
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
        ) : filteredArticles.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            {searchQuery || categoryFilter !== 'all' ? 'Artikleid ei leitud' : 'Artiklid puuduvad'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="w-8 px-2 py-3"></th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Kood</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Nimetus</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Kategooria</th>
                  <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Ühik</th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Hind</th>
                  <th className="text-center text-xs font-medium text-slate-500 uppercase px-4 py-3">
                    <span className="flex items-center justify-center gap-1">
                      <BarChart3 className="w-3.5 h-3.5" />
                      Statistika
                    </span>
                  </th>
                  <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Tegevused</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredArticles.map((article) => (
                  <tr
                    key={article.id}
                    className={`hover:bg-slate-50 group ${selectable ? 'cursor-pointer' : ''}`}
                    onClick={selectable ? () => handleSelect(article) : undefined}
                  >
                    <td className="px-2 py-3">
                      <GripVertical className="w-4 h-4 text-slate-300 opacity-0 group-hover:opacity-100 cursor-grab" />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm text-slate-900">{article.code}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="max-w-xs">
                        <div className="text-sm font-medium text-slate-900">{article.name.et}</div>
                        {article.name.en !== article.name.et && (
                          <div className="text-xs text-slate-500">{article.name.en}</div>
                        )}
                        {article.description.et && (
                          <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">{article.description.et}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {article.category && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                          <Tag className="w-3 h-3" />
                          {article.category}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{article.unitCode || '-'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {getPriceIndicator(article)}
                        <span className="text-sm font-medium text-slate-900">{formatCurrency(article.defaultPrice)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setShowPriceStats(showPriceStats === article.id ? null : article.id)
                          }}
                          className="flex items-center justify-center gap-1 px-2 py-1 text-xs text-slate-600 hover:bg-slate-100 rounded transition-colors w-full"
                        >
                          <span className="text-slate-900">{article.priceStats.usageCount}x</span>
                          {article.priceStats.usageCount > 0 && (
                            <>
                              <span className="text-slate-400">|</span>
                              <span className="text-green-600">{formatCurrency(article.priceStats.avgPrice)}</span>
                            </>
                          )}
                        </button>

                        {/* Price stats popup */}
                        {showPriceStats === article.id && (
                          <div className="absolute z-10 right-0 top-full mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-left">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-medium text-slate-500 uppercase">Hinnastatistika</span>
                              <button onClick={(e) => { e.stopPropagation(); setShowPriceStats(null) }}>
                                <X className="w-3.5 h-3.5 text-slate-400" />
                              </button>
                            </div>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-slate-600">Min hind:</span>
                                <span className="font-medium text-slate-900">{formatCurrency(article.priceStats.minPrice)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">Max hind:</span>
                                <span className="font-medium text-slate-900">{formatCurrency(article.priceStats.maxPrice)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-600">Keskmine:</span>
                                <span className="font-medium text-green-600">{formatCurrency(article.priceStats.avgPrice)}</span>
                              </div>
                              <hr className="border-slate-100" />
                              <div className="flex justify-between">
                                <span className="text-slate-600">Kasutatud:</span>
                                <span className="font-medium text-slate-900">{article.priceStats.usageCount} korda</span>
                              </div>
                              {article.priceStats.lastUsedPrice && (
                                <div className="flex justify-between">
                                  <span className="text-slate-600">Viimane hind:</span>
                                  <span className="font-medium text-slate-900">{formatCurrency(article.priceStats.lastUsedPrice)}</span>
                                </div>
                              )}
                              {article.priceStats.lastUsedAt && (
                                <div className="flex justify-between">
                                  <span className="text-slate-600">Viimati:</span>
                                  <span className="font-medium text-slate-900">{formatDate(article.priceStats.lastUsedAt)}</span>
                                </div>
                              )}
                              <hr className="border-slate-100" />
                              <div className="flex justify-between">
                                <span className="text-slate-600">Kogutulu:</span>
                                <span className="font-medium text-slate-900">{formatCurrency(article.priceStats.totalRevenue)}</span>
                              </div>
                            </div>
                            {article.priceStats.usageCount > 0 && (
                              <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700 flex items-start gap-2">
                                <Sparkles className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                <span>Soovitatud hind: <strong>{formatCurrency(article.priceStats.avgPrice)}</strong> (keskmine {article.priceStats.usageCount} kasutuse põhjal)</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenModal(article) }}
                          className="p-1.5 hover:bg-slate-100 rounded transition-colors"
                          title="Muuda"
                        >
                          <Edit className="w-4 h-4 text-slate-500" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(article) }}
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
          <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingArticle ? 'Muuda artiklit' : 'Lisa uus artikkel'}
              </h2>
              <button onClick={handleCloseModal} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Kood <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="TP101, MNT-01..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989] font-mono"
                    disabled={!!editingArticle}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kategooria</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full appearance-none px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989] bg-white"
                        disabled={!!newCategory}
                      >
                        <option value="">Vali kategooria...</option>
                        {categories.map((cat) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                      <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    <input
                      type="text"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      placeholder="Uus..."
                      className="w-24 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
                    />
                  </div>
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
                      Nimetus <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.nameEt}
                      onChange={(e) => setFormData({ ...formData, nameEt: e.target.value })}
                      placeholder="Teenuse või toote nimetus..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Kirjeldus</label>
                    <textarea
                      value={formData.descriptionEt}
                      onChange={(e) => setFormData({ ...formData, descriptionEt: e.target.value })}
                      placeholder="Detailne kirjeldus..."
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989] resize-none"
                    />
                  </div>
                </div>
              )}

              {/* English Fields */}
              {activeTab === 'en' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                    <input
                      type="text"
                      value={formData.nameEn}
                      onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                      placeholder="Service or product name..."
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
                    />
                    <p className="mt-1 text-xs text-slate-500">Kui tühi, kasutatakse eestikeelset nimetust</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                    <textarea
                      value={formData.descriptionEn}
                      onChange={(e) => setFormData({ ...formData, descriptionEn: e.target.value })}
                      placeholder="Detailed description..."
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989] resize-none"
                    />
                  </div>
                </div>
              )}

              {/* Pricing */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Ühik</label>
                  <div className="relative">
                    <select
                      value={formData.unitId}
                      onChange={(e) => setFormData({ ...formData, unitId: e.target.value })}
                      className="w-full appearance-none px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989] bg-white"
                    >
                      <option value="">Vali...</option>
                      {units.filter(u => u.isActive).map((unit) => (
                        <option key={unit.id} value={unit.id}>{unit.code} - {unit.name.et}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Hind (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.defaultPrice}
                    onChange={(e) => setFormData({ ...formData, defaultPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Omahind (€)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.costPrice}
                    onChange={(e) => setFormData({ ...formData, costPrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">KM %</label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="100"
                    value={formData.vatRate}
                    onChange={(e) => setFormData({ ...formData, vatRate: parseInt(e.target.value) || 22 })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
                  />
                </div>
              </div>

              {/* Price suggestion for existing articles */}
              {editingArticle && editingArticle.priceStats.usageCount > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-700">
                    <div className="font-medium">Hinnasoovitus</div>
                    <div className="mt-1">
                      Keskmine hind {editingArticle.priceStats.usageCount} kasutuse põhjal: <strong>{formatCurrency(editingArticle.priceStats.avgPrice)}</strong>
                    </div>
                    <div className="text-xs mt-1 text-blue-600">
                      Vahemik: {formatCurrency(editingArticle.priceStats.minPrice)} - {formatCurrency(editingArticle.priceStats.maxPrice)}
                    </div>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, defaultPrice: editingArticle.priceStats.avgPrice })}
                      className="mt-2 text-xs font-medium text-blue-700 hover:text-blue-800 underline"
                    >
                      Kasuta keskmist hinda
                    </button>
                  </div>
                </div>
              )}

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
                {isSaving ? 'Salvestab...' : editingArticle ? 'Salvesta' : 'Lisa artikkel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
