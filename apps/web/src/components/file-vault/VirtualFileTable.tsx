'use client'

import { useCallback, useRef, useEffect, useState, memo } from 'react'
import {
  File,
  Folder,
  Image,
  FileText,
  Film,
  Music,
  Archive,
  Download,
  Trash2,
  Share2,
  Eye,
  Info,
  ChevronRight,
} from 'lucide-react'

/**
 * Virtual scrolling file table component
 * Only renders visible rows for better performance with large file lists
 */

// Types
interface FileItem {
  id: string
  name: string
  path: string
  mimeType: string
  sizeBytes: number
  extension: string
  thumbnailSmall?: string
  thumbnailMedium?: string
  createdAt: string
  updatedAt: string
  tags: string[]
}

interface FolderItem {
  id: string
  name: string
  path: string
  color?: string
  icon?: string
  parentId?: string
  createdAt: string
}

type DisplayItem = (FolderItem & { type: 'folder' }) | (FileItem & { type: 'file' })

interface VirtualFileTableProps {
  items: DisplayItem[]
  selectedItems: string[]
  rowHeight: number
  rowDensity: 'compact' | 'normal'
  onSelect: (id: string) => void
  onNavigate: (folder: FolderItem) => void
  onPreview: (file: FileItem) => void
  onDownload: (file: FileItem) => void
  onShare: (file: FileItem) => void
  onShowInfo: (file: FileItem) => void
  onDelete: (id: string) => void
  onContextMenu: (e: React.MouseEvent, item: DisplayItem) => void
  onHoverPreview?: (file: FileItem | null, position: { x: number; y: number }) => void
}

// Helper functions
const getFileIcon = (mimeType: string, extension?: string) => {
  if (mimeType.startsWith('image/') || mimeType === 'image/heic' || mimeType === 'image/heif') return Image
  if (mimeType.startsWith('video/')) return Film
  if (mimeType.startsWith('audio/')) return Music

  const ext = extension?.toLowerCase()
  if (mimeType === 'application/pdf' || ext === 'pdf') return FileText
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') ||
      ext === 'xlsx' || ext === 'xls' || ext === 'csv') return FileText
  if (mimeType.includes('word') || mimeType.includes('document') ||
      ext === 'docx' || ext === 'doc') return FileText
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint') ||
      ext === 'pptx' || ext === 'ppt') return FileText
  if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('compressed') ||
      ext === 'zip' || ext === 'rar' || ext === '7z' || ext === 'tar' || ext === 'gz') return Archive

  return File
}

const getFileTypeLabel = (mimeType: string, extension?: string): string => {
  const ext = extension?.toLowerCase()
  if (mimeType.startsWith('image/')) return 'Pilt'
  if (mimeType.startsWith('video/')) return 'Video'
  if (mimeType.startsWith('audio/')) return 'Audio'
  if (mimeType === 'application/pdf' || ext === 'pdf') return 'PDF'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || ext === 'xlsx' || ext === 'xls') return 'Excel'
  if (ext === 'csv') return 'CSV'
  if (mimeType.includes('word') || ext === 'docx' || ext === 'doc') return 'Word'
  if (mimeType.includes('presentation') || ext === 'pptx' || ext === 'ppt') return 'PowerPoint'
  if (mimeType.includes('zip') || mimeType.includes('archive')) return 'Arhiiv'
  if (mimeType.startsWith('text/')) return 'Tekst'
  return ext?.toUpperCase() || 'Fail'
}

