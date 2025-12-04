'use client'

/**
 * Admin - Moodulite haldus
 *
 * Kõigi süsteemi moodulite ülevaade ja haldus
 * Filtreeritav, sorditav, grupeeritav tabel
 */

import React, { useState, useMemo } from 'react'
import { Search, ChevronUp, ChevronDown, Filter, Layers, MoreVertical, Eye, Edit, Trash2, Plus, X } from 'lucide-react'

interface Module {
  id: string
  name: string
  label: string
  icon: string
  description: string
  status: 'active' | 'beta' | 'development' | 'todo' | 'disabled'
  category: 'core' | 'business' | 'admin' | 'utility'
  components: number
  bugs: number
  todos: number
  version: string
}

const mockModules: Module[] = [
  { id: '1', name: 'warehouse', label: 'Laohaldus', icon: '🏭', description: 'Varade, laoseisu ja ülekannete haldus', status: 'active', category: 'business', components: 8, bugs: 0, todos: 2, version: '1.0.0' },
  { id: '2', name: 'projects', label: 'Projektid', icon: '📁', description: 'Projektide haldus ja jälgimine', status: 'active', category: 'business', components: 6, bugs: 0, todos: 1, version: '1.0.0' },
  { id: '3', name: 'invoices', label: 'Arved', icon: '📄', description: 'Arvete koostamine ja haldus', status: 'todo', category: 'business', components: 0, bugs: 0, todos: 4, version: '0.0.0' },
  { id: '4', name: 'vehicles', label: 'Sõidukid', icon: '🚗', description: 'Sõidukipargi haldus', status: 'beta', category: 'business', components: 3, bugs: 1, todos: 3, version: '0.9.0' },
  { id: '5', name: 'clients', label: 'Kliendid', icon: '👥', description: 'Klientide ja kontaktide haldus', status: 'todo', category: 'business', components: 0, bugs: 0, todos: 3, version: '0.0.0' },
  { id: '6', name: 'file-vault', label: 'Failihoidla', icon: '📂', description: 'Failide ja dokumentide turvaline hoidla', status: 'active', category: 'utility', components: 2, bugs: 0, todos: 1, version: '1.0.0' },
  { id: '7', name: 'documents', label: 'Dokumendid', icon: '📝', description: 'Dokumentide loomine ja haldus', status: 'active', category: 'business', components: 2, bugs: 0, todos: 0, version: '1.0.0' },
  { id: '8', name: 'employees', label: 'Töötajad', icon: '👔', description: 'Töötajate andmete haldus', status: 'active', category: 'business', components: 3, bugs: 0, todos: 2, version: '1.0.0' },
  { id: '9', name: 'notifications', label: 'Teavitused', icon: '🔔', description: 'Teavituste keskus ja seaded', status: 'active', category: 'core', components: 1, bugs: 0, todos: 1, version: '1.0.0' },
  { id: '10', name: 'reports', label: 'Raportid', icon: '📊', description: 'Aruanded ja analüütika', status: 'active', category: 'utility', components: 1, bugs: 0, todos: 2, version: '1.0.0' },
  { id: '11', name: 'admin', label: 'Administreerimine', icon: '⚙️', description: 'Süsteemi haldus', status: 'active', category: 'admin', components: 5, bugs: 0, todos: 0, version: '1.0.0' },
  { id: '12', name: 'auth', label: 'Autentimine', icon: '🔐', description: 'Sisselogimine ja õigused', status: 'active', category: 'core', components: 4, bugs: 0, todos: 1, version: '1.0.0' },
]

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Aktiivne', color: 'text-green-700', bg: 'bg-green-100' },
  beta: { label: 'Beeta', color: 'text-blue-700', bg: 'bg-blue-100' },
  development: { label: 'Arenduses', color: 'text-yellow-700', bg: 'bg-yellow-100' },
  todo: { label: 'Planeeritud', color: 'text-gray-700', bg: 'bg-gray-100' },
  disabled: { label: 'Keelatud', color: 'text-red-700', bg: 'bg-red-100' },
}

const categoryConfig: Record<string, { label: string; color: string }> = {
  core: { label: 'Tuum', color: 'text-purple-600' },
  business: { label: 'Äri', color: 'text-blue-600' },
  admin: { label: 'Admin', color: 'text-orange-600' },
  utility: { label: 'Utiliit', color: 'text-gray-600' },
}

