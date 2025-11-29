'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import type { Template } from '@pdfme/common'
import { PDFTemplateCategory } from '@/lib/pdf/types'
import { createBlankTemplate } from '@/lib/pdf/pdfme-config'

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

export default function NewTemplatePage() {
  const router = useRouter()
  const [showPreview, setShowPreview] = useState(false)
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)

  // Handle save
  const handleSave = useCallback(
    (template: Template, name: string, category: PDFTemplateCategory) => {
      // TODO: Save to Supabase
      console.log('Saving template:', { template, name, category })

      // For now, just show success and redirect
      alert('Mall salvestatud!')
      router.push('/admin/templates')
    },
    [router]
  )

  // Handle preview
  const handlePreview = useCallback((template: Template) => {
    setPreviewTemplate(template)
    setShowPreview(true)
  }, [])

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
          <span className="text-slate-900 font-medium">Uus mall</span>
        </nav>
      </div>

      {/* Designer */}
      <div className="flex-1 overflow-hidden">
        <PDFDesigner
          initialTemplate={createBlankTemplate('A4', 'portrait')}
          templateName="Uus mall"
          category="other"
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
