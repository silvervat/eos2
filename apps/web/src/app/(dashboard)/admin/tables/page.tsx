'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Table,
  Search,
  Database,
  Building2,
  Users,
  FolderKanban,
  Building,
  Receipt,
  FileText,
  Package,
  ArrowRightLeft,
  File,
  Sliders,
  GitBranch,
  Bell,
  History,
  Mail,
  ChevronRight,
  Settings,
  Eye,
  Layers,
  Filter,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  ExternalLink,
  Ruler,
  UserPlus,
  Link as LinkIcon,
  List,
} from 'lucide-react'
import {
  TABLE_REGISTRY,
  getTablesByCategory,
  getTablesByModule,
  getAllModules,
  type RegisteredTable,
  type TableFeature,
} from '@/lib/admin/table-registry'

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Building2,
  Users,
  FolderKanban,
  Building,
  Receipt,
  FileText,
  Package,
  ArrowRightLeft,
  File,
  Sliders,
  GitBranch,
  Bell,
  History,
  Mail,
  Table,
  Ruler,
  UserPlus,
  Link: LinkIcon,
  List,
}

// Category labels
const categoryLabels: Record<RegisteredTable['category'], string> = {
  core: 'Põhitabelid',
  module: 'Mooduli tabelid',
  system: 'Süsteemi tabelid',
  cms: 'CMS tabelid',
  custom: 'Kohandatud tabelid',
}

// Category colors
const categoryColors: Record<RegisteredTable['category'], string> = {
  core: 'bg-blue-100 text-blue-800',
  module: 'bg-green-100 text-green-800',
  system: 'bg-slate-100 text-slate-800',
  cms: 'bg-purple-100 text-purple-800',
  custom: 'bg-amber-100 text-amber-800',
}

// Feature category labels
const featureCategoryLabels: Record<TableFeature['category'], string> = {
  display: 'Kuvamine',
  data: 'Andmed',
  actions: 'Tegevused',
  export: 'Eksport',
  advanced: 'Täiustatud',
}

