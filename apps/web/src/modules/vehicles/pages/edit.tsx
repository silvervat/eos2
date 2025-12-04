/**
 * Edit Vehicle Page
 *
 * Sõiduki muutmise leht
 * URL: /vehicles/[id]/edit
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Card, message, Button, Space, Spin, Result } from 'antd'
import { ArrowLeftOutlined, CarOutlined } from '@ant-design/icons'
import { VehicleForm, type VehicleFormData } from '../components/VehicleForm'

export default function EditVehiclePage() {
  const router = useRouter()
  const params = useParams()
  const vehicleId = params?.id as string

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [vehicle, setVehicle] = useState<VehicleFormData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Laadi sõiduki andmed
  useEffect(() => {
    async function loadVehicle() {
      try {
        setLoading(true)

        // TODO: Asenda Supabase päringuga
        // const { data, error } = await supabase
        //   .from('vehicles')
        //   .select('*')
        //   .eq('id', vehicleId)
        //   .single()

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
      // const { data, error } = await supabase
      //   .from('vehicles')
      //   .update({
      //     ...values,
      //     updated_at: new Date().toISOString(),
      //   })
      //   .eq('id', vehicleId)
      //   .select()
      //   .single()

      // Mock delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      message.success('Sõiduk uuendatud!')
      router.push(`/vehicles/${vehicleId}`)
    } catch (error) {
      console.error('Sõiduki uuendamine ebaõnnestus:', error)
      message.error('Sõiduki uuendamine ebaõnnestus')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push(`/vehicles/${vehicleId}`)
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 100 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (error || !vehicle) {
    return (
      <Result
        status="error"
        title="Sõidukit ei leitud"
        subTitle={error || 'Soovitud sõidukit ei eksisteeri'}
        extra={
          <Button type="primary" onClick={() => router.push('/vehicles')}>
            Tagasi nimekirja
          </Button>
        }
      />
    )
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={handleCancel}>
            Tagasi
          </Button>
        </Space>
      </div>

      {/* Form */}
      <Card
        title={
          <Space>
            <CarOutlined style={{ color: '#279989' }} />
            <span>Muuda sõidukit: {vehicle.registration_number}</span>
          </Space>
        }
      >
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
