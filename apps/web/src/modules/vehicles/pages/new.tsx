/**
 * New Vehicle Page
 *
 * Uue sõiduki lisamise leht
 * URL: /vehicles/new
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, message, Button, Space } from 'antd'
import { ArrowLeftOutlined, CarOutlined } from '@ant-design/icons'
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

      message.success('Sõiduk lisatud!')
      router.push('/vehicles')
    } catch (error) {
      console.error('Sõiduki lisamine ebaõnnestus:', error)
      message.error('Sõiduki lisamine ebaõnnestus')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/vehicles')
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
            <span>Lisa uus sõiduk</span>
          </Space>
        }
      >
        <VehicleForm onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} />
      </Card>
    </div>
  )
}
