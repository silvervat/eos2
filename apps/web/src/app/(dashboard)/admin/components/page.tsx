'use client'

/**
 * Admin - Komponendid
 *
 * Süsteemi komponentide ülevaade
 * Filtreeritav, sorditav, grupeeritav tabel
 */

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Search, ChevronUp, ChevronDown, Filter, Layers, X, ExternalLink } from 'lucide-react'

interface Component {
  id: string
  name: string
  module: string
  type: 'page' | 'component' | 'hook' | 'util' | 'api'
  path: string
  status: 'active' | 'beta' | 'deprecated'
  description?: string
}

const components: Component[] = [
  // Warehouse
  { id: '1', name: 'AssetsPage', module: 'warehouse', type: 'page', path: '/warehouse/assets', status: 'active', description: 'Varade nimekiri' },
  { id: '2', name: 'AssetDetailPage', module: 'warehouse', type: 'page', path: '/warehouse/assets/[id]', status: 'active', description: 'Vara detailvaade' },
  { id: '3', name: 'CategoriesPage', module: 'warehouse', type: 'page', path: '/warehouse/categories', status: 'active', description: 'Kategooriate haldus' },
  { id: '4', name: 'MaintenancePage', module: 'warehouse', type: 'page', path: '/warehouse/maintenance', status: 'active', description: 'Hoolduste haldus' },
  { id: '5', name: 'TransfersPage', module: 'warehouse', type: 'page', path: '/warehouse/transfers', status: 'active', description: 'Ülekannete haldus' },
  // Core
  { id: '6', name: 'DashboardPage', module: 'core', type: 'page', path: '/dashboard', status: 'active', description: 'Peamine töölaud' },
  { id: '7', name: 'SettingsPage', module: 'core', type: 'page', path: '/settings', status: 'active', description: 'Kasutaja seaded' },
  { id: '8', name: 'NotificationsPage', module: 'core', type: 'page', path: '/notifications', status: 'active', description: 'Teavituste keskus' },
  { id: '9', name: 'TrashPage', module: 'core', type: 'page', path: '/trash', status: 'active', description: 'Kustutatud elemendid' },
  // Admin
  { id: '10', name: 'ModulesPage', module: 'admin', type: 'page', path: '/admin/modules', status: 'active', description: 'Moodulite haldus' },
  { id: '11', name: 'UsersPage', module: 'admin', type: 'page', path: '/admin/users', status: 'active', description: 'Kasutajate haldus' },
  { id: '12', name: 'PermissionsPage', module: 'admin', type: 'page', path: '/admin/permissions', status: 'active', description: 'Õiguste maatriks' },
  { id: '13', name: 'SystemPage', module: 'admin', type: 'page', path: '/admin/system', status: 'active', description: 'Süsteemi info' },
  { id: '14', name: 'LogsPage', module: 'admin', type: 'page', path: '/admin/logs', status: 'active', description: 'Süsteemi logid' },
  // UI (@rivest/ui)
  { id: '15', name: 'Button', module: '@rivest/ui', type: 'component', path: 'packages/ui/src/button.tsx', status: 'active', description: 'Nupu komponent' },
  { id: '16', name: 'Card', module: '@rivest/ui', type: 'component', path: 'packages/ui/src/card.tsx', status: 'active', description: 'Kaardi komponent' },
  { id: '17', name: 'Input', module: '@rivest/ui', type: 'component', path: 'packages/ui/src/input.tsx', status: 'active', description: 'Sisestusväli' },
  { id: '18', name: 'Table', module: '@rivest/ui', type: 'component', path: 'packages/ui/src/table.tsx', status: 'active', description: 'Tabeli komponent' },
  // File-vault
  { id: '19', name: 'FileVaultPage', module: 'file-vault', type: 'page', path: '/file-vault', status: 'active', description: 'Failihoidla' },
  { id: '20', name: 'FileUploadDialog', module: 'file-vault', type: 'component', path: 'components/file-vault/FileUploadDialog.tsx', status: 'active', description: 'Faili üleslaadimine' },
  // Documents
  { id: '21', name: 'DocumentsPage', module: 'documents', type: 'page', path: '/documents', status: 'active', description: 'Dokumentide nimekiri' },
  { id: '22', name: 'DocumentDetailPage', module: 'documents', type: 'page', path: '/documents/[id]', status: 'active', description: 'Dokumendi detail' },
  // Projects
  { id: '23', name: 'ProjectsPage', module: 'projects', type: 'page', path: '/projects', status: 'active', description: 'Projektide nimekiri' },
  { id: '24', name: 'PTVProjectsPage', module: 'projects', type: 'page', path: '/projects/ptv', status: 'active', description: 'PTV projektid' },
  { id: '25', name: 'MontaazProjectsPage', module: 'projects', type: 'page', path: '/projects/montaaz', status: 'active', description: 'Montaaži projektid' },
  { id: '26', name: 'MuukProjectsPage', module: 'projects', type: 'page', path: '/projects/muuk', status: 'active', description: 'Müügi projektid' },
  { id: '27', name: 'VahendusProjectsPage', module: 'projects', type: 'page', path: '/projects/vahendus', status: 'active', description: 'Vahenduse projektid' },
  { id: '28', name: 'RentProjectsPage', module: 'projects', type: 'page', path: '/projects/rent', status: 'active', description: 'Rendi projektid' },
  // Personnel
  { id: '29', name: 'PersonnelPage', module: 'personnel', type: 'page', path: '/personnel', status: 'active', description: 'Personali ülevaade' },
  { id: '30', name: 'EmployeesPage', module: 'personnel', type: 'page', path: '/personnel/employees', status: 'active', description: 'Töötajate tabel' },
  { id: '31', name: 'GroupsPage', module: 'personnel', type: 'page', path: '/personnel/groups', status: 'active', description: 'Kasutajagrupid' },
  // Reports
  { id: '32', name: 'ReportsPage', module: 'reports', type: 'page', path: '/reports', status: 'active', description: 'Raportid ja graafikud' },
  // Invoices
  { id: '33', name: 'InvoicesPage', module: 'invoices', type: 'page', path: '/invoices', status: 'active', description: 'Arvete nimekiri' },
  // API
  { id: '34', name: 'FileVaultAPI', module: 'file-vault', type: 'api', path: '/api/file-vault/*', status: 'active', description: 'Failihoidla API' },
  { id: '35', name: 'WarehouseAPI', module: 'warehouse', type: 'api', path: '/api/warehouse/*', status: 'active', description: 'Laohalduse API' },
]

