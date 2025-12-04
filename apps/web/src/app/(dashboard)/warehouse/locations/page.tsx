'use client'

import { useState, useEffect } from 'react'
import {
  MapPin,
  Plus,
  Search,
  X,
  Edit2,
  Trash2,
  Package,
  Loader2,
  Building2,
} from 'lucide-react'

interface Warehouse {
  id: string
  name: string
  code: string
  type: string
  location?: string
  address?: string
  capacity_m3?: number
  temperature_controlled: boolean
  security_level: string
  status: string
  notes?: string
  created_at: string
  manager?: {
    id: string
    full_name: string
    email: string
  }
}

interface WarehouseFormData {
  name: string
  code: string
  type: string
  location: string
  address: string
  capacity_m3: string
  temperature_controlled: boolean
  security_level: string
  notes: string
}

const initialFormData: WarehouseFormData = {
  name: '',
  code: '',
  type: 'main',
  location: '',
  address: '',
  capacity_m3: '',
  temperature_controlled: false,
  security_level: 'standard',
  notes: '',
}

const warehouseTypes = [
  { value: 'main', label: 'Peamine' },
  { value: 'mobile', label: 'Mobiilne' },
  { value: 'external', label: 'Väline' },
  { value: 'vehicle', label: 'Sõiduk' },
]

const securityLevels = [
  { value: 'low', label: 'Madal' },
  { value: 'standard', label: 'Tavaline' },
  { value: 'high', label: 'Kõrge' },
  { value: 'maximum', label: 'Maksimaalne' },
]

