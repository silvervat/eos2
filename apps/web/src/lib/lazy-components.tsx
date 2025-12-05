'use client'

import dynamic from 'next/dynamic'
import type { ComponentType } from 'react'

/**
 * Lazy Loading Utilities
 * Dynamically import heavy components to improve initial page load
 */

// Loading skeleton components
const LoadingSkeleton = ({ className = 'h-64' }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-100 rounded-lg ${className}`} />
)

const TableLoadingSkeleton = () => (
  <div className="space-y-3">
    <div className="h-10 bg-slate-100 rounded animate-pulse" />
    {[...Array(5)].map((_, i) => (
      <div key={i} className="h-12 bg-slate-50 rounded animate-pulse" />
    ))}
  </div>
)

const EditorLoadingSkeleton = () => (
  <div className="space-y-4">
    <div className="flex gap-2">
      {[...Array(8)].map((_, i) => (
        <div key={i} className="h-8 w-8 bg-slate-100 rounded animate-pulse" />
      ))}
    </div>
    <div className="h-96 bg-slate-50 rounded animate-pulse" />
  </div>
)

// PDF Designer - Heavy component with @pdfme libs
export const LazyPDFDesigner = dynamic(
  () => import('@/components/pdf-designer/pdf-designer').then(mod => ({ default: mod.PDFDesigner })),
  {
    loading: () => <EditorLoadingSkeleton />,
    ssr: false,
  }
)

// PDF Viewer - Heavy component
export const LazyPDFViewer = dynamic(
  () => import('@/components/pdf-designer/pdf-viewer').then(mod => ({ default: mod.PDFViewer })),
  {
    loading: () => <LoadingSkeleton className="h-[600px]" />,
    ssr: false,
  }
)

// Quote Editor - Complex form with many fields
export const LazyQuoteEditor = dynamic(
  () => import('@/components/quotes/QuoteEditor').then(mod => ({ default: mod.QuoteEditor })),
  {
    loading: () => <EditorLoadingSkeleton />,
    ssr: false,
  }
)

// Quote PDF Generator - Heavy PDF generation
export const LazyQuotePDFGenerator = dynamic(
  () => import('@/components/quotes/QuotePDFGenerator').then(mod => ({ default: mod.QuotePDFGenerator })),
  {
    loading: () => <LoadingSkeleton className="h-32" />,
    ssr: false,
  }
)

// Document Editor - TipTap rich text editor
export const LazyDocumentEditor = dynamic(
  () => import('@/components/docs/document-editor').then(mod => ({ default: mod.DocumentEditor })),
  {
    loading: () => <EditorLoadingSkeleton />,
    ssr: false,
  }
)

// File Preview Dialog - Heavy with Office preview, image processing
export const LazyFilePreviewDialog = dynamic(
  () => import('@/components/file-vault/FilePreviewDialog').then(mod => ({ default: mod.FilePreviewDialog })),
  {
    loading: () => <LoadingSkeleton className="h-[80vh]" />,
    ssr: false,
  }
)

// Virtual File Table - Heavy virtualization
export const LazyVirtualFileTable = dynamic(
  () => import('@/components/file-vault/VirtualFileTable').then(mod => ({ default: mod.default })),
  {
    loading: () => <TableLoadingSkeleton />,
    ssr: false,
  }
)

// Form Builder - Complex drag-and-drop
export const LazyFormBuilder = dynamic(
  () => import('@/components/admin/form-builder/form-builder').then(mod => ({ default: mod.FormBuilder })),
  {
    loading: () => <EditorLoadingSkeleton />,
    ssr: false,
  }
)

// Workflow Builder - Complex flow editor
export const LazyWorkflowBuilder = dynamic(
  () => import('@/components/admin/cms/workflow-builder').then(mod => ({ default: mod.WorkflowBuilder })),
  {
    loading: () => <EditorLoadingSkeleton />,
    ssr: false,
  }
)

// Charts (Recharts) - Heavy charting library
export const LazyCharts = dynamic(
  () => import('recharts').then(mod => mod),
  {
    loading: () => <LoadingSkeleton className="h-80" />,
    ssr: false,
  }
)

// Import/Export Preview - Heavy data processing
export const LazyImportPreview = dynamic(
  () => import('@/components/import-export/import-preview').then(mod => ({ default: mod.ImportPreview })),
  {
    loading: () => <TableLoadingSkeleton />,
    ssr: false,
  }
)

// Export Dialog - Heavy export processing
export const LazyExportDialog = dynamic(
  () => import('@/components/import-export/export-dialog').then(mod => ({ default: mod.ExportDialog })),
  {
    loading: () => <LoadingSkeleton className="h-48" />,
    ssr: false,
  }
)

// Office Preview - Heavy document parsing
export const LazyOfficePreview = dynamic(
  () => import('@/components/file-vault/OfficePreview').then(mod => ({ default: mod.OfficePreview })),
  {
    loading: () => <LoadingSkeleton className="h-96" />,
    ssr: false,
  }
)

// Quote Kanban - Complex drag-and-drop board
export const LazyQuoteKanban = dynamic(
  () => import('@/components/quotes/QuoteKanban').then(mod => ({ default: mod.QuoteKanban })),
  {
    loading: () => (
      <div className="flex gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="w-72 h-96 bg-slate-100 rounded animate-pulse" />
        ))}
      </div>
    ),
    ssr: false,
  }
)

// Modal Designer - Complex designer
export const LazyModalDesigner = dynamic(
  () => import('@/components/admin/modal-designer/modal-designer').then(mod => ({ default: mod.ModalDesigner })),
  {
    loading: () => <EditorLoadingSkeleton />,
    ssr: false,
  }
)

/**
 * Helper to create a lazy component with custom loading
 */
export function createLazyComponent<T extends ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  LoadingComponent: ComponentType = () => <LoadingSkeleton />
) {
  return dynamic(importFn, {
    loading: LoadingComponent,
    ssr: false,
  })
}