type SortField = 'label' | 'status' | 'category' | 'components' | 'version'
type SortDirection = 'asc' | 'desc'

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>(mockModules)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('label')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [groupBy, setGroupBy] = useState<'none' | 'status' | 'category'>('none')
  const [selectedModule, setSelectedModule] = useState<Module | null>(null)
  const [showModal, setShowModal] = useState<'view' | 'edit' | 'delete' | 'add' | null>(null)

  // Filter and sort
  const filteredModules = useMemo(() => {
    let result = modules.filter(m => {
      const matchesSearch = search === '' ||
        m.label.toLowerCase().includes(search.toLowerCase()) ||
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.description.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || m.status === statusFilter
      const matchesCategory = categoryFilter === 'all' || m.category === categoryFilter
      return matchesSearch && matchesStatus && matchesCategory
    })

    // Sort
    result.sort((a, b) => {
      let comparison = 0
      if (sortField === 'label') comparison = a.label.localeCompare(b.label)
      else if (sortField === 'status') comparison = a.status.localeCompare(b.status)
      else if (sortField === 'category') comparison = a.category.localeCompare(b.category)
      else if (sortField === 'components') comparison = a.components - b.components
      else if (sortField === 'version') comparison = a.version.localeCompare(b.version)
      return sortDirection === 'asc' ? comparison : -comparison
    })

    return result
  }, [modules, search, statusFilter, categoryFilter, sortField, sortDirection])

  // Group data
  const groupedModules = useMemo(() => {
    if (groupBy === 'none') return { '': filteredModules }
    const groups: Record<string, Module[]> = {}
    filteredModules.forEach(m => {
      const key = groupBy === 'status' ? m.status : m.category
      if (!groups[key]) groups[key] = []
      groups[key].push(m)
    })
    return groups
  }, [filteredModules, groupBy])

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
    total: modules.length,
    active: modules.filter(m => m.status === 'active').length,
    components: modules.reduce((sum, m) => sum + m.components, 0),
  }

  const handleAction = (action: 'view' | 'edit' | 'delete', module: Module) => {
    setSelectedModule(module)
    setShowModal(action)
  }

  const handleStatusChange = (moduleId: string, newStatus: Module['status']) => {
    setModules(modules.map(m => m.id === moduleId ? { ...m, status: newStatus } : m))
    setShowModal(null)
  }

  const confirmDelete = () => {
    if (selectedModule) {
      setModules(modules.filter(m => m.id !== selectedModule.id))
      setShowModal(null)
      setSelectedModule(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Moodulite haldus</h1>
          <p className="text-gray-500 text-sm">Süsteemi moodulite ülevaade</p>
        </div>
        <button
          onClick={() => setShowModal('add')}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-1.5 text-sm"
        >
          <Plus className="w-4 h-4" />
          Lisa moodul
        </button>
      </div>

      {/* Quick stats */}
      <div className="flex gap-4 text-sm">
        <span className="px-2 py-1 bg-gray-100 rounded">Kokku: <strong>{stats.total}</strong></span>
        <span className="px-2 py-1 bg-green-100 text-green-700 rounded">Aktiivsed: <strong>{stats.active}</strong></span>
        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">Komponente: <strong>{stats.components}</strong></span>
      </div>

      {/* Filters and controls */}
      <div className="bg-white rounded-lg border p-3 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Otsi moodulit..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border rounded text-sm"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Filter className="w-4 h-4 text-gray-400" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-2 py-1.5 border rounded text-sm">
            <option value="all">Kõik staatused</option>
            <option value="active">Aktiivne</option>
            <option value="beta">Beeta</option>
            <option value="development">Arenduses</option>
            <option value="todo">Planeeritud</option>
          </select>
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} className="px-2 py-1.5 border rounded text-sm">
            <option value="all">Kõik kategooriad</option>
            <option value="core">Tuum</option>
            <option value="business">Äri</option>
            <option value="admin">Admin</option>
            <option value="utility">Utiliit</option>
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-gray-400" />
          <select value={groupBy} onChange={(e) => setGroupBy(e.target.value as typeof groupBy)} className="px-2 py-1.5 border rounded text-sm">
            <option value="none">Grupeeri...</option>
            <option value="status">Staatuse järgi</option>
            <option value="category">Kategooria järgi</option>
          </select>
        </div>

        {(search || statusFilter !== 'all' || categoryFilter !== 'all') && (
          <button
            onClick={() => { setSearch(''); setStatusFilter('all'); setCategoryFilter('all'); }}
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
                <button onClick={() => handleSort('label')} className="flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900">
                  Moodul <SortIcon field="label" />
                </button>
              </th>
              <th className="text-left px-3 py-2">
                <button onClick={() => handleSort('category')} className="flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900">
                  Kategooria <SortIcon field="category" />
                </button>
              </th>
              <th className="text-left px-3 py-2">
                <button onClick={() => handleSort('status')} className="flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900">
                  Staatus <SortIcon field="status" />
                </button>
              </th>
              <th className="text-center px-3 py-2">
                <button onClick={() => handleSort('components')} className="flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900 mx-auto">
                  Komp. <SortIcon field="components" />
                </button>
              </th>
              <th className="text-center px-3 py-2 font-medium text-gray-600">TODO</th>
              <th className="text-left px-3 py-2">
                <button onClick={() => handleSort('version')} className="flex items-center gap-1 font-medium text-gray-600 hover:text-gray-900">
                  Ver. <SortIcon field="version" />
                </button>
              </th>
              <th className="w-20 px-3 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {Object.entries(groupedModules).map(([group, items]) => (
              <React.Fragment key={group || 'all'}>
                {group && groupBy !== 'none' && (
                  <tr className="bg-gray-100">
                    <td colSpan={7} className="px-3 py-1.5 font-medium text-gray-700 text-xs uppercase tracking-wide">
                      {groupBy === 'status' ? statusConfig[group]?.label : categoryConfig[group]?.label} ({items.length})
                    </td>
                  </tr>
                )}
                {items.map((module) => (
                  <tr key={module.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{module.icon}</span>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">{module.label}</p>
                          <p className="text-xs text-gray-400">{module.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`text-xs font-medium ${categoryConfig[module.category]?.color || ''}`}>
                        {categoryConfig[module.category]?.label}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-xs ${statusConfig[module.status].bg} ${statusConfig[module.status].color}`}>
                        {statusConfig[module.status].label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      <span className={module.components > 0 ? 'text-green-600 font-medium' : 'text-gray-300'}>
                        {module.components}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">
                      {module.todos > 0 ? (
                        <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">{module.todos}</span>
                      ) : (
                        <span className="text-gray-300">0</span>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <code className="text-xs text-gray-500">{module.version}</code>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => handleAction('view', module)} className="p-1 text-gray-400 hover:text-blue-600" title="Vaata">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleAction('edit', module)} className="p-1 text-gray-400 hover:text-green-600" title="Muuda">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleAction('delete', module)} className="p-1 text-gray-400 hover:text-red-600" title="Kustuta">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
        {filteredModules.length === 0 && (
          <div className="text-center py-8 text-gray-500">Mooduleid ei leitud</div>
        )}
      </div>

      {/* Results count */}
      <div className="text-xs text-gray-500">
        Näitan {filteredModules.length} / {modules.length} moodulit
      </div>

      {/* View Modal */}
      {showModal === 'view' && selectedModule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 w-full max-w-md shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{selectedModule.icon}</span>
              <div>
                <h2 className="text-xl font-bold">{selectedModule.label}</h2>
                <p className="text-gray-500 text-sm">{selectedModule.name}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <p><strong>Kirjeldus:</strong> {selectedModule.description}</p>
              <p><strong>Staatus:</strong> <span className={`px-1.5 py-0.5 rounded ${statusConfig[selectedModule.status].bg} ${statusConfig[selectedModule.status].color}`}>{statusConfig[selectedModule.status].label}</span></p>
              <p><strong>Kategooria:</strong> {categoryConfig[selectedModule.category]?.label}</p>
              <p><strong>Versioon:</strong> <code>{selectedModule.version}</code></p>
              <p><strong>Komponente:</strong> {selectedModule.components}</p>
              <p><strong>TODO:</strong> {selectedModule.todos}</p>
            </div>
            <div className="flex justify-end mt-4">
              <button onClick={() => setShowModal(null)} className="px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200 text-sm">Sulge</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showModal === 'edit' && selectedModule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Muuda: {selectedModule.label}</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Staatus</label>
                <select
                  defaultValue={selectedModule.status}
                  onChange={(e) => handleStatusChange(selectedModule.id, e.target.value as Module['status'])}
                  className="w-full p-2 border rounded text-sm"
                >
                  <option value="active">Aktiivne</option>
                  <option value="beta">Beeta</option>
                  <option value="development">Arenduses</option>
                  <option value="todo">Planeeritud</option>
                  <option value="disabled">Keelatud</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowModal(null)} className="px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200 text-sm">Tühista</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showModal === 'delete' && selectedModule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold text-red-600 mb-3">Kustuta moodul?</h2>
            <p className="text-gray-600 text-sm mb-4">
              Kas oled kindel, et soovid kustutada mooduli <strong>{selectedModule.label}</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowModal(null)} className="px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200 text-sm">Tühista</button>
              <button onClick={confirmDelete} className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm">Kustuta</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Modal */}
      {showModal === 'add' && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-5 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Lisa uus moodul</h2>
            <p className="text-gray-600 text-sm mb-3">Uue mooduli loomiseks kasuta käsurida:</p>
            <code className="block bg-gray-100 p-2 rounded text-sm mb-3">pnpm new-module [mooduli-nimi]</code>
            <div className="flex justify-end">
              <button onClick={() => setShowModal(null)} className="px-3 py-1.5 bg-gray-100 rounded hover:bg-gray-200 text-sm">Sulge</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
