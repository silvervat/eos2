'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  X,
  Folder,
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Check,
  Loader2,
  MoveRight,
  Copy,
  Trash2,
  Tag,
} from 'lucide-react'
import { Button, Input } from '@rivest/ui'

interface FolderItem {
  id: string
  name: string
  path: string
  parentId?: string | null
  children?: FolderItem[]
}

interface BulkOrganizeDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedFileIds: string[]
  selectedFileNames: string[]
  vaultId: string
  currentFolderId: string | null
  onComplete: () => void
}

type Action = 'move' | 'copy' | 'tag' | 'delete'

/**
 * Dialog for bulk organizing files
 * Supports move, copy, tag, and delete operations
 */
export function BulkOrganizeDialog({
  isOpen,
  onClose,
  selectedFileIds,
  selectedFileNames,
  vaultId,
  currentFolderId,
  onComplete,
}: BulkOrganizeDialogProps) {
  const [action, setAction] = useState<Action>('move')
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [isLoadingFolders, setIsLoadingFolders] = useState(false)
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null)
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tags, setTags] = useState('')
  const [newFolderName, setNewFolderName] = useState('')
  const [showNewFolder, setShowNewFolder] = useState(false)

  // Fetch folders
  const fetchFolders = useCallback(async () => {
    if (!vaultId) return

    setIsLoadingFolders(true)
    try {
      const response = await fetch(`/api/file-vault/folders?vaultId=${vaultId}`)
      if (response.ok) {
        const data = await response.json()
        setFolders(data.folders || [])
      }
    } catch (err) {
      console.error('Error fetching folders:', err)
    } finally {
      setIsLoadingFolders(false)
    }
  }, [vaultId])

  useEffect(() => {
    if (isOpen) {
      fetchFolders()
      setSelectedFolderId(null)
      setError(null)
      setTags('')
    }
  }, [isOpen, fetchFolders])

  // Build folder tree
  const buildTree = (items: FolderItem[]): FolderItem[] => {
    const map = new Map<string, FolderItem>()
    const roots: FolderItem[] = []

    items.forEach(item => {
      map.set(item.id, { ...item, children: [] })
    })

    items.forEach(item => {
      const node = map.get(item.id)!
      if (item.parentId && map.has(item.parentId)) {
        map.get(item.parentId)!.children!.push(node)
      } else {
        roots.push(node)
      }
    })

    return roots
  }

  const folderTree = buildTree(folders)

  // Toggle folder expansion
  const toggleFolder = (folderId: string) => {
    const newExpanded = new Set(expandedFolders)
    if (newExpanded.has(folderId)) {
      newExpanded.delete(folderId)
    } else {
      newExpanded.add(folderId)
    }
    setExpandedFolders(newExpanded)
  }

  // Handle action
  const handleExecute = async () => {
    setIsProcessing(true)
    setError(null)

    try {
      let endpoint = ''
      let body: Record<string, unknown> = {}

      switch (action) {
        case 'move':
          if (selectedFolderId === currentFolderId) {
            setError('Vali teine kaust')
            setIsProcessing(false)
            return
          }
          endpoint = '/api/file-vault/files/batch'
          body = {
            action: 'move',
            fileIds: selectedFileIds,
            targetFolderId: selectedFolderId,
          }
          break

        case 'copy':
          endpoint = '/api/file-vault/files/batch'
          body = {
            action: 'copy',
            fileIds: selectedFileIds,
            targetFolderId: selectedFolderId,
          }
          break

        case 'tag':
          if (!tags.trim()) {
            setError('Sisesta vähemalt üks märksõna')
            setIsProcessing(false)
            return
          }
          endpoint = '/api/file-vault/files/batch'
          body = {
            action: 'tag',
            fileIds: selectedFileIds,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean),
          }
          break

        case 'delete':
          endpoint = '/api/file-vault/files/batch'
          body = {
            action: 'delete',
            fileIds: selectedFileIds,
          }
          break
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Operatsioon ebaõnnestus')
      }

      onComplete()
      onClose()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsProcessing(false)
    }
  }

  // Create new folder
  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return

    try {
      const response = await fetch('/api/file-vault/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vaultId,
          parentId: selectedFolderId,
          name: newFolderName.trim(),
        }),
      })

      if (response.ok) {
        const data = await response.json()
        await fetchFolders()
        setSelectedFolderId(data.folder.id)
        setNewFolderName('')
        setShowNewFolder(false)
      }
    } catch (err) {
      console.error('Error creating folder:', err)
    }
  }

  // Render folder tree node
  const renderFolderNode = (folder: FolderItem, level = 0) => {
    const isExpanded = expandedFolders.has(folder.id)
    const isSelected = selectedFolderId === folder.id
    const hasChildren = folder.children && folder.children.length > 0
    const isCurrentFolder = folder.id === currentFolderId

    return (
      <div key={folder.id}>
        <button
          onClick={() => {
            setSelectedFolderId(folder.id)
            if (hasChildren) toggleFolder(folder.id)
          }}
          disabled={isCurrentFolder && action === 'move'}
          className={`
            w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left
            ${isSelected ? 'bg-[#279989]/10 text-[#279989]' : 'hover:bg-slate-100'}
            ${isCurrentFolder && action === 'move' ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          style={{ paddingLeft: `${(level * 16) + 8}px` }}
        >
          {hasChildren ? (
            <span className="text-slate-400">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </span>
          ) : (
            <span className="w-4" />
          )}
          <Folder className={`w-4 h-4 ${isSelected ? 'text-[#279989]' : 'text-slate-400'}`} />
          <span className="flex-1 truncate">{folder.name}</span>
          {isSelected && <Check className="w-4 h-4" />}
          {isCurrentFolder && (
            <span className="text-xs text-slate-400">(praegune)</span>
          )}
        </button>

        {hasChildren && isExpanded && (
          <div>
            {folder.children!.map(child => renderFolderNode(child, level + 1))}
          </div>
        )}
      </div>
    )
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">
            Organiseeri faile ({selectedFileIds.length})
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-slate-100 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action tabs */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setAction('move')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              action === 'move'
                ? 'border-[#279989] text-[#279989]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <MoveRight className="w-4 h-4" />
            Liiguta
          </button>
          <button
            onClick={() => setAction('copy')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              action === 'copy'
                ? 'border-[#279989] text-[#279989]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Copy className="w-4 h-4" />
            Kopeeri
          </button>
          <button
            onClick={() => setAction('tag')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              action === 'tag'
                ? 'border-[#279989] text-[#279989]'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Tag className="w-4 h-4" />
            Märgista
          </button>
          <button
            onClick={() => setAction('delete')}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              action === 'delete'
                ? 'border-red-500 text-red-500'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Trash2 className="w-4 h-4" />
            Kustuta
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Selected files preview */}
          <div className="mb-4 p-3 bg-slate-50 rounded-lg">
            <p className="text-sm text-slate-600 mb-1">Valitud failid:</p>
            <p className="text-sm text-slate-900 truncate">
              {selectedFileNames.slice(0, 3).join(', ')}
              {selectedFileNames.length > 3 && ` +${selectedFileNames.length - 3} veel`}
            </p>
          </div>

          {/* Action-specific content */}
          {(action === 'move' || action === 'copy') && (
            <>
              <p className="text-sm text-slate-600 mb-2">
                {action === 'move' ? 'Vali sihtkaust:' : 'Vali koopia asukoht:'}
              </p>

              {/* Root folder option */}
              <button
                onClick={() => setSelectedFolderId(null)}
                className={`
                  w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm text-left mb-1
                  ${selectedFolderId === null ? 'bg-[#279989]/10 text-[#279989]' : 'hover:bg-slate-100'}
                `}
              >
                <Folder className="w-4 h-4" />
                <span className="flex-1">Juurkaust</span>
                {selectedFolderId === null && <Check className="w-4 h-4" />}
              </button>

              {/* Folder tree */}
              {isLoadingFolders ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg max-h-48 overflow-y-auto">
                  {folderTree.map(folder => renderFolderNode(folder))}
                </div>
              )}

              {/* New folder button */}
              {showNewFolder ? (
                <div className="flex gap-2 mt-3">
                  <Input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="Uue kausta nimi"
                    className="flex-1"
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
                  />
                  <Button size="sm" onClick={handleCreateFolder}>
                    Loo
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setShowNewFolder(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewFolder(true)}
                  className="flex items-center gap-2 mt-3 text-sm text-[#279989] hover:underline"
                >
                  <FolderPlus className="w-4 h-4" />
                  Loo uus kaust
                </button>
              )}
            </>
          )}

          {action === 'tag' && (
            <>
              <p className="text-sm text-slate-600 mb-2">
                Sisesta märksõnad (eraldatud komadega):
              </p>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="nt. projekt, tähtis, 2024"
                className="w-full"
              />
              <p className="text-xs text-slate-400 mt-2">
                Märksõnad lisatakse olemasolevatele, ei asenda neid.
              </p>
            </>
          )}

          {action === 'delete' && (
            <div className="text-center py-4">
              <Trash2 className="w-12 h-12 text-red-400 mx-auto mb-3" />
              <p className="text-sm text-slate-600">
                Kas oled kindel, et soovid kustutada <strong>{selectedFileIds.length}</strong> faili?
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Failid liigutatakse prügikasti ja neid saab hiljem taastada.
              </p>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-slate-200">
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Tühista
          </Button>
          <Button
            onClick={handleExecute}
            disabled={isProcessing}
            style={action === 'delete' ? { backgroundColor: '#ef4444' } : { backgroundColor: '#279989' }}
            className="gap-2"
          >
            {isProcessing && <Loader2 className="w-4 h-4 animate-spin" />}
            {action === 'move' && 'Liiguta'}
            {action === 'copy' && 'Kopeeri'}
            {action === 'tag' && 'Lisa märksõnad'}
            {action === 'delete' && 'Kustuta'}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default BulkOrganizeDialog
