'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Plus,
  Trash2,
  X,
  Save,
  Send,
  FileText,
  Building2,
  User,
  Calendar,
  Euro,
  ChevronDown,
  ChevronUp,
  GripVertical,
  AlertCircle,
  Package,
  RefreshCw,
  Globe,
  Copy,
  Eye,
  Sparkles,
} from 'lucide-react'
import { QuoteStatusTimeline, StatusBadge } from './QuoteStatusTimeline'
import ServiceCatalog from './ServiceCatalog'
import type {
  Quote,
  QuoteItem,
  QuoteItemGroup,
  QuoteArticle,
  QuoteUnit,
  QuoteLanguage,
  QuoteStatus,
  TranslatableText,
  UnitCategory,
} from '@rivest/types'

interface QuoteEditorProps {
  quoteId?: string
  onSave?: (quote: Quote) => void
  onClose?: () => void
}

interface Company {
  id: string
  name: string
}

interface Contact {
  id: string
  name: string
  email: string
}

interface Project {
  id: string
  code: string
  name: string
}

interface LocalQuoteItem {
  id: string
  tempId?: string
  groupId?: string
  articleId?: string
  position: number
  code: string
  nameEt: string
  nameEn: string
  descriptionEt: string
  descriptionEn: string
  quantity: number
  unitId: string
  unitCode: string
  unitPrice: number
  discountPercent: number
  vatRate: number
  subtotal: number
  vatAmount: number
  total: number
  notesEt: string
  notesEn: string
}

