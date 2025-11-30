'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FolderArchive,
  Upload,
  Search,
  Filter,
  Grid,
  List,
  FolderPlus,
  FileUp,
  MoreVertical,
  File,
  Folder,
  Image,
  FileText,
  Film,
  Music,
  Archive,
  Star,
  Download,
  Trash2,
  Share2,
  Eye,
  RefreshCw,
  Loader2,
  ChevronRight,
  Home,
} from 'lucide-react'
import { Button, Input, Card } from '@rivest/ui'
import { FileUploadDialog } from '@/components/file-vault/FileUploadDialog'

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
  folder?: {
    id: string
    name: string
    path: string
  }
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

interface Vault {
  id: string
  name: string
  description?: string
  quotaBytes: number
  usedBytes: number
  usagePercent: number
}

// Helper to get file icon
const getFileIcon = (mimeType: string) => {
  if (mimeType.startsWith('image/')) return Image
  if (mimeType.startsWith('video/')) return Film
  if (mimeType.startsWith('audio/')) return Music
  if (mimeType === 'application/pdf') return FileText
  if (mimeType.includes('zip') || mimeType.includes('archive')) return Archive
  return File
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
  })
}

export default function FileVaultPage() {
  // State
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Data state
  const [vault, setVault] = useState<Vault | null>(null)
  const [files, setFiles] = useState<FileItem[]>([])
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string | null; name: string }>>([
    { id: null, name: 'Failid' },
  ])

  // Dialog state
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)

  // Fetch vault
  const fetchVault = useCallback(async () => {
    try {
      const response = await fetch('/api/file-vault/vaults')
      const data = await response.json()

      if (!response.ok) {
        console.error('Vault API error:', data)
        const errorMsg = data.details
          ? `${data.error}: ${data.details}`
          : data.error || 'Tundmatu viga'
        setError(errorMsg)
        return null
      }

      if (data.vaults && data.vaults.length > 0) {
        setVault(data.vaults[0])
        return data.vaults[0].id
      }
      return null
    } catch (err) {
      console.error('Error fetching vault:', err)
      setError('Failihoidla laadimine ebaonnestus')
      return null
    }
  }, [])

  // Fetch files and folders
  const fetchContent = useCallback(async (vaultId: string, folderId: string | null) => {
    try {
      // Fetch folders
      const foldersParams = new URLSearchParams({
        vaultId,
        flat: 'true',
        ...(folderId ? { parentId: folderId } : { parentId: 'root' }),
      })
      const foldersResponse = await fetch(`/api/file-vault/folders?${foldersParams}`)
      if (foldersResponse.ok) {
        const foldersData = await foldersResponse.json()
        setFolders(foldersData.folders || [])
      }

      // Fetch files
      const filesParams = new URLSearchParams({
        vaultId,
        ...(folderId ? { folderId } : { folderId: 'root' }),
        limit: '100',
      })
      const filesResponse = await fetch(`/api/file-vault/files?${filesParams}`)
      if (filesResponse.ok) {
        const filesData = await filesResponse.json()
        setFiles(filesData.files || [])
      }
    } catch (err) {
      console.error('Error fetching content:', err)
      setError('Sisu laadimine ebaonnestus')
    }
  }, [])

  // Initial load
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      setError(null)
      const vaultId = await fetchVault()
      if (vaultId) {
        await fetchContent(vaultId, currentFolderId)
      }
      setIsLoading(false)
    }
    loadData()
  }, [fetchVault, fetchContent, currentFolderId])

  // Refresh content
  const handleRefresh = async () => {
    if (!vault) return
    setIsRefreshing(true)
    await fetchContent(vault.id, currentFolderId)
    setIsRefreshing(false)
  }

  // Navigate to folder
  const navigateToFolder = async (folder: FolderItem | null) => {
    if (!vault) return

    if (folder === null) {
      // Navigate to root
      setCurrentFolderId(null)
      setBreadcrumbs([{ id: null, name: 'Failid' }])
    } else {
      setCurrentFolderId(folder.id)
      // Update breadcrumbs - build from path
      const newBreadcrumbs: Array<{ id: string | null; name: string }> = [
        { id: null, name: 'Failid' },
      ]
      // For now, just add the current folder
      newBreadcrumbs.push({ id: folder.id, name: folder.name })
      setBreadcrumbs(newBreadcrumbs)
    }

    setSelectedItems([])
    setIsLoading(true)
    await fetchContent(vault.id, folder?.id || null)
    setIsLoading(false)
  }

  // Create folder
  const handleCreateFolder = async () => {
    if (!vault || !newFolderName.trim()) return

    setIsCreatingFolder(true)
    try {
      const response = await fetch('/api/file-vault/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vaultId: vault.id,
          parentId: currentFolderId,
          name: newFolderName.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create folder')
      }

      setNewFolderName('')
      setShowNewFolderDialog(false)
      await fetchContent(vault.id, currentFolderId)
    } catch (err) {
      console.error('Error creating folder:', err)
      alert((err as Error).message)
    } finally {
      setIsCreatingFolder(false)
    }
  }

  // Upload complete handler
  const handleUploadComplete = async () => {
    if (vault) {
      await fetchContent(vault.id, currentFolderId)
    }
  }

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    )
  }

  // Filter by search
  const filteredFolders = folders.filter((folder) =>
    folder.name.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const filteredFiles = files.filter((file) =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Combined items for display
  const allItems = [
    ...filteredFolders.map((f) => ({ ...f, type: 'folder' as const })),
    ...filteredFiles.map((f) => ({ ...f, type: 'file' as const })),
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <FolderArchive className="w-7 h-7" style={{ color: '#279989' }} />
            Failihaldus
          </h1>
          <p className="text-slate-600 mt-1">
            {vault ? (
              <>
                {vault.name} - {formatFileSize(Number(vault.usedBytes))} / {formatFileSize(Number(vault.quotaBytes))} kasutatud
              </>
            ) : (
              'Halda oma faile ja dokumente'
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => setShowNewFolderDialog(true)}
          >
            <FolderPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Uus kaust</span>
          </Button>
          <Button
            className="gap-2"
            style={{ backgroundColor: '#279989' }}
            onClick={() => setShowUploadDialog(true)}
          >
            <FileUp className="w-4 h-4" />
            <span className="hidden sm:inline">Laadi fail</span>
          </Button>
        </div>
      </div>

      {/* Breadcrumbs */}
      <div className="flex items-center gap-1 text-sm">
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.id || 'root'} className="flex items-center gap-1">
            {index > 0 && <ChevronRight className="w-4 h-4 text-slate-400" />}
            <button
              onClick={() => {
                if (crumb.id === null) {
                  navigateToFolder(null)
                } else {
                  const folder = folders.find((f) => f.id === crumb.id)
                  if (folder) navigateToFolder(folder)
                }
              }}
              className={`flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-100 ${
                index === breadcrumbs.length - 1
                  ? 'text-slate-900 font-medium'
                  : 'text-slate-500'
              }`}
            >
              {index === 0 && <Home className="w-4 h-4" />}
              {crumb.name}
            </button>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <Input
              placeholder="Otsi faile..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
            <Button variant="outline" size="icon">
              <Filter className="w-4 h-4" />
            </Button>
            <div className="border rounded-lg flex">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('grid')}
                className="rounded-r-none"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
                className="rounded-l-none"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Selection actions */}
        {selectedItems.length > 0 && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t">
            <span className="text-sm text-slate-600">{selectedItems.length} valitud</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="gap-1">
                <Download className="w-4 h-4" />
                Laadi alla
              </Button>
              <Button variant="ghost" size="sm" className="gap-1">
                <Share2 className="w-4 h-4" />
                Jaga
              </Button>
              <Button variant="ghost" size="sm" className="gap-1 text-red-600 hover:text-red-700">
                <Trash2 className="w-4 h-4" />
                Kustuta
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="text-center py-12">
          <p className="text-red-600">{error}</p>
          <Button variant="outline" onClick={handleRefresh} className="mt-4">
            Proovi uuesti
          </Button>
        </div>
      )}

      {/* Files & Folders */}
      {!isLoading && !error && (
        <>
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {allItems.map((item) => {
                const isFolder = item.type === 'folder'
                const Icon = isFolder ? Folder : getFileIcon((item as FileItem).mimeType)
                const isSelected = selectedItems.includes(item.id)

                return (
                  <Card
                    key={item.id}
                    className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? 'ring-2 ring-offset-2' : ''
                    }`}
                    style={{
                      borderColor: isSelected ? '#279989' : undefined,
                      ['--tw-ring-color' as string]: '#279989',
                    }}
                    onClick={() => {
                      if (isFolder) {
                        navigateToFolder(item as FolderItem)
                      } else {
                        toggleSelect(item.id)
                      }
                    }}
                    onDoubleClick={() => {
                      if (isFolder) {
                        navigateToFolder(item as FolderItem)
                      }
                    }}
                  >
                    <div className="flex flex-col items-center text-center">
                      {!isFolder && (item as FileItem).thumbnailSmall ? (
                        <div className="w-12 h-12 rounded-lg overflow-hidden mb-3 bg-slate-100">
                          <img
                            src={(item as FileItem).thumbnailSmall}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className={`w-12 h-12 rounded-lg flex items-center justify-center mb-3 ${
                            isFolder ? 'bg-amber-100' : 'bg-slate-100'
                          }`}
                        >
                          <Icon
                            className="w-6 h-6"
                            style={{ color: isFolder ? '#f59e0b' : '#64748b' }}
                          />
                        </div>
                      )}
                      <p className="text-sm font-medium text-slate-900 truncate w-full">
                        {item.name}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {isFolder
                          ? formatDate(item.createdAt)
                          : formatFileSize((item as FileItem).sizeBytes)}
                      </p>
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card>
              <div className="divide-y">
                {allItems.map((item) => {
                  const isFolder = item.type === 'folder'
                  const Icon = isFolder ? Folder : getFileIcon((item as FileItem).mimeType)
                  const isSelected = selectedItems.includes(item.id)

                  return (
                    <div
                      key={item.id}
                      className={`flex items-center gap-4 p-4 cursor-pointer transition-colors hover:bg-slate-50 ${
                        isSelected ? 'bg-slate-50' : ''
                      }`}
                      onClick={() => {
                        if (isFolder) {
                          navigateToFolder(item as FolderItem)
                        } else {
                          toggleSelect(item.id)
                        }
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(item.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 rounded"
                      />
                      {!isFolder && (item as FileItem).thumbnailSmall ? (
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                          <img
                            src={(item as FileItem).thumbnailSmall}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                            isFolder ? 'bg-amber-100' : 'bg-slate-100'
                          }`}
                        >
                          <Icon
                            className="w-5 h-5"
                            style={{ color: isFolder ? '#f59e0b' : '#64748b' }}
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-900 truncate">{item.name}</p>
                        <p className="text-xs text-slate-500">
                          {isFolder ? 'Kaust' : formatFileSize((item as FileItem).sizeBytes)}
                        </p>
                      </div>
                      <div className="text-sm text-slate-500 hidden sm:block">
                        {formatDate(item.createdAt)}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="w-8 h-8">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8">
                          <Star className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Empty state */}
      {!isLoading && !error && allItems.length === 0 && (
        <div className="text-center py-12">
          <FolderArchive className="w-12 h-12 mx-auto text-slate-300" />
          <h3 className="mt-4 text-lg font-medium text-slate-900">
            {searchQuery ? 'Faile ei leitud' : 'Kaust on tühi'}
          </h3>
          <p className="mt-2 text-slate-500">
            {searchQuery
              ? 'Proovi muuta otsingut'
              : 'Laadi failid või loo uus kaust'}
          </p>
          {!searchQuery && (
            <div className="mt-4 flex gap-2 justify-center">
              <Button
                variant="outline"
                onClick={() => setShowNewFolderDialog(true)}
                className="gap-2"
              >
                <FolderPlus className="w-4 h-4" />
                Uus kaust
              </Button>
              <Button
                onClick={() => setShowUploadDialog(true)}
                className="gap-2"
                style={{ backgroundColor: '#279989' }}
              >
                <FileUp className="w-4 h-4" />
                Laadi fail
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Upload Dialog */}
      {vault && (
        <FileUploadDialog
          open={showUploadDialog}
          onOpenChange={setShowUploadDialog}
          vaultId={vault.id}
          folderId={currentFolderId}
          onUploadComplete={handleUploadComplete}
        />
      )}

      {/* New Folder Dialog */}
      {showNewFolderDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white rounded-xl shadow-xl">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Uus kaust</h3>
              <Input
                placeholder="Kausta nimi"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateFolder()
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex items-center gap-3 p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewFolderDialog(false)
                  setNewFolderName('')
                }}
                disabled={isCreatingFolder}
                className="flex-1"
              >
                Tühista
              </Button>
              <Button
                onClick={handleCreateFolder}
                disabled={!newFolderName.trim() || isCreatingFolder}
                className="flex-1 bg-[#279989] hover:bg-[#1e7a6d] text-white"
              >
                {isCreatingFolder ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loon...
                  </>
                ) : (
                  'Loo kaust'
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
