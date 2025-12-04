/**
 * VehicleCard - Sõiduki kaart nimekirjas
 *
 * Kompaktne kaart sõiduki info kuvamiseks
 */

'use client'

import { Card } from '@rivest/ui'
import { Car, Wrench, Shield, Gauge, MoreVertical, Eye, Edit, Trash2 } from 'lucide-react'

/**
 * Sõiduki andmed
 */
export interface Vehicle {
  id: string
  registration_number: string
  brand: string
  model: string
  year?: number
  fuel_type?: 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'lpg'
  color?: string
  mileage?: number
  status: 'available' | 'in_use' | 'maintenance' | 'retired'
  next_maintenance?: string
  insurance_valid_until?: string
  tech_inspection_until?: string
}

export interface VehicleCardProps {
  vehicle: Vehicle
  onView?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  showActions?: boolean
}

/**
 * Staatuse värvid
 */
const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  available: { bg: 'bg-green-100', text: 'text-green-800', label: 'Saadaval' },
  in_use: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Kasutuses' },
  maintenance: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Hoolduses' },
  retired: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Kasutusest väljas' },
}

/**
 * Kütuse tüübi tekst
 */
const fuelLabels: Record<string, string> = {
  petrol: 'Bensiin',
  diesel: 'Diisel',
  electric: 'Elekter',
  hybrid: 'Hübriid',
  lpg: 'Gaas',
}

/**
 * Kontrollib kas kuupäev on möödunud või läheneb
 */
function getDateStatus(dateStr?: string): 'ok' | 'warning' | 'danger' | null {
  if (!dateStr) return null
  const date = new Date(dateStr)
  const now = new Date()
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'danger'
  if (diffDays <= 30) return 'warning'
  return 'ok'
}

export function VehicleCard({
  vehicle,
  onView,
  onEdit,
  onDelete,
  showActions = true,
}: VehicleCardProps) {
  const insuranceStatus = getDateStatus(vehicle.insurance_valid_until)
  const maintenanceStatus = getDateStatus(vehicle.next_maintenance)
  const status = statusConfig[vehicle.status] || statusConfig.available

  return (
    <Card
      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onView?.(vehicle.id)}
    >
      <div className="flex justify-between items-start">
        {/* Peamine info */}
        <div className="flex items-start gap-3">
          <div className="p-2 bg-teal-50 rounded-lg">
            <Car className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">{vehicle.registration_number}</h3>
              <span className={`px-2 py-0.5 text-xs rounded-full ${status.bg} ${status.text}`}>
                {status.label}
              </span>
            </div>
            <p className="text-sm text-gray-500">
              {vehicle.brand} {vehicle.model} {vehicle.year && `(${vehicle.year})`}
            </p>
          </div>
        </div>

        {/* Tegevusnupud */}
        {showActions && (
          <div className="relative group">
            <button
              className="p-1 hover:bg-gray-100 rounded"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="w-4 h-4 text-gray-400" />
            </button>
            <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border hidden group-hover:block z-10">
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation()
                  onView?.(vehicle.id)
                }}
              >
                <Eye className="w-4 h-4" /> Vaata
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit?.(vehicle.id)
                }}
              >
                <Edit className="w-4 h-4" /> Muuda
              </button>
              <button
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 text-red-600"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete?.(vehicle.id)
                }}
              >
                <Trash2 className="w-4 h-4" /> Kustuta
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Lisainfo */}
      <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-500">
        {vehicle.mileage && (
          <span className="flex items-center gap-1">
            <Gauge className="w-4 h-4" />
            {vehicle.mileage.toLocaleString()} km
          </span>
        )}
        {vehicle.fuel_type && <span>{fuelLabels[vehicle.fuel_type]}</span>}
        {vehicle.color && <span>{vehicle.color}</span>}
      </div>

      {/* Tähtajad */}
      <div className="mt-3 flex flex-wrap gap-2">
        {vehicle.next_maintenance && (
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${
              maintenanceStatus === 'danger'
                ? 'bg-red-100 text-red-800'
                : maintenanceStatus === 'warning'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Wrench className="w-3 h-3" />
            Hooldus: {new Date(vehicle.next_maintenance).toLocaleDateString('et-EE')}
          </span>
        )}

        {vehicle.insurance_valid_until && (
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded ${
              insuranceStatus === 'danger'
                ? 'bg-red-100 text-red-800'
                : insuranceStatus === 'warning'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Shield className="w-3 h-3" />
            Kindlustus: {new Date(vehicle.insurance_valid_until).toLocaleDateString('et-EE')}
          </span>
        )}
      </div>
    </Card>
  )
}

export default VehicleCard
