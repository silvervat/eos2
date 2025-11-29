'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Viewer } from '@pdfme/ui'
import type { Template } from '@pdfme/common'
import { pdfmePlugins } from '@/lib/pdf/pdfme-config'
import { Button } from '@rivest/ui'
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  Download,
  Printer,
  X,
  Maximize2,
  Minimize2,
} from 'lucide-react'

interface PDFViewerProps {
  template: Template
  inputs?: Record<string, string>[]
  onClose?: () => void
  onDownload?: () => void
  showControls?: boolean
  className?: string
}

export function PDFViewer({
  template,
  inputs = [{}],
  onClose,
  onDownload,
  showControls = true,
  className = '',
}: PDFViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const viewerRef = useRef<Viewer | null>(null)

  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [zoom, setZoom] = useState(100)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Initialize viewer
  useEffect(() => {
    if (!containerRef.current) return

    const viewer = new Viewer({
      domContainer: containerRef.current,
      template,
      inputs,
      options: {
        theme: {
          token: {
            colorPrimary: '#279989',
          },
        },
      },
      plugins: pdfmePlugins,
    })

    viewerRef.current = viewer

    // Calculate total pages based on schemas
    setTotalPages(template.schemas.length || 1)

    return () => {
      if (viewerRef.current) {
        viewerRef.current.destroy()
      }
    }
  }, [template, inputs])

  // Handle zoom (CSS transform based)
  const handleZoomIn = useCallback(() => {
    const newZoom = Math.min(zoom + 25, 300)
    setZoom(newZoom)
    // Apply zoom via CSS transform
    if (containerRef.current) {
      const viewerContent = containerRef.current.querySelector('.pdfme-viewer')
      if (viewerContent) {
        (viewerContent as HTMLElement).style.transform = `scale(${newZoom / 100})`
        ;(viewerContent as HTMLElement).style.transformOrigin = 'top center'
      }
    }
  }, [zoom])

  const handleZoomOut = useCallback(() => {
    const newZoom = Math.max(zoom - 25, 25)
    setZoom(newZoom)
    // Apply zoom via CSS transform
    if (containerRef.current) {
      const viewerContent = containerRef.current.querySelector('.pdfme-viewer')
      if (viewerContent) {
        (viewerContent as HTMLElement).style.transform = `scale(${newZoom / 100})`
        ;(viewerContent as HTMLElement).style.transformOrigin = 'top center'
      }
    }
  }, [zoom])

  // Handle page navigation
  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prev) => prev - 1)
      // Note: pdfme viewer handles multi-page scrolling internally
    }
  }

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1)
    }
  }

  // Handle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.parentElement?.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  // Handle print
  const handlePrint = () => {
    window.print()
  }

  return (
    <div className={`flex flex-col bg-slate-100 ${className}`}>
      {/* Toolbar */}
      {showControls && (
        <div className="flex items-center justify-between bg-white border-b border-slate-200 px-4 py-2">
          {/* Left - Page navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Eelmine leht"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <span className="text-sm text-slate-600 min-w-[80px] text-center">
              Leht {currentPage} / {totalPages}
            </span>
            <button
              onClick={handleNextPage}
              disabled={currentPage >= totalPages}
              className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Järgmine leht"
            >
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Center - Zoom */}
          <div className="flex items-center gap-1 border border-slate-200 rounded-md">
            <button
              onClick={handleZoomOut}
              className="p-1.5 hover:bg-slate-100 rounded-l-md"
              title="Vähenda"
            >
              <ZoomOut className="w-4 h-4 text-slate-600" />
            </button>
            <span className="text-sm text-slate-600 px-3 min-w-[60px] text-center">
              {zoom}%
            </span>
            <button
              onClick={handleZoomIn}
              className="p-1.5 hover:bg-slate-100 rounded-r-md"
              title="Suurenda"
            >
              <ZoomIn className="w-4 h-4 text-slate-600" />
            </button>
          </div>

          {/* Right - Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="p-2 rounded hover:bg-slate-100"
              title="Prindi"
            >
              <Printer className="w-5 h-5 text-slate-600" />
            </button>

            {onDownload && (
              <Button
                variant="outline"
                size="sm"
                onClick={onDownload}
                className="gap-1"
              >
                <Download className="w-4 h-4" />
                Laadi alla
              </Button>
            )}

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded hover:bg-slate-100"
              title={isFullscreen ? 'Välju täisekraanist' : 'Täisekraan'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5 text-slate-600" />
              ) : (
                <Maximize2 className="w-5 h-5 text-slate-600" />
              )}
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="p-2 rounded hover:bg-slate-100"
                title="Sulge"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Viewer canvas */}
      <div className="flex-1 overflow-auto">
        <div
          ref={containerRef}
          className="w-full h-full min-h-[600px]"
        />
      </div>
    </div>
  )
}

export default PDFViewer
