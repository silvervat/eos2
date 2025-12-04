/**
 * VehicleForm - Sõiduki lisamise/muutmise vorm
 *
 * Kasutab Ant Design Form komponenti
 * Toetab nii loomist kui muutmist
 */

'use client'

import { Form, Input, InputNumber, Select, DatePicker, Button, Row, Col, Card } from 'antd'
import { SaveOutlined, CloseOutlined } from '@ant-design/icons'
import type { FormInstance } from 'antd/es/form'

/**
 * Sõiduki andmed vormi jaoks
 */
export interface VehicleFormData {
  registration_number: string
  brand: string
  model: string
  year?: number
  vin?: string
  fuel_type?: 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'lpg'
  color?: string
  mileage?: number
  next_maintenance?: string
  insurance_valid_until?: string
  tech_inspection_until?: string
  notes?: string
  status?: 'available' | 'in_use' | 'maintenance' | 'retired'
}

export interface VehicleFormProps {
  /** Olemasolevad andmed (muutmise korral) */
  initialValues?: Partial<VehicleFormData>
  /** Submit callback */
  onSubmit: (values: VehicleFormData) => Promise<void>
  /** Cancel callback */
  onCancel?: () => void
  /** Loading state */
  loading?: boolean
  /** Vormi ref */
  form?: FormInstance<VehicleFormData>
}

const { TextArea } = Input

/**
 * Kütuse tüüpide valikud
 */
const fuelTypeOptions = [
  { value: 'petrol', label: 'Bensiin' },
  { value: 'diesel', label: 'Diisel' },
  { value: 'electric', label: 'Elekter' },
  { value: 'hybrid', label: 'Hübriid' },
  { value: 'lpg', label: 'LPG/Gaas' },
]

/**
 * Staatuse valikud
 */
const statusOptions = [
  { value: 'available', label: 'Saadaval' },
  { value: 'in_use', label: 'Kasutuses' },
  { value: 'maintenance', label: 'Hoolduses' },
  { value: 'retired', label: 'Kasutusest väljas' },
]

export function VehicleForm({
  initialValues,
  onSubmit,
  onCancel,
  loading = false,
  form: externalForm,
}: VehicleFormProps) {
  const [internalForm] = Form.useForm<VehicleFormData>()
  const form = externalForm || internalForm

  const handleFinish = async (values: VehicleFormData) => {
    await onSubmit(values)
  }

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        status: 'available',
        fuel_type: 'petrol',
        ...initialValues,
      }}
      onFinish={handleFinish}
    >
      {/* Põhiandmed */}
      <Card title="Põhiandmed" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="registration_number"
              label="Registreerimisnumber"
              rules={[
                { required: true, message: 'Registreerimisnumber on kohustuslik' },
                { max: 20, message: 'Maksimaalselt 20 tähemärki' },
              ]}
            >
              <Input placeholder="123ABC" style={{ textTransform: 'uppercase' }} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="brand"
              label="Mark"
              rules={[{ required: true, message: 'Mark on kohustuslik' }]}
            >
              <Input placeholder="Toyota" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={8}>
            <Form.Item
              name="model"
              label="Mudel"
              rules={[{ required: true, message: 'Mudel on kohustuslik' }]}
            >
              <Input placeholder="Corolla" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} sm={12} md={6}>
            <Form.Item name="year" label="Aasta">
              <InputNumber
                min={1900}
                max={new Date().getFullYear() + 1}
                style={{ width: '100%' }}
                placeholder="2024"
              />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item name="color" label="Värv">
              <Input placeholder="Valge" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item name="fuel_type" label="Kütuse tüüp">
              <Select options={fuelTypeOptions} />
            </Form.Item>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Form.Item name="status" label="Staatus">
              <Select options={statusOptions} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              name="vin"
              label="VIN kood"
              rules={[{ len: 17, message: 'VIN kood peab olema 17 tähemärki' }]}
            >
              <Input placeholder="WVWZZZ3CZWE123456" maxLength={17} />
            </Form.Item>
          </Col>

          <Col xs={24} md={12}>
            <Form.Item name="mileage" label="Läbisõit (km)">
              <InputNumber min={0} style={{ width: '100%' }} placeholder="50000" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Tähtajad */}
      <Card title="Tähtajad ja hooldus" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col xs={24} sm={8}>
            <Form.Item name="next_maintenance" label="Järgmine hooldus">
              <Input type="date" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
            <Form.Item name="insurance_valid_until" label="Kindlustus kehtib kuni">
              <Input type="date" />
            </Form.Item>
          </Col>

          <Col xs={24} sm={8}>
            <Form.Item name="tech_inspection_until" label="Tehnoülevaatus kehtib kuni">
              <Input type="date" />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      {/* Märkmed */}
      <Card title="Lisainfo" size="small" style={{ marginBottom: 16 }}>
        <Form.Item name="notes" label="Märkmed">
          <TextArea rows={4} placeholder="Lisainfo sõiduki kohta..." />
        </Form.Item>
      </Card>

      {/* Nupud */}
      <Form.Item>
        <Row gutter={8} justify="end">
          {onCancel && (
            <Col>
              <Button icon={<CloseOutlined />} onClick={onCancel}>
                Tühista
              </Button>
            </Col>
          )}
          <Col>
            <Button type="primary" htmlType="submit" loading={loading} icon={<SaveOutlined />}>
              {initialValues?.registration_number ? 'Salvesta muudatused' : 'Lisa sõiduk'}
            </Button>
          </Col>
        </Row>
      </Form.Item>
    </Form>
  )
}

export default VehicleForm
