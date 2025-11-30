'use client'

import { useState, useMemo } from 'react'
import {
  ChevronUp,
  ChevronDown,
  File,
  Folder,
  Image,
  FileText,
  Film,
  Music,
  Archive,
  Download,
  Share2,
  Trash2,
  Star,
  Eye,
  MoreHorizontal,
  Check,
  MessageSquare,
} from 'lucide-react'
import { Button, Card } from '@rivest/ui'

interface FileItem {
  id: string
  name: string
  path: string
  mimeType: string
  sizeBytes: number
  extension: string
  thumbnailSmall?: string
  isStarred?: boolean
  createdAt: string
  updatedAt: string
  tags: string[]
  commentCount?: number
}

interface FolderItem {
  id: string
  name: string
  path: string
  color?: string
  createdAt: string
  fileCount?: number
}

interface FileVaultTableViewProps {
  files: FileItem[]
  folders: FolderItem[]
  selectedItems: string[]
  onSelect: (ids: string[]) => void
  onFolderClick: (folder: FolderItem) => void
  onFileClick: (file: FileItem) => void
  onDownload: (file: FileItem) => void
  onShare: (file: FileItem) => void
  onDelete: (file: FileItem) => void
  onToggleStar: (file: FileItem) => void
  onPreview: (file: FileItem) => void
}

type SortField = 'name' | 'size' | 'type' | 'modified' | 'created'
type SortOrder = 'asc' | 'desc'

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '-'
  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('et-EE', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
  })
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return Image
  if (mimeType.startsWith('video/')) return Film
  if (mimeType.startsWith('audio/')) return Music
  if (mimeType === 'application/pdf') return FileText
  if (mimeType.includes('zip') || mimeType.includes('archive')) return Archive
  return File
}

const getTypeLabel = (mimeType: string): string => {
  if (mimeType.startsWith('image/')) return 'Pilt'
  if (mimeType.startsWith('video/')) return 'Video'
  if (mimeType.startsWith('audio/')) return 'Audio'
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType.includes('zip')) return 'Arhiiv'
  if (mimeType.includes('document') || mimeType.includes('word')) return 'Dokument'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'Tabel'
  return 'Fail'
}

