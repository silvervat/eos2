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

// PDF Designer - Heavy component with @pdfme libs (default export)
export const LazyPDFDesigner = dynamic(
  () => import('@/components/pdf-designer/pdf-designer'),
  {
    loading: () => <EditorLoadingSkeleton />,
    ssr: false,
  }
)

// PDF Viewer - Heavy component (default export)
export const LazyPDFViewer = dynamic(
  () => import('@/components/pdf-designer/pdf-viewer'),
  {
    loading: () => <LoadingSkeleton className="h-[600px]" />,
    ssr: false,
  }
)

// Quote Editor - Complex form with many fields (default export)
export const LazyQuoteEditor = dynamic(
  () => import('@/components/quotes/QuoteEditor'),
  {
    loading: () => <EditorLoadingSkeleton />,
    ssr: false,
  }
)

// Quote PDF Generator - Heavy PDF generation (default export)
export const LazyQuotePDFGenerator = dynamic(
  () => import('@/components/quotes/QuotePDFGenerator'),
  {
    loading: () => <LoadingSkeleton className="h-32" />,
    ssr: false,
  }
)

// Document Editor - TipTap rich text editor (named export)
export const LazyDocumentEditor = dynamic(
  () => import('@/components/docs/document-editor').then(mod => mod.DocumentEditor),
  {
    loading: () => <EditorLoadingSkeleton />,
    ssr: false,
  }
)

// File Preview Dialog - Heavy with Office preview (default export)
export const LazyFilePreviewDialog = dynamic(
  () => import('@/components/file-vault/FilePreviewDialog'),
  {
    loading: () => <LoadingSkeleton className="h-[80vh]" />,
    ssr: false,
  }
)

// Virtual File Table - Heavy virtualization (default export)
export const LazyVirtualFileTable = dynamic(
  () => import('@/components/file-vault/VirtualFileTable'),
  {
    loading: () => <TableLoadingSkeleton />,
    ssr: false,
  }
)

// Form Builder - Complex drag-and-drop (named export)
export const LazyFormBuilder = dynamic(
  () => import('@/components/admin/form-builder/form-builder').then(mod => mod.FormBuilder),
  {
    loading: () => <EditorLoadingSkeleton />,
    ssr: false,
  }
)

// Workflow Builder - Complex flow editor (named export)
export const LazyWorkflowBuilder = dynamic(
  () => import('@/components/admin/cms/workflow-builder').then(mod => mod.WorkflowBuilder),
  {
    loading: () => <EditorLoadingSkeleton />,
    ssr: false,
  }
)

// Import/Export Preview - Heavy data processing (default export)
export const LazyImportPreview = dynamic(
  () => import('@/components/import-export/import-preview'),
  {
    loading: () => <TableLoadingSkeleton />,
    ssr: false,
  }
)

// Export Dialog - Heavy export processing (default export)
export const LazyExportDialog = dynamic(
  () => import('@/components/import-export/export-dialog'),
  {
    loading: () => <LoadingSkeleton className="h-48" />,
    ssr: false,
  }
)

// Office Preview - Heavy document parsing (default export)
export const LazyOfficePreview = dynamic(
  () => import('@/components/file-vault/OfficePreview'),
  {
    loading: () => <LoadingSkeleton className="h-96" />,
    ssr: false,
  }
)

// Quote Kanban - Complex drag-and-drop board (default export)
export const LazyQuoteKanban = dynamic(
  () => import('@/components/quotes/QuoteKanban'),
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

// Modal Designer - Complex designer (default export)
export const LazyModalDesigner = dynamic(
  () => import('@/components/admin/modal-designer/modal-designer'),
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
