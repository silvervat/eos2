'use client'

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Share2, Download, Settings } from 'lucide-react'
import { DocumentEditor } from '@/components/docs/document-editor'
import type { CollaborativeDocument } from '@rivest/types'

// Mock document data
const mockDocuments: Record<string, CollaborativeDocument> = {
  '1': {
    id: '1',
    tenantId: 'demo',
    title: 'Projekti koosoleku protokoll',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Projekti koosoleku protokoll' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Kuupäev: 28. november 2024',
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Osalejad' }],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Mari Maasikas - Projektijuht' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Jaan Tamm - Ehitusinsener' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Liisa Lepp - Klient' }],
                },
              ],
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Päevakord' }],
        },
        {
          type: 'orderedList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Ehitustööde ülevaade' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Ajakava läbivaatamine' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Järgmised sammud' }],
                },
              ],
            },
          ],
        },
        {
          type: 'heading',
          attrs: { level: 2 },
          content: [{ type: 'text', text: 'Kokkuvõte' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'Ehitustööd kulgevad plaanipäraselt. Järgmine kohtumine toimub 5. detsembril.',
            },
          ],
        },
      ],
    },
    status: 'published',
    isTemplate: false,
    isPublic: false,
    metadata: {},
    createdAt: '2024-11-28T10:00:00Z',
    updatedAt: '2024-11-28T14:30:00Z',
    createdBy: 'user1',
  },
  '2': {
    id: '2',
    tenantId: 'demo',
    title: 'Ehitustööde ajakava',
    content: {
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Ehitustööde ajakava' }],
        },
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: 'See dokument kirjeldab ehitustööde ajakava projekti "Uus büroohoone" jaoks.',
            },
          ],
        },
      ],
    },
    status: 'draft',
    isTemplate: false,
    isPublic: false,
    metadata: {},
    createdAt: '2024-11-27T09:00:00Z',
    updatedAt: '2024-11-28T11:00:00Z',
    createdBy: 'user1',
  },
}

export default function DocumentPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const documentId = params.id as string
  const isViewOnly = searchParams.get('view') === 'true'

  const [document, setDocument] = useState<CollaborativeDocument | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Simulate loading document
    const doc = mockDocuments[documentId]
    if (doc) {
      setDocument(doc)
    } else {
      // Create a new empty document for new IDs
      setDocument({
        id: documentId,
        tenantId: 'demo',
        title: 'Uus dokument',
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [],
            },
          ],
        },
        status: 'draft',
        isTemplate: false,
        isPublic: false,
        metadata: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'user1',
      })
    }
    setIsLoading(false)
  }, [documentId])

  const handleSave = async (content: Record<string, unknown>) => {
    if (!document) return

    // Simulate saving
    console.log('Saving document:', { ...document, content })
    setDocument({ ...document, content, updatedAt: new Date().toISOString() })

    // In real app, save to database
    // await supabase.from('documents_collaborative').update({ content }).eq('id', documentId)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-500">Laadin dokumenti...</div>
      </div>
    )
  }

  if (!document) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-slate-500 mb-4">Dokumenti ei leitud</div>
        <Link
          href="/documents"
          className="inline-flex items-center gap-2 text-primary hover:underline"
          style={{ color: '#279989' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Tagasi dokumentide juurde
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link
          href="/documents"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Tagasi
        </Link>

        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
            <Share2 className="h-4 w-4" />
            Jaga
          </button>
          <button className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
            <Download className="h-4 w-4" />
            Ekspordi
          </button>
          <button className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg border border-slate-200 bg-white hover:bg-slate-50 transition-colors">
            <Settings className="h-4 w-4" />
            Seaded
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="h-[calc(100vh-200px)]">
        <DocumentEditor
          document={document}
          onSave={handleSave}
          readOnly={isViewOnly}
        />
      </div>
    </div>
  )
}
