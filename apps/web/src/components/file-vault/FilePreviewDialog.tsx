'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Button, Card } from '@rivest/ui'
import {
  X,
  Download,
  Share2,
  Loader2,
  FileText,
  Film,
  Music,
  Image as ImageIcon,
  File,
  Maximize2,
  ZoomIn,
  ZoomOut,
  MessageSquare,
  History,
  Info,
  Search,
  Wand2,
} from 'lucide-react'
import { FileComments } from './FileComments'
import { FileVersions } from './FileVersions'
import { OfficePreview, isOfficeDocument } from './OfficePreview'

interface FilePreviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  fileId: string
  vaultId: string
  onShare?: () => void
}

interface FileData {
  id: string
  name: string
  path: string
  mimeType: string
  sizeBytes: number
  extension: string
  width?: number
  height?: number
  thumbnailSmall?: string
  thumbnailMedium?: string
  thumbnailLarge?: string
  createdAt: string
  updatedAt: string
  version?: number
  extractedText?: string
}

type SidebarTab = 'info' | 'comments' | 'versions'

// Simple cache for file data
const fileCache = new Map<string, { file: FileData; previewUrl: string | null; timestamp: number }>()
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`
}

// Format date
const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('et-EE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function FilePreviewDialog({
  open,
  onOpenChange,
  fileId,
  vaultId,
  onShare,
}: FilePreviewDialogProps) {
  const [file, setFile] = useState<FileData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isExtracting, setIsExtracting] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('info')
  const [showSidebar, setShowSidebar] = useState(true)

  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onOpenChange(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  const loadFile = useCallback(async (forceRefresh = false) => {
    // Check cache first
    const cached = fileCache.get(fileId)
    if (!forceRefresh && cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setFile(cached.file)
      setPreviewUrl(cached.previewUrl)
      return
    }

    setIsLoading(true)
    try {
      // Fetch file metadata and download URL in parallel
      const [fileResponse, downloadResponse] = await Promise.all([
        fetch(`/api/file-vault/files/${fileId}`),
        fetch(`/api/file-vault/download/${fileId}`),
      ])

      if (fileResponse.ok) {
        const data = await fileResponse.json()
        setFile(data)

        let newPreviewUrl: string | null = null
        // Get preview URL from parallel request
        if (downloadResponse.ok && isPreviewable(data.mimeType, data.extension)) {
          const downloadData = await downloadResponse.json()
          newPreviewUrl = downloadData.downloadUrl
          setPreviewUrl(newPreviewUrl)
        }

        // Cache the result
        fileCache.set(fileId, {
          file: data,
          previewUrl: newPreviewUrl,
          timestamp: Date.now()
        })
      }
    } catch (error) {
      console.error('Error loading file:', error)
    } finally {
      setIsLoading(false)
    }
  }, [fileId])

  useEffect(() => {
    if (open && fileId) {
      loadFile()
    }
    if (!open) {
      setZoom(1)
    }
  }, [open, fileId, loadFile])

  const handleDownload = async () => {
    if (!file) return
    setIsDownloading(true)
    try {
      const response = await fetch(`/api/file-vault/download/${fileId}`)
      if (response.ok) {
        const data = await response.json()

        // Fetch file as blob to force download
        const fileResponse = await fetch(data.downloadUrl)
        const blob = await fileResponse.blob()

        // Create blob URL and trigger download
        const blobUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = file.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(blobUrl)
      } else {
        alert('Allalaadimine ebaõnnestus')
      }
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Allalaadimine ebaõnnestus')
    } finally {
      setIsDownloading(false)
    }
  }

  const handleExtractText = async () => {
    if (!file) return
    setIsExtracting(true)
    try {
      const response = await fetch('/api/file-vault/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileId,
          enableOcr: file.mimeType.startsWith('image/'),
        }),
      })
      if (response.ok) {
        const data = await response.json()
        if (data.extracted) {
          alert(`Tekst edukalt eraldatud (${data.textLength} tähemärki)`)
          loadFile(true) // Force refresh file data
        } else {
          alert(data.message || 'Teksti ei õnnestunud eraldada')
        }
      }
    } catch (error) {
      console.error('Error extracting text:', error)
      alert('Teksti eraldamine ebaõnnestus')
    } finally {
      setIsExtracting(false)
    }
  }

  // Check if file type can be previewed (local helper for non-Office types)

  const isPreviewable = (mimeType: string, extension?: string): boolean => {
    return (
      mimeType.startsWith('image/') ||
      mimeType.startsWith('video/') ||
      mimeType.startsWith('audio/') ||
      mimeType === 'application/pdf' ||
      isOfficeDocument(mimeType, extension)
    )
  }

  const canExtractText = (mimeType: string): boolean => {
    return (
      mimeType === 'application/pdf' ||
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      mimeType.startsWith('image/')
    )
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return ImageIcon
    if (mimeType.startsWith('video/')) return Film
    if (mimeType.startsWith('audio/')) return Music
    if (mimeType === 'application/pdf') return FileText
    return File
  }

  const renderPreview = () => {
    if (!file || !previewUrl) return null

    const { mimeType } = file

    if (mimeType.startsWith('image/')) {
      return (
        <div className="relative flex items-center justify-center overflow-auto h-full bg-slate-900/50">
          <img
            src={previewUrl}
            alt={file.name}
            className="max-w-full max-h-full object-contain transition-transform"
            style={{ transform: `scale(${zoom})` }}
          />
          <div className="absolute bottom-4 right-4 flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
              className="bg-white/90"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setZoom(Math.min(3, zoom + 0.25))}
              className="bg-white/90"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button
              variant="secondary"
              size="icon"
              onClick={() => window.open(previewUrl, '_blank')}
              className="bg-white/90"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )
    }

    if (mimeType.startsWith('video/')) {
      return (
        <div className="flex items-center justify-center h-full bg-black">
          <video src={previewUrl} controls className="max-w-full max-h-full">
            Sinu brauser ei toeta video taasesitust.
          </video>
        </div>
      )
    }

    if (mimeType.startsWith('audio/')) {
      return (
        <div className="flex flex-col items-center justify-center h-full gap-4 bg-slate-100">
          <Music className="w-24 h-24 text-slate-400" />
          <audio src={previewUrl} controls className="w-full max-w-md">
            Sinu brauser ei toeta audio taasesitust.
          </audio>
        </div>
      )
    }

    if (mimeType === 'application/pdf') {
      return (
        <iframe
          src={previewUrl}
          className="w-full h-full border-0"
          title={file.name}
        />
      )
    }

    // Office documents - use Microsoft Office Online viewer
    if (isOfficeDocument(mimeType, file.extension)) {
      return (
        <OfficePreview
          fileUrl={previewUrl}
          fileName={file.name}
          mimeType={mimeType}
          onDownload={handleDownload}
        />
      )
    }

    return null
  }

  const renderSidebar = () => {
    if (!showSidebar || !file) return null

    return (
      <div className="w-80 border-l border-slate-200 flex flex-col bg-white">
        {/* Tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setSidebarTab('info')}
            className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-1.5 ${
              sidebarTab === 'info'
                ? 'text-[#279989] border-b-2 border-[#279989]'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Info className="w-4 h-4" />
            Info
          </button>
          <button
            onClick={() => setSidebarTab('comments')}
            className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-1.5 ${
              sidebarTab === 'comments'
                ? 'text-[#279989] border-b-2 border-[#279989]'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Komm.
          </button>
          <button
            onClick={() => setSidebarTab('versions')}
            className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-1.5 ${
              sidebarTab === 'versions'
                ? 'text-[#279989] border-b-2 border-[#279989]'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <History className="w-4 h-4" />
            Versioonid
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-hidden">
          {sidebarTab === 'info' && (
            <div className="p-4 space-y-4 overflow-auto h-full">
              {/* File info */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-500 uppercase">Nimi</label>
                  <p className="text-sm text-slate-900 break-all">{file.name}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase">Suurus</label>
                  <p className="text-sm text-slate-900">{formatFileSize(file.sizeBytes)}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase">Tüüp</label>
                  <p className="text-sm text-slate-900">{file.mimeType}</p>
                </div>
                {file.width && file.height && (
                  <div>
                    <label className="text-xs text-slate-500 uppercase">Mõõtmed</label>
                    <p className="text-sm text-slate-900">{file.width} × {file.height}px</p>
                  </div>
                )}
                <div>
                  <label className="text-xs text-slate-500 uppercase">Versioon</label>
                  <p className="text-sm text-slate-900">v{file.version || 1}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase">Loodud</label>
                  <p className="text-sm text-slate-900">{formatDate(file.createdAt)}</p>
                </div>
                <div>
                  <label className="text-xs text-slate-500 uppercase">Uuendatud</label>
                  <p className="text-sm text-slate-900">{formatDate(file.updatedAt)}</p>
                </div>
              </div>

              {/* Text extraction */}
              {canExtractText(file.mimeType) && (
                <div className="pt-4 border-t border-slate-200">
                  <label className="text-xs text-slate-500 uppercase mb-2 block">
                    Täisteksti otsing
                  </label>
                  {file.extractedText ? (
                    <div>
                      <p className="text-xs text-green-600 mb-2">
                        ✓ Tekst eraldatud ({file.extractedText.length} tähemärki)
                      </p>
                      <div className="p-2 bg-slate-50 rounded text-xs text-slate-600 max-h-32 overflow-auto">
                        {file.extractedText.substring(0, 500)}
                        {file.extractedText.length > 500 && '...'}
                      </div>
                    </div>
                  ) : (
                    <Button
                      onClick={handleExtractText}
                      disabled={isExtracting}
                      variant="outline"
                      className="w-full text-sm"
                    >
                      {isExtracting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Eraldan teksti...
                        </>
                      ) : (
                        <>
                          <Wand2 className="w-4 h-4 mr-2" />
                          {file.mimeType.startsWith('image/') ? 'Käivita OCR' : 'Eralda tekst'}
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {sidebarTab === 'comments' && (
            <FileComments fileId={fileId} fileName={file.name} />
          )}

          {sidebarTab === 'versions' && (
            <FileVersions
              fileId={fileId}
              fileName={file.name}
              onVersionRestore={loadFile}
            />
          )}
        </div>
      </div>
    )
  }

  const FileIcon = file ? getFileIcon(file.mimeType) : File

  // Calculate responsive modal size based on file type and dimensions
  const getModalClasses = () => {
    if (!file) return 'w-full max-w-4xl'

    // Images - adapt to image size with sensible limits
    if (file.mimeType.startsWith('image/') && file.width && file.height) {
      const aspectRatio = file.width / file.height
      if (aspectRatio > 1.5) {
        // Wide image - use more width
        return 'w-[95vw] max-w-[1400px]'
      } else if (aspectRatio < 0.7) {
        // Tall/portrait image - use less width
        return 'w-[90vw] max-w-[800px]'
      }
      // Normal aspect ratio
      return 'w-[90vw] max-w-[1100px]'
    }

    // PDFs and documents - wider for readability
    if (file.mimeType === 'application/pdf' ||
        file.mimeType.includes('document') ||
        file.mimeType.includes('spreadsheet')) {
      return 'w-[95vw] max-w-[1400px]'
    }

    // Video - wide
    if (file.mimeType.startsWith('video/')) {
      return 'w-[95vw] max-w-[1200px]'
    }

    // Default
    return 'w-[90vw] max-w-[1000px]'
  }

  // Use CSS visibility instead of unmounting for faster open/close
  return (
    <div
      className={`fixed inset-0 bg-black/80 flex items-center justify-center z-50 transition-opacity duration-150 ${
        open ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
      }`}
      aria-hidden={!open}
      onClick={(e) => {
        // Close when clicking backdrop
        if (e.target === e.currentTarget) {
          onOpenChange(false)
        }
      }}
    >
      <div className={`${getModalClasses()} h-auto max-h-[95vh] m-4 flex bg-white rounded-xl shadow-2xl overflow-hidden`}>
        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                <FileIcon className="w-5 h-5 text-slate-500" />
              </div>
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-slate-900 truncate">
                  {file?.name || 'Laadin...'}
                </h2>
                {file && (
                  <p className="text-sm text-slate-500">
                    {formatFileSize(file.sizeBytes)}
                    {file.width && file.height && ` • ${file.width}×${file.height}`}
                    {file.version && file.version > 1 && ` • v${file.version}`}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {onShare && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onShare}
                  className="gap-1"
                >
                  <Share2 className="w-4 h-4" />
                  Jaga
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
                disabled={isDownloading || !file}
                className="gap-1"
              >
                {isDownloading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                Laadi alla
              </Button>
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className={`p-2 rounded-lg hover:bg-slate-200 ${showSidebar ? 'text-[#279989]' : 'text-slate-400'}`}
                title={showSidebar ? 'Peida külgriba' : 'Näita külgriba'}
              >
                <Info className="w-5 h-5" />
              </button>
              <button
                onClick={() => onOpenChange(false)}
                className="p-2 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Preview Content */}
          <div className="flex-1 overflow-hidden">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : file && isPreviewable(file.mimeType, file.extension) ? (
              renderPreview()
            ) : (
              <div className="flex flex-col items-center justify-center h-full gap-4 bg-slate-50">
                <FileIcon className="w-24 h-24 text-slate-300" />
                <div className="text-center">
                  <p className="text-slate-600">
                    Eelvaade pole saadaval selle failitüübi jaoks
                  </p>
                  <p className="text-sm text-slate-400 mt-1">
                    {file?.mimeType}
                  </p>
                </div>
                <Button
                  onClick={handleDownload}
                  disabled={isDownloading}
                  className="mt-4 bg-[#279989] hover:bg-[#1e7a6d] text-white"
                >
                  {isDownloading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 mr-2" />
                  )}
                  Laadi alla vaatamiseks
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        {renderSidebar()}
      </div>
    </div>
  )
}

export default FilePreviewDialog
