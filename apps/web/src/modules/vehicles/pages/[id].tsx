/**
 * Vehicle Detail Page
 *
 * Sõiduki detailvaade koos kõigi andmetega
 * URL: /vehicles/[id]
 */

'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  Card,
  Descriptions,
  Tag,
  Button,
  Space,
  Spin,
  Result,
  Tabs,
  Timeline,
  Table,
  Modal,
  message,
  Row,
  Col,
  Statistic,
} from 'antd'
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  CarOutlined,
  ToolOutlined,
  SafetyCertificateOutlined,
  HistoryOutlined,
  DashboardOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons'
import { ProtectedComponent } from '@/core/permissions'
import type { Vehicle } from '../components/VehicleCard'

/**
 * Staatuse värvid
 */
const statusColors: Record<string, string> = {
  available: 'green',
  in_use: 'blue',
  maintenance: 'orange',
  retired: 'default',
}

const statusLabels: Record<string, string> = {
  available: 'Saadaval',
  in_use: 'Kasutuses',
  maintenance: 'Hoolduses',
  retired: 'Kasutusest väljas',
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

  // Kustutamise kinnitus
  const handleDelete = () => {
    Modal.confirm({
      title: 'Kas oled kindel?',
      icon: <ExclamationCircleOutlined />,
      content: `Sõiduk ${vehicle?.registration_number} kustutatakse jäädavalt.`,
      okText: 'Jah, kustuta',
      okType: 'danger',
      cancelText: 'Tühista',
      onOk: async () => {
        try {
          // TODO: Supabase delete
          message.success('Sõiduk kustutatud')
          router.push('/vehicles')
        } catch (err) {
          message.error('Kustutamine ebaõnnestus')
        }
      },
    })
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

  // Tähtaegade staatus
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

  const tabItems = [
    {
      key: 'info',
      label: (
        <span>
          <CarOutlined /> Põhiinfo
        </span>
      ),
      children: (
        <Descriptions bordered column={{ xs: 1, sm: 2, lg: 3 }}>
          <Descriptions.Item label="Registreerimisnumber">
            <strong>{vehicle.registration_number}</strong>
          </Descriptions.Item>
          <Descriptions.Item label="Staatus">
            <Tag color={statusColors[vehicle.status]}>{statusLabels[vehicle.status]}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Mark">{vehicle.brand}</Descriptions.Item>
          <Descriptions.Item label="Mudel">{vehicle.model}</Descriptions.Item>
          <Descriptions.Item label="Aasta">{vehicle.year || '-'}</Descriptions.Item>
          <Descriptions.Item label="Värv">{vehicle.color || '-'}</Descriptions.Item>
          <Descriptions.Item label="Kütuse tüüp">
            {vehicle.fuel_type ? fuelLabels[vehicle.fuel_type] : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="Läbisõit">
            {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} km` : '-'}
          </Descriptions.Item>
          <Descriptions.Item label="VIN kood">{(vehicle as any).vin || '-'}</Descriptions.Item>
        </Descriptions>
      ),
    },
    {
      key: 'deadlines',
      label: (
        <span>
          <SafetyCertificateOutlined /> Tähtajad
        </span>
      ),
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="Kindlustus kehtib"
                value={
                  insuranceInfo
                    ? insuranceInfo.date.toLocaleDateString('et-EE')
                    : 'Määramata'
                }
                prefix={<SafetyCertificateOutlined />}
                valueStyle={{
                  color:
                    insuranceInfo && insuranceInfo.diffDays < 0
                      ? '#ff4d4f'
                      : insuranceInfo && insuranceInfo.diffDays < 30
                        ? '#faad14'
                        : '#52c41a',
                }}
              />
              {insuranceInfo && (
                <div style={{ marginTop: 8 }}>
                  {insuranceInfo.diffDays < 0 ? (
                    <Tag color="red">Aegunud {Math.abs(insuranceInfo.diffDays)} päeva</Tag>
                  ) : (
                    <Tag color={insuranceInfo.diffDays < 30 ? 'orange' : 'green'}>
                      {insuranceInfo.diffDays} päeva
                    </Tag>
                  )}
                </div>
              )}
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="Tehnoülevaatus kehtib"
                value={techInfo ? techInfo.date.toLocaleDateString('et-EE') : 'Määramata'}
                prefix={<ToolOutlined />}
                valueStyle={{
                  color:
                    techInfo && techInfo.diffDays < 0
                      ? '#ff4d4f'
                      : techInfo && techInfo.diffDays < 30
                        ? '#faad14'
                        : '#52c41a',
                }}
              />
              {techInfo && (
                <div style={{ marginTop: 8 }}>
                  {techInfo.diffDays < 0 ? (
                    <Tag color="red">Aegunud {Math.abs(techInfo.diffDays)} päeva</Tag>
                  ) : (
                    <Tag color={techInfo.diffDays < 30 ? 'orange' : 'green'}>
                      {techInfo.diffDays} päeva
                    </Tag>
                  )}
                </div>
              )}
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small">
              <Statistic
                title="Järgmine hooldus"
                value={
                  maintenanceInfo
                    ? maintenanceInfo.date.toLocaleDateString('et-EE')
                    : 'Määramata'
                }
                prefix={<DashboardOutlined />}
                valueStyle={{
                  color:
                    maintenanceInfo && maintenanceInfo.diffDays < 0
                      ? '#ff4d4f'
                      : maintenanceInfo && maintenanceInfo.diffDays < 30
                        ? '#faad14'
                        : '#52c41a',
                }}
              />
              {maintenanceInfo && (
                <div style={{ marginTop: 8 }}>
                  {maintenanceInfo.diffDays < 0 ? (
                    <Tag color="red">Hilinenud {Math.abs(maintenanceInfo.diffDays)} päeva</Tag>
                  ) : (
                    <Tag color={maintenanceInfo.diffDays < 30 ? 'orange' : 'green'}>
                      {maintenanceInfo.diffDays} päeva
                    </Tag>
                  )}
                </div>
              )}
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'history',
      label: (
        <span>
          <HistoryOutlined /> Ajalugu
        </span>
      ),
      children: (
        <Timeline
          items={[
            {
              color: 'green',
              children: (
                <>
                  <strong>Sõiduk lisatud</strong>
                  <br />
                  <span style={{ color: '#888' }}>01.01.2024 09:00</span>
                </>
              ),
            },
            {
              color: 'blue',
              children: (
                <>
                  <strong>Hooldus tehtud</strong>
                  <br />
                  <span style={{ color: '#888' }}>15.02.2024 14:30</span>
                  <br />
                  <span>Läbisõit: 42,000 km</span>
                </>
              ),
            },
            {
              color: 'gray',
              children: (
                <>
                  <strong>TODO: Ajaloo laadimine andmebaasist</strong>
                </>
              ),
            },
          ]}
        />
      ),
    },
  ]

  return (
    <div style={{ padding: 24 }}>
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => router.push('/vehicles')}>
            Tagasi
          </Button>
        </Space>
      </div>

      {/* Pealkiri */}
      <Card
        title={
          <Space>
            <CarOutlined style={{ color: '#279989' }} />
            <span>
              {vehicle.brand} {vehicle.model}
            </span>
            <Tag>{vehicle.registration_number}</Tag>
            <Tag color={statusColors[vehicle.status]}>{statusLabels[vehicle.status]}</Tag>
          </Space>
        }
        extra={
          <Space>
            <ProtectedComponent permission="vehicles:update">
              <Button
                icon={<EditOutlined />}
                onClick={() => router.push(`/vehicles/${vehicleId}/edit`)}
              >
                Muuda
              </Button>
            </ProtectedComponent>
            <ProtectedComponent permission="vehicles:delete">
              <Button icon={<DeleteOutlined />} danger onClick={handleDelete}>
                Kustuta
              </Button>
            </ProtectedComponent>
          </Space>
        }
      >
        <Tabs items={tabItems} defaultActiveKey="info" />
      </Card>
    </div>
  )
}
