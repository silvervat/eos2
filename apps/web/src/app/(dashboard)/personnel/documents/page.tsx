'use client'

/**
 * Personnel - Töötajate dokumendid (Employee Documents)
 * Manages employee documents like ID copies, tax numbers, ID06 cards
 * with easy sharing via public URLs
 */

import React, { useState, useMemo } from 'react'
import {
  FileText,
  Plus,
  Search,
  User,
  Upload,
  Download,
  Copy,
  Check,
  ExternalLink,
  Eye,
  Trash2,
  MoreVertical,
  X,
  Link2,
  Shield,
  CreditCard,
  Hash,
  Calendar,
  Clock,
  Filter,
  FolderOpen,
  Scan,
} from 'lucide-react'
import { OcrScanner } from '@/components/shared/OcrScanner'

interface EmployeeDocument {
  id: string
  employeeId: string
  employeeName: string
  type: string
  typeName: string
  fileName: string
  fileSize: string
  uploadedAt: string
  expiryDate?: string
  publicUrl?: string
  publicUrlExpiry?: string
  notes?: string
  isShared: boolean
}

interface Employee {
  id: string
  name: string
  department: string
  personalCode?: string
  taxNumber?: string
  id06Number?: string
}

const mockEmployees: Employee[] = [
  { id: '1', name: 'Jaan Tamm', department: 'Montaaž', personalCode: '38501010001', taxNumber: 'EE123456789', id06Number: 'ID06-EE-001234' },
  { id: '2', name: 'Peeter Mets', department: 'Montaaž', personalCode: '37512120002', taxNumber: 'EE987654321', id06Number: 'ID06-EE-005678' },
  { id: '3', name: 'Andres Kask', department: 'PTV', personalCode: '38003030003', taxNumber: 'EE456789123' },
  { id: '4', name: 'Tiit Lepp', department: 'PTV', personalCode: '39107070004', id06Number: 'ID06-EE-009012' },
  { id: '5', name: 'Mari Maasikas', department: 'Projektid', personalCode: '48901010005', taxNumber: 'EE321654987' },
  { id: '6', name: 'Kati Kask', department: 'Müük', personalCode: '49506060006', taxNumber: 'EE789123456' },
]

const documentTypes = [
  { id: 'id_card', name: 'Isikutunnistuse koopia', icon: CreditCard },
  { id: 'passport', name: 'Passi koopia', icon: CreditCard },
  { id: 'tax_residency', name: 'Maksuresidentsuse tõend', icon: Hash },
  { id: 'id06', name: 'ID06 kaardi koopia', icon: Shield },
  { id: 'work_permit', name: 'Tööluba', icon: FileText },
  { id: 'health_cert', name: 'Tervisetõend', icon: FileText },
  { id: 'driving_license', name: 'Juhiloa koopia', icon: CreditCard },
  { id: 'bank_details', name: 'Pangaandmed', icon: Hash },
  { id: 'contract', name: 'Tööleping', icon: FileText },
  { id: 'nda', name: 'Konfidentsiaalsuskohustus', icon: Shield },
  { id: 'other', name: 'Muu dokument', icon: FileText },
]

