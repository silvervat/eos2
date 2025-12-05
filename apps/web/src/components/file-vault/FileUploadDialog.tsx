'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { Button, Card, Input } from '@rivest/ui'
import {
  Upload,
  X,
  File,
  Image as ImageIcon,
  FileText,
  Film,
  Music,
  Archive,
  Loader2,
  CheckCircle,
  AlertCircle,
  FolderOpen,
  Edit3,
  Copy,
} from 'lucide-react'

// Types
interface UploadFile {
  id: string
  file: File
  name: string
  originalName: string
  size: number
  type: string
  status: 'pending' | 'uploading' | 'success' | 'error' | 'duplicate'
  progress: number
  error?: string
  thumbnail?: string
  uploadSpeed?: number
  startTime?: number
  isEditing?: boolean
}

interface FileUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vaultId: string
  folderId?: string | null
  onUploadComplete?: (files: UploadedFile[]) => void
  initialFiles?: File[]
}

interface UploadedFile {
  id: string
  name: string
  mimeType: string
  sizeBytes: number
}

// Helper to get file icon
function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return ImageIcon
  if (mimeType.startsWith('video/')) return Film
  if (mimeType.startsWith('audio/')) return Music
  if (mimeType === 'application/pdf') return FileText
  if (mimeType.includes('zip') || mimeType.includes('archive')) return Archive
  return File
}

// Format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`
}

// Format speed
function formatSpeed(bytesPerSecond: number): string {
  if (bytesPerSecond === 0) return '0 B/s'
  const units = ['B/s', 'KB/s', 'MB/s', 'GB/s']
  const k = 1024
  const i = Math.floor(Math.log(bytesPerSecond) / Math.log(k))
  return `${parseFloat((bytesPerSecond / Math.pow(k, i)).toFixed(1))} ${units[i]}`
}

// Generate thumbnail for image files
function generateThumbnail(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    if (!file.type.startsWith('image/')) {
      resolve(null)
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      resolve(e.target?.result as string || null)
    }
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })
}

