'use client'

import { useState } from 'react'
import { Plus, FileText, MoreVertical, Trash2, Edit, Eye, Clock, User } from 'lucide-react'
import Link from 'next/link'
import type { CollaborativeDocument } from '@rivest/types'

// Mock documents for demo
const mockDocuments: CollaborativeDocument[] = [
  {
    id: '1',
    tenantId: 'demo',
    title: 'Projekti koosoleku protokoll',
    content: {},
    status: 'published',
    isTemplate: false,
    isPublic: false,
    metadata: {},
    createdAt: '2024-11-28T10:00:00Z',
    updatedAt: '2024-11-28T14:30:00Z',
    createdBy: 'user1',
  },
  {
    id: '2',
    tenantId: 'demo',
    title: 'Ehitustööde ajakava',
    content: {},
    status: 'draft',
    isTemplate: false,
    isPublic: false,
    metadata: {},
    createdAt: '2024-11-27T09:00:00Z',
    updatedAt: '2024-11-28T11:00:00Z',
    createdBy: 'user1',
  },
  {
    id: '3',
    tenantId: 'demo',
    title: 'Ohutuse juhend objektil',
    content: {},
    status: 'published',
    isTemplate: true,
    isPublic: true,
    metadata: {},
    createdAt: '2024-11-20T08:00:00Z',
    updatedAt: '2024-11-25T16:00:00Z',
    createdBy: 'user2',
  },
  {
    id: '4',
    tenantId: 'demo',
    title: 'Materjalide tellimise nimekiri',
    content: {},
    status: 'draft',
    isTemplate: false,
    isPublic: false,
    metadata: {},
    createdAt: '2024-11-28T08:00:00Z',
    updatedAt: '2024-11-28T08:30:00Z',
    createdBy: 'user1',
  },
]

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<CollaborativeDocument[]>(mockDocuments)
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all')

  const filteredDocuments = documents.filter((doc) => {
    if (filter === 'all') return true
    return doc.status === filter
  })

  const handleDelete = (id: string) => {
    if (confirm('Kas oled kindel, et soovid selle dokumendi kustutada?')) {
      setDocuments(documents.filter((d) => d.id !== id))
    }
  }

  const createNewDocument = () => {
    const newDoc: CollaborativeDocument = {
      id: `doc_${Date.now()}`,
      tenantId: 'demo',
      title: 'Uus dokument',
      content: {},
      status: 'draft',
      isTemplate: false,
      isPublic: false,
      metadata: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'user1',
    }
    setDocuments([newDoc, ...documents])
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dokumendid</h1>
          <p className="text-slate-600 text-sm mt-1">
            Halda ja muuda koostööpõhiseid dokumente
          </p>
        </div>
        <button
          onClick={createNewDocument}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium transition-colors hover:opacity-90"
          style={{ backgroundColor: '#279989' }}
        >
          <Plus className="h-4 w-4" />
          Uus dokument
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'draft', 'published'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              filter === f
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {f === 'all' && 'Kõik'}
            {f === 'draft' && 'Mustandid'}
            {f === 'published' && 'Avaldatud'}
            <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-white/20">
              {f === 'all'
                ? documents.length
                : documents.filter((d) => d.status === f).length}
            </span>
          </button>
        ))}
      </div>

      {/* Documents Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredDocuments.map((doc) => (
          <DocumentCard key={doc.id} document={doc} onDelete={handleDelete} />
        ))}
      </div>

      {/* Empty state */}
      {filteredDocuments.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-slate-400 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            Dokumente ei leitud
          </h3>
          <p className="text-slate-600 mb-4">
            {filter === 'all'
              ? 'Alusta uue dokumendi loomisega'
              : `Pole ühtegi ${filter === 'draft' ? 'mustandi' : 'avaldatud'} dokumenti`}
          </p>
          <button
            onClick={createNewDocument}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium"
            style={{ backgroundColor: '#279989' }}
          >
            <Plus className="h-4 w-4" />
            Lisa dokument
          </button>
        </div>
      )}
    </div>
  )
}

function DocumentCard({
  document,
  onDelete,
}: {
  document: CollaborativeDocument
  onDelete: (id: string) => void
}) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: '#27998915' }}
          >
            <FileText className="h-5 w-5" style={{ color: '#279989' }} />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 line-clamp-1">{document.title}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              {document.status === 'draft' ? (
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  Mustand
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                  Avaldatud
                </span>
              )}
              {document.isTemplate && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  Mall
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <MoreVertical className="h-4 w-4 text-slate-400" />
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-20">
                <Link
                  href={`/documents/${document.id}`}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Edit className="h-4 w-4" />
                  Muuda
                </Link>
                <Link
                  href={`/documents/${document.id}?view=true`}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
                >
                  <Eye className="h-4 w-4" />
                  Vaata
                </Link>
                <button
                  onClick={() => {
                    setShowMenu(false)
                    onDelete(document.id)
                  }}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 w-full"
                >
                  <Trash2 className="h-4 w-4" />
                  Kustuta
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-slate-500 mt-4 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{new Date(document.updatedAt).toLocaleDateString('et-EE')}</span>
        </div>
        <div className="flex items-center gap-1">
          <User className="h-3 w-3" />
          <span>Kasutaja</span>
        </div>
      </div>

      <Link
        href={`/documents/${document.id}`}
        className="mt-3 block w-full text-center px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
      >
        Ava dokument
      </Link>
    </div>
  )
}
