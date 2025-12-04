'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Ruler,
  Plus,
  Search,
  Edit,
  Trash2,
  XCircle,
  CheckCircle,
} from 'lucide-react'

interface Unit {
  id: string
  code: string
  name: string
  description?: string
  is_active: boolean
  created_at: string
}

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newUnit, setNewUnit] = useState({ code: '', name: '', description: '' })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    fetchUnits()
  }, [])

  const fetchUnits = async () => {
    try {
      const res = await fetch('/api/quotes/units')
      if (res.ok) {
        const data = await res.json()
        setUnits(data.units || [])
      }
    } catch (error) {
      console.error('Failed to fetch units:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddUnit = async () => {
    if (!newUnit.code || !newUnit.name) return

    setIsSaving(true)
    try {
      const res = await fetch('/api/quotes/units', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUnit),
      })

      if (res.ok) {
        await fetchUnits()
        setShowAddModal(false)
        setNewUnit({ code: '', name: '', description: '' })
      }
    } catch (error) {
      console.error('Failed to add unit:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const filteredUnits = units.filter((unit) => {
    return (
      unit.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      unit.name?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-1">
            <Link href="/quotes" className="hover:text-[#279989]">Hinnapakkumised</Link>
            <span>/</span>
            <span>Ühikud</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">Ühikud</h1>
          <p className="text-sm text-slate-500">Halda mõõtühikuid pakkumiste jaoks</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white rounded-lg"
          style={{ backgroundColor: '#279989' }}
        >
          <Plus className="w-4 h-4" />
          Uus ühik
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-slate-500 text-xs mb-1"><Ruler className="w-3.5 h-3.5" />Ühikuid kokku</div>
          <div className="text-xl font-bold text-slate-900">{units.length}</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-slate-200">
          <div className="flex items-center gap-2 text-green-500 text-xs mb-1"><CheckCircle className="w-3.5 h-3.5" />Aktiivsed</div>
          <div className="text-xl font-bold text-green-600">{units.filter((u) => u.is_active).length}</div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Otsi ühikut..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#279989]" />
          </div>
        ) : filteredUnits.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            {searchQuery ? 'Ühikuid ei leitud' : 'Ühikud puuduvad'}
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Kood</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Nimetus</th>
                <th className="text-left text-xs font-medium text-slate-500 uppercase px-4 py-3">Kirjeldus</th>
                <th className="text-center text-xs font-medium text-slate-500 uppercase px-4 py-3">Staatus</th>
                <th className="text-right text-xs font-medium text-slate-500 uppercase px-4 py-3">Tegevused</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUnits.map((unit) => (
                <tr key={unit.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm font-medium text-slate-900">{unit.code}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-900">{unit.name}</td>
                  <td className="px-4 py-3 text-sm text-slate-500">{unit.description || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${unit.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                      {unit.is_active ? 'Aktiivne' : 'Mitteaktiivne'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 hover:bg-slate-100 rounded" title="Muuda"><Edit className="w-4 h-4 text-slate-500" /></button>
                      <button className="p-1.5 hover:bg-red-50 rounded" title="Kustuta"><Trash2 className="w-4 h-4 text-red-500" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md m-4">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Uus ühik</h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 hover:bg-slate-100 rounded"><XCircle className="w-5 h-5 text-slate-500" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kood *</label>
                <input
                  type="text"
                  value={newUnit.code}
                  onChange={(e) => setNewUnit({ ...newUnit, code: e.target.value })}
                  placeholder="tk, m, kg, h..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nimetus *</label>
                <input
                  type="text"
                  value={newUnit.name}
                  onChange={(e) => setNewUnit({ ...newUnit, name: e.target.value })}
                  placeholder="tükk, meeter, kilogramm, tund..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kirjeldus</label>
                <input
                  type="text"
                  value={newUnit.description}
                  onChange={(e) => setNewUnit({ ...newUnit, description: e.target.value })}
                  placeholder="Valikuline kirjeldus..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
                />
              </div>
            </div>
            <div className="p-4 border-t border-slate-200 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg"
              >
                Tühista
              </button>
              <button
                onClick={handleAddUnit}
                disabled={isSaving || !newUnit.code || !newUnit.name}
                className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50"
                style={{ backgroundColor: '#279989' }}
              >
                {isSaving ? 'Salvestab...' : 'Lisa ühik'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
