'use client'

import { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from 'react'
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  FolderPlus,
  MoreVertical,
  Edit3,
  Trash2,
  Plus,
  Loader2,
  Files,
} from 'lucide-react'

interface FolderItem {
  id: string
  name: string
  parentId: string | null
  path: string
  children?: FolderItem[]
  fileCount?: number
  newFileCount?: number
}

interface FileTreeProps {
  vaultId: string
  currentFolderId: string | null
  onFolderSelect: (folder: FolderItem | null) => void
  onCreateFolder?: (parentId: string | null) => void
  onRenameFolder?: (folder: FolderItem) => void
  onDeleteFolder?: (folder: FolderItem) => void
  canManageFolders?: boolean
}

export interface FileTreeRef {
  refresh: () => Promise<void>
}

export const FileTree = forwardRef<FileTreeRef, FileTreeProps>(function FileTree({
  vaultId,
  currentFolderId,
  onFolderSelect,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  canManageFolders = true,
}, ref) {
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [activeMenu, setActiveMenu] = useState<string | null>(null)
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 })
  const [hoveredFolder, setHoveredFolder] = useState<string | null>(null)
  const [recentFilesHover, setRecentFilesHover] = useState<{
    folderId: string
    files: Array<{ id: string; name: string; createdAt: string }>
  } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fetch all folders with file counts
  const fetchFolders = useCallback(async () => {
    if (!vaultId) return

    try {
      setIsLoading(true)
      const response = await fetch(
        `/api/file-vault/folders?vaultId=${vaultId}&flat=true&includeStats=true`
      )
      if (response.ok) {
        const data = await response.json()
        // Build tree structure from flat list
        const folderMap = new Map<string, FolderItem>()
        const rootFolders: FolderItem[] = []

        // First pass: create all folder items
        for (const folder of data.folders || []) {
          folderMap.set(folder.id, {
            id: folder.id,
            name: folder.name,
            parentId: folder.parent_id || folder.parentId || null,
            path: folder.path,
            children: [],
            fileCount: folder.file_count || folder.fileCount || 0,
            newFileCount: folder.new_file_count || folder.newFileCount || 0,
          })
        }

        // Second pass: build tree
        for (const folder of folderMap.values()) {
          if (folder.parentId && folderMap.has(folder.parentId)) {
            folderMap.get(folder.parentId)!.children!.push(folder)
          } else if (!folder.parentId) {
            rootFolders.push(folder)
          }
        }

        // Sort folders alphabetically
        const sortFolders = (items: FolderItem[]) => {
          items.sort((a, b) => a.name.localeCompare(b.name, 'et'))
          for (const item of items) {
            if (item.children?.length) {
              sortFolders(item.children)
            }
          }
        }
        sortFolders(rootFolders)

        setFolders(rootFolders)
      }
    } catch (error) {
      console.error('Error fetching folders:', error)
    } finally {
      setIsLoading(false)
    }
  }, [vaultId])

  // Expose refresh method via ref
  useImperativeHandle(ref, () => ({
    refresh: fetchFolders,
  }))

  useEffect(() => {
    fetchFolders()
  }, [fetchFolders])

  // Auto-expand to current folder
  useEffect(() => {
    if (currentFolderId) {
      setExpandedFolders((prev) => new Set([...prev, currentFolderId]))
    }
  }, [currentFolderId])

  // Close menu on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const toggleExpand = (folderId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpandedFolders((prev) => {
      const next = new Set(prev)
      if (next.has(folderId)) {
        next.delete(folderId)
      } else {
        next.add(folderId)
      }
      return next
    })
  }

  const handleMenuClick = (e: React.MouseEvent, folderId: string) => {
    e.preventDefault()
    e.stopPropagation()

    const rect = (e.target as HTMLElement).getBoundingClientRect()
    setMenuPosition({ x: rect.right + 4, y: rect.top })
    setActiveMenu(activeMenu === folderId ? null : folderId)
  }

  const handleDeleteFolder = async (folder: FolderItem) => {
    if (!confirm(`Kas oled kindel, et soovid kausta "${folder.name}" kustutada?`)) {
      return
    }

    try {
      const response = await fetch(`/api/file-vault/folders/${folder.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await fetchFolders()
        if (currentFolderId === folder.id) {
          onFolderSelect(null)
        }
      } else {
        const data = await response.json()
        alert(data.error || 'Kausta kustutamine ebaõnnestus')
      }
    } catch (error) {
      console.error('Error deleting folder:', error)
      alert('Kausta kustutamine ebaõnnestus')
    }

    setActiveMenu(null)
    if (onDeleteFolder) onDeleteFolder(folder)
  }

  // Fetch recent files for hover tooltip
  const fetchRecentFiles = useCallback(async (folderId: string) => {
    try {
      const response = await fetch(
        `/api/file-vault/files?vaultId=${vaultId}&folderId=${folderId}&limit=5&sort=createdAt&order=desc`
      )
      if (response.ok) {
        const data = await response.json()
        setRecentFilesHover({
          folderId,
          files: (data.files || []).slice(0, 5).map((f: { id: string; name: string; created_at?: string; createdAt?: string }) => ({
            id: f.id,
            name: f.name,
            createdAt: f.created_at || f.createdAt,
          })),
        })
      }
    } catch (error) {
      console.error('Error fetching recent files:', error)
    }
  }, [vaultId])

  const renderFolder = (folder: FolderItem, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id)
    const isSelected = currentFolderId === folder.id
    const hasChildren = folder.children && folder.children.length > 0
    const isHovered = hoveredFolder === folder.id
    const fileCount = folder.fileCount || 0
    const newFileCount = folder.newFileCount || 0

    return (
      <div key={folder.id}>
        <div
          className={`
            flex items-center gap-1 px-2 py-1.5 cursor-pointer rounded-md
            transition-colors text-sm group relative
            ${isSelected
              ? 'bg-[#279989]/10 text-[#279989]'
              : 'hover:bg-slate-100 text-slate-700'
            }
          `}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => onFolderSelect(folder)}
          onMouseEnter={() => setHoveredFolder(folder.id)}
          onMouseLeave={() => {
            setHoveredFolder(null)
            setRecentFilesHover(null)
          }}
        >
          {/* Expand/collapse button */}
          <button
            onClick={(e) => toggleExpand(folder.id, e)}
            className={`w-4 h-4 flex items-center justify-center flex-shrink-0 ${
              hasChildren ? '' : 'invisible'
            }`}
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>

          {/* Folder icon */}
          {isExpanded ? (
            <FolderOpen className="w-4 h-4 text-amber-500 flex-shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-amber-500 flex-shrink-0" />
          )}

          {/* Folder name */}
          <span className="truncate flex-1">{folder.name}</span>

          {/* File count and new indicator */}
          {fileCount > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <span className="text-slate-400">({fileCount}</span>
              {newFileCount > 0 && (
                <span
                  className="text-[#279989] font-medium cursor-help relative"
                  onMouseEnter={() => fetchRecentFiles(folder.id)}
                >
                  | +{newFileCount}
                  {/* Hover tooltip for recent files */}
                  {recentFilesHover?.folderId === folder.id && recentFilesHover.files.length > 0 && (
                    <div
                      className="absolute left-0 top-full mt-1 z-50 bg-white border border-slate-200 rounded-lg shadow-lg p-2 min-w-[200px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <p className="text-[10px] text-slate-500 font-medium uppercase mb-1">
                        Viimati lisatud
                      </p>
                      {recentFilesHover.files.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center gap-2 py-1 text-xs text-slate-600 hover:text-slate-900"
                        >
                          <Files className="w-3 h-3 text-slate-400" />
                          <span className="truncate">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </span>
              )}
              <span className="text-slate-400">)</span>
            </div>
          )}

          {/* Three dots menu */}
          {canManageFolders && isHovered && (
            <button
              onClick={(e) => handleMenuClick(e, folder.id)}
              className="p-0.5 rounded hover:bg-slate-200 text-slate-400 hover:text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Children */}
        {isExpanded && hasChildren && (
          <div>
            {folder.children!.map((child) => renderFolder(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col bg-white border-r border-slate-200">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200">
        <h3 className="text-sm font-medium text-slate-700">Kaustad</h3>
        {canManageFolders && onCreateFolder && (
          <button
            onClick={() => onCreateFolder(null)}
            className="p-1 rounded hover:bg-slate-100 text-slate-500"
            title="Uus kaust"
          >
            <FolderPlus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-[#279989]" />
          </div>
        ) : (
          <>
            {/* Root folder */}
            <div
              className={`
                flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-md
                transition-colors text-sm
                ${currentFolderId === null
                  ? 'bg-[#279989]/10 text-[#279989]'
                  : 'hover:bg-slate-100 text-slate-700'
                }
              `}
              onClick={() => onFolderSelect(null)}
            >
              <Folder className="w-4 h-4 text-slate-400" />
              <span className="font-medium">Kõik failid</span>
            </div>

            {/* Folder tree */}
            <div className="mt-1">
              {folders.map((folder) => renderFolder(folder))}
            </div>

            {folders.length === 0 && (
              <p className="text-xs text-slate-400 text-center mt-4">
                Kaustu pole
              </p>
            )}
          </>
        )}
      </div>

      {/* Dropdown Menu (Portal-like positioning) */}
      {activeMenu && (
        <div
          ref={menuRef}
          className="fixed bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 min-w-[160px]"
          style={{ left: menuPosition.x, top: menuPosition.y }}
        >
          {onCreateFolder && (
            <button
              onClick={() => {
                onCreateFolder(activeMenu)
                setActiveMenu(null)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              <FolderPlus className="w-4 h-4" />
              Uus alamkaust
            </button>
          )}
          {onRenameFolder && (
            <button
              onClick={() => {
                const folder = findFolderById(folders, activeMenu)
                if (folder) onRenameFolder(folder)
                setActiveMenu(null)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              <Edit3 className="w-4 h-4" />
              Nimeta ümber
            </button>
          )}
          <button
            onClick={() => {
              const folder = findFolderById(folders, activeMenu)
              if (folder) handleDeleteFolder(folder)
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
            Kustuta
          </button>
        </div>
      )}
    </div>
  )
})

// Helper to find folder by ID recursively
function findFolderById(folders: FolderItem[], id: string): FolderItem | null {
  for (const folder of folders) {
    if (folder.id === id) return folder
    if (folder.children) {
      const found = findFolderById(folder.children, id)
      if (found) return found
    }
  }
  return null
}

export default FileTree