const mockDocuments: EmployeeDocument[] = [
  {
    id: '1',
    employeeId: '1',
    employeeName: 'Jaan Tamm',
    type: 'id_card',
    typeName: 'Isikutunnistuse koopia',
    fileName: 'jaan_tamm_id.pdf',
    fileSize: '1.2 MB',
    uploadedAt: '2024-01-15',
    expiryDate: '2028-03-20',
    isShared: false,
  },
  {
    id: '2',
    employeeId: '1',
    employeeName: 'Jaan Tamm',
    type: 'id06',
    typeName: 'ID06 kaardi koopia',
    fileName: 'jaan_tamm_id06.pdf',
    fileSize: '0.8 MB',
    uploadedAt: '2024-02-10',
    expiryDate: '2025-12-31',
    publicUrl: 'https://rivest.ee/share/doc/abc123',
    publicUrlExpiry: '2024-04-15',
    isShared: true,
  },
  {
    id: '3',
    employeeId: '1',
    employeeName: 'Jaan Tamm',
    type: 'tax_residency',
    typeName: 'Maksuresidentsuse tõend',
    fileName: 'jaan_tamm_tax.pdf',
    fileSize: '0.5 MB',
    uploadedAt: '2024-01-20',
    isShared: false,
  },
  {
    id: '4',
    employeeId: '2',
    employeeName: 'Peeter Mets',
    type: 'id_card',
    typeName: 'Isikutunnistuse koopia',
    fileName: 'peeter_mets_id.pdf',
    fileSize: '1.1 MB',
    uploadedAt: '2024-01-18',
    expiryDate: '2027-06-15',
    isShared: false,
  },
  {
    id: '5',
    employeeId: '2',
    employeeName: 'Peeter Mets',
    type: 'id06',
    typeName: 'ID06 kaardi koopia',
    fileName: 'peeter_mets_id06.pdf',
    fileSize: '0.9 MB',
    uploadedAt: '2024-02-12',
    expiryDate: '2025-12-31',
    publicUrl: 'https://rivest.ee/share/doc/def456',
    publicUrlExpiry: '2024-05-01',
    isShared: true,
  },
  {
    id: '6',
    employeeId: '3',
    employeeName: 'Andres Kask',
    type: 'id_card',
    typeName: 'Isikutunnistuse koopia',
    fileName: 'andres_kask_id.pdf',
    fileSize: '1.3 MB',
    uploadedAt: '2024-01-22',
    expiryDate: '2029-01-10',
    isShared: false,
  },
  {
    id: '7',
    employeeId: '3',
    employeeName: 'Andres Kask',
    type: 'health_cert',
    typeName: 'Tervisetõend',
    fileName: 'andres_kask_health.pdf',
    fileSize: '0.4 MB',
    uploadedAt: '2024-03-01',
    expiryDate: '2025-03-01',
    isShared: false,
  },
  {
    id: '8',
    employeeId: '4',
    employeeName: 'Tiit Lepp',
    type: 'id06',
    typeName: 'ID06 kaardi koopia',
    fileName: 'tiit_lepp_id06.pdf',
    fileSize: '0.7 MB',
    uploadedAt: '2024-02-15',
    expiryDate: '2025-12-31',
    isShared: false,
  },
  {
    id: '9',
    employeeId: '4',
    employeeName: 'Tiit Lepp',
    type: 'driving_license',
    typeName: 'Juhiloa koopia',
    fileName: 'tiit_lepp_license.pdf',
    fileSize: '0.6 MB',
    uploadedAt: '2024-02-20',
    expiryDate: '2030-08-15',
    isShared: false,
  },
  {
    id: '10',
    employeeId: '5',
    employeeName: 'Mari Maasikas',
    type: 'contract',
    typeName: 'Tööleping',
    fileName: 'mari_maasikas_contract.pdf',
    fileSize: '2.1 MB',
    uploadedAt: '2022-03-15',
    isShared: false,
  },
]