export function FileUploadDialog({
  open,
  onOpenChange,
  vaultId,
  folderId,
  onUploadComplete,
  initialFiles,
}: FileUploadDialogProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [totalSpeed, setTotalSpeed] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const initialFilesProcessedRef = useRef(false)

  // Close on ESC key (only if not uploading)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open && !isUploading) {
        onOpenChange(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, isUploading, onOpenChange])

  // Handle initial files when dialog opens
  useEffect(() => {
    if (open && initialFiles && initialFiles.length > 0 && !initialFilesProcessedRef.current) {
      initialFilesProcessedRef.current = true
      addFilesFromArray(initialFiles)
    }

    // Reset the ref when dialog closes
    if (!open) {
      initialFilesProcessedRef.current = false
    }
  }, [open, initialFiles])

  // Helper to add files from File[] array
  const addFilesFromArray = async (newFiles: File[]) => {
    const filesToAdd: UploadFile[] = []

    for (const file of newFiles) {
      const thumbnail = await generateThumbnail(file)
      filesToAdd.push({
        id: generateId(),
        file,
        name: file.name,
        originalName: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        status: 'pending',
        progress: 0,
        thumbnail: thumbnail || undefined,
        isEditing: false,
      })
    }

    setFiles(prev => [...prev, ...filesToAdd])
  }

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substring(2, 9)

  // Add files to upload queue
  const addFiles = useCallback(async (newFiles: FileList | File[]) => {
    const filesToAdd: UploadFile[] = []

    for (const file of Array.from(newFiles)) {
      const thumbnail = await generateThumbnail(file)
      filesToAdd.push({
        id: generateId(),
        file,
        name: file.name,
        originalName: file.name,
        size: file.size,
        type: file.type || 'application/octet-stream',
        status: 'pending',
        progress: 0,
        thumbnail: thumbnail || undefined,
        isEditing: false,
      })
    }

    setFiles(prev => [...prev, ...filesToAdd])
  }, [])

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files)
    }
    e.target.value = ''
  }

  // Handle drag events
  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.currentTarget === e.target) {
      setIsDragging(false)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles && droppedFiles.length > 0) {
      addFiles(droppedFiles)
    }
  }

  // Remove file from queue
  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  // Toggle edit mode for file name
  const toggleEditName = (id: string) => {
    setFiles(prev => prev.map(f =>
      f.id === id ? { ...f, isEditing: !f.isEditing } : f
    ))
  }

  // Update file name
  const updateFileName = (id: string, newName: string) => {
    setFiles(prev => prev.map(f =>
      f.id === id ? { ...f, name: newName } : f
    ))
  }

  // Handle duplicate - rename file
  const handleDuplicateRename = (id: string) => {
    const file = files.find(f => f.id === id)
    if (!file) return

    const ext = file.name.includes('.') ? '.' + file.name.split('.').pop() : ''
    const baseName = file.name.replace(ext, '')
    const newName = `${baseName}_copy${ext}`

    setFiles(prev => prev.map(f =>
      f.id === id ? { ...f, name: newName, status: 'pending' } : f
    ))
  }

  // Upload single file with progress tracking
  const uploadFile = async (uploadFile: UploadFile): Promise<UploadedFile | null> => {
    const formData = new FormData()

    // Append file with possibly renamed name (third argument sets filename)
    formData.append('file', uploadFile.file, uploadFile.name)
    formData.append('vaultId', vaultId)
    if (folderId) {
      formData.append('folderId', folderId)
    }

    const startTime = Date.now()

    try {
      setFiles(prev =>
        prev.map(f =>
          f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 0, startTime } : f
        )
      )

      const response = await fetch('/api/file-vault/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        // Try to parse as JSON, but handle text responses gracefully
        let errorMessage = 'Üleslaadimise viga'
        let existingFile = null

        const contentType = response.headers.get('content-type') || ''
        if (contentType.includes('application/json')) {
          try {
            const error = await response.json()
            errorMessage = error.error || errorMessage
            existingFile = error.existingFile
          } catch {
            // JSON parse failed, use default message
          }
        } else {
          // Not JSON response - likely server error like "Request Entity Too Large"
          const text = await response.text()
          if (text.toLowerCase().includes('too large') || response.status === 413) {
            errorMessage = 'Fail on liiga suur'
          } else if (text.length < 200) {
            errorMessage = text || `Viga: ${response.status}`
          } else {
            errorMessage = `Serveri viga: ${response.status}`
          }
        }

        // Check for duplicate error (status 409 or error message contains duplicate)
        if (response.status === 409 || errorMessage.toLowerCase().includes('duplikaat') || errorMessage.toLowerCase().includes('duplicate')) {
          const existingName = existingFile?.name || 'olemasolev fail'
          setFiles(prev =>
            prev.map(f =>
              f.id === uploadFile.id
                ? { ...f, status: 'duplicate', error: `Sama sisuga fail "${existingName}" on juba olemas` }
                : f
            )
          )
          return null
        }

        throw new Error(errorMessage)
      }

      const result = await response.json()
      const endTime = Date.now()
      const duration = (endTime - startTime) / 1000
      const speed = uploadFile.size / duration

      setFiles(prev =>
        prev.map(f =>
          f.id === uploadFile.id ? { ...f, status: 'success', progress: 100, uploadSpeed: speed } : f
        )
      )

      return {
        id: result.id,
        name: result.name,
        mimeType: result.mimeType,
        sizeBytes: result.sizeBytes,
      }
    } catch (error) {
      setFiles(prev =>
        prev.map(f =>
          f.id === uploadFile.id
            ? { ...f, status: 'error', error: (error as Error).message }
            : f
        )
      )
      return null
    }
  }

  // Upload all files with concurrent queue (max 3 at a time, start next immediately when one finishes)
  const handleUpload = async () => {
    if (files.length === 0) return

    setIsUploading(true)
    const pendingFiles = files.filter(f => f.status === 'pending')
    const uploadedFiles: UploadedFile[] = []
    const maxConcurrent = 3

    // Create a queue-based upload system
    let currentIndex = 0
    const uploadNext = async (): Promise<void> => {
      if (currentIndex >= pendingFiles.length) return

      const fileToUpload = pendingFiles[currentIndex]
      currentIndex++

      const result = await uploadFile(fileToUpload)
      if (result) {
        uploadedFiles.push(result)
      }

      // Start next file immediately
      await uploadNext()
    }

    // Start initial concurrent uploads
    const initialUploads = []
    for (let i = 0; i < Math.min(maxConcurrent, pendingFiles.length); i++) {
      initialUploads.push(uploadNext())
    }

    // Wait for all uploads to complete
    await Promise.all(initialUploads)

    setIsUploading(false)

    if (uploadedFiles.length > 0 && onUploadComplete) {
      onUploadComplete(uploadedFiles)
    }
  }

  // Close dialog
  const handleClose = () => {
    if (!isUploading) {
      setFiles([])
      onOpenChange(false)
    }
  }

  // Clear completed files
  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'success'))
  }

  // Stats
  const pendingCount = files.filter(f => f.status === 'pending').length
  const uploadingCount = files.filter(f => f.status === 'uploading').length
  const successCount = files.filter(f => f.status === 'success').length
  const errorCount = files.filter(f => f.status === 'error').length
  const duplicateCount = files.filter(f => f.status === 'duplicate').length
  const totalSize = files.reduce((sum, f) => sum + f.size, 0)

  // Use CSS visibility instead of unmounting for faster open/close
  return (
    <div
      className={`fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 transition-opacity duration-150 ${
        open ? 'opacity-100 visible' : 'opacity-0 invisible pointer-events-none'
      }`}
      aria-hidden={!open}
    >
      <Card className="w-full max-w-2xl bg-white rounded-xl shadow-xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#279989]/10 flex items-center justify-center">
              <Upload className="w-5 h-5 text-[#279989]" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Laadi failid</h2>
              <p className="text-sm text-slate-500">
                {files.length > 0
                  ? `${files.length} faili (${formatFileSize(totalSize)})`
                  : 'Lohista failid siia või vali arvutist'
                }
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drop Zone */}
        <div className="p-4 flex-1 overflow-auto">
          <div
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-6 text-center cursor-pointer
              transition-colors duration-200
              ${
                isDragging
                  ? 'border-[#279989] bg-[#279989]/5'
                  : 'border-slate-300 hover:border-[#279989] hover:bg-slate-50'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div
              className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${
                isDragging ? 'bg-[#279989]/20' : 'bg-slate-100'
              }`}
            >
              <FolderOpen
                className={`w-6 h-6 ${isDragging ? 'text-[#279989]' : 'text-slate-400'}`}
              />
            </div>
            <p className="text-slate-600 text-sm">
              {isDragging ? (
                <span className="text-[#279989] font-medium">Lase lahti</span>
              ) : (
                <>
                  Lohista failid siia või{' '}
                  <span className="text-[#279989] font-medium">vali failid</span>
                </>
              )}
            </p>
          </div>

          {/* File List - Compact */}
          {files.length > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-2">
                <span>
                  {successCount}/{files.length} laaditud
                  {uploadingCount > 0 && ` • ${uploadingCount} laadimisel`}
                  {errorCount > 0 && ` • ${errorCount} viga`}
                  {duplicateCount > 0 && ` • ${duplicateCount} duplikaat`}
                </span>
                {successCount > 0 && (
                  <button onClick={clearCompleted} className="text-[#279989] hover:underline">
                    Eemalda laaditud
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-auto space-y-1">
                {files.map(file => {
                  const FileIcon = getFileIcon(file.type)
                  const isImage = file.type.startsWith('image/')

                  return (
                    <div
                      key={file.id}
                      className={`flex items-center gap-2 p-2 rounded-lg text-sm ${
                        file.status === 'error' ? 'bg-red-50' :
                        file.status === 'duplicate' ? 'bg-amber-50' :
                        file.status === 'success' ? 'bg-green-50' :
                        file.status === 'uploading' ? 'bg-blue-50' :
                        'bg-slate-50'
                      }`}
                    >
                      {/* Thumbnail or Icon */}
                      <div className="w-10 h-10 rounded flex-shrink-0 overflow-hidden bg-slate-200 flex items-center justify-center">
                        {isImage && file.thumbnail ? (
                          <img src={file.thumbnail} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <FileIcon className={`w-5 h-5 ${
                            file.status === 'error' ? 'text-red-500' :
                            file.status === 'duplicate' ? 'text-amber-500' :
                            file.status === 'success' ? 'text-green-500' :
                            'text-slate-400'
                          }`} />
                        )}
                      </div>

                      {/* File info */}
                      <div className="flex-1 min-w-0">
                        {file.isEditing ? (
                          <Input
                            value={file.name}
                            onChange={(e) => updateFileName(file.id, e.target.value)}
                            onBlur={() => toggleEditName(file.id)}
                            onKeyDown={(e) => e.key === 'Enter' && toggleEditName(file.id)}
                            className="h-6 text-sm py-0"
                            autoFocus
                          />
                        ) : (
                          <p className="text-slate-900 truncate text-sm">{file.name}</p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>{formatFileSize(file.size)}</span>
                          {file.status === 'uploading' && <span className="text-blue-600">Laadimine...</span>}
                          {file.status === 'success' && file.uploadSpeed && (
                            <span className="text-green-600">{formatSpeed(file.uploadSpeed)}</span>
                          )}
                          {file.status === 'error' && <span className="text-red-600">{file.error}</span>}
                          {file.status === 'duplicate' && <span className="text-amber-600">Duplikaat</span>}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {file.status === 'uploading' && (
                          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                        )}
                        {file.status === 'success' && (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        )}
                        {file.status === 'error' && (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        {file.status === 'duplicate' && (
                          <>
                            <button
                              onClick={() => handleDuplicateRename(file.id)}
                              className="px-2 py-1 rounded bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-medium flex items-center gap-1"
                              title="Nimeta ümber ja proovi uuesti"
                            >
                              <Copy className="w-3 h-3" />
                              Muuda nime
                            </button>
                            <button
                              onClick={() => toggleEditName(file.id)}
                              className="p-1 rounded hover:bg-amber-100 text-amber-600"
                              title="Muuda nime käsitsi"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                        {file.status === 'pending' && (
                          <button
                            onClick={() => toggleEditName(file.id)}
                            className="p-1 rounded hover:bg-slate-200 text-slate-400"
                            title="Muuda nime"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {(file.status === 'pending' || file.status === 'error' || file.status === 'duplicate') && (
                          <button
                            onClick={() => removeFile(file.id)}
                            className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-red-500"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            {successCount > 0 && pendingCount === 0 ? 'Sulge' : 'Tühista'}
          </Button>
          <Button
            onClick={handleUpload}
            disabled={pendingCount === 0 || isUploading}
            className="bg-[#279989] hover:bg-[#1e7a6d] text-white"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {uploadingCount}/{pendingCount + uploadingCount}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Laadi {pendingCount} faili
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default FileUploadDialog
