'use client'

/**
 * Personnel - Kompetentsid (Competencies/Certifications)
 * Tracks employee certifications, expiration dates, and planning
 */

import React, { useState, useMemo } from 'react'
import {
  Award,
  Plus,
  Search,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Upload,
  FileText,
  Filter,
  Download,
  X,
  Eye,
  Bell,
  ChevronDown,
  Scan,
} from 'lucide-react'
import { OcrScanner } from '@/components/shared/OcrScanner'

interface Certification {
  id: string
  employeeId: string
  employeeName: string
  type: string
  name: string
  issuedDate: string
  expiryDate: string
  issuer: string
  certificateNumber?: string
  status: 'valid' | 'expiring_soon' | 'expired' | 'pending'
  fileUrl?: string
  notes?: string
  nextPlannedDate?: string
}

interface Employee {
  id: string
  name: string
  department: string
}

const mockEmployees: Employee[] = [
  { id: '1', name: 'Jaan Tamm', department: 'Montaaž' },
  { id: '2', name: 'Peeter Mets', department: 'Montaaž' },
  { id: '3', name: 'Andres Kask', department: 'PTV' },
  { id: '4', name: 'Tiit Lepp', department: 'PTV' },
  { id: '5', name: 'Mari Maasikas', department: 'Projektid' },
  { id: '6', name: 'Kati Kask', department: 'Müük' },
]

const certificationTypes = [
  { id: 'hot_work', name: 'Tulitööde tunnistus', validYears: 5 },
  { id: 'electrical', name: 'Elektritööde tunnistus', validYears: 5 },
  { id: 'first_aid', name: 'Esmaabi tunnistus', validYears: 3 },
  { id: 'safety', name: 'Tööohutuse tunnistus', validYears: 3 },
  { id: 'forklift', name: 'Tõstuki juhi tunnistus', validYears: 5 },
  { id: 'crane', name: 'Kraana juhi tunnistus', validYears: 5 },
  { id: 'welding', name: 'Keevitaja tunnistus', validYears: 2 },
  { id: 'refrigerant', name: 'F-gaaside tunnistus', validYears: 5 },
  { id: 'heights', name: 'Kõrgustööde tunnistus', validYears: 3 },
  { id: 'adr', name: 'ADR tunnistus', validYears: 5 },
]

