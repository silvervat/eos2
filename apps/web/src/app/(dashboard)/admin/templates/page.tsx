'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button, Card, Input, Badge } from '@rivest/ui'
import {
  FileText,
  Plus,
  Search,
  Edit,
  Copy,
  Trash2,
  Eye,
  Download,
  MoreVertical,
  Filter,
  FolderOpen,
  Calendar,
  Clock,
} from 'lucide-react'
import { CATEGORY_LABELS, PDFTemplateCategory } from '@/lib/pdf/types'

// Mock templates data (will be replaced with real data from Supabase)
interface MockTemplate {
  id: string
  name: string
  category: PDFTemplateCategory
  description: string
  isDefault: boolean
  isActive: boolean
  createdAt: string
  updatedAt: string
  usageCount: number
}

const MOCK_TEMPLATES: MockTemplate[] = [
  {
    id: 'tpl_1',
    name: 'Standardne arve',
    category: 'invoice',
    description: 'Ettevõtte arve põhimall koos logo ja QR koodiga',
    isDefault: true,
    isActive: true,
    createdAt: '2024-01-15',
    updatedAt: '2024-03-01',
    usageCount: 156,
  },
  {
    id: 'tpl_2',
    name: 'Hinnapakkumine',
    category: 'quote',
    description: 'Hinnapakkumise mall kliendile',
    isDefault: true,
    isActive: true,
    createdAt: '2024-01-20',
    updatedAt: '2024-02-15',
    usageCount: 89,
  },
  {
    id: 'tpl_3',
    name: 'Lisatöö akt',
    category: 'additional_work',
    description: 'Lisatööde kinnitamise akt fotodega',
    isDefault: true,
    isActive: true,
    createdAt: '2024-02-01',
    updatedAt: '2024-02-28',
    usageCount: 45,
  },
  {
    id: 'tpl_4',
    name: 'Tööajatabel',
    category: 'timesheet',
    description: 'Kuu tööajatabel töötajatele',
    isDefault: false,
    isActive: true,
    createdAt: '2024-02-10',
    updatedAt: '2024-02-20',
    usageCount: 34,
  },
  {
    id: 'tpl_5',
    name: 'Saateleht',
    category: 'delivery',
    description: 'Kauba saateleht allkirjastamiseks',
    isDefault: true,
    isActive: true,
    createdAt: '2024-02-15',
    updatedAt: '2024-02-25',
    usageCount: 67,
  },
  {
    id: 'tpl_6',
    name: 'Töövõtuleping',
    category: 'contract',
    description: 'Standardne töövõtulepingu mall',
    isDefault: true,
    isActive: false,
    createdAt: '2024-01-01',
    updatedAt: '2024-01-10',
    usageCount: 23,
  },
]