const getFileTypeColor = (mimeType: string, extension?: string): string => {
  const ext = extension?.toLowerCase()
  if (mimeType.startsWith('image/')) return 'bg-purple-100 text-purple-700'
  if (mimeType.startsWith('video/')) return 'bg-pink-100 text-pink-700'
  if (mimeType.startsWith('audio/')) return 'bg-orange-100 text-orange-700'
  if (mimeType === 'application/pdf' || ext === 'pdf') return 'bg-red-100 text-red-700'
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || ext === 'xlsx' || ext === 'xls' || ext === 'csv') return 'bg-green-100 text-green-700'
  if (mimeType.includes('word') || ext === 'docx' || ext === 'doc') return 'bg-blue-100 text-blue-700'
  if (mimeType.includes('presentation') || ext === 'pptx' || ext === 'ppt') return 'bg-amber-100 text-amber-700'
  if (mimeType.includes('zip') || mimeType.includes('archive')) return 'bg-slate-100 text-slate-700'
  return 'bg-slate-100 text-slate-600'
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${units[i]}`
}

const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return date.toLocaleDateString('et-EE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

// Memoized table row component
const TableRow = memo(function TableRow({
  item,
  isSelected,
  rowHeight,
  rowDensity,
  onSelect,
  onNavigate,
  onPreview,
  onDownload,
  onShare,
  onShowInfo,
  onDelete,
  onContextMenu,
  onHoverPreview,
}: {
  item: DisplayItem
  isSelected: boolean
  rowHeight: number
  rowDensity: 'compact' | 'normal'
  onSelect: (id: string) => void
  onNavigate: (folder: FolderItem) => void
  onPreview: (file: FileItem) => void
  onDownload: (file: FileItem) => void
  onShare: (file: FileItem) => void
  onShowInfo: (file: FileItem) => void
  onDelete: (id: string) => void
  onContextMenu: (e: React.MouseEvent, item: DisplayItem) => void
  onHoverPreview?: (file: FileItem | null, position: { x: number; y: number }) => void
}) {
  const isFolder = item.type === 'folder'
  const fileItem = item as FileItem
  const Icon = isFolder ? Folder : getFileIcon(fileItem.mimeType, fileItem.extension)

  const iconSize = rowDensity === 'compact' ? 'w-6 h-6' : 'w-8 h-8'
  const iconInnerSize = rowDensity === 'compact' ? 'w-3 h-3' : 'w-4 h-4'
  const textSize = rowDensity === 'compact' ? 'text-xs' : 'text-sm'

  const handleDoubleClick = useCallback(() => {
    if (isFolder) {
      onNavigate(item as FolderItem)
    } else {
      onPreview(fileItem)
    }
  }, [isFolder, item, fileItem, onNavigate, onPreview])

  const handleMouseEnter = useCallback((e: React.MouseEvent) => {
    if (!isFolder && fileItem.thumbnailMedium && onHoverPreview) {
      const rect = e.currentTarget.getBoundingClientRect()
      onHoverPreview(fileItem, { x: rect.right + 10, y: rect.top })
    }
  }, [isFolder, fileItem, onHoverPreview])

  const handleMouseLeave = useCallback(() => {
    if (onHoverPreview) {
      onHoverPreview(null, { x: 0, y: 0 })
    }
  }, [onHoverPreview])

  return (
    <tr
      className={`hover:bg-slate-50 transition-colors cursor-default ${isSelected ? 'bg-[#279989]/5' : ''}`}
      style={{ height: rowHeight }}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => onContextMenu(e, item)}
    >
      {/* Checkbox */}
      <td className="w-10 px-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(item.id)}
          className="w-4 h-4 rounded cursor-pointer"
        />
      </td>

      {/* Name with icon/thumbnail */}
      <td className="px-3">
        <div className="flex items-center gap-2">
          <div
            className={`${iconSize} rounded flex items-center justify-center flex-shrink-0 cursor-pointer ${isFolder ? 'bg-amber-100' : 'bg-slate-100'}`}
            onClick={handleDoubleClick}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
          >
            {!isFolder && fileItem.thumbnailSmall ? (
              <img
                src={fileItem.thumbnailSmall}
                alt=""
                className="w-full h-full object-cover rounded"
                loading="lazy"
              />
            ) : (
              <Icon
                className={iconInnerSize}
                style={{ color: isFolder ? '#f59e0b' : '#64748b' }}
              />
            )}
          </div>
          <span
            className={`${textSize} text-slate-900 truncate ${isFolder ? 'cursor-pointer hover:text-[#279989] font-medium' : ''}`}
            onClick={() => {
              if (isFolder) {
                onNavigate(item as FolderItem)
              }
            }}
          >
            {item.name}
          </span>
        </div>
      </td>

      {/* Type badge */}
      <td className="w-20 px-3 hidden sm:table-cell">
        {!isFolder ? (
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${getFileTypeColor(fileItem.mimeType, fileItem.extension)}`}>
            {getFileTypeLabel(fileItem.mimeType, fileItem.extension)}
          </span>
        ) : (
          <span className="text-xs text-slate-400">Kaust</span>
        )}
      </td>

      {/* Size */}
      <td className={`w-24 px-3 ${textSize} text-slate-500 hidden md:table-cell`}>
        {isFolder ? '-' : formatFileSize(fileItem.sizeBytes)}
      </td>

      {/* Date */}
      <td className={`w-28 px-3 ${textSize} text-slate-500 hidden lg:table-cell`}>
        {formatDate(item.createdAt)}
      </td>

      {/* Actions */}
      <td className="w-32 px-3">
        <div className="flex items-center justify-end gap-0.5">
          {!isFolder && (
            <>
              <button
                onClick={() => onPreview(fileItem)}
                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                title="Eelvaade"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDownload(fileItem)}
                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                title="Laadi alla"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => onShare(fileItem)}
                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                title="Jaga"
              >
                <Share2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => onShowInfo(fileItem)}
                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                title="Info"
              >
                <Info className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
                title="Kustuta"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
          {isFolder && (
            <button
              onClick={() => onNavigate(item as FolderItem)}
              className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              title="Ava kaust"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </td>
    </tr>
  )
})