const mockCertifications: Certification[] = [
  {
    id: '1',
    employeeId: '1',
    employeeName: 'Jaan Tamm',
    type: 'hot_work',
    name: 'Tulitööde tunnistus',
    issuedDate: '2022-03-15',
    expiryDate: '2027-03-15',
    issuer: 'Eesti Tööinspektsioon',
    certificateNumber: 'TT-2022-1234',
    status: 'valid',
    fileUrl: '/files/cert-1.pdf',
  },
  {
    id: '2',
    employeeId: '1',
    employeeName: 'Jaan Tamm',
    type: 'electrical',
    name: 'Elektritööde tunnistus (B)',
    issuedDate: '2021-06-20',
    expiryDate: '2026-06-20',
    issuer: 'Eesti Elektritööde Ettevõtjate Liit',
    certificateNumber: 'EL-B-12345',
    status: 'valid',
    fileUrl: '/files/cert-2.pdf',
  },
  {
    id: '3',
    employeeId: '1',
    employeeName: 'Jaan Tamm',
    type: 'first_aid',
    name: 'Esmaabi tunnistus',
    issuedDate: '2022-01-10',
    expiryDate: '2025-01-10',
    issuer: 'Eesti Punane Rist',
    status: 'expiring_soon',
    nextPlannedDate: '2024-12-15',
  },
  {
    id: '4',
    employeeId: '2',
    employeeName: 'Peeter Mets',
    type: 'hot_work',
    name: 'Tulitööde tunnistus',
    issuedDate: '2023-08-01',
    expiryDate: '2028-08-01',
    issuer: 'Eesti Tööinspektsioon',
    certificateNumber: 'TT-2023-5678',
    status: 'valid',
    fileUrl: '/files/cert-4.pdf',
  },
  {
    id: '5',
    employeeId: '2',
    employeeName: 'Peeter Mets',
    type: 'forklift',
    name: 'Tõstuki juhi tunnistus',
    issuedDate: '2020-04-15',
    expiryDate: '2025-04-15',
    issuer: 'Transpordikaupade Amet',
    status: 'expiring_soon',
    nextPlannedDate: '2025-03-01',
  },
  {
    id: '6',
    employeeId: '3',
    employeeName: 'Andres Kask',
    type: 'refrigerant',
    name: 'F-gaaside tunnistus (kat I)',
    issuedDate: '2021-09-10',
    expiryDate: '2026-09-10',
    issuer: 'Keskkonnaministeerium',
    certificateNumber: 'FG-I-9876',
    status: 'valid',
    fileUrl: '/files/cert-6.pdf',
  },
  {
    id: '7',
    employeeId: '3',
    employeeName: 'Andres Kask',
    type: 'electrical',
    name: 'Elektritööde tunnistus (A)',
    issuedDate: '2019-05-20',
    expiryDate: '2024-05-20',
    issuer: 'Eesti Elektritööde Ettevõtjate Liit',
    certificateNumber: 'EL-A-54321',
    status: 'expired',
    notes: 'Uuendamine käsil',
    nextPlannedDate: '2024-06-01',
  },
  {
    id: '8',
    employeeId: '4',
    employeeName: 'Tiit Lepp',
    type: 'heights',
    name: 'Kõrgustööde tunnistus',
    issuedDate: '2023-02-28',
    expiryDate: '2026-02-28',
    issuer: 'Tööinspektsioon',
    status: 'valid',
    fileUrl: '/files/cert-8.pdf',
  },
  {
    id: '9',
    employeeId: '4',
    employeeName: 'Tiit Lepp',
    type: 'first_aid',
    name: 'Esmaabi tunnistus',
    issuedDate: '2021-11-15',
    expiryDate: '2024-11-15',
    issuer: 'Eesti Punane Rist',
    status: 'expiring_soon',
    nextPlannedDate: '2024-10-20',
  },
  {
    id: '10',
    employeeId: '1',
    employeeName: 'Jaan Tamm',
    type: 'welding',
    name: 'Keevitaja tunnistus (MIG/MAG)',
    issuedDate: '2023-04-10',
    expiryDate: '2025-04-10',
    issuer: 'Eesti Keevitusühing',
    certificateNumber: 'KEV-MM-2023-789',
    status: 'valid',
    fileUrl: '/files/cert-10.pdf',
  },
]

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  valid: { label: 'Kehtiv', color: 'text-green-700', bg: 'bg-green-100', icon: CheckCircle2 },
  expiring_soon: { label: 'Aegub varsti', color: 'text-orange-700', bg: 'bg-orange-100', icon: Clock },
  expired: { label: 'Aegunud', color: 'text-red-700', bg: 'bg-red-100', icon: AlertTriangle },
  pending: { label: 'Ootel', color: 'text-blue-700', bg: 'bg-blue-100', icon: Clock },
}

