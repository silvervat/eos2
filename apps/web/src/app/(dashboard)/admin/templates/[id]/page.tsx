'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { Template } from '@pdfme/common'
import { PDFTemplateCategory } from '@/lib/pdf/types'
import { createInvoiceTemplate, createAdditionalWorkTemplate, createBlankTemplate } from '@/lib/pdf/pdfme-config'

// Dynamic import to avoid SSR issues with pdfme
const PDFDesigner = dynamic(
  () => import('@/components/pdf-designer/pdf-designer').then((mod) => mod.PDFDesigner),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-[calc(100vh-180px)] bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#279989] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">PDF disainer laadib...</p>
        </div>
      </div>
    ),
  }
)

const PDFViewer = dynamic(
  () => import('@/components/pdf-designer/pdf-viewer').then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-slate-50">
        <div className="w-8 h-8 border-4 border-[#279989] border-t-transparent rounded-full animate-spin" />
      </div>
    ),
  }
)

// Mock templates (will be replaced with real data from Supabase)
const MOCK_TEMPLATES: Record<
  string,
  {
    name: string
    category: PDFTemplateCategory
    template: () => Template
  }
> = {
  tpl_1: {
    name: 'Standardne arve',
    category: 'invoice',
    template: createInvoiceTemplate,
  },
  tpl_3: {
    name: 'Lisatöö akt',
    category: 'additional_work',
    template: createAdditionalWorkTemplate,
  },
}

export default function EditTemplatePage() {
  const router = useRouter()
  const params = useParams()
  const templateId = params.id as string

  const [showPreview, setShowPreview] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)
  const [loading, setLoading] = useState(true)
  const [templateData, setTemplateData] = useState<{
    name: string
    category: PDFTemplateCategory
    template: Template
  } | null>(null)

  // Load template data
  useEffect(() => {
    // Simulate loading template from database
    const mockTemplate = MOCK_TEMPLATES[templateId]
    if (mockTemplate) {
      setTemplateData({
        name: mockTemplate.name,
        category: mockTemplate.category,
        template: mockTemplate.template(),
      })
    } else {
      // Default to blank template if not found
      setTemplateData({
        name: 'Mall',
        category: 'other',
        template: createBlankTemplate(),
      })
    }
    setLoading(false)
  }, [templateId])

  // Handle save
  const handleSave = useCallback(
    (template: Template, name: string, category: PDFTemplateCategory) => {
      // TODO: Save to Supabase
      console.log('Updating template:', { templateId, template, name, category })

      // For now, just show success
      alert('Mall uuendatud!')
      router.push('/admin/templates')
    },
    [templateId, router]
  )

  // Handle preview
  const handlePreview = useCallback((template: Template) => {
    setPreviewTemplate(template)
    setShowPreview(true)
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-slate-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#279989] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Laen malli...</p>
        </div>
      </div>
    )
  }

  if (!templateData) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)] bg-slate-50">
        <div className="text-center">
          <p className="text-slate-600">Malli ei leitud</p>
          <button
            onClick={() => router.push('/admin/templates')}
            className="mt-4 text-[#279989] hover:underline"
          >
            Tagasi mallide lehele
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="h-[calc(100vh-64px)] flex flex-col">
      {/* Breadcrumb */}
      <div className="px-4 py-2 bg-white border-b border-slate-200">
        <nav className="flex items-center gap-2 text-sm text-slate-600">
          <a
            href="/admin/templates"
            className="hover:text-[#279989] transition-colors"
          >
            PDF Mallid
          </a>
          <span className="text-slate-400">/</span>
          <span className="text-slate-900 font-medium">{templateData.name}</span>
        </nav>
      </div>

      {/* Designer */}
      <div className="flex-1 overflow-hidden">
        <PDFDesigner
          initialTemplate={templateData.template}
          templateId={templateId}
          templateName={templateData.name}
          category={templateData.category}
          onSave={handleSave}
          onPreview={handlePreview}
        />
      </div>

      {/* Preview modal */}
      {showPreview && previewTemplate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden">
            <PDFViewer
              template={previewTemplate}
              onClose={() => setShowPreview(false)}
              showControls
              className="flex-1"
            />
          </div>
        </div>
      )}
    </div>
  )
}
