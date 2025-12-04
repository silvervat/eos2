/**
 * VehicleCard - Sõiduki kaart nimekirjas
 *
 * Kompaktne kaart sõiduki info kuvamiseks
 */

'use client'

import { Card, Tag, Space, Typography, Row, Col, Tooltip, Button, Dropdown } from 'antd'
import type { MenuProps } from 'antd'
import {
  CarOutlined,
  ToolOutlined,
  SafetyCertificateOutlined,
  DashboardOutlined,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  EyeOutlined,
} from '@ant-design/icons'

const { Text, Title } = Typography

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
  /** Kas näidata tegevusnuppe */
  showActions?: boolean
}

/**
 * Staatuse värvid
 */
const statusColors: Record<string, string> = {
  available: 'green',
  in_use: 'blue',
  maintenance: 'orange',
  retired: 'default',
}

/**
 * Staatuse tekst
 */
const statusLabels: Record<string, string> = {
  available: 'Saadaval',
  in_use: 'Kasutuses',
  maintenance: 'Hoolduses',
  retired: 'Kasutusest väljas',
}

/**
 * Kütuse tüübi ikoonid/tekst
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
  const techStatus = getDateStatus(vehicle.tech_inspection_until)
  const maintenanceStatus = getDateStatus(vehicle.next_maintenance)

  const menuItems: MenuProps['items'] = [
    {
      key: 'view',
      icon: <EyeOutlined />,
      label: 'Vaata',
      onClick: () => onView?.(vehicle.id),
    },
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Muuda',
      onClick: () => onEdit?.(vehicle.id),
    },
    { type: 'divider' },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Kustuta',
      danger: true,
      onClick: () => onDelete?.(vehicle.id),
    },
  ]

  return (
    <Card
      hoverable
      size="small"
      onClick={() => onView?.(vehicle.id)}
      style={{ cursor: 'pointer' }}
      extra={
        showActions && (
          <Dropdown menu={{ items: menuItems }} trigger={['click']}>
            <Button
              type="text"
              icon={<MoreOutlined />}
              onClick={(e) => e.stopPropagation()}
            />
          </Dropdown>
        )
      }
    >
      <Row gutter={[16, 8]}>
        {/* Peamine info */}
        <Col xs={24} sm={12}>
          <Space direction="vertical" size={0}>
            <Space>
              <CarOutlined style={{ fontSize: 20, color: '#279989' }} />
              <Title level={5} style={{ margin: 0 }}>
                {vehicle.registration_number}
              </Title>
              <Tag color={statusColors[vehicle.status]}>{statusLabels[vehicle.status]}</Tag>
            </Space>
            <Text type="secondary">
              {vehicle.brand} {vehicle.model} {vehicle.year && `(${vehicle.year})`}
            </Text>
          </Space>
        </Col>

        {/* Lisainfo */}
        <Col xs={24} sm={12}>
          <Space size={16} wrap>
            {vehicle.mileage && (
              <Tooltip title="Läbisõit">
                <Space size={4}>
                  <DashboardOutlined />
                  <Text type="secondary">{vehicle.mileage.toLocaleString()} km</Text>
                </Space>
              </Tooltip>
            )}

            {vehicle.fuel_type && (
              <Text type="secondary">{fuelLabels[vehicle.fuel_type]}</Text>
            )}

            {vehicle.color && <Text type="secondary">{vehicle.color}</Text>}
          </Space>
        </Col>

        {/* Tähtajad */}
        <Col xs={24}>
          <Space size={16} wrap>
            {vehicle.next_maintenance && (
              <Tooltip title="Järgmine hooldus">
                <Tag
                  icon={<ToolOutlined />}
                  color={
                    maintenanceStatus === 'danger'
                      ? 'red'
                      : maintenanceStatus === 'warning'
                        ? 'orange'
                        : 'default'
                  }
                >
                  Hooldus: {new Date(vehicle.next_maintenance).toLocaleDateString('et-EE')}
                </Tag>
              </Tooltip>
            )}

            {vehicle.insurance_valid_until && (
              <Tooltip title="Kindlustus kehtib kuni">
                <Tag
                  icon={<SafetyCertificateOutlined />}
                  color={
                    insuranceStatus === 'danger'
                      ? 'red'
                      : insuranceStatus === 'warning'
                        ? 'orange'
                        : 'default'
                  }
                >
                  Kindlustus: {new Date(vehicle.insurance_valid_until).toLocaleDateString('et-EE')}
                </Tag>
              </Tooltip>
            )}

            {vehicle.tech_inspection_until && (
              <Tooltip title="Tehnoülevaatus kehtib kuni">
                <Tag
                  color={
                    techStatus === 'danger'
                      ? 'red'
                      : techStatus === 'warning'
                        ? 'orange'
                        : 'default'
                  }
                >
                  Ülevaatus: {new Date(vehicle.tech_inspection_until).toLocaleDateString('et-EE')}
                </Tag>
              </Tooltip>
            )}
          </Space>
        </Col>
      </Row>
    </Card>
  )
}

export default VehicleCard