export default function EmployeeDocumentsPage() {
  const [documents, setDocuments] = useState<EmployeeDocument[]>(mockDocuments)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [employeeFilter, setEmployeeFilter] = useState<string>('all')
  const [sharedFilter, setSharedFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showShareModal, setShowShareModal] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [groupBy, setGroupBy] = useState<'employee' | 'type'>('employee')

  // Stats
  const stats = useMemo(() => {
    const total = documents.length
    const shared = documents.filter(d => d.isShared).length
    const employees = [...new Set(documents.map(d => d.employeeId))].length
    const expiringSoon = documents.filter(d => {
      if (!d.expiryDate) return false
      const days = Math.ceil((new Date(d.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
      return days > 0 && days <= 90
    }).length
    return { total, shared, employees, expiringSoon }
  }, [documents])

  // Filter documents
  const filteredDocuments = useMemo(() => {
    return documents.filter(doc => {
      const matchesSearch = search === '' ||
        doc.employeeName.toLowerCase().includes(search.toLowerCase()) ||
        doc.typeName.toLowerCase().includes(search.toLowerCase()) ||
        doc.fileName.toLowerCase().includes(search.toLowerCase())
      const matchesType = typeFilter === 'all' || doc.type === typeFilter
      const matchesEmployee = employeeFilter === 'all' || doc.employeeId === employeeFilter
      const matchesShared = sharedFilter === 'all' ||
        (sharedFilter === 'shared' && doc.isShared) ||
        (sharedFilter === 'not_shared' && !doc.isShared)
      return matchesSearch && matchesType && matchesEmployee && matchesShared
    })
  }, [documents, search, typeFilter, employeeFilter, sharedFilter])

  // Group documents
  const groupedDocuments = useMemo(() => {
    const groups: Record<string, EmployeeDocument[]> = {}
    filteredDocuments.forEach(doc => {
      const key = groupBy === 'employee' ? doc.employeeName : doc.typeName
      if (!groups[key]) groups[key] = []
      groups[key].push(doc)
    })
    return groups
  }, [filteredDocuments, groupBy])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('et-EE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  const copyToClipboard = async (url: string, docId: string) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedId(docId)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const createShareLink = (docId: string) => {
    setDocuments(docs => docs.map(d => {
      if (d.id === docId) {
        return {
          ...d,
          isShared: true,
          publicUrl: `https://rivest.ee/share/doc/${Math.random().toString(36).substr(2, 9)}`,
          publicUrlExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }
      }
      return d
    }))
    setShowShareModal(docId)
  }

  const revokeShareLink = (docId: string) => {
    setDocuments(docs => docs.map(d => {
      if (d.id === docId) {
        return {
          ...d,
          isShared: false,
          publicUrl: undefined,
          publicUrlExpiry: undefined,
        }
      }
      return d
    }))
  }

  const getDocumentIcon = (type: string) => {
    const docType = documentTypes.find(t => t.id === type)
    return docType?.icon || FileText
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Töötajate dokumendid</h1>
          <p className="text-gray-500">Isikudokumentide ja tõendite haldus</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Lisa dokument
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Dokumente kokku</p>
              <p className="text-2xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Jagatud</p>
              <p className="text-2xl font-bold text-green-600">{stats.shared}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Link2 className="w-5 h-5 text-green-600" />
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Töötajaid</p>
              <p className="text-2xl font-bold text-purple-600">{stats.employees}</p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <User className="w-5 h-5 text-purple-600" />
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
      </div>

      {/* Quick employee overview with key data */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b">
          <h2 className="font-medium text-gray-900">Töötajate andmed</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Töötaja</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Osakond</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Isikukood</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Maksunumber</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">ID06</th>
                <th className="text-left px-4 py-2 font-medium text-gray-600">Dokumente</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {mockEmployees.map(emp => {
                const docCount = documents.filter(d => d.employeeId === emp.id).length
                return (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-medium">
                          {emp.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium text-gray-900">{emp.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-gray-600">{emp.department}</td>
                    <td className="px-4 py-2">
                      {emp.personalCode ? (
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-gray-700">{emp.personalCode}</span>
                          <button
                            onClick={() => copyToClipboard(emp.personalCode!, `pc-${emp.id}`)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            {copiedId === `pc-${emp.id}` ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {emp.taxNumber ? (
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-gray-700">{emp.taxNumber}</span>
                          <button
                            onClick={() => copyToClipboard(emp.taxNumber!, `tax-${emp.id}`)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            {copiedId === `tax-${emp.id}` ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      {emp.id06Number ? (
                        <div className="flex items-center gap-1">
                          <span className="font-mono text-gray-700">{emp.id06Number}</span>
                          <button
                            onClick={() => copyToClipboard(emp.id06Number!, `id06-${emp.id}`)}
                            className="p-1 hover:bg-gray-100 rounded"
                          >
                            {copiedId === `id06-${emp.id}` ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                        {docCount} dok.
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-4">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Otsi dokumente..."
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
            <option value="all">Kõik tüübid</option>
            {documentTypes.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
          <select
            value={sharedFilter}
            onChange={(e) => setSharedFilter(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="all">Kõik dokumendid</option>
            <option value="shared">Jagatud</option>
            <option value="not_shared">Jagamata</option>
          </select>
          <select
            value={groupBy}
            onChange={(e) => setGroupBy(e.target.value as 'employee' | 'type')}
            className="px-3 py-2 border rounded-lg text-sm"
          >
            <option value="employee">Grupeeri töötaja järgi</option>
            <option value="type">Grupeeri tüübi järgi</option>
          </select>
        </div>
      </div>

      {/* Documents list */}
      <div className="space-y-4">
        {Object.entries(groupedDocuments).map(([groupName, docs]) => (
          <div key={groupName} className="bg-white rounded-lg border overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b flex items-center justify-between">
              <div className="flex items-center gap-2">
                {groupBy === 'employee' ? (
                  <User className="w-4 h-4 text-gray-500" />
                ) : (
                  <FolderOpen className="w-4 h-4 text-gray-500" />
                )}
                <span className="font-medium text-gray-900">{groupName}</span>
                <span className="px-2 py-0.5 bg-gray-200 rounded-full text-xs text-gray-600">
                  {docs.length}
                </span>
              </div>
            </div>
            <div className="divide-y">
              {docs.map(doc => {
                const DocIcon = getDocumentIcon(doc.type)
                const isExpiringSoon = doc.expiryDate &&
                  Math.ceil((new Date(doc.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) <= 90

                return (
                  <div key={doc.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <DocIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium text-gray-900">{doc.typeName}</h3>
                            {doc.isShared && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs flex items-center gap-1">
                                <Link2 className="w-3 h-3" />
                                Jagatud
                              </span>
                            )}
                            {isExpiringSoon && (
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                                Aegub varsti
                              </span>
                            )}
                          </div>
                          {groupBy !== 'employee' && (
                            <p className="text-sm text-gray-500">{doc.employeeName}</p>
                          )}
                          <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                            <span className="flex items-center gap-1">
                              <FileText className="w-3 h-3" />
                              {doc.fileName}
                            </span>
                            <span>{doc.fileSize}</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Lisatud: {formatDate(doc.uploadedAt)}
                            </span>
                            {doc.expiryDate && (
                              <span className={`flex items-center gap-1 ${isExpiringSoon ? 'text-orange-600 font-medium' : ''}`}>
                                <Clock className="w-3 h-3" />
                                Kehtiv kuni: {formatDate(doc.expiryDate)}
                              </span>
                            )}
                          </div>
                          {doc.isShared && doc.publicUrl && (
                            <div className="mt-2 flex items-center gap-2">
                              <input
                                type="text"
                                readOnly
                                value={doc.publicUrl}
                                className="text-xs px-2 py-1 bg-gray-100 rounded border w-64 font-mono"
                              />
                              <button
                                onClick={() => copyToClipboard(doc.publicUrl!, doc.id)}
                                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded flex items-center gap-1 text-xs"
                              >
                                {copiedId === doc.id ? (
                                  <>
                                    <Check className="w-3 h-3 text-green-600" />
                                    Kopeeritud!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3 h-3" />
                                    Kopeeri
                                  </>
                                )}
                              </button>
                              {doc.publicUrlExpiry && (
                                <span className="text-xs text-gray-500">
                                  Aegub: {formatDate(doc.publicUrlExpiry)}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button className="p-2 hover:bg-gray-100 rounded" title="Vaata">
                          <Eye className="w-4 h-4 text-gray-400" />
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded" title="Laadi alla">
                          <Download className="w-4 h-4 text-gray-400" />
                        </button>
                        {doc.isShared ? (
                          <button
                            onClick={() => revokeShareLink(doc.id)}
                            className="px-3 py-1 text-xs border border-red-200 text-red-600 rounded hover:bg-red-50"
                          >
                            Tühista jagamine
                          </button>
                        ) : (
                          <button
                            onClick={() => createShareLink(doc.id)}
                            className="px-3 py-1 text-xs border rounded hover:bg-gray-50 flex items-center gap-1"
                          >
                            <Link2 className="w-3 h-3" />
                            Jaga
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {Object.keys(groupedDocuments).length === 0 && (
          <div className="text-center py-12 bg-white border rounded-lg">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Dokumente ei leitud</p>
          </div>
        )}
      </div>

      {/* Add document modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Lisa uus dokument</h2>
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
                  Dokumendi tüüp
                </label>
                <select className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Vali tüüp...</option>
                  {documentTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Kehtivuse lõpp
                </label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">Valikuline - kui dokument aegub</p>
              </div>
              {/* OCR Scanner Section */}
              <div className="border-t pt-4">
                <OcrScanner
                  documentType="id_card"
                  fieldMapping={{
                    document_number: 'documentNumber',
                    holder_name: 'holderName',
                    personal_code: 'personalCode',
                    expiry_date: 'expiryDate',
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
                  Dokumendi fail (manuaalne üleslaadimine)
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
                Lisa dokument
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold">Jaga dokumenti</h2>
              <button
                onClick={() => setShowShareModal(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-green-800 mb-2">
                  <Check className="w-5 h-5" />
                  <span className="font-medium">Jagamislink loodud!</span>
                </div>
                <p className="text-sm text-green-700">
                  Link kehtib 30 päeva. Saad lingi kehtivust muuta või tühistada igal ajal.
                </p>
              </div>
              {(() => {
                const doc = documents.find(d => d.id === showShareModal)
                if (!doc?.publicUrl) return null
                return (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Jagamislink
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={doc.publicUrl}
                        className="flex-1 px-3 py-2 bg-gray-100 border rounded-lg text-sm font-mono"
                      />
                      <button
                        onClick={() => copyToClipboard(doc.publicUrl!, 'modal-url')}
                        className="px-4 py-2 bg-[#279989] text-white rounded-lg flex items-center gap-2 hover:bg-[#1f7a6d]"
                      >
                        {copiedId === 'modal-url' ? (
                          <>
                            <Check className="w-4 h-4" />
                            Kopeeritud!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Kopeeri
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )
              })()}
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowShareModal(null)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300"
              >
                Sulge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