export default function CompetenciesPage() {
  const [certifications, setCertifications] = useState<Certification[]>(mockCertifications)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [employeeFilter, setEmployeeFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [groupBy, setGroupBy] = useState<'employee' | 'type' | 'status'>('employee')

  // Calculate stats
  const stats = useMemo(() => {
    const valid = certifications.filter(c => c.status === 'valid').length
    const expiringSoon = certifications.filter(c => c.status === 'expiring_soon').length
    const expired = certifications.filter(c => c.status === 'expired').length
    const employees = [...new Set(certifications.map(c => c.employeeId))].length
    return { valid, expiringSoon, expired, employees }
  }, [certifications])

  // Filter certifications
  const filteredCertifications = useMemo(() => {
    return certifications.filter(cert => {
      const matchesSearch = search === '' ||
        cert.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        cert.name.toLowerCase().includes(search.toLowerCase()) ||
        cert.issuer.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || cert.status === statusFilter
      const matchesType = typeFilter === 'all' || cert.type === typeFilter
      const matchesEmployee = employeeFilter === 'all' || cert.employeeId === employeeFilter
      return matchesSearch && matchesStatus && matchesType && matchesEmployee
    })
  }, [certifications, search, statusFilter, typeFilter, employeeFilter])

  // Group certifications
  const groupedCertifications = useMemo(() => {
    const groups: Record<string, Certification[]> = {}
    filteredCertifications.forEach(cert => {
      let key: string
      if (groupBy === 'employee') {
        key = cert.employeeName
      } else if (groupBy === 'type') {
        key = cert.name.split(' ')[0] // First word of cert name
      } else {
        key = statusConfig[cert.status].label
      }
      if (!groups[key]) groups[key] = []
      groups[key].push(cert)
    })
    return groups
  }, [filteredCertifications, groupBy])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('et-EE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate)
    const today = new Date()
    const diffTime = expiry.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Upcoming expirations (within 90 days)
  const upcomingExpirations = useMemo(() => {
    return certifications
      .filter(c => {
        const days = getDaysUntilExpiry(c.expiryDate)
        return days > 0 && days <= 90 && c.status !== 'expired'
      })
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime())
  }, [certifications])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Kompetentsid</h1>
          <p className="text-gray-500">Tunnistuste ja sertifikaatide haldus</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Lisa tunnistus
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Kehtivaid</p>
              <p className="text-2xl font-bold text-green-600">{stats.valid}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Aegub varsti</p>
              <p className="text-2xl font-bold text-orange-600">{stats.expiringSoon}</p>
            </div>
            <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Aegunud</p>
              <p className="text-2xl font-bold text-red-600">{stats.expired}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Töötajaid</p>
              <p className="text-2xl font-bold text-blue-600">{stats.employees}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming expirations alert */}
      {upcomingExpirations.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Bell className="w-5 h-5 text-orange-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-orange-900">Aeguvad tunnistused (90 päeva jooksul)</h3>
              <div className="mt-2 space-y-1">
                {upcomingExpirations.slice(0, 5).map(cert => {
                  const days = getDaysUntilExpiry(cert.expiryDate)
                  return (
                    <div key={cert.id} className="text-sm text-orange-800 flex items-center gap-2">
                      <span className="font-medium">{cert.employeeName}</span>
                      <span>-</span>
                      <span>{cert.name}</span>
                      <span className="text-orange-600">({days} päeva)</span>
                    </div>
                  )
                })}
                {upcomingExpirations.length > 5 && (
                  <p className="text-sm text-orange-600">+{upcomingExpirations.length - 5} veel</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Otsi tunnistusi..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
            />
          </div>
          <select
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">Kõik töötajad</option>
            {mockEmployees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.name}</option>
            ))}
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">Kõik tunnistused</option>
            {certificationTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">Kõik staatused</option>
            <option value="valid">Kehtiv</option>
            <option value="expiring_soon">Aegub varsti</option>
            <option value="expired">Aegunud</option>
          </select>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as 'employee' | 'type' | 'status')}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="employee">Grupeeri töötaja järgi</option>
            <option value="type">Grupeeri tüübi järgi</option>
            <option value="status">Grupeeri staatuse järgi</option>
          </select>
        </div>
      </div>

      {/* Certifications list */}
      <div className="space-y-4">
        {Object.entries(groupedCertifications).map(([groupName, certs]) => (
          <div key={groupName} className="bg-white rounded-lg border overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-900">{groupName}</span>
                <span className="px-2 py-0.5 bg-gray-200 rounded-full text-xs text-gray-600">
                  {certs.length}
                </span>
              </div>
            </div>
            <div className="divide-y">
              {certs.map(cert => {
                const statusInfo = statusConfig[cert.status]
                const StatusIcon = statusInfo.icon
                const daysUntil = getDaysUntilExpiry(cert.expiryDate)

                return (
                  <div key={cert.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">{cert.name}</h3>
                          <span className={`px-2 py-0.5 rounded text-xs flex items-center gap-1 ${statusInfo.bg} ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusInfo.label}
                          </span>
                        </div>
                        {groupBy !== 'employee' && (
                          <p className="text-sm text-gray-500 mt-0.5">{cert.employeeName}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-4 mt-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Väljastatud: {formatDate(cert.issuedDate)}
                          </span>
                          <span className={`flex items-center gap-1 ${cert.status === 'expired' ? 'text-red-600 font-medium' : ''}`}>
                            <Clock className="w-3 h-3" />
                            Kehtiv kuni: {formatDate(cert.expiryDate)}
                            {cert.status !== 'expired' && daysUntil <= 90 && (
                              <span className="text-orange-600">({daysUntil} päeva)</span>
                            )}
                          </span>
                          {cert.issuer && (
                            <span>Väljastaja: {cert.issuer}</span>
                          )}
                          {cert.certificateNumber && (
                            <span className="px-1.5 py-0.5 bg-gray-100 rounded">
                              Nr: {cert.certificateNumber}
                            </span>
                          )}
                        </div>
                        {cert.nextPlannedDate && (
                          <div className="mt-2 text-xs text-blue-600 flex items-center gap-1">
                            <Bell className="w-3 h-3" />
                            Planeeritud uuendamine: {formatDate(cert.nextPlannedDate)}
                          </div>
                        )}
                        {cert.notes && (
                          <p className="mt-1 text-xs text-gray-500 italic">{cert.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {cert.fileUrl && (
                          <button className="p-2 hover:bg-gray-100 rounded" title="Vaata faili">
                            <Eye className="w-4 h-4 text-gray-400" />
                          </button>
                        )}
                        {cert.fileUrl && (
                          <button className="p-2 hover:bg-gray-100 rounded" title="Laadi alla">
                            <Download className="w-4 h-4 text-gray-400" />
                          </button>
                        )}
                        <button
                          className="px-3 py-1 text-xs border rounded hover:bg-gray-50"
                        >
                          Planeeri uuendamine
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {Object.keys(groupedCertifications).length === 0 && (
          <div className="text-center py-12 bg-white border rounded-lg">
            <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Tunnistusi ei leitud</p>
          </div>
        )}
      </div>

      {/* Add certification modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Lisa uus tunnistus</h2>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Töötaja
                </label>
                <select className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Vali töötaja...</option>
                  {mockEmployees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tunnistuse tüüp
                </label>
                <select className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Vali tüüp...</option>
                  {certificationTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                  <option value="other">Muu...</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tunnistuse nimetus
                </label>
                <input
                  type="text"
                  placeholder="Nt. Elektritööde tunnistus (B)"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Väljastamise kuupäev
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Kehtivuse lõpp
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Väljastaja
                </label>
                <input
                  type="text"
                  placeholder="Nt. Eesti Tööinspektsioon"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tunnistuse number
                </label>
                <input
                  type="text"
                  placeholder="Valikuline"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              {/* OCR Scanner Section */}
              <div className="border-t pt-4">
                <OcrScanner
                  documentType="certificate"
                  fieldMapping={{
                    certificate_number: 'certificateNumber',
                    holder_name: 'holderName',
                    issue_date: 'issuedDate',
                    expiry_date: 'expiryDate',
                    issuer: 'issuer',
                    certificate_type: 'certificateType',
                  }}
                  onDataExtracted={(data) => {
                    // In production, this would update form state
                    console.log('Extracted data:', data)
                    alert('Andmed loetud! Vaata konsool logist.')
                  }}
                />
              </div>

              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tunnistuse fail (manuaalne üleslaadimine)
                </label>
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">
                    Lohista fail siia või{' '}
                    <button className="text-[#279989] hover:underline">vali fail</button>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG või PNG kuni 10MB</p>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Järgmine uuendamine (planeeritud)
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Märkused
                </label>
                <textarea
                  rows={2}
                  placeholder="Lisainfo..."
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end gap-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 border rounded-lg text-sm hover:bg-gray-100"
              >
                Tühista
              </button>
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 bg-[#279989] text-white rounded-lg text-sm hover:bg-[#1f7a6d]"
              >
                Lisa tunnistus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