// Buffer around visible area (in rows)
const BUFFER_SIZE = 5

export function VirtualFileTable({
  items,
  selectedItems,
  rowHeight,
  rowDensity,
  onSelect,
  onNavigate,
  onPreview,
  onDownload,
  onShare,
  onShowInfo,
  onDelete,
  onContextMenu,
  onHoverPreview,
}: VirtualFileTableProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [containerHeight, setContainerHeight] = useState(0)

  // Handle scroll
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop)
    }
  }, [])

  // Observe container size
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height)
      }
    })

    observer.observe(container)
    setContainerHeight(container.clientHeight)

    return () => observer.disconnect()
  }, [])

  // Calculate visible range
  const totalHeight = items.length * rowHeight
  const startIndex = Math.max(0, Math.floor(scrollTop / rowHeight) - BUFFER_SIZE)
  const visibleCount = Math.ceil(containerHeight / rowHeight) + BUFFER_SIZE * 2
  const endIndex = Math.min(items.length, startIndex + visibleCount)
  const visibleItems = items.slice(startIndex, endIndex)

  // Padding to maintain scroll position
  const topPadding = startIndex * rowHeight
  const bottomPadding = Math.max(0, totalHeight - endIndex * rowHeight)

  // If there are few items, don't virtualize
  if (items.length < 50) {
    return (
      <div className="overflow-auto max-h-[calc(100vh-300px)]">
        <table className="w-full">
          <thead className="sticky top-0 bg-white z-10">
            <tr className="border-b border-slate-200">
              <th className="w-10 px-3 py-2 text-left">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded cursor-pointer"
                  onChange={() => {
                    // Select/deselect all
                    if (selectedItems.length === items.length) {
                      items.forEach((item) => onSelect(item.id))
                    } else {
                      items.forEach((item) => {
                        if (!selectedItems.includes(item.id)) {
                          onSelect(item.id)
                        }
                      })
                    }
                  }}
                  checked={selectedItems.length === items.length && items.length > 0}
                />
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Nimi</th>
              <th className="w-20 px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase hidden sm:table-cell">Tüüp</th>
              <th className="w-24 px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase hidden md:table-cell">Suurus</th>
              <th className="w-28 px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase hidden lg:table-cell">Lisatud</th>
              <th className="w-32 px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">Tegevused</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {items.map((item) => (
              <TableRow
                key={item.id}
                item={item}
                isSelected={selectedItems.includes(item.id)}
                rowHeight={rowHeight}
                rowDensity={rowDensity}
                onSelect={onSelect}
                onNavigate={onNavigate}
                onPreview={onPreview}
                onDownload={onDownload}
                onShare={onShare}
                onShowInfo={onShowInfo}
                onDelete={onDelete}
                onContextMenu={onContextMenu}
                onHoverPreview={onHoverPreview}
              />
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="overflow-auto max-h-[calc(100vh-300px)]"
      onScroll={handleScroll}
    >
      <table className="w-full">
        <thead className="sticky top-0 bg-white z-10">
          <tr className="border-b border-slate-200">
            <th className="w-10 px-3 py-2 text-left">
              <input
                type="checkbox"
                className="w-4 h-4 rounded cursor-pointer"
                onChange={() => {
                  if (selectedItems.length === items.length) {
                    items.forEach((item) => onSelect(item.id))
                  } else {
                    items.forEach((item) => {
                      if (!selectedItems.includes(item.id)) {
                        onSelect(item.id)
                      }
                    })
                  }
                }}
                checked={selectedItems.length === items.length && items.length > 0}
              />
            </th>
            <th className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase">Nimi</th>
            <th className="w-20 px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase hidden sm:table-cell">Tüüp</th>
            <th className="w-24 px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase hidden md:table-cell">Suurus</th>
            <th className="w-28 px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase hidden lg:table-cell">Lisatud</th>
            <th className="w-32 px-3 py-2 text-right text-xs font-medium text-slate-500 uppercase">Tegevused</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {/* Top spacer */}
          {topPadding > 0 && (
            <tr style={{ height: topPadding }}>
              <td colSpan={6} />
            </tr>
          )}

          {/* Visible rows */}
          {visibleItems.map((item) => (
            <TableRow
              key={item.id}
              item={item}
              isSelected={selectedItems.includes(item.id)}
              rowHeight={rowHeight}
              rowDensity={rowDensity}
              onSelect={onSelect}
              onNavigate={onNavigate}
              onPreview={onPreview}
              onDownload={onDownload}
              onShare={onShare}
              onShowInfo={onShowInfo}
              onDelete={onDelete}
              onContextMenu={onContextMenu}
              onHoverPreview={onHoverPreview}
            />
          ))}

          {/* Bottom spacer */}
          {bottomPadding > 0 && (
            <tr style={{ height: bottomPadding }}>
              <td colSpan={6} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default VirtualFileTable