export default function QuoteEditor({ quoteId, onSave, onClose }: QuoteEditorProps) {
  // Quote data
  const [quoteNumber, setQuoteNumber] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [language, setLanguage] = useState<QuoteLanguage>('et')
  const [status, setStatus] = useState<QuoteStatus>('draft')
  const [validDays, setValidDays] = useState(30)
  const [validUntil, setValidUntil] = useState('')
  const [companyId, setCompanyId] = useState('')
  const [contactId, setContactId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [notesEt, setNotesEt] = useState('')
  const [notesEn, setNotesEn] = useState('')
  const [termsEt, setTermsEt] = useState('')
  const [termsEn, setTermsEn] = useState('')
  const [internalNotes, setInternalNotes] = useState('')

  // Items
  const [items, setItems] = useState<LocalQuoteItem[]>([])

  // Reference data
  const [companies, setCompanies] = useState<Company[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [units, setUnits] = useState<QuoteUnit[]>([])

  // UI state
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showArticlePicker, setShowArticlePicker] = useState(false)
  const [expandedSections, setExpandedSections] = useState({
    details: true,
    items: true,
    notes: false,
    terms: false,
  })

  // Calculated totals
  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0)
  const totalVat = items.reduce((sum, item) => sum + item.vatAmount, 0)
  const total = items.reduce((sum, item) => sum + item.total, 0)

  // Load reference data
  useEffect(() => {
    const loadReferenceData = async () => {
      try {
        const [companiesRes, projectsRes, unitsRes] = await Promise.all([
          fetch('/api/companies'),
          fetch('/api/projects'),
          fetch('/api/quotes/units'),
        ])

        if (companiesRes.ok) {
          const data = await companiesRes.json()
          setCompanies(data.companies || [])
        }

        if (projectsRes.ok) {
          const data = await projectsRes.json()
          setProjects(data.projects || [])
        }

        if (unitsRes.ok) {
          const data = await unitsRes.json()
          const transformedUnits: QuoteUnit[] = (data.units || []).map((u: Record<string, unknown>) => ({
            id: u.id as string,
            code: u.code as string,
            name: {
              et: (u.nameEt || u.name || '') as string,
              en: (u.nameEn || u.name || '') as string,
            },
            namePlural: {
              et: (u.namePluralEt || '') as string,
              en: (u.namePluralEn || '') as string,
            },
            symbol: {
              et: (u.symbolEt || u.symbol || '') as string,
              en: (u.symbolEn || u.symbol || '') as string,
            },
            category: (u.category || 'quantity') as UnitCategory,
            isDefault: u.isDefault as boolean,
            sortOrder: 0,
            isActive: true,
            conversionFactor: 1,
            createdAt: '',
            updatedAt: '',
          }))
          setUnits(transformedUnits)
        }
      } catch (err) {
        console.error('Failed to load reference data:', err)
      }
    }

    loadReferenceData()
  }, [])

  // Load quote if editing
  useEffect(() => {
    const loadQuote = async () => {
      if (!quoteId) {
        // Generate new quote number
        try {
          const res = await fetch('/api/quotes/generate-number')
          if (res.ok) {
            const data = await res.json()
            setQuoteNumber(data.quoteNumber)
          }
        } catch {
          // Fallback
          const year = new Date().getFullYear()
          setQuoteNumber(`${year}-001-R1`)
        }
        setIsLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/quotes/${quoteId}`)
        if (res.ok) {
          const data = await res.json()
          const quote = data.quote

          setQuoteNumber(quote.quoteNumber || quote.quote_number)
          setTitle(quote.title || '')
          setDescription(quote.description || '')
          setLanguage(quote.language || 'et')
          setStatus(quote.status || 'draft')
          setValidDays(quote.validDays || quote.valid_days || 30)
          setValidUntil(quote.validUntil || quote.valid_until || '')
          setCompanyId(quote.companyId || quote.company_id || '')
          setContactId(quote.contactId || quote.contact_id || '')
          setProjectId(quote.projectId || quote.project_id || '')
          setNotesEt(quote.notesEt || quote.notes || '')
          setNotesEn(quote.notesEn || '')
          setTermsEt(quote.termsEt || quote.terms_and_conditions || '')
          setTermsEn(quote.termsEn || '')
          setInternalNotes(quote.internalNotes || quote.internal_notes || '')

          // Load items
          if (data.items) {
            const loadedItems: LocalQuoteItem[] = data.items.map((item: Record<string, unknown>, index: number) => ({
              id: item.id as string,
              groupId: item.groupId as string,
              articleId: item.articleId as string,
              position: (item.position || index) as number,
              code: (item.code || '') as string,
              nameEt: (item.nameEt || item.name || '') as string,
              nameEn: (item.nameEn || '') as string,
              descriptionEt: (item.descriptionEt || item.description || '') as string,
              descriptionEn: (item.descriptionEn || '') as string,
              quantity: (item.quantity || 1) as number,
              unitId: (item.unitId || item.unit_id || '') as string,
              unitCode: (item.unitCode || item.unit || 'tk') as string,
              unitPrice: (item.unitPrice || item.unit_price || 0) as number,
              discountPercent: (item.discountPercent || item.discount_percent || 0) as number,
              vatRate: (item.vatRate || item.vat_rate || 22) as number,
              subtotal: (item.subtotal || 0) as number,
              vatAmount: (item.vatAmount || item.vat_amount || 0) as number,
              total: (item.total || 0) as number,
              notesEt: (item.notesEt || item.notes || '') as string,
              notesEn: (item.notesEn || '') as string,
            }))
            setItems(loadedItems)
          }
        }
      } catch (err) {
        console.error('Failed to load quote:', err)
        setError('Pakkumise laadimine ebaõnnestus')
      } finally {
        setIsLoading(false)
      }
    }

    loadQuote()
  }, [quoteId])

  // Load contacts when company changes
  useEffect(() => {
    const loadContacts = async () => {
      if (!companyId) {
        setContacts([])
        return
      }

      try {
        const res = await fetch(`/api/partners/${companyId}/contacts`)
        if (res.ok) {
          const data = await res.json()
          setContacts(data.contacts || [])
        }
      } catch (err) {
        console.error('Failed to load contacts:', err)
      }
    }

    loadContacts()
  }, [companyId])

  // Calculate item totals
  const calculateItemTotals = (item: LocalQuoteItem): LocalQuoteItem => {
    const baseAmount = item.quantity * item.unitPrice
    const discountAmount = baseAmount * (item.discountPercent / 100)
    const subtotal = baseAmount - discountAmount
    const vatAmount = subtotal * (item.vatRate / 100)
    const total = subtotal + vatAmount

    return {
      ...item,
      subtotal,
      vatAmount,
      total,
    }
  }

  // Add new item
  const addItem = () => {
    const newItem: LocalQuoteItem = {
      id: '',
      tempId: `temp-${Date.now()}`,
      position: items.length,
      code: '',
      nameEt: '',
      nameEn: '',
      descriptionEt: '',
      descriptionEn: '',
      quantity: 1,
      unitId: units.find(u => u.isDefault)?.id || '',
      unitCode: units.find(u => u.isDefault)?.code || 'tk',
      unitPrice: 0,
      discountPercent: 0,
      vatRate: 22,
      subtotal: 0,
      vatAmount: 0,
      total: 0,
      notesEt: '',
      notesEn: '',
    }
    setItems([...items, newItem])
  }

  // Add item from article
  const addItemFromArticle = (article: QuoteArticle) => {
    const unit = units.find(u => u.id === article.unitId) || units.find(u => u.code === article.unitCode)

    const newItem: LocalQuoteItem = calculateItemTotals({
      id: '',
      tempId: `temp-${Date.now()}`,
      articleId: article.id,
      position: items.length,
      code: article.code,
      nameEt: article.name.et,
      nameEn: article.name.en,
      descriptionEt: article.description.et,
      descriptionEn: article.description.en,
      quantity: 1,
      unitId: unit?.id || '',
      unitCode: unit?.code || article.unitCode || 'tk',
      unitPrice: article.priceStats.usageCount > 0 ? article.priceStats.avgPrice : article.defaultPrice,
      discountPercent: 0,
      vatRate: article.vatRate,
      subtotal: 0,
      vatAmount: 0,
      total: 0,
      notesEt: '',
      notesEn: '',
    })

    setItems([...items, newItem])
    setShowArticlePicker(false)
  }

  // Update item
  const updateItem = (index: number, field: keyof LocalQuoteItem, value: unknown) => {
    const updatedItems = [...items]
    updatedItems[index] = { ...updatedItems[index], [field]: value }

    // Recalculate if relevant fields changed
    if (['quantity', 'unitPrice', 'discountPercent', 'vatRate'].includes(field)) {
      updatedItems[index] = calculateItemTotals(updatedItems[index])
    }

    // Update unit code when unit changes
    if (field === 'unitId') {
      const unit = units.find(u => u.id === value)
      if (unit) {
        updatedItems[index].unitCode = unit.code
      }
    }

    setItems(updatedItems)
  }

  // Remove item
  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  // Duplicate item
  const duplicateItem = (index: number) => {
    const item = items[index]
    const newItem: LocalQuoteItem = {
      ...item,
      id: '',
      tempId: `temp-${Date.now()}`,
      position: items.length,
    }
    setItems([...items, newItem])
  }

  // Save quote
  const handleSave = async (sendAfterSave = false) => {
    if (!title) {
      setError('Pealkiri on kohustuslik')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const payload = {
        quoteNumber,
        title,
        description,
        language,
        status: sendAfterSave ? 'sent' : status,
        validDays,
        validUntil: validUntil || new Date(Date.now() + validDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        companyId: companyId || null,
        contactId: contactId || null,
        projectId: projectId || null,
        notesEt,
        notesEn,
        termsEt,
        termsEn,
        internalNotes,
        subtotal,
        vatAmount: totalVat,
        total,
        items: items.map((item, index) => ({
          id: item.id || undefined,
          articleId: item.articleId || null,
          position: index,
          code: item.code,
          nameEt: item.nameEt,
          nameEn: item.nameEn || item.nameEt,
          descriptionEt: item.descriptionEt,
          descriptionEn: item.descriptionEn || item.descriptionEt,
          quantity: item.quantity,
          unitId: item.unitId,
          unit: item.unitCode,
          unitPrice: item.unitPrice,
          discountPercent: item.discountPercent,
          vatRate: item.vatRate,
          subtotal: item.subtotal,
          vatAmount: item.vatAmount,
          total: item.total,
          notesEt: item.notesEt,
          notesEn: item.notesEn,
        })),
      }

      const url = quoteId ? `/api/quotes/${quoteId}` : '/api/quotes'
      const method = quoteId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Salvestamine ebaõnnestus')
      }

      const data = await res.json()

      if (onSave) {
        onSave(data.quote || data)
      }

      if (onClose) {
        onClose()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Salvestamine ebaõnnestus')
    } finally {
      setIsSaving(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('et-EE', { style: 'currency', currency: 'EUR' }).format(amount)
  }

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({ ...expandedSections, [section]: !expandedSections[section] })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#279989]" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-slate-900">
              {quoteId ? 'Muuda pakkumist' : 'Uus pakkumine'}
            </h1>
            <span className="font-mono text-lg text-slate-500">{quoteNumber}</span>
            <StatusBadge status={status} type="quote" />
          </div>
          <div className="mt-2">
            <QuoteStatusTimeline currentStatus={status} size="md" showLabels />
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Tühista
            </button>
          )}
          <button
            onClick={() => handleSave(false)}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            Salvesta
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={isSaving || status === 'sent'}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#279989' }}
          >
            <Send className="w-4 h-4" />
            Salvesta ja saada
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          {error}
          <button onClick={() => setError(null)} className="ml-auto">×</button>
        </div>
      )}

      {/* Language selector */}
      <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg">
        <span className="text-sm font-medium text-slate-700">Pakkumise keel:</span>
        <div className="flex gap-2">
          <button
            onClick={() => setLanguage('et')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              language === 'et'
                ? 'bg-[#279989] text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            🇪🇪 Eesti keel
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              language === 'en'
                ? 'bg-[#279989] text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            🇬🇧 English
          </button>
        </div>
        <p className="text-xs text-slate-500 ml-2">
          {language === 'et'
            ? 'PDF ja e-mail genereeritakse eesti keeles'
            : 'PDF and email will be generated in English'}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main content - 2 columns */}
        <div className="lg:col-span-2 space-y-4">
          {/* Basic info */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('details')}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50"
            >
              <h3 className="font-medium text-slate-900">Põhiandmed</h3>
              {expandedSections.details ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {expandedSections.details && (
              <div className="p-4 pt-0 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Pealkiri <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Pakkumise pealkiri..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Kirjeldus</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Pakkumise kirjeldus..."
                    rows={2}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989] resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      <Building2 className="w-4 h-4 inline mr-1" />
                      Ettevõte
                    </label>
                    <select
                      value={companyId}
                      onChange={(e) => setCompanyId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989] bg-white"
                    >
                      <option value="">Vali ettevõte...</option>
                      {companies.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      <User className="w-4 h-4 inline mr-1" />
                      Kontaktisik
                    </label>
                    <select
                      value={contactId}
                      onChange={(e) => setContactId(e.target.value)}
                      disabled={!companyId}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989] bg-white disabled:bg-slate-50"
                    >
                      <option value="">Vali kontakt...</option>
                      {contacts.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      <FileText className="w-4 h-4 inline mr-1" />
                      Projekt
                    </label>
                    <select
                      value={projectId}
                      onChange={(e) => setProjectId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989] bg-white"
                    >
                      <option value="">Vali projekt...</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>{p.code} - {p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Kehtib (päeva)</label>
                    <input
                      type="number"
                      value={validDays}
                      onChange={(e) => setValidDays(parseInt(e.target.value) || 30)}
                      min={1}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Kehtib kuni
                    </label>
                    <input
                      type="date"
                      value={validUntil}
                      onChange={(e) => setValidUntil(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Items */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('items')}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50"
            >
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-slate-900">Read</h3>
                <span className="text-sm text-slate-500">({items.length})</span>
              </div>
              {expandedSections.items ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {expandedSections.items && (
              <div className="p-4 pt-0">
                {/* Add item buttons */}
                <div className="flex items-center gap-2 mb-4">
                  <button
                    onClick={addItem}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Lisa rida
                  </button>
                  <button
                    onClick={() => setShowArticlePicker(true)}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
                    style={{ backgroundColor: '#279989' }}
                  >
                    <Package className="w-4 h-4" />
                    Lisa kataloogist
                  </button>
                </div>

                {/* Items list */}
                {items.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    Pakkumisel puuduvad read. Lisa esimene rida!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item, index) => (
                      <div
                        key={item.id || item.tempId}
                        className="border border-slate-200 rounded-lg p-3 bg-slate-50"
                      >
                        <div className="flex items-start gap-3">
                          <div className="pt-2">
                            <GripVertical className="w-4 h-4 text-slate-300 cursor-grab" />
                          </div>

                          <div className="flex-1 space-y-3">
                            <div className="grid grid-cols-12 gap-3">
                              {/* Code */}
                              <div className="col-span-2">
                                <input
                                  type="text"
                                  value={item.code}
                                  onChange={(e) => updateItem(index, 'code', e.target.value)}
                                  placeholder="Kood"
                                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm font-mono focus:outline-none focus:ring-1 focus:ring-[#279989]/20 focus:border-[#279989]"
                                />
                              </div>

                              {/* Name (shown based on language) */}
                              <div className="col-span-4">
                                <input
                                  type="text"
                                  value={language === 'et' ? item.nameEt : item.nameEn}
                                  onChange={(e) => updateItem(index, language === 'et' ? 'nameEt' : 'nameEn', e.target.value)}
                                  placeholder={language === 'et' ? 'Nimetus (ET)' : 'Name (EN)'}
                                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#279989]/20 focus:border-[#279989]"
                                />
                              </div>

                              {/* Quantity */}
                              <div className="col-span-1">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.quantity}
                                  onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                  placeholder="Kogus"
                                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#279989]/20 focus:border-[#279989]"
                                />
                              </div>

                              {/* Unit */}
                              <div className="col-span-1">
                                <select
                                  value={item.unitId}
                                  onChange={(e) => updateItem(index, 'unitId', e.target.value)}
                                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-[#279989]/20 focus:border-[#279989] bg-white"
                                >
                                  <option value="">-</option>
                                  {units.map((u) => (
                                    <option key={u.id} value={u.id}>{u.code}</option>
                                  ))}
                                </select>
                              </div>

                              {/* Unit price */}
                              <div className="col-span-2">
                                <input
                                  type="number"
                                  step="0.01"
                                  value={item.unitPrice}
                                  onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                  placeholder="Ühikuhind"
                                  className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm text-right focus:outline-none focus:ring-1 focus:ring-[#279989]/20 focus:border-[#279989]"
                                />
                              </div>

                              {/* Total */}
                              <div className="col-span-2 flex items-center justify-end">
                                <span className="text-sm font-medium text-slate-900">
                                  {formatCurrency(item.total)}
                                </span>
                              </div>
                            </div>

                            {/* Description row */}
                            <div>
                              <input
                                type="text"
                                value={language === 'et' ? item.descriptionEt : item.descriptionEn}
                                onChange={(e) => updateItem(index, language === 'et' ? 'descriptionEt' : 'descriptionEn', e.target.value)}
                                placeholder={language === 'et' ? 'Kirjeldus (ET)' : 'Description (EN)'}
                                className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm text-slate-600 focus:outline-none focus:ring-1 focus:ring-[#279989]/20 focus:border-[#279989]"
                              />
                            </div>

                            {/* Extra fields row */}
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <div className="flex items-center gap-1">
                                <span>Allahindlus:</span>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={item.discountPercent}
                                  onChange={(e) => updateItem(index, 'discountPercent', parseFloat(e.target.value) || 0)}
                                  className="w-14 px-1 py-0.5 border border-slate-200 rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-[#279989]/20"
                                />
                                <span>%</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span>KM:</span>
                                <input
                                  type="number"
                                  value={item.vatRate}
                                  onChange={(e) => updateItem(index, 'vatRate', parseFloat(e.target.value) || 0)}
                                  className="w-14 px-1 py-0.5 border border-slate-200 rounded text-xs text-right focus:outline-none focus:ring-1 focus:ring-[#279989]/20"
                                />
                                <span>%</span>
                              </div>
                              <div className="text-slate-400">
                                Vahesumma: {formatCurrency(item.subtotal)} + KM: {formatCurrency(item.vatAmount)}
                              </div>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 pt-1">
                            <button
                              onClick={() => duplicateItem(index)}
                              className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded"
                              title="Kopeeri"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => removeItem(index)}
                              className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                              title="Kustuta"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes section */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('notes')}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50"
            >
              <h3 className="font-medium text-slate-900">Märkused</h3>
              {expandedSections.notes ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {expandedSections.notes && (
              <div className="p-4 pt-0 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Märkused (ET) <span className="text-xs text-slate-400">- nähtav kliendile</span>
                    </label>
                    <textarea
                      value={notesEt}
                      onChange={(e) => setNotesEt(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989] resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Märkused (EN) <span className="text-xs text-slate-400">- visible to client</span>
                    </label>
                    <textarea
                      value={notesEn}
                      onChange={(e) => setNotesEn(e.target.value)}
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989] resize-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Sisemised märkused <span className="text-xs text-slate-400">- ainult meeskonnale</span>
                  </label>
                  <textarea
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-amber-200 bg-amber-50 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 focus:border-amber-300 resize-none"
                    placeholder="Need märkused ei ole kliendile nähtavad..."
                  />
                </div>
              </div>
            )}
          </div>

          {/* Terms section */}
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection('terms')}
              className="w-full flex items-center justify-between p-4 hover:bg-slate-50"
            >
              <h3 className="font-medium text-slate-900">Tingimused</h3>
              {expandedSections.terms ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            {expandedSections.terms && (
              <div className="p-4 pt-0">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Tingimused (ET)</label>
                    <textarea
                      value={termsEt}
                      onChange={(e) => setTermsEt(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989] resize-none"
                      placeholder="Maksetingimused, garantii, jne..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Terms (EN)</label>
                    <textarea
                      value={termsEn}
                      onChange={(e) => setTermsEn(e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989] resize-none"
                      placeholder="Payment terms, warranty, etc..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-4">
          {/* Totals */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h3 className="font-medium text-slate-900 mb-4">Kokkuvõte</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-600">Vahesumma:</span>
                <span className="font-medium text-slate-900">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">KM (22%):</span>
                <span className="font-medium text-slate-900">{formatCurrency(totalVat)}</span>
              </div>
              <hr className="my-2" />
              <div className="flex justify-between text-lg">
                <span className="font-medium text-slate-900">Kokku:</span>
                <span className="font-bold text-slate-900">{formatCurrency(total)}</span>
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <h3 className="font-medium text-slate-900 mb-4">Staatus</h3>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as QuoteStatus)}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989] bg-white"
            >
              <option value="draft">Mustand</option>
              <option value="pending">Ootel</option>
              <option value="sent">Saadetud</option>
              <option value="viewed">Vaadatud</option>
              <option value="accepted">Kinnitatud</option>
              <option value="rejected">Tagasi lükatud</option>
              <option value="expired">Aegunud</option>
            </select>
          </div>

          {/* Quick stats */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h3 className="font-medium text-slate-900 mb-3 text-sm">Statistika</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-slate-500">Read</div>
                <div className="font-medium text-slate-900">{items.length}</div>
              </div>
              <div>
                <div className="text-slate-500">Keel</div>
                <div className="font-medium text-slate-900">{language === 'et' ? 'Eesti' : 'English'}</div>
              </div>
              <div>
                <div className="text-slate-500">Kehtivus</div>
                <div className="font-medium text-slate-900">{validDays} päeva</div>
              </div>
              <div>
                <div className="text-slate-500">Revisjon</div>
                <div className="font-medium text-slate-900">R1</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Article picker modal */}
      {showArticlePicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-3xl max-h-[80vh] overflow-hidden m-4 flex flex-col">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Lisa artikkel kataloogist</h2>
              <button onClick={() => setShowArticlePicker(false)} className="p-1 hover:bg-slate-100 rounded">
                <X className="w-5 h-5 text-slate-500" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <ServiceCatalog
                onSelectArticle={addItemFromArticle}
                selectable
                language={language}
                compact
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
