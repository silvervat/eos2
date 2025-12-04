'use client'

/**
 * Vehicles List Page
 *
 * Sõidukite nimekiri filtritega
 */

import React, { useState } from 'react'
import Link from 'next/link'
import { ProtectedComponent, useModulePermissions } from '@/core/permissions'
import definition from '../definition'

// Mock andmed - asenda Supabase päringuga
const mockVehicles = [
  {
    id: '1',
    registration_number: '123ABC',
    make: 'Toyota',
    model: 'Hilux',
    year: 2022,
    status: 'available',
    odometer: 45000,
    fuel_type: 'diesel',
  },
  {
    id: '2',
    registration_number: '456DEF',
    make: 'Volkswagen',
    model: 'Transporter',
    year: 2021,
    status: 'in_use',
    odometer: 78000,
    fuel_type: 'diesel',
  },
  {
    id: '3',
    registration_number: '789GHI',
    make: 'Ford',
    model: 'Transit',
    year: 2020,
    status: 'maintenance',
    odometer: 120000,
    fuel_type: 'diesel',
  },
  {
    id: '4',
    registration_number: '101JKL',
    make: 'Mercedes-Benz',
    model: 'Sprinter',
    year: 2023,
    status: 'available',
    odometer: 15000,
    fuel_type: 'diesel',
  },
]

// Staatuse badge
function StatusBadge({ status }: { status: string }) {
  const statusConfig = definition.statuses?.[status]
  if (!statusConfig) return null

  return (
    <span
      className="px-2 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: statusConfig.bg,
        color: statusConfig.color,
      }}
    >
      {statusConfig.icon} {statusConfig.label}
    </span>
  )
}

export default function VehiclesListPage() {
  const [filter, setFilter] = useState<string>('all')
  const [vehicles] = useState(mockVehicles)
  const { canCreate, canUpdate, canDelete } = useModulePermissions('vehicle')

  const filteredVehicles =
    filter === 'all' ? vehicles : vehicles.filter((v) => v.status === filter)

  const stats = {
    total: vehicles.length,
    available: vehicles.filter((v) => v.status === 'available').length,
    in_use: vehicles.filter((v) => v.status === 'in_use').length,
    maintenance: vehicles.filter((v) => v.status === 'maintenance').length,
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">🚗 Sõidukid</h1>
          <p className="text-gray-500">Sõidukipargi haldus</p>
        </div>
        <ProtectedComponent permission="vehicle:create">
          <Link
            href="/vehicles/new"
            className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] transition-colors"
          >
            + Lisa sõiduk
          </Link>
        </ProtectedComponent>
      </div>

      {/* Statistika */}
      <div className="grid grid-cols-4 gap-4">
        <button
          onClick={() => setFilter('all')}
          className={`p-4 rounded-lg border text-left transition-colors ${
            filter === 'all' ? 'border-[#279989] bg-[#e6f7f5]' : 'hover:bg-gray-50'
          }`}
        >
          <p className="text-2xl font-bold">{stats.total}</p>
          <p className="text-sm text-gray-500">Kokku</p>
        </button>
        <button
          onClick={() => setFilter('available')}
          className={`p-4 rounded-lg border text-left transition-colors ${
            filter === 'available' ? 'border-green-500 bg-green-50' : 'hover:bg-gray-50'
          }`}
        >
          <p className="text-2xl font-bold text-green-600">{stats.available}</p>
          <p className="text-sm text-gray-500">Vabad</p>
        </button>
        <button
          onClick={() => setFilter('in_use')}
          className={`p-4 rounded-lg border text-left transition-colors ${
            filter === 'in_use' ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
          }`}
        >
          <p className="text-2xl font-bold text-blue-600">{stats.in_use}</p>
          <p className="text-sm text-gray-500">Kasutuses</p>
        </button>
        <button
          onClick={() => setFilter('maintenance')}
          className={`p-4 rounded-lg border text-left transition-colors ${
            filter === 'maintenance' ? 'border-yellow-500 bg-yellow-50' : 'hover:bg-gray-50'
          }`}
        >
          <p className="text-2xl font-bold text-yellow-600">{stats.maintenance}</p>
          <p className="text-sm text-gray-500">Hoolduses</p>
        </button>
      </div>

      {/* Tabel */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Sõiduk</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Staatus</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Läbisõit</th>
              <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Kütus</th>
              <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">Toimingud</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredVehicles.map((vehicle) => (
              <tr key={vehicle.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <p className="font-medium text-gray-900">
                      {vehicle.make} {vehicle.model}
                    </p>
                    <p className="text-sm text-gray-500">
                      {vehicle.registration_number} • {vehicle.year}
                    </p>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={vehicle.status} />
                </td>
                <td className="px-6 py-4 text-right text-gray-600">
                  {vehicle.odometer.toLocaleString()} km
                </td>
                <td className="px-6 py-4 text-gray-600 capitalize">{vehicle.fuel_type}</td>
                <td className="px-6 py-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/vehicles/${vehicle.id}`}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      👁️
                    </Link>
                    {canUpdate && (
                      <Link
                        href={`/vehicles/${vehicle.id}/edit`}
                        className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                      >
                        ✏️
                      </Link>
                    )}
                    {canDelete && (
                      <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                        🗑️
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredVehicles.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <p className="text-4xl mb-2">🚗</p>
            <p>Sõidukeid ei leitud</p>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <p className="text-blue-800">
          <strong>💡 Vihje:</strong> See on näidismoodul mis demonstreerib EOS2 modulaarset
          arhitektuuri. Vaata definitsiooni:{' '}
          <code className="bg-blue-100 px-2 py-1 rounded">
            modules/vehicles/definition.ts
          </code>
        </p>
      </div>
    </div>
  )
}