const CATEGORY_COLORS: Record<PDFTemplateCategory, string> = {
  invoice: 'bg-blue-100 text-blue-700',
  quote: 'bg-purple-100 text-purple-700',
  contract: 'bg-amber-100 text-amber-700',
  report: 'bg-green-100 text-green-700',
  certificate: 'bg-emerald-100 text-emerald-700',
  additional_work: 'bg-orange-100 text-orange-700',
  timesheet: 'bg-cyan-100 text-cyan-700',
  delivery: 'bg-pink-100 text-pink-700',
  other: 'bg-slate-100 text-slate-700',
}

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<MockTemplate[]>(MOCK_TEMPLATES)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<PDFTemplateCategory | 'all'>('all')
  const [showActiveOnly, setShowActiveOnly] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  // Filter templates
  const filteredTemplates = templates.filter((template) => {
    const matchesSearch =
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory =
      selectedCategory === 'all' || template.category === selectedCategory
    const matchesActive = !showActiveOnly || template.isActive

    return matchesSearch && matchesCategory && matchesActive
  })

  // Handle delete
  const handleDelete = (id: string) => {
    if (confirm('Kas olete kindel, et soovite selle malli kustutada?')) {
      setTemplates(templates.filter((t) => t.id !== id))
    }
  }

  // Handle duplicate
  const handleDuplicate = (template: MockTemplate) => {
    const newTemplate: MockTemplate = {
      ...template,
      id: `tpl_${Date.now()}`,
      name: `${template.name} (koopia)`,
      isDefault: false,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      usageCount: 0,
    }
    setTemplates([newTemplate, ...templates])
  }

  // Handle toggle active
  const handleToggleActive = (id: string) => {
    setTemplates(
      templates.map((t) =>
        t.id === id ? { ...t, isActive: !t.isActive } : t
      )
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">PDF Mallid</h1>
          <p className="text-slate-500 mt-1">
            Halda dokumendi malle arvetele, pakkumistele ja muudele dokumentidele
          </p>
        </div>
        <Link href="/admin/templates/new">
          <Button className="gap-2 bg-[#279989] hover:bg-[#1e7a6d]">
            <Plus className="w-4 h-4" />
            Uus mall
          </Button>
        </Link>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {templates.length}
              </p>
              <p className="text-sm text-slate-500">Malli kokku</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <FolderOpen className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {templates.filter((t) => t.isActive).length}
              </p>
              <p className="text-sm text-slate-500">Aktiivsed</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Download className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {templates.reduce((sum, t) => sum + t.usageCount, 0)}
              </p>
              <p className="text-sm text-slate-500">Kasutusi kokku</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {new Set(templates.map((t) => t.category)).size}
              </p>
              <p className="text-sm text-slate-500">Kategooriat</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            type="search"
            placeholder="Otsi malle..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) =>
              setSelectedCategory(e.target.value as PDFTemplateCategory | 'all')
            }
            className="border border-slate-200 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-[#279989]"
          >
            <option value="all">Kõik kategooriad</option>
            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showActiveOnly}
            onChange={(e) => setShowActiveOnly(e.target.checked)}
            className="rounded border-slate-300 text-[#279989] focus:ring-[#279989]"
          />
          <span className="text-sm text-slate-600">Ainult aktiivsed</span>
        </label>
      </div>

      {/* Templates grid */}
      {filteredTemplates.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            Malle ei leitud
          </h3>
          <p className="text-slate-500 mb-4">
            {searchQuery || selectedCategory !== 'all'
              ? 'Proovige muuta otsingu tingimusi'
              : 'Alustage uue malli loomisega'}
          </p>
          <Link href="/admin/templates/new">
            <Button className="gap-2 bg-[#279989] hover:bg-[#1e7a6d]">
              <Plus className="w-4 h-4" />
              Loo uus mall
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTemplates.map((template) => (
            <Card
              key={template.id}
              className={`p-4 transition-all hover:shadow-md ${
                !template.isActive ? 'opacity-60' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge
                    className={`text-xs ${CATEGORY_COLORS[template.category]}`}
                  >
                    {CATEGORY_LABELS[template.category]}
                  </Badge>
                  {template.isDefault && (
                    <Badge className="text-xs bg-slate-100 text-slate-600">
                      Vaikimisi
                    </Badge>
                  )}
                </div>

                {/* Actions menu */}
                <div className="relative">
                  <button
                    onClick={() =>
                      setOpenMenuId(
                        openMenuId === template.id ? null : template.id
                      )
                    }
                    className="p-1 rounded hover:bg-slate-100"
                  >
                    <MoreVertical className="w-4 h-4 text-slate-400" />
                  </button>

                  {openMenuId === template.id && (
                    <div className="absolute right-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-slate-200 z-10">
                      <Link
                        href={`/admin/templates/${template.id}`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Edit className="w-4 h-4" />
                        Muuda
                      </Link>
                      <Link
                        href={`/admin/templates/${template.id}/preview`}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Eye className="w-4 h-4" />
                        Eelvaade
                      </Link>
                      <button
                        onClick={() => {
                          handleDuplicate(template)
                          setOpenMenuId(null)
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        <Copy className="w-4 h-4" />
                        Kopeeri
                      </button>
                      <button
                        onClick={() => {
                          handleToggleActive(template.id)
                          setOpenMenuId(null)
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                      >
                        {template.isActive ? (
                          <>
                            <Clock className="w-4 h-4" />
                            Deaktiveeri
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4" />
                            Aktiveeri
                          </>
                        )}
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={() => {
                          handleDelete(template.id)
                          setOpenMenuId(null)
                        }}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Kustuta
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <h3 className="text-lg font-semibold text-slate-900 mb-1">
                {template.name}
              </h3>
              <p className="text-sm text-slate-500 mb-4 line-clamp-2">
                {template.description}
              </p>

              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Download className="w-3 h-3" />
                  {template.usageCount} kasutust
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {template.updatedAt}
                </span>
              </div>

              {/* Quick actions */}
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
                <Link
                  href={`/admin/templates/${template.id}`}
                  className="flex-1"
                >
                  <Button variant="outline" size="sm" className="w-full gap-1">
                    <Edit className="w-4 h-4" />
                    Muuda
                  </Button>
                </Link>
                <Link
                  href={`/admin/templates/${template.id}/preview`}
                  className="flex-1"
                >
                  <Button variant="outline" size="sm" className="w-full gap-1">
                    <Eye className="w-4 h-4" />
                    Vaata
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Click outside to close menu */}
      {openMenuId && (
        <div
          className="fixed inset-0 z-0"
          onClick={() => setOpenMenuId(null)}
        />
      )}
    </div>
  )
}
