/**
 * Edit Vehicle Page
 *
 * Sõiduki muutmise leht
 * URL: /vehicles/[id]/edit
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button, Card } from '@rivest/ui'
import { ArrowLeft, Car } from 'lucide-react'
import { VehicleForm, type VehicleFormData } from '../components/VehicleForm'

export default function EditVehiclePage() {
  const router = useRouter()
  const params = useParams()
  const vehicleId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [vehicle, setVehicle] = useState<VehicleFormData | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function loadVehicle() {
      try {
        setLoading(true)

        // TODO: Asenda Supabase päringuga
        // Mock data
        await new Promise((resolve) => setTimeout(resolve, 500))
        setVehicle({
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
          notes: 'Näidis sõiduk testimiseks',
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

  const handleSubmit = async (values: VehicleFormData) => {
    try {
      setSaving(true)

      // TODO: Asenda Supabase update päringuga
      // Mock delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      alert('Sõiduk uuendatud!')
      router.push(`/vehicles/${vehicleId}`)
    } catch (error) {
      console.error('Sõiduki uuendamine ebaõnnestus:', error)
      alert('Sõiduki uuendamine ebaõnnestus')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push(`/vehicles/${vehicleId}`)
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

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" onClick={handleCancel}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Tagasi
        </Button>
      </div>

      {/* Form */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-teal-50 rounded-lg">
            <Car className="w-6 h-6 text-teal-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            Muuda sõidukit: {vehicle.registration_number}
          </h1>
        </div>

        <VehicleForm
          initialValues={vehicle}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={saving}
        />
      </Card>
    </div>
  )
}