export function FileVaultTableView({
  files,
  folders,
  selectedItems,
  onSelect,
  onFolderClick,
  onFileClick,
  onDownload,
  onShare,
  onDelete,
  onToggleStar,
  onPreview,
}: FileVaultTableViewProps) {
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
  }

  const sortedFolders = useMemo(() => {
    return [...folders].sort((a, b) => {
      const modifier = sortOrder === 'asc' ? 1 : -1
      if (sortField === 'name') {
        return a.name.localeCompare(b.name) * modifier
      }
      if (sortField === 'created') {
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * modifier
      }
      return 0
    })
  }, [folders, sortField, sortOrder])

  const sortedFiles = useMemo(() => {
    return [...files].sort((a, b) => {
      const modifier = sortOrder === 'asc' ? 1 : -1
      switch (sortField) {
        case 'name':
          return a.name.localeCompare(b.name) * modifier
        case 'size':
          return (a.sizeBytes - b.sizeBytes) * modifier
        case 'type':
          return a.mimeType.localeCompare(b.mimeType) * modifier
        case 'modified':
          return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * modifier
        case 'created':
          return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * modifier
        default:
          return 0
      }
    })
  }, [files, sortField, sortOrder])

  const allSelected = selectedItems.length === files.length && files.length > 0
  const someSelected = selectedItems.length > 0 && selectedItems.length < files.length

  const handleSelectAll = () => {
    if (allSelected) {
      onSelect([])
    } else {
      onSelect(files.map((f) => f.id))
    }
  }

  const handleSelectItem = (id: string) => {
    if (selectedItems.includes(id)) {
      onSelect(selectedItems.filter((i) => i !== id))
    } else {
      onSelect([...selectedItems, id])
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-3 h-3" />
    ) : (
      <ChevronDown className="w-3 h-3" />
    )
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="w-10 px-3 py-2">
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected
                  }}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded"
                />
              </th>
              <th className="w-10 px-1 py-2"></th>
              <th
                className="px-3 py-2 text-left font-medium text-slate-600 cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('name')}
              >
                <div className="flex items-center gap-1">
                  Nimi
                  <SortIcon field="name" />
                </div>
              </th>
              <th
                className="w-24 px-3 py-2 text-left font-medium text-slate-600 cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('type')}
              >
                <div className="flex items-center gap-1">
                  Tüüp
                  <SortIcon field="type" />
                </div>
              </th>
              <th
                className="w-24 px-3 py-2 text-right font-medium text-slate-600 cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('size')}
              >
                <div className="flex items-center justify-end gap-1">
                  Suurus
                  <SortIcon field="size" />
                </div>
              </th>
              <th
                className="w-28 px-3 py-2 text-left font-medium text-slate-600 cursor-pointer hover:bg-slate-100"
                onClick={() => handleSort('modified')}
              >
                <div className="flex items-center gap-1">
                  Muudetud
                  <SortIcon field="modified" />
                </div>
              </th>
              <th className="w-32 px-3 py-2 text-right font-medium text-slate-600">Tegevused</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {/* Folders */}
            {sortedFolders.map((folder) => (
              <tr
                key={`folder-${folder.id}`}
                className="hover:bg-slate-50 cursor-pointer"
                onMouseEnter={() => setHoveredRow(`folder-${folder.id}`)}
                onMouseLeave={() => setHoveredRow(null)}
                onClick={() => onFolderClick(folder)}
              >
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  <input type="checkbox" disabled className="w-4 h-4 rounded opacity-30" />
                </td>
                <td className="px-1 py-2">
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center"
                    style={{ backgroundColor: folder.color ? `${folder.color}20` : '#fef3c7' }}
                  >
                    <Folder className="w-4 h-4" style={{ color: folder.color || '#f59e0b' }} />
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-slate-900">{folder.name}</span>
                    {folder.fileCount !== undefined && (
                      <span className="text-xs text-slate-400">({folder.fileCount} faili)</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2 text-slate-500">Kaust</td>
                <td className="px-3 py-2 text-right text-slate-500">-</td>
                <td className="px-3 py-2 text-slate-500">{formatDate(folder.createdAt)}</td>
                <td className="px-3 py-2 text-right">
                  <div className={`flex justify-end gap-1 transition-opacity ${hoveredRow === `folder-${folder.id}` ? 'opacity-100' : 'opacity-0'}`}>
                    <Button variant="ghost" size="icon" className="w-7 h-7">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}

            {/* Files */}
            {sortedFiles.map((file) => {
              const FileIcon = getFileIcon(file.mimeType)
              const isSelected = selectedItems.includes(file.id)

              return (
                <tr
                  key={`file-${file.id}`}
                  className={`hover:bg-slate-50 cursor-pointer ${isSelected ? 'bg-blue-50' : ''}`}
                  onMouseEnter={() => setHoveredRow(`file-${file.id}`)}
                  onMouseLeave={() => setHoveredRow(null)}
                  onClick={() => onFileClick(file)}
                >
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectItem(file.id)}
                      className="w-4 h-4 rounded"
                    />
                  </td>
                  <td className="px-1 py-2">
                    {file.thumbnailSmall ? (
                      <img
                        src={file.thumbnailSmall}
                        alt=""
                        className="w-8 h-8 rounded object-cover"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center">
                        <FileIcon className="w-4 h-4 text-slate-500" />
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900 truncate max-w-xs">{file.name}</span>
                      {file.isStarred && <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />}
                      {file.commentCount && file.commentCount > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-slate-400">
                          <MessageSquare className="w-3 h-3" />
                          {file.commentCount}
                        </span>
                      )}
                    </div>
                    {file.tags.length > 0 && (
                      <div className="flex gap-1 mt-1">
                        {file.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded">
                            {tag}
                          </span>
                        ))}
                        {file.tags.length > 3 && (
                          <span className="text-xs text-slate-400">+{file.tags.length - 3}</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-slate-500">{getTypeLabel(file.mimeType)}</td>
                  <td className="px-3 py-2 text-right text-slate-500">{formatFileSize(file.sizeBytes)}</td>
                  <td className="px-3 py-2 text-slate-500">{formatDate(file.updatedAt)}</td>
                  <td className="px-3 py-2 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className={`flex justify-end gap-1 transition-opacity ${hoveredRow === `file-${file.id}` || isSelected ? 'opacity-100' : 'opacity-0'}`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7"
                        onClick={() => onPreview(file)}
                        title="Vaata"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7"
                        onClick={() => onToggleStar(file)}
                        title="Lemmik"
                      >
                        <Star className={`w-4 h-4 ${file.isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7"
                        onClick={() => onDownload(file)}
                        title="Laadi alla"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7"
                        onClick={() => onShare(file)}
                        title="Jaga"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-7 h-7 hover:text-red-600"
                        onClick={() => onDelete(file)}
                        title="Kustuta"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {sortedFolders.length === 0 && sortedFiles.length === 0 && (
          <div className="text-center py-12 text-slate-400">
            <File className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>Faile pole</p>
          </div>
        )}
      </div>

      {/* Footer with count */}
      <div className="px-4 py-2 bg-slate-50 border-t text-sm text-slate-500 flex justify-between">
        <span>
          {sortedFolders.length} kaust{sortedFolders.length !== 1 ? 'a' : ''}, {sortedFiles.length} fail{sortedFiles.length !== 1 ? 'i' : ''}
        </span>
        {selectedItems.length > 0 && (
          <span className="text-blue-600">{selectedItems.length} valitud</span>
        )}
      </div>
    </Card>
  )
}
