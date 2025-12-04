'use client'

import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { FixedSizeList as VirtualList } from 'react-window'
import InfiniteLoader from 'react-window-infinite-loader'
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
import { ShareDialog } from '@/components/file-vault/ShareDialog'
import { FilePreviewDialog } from '@/components/file-vault/FilePreviewDialog'
import { FileTree, FileTreeRef } from '@/components/file-vault/FileTree'
import { FileInfoSidebar } from '@/components/file-vault/FileInfoSidebar'
import {
  User,
  FolderHeart,
  BarChart3,
  PanelLeftClose,
  PanelLeft,
  PanelRightClose,
  PanelRight,
  Info,
  Link2,
  Copy,
  ExternalLink,
  Mail,
  Lock,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
} from 'lucide-react'

// Pagination constants
const PAGE_SIZE = 100
const LIST_ROW_HEIGHT = 64

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

type DisplayItem = (FolderItem & { type: 'folder' }) | (FileItem & { type: 'file' })

// Helper to get file icon with specific format icons
const getFileIcon = (mimeType: string, extension?: string) => {
  // HEIC/HEIF are image formats (Apple's format)
  if (mimeType.startsWith('image/') || mimeType === 'image/heic' || mimeType === 'image/heif') return Image
  if (mimeType.includes('heic') || mimeType.includes('heif')) return Image
  if (mimeType.startsWith('video/')) return Film
  if (mimeType.startsWith('audio/')) return Music

  // Office documents - check both mime type and extension
  const ext = extension?.toLowerCase()

  // PDF
  if (mimeType === 'application/pdf' || ext === 'pdf') return FileText

  // Excel
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') ||
      ext === 'xlsx' || ext === 'xls' || ext === 'csv') return FileText

  // Word
  if (mimeType.includes('word') || mimeType.includes('document') ||
      ext === 'docx' || ext === 'doc') return FileText

  // PowerPoint
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint') ||
      ext === 'pptx' || ext === 'ppt') return FileText

  // Archives
  if (mimeType.includes('zip') || mimeType.includes('archive') || mimeType.includes('compressed') ||
      ext === 'zip' || ext === 'rar' || ext === '7z' || ext === 'tar' || ext === 'gz') return Archive

  return File
}

// Get file type label for display
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

