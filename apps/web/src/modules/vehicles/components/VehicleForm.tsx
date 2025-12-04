/**
 * VehicleForm - Sõiduki lisamise/muutmise vorm
 *
 * Kasutab @rivest/ui komponente
 */

'use client'

import { useState } from 'react'
import { Button, Input, Label } from '@rivest/ui'
import { Save, X } from 'lucide-react'

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
  initialValues?: Partial<VehicleFormData>
  onSubmit: (values: VehicleFormData) => Promise<void>
  onCancel?: () => void
  loading?: boolean
}

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
}: VehicleFormProps) {
  const [formData, setFormData] = useState<VehicleFormData>({
    registration_number: '',
    brand: '',
    model: '',
    status: 'available',
    fuel_type: 'petrol',
    ...initialValues,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (field: keyof VehicleFormData, value: string | number | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.registration_number?.trim()) {
      newErrors.registration_number = 'Registreerimisnumber on kohustuslik'
    }
    if (!formData.brand?.trim()) {
      newErrors.brand = 'Mark on kohustuslik'
    }
    if (!formData.model?.trim()) {
      newErrors.model = 'Mudel on kohustuslik'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Põhiandmed */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-4">Põhiandmed</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="registration_number">Registreerimisnumber *</Label>
            <Input
              id="registration_number"
              value={formData.registration_number}
              onChange={(e) => handleChange('registration_number', e.target.value.toUpperCase())}
              placeholder="123ABC"
              className={errors.registration_number ? 'border-red-500' : ''}
            />
            {errors.registration_number && (
              <p className="text-red-500 text-sm mt-1">{errors.registration_number}</p>
            )}
          </div>

          <div>
            <Label htmlFor="brand">Mark *</Label>
            <Input
              id="brand"
              value={formData.brand}
              onChange={(e) => handleChange('brand', e.target.value)}
              placeholder="Toyota"
              className={errors.brand ? 'border-red-500' : ''}
            />
            {errors.brand && <p className="text-red-500 text-sm mt-1">{errors.brand}</p>}
          </div>

          <div>
            <Label htmlFor="model">Mudel *</Label>
            <Input
              id="model"
              value={formData.model}
              onChange={(e) => handleChange('model', e.target.value)}
              placeholder="Corolla"
              className={errors.model ? 'border-red-500' : ''}
            />
            {errors.model && <p className="text-red-500 text-sm mt-1">{errors.model}</p>}
          </div>

          <div>
            <Label htmlFor="year">Aasta</Label>
            <Input
              id="year"
              type="number"
              value={formData.year || ''}
              onChange={(e) =>
                handleChange('year', e.target.value ? parseInt(e.target.value) : undefined)
              }
              placeholder="2024"
              min={1900}
              max={new Date().getFullYear() + 1}
            />
          </div>

          <div>
            <Label htmlFor="color">Värv</Label>
            <Input
              id="color"
              value={formData.color || ''}
              onChange={(e) => handleChange('color', e.target.value)}
              placeholder="Valge"
            />
          </div>

          <div>
            <Label htmlFor="fuel_type">Kütuse tüüp</Label>
            <select
              id="fuel_type"
              value={formData.fuel_type}
              onChange={(e) => handleChange('fuel_type', e.target.value as VehicleFormData['fuel_type'])}
              className="w-full h-10 px-3 border rounded-md"
            >
              {fuelTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="status">Staatus</Label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value as VehicleFormData['status'])}
              className="w-full h-10 px-3 border rounded-md"
            >
              {statusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="vin">VIN kood</Label>
            <Input
              id="vin"
              value={formData.vin || ''}
              onChange={(e) => handleChange('vin', e.target.value.toUpperCase())}
              placeholder="WVWZZZ3CZWE123456"
              maxLength={17}
            />
          </div>

          <div>
            <Label htmlFor="mileage">Läbisõit (km)</Label>
            <Input
              id="mileage"
              type="number"
              value={formData.mileage || ''}
              onChange={(e) =>
                handleChange('mileage', e.target.value ? parseInt(e.target.value) : undefined)
              }
              placeholder="50000"
              min={0}
            />
          </div>
        </div>
      </div>

      {/* Tähtajad */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-4">Tähtajad ja hooldus</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label htmlFor="next_maintenance">Järgmine hooldus</Label>
            <Input
              id="next_maintenance"
              type="date"
              value={formData.next_maintenance || ''}
              onChange={(e) => handleChange('next_maintenance', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="insurance_valid_until">Kindlustus kehtib kuni</Label>
            <Input
              id="insurance_valid_until"
              type="date"
              value={formData.insurance_valid_until || ''}
              onChange={(e) => handleChange('insurance_valid_until', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="tech_inspection_until">Tehnoülevaatus kehtib kuni</Label>
            <Input
              id="tech_inspection_until"
              type="date"
              value={formData.tech_inspection_until || ''}
              onChange={(e) => handleChange('tech_inspection_until', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Märkmed */}
      <div className="bg-white border rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-4">Lisainfo</h3>
        <div>
          <Label htmlFor="notes">Märkmed</Label>
          <textarea
            id="notes"
            value={formData.notes || ''}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Lisainfo sõiduki kohta..."
            rows={4}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
      </div>

      {/* Nupud */}
      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            <X className="w-4 h-4 mr-2" />
            Tühista
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          <Save className="w-4 h-4 mr-2" />
          {loading
            ? 'Salvestamine...'
            : initialValues?.registration_number
              ? 'Salvesta muudatused'
              : 'Lisa sõiduk'}
        </Button>
      </div>
    </form>
  )
}

export default VehicleForm
