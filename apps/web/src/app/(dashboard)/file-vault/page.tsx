'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  FolderArchive,
  Search,
  Filter,
  Grid,
  List,
  Table2,
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
  BarChart3,
  Edit3,
  MessageSquare,
  X,
} from 'lucide-react'
import { Button, Input, Card } from '@rivest/ui'
import { FileUploadDialog } from '@/components/file-vault/FileUploadDialog'
import { FilePreviewModal } from '@/components/file-vault/FilePreviewModal'
import { FileVaultTableView } from '@/components/file-vault/FileVaultTableView'
import { FileVaultStatistics } from '@/components/file-vault/FileVaultStatistics'
import { ImageAnnotationEditor } from '@/components/file-vault/ImageAnnotationEditor'

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
  thumbnailLarge?: string
  storageKey?: string
  isStarred?: boolean
  createdAt: string
  updatedAt: string
  tags: string[]
  commentCount?: number
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
  fileCount?: number
}

interface Vault {
  id: string
  name: string
  description?: string
  quotaBytes: number
  usedBytes: number
  usagePercent: number
}

type ViewMode = 'grid' | 'list' | 'table' | 'stats'

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
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
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

  // Preview & Edit state
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null)
  const [editingFile, setEditingFile] = useState<FileItem | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

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
    await fetchVault() // Refresh vault stats too
    setIsRefreshing(false)
  }

  // Navigate to folder
  const navigateToFolder = async (folder: FolderItem | null) => {
    if (!vault) return

    if (folder === null) {
      setCurrentFolderId(null)
      setBreadcrumbs([{ id: null, name: 'Failid' }])
    } else {
      setCurrentFolderId(folder.id)
      const newBreadcrumbs: Array<{ id: string | null; name: string }> = [
        { id: null, name: 'Failid' },
      ]
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
      await fetchVault()
    }
  }

  // File actions
  const handleDownload = async (file: FileItem) => {
    try {
      const response = await fetch(`/api/file-vault/files/${file.id}/download`)
      const data = await response.json()
      if (data.downloadUrl) {
        const link = document.createElement('a')
        link.href = data.downloadUrl
        link.download = file.name
        link.click()
      }
    } catch (error) {
      console.error('Error downloading:', error)
    }
  }

  const handleShare = async (file: FileItem) => {
    try {
      const response = await fetch(`/api/file-vault/files/${file.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresIn: 24 * 7 }),
      })
      const data = await response.json()
      if (data.shareUrl) {
        await navigator.clipboard.writeText(data.shareUrl)
        alert(`Jagamislink kopeeritud!\n${data.shareUrl}`)
      }
    } catch (error) {
      console.error('Error sharing:', error)
    }
  }

  const handleDelete = async (file: FileItem) => {
    if (!confirm(`Kas oled kindel, et soovid kustutada "${file.name}"?`)) return

    try {
      const response = await fetch(`/api/file-vault/files/${file.id}/delete`, {
        method: 'DELETE',
      })
      if (response.ok && vault) {
        await fetchContent(vault.id, currentFolderId)
        await fetchVault()
      }
    } catch (error) {
      console.error('Error deleting:', error)
    }
  }

  const handleToggleStar = async (file: FileItem) => {
    try {
      const response = await fetch(`/api/file-vault/files/${file.id}/favorite`, {
        method: 'POST',
      })
      if (response.ok && vault) {
        await fetchContent(vault.id, currentFolderId)
      }
    } catch (error) {
      console.error('Error toggling star:', error)
    }
  }

  const handlePreview = async (file: FileItem) => {
    setPreviewFile(file)
    try {
      const response = await fetch(`/api/file-vault/files/${file.id}/download`)
      const data = await response.json()
      if (data.downloadUrl) {
        setPreviewUrl(data.downloadUrl)
      }
    } catch (error) {
      console.error('Error getting preview URL:', error)
    }
  }

  const handleEdit = async (file: FileItem) => {
    if (!file.mimeType.startsWith('image/')) return
    try {
      const response = await fetch(`/api/file-vault/files/${file.id}/download`)
      const data = await response.json()
      if (data.downloadUrl) {
        setPreviewUrl(data.downloadUrl)
        setEditingFile(file)
      }
    } catch (error) {
      console.error('Error getting file for editing:', error)
    }
  }

  // Bulk actions
  const handleBulkDownload = () => {
    selectedItems.forEach((id) => {
      const file = files.find((f) => f.id === id)
      if (file) handleDownload(file)
    })
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Kas oled kindel, et soovid kustutada ${selectedItems.length} faili?`)) return

    for (const id of selectedItems) {
      const file = files.find((f) => f.id === id)
      if (file) {
        await fetch(`/api/file-vault/files/${file.id}/delete`, { method: 'DELETE' })
      }
    }

    setSelectedItems([])
    if (vault) {
      await fetchContent(vault.id, currentFolderId)
      await fetchVault()
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
                <span className="ml-2 text-sm">({vault.usagePercent}%)</span>
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
      {viewMode !== 'stats' && (
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
      )}

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
                title="Ruudustik"
              >
                <Grid className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('list')}
                className="rounded-none border-l"
                title="Nimekiri"
              >
                <List className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('table')}
                className="rounded-none border-l"
                title="Tabel"
              >
                <Table2 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'stats' ? 'default' : 'ghost'}
                size="icon"
                onClick={() => setViewMode('stats')}
                className="rounded-l-none border-l"
                title="Statistika"
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Selection actions */}
        {selectedItems.length > 0 && (
          <div className="flex items-center gap-4 mt-4 pt-4 border-t">
            <span className="text-sm text-slate-600">{selectedItems.length} valitud</span>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" className="gap-1" onClick={handleBulkDownload}>
                <Download className="w-4 h-4" />
                Laadi alla
              </Button>
              <Button variant="ghost" size="sm" className="gap-1 text-red-600 hover:text-red-700" onClick={handleBulkDelete}>
                <Trash2 className="w-4 h-4" />
                Kustuta
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedItems([])}>
                <X className="w-4 h-4 mr-1" />
                Tühista
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

      {/* Statistics View */}
      {!isLoading && !error && viewMode === 'stats' && vault && (
        <FileVaultStatistics vaultId={vault.id} />
      )}

      {/* Table View */}
      {!isLoading && !error && viewMode === 'table' && (
        <FileVaultTableView
          files={filteredFiles}
          folders={filteredFolders}
          selectedItems={selectedItems}
          onSelect={setSelectedItems}
          onFolderClick={navigateToFolder}
          onFileClick={(file) => handlePreview(file)}
          onDownload={handleDownload}
          onShare={handleShare}
          onDelete={handleDelete}
          onToggleStar={handleToggleStar}
          onPreview={handlePreview}
        />
      )}

      {/* Grid & List Views */}
      {!isLoading && !error && (viewMode === 'grid' || viewMode === 'list') && (
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
                    className={`p-4 cursor-pointer transition-all hover:shadow-md group ${
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
                        handlePreview(item as FileItem)
                      }
                    }}
                  >
                    <div className="flex flex-col items-center text-center relative">
                      {/* Selection checkbox */}
                      {!isFolder && (
                        <div className="absolute -top-2 -left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation()
                              toggleSelect(item.id)
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 rounded"
                          />
                        </div>
                      )}

                      {/* Quick actions */}
                      {!isFolder && (
                        <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                          {(item as FileItem).mimeType.startsWith('image/') && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-6 h-6 bg-white shadow"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEdit(item as FileItem)
                              }}
                            >
                              <Edit3 className="w-3 h-3" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 bg-white shadow"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDownload(item as FileItem)
                            }}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      )}

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
                      {!isFolder && (item as FileItem).isStarred && (
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 absolute top-0 right-0" />
                      )}
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
                          handlePreview(item as FileItem)
                        }
                      }}
                    >
                      {!isFolder && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(item.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 rounded"
                        />
                      )}
                      {isFolder && <div className="w-4" />}
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
                        <p className="text-sm font-medium text-slate-900 truncate flex items-center gap-2">
                          {item.name}
                          {!isFolder && (item as FileItem).isStarred && (
                            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          )}
                        </p>
                        <p className="text-xs text-slate-500">
                          {isFolder ? 'Kaust' : formatFileSize((item as FileItem).sizeBytes)}
                        </p>
                      </div>
                      <div className="text-sm text-slate-500 hidden sm:block">
                        {formatDate(item.createdAt)}
                      </div>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        {!isFolder && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8"
                              onClick={() => handlePreview(item as FileItem)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8"
                              onClick={() => handleToggleStar(item as FileItem)}
                            >
                              <Star className={`w-4 h-4 ${(item as FileItem).isStarred ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8"
                              onClick={() => handleDownload(item as FileItem)}
                            >
                              <Download className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8"
                              onClick={() => handleShare(item as FileItem)}
                            >
                              <Share2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 hover:text-red-600"
                              onClick={() => handleDelete(item as FileItem)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
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
      {!isLoading && !error && viewMode !== 'stats' && allItems.length === 0 && (
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

      {/* File Preview Modal */}
      <FilePreviewModal
        file={previewFile}
        files={files}
        isOpen={!!previewFile}
        onClose={() => {
          setPreviewFile(null)
          setPreviewUrl(null)
        }}
        vaultId={vault?.id || ''}
        onFileChange={(file) => setPreviewFile(file)}
        onDelete={(fileId) => {
          if (vault) {
            fetchContent(vault.id, currentFolderId)
            fetchVault()
          }
        }}
      />

      {/* Image Annotation Editor */}
      {editingFile && previewUrl && (
        <ImageAnnotationEditor
          imageUrl={previewUrl}
          fileName={editingFile.name}
          fileId={editingFile.id}
          vaultId={vault?.id || ''}
          isOpen={!!editingFile}
          onClose={() => {
            setEditingFile(null)
            setPreviewUrl(null)
          }}
        />
      )}
    </div>
  )
}
