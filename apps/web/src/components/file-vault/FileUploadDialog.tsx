'use client'

import { useState, useCallback, useRef } from 'react'
import { Button, Card } from '@rivest/ui'
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
} from 'lucide-react'

// Types
interface UploadFile {
  id: string
  file: File
  name: string
  size: number
  type: string
  status: 'pending' | 'uploading' | 'success' | 'error'
  progress: number
  error?: string
}

interface FileUploadDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vaultId: string
  folderId?: string | null
  onUploadComplete?: (files: UploadedFile[]) => void
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

export function FileUploadDialog({
  open,
  onOpenChange,
  vaultId,
  folderId,
  onUploadComplete,
}: FileUploadDialogProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Generate unique ID
  const generateId = () => Math.random().toString(36).substring(2, 9)

  // Add files to upload queue
  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const filesToAdd: UploadFile[] = Array.from(newFiles).map(file => ({
      id: generateId(),
      file,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      status: 'pending',
      progress: 0,
    }))
    setFiles(prev => [...prev, ...filesToAdd])
  }, [])

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFiles(e.target.files)
    }
    // Reset input so same file can be selected again
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
    // Only set dragging to false if we're leaving the drop zone
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

  // Upload single file
  const uploadFile = async (uploadFile: UploadFile): Promise<UploadedFile | null> => {
    const formData = new FormData()
    formData.append('file', uploadFile.file)
    formData.append('vaultId', vaultId)
    if (folderId) {
      formData.append('folderId', folderId)
    }

    try {
      // Update status to uploading
      setFiles(prev =>
        prev.map(f =>
          f.id === uploadFile.id ? { ...f, status: 'uploading', progress: 0 } : f
        )
      )

      const response = await fetch('/api/file-vault/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()

      // Update status to success
      setFiles(prev =>
        prev.map(f =>
          f.id === uploadFile.id ? { ...f, status: 'success', progress: 100 } : f
        )
      )

      return {
        id: result.id,
        name: result.name,
        mimeType: result.mimeType,
        sizeBytes: result.sizeBytes,
      }
    } catch (error) {
      // Update status to error
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

  // Upload all files
  const handleUpload = async () => {
    if (files.length === 0) return

    setIsUploading(true)
    const pendingFiles = files.filter(f => f.status === 'pending')
    const uploadedFiles: UploadedFile[] = []

    // Upload files sequentially (could be parallel for better performance)
    for (const file of pendingFiles) {
      const result = await uploadFile(file)
      if (result) {
        uploadedFiles.push(result)
      }
    }

    setIsUploading(false)

    // Call completion callback
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

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
                Lohista failid siia või vali arvutist
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
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
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
              className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center ${
                isDragging ? 'bg-[#279989]/20' : 'bg-slate-100'
              }`}
            >
              <FolderOpen
                className={`w-8 h-8 ${isDragging ? 'text-[#279989]' : 'text-slate-400'}`}
              />
            </div>
            <p className="text-slate-600 mb-2">
              {isDragging ? (
                <span className="text-[#279989] font-medium">Lase lahti failide lisamiseks</span>
              ) : (
                <>
                  Lohista failid siia või{' '}
                  <span className="text-[#279989] font-medium">vali failid</span>
                </>
              )}
            </p>
            <p className="text-sm text-slate-400">Max 1GB faili kohta</p>
          </div>

          {/* File List */}
          {files.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm text-slate-500 mb-2">
                <span>
                  {files.length} faili ({successCount} laaditud
                  {errorCount > 0 && `, ${errorCount} ebaõnnestus`})
                </span>
                {successCount > 0 && (
                  <button
                    onClick={clearCompleted}
                    className="text-[#279989] hover:underline"
                  >
                    Eemalda laaditud
                  </button>
                )}
              </div>

              <div className="max-h-64 overflow-auto space-y-2">
                {files.map(file => {
                  const FileIcon = getFileIcon(file.type)
                  return (
                    <div
                      key={file.id}
                      className={`flex items-center gap-3 p-3 rounded-lg ${
                        file.status === 'error'
                          ? 'bg-red-50'
                          : file.status === 'success'
                          ? 'bg-green-50'
                          : 'bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                          file.status === 'error'
                            ? 'bg-red-100'
                            : file.status === 'success'
                            ? 'bg-green-100'
                            : 'bg-slate-200'
                        }`}
                      >
                        <FileIcon
                          className={`w-5 h-5 ${
                            file.status === 'error'
                              ? 'text-red-600'
                              : file.status === 'success'
                              ? 'text-green-600'
                              : 'text-slate-500'
                          }`}
                        />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {file.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span>{formatFileSize(file.size)}</span>
                          {file.status === 'uploading' && (
                            <span className="text-[#279989]">Laadimine...</span>
                          )}
                          {file.status === 'success' && (
                            <span className="text-green-600">Laaditud</span>
                          )}
                          {file.status === 'error' && (
                            <span className="text-red-600">{file.error || 'Viga'}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {file.status === 'uploading' && (
                          <Loader2 className="w-5 h-5 text-[#279989] animate-spin" />
                        )}
                        {file.status === 'success' && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                        {file.status === 'error' && (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                        {(file.status === 'pending' || file.status === 'error') && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              removeFile(file.id)
                            }}
                            className="p-1 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                          >
                            <X className="w-4 h-4" />
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
            {successCount > 0 && pendingCount === 0 ? 'Sulge' : 'Tuhista'}
          </Button>
          <Button
            onClick={handleUpload}
            disabled={pendingCount === 0 || isUploading}
            className="bg-[#279989] hover:bg-[#1e7a6d] text-white"
          >
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Laadimine...
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