export default function AdminTablesPage() {
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<RegisteredTable['category'] | 'all'>('all')
  const [moduleFilter, setModuleFilter] = useState<string>('all')
  const [selectedTable, setSelectedTable] = useState<RegisteredTable | null>(null)
  const [showFeatures, setShowFeatures] = useState(false)

  const modules = useMemo(() => getAllModules(), [])

  const filteredTables = useMemo(() => {
    let tables = [...TABLE_REGISTRY]

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      tables = tables.filter(
        t =>
          t.name.toLowerCase().includes(query) ||
          t.namePlural.toLowerCase().includes(query) ||
          t.description.toLowerCase().includes(query) ||
          t.dbTable.toLowerCase().includes(query)
      )
    }

    // Filter by category
    if (categoryFilter !== 'all') {
      tables = tables.filter(t => t.category === categoryFilter)
    }

    // Filter by module
    if (moduleFilter !== 'all') {
      tables = tables.filter(t => t.module === moduleFilter)
    }

    return tables
  }, [searchQuery, categoryFilter, moduleFilter])

  // Group tables by category for display
  const groupedTables = useMemo(() => {
    const groups: Record<string, RegisteredTable[]> = {}
    filteredTables.forEach(table => {
      const key = table.category
      if (!groups[key]) groups[key] = []
      groups[key].push(table)
    })
    return groups
  }, [filteredTables])

  // Stats
  const stats = useMemo(() => {
    const enabledFeaturesCount = TABLE_REGISTRY.reduce(
      (acc, t) => acc + t.features.filter(f => f.enabled).length,
      0
    )
    const totalFeaturesCount = TABLE_REGISTRY.reduce((acc, t) => acc + t.features.length, 0)

    return {
      totalTables: TABLE_REGISTRY.length,
      moduleCount: modules.length,
      enabledFeatures: enabledFeaturesCount,
      totalFeatures: totalFeaturesCount,
    }
  }, [modules])

  const getIcon = (iconName: string) => {
    const Icon = iconMap[iconName] || Table
    return Icon
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Tabelite haldus</h1>
          <p className="text-sm text-slate-500 mt-1">
            Halda süsteemi tabeleid ja nende funktsioone
          </p>
        </div>
        <Link
          href="/admin/ultra-tables"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] transition-colors"
        >
          <Table className="w-4 h-4" />
          Ultra tabelid
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Database className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-900">{stats.totalTables}</p>
              <p className="text-sm text-slate-500">Tabeleid kokku</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Layers className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-900">{stats.moduleCount}</p>
              <p className="text-sm text-slate-500">Moodulit</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-900">{stats.enabledFeatures}</p>
              <p className="text-sm text-slate-500">Aktiivseid funktsioone</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
              <Settings className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="text-2xl font-semibold text-slate-900">{stats.totalFeatures}</p>
              <p className="text-sm text-slate-500">Funktsioone kokku</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-slate-200 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Otsi tabelit..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989] focus:border-transparent"
            />
          </div>

          {/* Category filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value as RegisteredTable['category'] | 'all')}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]"
            >
              <option value="all">Kõik kategooriad</option>
              <option value="core">Põhitabelid</option>
              <option value="module">Mooduli tabelid</option>
              <option value="cms">CMS tabelid</option>
              <option value="system">Süsteemi tabelid</option>
              <option value="custom">Kohandatud tabelid</option>
            </select>
          </div>

          {/* Module filter */}
          <div>
            <select
              value={moduleFilter}
              onChange={e => setModuleFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]"
            >
              <option value="all">Kõik moodulid</option>
              {modules.map(module => (
                <option key={module} value={module}>
                  {module.charAt(0).toUpperCase() + module.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="space-y-6">
        {Object.entries(groupedTables).map(([category, tables]) => (
          <div key={category}>
            <h2 className="text-lg font-medium text-slate-900 mb-3">
              {categoryLabels[category as RegisteredTable['category']]}
              <span className="ml-2 text-sm font-normal text-slate-500">({tables.length})</span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {tables.map(table => {
                const Icon = getIcon(table.icon)
                const enabledCount = table.features.filter(f => f.enabled).length
                const totalCount = table.features.length

                return (
                  <div
                    key={table.id}
                    className="bg-white rounded-lg border border-slate-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedTable(table)
                      setShowFeatures(true)
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                          <Icon className="w-5 h-5 text-slate-600" />
                        </div>
                        <div>
                          <h3 className="font-medium text-slate-900">{table.namePlural}</h3>
                          <p className="text-xs text-slate-500">{table.dbTable}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${categoryColors[table.category]}`}>
                        {table.module || category}
                      </span>
                    </div>

                    <p className="text-sm text-slate-600 mt-3 line-clamp-2">{table.description}</p>

                    <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5" />
                          {table.columns.length} veergu
                        </span>
                        <span className="flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {enabledCount}/{totalCount} funktsiooni
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {table.uiPath && (
                          <Link
                            href={table.uiPath}
                            onClick={e => e.stopPropagation()}
                            className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}
                        <button className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {filteredTables.length === 0 && (
          <div className="text-center py-12">
            <Database className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500">Tabeleid ei leitud</p>
          </div>
        )}
      </div>

      {/* Features Panel (Side Drawer) */}
      {showFeatures && selectedTable && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/30 z-40"
            onClick={() => setShowFeatures(false)}
          />

          {/* Drawer */}
          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white shadow-xl z-50 overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {(() => {
                  const Icon = getIcon(selectedTable.icon)
                  return (
                    <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-slate-600" />
                    </div>
                  )
                })()}
                <div>
                  <h2 className="font-semibold text-slate-900">{selectedTable.namePlural}</h2>
                  <p className="text-sm text-slate-500">{selectedTable.dbTable}</p>
                </div>
              </div>
              <button
                onClick={() => setShowFeatures(false)}
                className="p-2 rounded-lg hover:bg-slate-100"
              >
                <XCircle className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-4 space-y-6">
              {/* Info */}
              <div>
                <h3 className="text-sm font-medium text-slate-900 mb-2">Kirjeldus</h3>
                <p className="text-sm text-slate-600">{selectedTable.description}</p>
              </div>

              {/* Paths */}
              <div className="grid grid-cols-2 gap-4">
                {selectedTable.uiPath && (
                  <div>
                    <h4 className="text-xs font-medium text-slate-500 mb-1">UI tee</h4>
                    <Link
                      href={selectedTable.uiPath}
                      className="text-sm text-[#279989] hover:underline flex items-center gap-1"
                    >
                      {selectedTable.uiPath}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                )}
                {selectedTable.apiPath && (
                  <div>
                    <h4 className="text-xs font-medium text-slate-500 mb-1">API tee</h4>
                    <code className="text-sm text-slate-700">{selectedTable.apiPath}</code>
                  </div>
                )}
              </div>

              {/* Columns */}
              <div>
                <h3 className="text-sm font-medium text-slate-900 mb-3">
                  Veerud ({selectedTable.columns.length})
                </h3>
                <div className="space-y-2">
                  {selectedTable.columns.map(column => (
                    <div
                      key={column.key}
                      className="flex items-center justify-between p-2 bg-slate-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-slate-500">{column.key}</span>
                        <span className="text-sm text-slate-700">{column.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-xs rounded bg-slate-200 text-slate-600">
                          {column.type}
                        </span>
                        {column.sortable && (
                          <span className="text-xs text-slate-400" title="Sorteeritav">
                            ↕
                          </span>
                        )}
                        {column.filterable && (
                          <span className="text-xs text-slate-400" title="Filtreeritav">
                            🔍
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Features by category */}
              <div>
                <h3 className="text-sm font-medium text-slate-900 mb-3">Funktsioonid</h3>
                <div className="space-y-4">
                  {(['display', 'data', 'actions', 'export', 'advanced'] as const).map(category => {
                    const categoryFeatures = selectedTable.features.filter(
                      f => f.category === category
                    )
                    if (categoryFeatures.length === 0) return null

                    return (
                      <div key={category}>
                        <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                          {featureCategoryLabels[category]}
                        </h4>
                        <div className="space-y-2">
                          {categoryFeatures.map(feature => (
                            <div
                              key={feature.id}
                              className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg"
                            >
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-sm font-medium text-slate-700">
                                    {feature.name}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {feature.description}
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={feature.enabled}
                                  onChange={() => {
                                    // Toggle feature (would need state management for real implementation)
                                    feature.enabled = !feature.enabled
                                    setSelectedTable({ ...selectedTable })
                                  }}
                                  className="sr-only peer"
                                />
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#279989] rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#279989]"></div>
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-slate-200">
                <button
                  onClick={() => setShowFeatures(false)}
                  className="flex-1 px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Tühista
                </button>
                <button
                  onClick={() => {
                    // Save changes (would need API call)
                    setShowFeatures(false)
                  }}
                  className="flex-1 px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] transition-colors"
                >
                  Salvesta
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
