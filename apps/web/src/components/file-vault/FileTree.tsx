'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  Plus,
  MoreVertical,
  Edit3,
  Trash2,
  FolderPlus,
} from 'lucide-react'

interface FolderItem {
  id: string
  name: string
  parentId: string | null
  path: string
  children?: FolderItem[]
}

interface FileTreeProps {
  vaultId: string
  currentFolderId: string | null
  onFolderSelect: (folder: FolderItem | null) => void
  onCreateFolder?: (parentId: string | null) => void
  onRenameFolder?: (folder: FolderItem) => void
  onDeleteFolder?: (folder: FolderItem) => void
}

export function FileTree({
  vaultId,
  currentFolderId,
  onFolderSelect,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
}: FileTreeProps) {
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(true)
  const [contextMenu, setContextMenu] = useState<{
    x: number
    y: number
    folder: FolderItem
  } | null>(null)

  // Fetch all folders
  const fetchFolders = useCallback(async () => {
    if (!vaultId) return

    try {
      const response = await fetch(
        `/api/file-vault/folders?vaultId=${vaultId}&flat=true`
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
            parentId: folder.parent_id || folder.parentId,
            path: folder.path,
            children: [],
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

  useEffect(() => {
    fetchFolders()
  }, [fetchFolders])

  // Auto-expand to current folder
  useEffect(() => {
    if (currentFolderId) {
      setExpandedFolders((prev) => new Set([...prev, currentFolderId]))
    }
  }, [currentFolderId])

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null)
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  const toggleExpand = (folderId: string) => {
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

  const handleContextMenu = (e: React.MouseEvent, folder: FolderItem) => {
    e.preventDefault()
    e.stopPropagation()
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      folder,
    })
  }

  const renderFolder = (folder: FolderItem, level: number = 0) => {
    const isExpanded = expandedFolders.has(folder.id)
    const isSelected = currentFolderId === folder.id
    const hasChildren = folder.children && folder.children.length > 0

    return (
      <div key={folder.id}>
        <div
          className={`
            flex items-center gap-1 px-2 py-1.5 cursor-pointer rounded-md
            transition-colors text-sm
            ${isSelected
              ? 'bg-[#279989]/10 text-[#279989]'
              : 'hover:bg-slate-100 text-slate-700'
            }
          `}
          style={{ paddingLeft: `${level * 16 + 8}px` }}
          onClick={() => onFolderSelect(folder)}
          onContextMenu={(e) => handleContextMenu(e, folder)}
        >
          {/* Expand/collapse button */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              toggleExpand(folder.id)
            }}
            className={`w-4 h-4 flex items-center justify-center ${
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
        {onCreateFolder && (
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
            <div className="w-5 h-5 border-2 border-[#279989] border-t-transparent rounded-full animate-spin" />
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

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white rounded-lg shadow-xl border border-slate-200 py-1 z-50 min-w-[160px]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(e) => e.stopPropagation()}
        >
          {onCreateFolder && (
            <button
              onClick={() => {
                onCreateFolder(contextMenu.folder.id)
                setContextMenu(null)
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
                onRenameFolder(contextMenu.folder)
                setContextMenu(null)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
            >
              <Edit3 className="w-4 h-4" />
              Nimeta ümber
            </button>
          )}
          {onDeleteFolder && (
            <button
              onClick={() => {
                onDeleteFolder(contextMenu.folder)
                setContextMenu(null)
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              Kustuta
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default FileTree
