'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  Download,
  Lock,
  Loader2,
  File,
  FileText,
  Image as ImageIcon,
  Film,
  Music,
  Folder,
  AlertCircle,
  CheckCircle,
  Eye,
} from 'lucide-react'

// Format file size
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`
}

// Get file icon
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return ImageIcon
  if (mimeType.startsWith('video/')) return Film
  if (mimeType.startsWith('audio/')) return Music
  if (mimeType === 'application/pdf') return FileText
  return File
}

interface SharedContent {
  type: 'file' | 'folder'
  id: string
  name: string
  mime_type?: string
  size_bytes?: number
  extension?: string
  thumbnail_small?: string
  thumbnail_medium?: string
  width?: number
  height?: number
  path?: string
  files?: Array<{
    id: string
    name: string
    mime_type: string
    size_bytes: number
    extension: string
    thumbnail_small?: string
  }>
  fileCount?: number
}

interface ShareData {
  shortCode: string
  title?: string
  message?: string
  allowDownload: boolean
  allowUpload: boolean
  requiresPassword: boolean
  content: SharedContent
}

export default function SharePage() {
  const params = useParams()
  const shortCode = params.shortCode as string

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [shareData, setShareData] = useState<ShareData | null>(null)
  const [password, setPassword] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadingFileId, setDownloadingFileId] = useState<string | null>(null)

  // Load share data
  useEffect(() => {
    const loadShare = async () => {
      try {
        const response = await fetch(`/api/share/${shortCode}`)
        if (response.ok) {
          const data = await response.json()
          setShareData(data)
          setIsUnlocked(!data.requiresPassword)
        } else {
          const errorData = await response.json()
          setError(errorData.error || 'Jagamislinki ei leitud')
        }
      } catch {
        setError('Viga jagamislingi laadimisel')
      } finally {
        setIsLoading(false)
      }
    }

    if (shortCode) {
      loadShare()
    }
  }, [shortCode])

  // Handle password submit
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/share/${shortCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (response.ok) {
        setIsUnlocked(true)
        setError(null)
      } else {
        const data = await response.json()
        setError(data.error || 'Vale parool')
      }
    } catch {
      setError('Viga parooli kontrollimisel')
    }
  }

  // Handle download
  const handleDownload = async (fileId?: string) => {
    if (!shareData?.allowDownload) return

    setIsDownloading(true)
    if (fileId) setDownloadingFileId(fileId)

    try {
      const body: { password?: string; action: string; fileId?: string } = {
        action: 'download',
      }
      if (shareData.requiresPassword && password) {
        body.password = password
      }
      if (fileId) {
        body.fileId = fileId
      }

      const response = await fetch(`/api/share/${shortCode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        const data = await response.json()
        // Trigger download
        const link = document.createElement('a')
        link.href = data.downloadUrl
        link.download = data.fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        const data = await response.json()
        setError(data.error || 'Allalaadimine ebaõnnestus')
      }
    } catch {
      setError('Viga allalaadimisel')
    } finally {
      setIsDownloading(false)
      setDownloadingFileId(null)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-[#279989] mx-auto" />
          <p className="mt-4 text-slate-600">Laadin...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error && !shareData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-900 mb-2">Viga</h1>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    )
  }

  // Password required state
  if (shareData?.requiresPassword && !isUnlocked) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-6">
            <Lock className="w-16 h-16 text-amber-500 mx-auto mb-4" />
            <h1 className="text-xl font-bold text-slate-900 mb-2">
              Parooliga kaitstud
            </h1>
            <p className="text-slate-600">
              See fail on parooliga kaitstud. Sisesta parool, et jätkata.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sisesta parool"
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#279989] focus:border-transparent"
              autoFocus
            />
            {error && (
              <p className="text-red-600 text-sm mt-2">{error}</p>
            )}
            <button
              type="submit"
              className="w-full mt-4 px-4 py-3 bg-[#279989] text-white rounded-lg font-medium hover:bg-[#1e7a6d] transition-colors"
            >
              Ava fail
            </button>
          </form>
        </div>
      </div>
    )
  }

  // Main share view
  const content = shareData?.content

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {/* Brand header */}
          <div className="bg-[#279989] px-6 py-4">
            <h1 className="text-white font-bold text-lg">Rivest File Vault</h1>
          </div>

          {/* Content */}
          <div className="p-6">
            {shareData?.title && (
              <h2 className="text-xl font-bold text-slate-900 mb-2">
                {shareData.title}
              </h2>
            )}

            {shareData?.message && (
              <p className="text-slate-600 mb-6">{shareData.message}</p>
            )}

            {/* Single file */}
            {content?.type === 'file' && (
              <div className="border border-slate-200 rounded-lg p-6">
                <div className="flex items-center gap-4">
                  {content.thumbnail_medium ? (
                    <img
                      src={content.thumbnail_medium}
                      alt={content.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-20 h-20 bg-slate-100 rounded-lg flex items-center justify-center">
                      {(() => {
                        const Icon = getFileIcon(content.mime_type || '')
                        return <Icon className="w-10 h-10 text-slate-400" />
                      })()}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-900 truncate">
                      {content.name}
                    </h3>
                    <p className="text-slate-500">
                      {formatFileSize(content.size_bytes || 0)}
                      {content.width && content.height && (
                        <span className="ml-2">
                          {content.width} x {content.height}
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                {shareData?.allowDownload && (
                  <button
                    onClick={() => handleDownload()}
                    disabled={isDownloading}
                    className="w-full mt-6 px-4 py-3 bg-[#279989] text-white rounded-lg font-medium hover:bg-[#1e7a6d] transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                    Laadi alla
                  </button>
                )}
              </div>
            )}

            {/* Folder with files */}
            {content?.type === 'folder' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-slate-200">
                  <Folder className="w-8 h-8 text-amber-500" />
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900">
                      {content.name}
                    </h3>
                    <p className="text-slate-500">
                      {content.fileCount} faili
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  {content.files?.map((file) => {
                    const Icon = getFileIcon(file.mime_type)
                    const isFileDownloading = downloadingFileId === file.id

                    return (
                      <div
                        key={file.id}
                        className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg"
                      >
                        {file.thumbnail_small ? (
                          <img
                            src={file.thumbnail_small}
                            alt={file.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-slate-200 rounded flex items-center justify-center">
                            <Icon className="w-5 h-5 text-slate-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {file.name}
                          </p>
                          <p className="text-xs text-slate-500">
                            {formatFileSize(file.size_bytes)}
                          </p>
                        </div>
                        {shareData?.allowDownload && (
                          <button
                            onClick={() => handleDownload(file.id)}
                            disabled={isDownloading}
                            className="p-2 text-slate-600 hover:text-[#279989] hover:bg-white rounded-lg transition-colors disabled:opacity-50"
                          >
                            {isFileDownloading ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Download className="w-5 h-5" />
                            )}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {error && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg flex items-center gap-3 text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 text-center">
            <p className="text-sm text-slate-500">
              Jagatud läbi <span className="font-medium text-[#279989]">Rivest File Vault</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