// Get file type color for badge
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list') // Default to list view
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Table sorting state
  const [sortColumn, setSortColumn] = useState<'name' | 'createdAt' | 'sizeBytes' | 'mimeType'>('createdAt')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')

  // Hover preview state
  const [hoverPreviewFile, setHoverPreviewFile] = useState<FileItem | null>(null)
  const [hoverPreviewPosition, setHoverPreviewPosition] = useState({ x: 0, y: 0 })

  // Pagination state
  const [hasMoreFiles, setHasMoreFiles] = useState(true)
  const [totalFiles, setTotalFiles] = useState(0)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  // Data state
  const [vault, setVault] = useState<Vault | null>(null)
  const [files, setFiles] = useState<FileItem[]>([])
  const [folders, setFolders] = useState<FolderItem[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string | null; name: string }>>([
    { id: null, name: 'Failid' },
  ])

  // Refs
  const listContainerRef = useRef<HTMLDivElement>(null)
  const infiniteLoaderRef = useRef<InfiniteLoader>(null)
  const vaultIdRef = useRef<string | null>(null)
  const isInitialLoadDone = useRef(false)
  const fileTreeRef = useRef<FileTreeRef>(null)

  // Active tab: 'all' | 'my-files' | 'organize' | 'shares' | 'statistics'
  const [activeTab, setActiveTab] = useState<'all' | 'my-files' | 'organize' | 'shares' | 'statistics'>('all')

  // Dialog state
  const [showUploadDialog, setShowUploadDialog] = useState(false)
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false)
  const [newFolderName, setNewFolderName] = useState('')
  const [newFolderDescription, setNewFolderDescription] = useState('')
  const [newFolderVisibility, setNewFolderVisibility] = useState<'public' | 'private' | 'groups' | 'users'>('public')
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)

  // Share dialog state - supports multiple files
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [shareFileIds, setShareFileIds] = useState<string[]>([])
  const [shareFileNames, setShareFileNames] = useState<string[]>([])

  // File tree visibility
  const [showFileTree, setShowFileTree] = useState(true)

  // Preview dialog state
  const [showPreviewDialog, setShowPreviewDialog] = useState(false)
  const [previewFileId, setPreviewFileId] = useState<string | null>(null)

  // Info sidebar state
  const [showInfoSidebar, setShowInfoSidebar] = useState(false)
  const [infoFileId, setInfoFileId] = useState<string | null>(null)

  // Statistics data
  const [statistics, setStatistics] = useState<{
    totalFiles: number
    totalSize: number
    myUploads: number
    myShares: number
    recentActivity: Array<{ date: string; action: string; fileName: string }>
    filesByType: Array<{ type: string; count: number; size: number }>
  } | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(false)

  // User collections (Organize tab)
  const [collections, setCollections] = useState<Array<{
    id: string
    name: string
    description?: string
    fileCount: number
    createdAt: string
  }>>([])
  const [isLoadingCollections, setIsLoadingCollections] = useState(false)
  const [showNewCollectionDialog, setShowNewCollectionDialog] = useState(false)
  const [newCollectionName, setNewCollectionName] = useState('')
  const [isCreatingCollection, setIsCreatingCollection] = useState(false)

  // Shares data (Jagamised tab)
  interface ShareItem {
    id: string
    shortCode: string
    shareUrl: string
    fileId: string | null
    folderId: string | null
    fileName: string | null
    fileMimeType: string | null
    fileSizeBytes: number | null
    folderName: string | null
    folderPath: string | null
    allowDownload: boolean
    allowUpload: boolean
    expiresAt: string | null
    downloadLimit: number | null
    downloadsCount: number
    accessCount: number
    lastAccessedAt: string | null
    title: string | null
    message: string | null
    sharedWithEmail: string | null
    createdAt: string
    hasPassword: boolean
    status: 'active' | 'expired' | 'limit_reached'
  }
  const [shares, setShares] = useState<ShareItem[]>([])
  const [isLoadingShares, setIsLoadingShares] = useState(false)
  const [sharesSearch, setSharesSearch] = useState('')
  const [sharesStatusFilter, setSharesStatusFilter] = useState<'all' | 'active' | 'expired'>('all')
  const [sharesSortBy, setSharesSortBy] = useState<'created_at' | 'expires_at' | 'access_count'>('created_at')
  const [sharesSortOrder, setSharesSortOrder] = useState<'asc' | 'desc'>('desc')

  // Search preview state (recursive search across all folders)
  interface SearchPreviewFile {
    id: string
    name: string
    mimeType: string
    sizeBytes: number
    thumbnailSmall?: string
    folderId: string | null
    folder: { id: string | null; name: string; path: string } | null
  }
  interface SearchFolderGroup {
    folder: { id: string | null; name: string; path: string }
    files: SearchPreviewFile[]
    totalCount: number
  }
  const [searchPreviewGroups, setSearchPreviewGroups] = useState<SearchFolderGroup[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [showSearchPreview, setShowSearchPreview] = useState(false)
  const [selectedSearchFolder, setSelectedSearchFolder] = useState<string | null>(null)
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Fetch vault (only called once on initial load)
  const fetchVault = useCallback(async () => {
    // Return cached vault if already loaded
    if (vaultIdRef.current && vault) {
      return vaultIdRef.current
    }

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
        vaultIdRef.current = data.vaults[0].id
        return data.vaults[0].id
      }
      return null
    } catch (err) {
      console.error('Error fetching vault:', err)
      setError('Failihoidla laadimine ebaonnestus')
      return null
    }
  }, [vault])

  // Fetch folders (always fetches all folders in current directory)
  const fetchFolders = useCallback(async (vaultId: string, folderId: string | null) => {
    try {
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
    } catch (err) {
      console.error('Error fetching folders:', err)
    }
  }, [])

  // Fetch files with pagination
  const fetchFiles = useCallback(async (
    vaultId: string,
    folderId: string | null,
    offset: number = 0,
    append: boolean = false,
    filter?: 'all' | 'my-files'
  ) => {
    try {
      const filesParams = new URLSearchParams({
        vaultId,
        ...(folderId ? { folderId } : { folderId: 'root' }),
        limit: String(PAGE_SIZE),
        offset: String(offset),
      })

      // Add filter for "my files" tab
      if (filter === 'my-files') {
        filesParams.set('uploadedByMe', 'true')
      }

      const filesResponse = await fetch(`/api/file-vault/files?${filesParams}`)
      if (filesResponse.ok) {
        const filesData = await filesResponse.json()
        const newFiles = filesData.files || []

        if (append) {
          setFiles(prev => [...prev, ...newFiles])
        } else {
          setFiles(newFiles)
        }

        setTotalFiles(filesData.pagination?.total || 0)
        setHasMoreFiles(filesData.pagination?.hasMore || false)

        return newFiles
      }
      return []
    } catch (err) {
      console.error('Error fetching files:', err)
      return []
    }
  }, [])

  // Load more files for infinite scroll
  const loadMoreFiles = useCallback(async () => {
    if (!vault || isLoadingMore || !hasMoreFiles) return

    setIsLoadingMore(true)
    const filter = activeTab === 'my-files' ? 'my-files' : 'all'
    await fetchFiles(vault.id, currentFolderId, files.length, true, filter)
    setIsLoadingMore(false)
  }, [vault, currentFolderId, files.length, hasMoreFiles, isLoadingMore, fetchFiles, activeTab])

  // Fetch statistics data
  const fetchStatistics = useCallback(async () => {
    if (!vaultIdRef.current) return

    setIsLoadingStats(true)
    try {
      const response = await fetch(`/api/file-vault/statistics?vaultId=${vaultIdRef.current}`)
      if (response.ok) {
        const data = await response.json()
        setStatistics(data)
      }
    } catch (error) {
      console.error('Error fetching statistics:', error)
    } finally {
      setIsLoadingStats(false)
    }
  }, [])

  // Fetch user collections
  const fetchCollections = useCallback(async () => {
    if (!vaultIdRef.current) return

    setIsLoadingCollections(true)
    try {
      const response = await fetch(`/api/file-vault/collections?vaultId=${vaultIdRef.current}`)
      if (response.ok) {
        const data = await response.json()
        setCollections(data.collections || [])
      }
    } catch (error) {
      console.error('Error fetching collections:', error)
    } finally {
      setIsLoadingCollections(false)
    }
  }, [])

  // Fetch user shares
  const fetchShares = useCallback(async () => {
    if (!vaultIdRef.current) return

    setIsLoadingShares(true)
    try {
      const params = new URLSearchParams({
        vaultId: vaultIdRef.current,
        listAll: 'true',
        sortBy: sharesSortBy,
        sortOrder: sharesSortOrder,
        ...(sharesStatusFilter !== 'all' ? { status: sharesStatusFilter } : {}),
        ...(sharesSearch ? { search: sharesSearch } : {}),
      })
      const response = await fetch(`/api/file-vault/shares?${params}`)
      if (response.ok) {
        const data = await response.json()
        setShares(data.shares || [])
      }
    } catch (error) {
      console.error('Error fetching shares:', error)
    } finally {
      setIsLoadingShares(false)
    }
  }, [sharesSortBy, sharesSortOrder, sharesStatusFilter, sharesSearch])

  // Delete share
  const handleDeleteShare = async (shareId: string) => {
    if (!confirm('Kas oled kindel, et soovid selle jagamise kustutada?')) return

    try {
      const response = await fetch(`/api/file-vault/shares/${shareId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setShares(prev => prev.filter(s => s.id !== shareId))
      } else {
        const data = await response.json()
        alert(data.error || 'Jagamise kustutamine ebaõnnestus')
      }
    } catch (error) {
      console.error('Error deleting share:', error)
      alert('Jagamise kustutamine ebaõnnestus')
    }
  }

  // Copy share URL to clipboard
  const copyShareUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url)
      // Could add toast notification here
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // Recursive search with folder grouping
  const performSearch = useCallback(async (query: string) => {
    if (!vaultIdRef.current || !query.trim()) {
      setSearchPreviewGroups([])
      setShowSearchPreview(false)
      return
    }

    setIsSearching(true)
    setShowSearchPreview(true)

    try {
      const params = new URLSearchParams({
        vaultId: vaultIdRef.current,
        q: query.trim(),
        recursive: 'true',
        groupByFolder: 'true',
        previewLimit: '3',
      })

      const response = await fetch(`/api/file-vault/search?${params}`)
      if (response.ok) {
        const data = await response.json()
        if (data.grouped) {
          setSearchPreviewGroups(data.folderGroups || [])
        }
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }, [])

  // Debounced search
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }

    // If empty, clear results
    if (!value.trim()) {
      setSearchPreviewGroups([])
      setShowSearchPreview(false)
      return
    }

    // Debounce search (300ms)
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(value)
    }, 300)
  }, [performSearch])

  // Navigate to folder from search results
  const handleSearchFolderSelect = useCallback((folderId: string | null) => {
    setShowSearchPreview(false)
    setSelectedSearchFolder(folderId)

    if (folderId === null) {
      setCurrentFolderId(null)
      setBreadcrumbs([{ id: null, name: 'Failid' }])
    } else {
      const group = searchPreviewGroups.find(g => g.folder.id === folderId)
      if (group) {
        setCurrentFolderId(folderId)
        setBreadcrumbs([
          { id: null, name: 'Failid' },
          { id: folderId, name: group.folder.name }
        ])
      }
    }

    // Keep search query for filtering
    setSelectedItems([])
  }, [searchPreviewGroups])

  // Close search preview when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchInputRef.current && !searchInputRef.current.contains(e.target as Node)) {
        // Only close if clicking outside search area
        const searchArea = (e.target as HTMLElement).closest('[data-search-area]')
        if (!searchArea) {
          setShowSearchPreview(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Create new collection
  const handleCreateCollection = async () => {
    if (!vaultIdRef.current || !newCollectionName.trim()) return

    setIsCreatingCollection(true)
    try {
      const response = await fetch('/api/file-vault/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vaultId: vaultIdRef.current,
          name: newCollectionName.trim(),
        }),
      })

      if (response.ok) {
        setNewCollectionName('')
        setShowNewCollectionDialog(false)
        await fetchCollections()
      } else {
        const data = await response.json()
        alert(data.error || 'Kollektsiooni loomine ebaõnnestus')
      }
    } catch (error) {
      console.error('Error creating collection:', error)
      alert('Kollektsiooni loomine ebaõnnestus')
    } finally {
      setIsCreatingCollection(false)
    }
  }

  // Initial load - runs once to fetch vault
  useEffect(() => {
    if (isInitialLoadDone.current) return

    const loadInitialData = async () => {
      setIsLoading(true)
      setError(null)

      const vaultId = await fetchVault()
      if (vaultId) {
        await Promise.all([
          fetchFolders(vaultId, null),
          fetchFiles(vaultId, null, 0, false)
        ])
      }
      setIsLoading(false)
      isInitialLoadDone.current = true
    }
    loadInitialData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Folder navigation - only runs when folder changes (not on initial load)
  useEffect(() => {
    if (!isInitialLoadDone.current || !vaultIdRef.current) return

    const loadFolderData = async () => {
      setIsLoading(true)
      setFiles([])
      setFolders([])
      setHasMoreFiles(true)

      const filter = activeTab === 'my-files' ? 'my-files' : 'all'
      await Promise.all([
        fetchFolders(vaultIdRef.current!, currentFolderId),
        fetchFiles(vaultIdRef.current!, currentFolderId, 0, false, filter)
      ])
      setIsLoading(false)
    }
    loadFolderData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentFolderId])

  // Tab change handler
  useEffect(() => {
    if (!isInitialLoadDone.current || !vaultIdRef.current) return

    const loadTabData = async () => {
      if (activeTab === 'all' || activeTab === 'my-files') {
        // Reload files with the appropriate filter
        setIsLoading(true)
        setFiles([])
        setHasMoreFiles(true)
        const filter = activeTab === 'my-files' ? 'my-files' : 'all'
        await fetchFiles(vaultIdRef.current!, currentFolderId, 0, false, filter)
        setIsLoading(false)
      } else if (activeTab === 'organize') {
        await fetchCollections()
      } else if (activeTab === 'shares') {
        await fetchShares()
      } else if (activeTab === 'statistics') {
        await fetchStatistics()
      }
    }
    loadTabData()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab])

  // Refresh content
  const handleRefresh = async () => {
    if (!vault) return
    setIsRefreshing(true)
    setFiles([])
    setHasMoreFiles(true)

    await Promise.all([
      fetchFolders(vault.id, currentFolderId),
      fetchFiles(vault.id, currentFolderId, 0, false)
    ])
    setIsRefreshing(false)

    // Reset infinite loader
    if (infiniteLoaderRef.current) {
      infiniteLoaderRef.current.resetloadMoreItemsCache()
    }
  }

  // Navigate to folder - synchronous, useEffect handles data loading
  const navigateToFolder = useCallback((folder: FolderItem | null) => {
    if (!vaultIdRef.current) return

    if (folder === null) {
      setCurrentFolderId(null)
      setBreadcrumbs([{ id: null, name: 'Failid' }])
    } else {
      setCurrentFolderId(folder.id)
      setBreadcrumbs([
        { id: null, name: 'Failid' },
        { id: folder.id, name: folder.name }
      ])
    }

    setSelectedItems([])
  }, [])

  // State for new folder parent (for creating subfolders from tree)
  const [newFolderParentId, setNewFolderParentId] = useState<string | null>(null)

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
          parentId: newFolderParentId ?? currentFolderId,
          name: newFolderName.trim(),
          description: newFolderDescription.trim() || null,
          visibility: newFolderVisibility,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create folder')
      }

      // Reset form
      setNewFolderName('')
      setNewFolderDescription('')
      setNewFolderVisibility('public')
      setShowNewFolderDialog(false)
      setNewFolderParentId(null)

      // Refresh both the folder list and the file tree
      await fetchFolders(vault.id, currentFolderId)
      fileTreeRef.current?.refresh()
    } catch (err) {
      console.error('Error creating folder:', err)
      alert((err as Error).message)
    } finally {
      setIsCreatingFolder(false)
    }
  }

  // Open new folder dialog with optional parent
  const openNewFolderDialog = useCallback((parentId: string | null = null) => {
    setNewFolderParentId(parentId)
    setNewFolderName('')
    setNewFolderDescription('')
    setNewFolderVisibility('public')
    setShowNewFolderDialog(true)
  }, [])

  // Upload complete handler
  const handleUploadComplete = async () => {
    if (vault) {
      setFiles([])
      setHasMoreFiles(true)
      await fetchFiles(vault.id, currentFolderId, 0, false)
    }
  }

  // Toggle selection
  const toggleSelect = useCallback((id: string) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    )
  }, [])

  // Open file preview
  const handlePreview = useCallback((file: FileItem) => {
    setPreviewFileId(file.id)
    setShowPreviewDialog(true)
  }, [])

  // Open info sidebar
  const handleShowInfo = useCallback((file: FileItem) => {
    setInfoFileId(file.id)
    setShowInfoSidebar(true)
  }, [])

  // Open share dialog - supports single file
  const handleShare = useCallback((file: FileItem) => {
    setShareFileIds([file.id])
    setShareFileNames([file.name])
    setShowShareDialog(true)
  }, [])

  // Share selected files - supports multiple files
  const handleShareSelected = useCallback(() => {
    if (selectedItems.length === 0) return

    // Filter to only files (not folders)
    const selectedFiles = files.filter(f => selectedItems.includes(f.id))
    if (selectedFiles.length === 0) return

    setShareFileIds(selectedFiles.map(f => f.id))
    setShareFileNames(selectedFiles.map(f => f.name))
    setShowShareDialog(true)
  }, [selectedItems, files])

  // Download file - fetch as blob to force download instead of opening
  const handleDownload = useCallback(async (file: FileItem) => {
    try {
      const response = await fetch(`/api/file-vault/download/${file.id}`)
      if (response.ok) {
        const data = await response.json()

        // Fetch the actual file as a blob to force download
        const fileResponse = await fetch(data.downloadUrl)
        const blob = await fileResponse.blob()

        // Create blob URL and trigger download
        const blobUrl = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = blobUrl
        link.download = file.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)

        // Clean up blob URL
        URL.revokeObjectURL(blobUrl)
      } else {
        alert('Allalaadimine ebaõnnestus')
      }
    } catch (error) {
      console.error('Download error:', error)
      alert('Allalaadimine ebaõnnestus')
    }
  }, [])

  // Download selected files
  const handleDownloadSelected = async () => {
    for (const id of selectedItems) {
      const file = files.find(f => f.id === id)
      if (file) {
        await handleDownload(file)
      }
    }
  }

  // Delete file - optimistic update
  const handleDelete = useCallback(async (fileId: string, permanent: boolean = false) => {
    if (!confirm(permanent ? 'Kas oled kindel, et soovid faili lõplikult kustutada?' : 'Kas oled kindel, et soovid faili prügikasti teisaldada?')) {
      return
    }

    // Optimistic update - remove from UI immediately
    const previousFiles = files
    setFiles(prev => prev.filter(f => f.id !== fileId))
    setSelectedItems(prev => prev.filter(id => id !== fileId))

    try {
      const url = `/api/file-vault/files/${fileId}${permanent ? '?permanent=true' : ''}`
      const response = await fetch(url, { method: 'DELETE' })

      if (!response.ok) {
        // Revert on error
        setFiles(previousFiles)
        const data = await response.json()
        alert(data.error || 'Kustutamine ebaõnnestus')
      }
    } catch (error) {
      // Revert on error
      setFiles(previousFiles)
      console.error('Delete error:', error)
      alert('Kustutamine ebaõnnestus')
    }
  }, [files])

  // Delete selected files
  const handleDeleteSelected = async () => {
    if (!confirm(`Kas oled kindel, et soovid ${selectedItems.length} faili prügikasti teisaldada?`)) {
      return
    }

    for (const id of selectedItems) {
      await handleDelete(id, false)
    }
  }

  // Star/unstar file
  const handleStar = useCallback((fileId: string) => {
    // Toggle star status (would need backend support)
    // For now, just show visual feedback - instant update
    setFiles(prev => prev.map(f =>
      f.id === fileId
        ? { ...f, isStarred: !(f as FileItem & { isStarred?: boolean }).isStarred }
        : f
    ))
  }, [])

  // Filter by search (client-side for already loaded items)
  const filteredFolders = useMemo(() =>
    folders.filter((folder) =>
      folder.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [folders, searchQuery]
  )

  const filteredFiles = useMemo(() =>
    files.filter((file) =>
      file.name.toLowerCase().includes(searchQuery.toLowerCase())
    ), [files, searchQuery]
  )

  // Combined items for display
  const allItems: DisplayItem[] = useMemo(() => [
    ...filteredFolders.map((f) => ({ ...f, type: 'folder' as const })),
    ...filteredFiles.map((f) => ({ ...f, type: 'file' as const })),
  ], [filteredFolders, filteredFiles])

  // Infinite loader helpers
  const isItemLoaded = useCallback((index: number) => {
    return !hasMoreFiles || index < allItems.length
  }, [hasMoreFiles, allItems.length])

  const itemCount = hasMoreFiles ? allItems.length + 1 : allItems.length

  // Virtual list row renderer with enhanced features
  const VirtualListRow = useCallback(({ index, style }: { index: number; style: React.CSSProperties }) => {
    // Loading row
    if (!isItemLoaded(index)) {
      return (
        <div style={style} className="flex items-center justify-center p-4">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
          <span className="ml-2 text-sm text-slate-500">Laadin...</span>
        </div>
      )
    }

    const item = allItems[index]
    if (!item) return null

    const isFolder = item.type === 'folder'
    const fileItem = item as FileItem
    const Icon = isFolder ? Folder : getFileIcon(fileItem.mimeType, fileItem.extension)
    const isSelected = selectedItems.includes(item.id)

    return (
      <div
        style={style}
        className={`flex items-center border-b border-slate-100 hover:bg-slate-50 transition-colors ${
          isSelected ? 'bg-[#279989]/5' : ''
        }`}
        onDoubleClick={() => {
          if (!isFolder) {
            handlePreview(fileItem)
          }
        }}
      >
        {/* Checkbox - only this selects */}
        <div className="w-10 px-3 flex-shrink-0">
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => toggleSelect(item.id)}
            className="w-4 h-4 rounded cursor-pointer"
          />
        </div>

        {/* Name with icon/thumbnail */}
        <div className="flex-1 min-w-[200px] px-3 py-2 flex items-center gap-3">
          {/* Icon/Thumbnail - clicking opens file preview or navigates folder */}
          <div
            className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0 cursor-pointer bg-slate-100"
            onClick={() => {
              if (isFolder) {
                navigateToFolder(item as FolderItem)
              } else {
                handlePreview(fileItem)
              }
            }}
            onMouseEnter={(e) => {
              if (!isFolder && fileItem.thumbnailMedium) {
                const rect = e.currentTarget.getBoundingClientRect()
                setHoverPreviewFile(fileItem)
                setHoverPreviewPosition({ x: rect.right + 10, y: rect.top })
              }
            }}
            onMouseLeave={() => setHoverPreviewFile(null)}
          >
            {!isFolder && fileItem.thumbnailSmall ? (
              <img
                src={fileItem.thumbnailSmall}
                alt=""
                className="w-full h-full object-cover rounded"
              />
            ) : (
              <Icon
                className="w-4 h-4"
                style={{ color: '#64748b' }}
              />
            )}
          </div>

          {/* File name */}
          <span
            className={`text-sm text-slate-900 truncate ${isFolder ? 'cursor-pointer hover:text-[#279989]' : ''}`}
            onClick={() => {
              if (isFolder) {
                navigateToFolder(item as FolderItem)
              }
            }}
          >
            {item.name}
          </span>
        </div>

        {/* Type badge */}
        <div className="w-20 px-3 flex-shrink-0 hidden sm:block">
          {!isFolder ? (
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getFileTypeColor(fileItem.mimeType, fileItem.extension)}`}>
              {getFileTypeLabel(fileItem.mimeType, fileItem.extension)}
            </span>
          ) : (
            <span className="text-xs text-slate-400">Kaust</span>
          )}
        </div>

        {/* Size */}
        <div className="w-24 px-3 text-sm text-slate-500 flex-shrink-0 hidden md:block">
          {isFolder ? '-' : formatFileSize(fileItem.sizeBytes)}
        </div>

        {/* Date */}
        <div className="w-28 px-3 text-sm text-slate-500 flex-shrink-0 hidden lg:block">
          {formatDate(item.createdAt)}
        </div>

        {/* Actions */}
        <div className="w-28 px-3 flex-shrink-0">
          <div className="flex items-center justify-end gap-1">
            {!isFolder && (
              <>
                <button
                  onClick={() => handlePreview(fileItem)}
                  className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                  title="Eelvaade"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDownload(fileItem)}
                  className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                  title="Laadi alla"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleShare(fileItem)}
                  className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                  title="Jaga"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleShowInfo(fileItem)}
                  className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                  title="Info"
                >
                  <Info className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id, false)}
                  className="p-1.5 rounded hover:bg-red-50 text-slate-500 hover:text-red-600"
                  title="Kustuta"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    )
  }, [allItems, selectedItems, isItemLoaded, navigateToFolder, toggleSelect, handlePreview, handleDownload, handleShare, handleShowInfo, handleDelete, setHoverPreviewFile, setHoverPreviewPosition])

  // Calculate container height for virtual list
  const [listHeight, setListHeight] = useState(500)

  useEffect(() => {
    const updateHeight = () => {
      if (listContainerRef.current) {
        const rect = listContainerRef.current.getBoundingClientRect()
        setListHeight(Math.max(300, window.innerHeight - rect.top - 40))
      }
    }
    updateHeight()
    window.addEventListener('resize', updateHeight)
    return () => window.removeEventListener('resize', updateHeight)
  }, [])

  // Handler for folder select from FileTree
  const handleTreeFolderSelect = useCallback((folder: { id: string; name: string; parentId: string | null; path: string } | null) => {
    if (!folder) {
      // Navigate to root
      setCurrentFolderId(null)
      setBreadcrumbs([{ id: null, name: 'Failid' }])
    } else {
      // Navigate to selected folder
      setCurrentFolderId(folder.id)
      setBreadcrumbs([
        { id: null, name: 'Failid' },
        { id: folder.id, name: folder.name }
      ])
    }
    setSelectedItems([])
  }, [])

  return (
    <div className="flex h-[calc(100vh-80px)]">
      {/* File Tree Sidebar */}
      {vault && showFileTree && (
        <div className="w-64 flex-shrink-0 hidden lg:block">
          <FileTree
            ref={fileTreeRef}
            vaultId={vault.id}
            currentFolderId={currentFolderId}
            onFolderSelect={handleTreeFolderSelect}
            onCreateFolder={openNewFolderDialog}
            canManageFolders={true}
          />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        {/* Top Bar with Tabs */}
        <div className="sticky top-0 z-10 bg-white border-b border-slate-200">
          <div className="flex items-center justify-between px-6 py-3">
            {/* Left: Toggle sidebar + Tabs */}
            <div className="flex items-center gap-4">
              {/* Toggle file tree button */}
              <button
                onClick={() => setShowFileTree(!showFileTree)}
                className="hidden lg:flex p-1.5 rounded hover:bg-slate-100 text-slate-500"
                title={showFileTree ? 'Peida failipuu' : 'Näita failipuud'}
              >
                {showFileTree ? (
                  <PanelLeftClose className="w-5 h-5" />
                ) : (
                  <PanelLeft className="w-5 h-5" />
                )}
              </button>

              {/* Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors
                    ${activeTab === 'all'
                      ? 'bg-[#279989]/10 text-[#279989] font-medium'
                      : 'text-slate-600 hover:bg-slate-100'
                    }
                  `}
                >
                  <FolderArchive className="w-4 h-4" />
                  <span>Kõik failid</span>
                </button>
                <button
                  onClick={() => setActiveTab('my-files')}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors
                    ${activeTab === 'my-files'
                      ? 'bg-[#279989]/10 text-[#279989] font-medium'
                      : 'text-slate-600 hover:bg-slate-100'
                    }
                  `}
                >
                  <User className="w-4 h-4" />
                  <span>Minu failid</span>
                </button>
                <button
                  onClick={() => setActiveTab('organize')}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors
                    ${activeTab === 'organize'
                      ? 'bg-[#279989]/10 text-[#279989] font-medium'
                      : 'text-slate-600 hover:bg-slate-100'
                    }
                  `}
                >
                  <FolderHeart className="w-4 h-4" />
                  <span>Organiseeri</span>
                </button>
                <button
                  onClick={() => setActiveTab('shares')}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors
                    ${activeTab === 'shares'
                      ? 'bg-[#279989]/10 text-[#279989] font-medium'
                      : 'text-slate-600 hover:bg-slate-100'
                    }
                  `}
                >
                  <Link2 className="w-4 h-4" />
                  <span>Jagamised</span>
                </button>
                <button
                  onClick={() => setActiveTab('statistics')}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors
                    ${activeTab === 'statistics'
                      ? 'bg-[#279989]/10 text-[#279989] font-medium'
                      : 'text-slate-600 hover:bg-slate-100'
                    }
                  `}
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Statistika</span>
                </button>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              {/* Toggle info sidebar */}
              <button
                onClick={() => {
                  if (selectedItems.length === 1) {
                    const file = files.find(f => f.id === selectedItems[0])
                    if (file) {
                      setInfoFileId(file.id)
                      setShowInfoSidebar(!showInfoSidebar)
                    }
                  } else {
                    setShowInfoSidebar(!showInfoSidebar)
                  }
                }}
                className={`hidden lg:flex p-1.5 rounded hover:bg-slate-100 ${
                  showInfoSidebar ? 'text-[#279989]' : 'text-slate-500'
                }`}
                title={showInfoSidebar ? 'Peida info' : 'Näita infot'}
              >
                {showInfoSidebar ? (
                  <PanelRightClose className="w-5 h-5" />
                ) : (
                  <PanelRight className="w-5 h-5" />
                )}
              </button>

              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => openNewFolderDialog()}
              >
                <FolderPlus className="w-4 h-4" />
                <span className="hidden sm:inline">Uus kaust</span>
              </Button>
              <Button
                size="sm"
                className="gap-2"
                style={{ backgroundColor: '#279989' }}
                onClick={() => setShowUploadDialog(true)}
              >
                <FileUp className="w-4 h-4" />
                <span className="hidden sm:inline">Laadi fail</span>
              </Button>
            </div>
          </div>

          {/* Vault info bar */}
          {vault && (
            <div className="flex items-center justify-between px-6 py-2 bg-slate-50 border-t border-slate-100 text-sm">
              <span className="text-slate-600">
                {vault.name} - {formatFileSize(Number(vault.usedBytes))} / {formatFileSize(Number(vault.quotaBytes))} kasutatud
                {totalFiles > 0 && <span className="ml-2 text-slate-400">({totalFiles} faili)</span>}
              </span>
              <div className="w-32 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(vault.usagePercent || 0, 100)}%`,
                    backgroundColor: (vault.usagePercent || 0) > 90 ? '#ef4444' : '#279989'
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Content area with padding */}
        <div className="p-6 space-y-6">

      {/* Statistics Tab */}
      {activeTab === 'statistics' && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-slate-900">Statistika</h2>

          {isLoadingStats ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#279989]" />
            </div>
          ) : statistics ? (
            <div className="space-y-6">
              {/* Stats cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="p-4">
                  <p className="text-sm text-slate-500">Faile kokku</p>
                  <p className="text-2xl font-bold text-slate-900">{statistics.totalFiles}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-slate-500">Kogumahu</p>
                  <p className="text-2xl font-bold text-slate-900">{formatFileSize(statistics.totalSize)}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-slate-500">Minu üleslaadimised</p>
                  <p className="text-2xl font-bold text-[#279989]">{statistics.myUploads}</p>
                </Card>
                <Card className="p-4">
                  <p className="text-sm text-slate-500">Minu jagamised</p>
                  <p className="text-2xl font-bold text-[#279989]">{statistics.myShares}</p>
                </Card>
              </div>

              {/* Files by type */}
              <Card className="p-6">
                <h3 className="text-lg font-medium text-slate-900 mb-4">Failid tüübi järgi</h3>
                <div className="space-y-3">
                  {statistics.filesByType.map((item) => (
                    <div key={item.type} className="flex items-center gap-4">
                      <div className="w-24 text-sm text-slate-600">{item.type}</div>
                      <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(5, (item.count / statistics.totalFiles) * 100)}%`,
                            backgroundColor: '#279989',
                          }}
                        />
                      </div>
                      <div className="w-16 text-sm text-slate-500 text-right">{item.count}</div>
                      <div className="w-20 text-sm text-slate-400 text-right">{formatFileSize(item.size)}</div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Recent activity */}
              <Card className="p-6">
                <h3 className="text-lg font-medium text-slate-900 mb-4">Viimased tegevused</h3>
                {statistics.recentActivity.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-4">Tegevusi pole veel</p>
                ) : (
                  <div className="space-y-3">
                    {statistics.recentActivity.map((activity, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#279989]" />
                        <div className="flex-1">
                          <p className="text-sm text-slate-900">{activity.fileName}</p>
                          <p className="text-xs text-slate-500">{activity.action}</p>
                        </div>
                        <p className="text-xs text-slate-400">
                          {new Date(activity.date).toLocaleDateString('et-EE')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>
          ) : (
            <Card className="p-12 text-center">
              <BarChart3 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500">Statistikat ei õnnestunud laadida</p>
            </Card>
          )}
        </div>
      )}

      {/* Organize Tab */}
      {activeTab === 'organize' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Organiseeri</h2>
            <Button
              onClick={() => setShowNewCollectionDialog(true)}
              style={{ backgroundColor: '#279989' }}
              className="gap-2"
            >
              <FolderHeart className="w-4 h-4" />
              Uus kollektsioon
            </Button>
          </div>

          <p className="text-slate-500 text-sm">
            Loo oma kollektsioone, et organiseerida faile vastavalt oma vajadustele.
          </p>

          {isLoadingCollections ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#279989]" />
            </div>
          ) : collections.length === 0 ? (
            <Card className="p-12 text-center">
              <FolderHeart className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Kollektsioone pole</h3>
              <p className="text-slate-500 mb-4">
                Loo oma esimene kollektsioon, et alustada failide organiseerimist.
              </p>
              <Button
                onClick={() => setShowNewCollectionDialog(true)}
                style={{ backgroundColor: '#279989' }}
              >
                Loo kollektsioon
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {collections.map((collection) => (
                <Card
                  key={collection.id}
                  className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: '#279989' + '20' }}
                    >
                      <FolderHeart className="w-5 h-5" style={{ color: '#279989' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-slate-900 truncate">{collection.name}</h3>
                      <p className="text-sm text-slate-500">{collection.fileCount} faili</p>
                      {collection.description && (
                        <p className="text-xs text-slate-400 mt-1 truncate">{collection.description}</p>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Shares Tab */}
      {activeTab === 'shares' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Minu jagamised</h2>
          </div>

          {/* Filters */}
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Otsi faili nime või e-posti järgi..."
                  value={sharesSearch}
                  onChange={(e) => setSharesSearch(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Status filter */}
              <select
                value={sharesStatusFilter}
                onChange={(e) => setSharesStatusFilter(e.target.value as 'all' | 'active' | 'expired')}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              >
                <option value="all">Kõik staatused</option>
                <option value="active">Aktiivsed</option>
                <option value="expired">Aegunud</option>
              </select>

              {/* Sort */}
              <select
                value={`${sharesSortBy}-${sharesSortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-')
                  setSharesSortBy(field as 'created_at' | 'expires_at' | 'access_count')
                  setSharesSortOrder(order as 'asc' | 'desc')
                }}
                className="px-3 py-2 border border-slate-200 rounded-lg text-sm bg-white"
              >
                <option value="created_at-desc">Uuemad enne</option>
                <option value="created_at-asc">Vanemad enne</option>
                <option value="access_count-desc">Enim vaadatud</option>
                <option value="expires_at-asc">Aeguvad varsti</option>
              </select>

              <Button
                variant="outline"
                size="icon"
                onClick={() => fetchShares()}
                disabled={isLoadingShares}
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingShares ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </Card>

          {isLoadingShares ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[#279989]" />
            </div>
          ) : shares.length === 0 ? (
            <Card className="p-12 text-center">
              <Link2 className="w-12 h-12 mx-auto text-slate-300 mb-4" />
              <h3 className="text-lg font-medium text-slate-900 mb-2">Jagamisi pole</h3>
              <p className="text-slate-500">
                Sa pole veel ühtegi faili jaganud. Jaga faile, valides need "Kõik failid" vaates.
              </p>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Fail/Kaust</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Jagatud</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Staatus</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Vaatamisi</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-slate-500 uppercase">Aegub</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-slate-500 uppercase">Tegevused</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {shares.map((share) => {
                      const FileIcon = share.fileMimeType ? getFileIcon(share.fileMimeType) : Folder

                      return (
                        <tr key={share.id} className="hover:bg-slate-50 transition-colors">
                          {/* File/Folder info */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center flex-shrink-0">
                                <FileIcon className="w-4 h-4 text-slate-500" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium text-slate-900 truncate max-w-[200px]">
                                  {share.fileName || share.folderName || 'Tundmatu'}
                                </p>
                                {share.fileSizeBytes && (
                                  <p className="text-xs text-slate-500">{formatFileSize(share.fileSizeBytes)}</p>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* Shared with / info */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {share.sharedWithEmail ? (
                                <>
                                  <Mail className="w-4 h-4 text-slate-400" />
                                  <span className="text-sm text-slate-600 truncate max-w-[150px]">{share.sharedWithEmail}</span>
                                </>
                              ) : (
                                <>
                                  <Link2 className="w-4 h-4 text-slate-400" />
                                  <span className="text-sm text-slate-600">Link</span>
                                </>
                              )}
                              {share.hasPassword && (
                                <span title="Parooliga kaitstud">
                                  <Lock className="w-3.5 h-3.5 text-amber-500" />
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5">
                              {formatDate(share.createdAt)}
                            </p>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            {share.status === 'active' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                <CheckCircle className="w-3 h-3" />
                                Aktiivne
                              </span>
                            ) : share.status === 'expired' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                <XCircle className="w-3 h-3" />
                                Aegunud
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                                <AlertCircle className="w-3 h-3" />
                                Limiit täis
                              </span>
                            )}
                          </td>

                          {/* Access count */}
                          <td className="px-4 py-3">
                            <p className="text-sm text-slate-900">{share.accessCount}</p>
                            {share.downloadLimit && (
                              <p className="text-xs text-slate-500">
                                {share.downloadsCount}/{share.downloadLimit} alla laaditud
                              </p>
                            )}
                          </td>

                          {/* Expires */}
                          <td className="px-4 py-3">
                            {share.expiresAt ? (
                              <div className="flex items-center gap-1.5">
                                <Clock className="w-4 h-4 text-slate-400" />
                                <span className="text-sm text-slate-600">
                                  {formatDate(share.expiresAt)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-sm text-slate-400">Ei aegu</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => copyShareUrl(share.shareUrl)}
                                className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                                title="Kopeeri link"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <a
                                href={share.shareUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700"
                                title="Ava link"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => handleDeleteShare(share.id)}
                                className="p-1.5 rounded hover:bg-red-50 text-slate-500 hover:text-red-600"
                                title="Kustuta jagamine"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Files View (all and my-files tabs) */}
      {(activeTab === 'all' || activeTab === 'my-files') && (
        <>
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
          {/* Search with preview */}
          <div className="relative flex-1" data-search-area>
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
            {isSearching && (
              <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 animate-spin z-10" />
            )}
            <Input
              ref={searchInputRef}
              placeholder="Otsi failidest kõikides kaustades..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => {
                if (searchPreviewGroups.length > 0) {
                  setShowSearchPreview(true)
                }
              }}
              className="pl-10 pr-10"
            />

            {/* Search Preview Dropdown */}
            {showSearchPreview && searchPreviewGroups.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-slate-200 shadow-xl z-50 max-h-[400px] overflow-y-auto">
                <div className="p-2 border-b border-slate-100 bg-slate-50 sticky top-0">
                  <p className="text-xs text-slate-500">
                    Leitud <span className="font-medium text-slate-700">{searchPreviewGroups.reduce((sum, g) => sum + g.totalCount, 0)}</span> faili{' '}
                    <span className="font-medium text-slate-700">{searchPreviewGroups.length}</span> kaustast
                  </p>
                </div>

                {searchPreviewGroups.map((group) => {
                  const FolderIcon = Folder

                  return (
                    <div key={group.folder.id || 'root'} className="border-b border-slate-100 last:border-b-0">
                      {/* Folder header - clickable to navigate */}
                      <button
                        onClick={() => handleSearchFolderSelect(group.folder.id)}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-[#279989]/5 transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <FolderIcon className="w-4 h-4 text-slate-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-900 truncate">
                            {group.folder.name}
                          </p>
                          <p className="text-xs text-slate-500 truncate">{group.folder.path}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#279989]/10 text-[#279989]">
                            {group.totalCount} faili
                          </span>
                          <ChevronRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </button>

                      {/* Preview files */}
                      <div className="pl-11 pr-3 pb-2">
                        {group.files.map((file) => {
                          const FileIcon = getFileIcon(file.mimeType)
                          return (
                            <div
                              key={file.id}
                              className="flex items-center gap-2 py-1 text-sm text-slate-600"
                            >
                              {file.thumbnailSmall ? (
                                <img
                                  src={file.thumbnailSmall}
                                  alt=""
                                  className="w-5 h-5 rounded object-cover"
                                />
                              ) : (
                                <FileIcon className="w-4 h-4 text-slate-400" />
                              )}
                              <span className="truncate">{file.name}</span>
                              <span className="text-xs text-slate-400 flex-shrink-0">
                                {formatFileSize(file.sizeBytes)}
                              </span>
                            </div>
                          )
                        })}
                        {group.totalCount > group.files.length && (
                          <p className="text-xs text-slate-400 mt-1">
                            + veel {group.totalCount - group.files.length} faili
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {/* No results message */}
            {showSearchPreview && searchPreviewGroups.length === 0 && !isSearching && searchQuery.trim() && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg border border-slate-200 shadow-xl z-50 p-4 text-center">
                <Search className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm text-slate-500">Faile ei leitud</p>
              </div>
            )}
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
                    className={`p-4 cursor-pointer transition-all hover:shadow-md group relative ${
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
                    {/* Action buttons overlay - only for files */}
                    {!isFolder && (
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleSelect(item.id)
                          }}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isSelected
                              ? 'bg-[#279989] text-white'
                              : 'bg-white/90 text-slate-600 hover:bg-slate-100'
                          }`}
                          title="Vali"
                        >
                          <Star className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDownload(item as FileItem)
                          }}
                          className="p-1.5 bg-white/90 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                          title="Laadi alla"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleShare(item as FileItem)
                          }}
                          className="p-1.5 bg-white/90 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                          title="Jaga"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleShowInfo(item as FileItem)
                          }}
                          className="p-1.5 bg-white/90 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
                          title="Info"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(item.id, false)
                          }}
                          className="p-1.5 bg-white/90 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                          title="Kustuta"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    <div className="flex flex-col items-center text-center">
                      {!isFolder && (item as FileItem).thumbnailSmall ? (
                        <div className="w-16 h-16 rounded-lg overflow-hidden mb-3 bg-slate-100">
                          <img
                            src={(item as FileItem).thumbnailSmall}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>
                      ) : (
                        <div
                          className={`w-16 h-16 rounded-lg flex items-center justify-center mb-3 ${
                            isFolder ? 'bg-amber-100' : 'bg-slate-100'
                          }`}
                        >
                          <Icon
                            className="w-8 h-8"
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

              {/* Load more trigger for grid view */}
              {hasMoreFiles && (
                <Card
                  className="p-4 cursor-pointer hover:bg-slate-50 flex items-center justify-center"
                  onClick={loadMoreFiles}
                >
                  <div className="flex flex-col items-center text-center">
                    {isLoadingMore ? (
                      <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center mb-3">
                          <RefreshCw className="w-6 h-6 text-slate-400" />
                        </div>
                        <p className="text-sm text-slate-600">Laadi rohkem</p>
                      </>
                    )}
                  </div>
                </Card>
              )}
            </div>
          ) : (
            /* List View with Virtual Scrolling */
            <Card className="overflow-hidden">
              {/* Table Header - stays fixed */}
              <div className="flex items-center border-b border-slate-200 bg-slate-50 text-xs font-medium text-slate-500 uppercase">
                <div className="w-10 px-3 py-2 flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === filteredFiles.length && filteredFiles.length > 0}
                    onChange={() => {
                      if (selectedItems.length === filteredFiles.length) {
                        setSelectedItems([])
                      } else {
                        setSelectedItems(filteredFiles.map(f => f.id))
                      }
                    }}
                    className="w-4 h-4 rounded"
                  />
                </div>
                <div className="flex-1 min-w-[200px] px-3 py-2">
                  <button
                    onClick={() => {
                      if (sortColumn === 'name') {
                        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
                      } else {
                        setSortColumn('name')
                        setSortDirection('asc')
                      }
                    }}
                    className="flex items-center gap-1 hover:text-slate-700"
                  >
                    Nimi
                    {sortColumn === 'name' && (
                      <span className="text-[#279989]">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </div>
                <div className="w-20 px-3 py-2 flex-shrink-0 hidden sm:block">
                  <button
                    onClick={() => {
                      if (sortColumn === 'mimeType') {
                        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
                      } else {
                        setSortColumn('mimeType')
                        setSortDirection('asc')
                      }
                    }}
                    className="flex items-center gap-1 hover:text-slate-700"
                  >
                    Tüüp
                    {sortColumn === 'mimeType' && (
                      <span className="text-[#279989]">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </div>
                <div className="w-24 px-3 py-2 flex-shrink-0 hidden md:block">
                  <button
                    onClick={() => {
                      if (sortColumn === 'sizeBytes') {
                        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
                      } else {
                        setSortColumn('sizeBytes')
                        setSortDirection('desc')
                      }
                    }}
                    className="flex items-center gap-1 hover:text-slate-700"
                  >
                    Suurus
                    {sortColumn === 'sizeBytes' && (
                      <span className="text-[#279989]">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </div>
                <div className="w-28 px-3 py-2 flex-shrink-0 hidden lg:block">
                  <button
                    onClick={() => {
                      if (sortColumn === 'createdAt') {
                        setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
                      } else {
                        setSortColumn('createdAt')
                        setSortDirection('desc')
                      }
                    }}
                    className="flex items-center gap-1 hover:text-slate-700"
                  >
                    Lisatud
                    {sortColumn === 'createdAt' && (
                      <span className="text-[#279989]">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                </div>
                <div className="w-28 px-3 py-2 text-right flex-shrink-0">
                  Tegevused
                </div>
              </div>

              {/* Virtual Scrolling Body */}
              <div ref={listContainerRef}>
                {allItems.length > 0 ? (
                  <InfiniteLoader
                    ref={infiniteLoaderRef}
                    isItemLoaded={isItemLoaded}
                    itemCount={itemCount}
                    loadMoreItems={loadMoreFiles}
                    threshold={10}
                  >
                    {({ onItemsRendered, ref }) => (
                      <VirtualList
                        ref={ref}
                        height={listHeight}
                        itemCount={itemCount}
                        itemSize={LIST_ROW_HEIGHT}
                        width="100%"
                        onItemsRendered={onItemsRendered}
                        overscanCount={5}
                      >
                        {VirtualListRow}
                      </VirtualList>
                    )}
                  </InfiniteLoader>
                ) : (
                  <div className="py-8 text-center text-slate-500">
                    Andmeid ei leitud
                  </div>
                )}
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
            {searchQuery ? 'Faile ei leitud' : activeTab === 'my-files' ? 'Sul pole veel faile' : 'Kaust on tühi'}
          </h3>
          <p className="mt-2 text-slate-500">
            {searchQuery
              ? 'Proovi muuta otsingut'
              : activeTab === 'my-files' ? 'Laadi failid, et neid siin näha' : 'Laadi failid või loo uus kaust'}
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
        </>
      )}
      {/* End of Files View */}

        </div>
        {/* End of Content area */}
      </div>
      {/* End of Main Content */}

      {/* Info Sidebar (Right) */}
      {vault && showInfoSidebar && (
        <FileInfoSidebar
          open={showInfoSidebar}
          onClose={() => setShowInfoSidebar(false)}
          fileId={infoFileId}
          onDownload={() => {
            const file = files.find(f => f.id === infoFileId)
            if (file) handleDownload(file)
          }}
          onShare={() => {
            const file = files.find(f => f.id === infoFileId)
            if (file) {
              setShareFileIds([file.id])
              setShareFileNames([file.name])
              setShowShareDialog(true)
            }
          }}
          onDelete={() => {
            if (infoFileId) {
              handleDelete(infoFileId, false)
              setShowInfoSidebar(false)
            }
          }}
        />
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
              <h3 className="text-lg font-semibold text-slate-900 mb-4">
                {newFolderParentId ? 'Uus alamkaust' : 'Uus kaust'}
              </h3>
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
                  setNewFolderParentId(null)
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

      {/* New Collection Dialog */}
      {showNewCollectionDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white rounded-xl shadow-xl">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Uus kollektsioon</h3>
              <Input
                placeholder="Kollektsiooni nimi"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateCollection()
                  }
                }}
                autoFocus
              />
            </div>
            <div className="flex items-center gap-3 p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
              <Button
                variant="outline"
                onClick={() => {
                  setShowNewCollectionDialog(false)
                  setNewCollectionName('')
                }}
                disabled={isCreatingCollection}
                className="flex-1"
              >
                Tühista
              </Button>
              <Button
                onClick={handleCreateCollection}
                disabled={!newCollectionName.trim() || isCreatingCollection}
                className="flex-1 bg-[#279989] hover:bg-[#1e7a6d] text-white"
              >
                {isCreatingCollection ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loon...
                  </>
                ) : (
                  'Loo kollektsioon'
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Share Dialog */}
      {vault && shareFileIds.length > 0 && (
        <ShareDialog
          open={showShareDialog}
          onOpenChange={(open) => {
            setShowShareDialog(open)
            if (!open) {
              setShareFileIds([])
              setShareFileNames([])
            }
          }}
          vaultId={vault.id}
          fileIds={shareFileIds}
          fileNames={shareFileNames}
        />
      )}

      {/* Preview Dialog */}
      {vault && previewFileId && (
        <FilePreviewDialog
          open={showPreviewDialog}
          onOpenChange={(open) => {
            setShowPreviewDialog(open)
            if (!open) setPreviewFileId(null)
          }}
          fileId={previewFileId}
          vaultId={vault.id}
          onShare={() => {
            const file = files.find(f => f.id === previewFileId)
            if (file) {
              setShowPreviewDialog(false)
              setShareFileIds([file.id])
              setShareFileNames([file.name])
              setShowShareDialog(true)
            }
          }}
        />
      )}

      {/* Floating Selection Toolbar - appears at bottom when items selected */}
      {selectedItems.length > 0 && (activeTab === 'all' || activeTab === 'my-files') && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 animate-in slide-in-from-bottom-4 duration-200">
          <div className="flex items-center gap-3 px-4 py-2.5 bg-white rounded-xl shadow-lg border border-slate-200">
            <span className="text-sm font-medium text-slate-700 pr-2 border-r border-slate-200">
              {selectedItems.length} valitud
            </span>
            <button
              onClick={handleDownloadSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Laadi alla</span>
            </button>
            <button
              onClick={handleShareSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Jaga</span>
            </button>
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              <span className="hidden sm:inline">Kustuta</span>
            </button>
            <div className="pl-2 border-l border-slate-200">
              <button
                onClick={() => setSelectedItems([])}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                title="Tühista valik"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hover Preview Popup - shows larger thumbnail on hover */}
      {hoverPreviewFile && hoverPreviewFile.thumbnailMedium && (
        <div
          className="fixed z-50 pointer-events-none animate-in fade-in duration-150"
          style={{
            left: Math.min(hoverPreviewPosition.x, window.innerWidth - 220),
            top: Math.max(10, Math.min(hoverPreviewPosition.y, window.innerHeight - 170)),
          }}
        >
          <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-2">
            <img
              src={hoverPreviewFile.thumbnailMedium}
              alt={hoverPreviewFile.name}
              className="w-48 h-36 object-cover rounded"
            />
            <p className="text-xs text-slate-600 mt-1 truncate max-w-[192px]">
              {hoverPreviewFile.name}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
