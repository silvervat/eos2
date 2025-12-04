'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@rivest/ui'
import {
  History,
  Upload,
  Download,
  RotateCcw,
  Loader2,
  User,
  FileText,
  Clock,
  ChevronDown,
} from 'lucide-react'

interface VersionUser {
  full_name: string
  avatar_url?: string | null
}

interface Version {
  id: string
  version: number
  size_bytes: number
  checksum_sha256: string
  mime_type: string
  change_description: string | null
  created_at: string
  created_by: string
  user: VersionUser
  isCurrent: boolean
  storage_path?: string
}

interface FileVersionsProps {
  fileId: string
  fileName: string
  onVersionRestore?: () => void
}

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

export function FileVersions({ fileId, fileName, onVersionRestore }: FileVersionsProps) {
  const [versions, setVersions] = useState<Version[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [changeDescription, setChangeDescription] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch versions
  const fetchVersions = useCallback(async () => {
    try {
      const response = await fetch(`/api/file-vault/versions?fileId=${fileId}`)
      if (response.ok) {
        const data = await response.json()
        setVersions(data.versions || [])
      }
    } catch (error) {
      console.error('Error fetching versions:', error)
    } finally {
      setIsLoading(false)
    }
  }, [fileId])

  useEffect(() => {
    fetchVersions()
  }, [fetchVersions])

  // Upload new version
  const handleUploadVersion = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('fileId', fileId)
      if (changeDescription.trim()) {
        formData.append('changeDescription', changeDescription.trim())
      }

      const response = await fetch('/api/file-vault/versions', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        setChangeDescription('')
        setShowUploadForm(false)
        fetchVersions()
        onVersionRestore?.()
      }
    } catch (error) {
      console.error('Error uploading version:', error)
    } finally {
      setIsUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  // Download specific version
  const handleDownloadVersion = async (version: Version) => {
    if (version.isCurrent) {
      // Download current version
      window.open(`/api/file-vault/download/${fileId}`, '_blank')
    } else {
      // Download old version from storage path
      window.open(`/api/file-vault/download/${fileId}?version=${version.version}`, '_blank')
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-[#279989]" />
          <h3 className="font-medium text-slate-900">Versioonid</h3>
          <span className="text-sm text-slate-500">({versions.length})</span>
        </div>
        <Button
          onClick={() => setShowUploadForm(!showUploadForm)}
          variant="outline"
          className="h-8 text-sm"
        >
          <Upload className="w-3.5 h-3.5 mr-1" />
          Uus versioon
        </Button>
      </div>

      {/* Upload form */}
      {showUploadForm && (
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <p className="text-sm text-slate-600 mb-2">
            Laadi üles uus versioon failist <strong>{fileName}</strong>
          </p>
          <div className="space-y-2">
            <input
              type="text"
              value={changeDescription}
              onChange={(e) => setChangeDescription(e.target.value)}
              placeholder="Kirjelda muudatusi (valikuline)..."
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#279989]"
            />
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleUploadVersion}
                className="hidden"
                id="version-upload"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="bg-[#279989] hover:bg-[#1e7a6d]"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Laadin...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Vali fail
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowUploadForm(false)}
                variant="outline"
              >
                Tühista
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Versions list */}
      <div className="flex-1 overflow-auto">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[#279989]" />
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <History className="w-12 h-12 mx-auto mb-2 text-slate-300" />
            <p>Versioone pole</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {versions.map((version, index) => (
              <div
                key={version.id}
                className={`p-4 hover:bg-slate-50 ${version.isCurrent ? 'bg-green-50/50' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    {/* Version badge */}
                    <div
                      className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${
                        version.isCurrent
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      v{version.version}
                    </div>

                    {/* Version info */}
                    <div>
                      <div className="flex items-center gap-2">
                        {version.isCurrent && (
                          <span className="px-2 py-0.5 text-xs bg-green-100 text-green-700 rounded-full">
                            Praegune
                          </span>
                        )}
                        <span className="text-sm text-slate-500">
                          {formatFileSize(version.size_bytes)}
                        </span>
                      </div>

                      {version.change_description && (
                        <p className="text-sm text-slate-700 mt-1">
                          {version.change_description}
                        </p>
                      )}

                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-500">
                        <User className="w-3 h-3" />
                        <span>{version.user.full_name}</span>
                        <span>•</span>
                        <Clock className="w-3 h-3" />
                        <span>{formatDate(version.created_at)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDownloadVersion(version)}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                      title="Laadi alla"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    {!version.isCurrent && (
                      <button
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-[#279989]"
                        title="Taasta see versioon"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FileVersions