export default function WarehouseLocationsPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null)
  const [formData, setFormData] = useState<WarehouseFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWarehouses()
  }, [])

  const fetchWarehouses = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/warehouse/warehouses')
      const result = await response.json()
      if (result.data) {
        setWarehouses(result.data)
      }
    } catch (err) {
      console.error('Error fetching warehouses:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredWarehouses = warehouses.filter(
    (w) =>
      w.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      w.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (w.location && w.location.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const openCreateModal = () => {
    setEditingWarehouse(null)
    setFormData(initialFormData)
    setError(null)
    setIsModalOpen(true)
  }

  const openEditModal = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse)
    setFormData({
      name: warehouse.name,
      code: warehouse.code,
      type: warehouse.type || 'main',
      location: warehouse.location || '',
      address: warehouse.address || '',
      capacity_m3: warehouse.capacity_m3?.toString() || '',
      temperature_controlled: warehouse.temperature_controlled || false,
      security_level: warehouse.security_level || 'standard',
      notes: warehouse.notes || '',
    })
    setError(null)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
    setEditingWarehouse(null)
    setFormData(initialFormData)
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const payload = {
        name: formData.name,
        code: formData.code,
        type: formData.type,
        location: formData.location || undefined,
        address: formData.address || undefined,
        capacity_m3: formData.capacity_m3 ? parseFloat(formData.capacity_m3) : undefined,
        temperature_controlled: formData.temperature_controlled,
        security_level: formData.security_level,
        notes: formData.notes || undefined,
      }

      const url = editingWarehouse
        ? `/api/warehouse/warehouses/${editingWarehouse.id}`
        : '/api/warehouse/warehouses'

      const response = await fetch(url, {
        method: editingWarehouse ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Salvestamine ebaõnnestus')
      }

      await fetchWarehouses()
      closeModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Viga salvestamisel')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (warehouse: Warehouse) => {
    if (!confirm(`Kas oled kindel, et soovid kustutada lao "${warehouse.name}"?`)) {
      return
    }

    try {
      const response = await fetch(`/api/warehouse/warehouses/${warehouse.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Kustutamine ebaõnnestus')
      }

      await fetchWarehouses()
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Viga kustutamisel')
    }
  }

  // Stats
  const totalWarehouses = warehouses.length
  const mainWarehouses = warehouses.filter((w) => w.type === 'main').length
  const mobileWarehouses = warehouses.filter((w) => w.type === 'mobile').length
  const vehicleWarehouses = warehouses.filter((w) => w.type === 'vehicle').length

  const getTypeLabel = (type: string) => {
    return warehouseTypes.find((t) => t.value === type)?.label || type
  }

  const getSecurityLabel = (level: string) => {
    return securityLevels.find((l) => l.value === level)?.label || level
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Laod</h1>
          <p className="text-slate-600 text-sm mt-1">
            Halda ladude asukohti ja kapatsiteete
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors hover:opacity-90"
          style={{ backgroundColor: '#279989' }}
        >
          <Plus className="h-4 w-4" />
          Lisa ladu
        </button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{totalWarehouses}</p>
              <p className="text-sm text-slate-500">Ladusid kokku</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{mainWarehouses}</p>
              <p className="text-sm text-slate-500">Peamisi</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{mobileWarehouses}</p>
              <p className="text-sm text-slate-500">Mobiilseid</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl border p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{vehicleWarehouses}</p>
              <p className="text-sm text-slate-500">Sõidukitel</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl border p-4 mb-4">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Otsi ladusid..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#279989] focus:border-[#279989]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
          </div>
        ) : filteredWarehouses.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Ladusid pole</h3>
            <p className="text-gray-500 text-sm">
              {searchQuery ? 'Otsingule ei leitud vasteid' : 'Lisa esimene ladu'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">
                  Ladu
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">
                  Tüüp
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">
                  Asukoht
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">
                  Mahutavus
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">
                  Turvalisus
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">
                  Tegevused
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWarehouses.map((warehouse) => (
                <tr key={warehouse.id} className="hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-slate-900">{warehouse.name}</p>
                      <p className="text-sm text-slate-500">{warehouse.code}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                      {getTypeLabel(warehouse.type)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="text-sm">
                        {warehouse.location || warehouse.address || '-'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm text-slate-600">
                      {warehouse.capacity_m3 ? `${warehouse.capacity_m3} m³` : '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        warehouse.security_level === 'maximum'
                          ? 'bg-red-100 text-red-700'
                          : warehouse.security_level === 'high'
                          ? 'bg-orange-100 text-orange-700'
                          : warehouse.security_level === 'standard'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {getSecurityLabel(warehouse.security_level)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => openEditModal(warehouse)}
                        className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(warehouse)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold text-slate-900">
                {editingWarehouse ? 'Muuda ladu' : 'Lisa uus ladu'}
              </h2>
              <button
                onClick={closeModal}
                className="p-1 text-slate-400 hover:text-slate-600 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nimi *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#279989] focus:border-[#279989]"
                    placeholder="nt. Peamine ladu"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Kood *
                  </label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#279989] focus:border-[#279989]"
                    placeholder="nt. LAO-001"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tüüp
                  </label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#279989] focus:border-[#279989]"
                  >
                    {warehouseTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Turvalisuse tase
                  </label>
                  <select
                    value={formData.security_level}
                    onChange={(e) => setFormData({ ...formData, security_level: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#279989] focus:border-[#279989]"
                  >
                    {securityLevels.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Asukoht
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#279989] focus:border-[#279989]"
                  placeholder="nt. Tallinn"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Aadress
                </label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#279989] focus:border-[#279989]"
                  placeholder="nt. Tehnika tn 5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mahutavus (m³)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.capacity_m3}
                  onChange={(e) => setFormData({ ...formData, capacity_m3: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#279989] focus:border-[#279989]"
                  placeholder="nt. 100"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="temperature_controlled"
                  checked={formData.temperature_controlled}
                  onChange={(e) => setFormData({ ...formData, temperature_controlled: e.target.checked })}
                  className="w-4 h-4 text-[#279989] rounded focus:ring-[#279989]"
                />
                <label htmlFor="temperature_controlled" className="text-sm text-slate-700">
                  Temperatuuriga kontrollitud
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Märkmed
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#279989] focus:border-[#279989] resize-none"
                  placeholder="Lisainfo..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Tühista
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:opacity-90 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingWarehouse ? 'Salvesta' : 'Lisa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
