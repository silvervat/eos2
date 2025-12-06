'use client'

import React, { useState } from 'react'
import { useParams } from 'next/navigation'
import {
  Plus,
  Search,
  MoreVertical,
  Share2,
  FileText,
  PenTool,
  Image,
  File,
  Download,
  Eye,
  Trash2,
  Copy,
  ExternalLink,
  Clock,
  CheckCircle2,
  Link as LinkIcon,
  Mail,
  Calendar,
  User,
  Lock,
  Unlock,
  RefreshCw,
} from 'lucide-react'

interface SharedItem {
  id: string
  name: string
  type: 'document' | 'drawing' | 'image' | 'other'
  category: string
  sharedAt: string
  sharedBy: string
  expiresAt?: string
  accessCount: number
  lastAccessed?: string
  isPasswordProtected: boolean
  shareLink: string
  status: 'active' | 'expired' | 'revoked'
  fileSize: string
  revision?: string
}

const mockSharedItems: SharedItem[] = [
  {
    id: '1',
    name: 'HVAC-V-001 - Ventilatsioon 1. korrus (Rev C)',
    type: 'drawing',
    category: 'Joonised',
    sharedAt: '2024-03-10T10:30:00',
    sharedBy: 'Jaan Tamm',
    expiresAt: '2024-04-10',
    accessCount: 5,
    lastAccessed: '2024-03-14T15:22:00',
    isPasswordProtected: false,
    shareLink: 'https://eos.rivest.ee/s/abc123',
    status: 'active',
    fileSize: '2.4 MB',
    revision: 'C',
  },
  {
    id: '2',
    name: 'HVAC-V-002 - Ventilatsioon 2. korrus (Rev B)',
    type: 'drawing',
    category: 'Joonised',
    sharedAt: '2024-03-10T10:30:00',
    sharedBy: 'Jaan Tamm',
    expiresAt: '2024-04-10',
    accessCount: 3,
    lastAccessed: '2024-03-12T09:15:00',
    isPasswordProtected: false,
    shareLink: 'https://eos.rivest.ee/s/def456',
    status: 'active',
    fileSize: '2.1 MB',
    revision: 'B',
  },
  {
    id: '3',
    name: 'Projekti ajakava v2.pdf',
    type: 'document',
    category: 'Dokumendid',
    sharedAt: '2024-03-05T14:00:00',
    sharedBy: 'Peeter Mets',
    accessCount: 12,
    lastAccessed: '2024-03-14T11:30:00',
    isPasswordProtected: true,
    shareLink: 'https://eos.rivest.ee/s/ghi789',
    status: 'active',
    fileSize: '856 KB',
  },
  {
    id: '4',
    name: 'Tehnoruumi foto - agregaadid.jpg',
    type: 'image',
    category: 'Fotod',
    sharedAt: '2024-03-12T16:45:00',
    sharedBy: 'Andres Kask',
    expiresAt: '2024-03-19',
    accessCount: 2,
    isPasswordProtected: false,
    shareLink: 'https://eos.rivest.ee/s/jkl012',
    status: 'expired',
    fileSize: '3.2 MB',
  },
  {
    id: '5',
    name: 'Spetsifikatsioonid - HVAC seadmed.xlsx',
    type: 'document',
    category: 'Dokumendid',
    sharedAt: '2024-02-28T09:00:00',
    sharedBy: 'Jaan Tamm',
    accessCount: 8,
    lastAccessed: '2024-03-10T14:20:00',
    isPasswordProtected: false,
    shareLink: 'https://eos.rivest.ee/s/mno345',
    status: 'revoked',
    fileSize: '124 KB',
  },
]

const typeConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  document: { icon: FileText, color: 'text-blue-600', bg: 'bg-blue-100' },
  drawing: { icon: PenTool, color: 'text-purple-600', bg: 'bg-purple-100' },
  image: { icon: Image, color: 'text-green-600', bg: 'bg-green-100' },
  other: { icon: File, color: 'text-gray-600', bg: 'bg-gray-100' },
}

const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Aktiivne', color: 'text-green-600', bg: 'bg-green-100' },
  expired: { label: 'Aegunud', color: 'text-yellow-600', bg: 'bg-yellow-100' },
  revoked: { label: 'Tühistatud', color: 'text-red-600', bg: 'bg-red-100' },
}