const typeConfig: Record<string, { label: string; color: string; bg: string }> = {
  page: { label: 'Leht', color: 'text-blue-700', bg: 'bg-blue-100' },
  component: { label: 'Komponent', color: 'text-green-700', bg: 'bg-green-100' },
  hook: { label: 'Hook', color: 'text-purple-700', bg: 'bg-purple-100' },
  util: { label: 'Util', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  api: { label: 'API', color: 'text-orange-700', bg: 'bg-orange-100' },
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Aktiivne', color: 'text-green-700', bg: 'bg-green-100' },
  beta: { label: 'Beeta', color: 'text-blue-700', bg: 'bg-blue-100' },
  deprecated: { label: 'Aegunud', color: 'text-red-700', bg: 'bg-red-100' },
}

type SortField = 'name' | 'module' | 'type' | 'status'
type SortDirection = 'asc' | 'desc'

export default function ComponentsPage() {
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [moduleFilter, setModuleFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [groupBy, setGroupBy] = useState<'none' | 'module' | 'type'>('none')

  const modules = [...new Set(components.map(c => c.module))].sort()

  // Filter and sort
  const filteredComponents = useMemo(() => {
    let result = components.filter(c => {
      const matchesSearch = search === '' ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase()) ||
        c.path.toLowerCase().includes(search.toLowerCase())
      const matchesType = typeFilter === 'all' || c.type === typeFilter
      const matchesModule = moduleFilter === 'all' || c.module === moduleFilter
      return matchesSearch && matchesType && matchesModule
    })

    result.sort((a, b) => {
      let comparison = 0
      if (sortField === 'name') comparison = a.name.localeCompare(b.name)
      else if (sortField === 'module') comparison = a.module.localeCompare(b.module)
      else if (sortField === 'type') comparison = a.type.localeCompare(b.type)
      else if (sortField === 'status') comparison = a.status.localeCompare(b.status)
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [search, typeFilter, moduleFilter, sortField, sortDirection])

  // Group data
  const groupedComponents = useMemo(() => {
    if (groupBy === 'none') return { '': filteredComponents }
    const groups: Record<string, Component[]> = {}
    filteredComponents.forEach(c => {
      const key = groupBy === 'module' ? c.module : c.type
      if (!groups[key]) groups[key] = []
      groups[key].push(c)
    })
    return groups
  }, [filteredComponents, groupBy])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 text-gray-300" />
    return sortDirection === 'asc'
      ? <ChevronUp className="w-3 h-3 text-blue-600" />
      : <ChevronDown className="w-3 h-3 text-blue-600" />
  }

  const stats = {
    total: components.length,
    pages: components.filter(c => c.type === 'page').length,
    components: components.filter(c => c.type === 'component').length,
    apis: components.filter(c => c.type === 'api').length,
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Komponendid</h1>
          <p className="text-gray-500 text-sm">Süsteemi komponentide ülevaade</p>
        </div>
      </div>

      {/* Quick stats */}
      <div className="flex gap-4 text-sm">
        <span className="px-2 py-1 bg-gray-100 rounded">Kokku: <strong>{stats.total}</strong></span>
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Lehti: <strong>{stats.pages}</strong></span>
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Komponente: <strong>{stats.components}</strong></span>
        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">API: <strong>{stats.apis}</strong></span>
      </div>

      {/* Filters and controls */}
      <div className="bg-white rounded-lg border p-3 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Otsi komponenti..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border rounded text-sm"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-gray-400" />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="px-2 py-1.5 border rounded text-sm">
            <option value="all">Kõik tüübid</option>
            <option value="page">Lehed</option>
            <option value="component">Komponendid</option>
            <option value="api">API</option>
            <option value="hook">Hookid</option>
            <option value="util">Utiliidid</option>
          </select>
          <select value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} className="px-2 py-1.5 border rounded text-sm">
            <option value="all">Kõik moodulid</option>
            {modules.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-gray-400" />
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as typeof groupBy)} className="px-2 py-1.5 border rounded text-sm">
            <option value="none">Grupeeri...</option>
            <option value="module">Mooduli järgi</option>
            <option value="type">Tüübi järgi</option>
          </select>
        </div>

        {(search || typeFilter !== 'all' || moduleFilter !== 'all') && (
          <button
            onClick={() => { setSearch(''); setTypeFilter('all'); setModuleFilter('all'); }}
            className="px-2 py-1 text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
          >
            <X className="w-3 h-3" /> Tühista filtrid
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-3 py-2">
                <button onClick={() => handleSort('name')} className="flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900">
                  Komponent <SortIcon field="name" />
                </button>
              </th>
              <th className="text-left px-3 py-2">
                <button onClick={() => handleSort('module')} className="flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900">
                  Moodul <SortIcon field="module" />
                </button>
              </th>
              <th className="text-left px-3 py-2">
                <button onClick={() => handleSort('type')} className="flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900">
                  Tüüp <SortIcon field="type" />
                </button>
              </th>
              <th className="text-left px-3 py-2">
                <button onClick={() => handleSort('status')} className="flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900">
                  Staatus <SortIcon field="status" />
                </button>
              </th>
              <th className="text-left px-3 py-2 font-medium text-gray-600">Path</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {Object.entries(groupedComponents).map(([group, items]) => (
              <React.Fragment key={group || 'all'}>
                {group && groupBy !== 'none' && (
                  <tr className="bg-gray-100">
                    <td colSpan={5} className="px-3 py-1.5 font-medium text-gray-700 text-xs uppercase tracking-wide">
                      {groupBy === 'type' ? typeConfig[group]?.label : group} ({items.length})
                    </td>
                  </tr>
                )}
                {items.map((component) => (
                  <tr key={component.id} className="hover:bg-gray-50">
                    <td className="px-3 py-1.5">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">{component.name}</p>
                        {component.description && (
                          <p className="text-xs text-gray-400">{component.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-1.5">
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                        {component.module}
                      </span>
                    </td>
                    <td className="px-3 py-1.5">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${typeConfig[component.type].bg} ${typeConfig[component.type].color}`}>
                        {typeConfig[component.type].label}
                      </span>
                    </td>
                    <td className="px-3 py-1.5">
                      <span className={`px-1.5 py-0.5 rounded-full text-xs ${statusConfig[component.status].bg} ${statusConfig[component.status].color}`}>
                        {statusConfig[component.status].label}
                      </span>
                    </td>
                    <td className="px-3 py-1.5">
                      {component.type === 'page' && component.path.startsWith('/') ? (
                        <Link
                          href={component.path.replace('[id]', '1')}
                          className="text-xs text-blue-600 hover:underline font-mono flex items-center gap-1"
                        >
                          {component.path}
                          <ExternalLink className="w-3 h-3" />
                        </Link>
                      ) : (
                        <code className="text-xs text-gray-500">{component.path}</code>
                      )}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {filteredComponents.length === 0 && (
          <div className="text-center py-8 text-gray-500">Komponente ei leitud</div>
        )}
      </div>

      {/* Results count */}
      <div className="text-xs text-gray-500">
        Näitan {filteredComponents.length} / {components.length} komponenti
      </div>
    </div>
  )
}
