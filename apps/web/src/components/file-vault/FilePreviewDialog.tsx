'use client'

import { useState, useEffect } from 'react'
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
} from 'lucide-react'

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
}

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`
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
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    if (open && fileId) {
      loadFile()
    }
    return () => {
      setPreviewUrl(null)
      setZoom(1)
    }
  }, [open, fileId])

  const loadFile = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/file-vault/files/${fileId}`)
      if (response.ok) {
        const data = await response.json()
        setFile(data)

        // Get preview URL for supported types
        if (isPreviewable(data.mimeType)) {
          const downloadResponse = await fetch(`/api/file-vault/download/${fileId}`)
          if (downloadResponse.ok) {
            const downloadData = await downloadResponse.json()
            setPreviewUrl(downloadData.downloadUrl)
          }
        }
      }
    } catch (error) {
      console.error('Error loading file:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownload = async () => {
    if (!file) return
    setIsDownloading(true)
    try {
      const response = await fetch(`/api/file-vault/download/${fileId}?redirect=true`)
      if (response.redirected) {
        // Create a temporary link and click it
        const link = document.createElement('a')
        link.href = response.url
        link.download = file.name
        link.click()
      } else {
        const data = await response.json()
        if (data.downloadUrl) {
          window.open(data.downloadUrl, '_blank')
        }
      }
    } catch (error) {
      console.error('Error downloading file:', error)
      alert('Allalaadimine ebaõnnestus')
    } finally {
      setIsDownloading(false)
    }
  }

  const isPreviewable = (mimeType: string): boolean => {
    return (
      mimeType.startsWith('image/') ||
      mimeType.startsWith('video/') ||
      mimeType.startsWith('audio/') ||
      mimeType === 'application/pdf'
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

    // Image preview
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

    // Video preview
    if (mimeType.startsWith('video/')) {
      return (
        <div className="flex items-center justify-center h-full bg-black">
          <video
            src={previewUrl}
            controls
            className="max-w-full max-h-full"
          >
            Sinu brauser ei toeta video taasesitust.
          </video>
        </div>
      )
    }

    // Audio preview
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

    // PDF preview
    if (mimeType === 'application/pdf') {
      return (
        <iframe
          src={previewUrl}
          className="w-full h-full border-0"
          title={file.name}
        />
      )
    }

    return null
  }

  if (!open) return null

  const FileIcon = file ? getFileIcon(file.mimeType) : File

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="w-full h-full max-w-6xl max-h-[95vh] m-4 flex flex-col bg-white rounded-xl shadow-2xl overflow-hidden">
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
          ) : file && isPreviewable(file.mimeType) ? (
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
    </div>
  )
}

export default FilePreviewDialog
