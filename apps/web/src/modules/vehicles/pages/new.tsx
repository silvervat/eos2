/**
 * New Vehicle Page
 *
 * Uue sõiduki lisamise leht
 * URL: /vehicles/new
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, Card } from '@rivest/ui'
import { ArrowLeft, Car } from 'lucide-react'
import { VehicleForm, type VehicleFormData } from '../components/VehicleForm'

export default function NewVehiclePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (values: VehicleFormData) => {
    try {
      setLoading(true)

      // TODO: Asenda Supabase insert päringuga
      // const { data, error } = await supabase
      //   .from('vehicles')
      //   .insert({
      //     ...values,
      //     tenant_id: user.tenant_id,
      //     created_by: user.id,
      //   })
      //   .select()
      //   .single()

      // Mock delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      alert('Sõiduk lisatud!')
      router.push('/vehicles')
    } catch (error) {
      console.error('Sõiduki lisamine ebaõnnestus:', error)
      alert('Sõiduki lisamine ebaõnnestus')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/vehicles')
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
          <h1 className="text-xl font-bold text-gray-900">Lisa uus sõiduk</h1>
        </div>

        <VehicleForm onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} />
      </Card>
    </div>
  )
}