export default function SharedWithClientPage() {
  const params = useParams()
  const projectId = params.id as string

  const [items] = useState<SharedItem[]>(mockSharedItems)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [copiedLink, setCopiedLink] = useState<string | null>(null)
  const [showShareModal, setShowShareModal] = useState(false)

  const filteredItems = items.filter(item => {
    const matchesSearch = search === '' ||
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('et-EE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatDateTime = (dateTimeString: string) => {
    return new Date(dateTimeString).toLocaleDateString('et-EE', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const copyToClipboard = async (link: string, itemId: string) => {
    try {
      await navigator.clipboard.writeText(link)
      setCopiedLink(itemId)
      setTimeout(() => setCopiedLink(null), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  // Stats
  const activeShares = items.filter(i => i.status === 'active').length
  const totalAccesses = items.reduce((sum, i) => sum + i.accessCount, 0)
  const expiringSoon = items.filter(i => {
    if (!i.expiresAt || i.status !== 'active') return false
    const daysUntilExpiry = Math.ceil((new Date(i.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    return daysUntilExpiry <= 7 && daysUntilExpiry > 0
  }).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Tellijale jagatud</h2>
          <p className="text-sm text-gray-500">Kliendiga jagatud dokumendid ja joonised</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Jagatud faile</p>
          <p className="text-2xl font-bold text-gray-900">{items.length}</p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600">Aktiivsed lingid</p>
          <p className="text-2xl font-bold text-green-700">{activeShares}</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600">Kokku vaatamisi</p>
          <p className="text-2xl font-bold text-blue-700">{totalAccesses}</p>
        </div>
        {expiringSoon > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-600">Aeguvad 7 päeva jooksul</p>
            <p className="text-2xl font-bold text-yellow-700">{expiringSoon}</p>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Otsi jagatud faili..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-sm"
        >
          <option value="all">Kõik staatused</option>
          <option value="active">Aktiivsed</option>
          <option value="expired">Aegunud</option>
          <option value="revoked">Tühistatud</option>
        </select>
        <button
          onClick={() => setShowShareModal(true)}
          className="px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Jaga uut faili
        </button>
      </div>

      {/* Shared Items Table */}
      <div className="bg-white border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-5 py-3 font-medium text-gray-600">Fail</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600 hidden md:table-cell">Jagatud</th>
              <th className="text-center px-5 py-3 font-medium text-gray-600 hidden lg:table-cell">Vaatamisi</th>
              <th className="text-left px-5 py-3 font-medium text-gray-600 hidden lg:table-cell">Aegub</th>
              <th className="text-center px-5 py-3 font-medium text-gray-600">Staatus</th>
              <th className="text-center px-5 py-3 font-medium text-gray-600">Link</th>
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filteredItems.map((item) => {
              const typeInfo = typeConfig[item.type]
              const statusInfo = statusConfig[item.status]
              const TypeIcon = typeInfo.icon

              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${typeInfo.bg}`}>
                        <TypeIcon className={`w-5 h-5 ${typeInfo.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate max-w-[300px]">{item.name}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{item.category}</span>
                          <span>•</span>
                          <span>{item.fileSize}</span>
                          {item.isPasswordProtected && (
                            <>
                              <span>•</span>
                              <span className="flex items-center gap-1 text-orange-600">
                                <Lock className="w-3 h-3" />
                                Parooliga
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 hidden md:table-cell">
                    <p className="text-gray-900">{formatDateTime(item.sharedAt)}</p>
                    <p className="text-xs text-gray-500">{item.sharedBy}</p>
                  </td>
                  <td className="px-5 py-4 text-center hidden lg:table-cell">
                    <span className="font-medium text-gray-900">{item.accessCount}</span>
                    {item.lastAccessed && (
                      <p className="text-xs text-gray-500">
                        Viimati: {formatDateTime(item.lastAccessed)}
                      </p>
                    )}
                  </td>
                  <td className="px-5 py-4 hidden lg:table-cell">
                    {item.expiresAt ? (
                      <span className={`text-sm ${new Date(item.expiresAt) < new Date() ? 'text-red-600' : 'text-gray-900'}`}>
                        {formatDate(item.expiresAt)}
                      </span>
                    ) : (
                      <span className="text-gray-400">Ei aegu</span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-center">
                    {item.status === 'active' ? (
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => copyToClipboard(item.shareLink, item.id)}
                          className={`p-1.5 rounded transition-colors ${
                            copiedLink === item.id
                              ? 'bg-green-100 text-green-600'
                              : 'hover:bg-gray-100 text-gray-500'
                          }`}
                          title={copiedLink === item.id ? 'Kopeeritud!' : 'Kopeeri link'}
                        >
                          {copiedLink === item.id ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                        <a
                          href={item.shareLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 hover:bg-gray-100 rounded text-gray-500"
                          title="Ava link"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <button className="p-1.5 hover:bg-gray-100 rounded">
                      <MoreVertical className="w-4 h-4 text-gray-400" />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {filteredItems.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Share2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p>Jagatud faile ei leitud</p>
            <button
              onClick={() => setShowShareModal(true)}
              className="mt-4 px-4 py-2 bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d]"
            >
              Jaga esimene fail
            </button>
          </div>
        )}
      </div>

      {/* Info box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">Kuidas jagamine töötab?</h4>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Klient saab faili alla laadida ilma sisselogimiseta</li>
          <li>• Saate määrata lingi aegumiskuupäeva ja paroolikaitse</li>
          <li>• Näete statistikat, mitu korda faili on vaadatud</li>
          <li>• Lingi saate igal ajal tühistada</li>
        </ul>
      </div>

      {/* Share Modal (placeholder) */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
            <div className="p-6 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Jaga faili kliendiga</h3>
              <p className="text-sm text-gray-500 mt-1">Vali fail ja määra jagamise seaded</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vali fail</label>
                <select className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">Vali fail...</option>
                  <optgroup label="Joonised">
                    <option>HVAC-V-003 - Ventilatsiooni lõiked</option>
                    <option>HVAC-K-002 - Küttesüsteem 2. korrus</option>
                  </optgroup>
                  <optgroup label="Dokumendid">
                    <option>Teostatud tööde akt märts.pdf</option>
                    <option>Materjalide nimekiri.xlsx</option>
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aegumiskuupäev (valikuline)</label>
                <input type="date" className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="password" className="rounded border-gray-300" />
                <label htmlFor="password" className="text-sm text-gray-700">Lisa paroolikaitse</label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Saada teavitus e-postiga</label>
                <input
                  type="email"
                  placeholder="klient@ettevote.ee"
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="p-4 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 text-sm border rounded-lg hover:bg-gray-100"
              >
                Tühista
              </button>
              <button
                onClick={() => setShowShareModal(false)}
                className="px-4 py-2 text-sm bg-[#279989] text-white rounded-lg hover:bg-[#1f7a6d] flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Jaga faili
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
