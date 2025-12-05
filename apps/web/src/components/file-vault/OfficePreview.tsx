'use client'

import { useState, useEffect } from 'react'
import { Loader2, ExternalLink, Download, AlertCircle } from 'lucide-react'
import { Button } from '@rivest/ui'

interface OfficePreviewProps {
  fileUrl: string
  fileName: string
  mimeType: string
  onDownload?: () => void
}

// Microsoft Office Online viewer base URLs
const OFFICE_VIEWER_URL = 'https://view.officeapps.live.com/op/embed.aspx'

// Supported Office formats
const OFFICE_EXTENSIONS = {
  word: ['doc', 'docx', 'odt', 'rtf'],
  excel: ['xls', 'xlsx', 'csv', 'ods'],
  powerpoint: ['ppt', 'pptx', 'odp'],
}

/**
 * Check if file is an Office document
 */
export function isOfficeDocument(mimeType: string, extension?: string): boolean {
  const ext = extension?.toLowerCase()

  // Check by MIME type
  if (mimeType.includes('word') || mimeType.includes('document')) return true
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return true
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return true

  // Check by extension
  if (!ext) return false
  return (
    OFFICE_EXTENSIONS.word.includes(ext) ||
    OFFICE_EXTENSIONS.excel.includes(ext) ||
    OFFICE_EXTENSIONS.powerpoint.includes(ext)
  )
}

/**
 * Get Office document type
 */
export function getOfficeType(mimeType: string, extension?: string): 'word' | 'excel' | 'powerpoint' | null {
  const ext = extension?.toLowerCase()

  if (mimeType.includes('word') || mimeType.includes('document')) return 'word'
  if (OFFICE_EXTENSIONS.word.includes(ext || '')) return 'word'

  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'excel'
  if (OFFICE_EXTENSIONS.excel.includes(ext || '')) return 'excel'

  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'powerpoint'
  if (OFFICE_EXTENSIONS.powerpoint.includes(ext || '')) return 'powerpoint'

  return null
}

/**
 * Office document preview using Microsoft Office Online
 */
export function OfficePreview({ fileUrl, fileName, mimeType, onDownload }: OfficePreviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewerUrl, setViewerUrl] = useState<string | null>(null)

  useEffect(() => {
    // Build viewer URL
    // Microsoft Office Viewer requires a publicly accessible URL
    // For private files, we might need to use Google Docs viewer as fallback
    if (fileUrl) {
      // Encode the file URL
      const encodedUrl = encodeURIComponent(fileUrl)
      const url = `${OFFICE_VIEWER_URL}?src=${encodedUrl}`
      setViewerUrl(url)
      setIsLoading(false)
    }
  }, [fileUrl])

  const extension = fileName.split('.').pop()?.toLowerCase()
  const officeType = getOfficeType(mimeType, extension)

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-slate-50 rounded-lg p-8">
        <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
        <h3 className="text-lg font-medium text-slate-900 mb-2">Eelvaade pole saadaval</h3>
        <p className="text-sm text-slate-500 text-center mb-4 max-w-md">
          {error}
        </p>
        <div className="flex gap-2">
          {onDownload && (
            <Button onClick={onDownload} className="gap-2">
              <Download className="w-4 h-4" />
              Laadi alla
            </Button>
          )}
          <Button
            variant="outline"
            onClick={() => window.open(fileUrl, '_blank')}
            className="gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            Ava uues aknas
          </Button>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#279989] mb-4" />
        <p className="text-sm text-slate-500">Laen eelvaadet...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header bar */}
      <div className="flex items-center justify-between p-3 border-b border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-slate-700">
            {officeType === 'word' && 'Word dokument'}
            {officeType === 'excel' && 'Excel tabel'}
            {officeType === 'powerpoint' && 'PowerPoint esitlus'}
          </span>
          <span className="text-xs text-slate-400 uppercase">.{extension}</span>
        </div>
        <div className="flex items-center gap-2">
          {onDownload && (
            <Button variant="outline" size="sm" onClick={onDownload} className="gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Laadi alla
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(fileUrl, '_blank')}
            className="gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Ava
          </Button>
        </div>
      </div>

      {/* Iframe viewer */}
      <div className="flex-1 relative bg-white">
        {viewerUrl ? (
          <iframe
            src={viewerUrl}
            className="absolute inset-0 w-full h-full border-0"
            title={fileName}
            onLoad={() => setIsLoading(false)}
            onError={() => setError('Eelvaate laadimine ebaõnnestus. Proovi alla laadida.')}
            sandbox="allow-scripts allow-same-origin allow-popups"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <AlertCircle className="w-12 h-12 text-slate-300 mb-4" />
            <p className="text-slate-500 text-center">
              Office failide eelvaade vajab avalikku faili URL'i.
              <br />
              Lae fail alla, et seda vaadata.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Alternative: Google Docs Viewer for private files
 * Note: Google Docs Viewer also requires publicly accessible URLs
 */
export function GoogleDocsPreview({ fileUrl, fileName }: { fileUrl: string; fileName: string }) {
  const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`

  return (
    <iframe
      src={viewerUrl}
      className="w-full h-full border-0"
      title={fileName}
      sandbox="allow-scripts allow-same-origin"
    />
  )
}

export default OfficePreview
