/**
 * Vehicle Detail Page
 *
 * Sõiduki detailvaade koos kõigi andmetega
 * URL: /vehicles/[id]
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button, Card } from '@rivest/ui'
import { ArrowLeft, Edit, Trash2, Car, Shield, Wrench, Gauge, History } from 'lucide-react'
import { ProtectedComponent } from '@/core/permissions'
import type { Vehicle } from '../components/VehicleCard'

const statusConfig: Record<string, { bg: string; text: string; label: string }> = {
  available: { bg: 'bg-green-100', text: 'text-green-800', label: 'Saadaval' },
  in_use: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Kasutuses' },
  maintenance: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Hoolduses' },
  retired: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Kasutusest väljas' },
}

const fuelLabels: Record<string, string> = {
  petrol: 'Bensiin',
  diesel: 'Diisel',
  electric: 'Elekter',
  hybrid: 'Hübriid',
  lpg: 'Gaas',
}

export default function VehicleDetailPage() {
  const router = useRouter()
  const params = useParams()
  const vehicleId = params?.id as string

  const [vehicle, setVehicle] = useState<Vehicle | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'info' | 'deadlines' | 'history'>('info')

  useEffect(() => {
    async function loadVehicle() {
      try {
        setLoading(true)
        // Mock data for development
        await new Promise((resolve) => setTimeout(resolve, 500))
        setVehicle({
          id: vehicleId,
          registration_number: '123ABC',
          brand: 'Toyota',
          model: 'Corolla',
          year: 2022,
          fuel_type: 'hybrid',
          color: 'Valge',
          mileage: 45000,
          status: 'available',
          next_maintenance: '2024-03-15',
          insurance_valid_until: '2024-12-31',
          tech_inspection_until: '2025-06-30',
        })
      } catch (err) {
        setError('Sõiduki laadimine ebaõnnestus')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    if (vehicleId) {
      loadVehicle()
    }
  }, [vehicleId])

  const handleDelete = () => {
    if (confirm(`Kas oled kindel, et soovid sõiduki ${vehicle?.registration_number} kustutada?`)) {
      // TODO: Supabase delete
      router.push('/vehicles')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
      </div>
    )
  }

  if (error || !vehicle) {
    return (
      <div className="p-6 text-center">
        <div className="text-6xl mb-4">❌</div>
        <h2 className="text-xl font-bold text-gray-800 mb-2">Sõidukit ei leitud</h2>
        <p className="text-gray-500 mb-4">{error || 'Soovitud sõidukit ei eksisteeri'}</p>
        <Button onClick={() => router.push('/vehicles')}>Tagasi nimekirja</Button>
      </div>
    )
  }

  const status = statusConfig[vehicle.status] || statusConfig.available

  const getDeadlineStatus = (dateStr?: string) => {
    if (!dateStr) return null
    const date = new Date(dateStr)
    const now = new Date()
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    return { date, diffDays }
  }

  const insuranceInfo = getDeadlineStatus(vehicle.insurance_valid_until)
  const techInfo = getDeadlineStatus(vehicle.tech_inspection_until)
  const maintenanceInfo = getDeadlineStatus(vehicle.next_maintenance)

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={() => router.push('/vehicles')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tagasi
        </Button>
      </div>

      {/* Main Card */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-teal-50 rounded-lg">
              <Car className="w-8 h-8 text-teal-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {vehicle.brand} {vehicle.model}
              </h1>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-gray-500">{vehicle.registration_number}</span>
                <span className={`px-2 py-0.5 text-xs rounded-full ${status.bg} ${status.text}`}>
                  {status.label}
                </span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <ProtectedComponent permission="vehicles:update">
              <Button variant="outline" onClick={() => router.push(`/vehicles/${vehicleId}/edit`)}>
                <Edit className="w-4 h-4 mr-2" />
                Muuda
              </Button>
            </ProtectedComponent>
            <ProtectedComponent permission="vehicles:delete">
              <Button variant="outline" className="text-red-600" onClick={handleDelete}>
                <Trash2 className="w-4 h-4 mr-2" />
                Kustuta
              </Button>
            </ProtectedComponent>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b mb-6">
          <div className="flex gap-4">
            <button
              className={`pb-2 px-1 ${activeTab === 'info' ? 'border-b-2 border-teal-600 text-teal-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('info')}
            >
              <Car className="w-4 h-4 inline mr-1" /> Põhiinfo
            </button>
            <button
              className={`pb-2 px-1 ${activeTab === 'deadlines' ? 'border-b-2 border-teal-600 text-teal-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('deadlines')}
            >
              <Shield className="w-4 h-4 inline mr-1" /> Tähtajad
            </button>
            <button
              className={`pb-2 px-1 ${activeTab === 'history' ? 'border-b-2 border-teal-600 text-teal-600' : 'text-gray-500'}`}
              onClick={() => setActiveTab('history')}
            >
              <History className="w-4 h-4 inline mr-1" /> Ajalugu
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Registreerimisnumber</p>
              <p className="font-semibold">{vehicle.registration_number}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Mark</p>
              <p className="font-semibold">{vehicle.brand}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Mudel</p>
              <p className="font-semibold">{vehicle.model}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Aasta</p>
              <p className="font-semibold">{vehicle.year || '-'}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Värv</p>
              <p className="font-semibold">{vehicle.color || '-'}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Kütuse tüüp</p>
              <p className="font-semibold">{vehicle.fuel_type ? fuelLabels[vehicle.fuel_type] : '-'}</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">Läbisõit</p>
              <p className="font-semibold">{vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : '-'}</p>
            </div>
          </div>
        )}

        {activeTab === 'deadlines' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-5 h-5 text-teal-600" />
                <span className="text-sm text-gray-500">Kindlustus kehtib</span>
              </div>
              <p className={`text-xl font-bold ${insuranceInfo && insuranceInfo.diffDays < 0 ? 'text-red-600' : insuranceInfo && insuranceInfo.diffDays < 30 ? 'text-orange-500' : 'text-green-600'}`}>
                {insuranceInfo ? insuranceInfo.date.toLocaleDateString('et-EE') : 'Määramata'}
              </p>
              {insuranceInfo && (
                <p className="text-sm text-gray-500 mt-1">
                  {insuranceInfo.diffDays < 0 ? `Aegunud ${Math.abs(insuranceInfo.diffDays)} päeva` : `${insuranceInfo.diffDays} päeva`}
                </p>
              )}
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="w-5 h-5 text-teal-600" />
                <span className="text-sm text-gray-500">Tehnoülevaatus kehtib</span>
              </div>
              <p className={`text-xl font-bold ${techInfo && techInfo.diffDays < 0 ? 'text-red-600' : techInfo && techInfo.diffDays < 30 ? 'text-orange-500' : 'text-green-600'}`}>
                {techInfo ? techInfo.date.toLocaleDateString('et-EE') : 'Määramata'}
              </p>
              {techInfo && (
                <p className="text-sm text-gray-500 mt-1">
                  {techInfo.diffDays < 0 ? `Aegunud ${Math.abs(techInfo.diffDays)} päeva` : `${techInfo.diffDays} päeva`}
                </p>
              )}
            </Card>

            <Card className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="w-5 h-5 text-teal-600" />
                <span className="text-sm text-gray-500">Järgmine hooldus</span>
              </div>
              <p className={`text-xl font-bold ${maintenanceInfo && maintenanceInfo.diffDays < 0 ? 'text-red-600' : maintenanceInfo && maintenanceInfo.diffDays < 30 ? 'text-orange-500' : 'text-green-600'}`}>
                {maintenanceInfo ? maintenanceInfo.date.toLocaleDateString('et-EE') : 'Määramata'}
              </p>
              {maintenanceInfo && (
                <p className="text-sm text-gray-500 mt-1">
                  {maintenanceInfo.diffDays < 0 ? `Hilinenud ${Math.abs(maintenanceInfo.diffDays)} päeva` : `${maintenanceInfo.diffDays} päeva`}
                </p>
              )}
            </Card>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-3 h-3 bg-green-500 rounded-full mt-1.5"></div>
              <div>
                <p className="font-medium">Sõiduk lisatud</p>
                <p className="text-sm text-gray-500">01.01.2024 09:00</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-3 h-3 bg-blue-500 rounded-full mt-1.5"></div>
              <div>
                <p className="font-medium">Hooldus tehtud</p>
                <p className="text-sm text-gray-500">15.02.2024 14:30</p>
                <p className="text-sm text-gray-400">Läbisõit: 42,000 km</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-3 h-3 bg-gray-300 rounded-full mt-1.5"></div>
              <div>
                <p className="font-medium text-gray-400">TODO: Ajaloo laadimine andmebaasist</p>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
