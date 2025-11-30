'use client'

import { useState, useRef } from 'react'
import { Upload, X, File, Loader2, Image as ImageIcon } from 'lucide-react'
import { tableFileHandler } from '@/lib/ultra-tables/file-handler'

interface FileUploadProps {
  tableId: string
  tableName: string
  recordId: string
  columnId: string
  columnName: string
  value: any[]
  onChange: (files: any[]) => void
  multiple?: boolean
  accept?: string
}

export function FileUpload({
  tableId,
  tableName,
  recordId,
  columnId,
  columnName,
  value = [],
  onChange,
  multiple = false,
  accept = '*/*',
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (fileList: FileList | null) => {
    const files = Array.from(fileList || [])
    if (files.length === 0) return

    setUploading(true)
    try {
      const config = {
        tableId,
        tableName,
        recordId,
        columnId,
        columnName,
      }

      const uploadedFiles = await tableFileHandler.uploadFiles(files, config)

      if (multiple) {
        onChange([...value, ...uploadedFiles])
      } else {
        onChange(uploadedFiles)
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Faili üleslaadimine ebaõnnestus')
    } finally {
      setUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  const handleRemove = async (fileId: string) => {
    try {
      await tableFileHandler.deleteFile(fileId)
      onChange(value.filter((f) => f.id !== fileId))
    } catch (error) {
      console.error('Delete error:', error)
      alert('Faili kustutamine ebaõnnestus')
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
  }

  const isImage = (type: string): boolean => {
    return type?.startsWith('image/')
  }

  return (
    <div className="space-y-3">
      {/* File List */}
      {value.length > 0 && (
        <div className="space-y-2">
          {value.map((file) => (
            <div
              key={file.id}
              className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200"
            >
              {isImage(file.type) ? (
                <div className="w-10 h-10 rounded overflow-hidden bg-slate-200 flex-shrink-0">
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 rounded bg-slate-200 flex items-center justify-center flex-shrink-0">
                  <File className="w-5 h-5 text-slate-500" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500">{formatFileSize(file.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(file.id)}
                className="p-1.5 rounded-md hover:bg-slate-200 transition-colors"
              >
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? 'border-[#279989] bg-[#279989]/5'
            : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={multiple}
          accept={accept}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading}
        />

        {uploading ? (
          <div className="flex flex-col items-center">
            <Loader2 className="w-8 h-8 text-[#279989] animate-spin mb-2" />
            <p className="text-sm text-slate-600">Laadin üles...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {accept?.includes('image') ? (
              <ImageIcon className="w-8 h-8 text-slate-400 mb-2" />
            ) : (
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
            )}
            <p className="text-sm text-slate-600">
              <span className="text-[#279989] font-medium">Vali fail</span> või lohista siia
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {accept === 'image/*' ? 'PNG, JPG, GIF kuni 10MB' : 'Kõik failitüübid kuni 50MB'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
