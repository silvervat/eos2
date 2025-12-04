'use client'

import { useEffect, useRef } from 'react'
import {
  Eye,
  Download,
  Share2,
  Edit3,
  Star,
  StarOff,
  Trash2,
  Copy,
  Move,
  FolderInput,
  Info,
  History,
} from 'lucide-react'

export interface ContextMenuItem {
  id: string
  label: string
  icon: React.ReactNode
  onClick: () => void
  danger?: boolean
  disabled?: boolean
  divider?: boolean
}

interface ContextMenuProps {
  x: number
  y: number
  items: ContextMenuItem[]
  onClose: () => void
}

export function ContextMenu({ x, y, items, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose()
      }
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    const handleScroll = () => {
      onClose()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    document.addEventListener('scroll', handleScroll, true)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
      document.removeEventListener('scroll', handleScroll, true)
    }
  }, [onClose])

  // Adjust position to keep menu in viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect()
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight

      let adjustedX = x
      let adjustedY = y

      if (x + rect.width > viewportWidth) {
        adjustedX = viewportWidth - rect.width - 8
      }

      if (y + rect.height > viewportHeight) {
        adjustedY = viewportHeight - rect.height - 8
      }

      menuRef.current.style.left = `${adjustedX}px`
      menuRef.current.style.top = `${adjustedY}px`
    }
  }, [x, y])

  return (
    <div
      ref={menuRef}
      className="fixed z-[100] min-w-[180px] bg-white rounded-lg shadow-xl border border-slate-200 py-1 animate-in fade-in zoom-in-95 duration-100"
      style={{ left: x, top: y }}
    >
      {items.map((item, index) => (
        <div key={item.id}>
          {item.divider && index > 0 && (
            <div className="h-px bg-slate-200 my-1" />
          )}
          <button
            onClick={() => {
              if (!item.disabled) {
                item.onClick()
                onClose()
              }
            }}
            disabled={item.disabled}
            className={`
              w-full flex items-center gap-3 px-3 py-2 text-sm text-left
              transition-colors
              ${item.disabled
                ? 'text-slate-400 cursor-not-allowed'
                : item.danger
                  ? 'text-red-600 hover:bg-red-50'
                  : 'text-slate-700 hover:bg-slate-100'
              }
            `}
          >
            <span className={item.disabled ? 'text-slate-400' : item.danger ? 'text-red-500' : 'text-slate-500'}>
              {item.icon}
            </span>
            {item.label}
          </button>
        </div>
      ))}
    </div>
  )
}

// Helper to create common file context menu items
export function getFileContextMenuItems(
  file: { id: string; name: string; isStarred?: boolean },
  handlers: {
    onPreview?: () => void
    onDownload?: () => void
    onShare?: () => void
    onRename?: () => void
    onStar?: () => void
    onMove?: () => void
    onCopy?: () => void
    onInfo?: () => void
    onVersions?: () => void
    onDelete?: () => void
  }
): ContextMenuItem[] {
  const items: ContextMenuItem[] = []

  if (handlers.onPreview) {
    items.push({
      id: 'preview',
      label: 'Eelvaade',
      icon: <Eye className="w-4 h-4" />,
      onClick: handlers.onPreview,
    })
  }

  if (handlers.onDownload) {
    items.push({
      id: 'download',
      label: 'Laadi alla',
      icon: <Download className="w-4 h-4" />,
      onClick: handlers.onDownload,
    })
  }

  if (handlers.onShare) {
    items.push({
      id: 'share',
      label: 'Jaga',
      icon: <Share2 className="w-4 h-4" />,
      onClick: handlers.onShare,
      divider: true,
    })
  }

  if (handlers.onRename) {
    items.push({
      id: 'rename',
      label: 'Nimeta ümber',
      icon: <Edit3 className="w-4 h-4" />,
      onClick: handlers.onRename,
    })
  }

  if (handlers.onStar) {
    items.push({
      id: 'star',
      label: file.isStarred ? 'Eemalda täht' : 'Lisa täht',
      icon: file.isStarred ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />,
      onClick: handlers.onStar,
    })
  }

  if (handlers.onMove) {
    items.push({
      id: 'move',
      label: 'Teisalda',
      icon: <FolderInput className="w-4 h-4" />,
      onClick: handlers.onMove,
      divider: true,
    })
  }

  if (handlers.onCopy) {
    items.push({
      id: 'copy',
      label: 'Kopeeri',
      icon: <Copy className="w-4 h-4" />,
      onClick: handlers.onCopy,
    })
  }

  if (handlers.onInfo) {
    items.push({
      id: 'info',
      label: 'Faili info',
      icon: <Info className="w-4 h-4" />,
      onClick: handlers.onInfo,
      divider: true,
    })
  }

  if (handlers.onVersions) {
    items.push({
      id: 'versions',
      label: 'Versioonid',
      icon: <History className="w-4 h-4" />,
      onClick: handlers.onVersions,
    })
  }

  if (handlers.onDelete) {
    items.push({
      id: 'delete',
      label: 'Kustuta',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: handlers.onDelete,
      danger: true,
      divider: true,
    })
  }

  return items
}

// Helper to create folder context menu items
export function getFolderContextMenuItems(
  folder: { id: string; name: string },
  handlers: {
    onOpen?: () => void
    onRename?: () => void
    onMove?: () => void
    onShare?: () => void
    onDelete?: () => void
  }
): ContextMenuItem[] {
  const items: ContextMenuItem[] = []

  if (handlers.onOpen) {
    items.push({
      id: 'open',
      label: 'Ava',
      icon: <FolderInput className="w-4 h-4" />,
      onClick: handlers.onOpen,
    })
  }

  if (handlers.onRename) {
    items.push({
      id: 'rename',
      label: 'Nimeta ümber',
      icon: <Edit3 className="w-4 h-4" />,
      onClick: handlers.onRename,
    })
  }

  if (handlers.onShare) {
    items.push({
      id: 'share',
      label: 'Jaga',
      icon: <Share2 className="w-4 h-4" />,
      onClick: handlers.onShare,
      divider: true,
    })
  }

  if (handlers.onMove) {
    items.push({
      id: 'move',
      label: 'Teisalda',
      icon: <Move className="w-4 h-4" />,
      onClick: handlers.onMove,
    })
  }

  if (handlers.onDelete) {
    items.push({
      id: 'delete',
      label: 'Kustuta',
      icon: <Trash2 className="w-4 h-4" />,
      onClick: handlers.onDelete,
      danger: true,
      divider: true,
    })
  }

  return items
}

export default ContextMenu
