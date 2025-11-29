/**
 * FILE VAULT - TypeScript Types
 * Enterprise File Management System
 */

// =============================================
// VAULT CONFIGURATION
// =============================================

export interface VaultConfig {
  // Upload settings
  maxFileSize: number              // Bytes
  allowedTypes: string[]           // MIME types or extensions
  enableChunkedUpload: boolean
  chunkSize: number                // Bytes (default 5MB)

  // Security
  enableVirusScan: boolean
  requireApproval: boolean         // Admin approval for uploads

  // Versioning
  enableVersioning: boolean
  maxVersions: number

  // Sharing
  defaultShareExpiry: number       // Days
  allowPublicSharing: boolean
  requirePasswordForPublic: boolean

  // Display (Admin configurable per user group!)
  defaultView: FileViewType
  viewSettings: ViewSettings
  tableColumns: string[]           // Default columns to show

  // Storage
  storageProvider: 'supabase' | 's3' | 'r2'
  storageConfig: StorageProviderConfig

  // User group configurations (Admin can customize per group)
  groupConfigs?: Record<string, GroupViewConfig>
}

// =============================================
// VIEW TYPES & CONFIGURATION
// =============================================

export type FileViewType =
  | 'grid'       // Icon grid view (large icons)
  | 'list'       // Compact list view
  | 'table'      // Full table with columns
  | 'gallery'    // Image gallery (thumbnails)
  | 'timeline'   // Timeline view by date
  | 'kanban'     // Kanban board by status

export interface ViewSettings {
  // Grid view settings
  grid: GridViewSettings
  // List view settings
  list: ListViewSettings
  // Table view settings
  table: TableViewSettings
  // Gallery view settings
  gallery: GalleryViewSettings
  // Timeline view settings
  timeline: TimelineViewSettings
  // Kanban view settings
  kanban: KanbanViewSettings
}

export interface GridViewSettings {
  iconSize: 'small' | 'medium' | 'large' | 'xlarge' // 48, 64, 96, 128px
  showFileNames: boolean
  showFileSize: boolean
  showFileDate: boolean
  showThumbnails: boolean
  itemsPerRow: number         // Auto, 4, 6, 8
  spacing: 'compact' | 'normal' | 'relaxed'
}

export interface ListViewSettings {
  showIcon: boolean
  showThumbnail: boolean
  showFileSize: boolean
  showModifiedDate: boolean
  showOwner: boolean
  showTags: boolean
  compact: boolean
}

export interface TableViewSettings {
  columns: TableColumnConfig[]
  showHeaderFilters: boolean
  rowHeight: 'compact' | 'normal' | 'comfortable'
  enableSorting: boolean
  enableColumnReorder: boolean
  enableColumnResize: boolean
  stickyHeader: boolean
}

export interface TableColumnConfig {
  field: string
  label: string
  width?: number
  minWidth?: number
  visible: boolean
  sortable: boolean
  filterable: boolean
  align: 'left' | 'center' | 'right'
  format?: 'text' | 'date' | 'size' | 'user' | 'tags' | 'thumbnail'
}

export interface GalleryViewSettings {
  thumbnailSize: 'small' | 'medium' | 'large' // 150, 250, 400px
  showFileName: boolean
  showOverlay: boolean           // Show info on hover
  aspectRatio: '1:1' | '4:3' | '16:9' | 'auto'
  enableLightbox: boolean
  enableZoom: boolean
  columnsCount: 2 | 3 | 4 | 5 | 6
}

export interface TimelineViewSettings {
  groupBy: 'day' | 'week' | 'month' | 'year'
  showThumbnails: boolean
  showFileInfo: boolean
}

export interface KanbanViewSettings {
  groupByField: string          // e.g., 'status', 'project', 'tag'
  columns: KanbanColumn[]
  cardFields: string[]          // Which fields to show on cards
  showThumbnail: boolean
}

export interface KanbanColumn {
  id: string
  label: string
  color: string
  limit?: number               // WIP limit
}

// =============================================
// USER GROUP VIEW CONFIGURATION (Admin Panel)
// =============================================

export interface GroupViewConfig {
  groupId: string
  groupName: string

  // Allowed views for this group
  allowedViews: FileViewType[]
  defaultView: FileViewType

  // View-specific overrides
  viewSettings: Partial<ViewSettings>

  // Permissions
  canUpload: boolean
  canDownload: boolean
  canShare: boolean
  canDelete: boolean
  canCreateFolders: boolean
  canBulkOperations: boolean

  // UI Customization
  showSidebar: boolean
  showBreadcrumbs: boolean
  showSearch: boolean
  showFilters: boolean
  showSortOptions: boolean
  showViewSwitcher: boolean

  // File type filters
  visibleFileTypes: string[]    // Empty = all types
  hiddenFolders: string[]       // Folder IDs to hide
}

// =============================================
// ADMIN PANEL SETTINGS
// =============================================

export interface FileVaultAdminSettings {
  // Global settings
  globalDefaults: VaultConfig

  // Per-tenant overrides
  tenantOverrides?: Partial<VaultConfig>

  // User group configurations
  groupConfigs: GroupViewConfig[]

  // Custom branding
  branding: FileVaultBranding
}

export interface FileVaultBranding {
  // Colors
  primaryColor: string
  secondaryColor: string
  accentColor: string

  // Icons
  folderIcon: string            // Custom folder icon
  fileIcons: Record<string, string>  // Extension -> icon mapping

  // Labels (i18n)
  labels: Record<string, string>

  // Custom CSS
  customCss?: string
}

export interface StorageProviderConfig {
  // Supabase
  supabaseUrl?: string
  supabaseBucket?: string

  // S3-compatible
  s3Endpoint?: string
  s3Bucket?: string
  s3Region?: string
  s3AccessKey?: string
  s3SecretKey?: string
}

// =============================================
// FILE METADATA
// =============================================

export interface FileMetadata {
  // Standard
  name: string
  size: number
  type: string
  lastModified: number

  // Custom (Ultra Table integration!)
  [key: string]: unknown
}

export interface FileUploadProgress {
  sessionId: string
  filename: string
  totalSize: number
  uploadedSize: number
  progress: number           // 0-100
  speed: number              // Bytes per second
  estimatedTimeRemaining: number  // Seconds
  chunks: ChunkProgress[]
}

export interface ChunkProgress {
  index: number
  size: number
  uploaded: boolean
  progress: number
}

// =============================================
// SEARCH TYPES
// =============================================

export interface FileSearchParams {
  vaultId: string
  query?: string
  filters?: FileFilters
  page?: number
  pageSize?: number
  sort?: {
    field: string
    order: 'asc' | 'desc'
  }
}

export interface FileFilters {
  extension?: string
  project?: string
  status?: string
  tags?: string[]
  dateFrom?: Date
  dateTo?: Date
  mimeType?: string
  minSize?: number
  maxSize?: number
  ownerId?: string
  folderId?: string
}

export interface FileSearchResult {
  fileIds: string[]
  total: number
  took: number  // milliseconds
  facets: FileFacets
}

export interface FileFacets {
  extensions: FacetBucket[]
  projects: FacetBucket[]
  statuses: FacetBucket[]
  tags: FacetBucket[]
}

export interface FacetBucket {
  key: string
  doc_count: number
}

// =============================================
// PAGINATED RESULTS
// =============================================

export interface PaginatedFiles {
  files: FileRecord[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
  facets: FileFacets
  took: number
}

// =============================================
// FILE RECORD (from database)
// =============================================

export interface FileRecord {
  id: string
  vaultId: string
  folderId?: string

  name: string
  path: string

  storageProvider: string
  storageBucket: string
  storagePath: string
  storageKey: string

  mimeType: string
  sizeBytes: bigint
  extension: string

  checksumMd5: string
  checksumSha256?: string

  width?: number
  height?: number
  duration?: number

  thumbnailSmall?: string
  thumbnailMedium?: string
  thumbnailLarge?: string

  metadata: Record<string, unknown>

  version: number
  isLatest: boolean
  parentFileId?: string

  isPublic: boolean
  ownerId: string

  scannedAt?: Date
  isSafe: boolean
  indexedAt?: Date

  createdAt: Date
  updatedAt: Date

  tags?: string[]
}

// =============================================
// SHARE TYPES
// =============================================

export type SharePermission = 'view' | 'download' | 'edit'

export type FilePermissionType = 'view' | 'comment' | 'download' | 'edit' | 'manage' | 'owner'

export interface ShareLink {
  id: string
  shortCode: string
  url: string
  shortUrl: string
  permission: SharePermission
  expiresAt: Date | null
  maxDownloads: number | null
  downloadCount: number
  viewCount: number
  hasPassword: boolean
  requireEmail: boolean
}

export interface CreateShareOptions {
  permission: SharePermission
  password?: string
  expiresIn?: number        // Days
  maxDownloads?: number
  requireEmail?: boolean
  allowedEmails?: string[]
}

// =============================================
// FOLDER TYPES
// =============================================

export interface FolderRecord {
  id: string
  vaultId: string
  parentId?: string
  name: string
  path: string
  color?: string
  icon?: string
  isPublic: boolean
  ownerId: string
  createdAt: Date
  updatedAt: Date
  children?: FolderRecord[]
  files?: FileRecord[]
}

// =============================================
// UPLOAD SESSION
// =============================================

export interface UploadSession {
  id: string
  vaultId: string
  filename: string
  sizeBytes: bigint
  mimeType: string
  chunkSize: number
  totalChunks: number
  uploadedChunks: number[]
  storageProvider: string
  storageBucket: string
  storageKey: string
  uploadId?: string
  metadata: Record<string, unknown>
  status: 'in_progress' | 'completed' | 'failed' | 'cancelled'
  errorMessage?: string
  resumeToken: string
  createdAt: Date
  updatedAt: Date
  expiresAt: Date
}

// =============================================
// ACCESS LOG
// =============================================

export type FileAction =
  | 'view'
  | 'download'
  | 'upload'
  | 'delete'
  | 'share'
  | 'rename'
  | 'move'

export interface FileAccessLog {
  id: string
  fileId?: string
  shareId?: string
  action: FileAction
  ipAddress: string
  userAgent?: string
  userId?: string
  bytesTransferred?: bigint
  createdAt: Date
}

// =============================================
// STORAGE QUOTA
// =============================================

export interface StorageQuotaInfo {
  id: string
  tenantId: string
  userId?: string
  quotaBytes: bigint
  usedBytes: bigint
  fileCount: number
  usagePercent: number
  isWarning: boolean      // >80%
  isLimitReached: boolean // >=100%
}

// =============================================
// ANALYTICS
// =============================================

export interface VaultAnalytics {
  usedBytes: bigint
  quotaBytes: bigint
  fileCount: number
  folderCount: number
  shareCount: number
  fileTypeDistribution: FileTypeDistribution[]
  topUsers: TopUser[]
  largestFiles: FileRecord[]
  recentActivity: FileAccessLog[]
}

export interface FileTypeDistribution {
  type: string
  sizeBytes: bigint
  count: number
}

export interface TopUser {
  id: string
  name: string
  email: string
  usedBytes: bigint
  fileCount: number
}

// =============================================
// FILE PREVIEW SYSTEM (Inline viewing)
// =============================================

/**
 * Supported preview types for inline file viewing
 * Without downloading the file
 */
export type PreviewType =
  | 'image'      // JPG, PNG, GIF, WebP, SVG
  | 'video'      // MP4, WebM, MOV
  | 'audio'      // MP3, WAV, OGG
  | 'pdf'        // PDF documents
  | 'text'       // TXT, MD, JSON, XML, YML, LOG
  | 'code'       // JS, TS, PY, SQL, HTML, CSS, etc.
  | 'word'       // DOC, DOCX (via mammoth.js / docx-preview)
  | 'excel'      // XLS, XLSX (via SheetJS)
  | 'powerpoint' // PPT, PPTX (via pptx-preview)
  | 'archive'    // ZIP, RAR, 7Z (show contents)
  | 'cad'        // DWG, DXF (via AutoCAD viewer)
  | 'model3d'    // OBJ, GLTF, STL (via three.js)
  | 'unsupported'

export interface FilePreviewConfig {
  // Which file types are previewable
  previewableExtensions: Record<string, PreviewType>

  // Preview settings per type
  imagePreview: ImagePreviewSettings
  videoPreview: VideoPreviewSettings
  documentPreview: DocumentPreviewSettings
  codePreview: CodePreviewSettings
  spreadsheetPreview: SpreadsheetPreviewSettings
}

export interface ImagePreviewSettings {
  enableZoom: boolean
  enablePan: boolean
  enableRotate: boolean
  enableFullscreen: boolean
  maxZoomLevel: number
  showExifData: boolean
}

export interface VideoPreviewSettings {
  autoplay: boolean
  muted: boolean
  showControls: boolean
  enableLoop: boolean
  enablePictureInPicture: boolean
  defaultQuality: 'auto' | '1080p' | '720p' | '480p'
}

export interface DocumentPreviewSettings {
  // Word/PDF preview
  showPageNumbers: boolean
  enableTextSelection: boolean
  enableSearch: boolean
  enablePrint: boolean
  defaultZoom: number          // 100 = 100%
  pageFit: 'width' | 'height' | 'page'

  // Word-specific
  wordConverter: 'mammoth' | 'docx-preview' | 'office-viewer'
}

export interface CodePreviewSettings {
  theme: 'vs-dark' | 'vs-light' | 'github-dark' | 'dracula'
  fontSize: number
  showLineNumbers: boolean
  wordWrap: boolean
  enableSyntaxHighlighting: boolean
  maxFileSize: number          // Max file size to preview (bytes)
}

export interface SpreadsheetPreviewSettings {
  // Excel preview
  showSheetTabs: boolean
  enableCellSelection: boolean
  showGridLines: boolean
  showFormulas: boolean
  freezeFirstRow: boolean
  freezeFirstColumn: boolean
  defaultSheetIndex: number
  maxRowsToPreview: number     // Performance limit
  maxColumnsToPreview: number
}

/**
 * Preview result returned by preview service
 */
export interface FilePreviewResult {
  fileId: string
  previewType: PreviewType
  isSupported: boolean

  // Preview content (depends on type)
  content?: {
    // For text/code/markdown
    text?: string

    // For images
    imageUrl?: string
    thumbnails?: {
      small: string
      medium: string
      large: string
    }

    // For documents (PDF/Word)
    pageCount?: number
    pages?: DocumentPage[]

    // For spreadsheets
    sheets?: SpreadsheetSheet[]

    // For videos
    videoUrl?: string
    duration?: number
    thumbnail?: string

    // For archives
    archiveContents?: ArchiveEntry[]
  }

  // Metadata
  originalSize: number
  previewGeneratedAt: Date
  expiresAt?: Date
}

export interface DocumentPage {
  pageNumber: number
  imageUrl?: string           // Rendered image
  textContent?: string        // Extracted text
  width: number
  height: number
}

export interface SpreadsheetSheet {
  index: number
  name: string
  data: (string | number | boolean | null)[][]  // 2D array
  columnWidths: number[]
  rowHeights: number[]
  mergedCells?: MergedCell[]
}

export interface MergedCell {
  startRow: number
  startCol: number
  endRow: number
  endCol: number
}

export interface ArchiveEntry {
  path: string
  name: string
  size: number
  compressedSize: number
  isDirectory: boolean
  modifiedAt: Date
}

/**
 * Default extension to preview type mapping
 */
export const DEFAULT_PREVIEW_EXTENSIONS: Record<string, PreviewType> = {
  // Images
  jpg: 'image', jpeg: 'image', png: 'image', gif: 'image',
  webp: 'image', svg: 'image', bmp: 'image', ico: 'image',

  // Videos
  mp4: 'video', webm: 'video', mov: 'video', avi: 'video',
  mkv: 'video', m4v: 'video',

  // Audio
  mp3: 'audio', wav: 'audio', ogg: 'audio', flac: 'audio',
  m4a: 'audio', aac: 'audio',

  // PDF
  pdf: 'pdf',

  // Text
  txt: 'text', md: 'text', json: 'text', xml: 'text',
  yml: 'text', yaml: 'text', log: 'text', csv: 'text',
  ini: 'text', conf: 'text', env: 'text',

  // Code
  js: 'code', ts: 'code', jsx: 'code', tsx: 'code',
  py: 'code', sql: 'code', html: 'code', css: 'code',
  scss: 'code', less: 'code', java: 'code', c: 'code',
  cpp: 'code', h: 'code', cs: 'code', go: 'code',
  rs: 'code', php: 'code', rb: 'code', swift: 'code',
  kt: 'code', sh: 'code', bash: 'code', ps1: 'code',
  vue: 'code', svelte: 'code',

  // Word
  doc: 'word', docx: 'word', odt: 'word', rtf: 'word',

  // Excel
  xls: 'excel', xlsx: 'excel', ods: 'excel',

  // PowerPoint
  ppt: 'powerpoint', pptx: 'powerpoint', odp: 'powerpoint',

  // Archives
  zip: 'archive', rar: 'archive', '7z': 'archive',
  tar: 'archive', gz: 'archive',

  // CAD
  dwg: 'cad', dxf: 'cad',

  // 3D Models
  obj: 'model3d', gltf: 'model3d', glb: 'model3d',
  stl: 'model3d', fbx: 'model3d',
}

// =============================================
// PDF CONVERSION SYSTEM
// =============================================

/**
 * Supported source formats for PDF conversion
 */
export type PdfConvertibleType =
  | 'word'       // DOC, DOCX, ODT, RTF
  | 'excel'      // XLS, XLSX, ODS
  | 'powerpoint' // PPT, PPTX, ODP
  | 'image'      // JPG, PNG, TIFF, BMP
  | 'text'       // TXT, MD, HTML
  | 'email'      // EML, MSG
  | 'web'        // HTML, MHTML

export interface PdfConversionRequest {
  fileId: string
  options: PdfConversionOptions
}

export interface PdfConversionOptions {
  // Page setup
  pageSize: PdfPageSize
  orientation: 'portrait' | 'landscape'
  margins: PdfMargins

  // Quality
  quality: 'draft' | 'standard' | 'high' | 'print'
  dpi: 72 | 150 | 300 | 600

  // Content options
  includeComments: boolean
  includeTrackChanges: boolean
  includeHiddenContent: boolean

  // Headers & Footers
  header?: PdfHeaderFooter
  footer?: PdfHeaderFooter

  // Watermark
  watermark?: PdfWatermark

  // Security
  password?: string
  permissions?: PdfPermissions

  // Image options (for image to PDF)
  imageFit: 'original' | 'fit-page' | 'fill-page' | 'stretch'
  combineImages: boolean  // Multiple images into one PDF

  // Excel specific
  excelOptions?: ExcelToPdfOptions

  // Word specific
  wordOptions?: WordToPdfOptions
}

export type PdfPageSize =
  | 'a4' | 'a3' | 'a5'
  | 'letter' | 'legal' | 'tabloid'
  | 'custom'

export interface PdfMargins {
  top: number     // mm
  bottom: number
  left: number
  right: number
}

export interface PdfHeaderFooter {
  left?: string
  center?: string
  right?: string
  fontSize: number
  includePageNumber: boolean
  includeDate: boolean
  includeTotalPages: boolean
}

export interface PdfWatermark {
  text?: string
  imageUrl?: string
  opacity: number        // 0-100
  rotation: number       // degrees
  position: 'center' | 'diagonal' | 'tile'
  fontSize?: number
  color?: string
}

export interface PdfPermissions {
  allowPrinting: boolean
  allowCopying: boolean
  allowEditing: boolean
  allowAnnotations: boolean
  allowFormFilling: boolean
}

export interface ExcelToPdfOptions {
  // Sheet selection
  sheets: 'all' | 'active' | number[]  // Sheet indices

  // Scaling
  fitToPage: boolean
  fitWidth: number   // Number of pages wide
  fitHeight: number  // Number of pages tall
  scale: number      // Percentage (10-400)

  // Content
  printGridlines: boolean
  printHeadings: boolean  // Row & column headers
  printArea?: string      // e.g., "A1:H50"

  // Page order
  pageOrder: 'down-then-over' | 'over-then-down'
}

export interface WordToPdfOptions {
  // Bookmarks
  createBookmarks: 'headings' | 'bookmarks' | 'none'

  // Links
  preserveHyperlinks: boolean

  // Images
  imageCompression: 'none' | 'low' | 'medium' | 'high'

  // Fonts
  embedFonts: boolean
  subsetFonts: boolean
}

export interface PdfConversionResult {
  success: boolean
  fileId?: string          // New PDF file ID
  downloadUrl?: string
  pageCount?: number
  fileSize?: number
  error?: string
  processingTime?: number  // ms
}

// =============================================
// CONTEXT MENU (Right-click menu)
// =============================================

export interface ContextMenuConfig {
  // File actions
  fileActions: ContextMenuItem[]
  // Folder actions
  folderActions: ContextMenuItem[]
  // Multi-select actions
  bulkActions: ContextMenuItem[]
  // Empty area actions
  emptyAreaActions: ContextMenuItem[]
}

export interface ContextMenuItem {
  id: string
  label: string
  icon?: string              // Lucide icon name
  shortcut?: string          // e.g., "Ctrl+C"
  action: ContextMenuAction
  visible?: ContextMenuCondition
  disabled?: ContextMenuCondition
  children?: ContextMenuItem[]  // Submenu
  dividerAfter?: boolean
  danger?: boolean           // Red color for delete, etc.
}

export type ContextMenuAction =
  | 'open'
  | 'open-new-tab'
  | 'preview'
  | 'download'
  | 'download-as-pdf'
  | 'convert-to-pdf'
  | 'share'
  | 'share-link'
  | 'share-internal'
  | 'copy'
  | 'cut'
  | 'paste'
  | 'duplicate'
  | 'rename'
  | 'move'
  | 'move-to-folder'
  | 'copy-to-folder'
  | 'add-to-favorites'
  | 'remove-from-favorites'
  | 'add-tag'
  | 'remove-tag'
  | 'set-status'
  | 'assign-to'
  | 'add-comment'
  | 'view-history'
  | 'view-versions'
  | 'restore-version'
  | 'lock'
  | 'unlock'
  | 'archive'
  | 'delete'
  | 'delete-permanently'
  | 'properties'
  | 'custom'

export interface ContextMenuCondition {
  // File type conditions
  fileTypes?: string[]       // Extension list
  mimeTypes?: string[]

  // Permission conditions
  requiresPermission?: FilePermissionType

  // State conditions
  isOwner?: boolean
  isLocked?: boolean
  isFavorite?: boolean
  hasVersions?: boolean

  // Selection conditions
  minSelected?: number
  maxSelected?: number

  // Custom condition function name
  customCondition?: string
}

/**
 * Default context menu configuration
 */
export const DEFAULT_CONTEXT_MENU: ContextMenuConfig = {
  fileActions: [
    { id: 'open', label: 'Ava', icon: 'FileText', shortcut: 'Enter', action: 'open' },
    { id: 'preview', label: 'Eelvaade', icon: 'Eye', shortcut: 'Space', action: 'preview' },
    { id: 'open-new-tab', label: 'Ava uuel vahelehel', icon: 'ExternalLink', action: 'open-new-tab', dividerAfter: true },

    { id: 'download', label: 'Laadi alla', icon: 'Download', shortcut: 'Ctrl+S', action: 'download' },
    { id: 'convert-pdf', label: 'Konverteeri PDF-iks...', icon: 'FileOutput', action: 'convert-to-pdf' },
    { id: 'share', label: 'Jaga', icon: 'Share2', shortcut: 'Ctrl+Shift+S', action: 'share', dividerAfter: true },

    { id: 'cut', label: 'Lõika', icon: 'Scissors', shortcut: 'Ctrl+X', action: 'cut' },
    { id: 'copy', label: 'Kopeeri', icon: 'Copy', shortcut: 'Ctrl+C', action: 'copy' },
    { id: 'duplicate', label: 'Dubleeri', icon: 'CopyPlus', action: 'duplicate' },
    { id: 'rename', label: 'Nimeta ümber', icon: 'PenLine', shortcut: 'F2', action: 'rename' },
    { id: 'move', label: 'Teisalda...', icon: 'FolderInput', action: 'move-to-folder', dividerAfter: true },

    { id: 'favorite', label: 'Lisa lemmikutesse', icon: 'Star', action: 'add-to-favorites' },
    { id: 'tag', label: 'Lisa silt...', icon: 'Tag', action: 'add-tag' },
    { id: 'comment', label: 'Lisa kommentaar', icon: 'MessageSquare', action: 'add-comment', dividerAfter: true },

    { id: 'versions', label: 'Versioonid', icon: 'History', action: 'view-versions' },
    { id: 'properties', label: 'Omadused', icon: 'Info', shortcut: 'Alt+Enter', action: 'properties', dividerAfter: true },

    { id: 'delete', label: 'Kustuta', icon: 'Trash2', shortcut: 'Del', action: 'delete', danger: true },
  ],

  folderActions: [
    { id: 'open', label: 'Ava', icon: 'FolderOpen', shortcut: 'Enter', action: 'open' },
    { id: 'open-new-tab', label: 'Ava uuel vahelehel', icon: 'ExternalLink', action: 'open-new-tab', dividerAfter: true },

    { id: 'share', label: 'Jaga kausta', icon: 'Share2', action: 'share' },
    { id: 'download-zip', label: 'Laadi alla ZIP-ina', icon: 'FileArchive', action: 'download', dividerAfter: true },

    { id: 'rename', label: 'Nimeta ümber', icon: 'PenLine', shortcut: 'F2', action: 'rename' },
    { id: 'move', label: 'Teisalda...', icon: 'FolderInput', action: 'move-to-folder', dividerAfter: true },

    { id: 'properties', label: 'Omadused', icon: 'Info', action: 'properties', dividerAfter: true },

    { id: 'delete', label: 'Kustuta', icon: 'Trash2', action: 'delete', danger: true },
  ],

  bulkActions: [
    { id: 'download-zip', label: 'Laadi alla ZIP-ina', icon: 'FileArchive', action: 'download' },
    { id: 'share', label: 'Jaga valitud faile', icon: 'Share2', action: 'share', dividerAfter: true },

    { id: 'move', label: 'Teisalda...', icon: 'FolderInput', action: 'move-to-folder' },
    { id: 'copy', label: 'Kopeeri...', icon: 'Copy', action: 'copy-to-folder' },
    { id: 'tag', label: 'Lisa silt...', icon: 'Tag', action: 'add-tag', dividerAfter: true },

    { id: 'delete', label: 'Kustuta valitud', icon: 'Trash2', action: 'delete', danger: true },
  ],

  emptyAreaActions: [
    { id: 'new-folder', label: 'Uus kaust', icon: 'FolderPlus', action: 'custom' },
    { id: 'upload', label: 'Laadi üles...', icon: 'Upload', action: 'custom' },
    { id: 'paste', label: 'Kleebi', icon: 'Clipboard', shortcut: 'Ctrl+V', action: 'paste' },
  ],
}

// =============================================
// ADVANCED SEARCH
// =============================================

export interface AdvancedSearchQuery {
  // Basic search
  query?: string              // Full-text search
  searchIn: SearchScope[]     // Where to search

  // File filters
  fileTypes?: string[]        // Extensions
  mimeTypes?: string[]
  minSize?: number           // Bytes
  maxSize?: number

  // Date filters
  createdAfter?: Date
  createdBefore?: Date
  modifiedAfter?: Date
  modifiedBefore?: Date

  // Location
  folderId?: string          // Specific folder
  includeSubfolders: boolean
  vaultId?: string

  // Ownership
  ownerId?: string
  createdBy?: string
  sharedWithMe?: boolean

  // Tags & metadata
  tags?: string[]
  tagsOperator: 'and' | 'or'
  metadata?: MetadataFilter[]

  // Status & flags
  status?: string[]
  isFavorite?: boolean
  isShared?: boolean
  isPublic?: boolean
  hasComments?: boolean

  // Media specific (images/videos)
  mediaFilters?: MediaSearchFilters

  // Sorting
  sortBy: SearchSortField
  sortOrder: 'asc' | 'desc'

  // Pagination
  page: number
  pageSize: number
}

export type SearchScope =
  | 'filename'      // Search in file names
  | 'content'       // Full-text content search
  | 'tags'          // Search in tags
  | 'metadata'      // Search in custom metadata
  | 'comments'      // Search in comments
  | 'path'          // Search in file path

export type SearchSortField =
  | 'relevance'     // Best match first
  | 'name'          // Alphabetical
  | 'size'          // File size
  | 'created'       // Creation date
  | 'modified'      // Last modified
  | 'accessed'      // Last accessed
  | 'type'          // File type

export interface MetadataFilter {
  field: string
  operator: MetadataOperator
  value: string | number | boolean | Date | string[]
}

export type MetadataOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'greater_than'
  | 'less_than'
  | 'between'
  | 'in'
  | 'not_in'
  | 'is_empty'
  | 'is_not_empty'

export interface MediaSearchFilters {
  // Image dimensions
  minWidth?: number
  maxWidth?: number
  minHeight?: number
  maxHeight?: number
  aspectRatio?: '1:1' | '4:3' | '16:9' | '3:2' | 'portrait' | 'landscape'

  // Camera/EXIF
  cameraMake?: string[]
  cameraModel?: string[]
  minIso?: number
  maxIso?: number

  // Location
  hasGps?: boolean
  nearLocation?: {
    latitude: number
    longitude: number
    radiusKm: number
  }

  // Date taken
  takenAfter?: Date
  takenBefore?: Date

  // Video specific
  minDuration?: number    // Seconds
  maxDuration?: number
  hasAudio?: boolean
}

export interface SearchSuggestion {
  type: 'file' | 'folder' | 'tag' | 'user' | 'recent' | 'saved'
  text: string
  icon?: string
  fileId?: string
  folderId?: string
  metadata?: Record<string, unknown>
}

export interface SavedSearch {
  id: string
  name: string
  query: AdvancedSearchQuery
  createdAt: Date
  createdBy: string
  isShared: boolean
  icon?: string
  color?: string
}

/**
 * Quick search presets
 */
export const QUICK_SEARCH_PRESETS: Record<string, Partial<AdvancedSearchQuery>> = {
  // Recent files
  recent: {
    sortBy: 'modified',
    sortOrder: 'desc',
    pageSize: 50,
  },

  // My files
  myFiles: {
    sharedWithMe: false,
    sortBy: 'modified',
    sortOrder: 'desc',
  },

  // Shared with me
  sharedWithMe: {
    sharedWithMe: true,
    sortBy: 'modified',
    sortOrder: 'desc',
  },

  // Images only
  images: {
    fileTypes: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'bmp'],
    sortBy: 'modified',
    sortOrder: 'desc',
  },

  // Documents
  documents: {
    fileTypes: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'],
    sortBy: 'modified',
    sortOrder: 'desc',
  },

  // Large files (>100MB)
  largeFiles: {
    minSize: 104857600,
    sortBy: 'size',
    sortOrder: 'desc',
  },

  // Favorites
  favorites: {
    isFavorite: true,
    sortBy: 'name',
    sortOrder: 'asc',
  },
}

// =============================================
// CONTENT INDEXING SYSTEM (Full-text search)
// =============================================

/**
 * Background content indexing for full-text search
 * Indexes file contents for fast searching inside documents
 */
export interface ContentIndexingConfig {
  // Which file types to index
  indexableTypes: string[]

  // Max file size to index (bytes)
  maxFileSizeToIndex: number   // Default: 50MB

  // OCR settings for images/PDFs
  enableOcr: boolean
  ocrLanguages: string[]       // ['est', 'eng', 'rus']

  // Background processing
  batchSize: number            // Files per batch
  processingInterval: number   // Seconds between batches
  maxConcurrentJobs: number

  // Index refresh
  autoReindexOnUpdate: boolean
  fullReindexSchedule: string  // Cron expression
}

export interface ContentIndexJob {
  id: string
  fileId: string
  vaultId: string
  status: IndexJobStatus
  progress: number           // 0-100

  // Timing
  createdAt: Date
  startedAt?: Date
  completedAt?: Date

  // Results
  extractedText?: string
  wordCount?: number
  pageCount?: number
  language?: string
  error?: string

  // OCR specific
  ocrApplied: boolean
  ocrConfidence?: number     // 0-100
}

export type IndexJobStatus =
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'skipped'

export interface ContentIndexStats {
  totalFiles: number
  indexedFiles: number
  pendingFiles: number
  failedFiles: number
  skippedFiles: number
  totalWords: number
  indexSize: number          // Bytes
  lastFullIndex: Date
  averageIndexTime: number   // ms per file
}

/**
 * Text extraction configuration per file type
 */
export interface TextExtractorConfig {
  // PDF extraction
  pdf: {
    extractMethod: 'text-layer' | 'ocr' | 'hybrid'
    preserveFormatting: boolean
    extractTables: boolean
    extractImages: boolean
  }

  // Office documents
  word: {
    extractComments: boolean
    extractRevisions: boolean
    extractHeaders: boolean
    extractFooters: boolean
  }

  excel: {
    extractAllSheets: boolean
    extractFormulas: boolean
    extractComments: boolean
    sheetSeparator: string     // Text between sheets
  }

  powerpoint: {
    extractNotes: boolean
    extractComments: boolean
    slideSeparator: string
  }

  // Images (OCR)
  image: {
    preprocess: boolean        // Enhance before OCR
    deskew: boolean
    removeNoise: boolean
    minConfidence: number      // Min OCR confidence (0-100)
  }

  // Email
  email: {
    extractAttachments: boolean
    includeHeaders: boolean
    extractHtml: boolean
  }
}

/**
 * Search result with content highlights
 */
export interface ContentSearchResult {
  fileId: string
  fileName: string
  filePath: string
  mimeType: string

  // Match info
  score: number              // Relevance score
  matchCount: number         // Number of matches

  // Highlighted excerpts
  highlights: ContentHighlight[]

  // File metadata
  createdAt: Date
  modifiedAt: Date
  size: number
  owner: string
}

export interface ContentHighlight {
  // Which field matched
  field: 'content' | 'filename' | 'metadata' | 'tags'

  // Text excerpt with highlights
  excerpt: string            // "...the <mark>search term</mark> was found..."
  preContext: string         // Text before match
  matchedText: string        // The actual match
  postContext: string        // Text after match

  // Position info
  pageNumber?: number        // For documents
  sheetName?: string         // For Excel
  lineNumber?: number        // For text files
}

/**
 * Indexable file types with their extractors
 */
export const INDEXABLE_FILE_TYPES: Record<string, string> = {
  // Documents - Full text extraction
  pdf: 'pdf-extractor',
  doc: 'word-extractor',
  docx: 'word-extractor',
  odt: 'odf-extractor',
  rtf: 'rtf-extractor',

  // Spreadsheets
  xls: 'excel-extractor',
  xlsx: 'excel-extractor',
  ods: 'odf-extractor',
  csv: 'csv-extractor',

  // Presentations
  ppt: 'powerpoint-extractor',
  pptx: 'powerpoint-extractor',
  odp: 'odf-extractor',

  // Text files - Direct read
  txt: 'text-extractor',
  md: 'text-extractor',
  json: 'text-extractor',
  xml: 'text-extractor',
  html: 'html-extractor',
  htm: 'html-extractor',
  css: 'text-extractor',
  js: 'text-extractor',
  ts: 'text-extractor',
  py: 'text-extractor',
  sql: 'text-extractor',
  log: 'text-extractor',
  ini: 'text-extractor',
  yml: 'text-extractor',
  yaml: 'text-extractor',

  // Email
  eml: 'email-extractor',
  msg: 'email-extractor',

  // Images - OCR required
  jpg: 'ocr-extractor',
  jpeg: 'ocr-extractor',
  png: 'ocr-extractor',
  tiff: 'ocr-extractor',
  tif: 'ocr-extractor',
  bmp: 'ocr-extractor',
}

/**
 * Default content indexing configuration
 */
export const DEFAULT_INDEXING_CONFIG: ContentIndexingConfig = {
  indexableTypes: Object.keys(INDEXABLE_FILE_TYPES),
  maxFileSizeToIndex: 52428800,  // 50MB
  enableOcr: true,
  ocrLanguages: ['est', 'eng', 'rus'],
  batchSize: 10,
  processingInterval: 60,        // 1 minute
  maxConcurrentJobs: 4,
  autoReindexOnUpdate: true,
  fullReindexSchedule: '0 2 * * 0',  // Sunday 2 AM
}

// =============================================
// FILE CONFLICT RESOLUTION
// =============================================

/**
 * What to do when uploading a file with existing name
 */
export type FileConflictStrategy =
  | 'ask'           // Always ask user
  | 'auto-rename'   // Auto add number: file (1).txt
  | 'replace'       // Replace existing file
  | 'skip'          // Skip upload
  | 'keep-both'     // Keep both with auto-rename

export interface FileConflictConfig {
  // Default strategy
  defaultStrategy: FileConflictStrategy

  // Auto-rename format
  renamePattern: string        // "{name} ({n})" or "{name}-{n}" or "{n}-{name}"

  // When to ask (overrides default)
  askWhenLargerThan: number    // Bytes - always ask for large files
  askForTypes: string[]        // Always ask for these extensions

  // Replace settings
  createVersionOnReplace: boolean   // Create version instead of overwrite

  // Batch upload settings
  applyToAll: boolean          // Remember choice for batch upload
}

export interface FileConflict {
  id: string
  uploadFile: UploadConflictFile
  existingFile: ExistingConflictFile
  suggestedName: string        // Auto-generated suggestion
  folder: {
    id: string
    path: string
  }
}

export interface UploadConflictFile {
  name: string
  size: number
  type: string
  lastModified: Date
}

export interface ExistingConflictFile {
  id: string
  name: string
  size: number
  mimeType: string
  createdAt: Date
  updatedAt: Date
  ownerId: string
  ownerName: string
}

export interface FileConflictResolution {
  conflictId: string
  action: FileConflictAction
  newName?: string             // If action is 'rename'
  applyToAll?: boolean         // Apply same action to all conflicts
}

export type FileConflictAction =
  | 'rename'       // Use custom name provided by user
  | 'auto-rename'  // Use suggested name with number
  | 'replace'      // Replace existing file
  | 'skip'         // Don't upload this file
  | 'keep-both'    // Keep both (auto-rename new)

/**
 * Dialog for resolving file conflicts
 */
export interface FileConflictDialogData {
  conflicts: FileConflict[]
  currentIndex: number
  applyToAll: boolean
  defaultAction: FileConflictAction
}

/**
 * Generate unique filename with number
 */
export function generateUniqueFilename(
  originalName: string,
  existingNames: string[],
  pattern: string = '{name} ({n})'
): string {
  // Extract name and extension
  const lastDot = originalName.lastIndexOf('.')
  const name = lastDot > 0 ? originalName.slice(0, lastDot) : originalName
  const ext = lastDot > 0 ? originalName.slice(lastDot) : ''

  // Check if original name is available
  if (!existingNames.includes(originalName)) {
    return originalName
  }

  // Find next available number
  let n = 1
  let newName: string

  do {
    newName = pattern
      .replace('{name}', name)
      .replace('{n}', String(n))
    newName = newName + ext
    n++
  } while (existingNames.includes(newName) && n < 1000)

  return newName
}

/**
 * Default conflict configuration
 */
export const DEFAULT_CONFLICT_CONFIG: FileConflictConfig = {
  defaultStrategy: 'ask',
  renamePattern: '{name} ({n})',
  askWhenLargerThan: 10485760,    // 10MB
  askForTypes: ['exe', 'zip', 'rar', 'msi', 'dmg'],
  createVersionOnReplace: true,
  applyToAll: false,
}

// =============================================
// BATCH UPLOAD WITH CONFLICT HANDLING
// =============================================

export interface BatchUploadState {
  // Overall progress
  totalFiles: number
  uploadedFiles: number
  failedFiles: number
  skippedFiles: number

  // Current file
  currentFile?: {
    name: string
    progress: number
    speed: number
    remainingTime: number
  }

  // Pending conflicts
  pendingConflicts: FileConflict[]
  resolvedConflicts: FileConflictResolution[]

  // Status
  status: BatchUploadStatus
  errors: BatchUploadError[]
}

export type BatchUploadStatus =
  | 'idle'
  | 'checking'       // Checking for conflicts
  | 'waiting-user'   // Waiting for user to resolve conflicts
  | 'uploading'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'error'

export interface BatchUploadError {
  fileName: string
  error: string
  code: string
  retryable: boolean
}

// =============================================
// MOBILE UI CONFIGURATION
// =============================================

/**
 * Mobile-optimized file manager settings
 * Ensures comfortable usage on phones and tablets
 */
export interface MobileConfig {
  // Breakpoints
  breakpoints: {
    mobile: number      // < 640px
    tablet: number      // < 1024px
    desktop: number     // >= 1024px
  }

  // Mobile-specific settings
  mobile: MobileViewSettings
  tablet: TabletViewSettings

  // Touch gestures
  gestures: TouchGestureConfig

  // Bottom sheet actions (mobile)
  bottomSheet: BottomSheetConfig

  // Pull to refresh
  pullToRefresh: boolean

  // Offline support
  offlineMode: OfflineModeConfig
}

export interface MobileViewSettings {
  // Default view on mobile
  defaultView: 'list' | 'grid'

  // Grid settings for mobile
  gridColumns: 2 | 3 | 4
  iconSize: 'small' | 'medium'

  // List settings for mobile
  listCompact: boolean
  showThumbnails: boolean

  // Navigation
  showBottomNav: boolean
  showFloatingActionButton: boolean
  fabActions: MobileFabAction[]

  // Header
  stickyHeader: boolean
  collapsibleHeader: boolean

  // Selection
  enableLongPressSelect: boolean
  showSelectionToolbar: boolean

  // Swipe actions
  enableSwipeActions: boolean
  swipeLeftAction: MobileSwipeAction
  swipeRightAction: MobileSwipeAction
}

export interface TabletViewSettings {
  // Layout
  showSidebar: boolean
  sidebarWidth: number
  splitView: boolean          // Master-detail view

  // Default view
  defaultView: FileViewType

  // Grid
  gridColumns: 3 | 4 | 5 | 6
}

export type MobileFabAction =
  | 'upload'
  | 'new-folder'
  | 'new-file'
  | 'camera'
  | 'scan-document'

export type MobileSwipeAction =
  | 'delete'
  | 'share'
  | 'favorite'
  | 'download'
  | 'rename'
  | 'none'

export interface TouchGestureConfig {
  // Pinch to zoom (gallery)
  enablePinchZoom: boolean

  // Double tap
  doubleTapAction: 'open' | 'preview' | 'select' | 'none'

  // Long press
  longPressDelay: number       // ms
  longPressAction: 'select' | 'context-menu' | 'none'

  // Swipe
  swipeThreshold: number       // px
  swipeVelocity: number        // px/ms
}

export interface BottomSheetConfig {
  // File actions sheet
  fileActions: MobileActionItem[]

  // Folder actions sheet
  folderActions: MobileActionItem[]

  // Sort/filter sheet
  showSortOptions: boolean
  showFilterOptions: boolean

  // Upload options
  uploadOptions: MobileUploadOption[]
}

export interface MobileActionItem {
  id: string
  label: string
  labelEt: string              // Estonian
  icon: string
  action: ContextMenuAction
  danger?: boolean
}

export type MobileUploadOption =
  | 'files'           // File picker
  | 'camera'          // Take photo
  | 'gallery'         // Photo library
  | 'scan'            // Document scanner
  | 'audio'           // Record audio

export interface OfflineModeConfig {
  // Enable offline access
  enabled: boolean

  // What to cache
  cacheRecentFiles: boolean
  cacheFavorites: boolean
  cacheSize: number            // Max cache size in bytes

  // Sync settings
  syncOnWifi: boolean
  syncOnMobile: boolean
  backgroundSync: boolean

  // Conflict resolution
  offlineConflictStrategy: 'local-wins' | 'server-wins' | 'ask'
}

/**
 * Default mobile configuration
 */
export const DEFAULT_MOBILE_CONFIG: MobileConfig = {
  breakpoints: {
    mobile: 640,
    tablet: 1024,
    desktop: 1024,
  },

  mobile: {
    defaultView: 'list',
    gridColumns: 3,
    iconSize: 'medium',
    listCompact: false,
    showThumbnails: true,
    showBottomNav: true,
    showFloatingActionButton: true,
    fabActions: ['upload', 'new-folder', 'camera'],
    stickyHeader: true,
    collapsibleHeader: true,
    enableLongPressSelect: true,
    showSelectionToolbar: true,
    enableSwipeActions: true,
    swipeLeftAction: 'delete',
    swipeRightAction: 'share',
  },

  tablet: {
    showSidebar: true,
    sidebarWidth: 280,
    splitView: true,
    defaultView: 'grid',
    gridColumns: 4,
  },

  gestures: {
    enablePinchZoom: true,
    doubleTapAction: 'preview',
    longPressDelay: 500,
    longPressAction: 'context-menu',
    swipeThreshold: 50,
    swipeVelocity: 0.3,
  },

  bottomSheet: {
    fileActions: [
      { id: 'preview', label: 'Preview', labelEt: 'Eelvaade', icon: 'Eye', action: 'preview' },
      { id: 'share', label: 'Share', labelEt: 'Jaga', icon: 'Share2', action: 'share' },
      { id: 'download', label: 'Download', labelEt: 'Laadi alla', icon: 'Download', action: 'download' },
      { id: 'favorite', label: 'Add to favorites', labelEt: 'Lisa lemmikutesse', icon: 'Star', action: 'add-to-favorites' },
      { id: 'rename', label: 'Rename', labelEt: 'Nimeta ümber', icon: 'PenLine', action: 'rename' },
      { id: 'move', label: 'Move', labelEt: 'Teisalda', icon: 'FolderInput', action: 'move-to-folder' },
      { id: 'delete', label: 'Delete', labelEt: 'Kustuta', icon: 'Trash2', action: 'delete', danger: true },
    ],
    folderActions: [
      { id: 'open', label: 'Open', labelEt: 'Ava', icon: 'FolderOpen', action: 'open' },
      { id: 'share', label: 'Share', labelEt: 'Jaga', icon: 'Share2', action: 'share' },
      { id: 'rename', label: 'Rename', labelEt: 'Nimeta ümber', icon: 'PenLine', action: 'rename' },
      { id: 'delete', label: 'Delete', labelEt: 'Kustuta', icon: 'Trash2', action: 'delete', danger: true },
    ],
    showSortOptions: true,
    showFilterOptions: true,
    uploadOptions: ['files', 'camera', 'gallery', 'scan'],
  },

  pullToRefresh: true,

  offlineMode: {
    enabled: true,
    cacheRecentFiles: true,
    cacheFavorites: true,
    cacheSize: 524288000,      // 500MB
    syncOnWifi: true,
    syncOnMobile: false,
    backgroundSync: true,
    offlineConflictStrategy: 'ask',
  },
}

// =============================================
// NEW FILE CREATION SYSTEM
// =============================================

/**
 * Supported file types that can be created in the system
 */
export type CreatableFileType =
  | 'document'        // Word document
  | 'spreadsheet'     // Excel spreadsheet
  | 'presentation'    // PowerPoint
  | 'text'            // Plain text
  | 'markdown'        // Markdown file
  | 'note'            // Rich text note
  | 'form'            // Form/survey
  | 'diagram'         // Diagram/flowchart
  | 'whiteboard'      // Collaborative whiteboard
  | 'code'            // Code file
  | 'json'            // JSON file
  | 'html'            // HTML file
  | 'css'             // CSS file

export interface FileCreationConfig {
  // Available file types for creation
  enabledTypes: CreatableFileType[]

  // Templates per type
  templates: FileTemplate[]

  // Default settings
  defaultLocation: 'current-folder' | 'my-files' | 'ask'
  openAfterCreate: boolean

  // Naming
  defaultNamePattern: string   // e.g., "Untitled {type} {n}"
  askForName: boolean
}

export interface FileTemplate {
  id: string
  type: CreatableFileType
  name: string
  nameEt: string              // Estonian name
  description?: string
  descriptionEt?: string
  icon: string
  color?: string

  // Template content
  content?: string            // For text-based files
  templateFileId?: string     // Reference to template file

  // Metadata
  isDefault: boolean
  isBuiltIn: boolean
  category?: string
  tags?: string[]

  // Access
  visibleToGroups?: string[]  // Empty = all groups
}

export interface NewFileDialogData {
  // Current step
  step: 'select-type' | 'select-template' | 'enter-name' | 'creating'

  // Selected values
  selectedType?: CreatableFileType
  selectedTemplate?: FileTemplate
  fileName: string
  targetFolderId?: string

  // Options
  openAfterCreate: boolean

  // State
  isCreating: boolean
  error?: string
}

export interface FileCreationResult {
  success: boolean
  fileId?: string
  fileName?: string
  filePath?: string
  error?: string
}

/**
 * File type definitions with metadata
 */
export const FILE_TYPE_DEFINITIONS: Record<CreatableFileType, FileTypeDefinition> = {
  document: {
    type: 'document',
    name: 'Document',
    nameEt: 'Dokument',
    description: 'Word document for reports, letters, etc.',
    descriptionEt: 'Word dokument aruannete, kirjade jms jaoks',
    icon: 'FileText',
    color: '#2b579a',
    extension: 'docx',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  },
  spreadsheet: {
    type: 'spreadsheet',
    name: 'Spreadsheet',
    nameEt: 'Tabel',
    description: 'Excel spreadsheet for data and calculations',
    descriptionEt: 'Excel tabel andmete ja arvutuste jaoks',
    icon: 'Table',
    color: '#217346',
    extension: 'xlsx',
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  },
  presentation: {
    type: 'presentation',
    name: 'Presentation',
    nameEt: 'Esitlus',
    description: 'PowerPoint presentation',
    descriptionEt: 'PowerPoint esitlus',
    icon: 'Presentation',
    color: '#d24726',
    extension: 'pptx',
    mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  },
  text: {
    type: 'text',
    name: 'Text File',
    nameEt: 'Tekstifail',
    description: 'Plain text file',
    descriptionEt: 'Lihtne tekstifail',
    icon: 'FileType',
    color: '#6b7280',
    extension: 'txt',
    mimeType: 'text/plain',
  },
  markdown: {
    type: 'markdown',
    name: 'Markdown',
    nameEt: 'Markdown',
    description: 'Markdown formatted text',
    descriptionEt: 'Markdown vormingus tekst',
    icon: 'FileCode',
    color: '#083d77',
    extension: 'md',
    mimeType: 'text/markdown',
  },
  note: {
    type: 'note',
    name: 'Note',
    nameEt: 'Märkmed',
    description: 'Rich text note with formatting',
    descriptionEt: 'Rikkalik tekst märkmetega',
    icon: 'StickyNote',
    color: '#fbbf24',
    extension: 'html',
    mimeType: 'text/html',
  },
  form: {
    type: 'form',
    name: 'Form',
    nameEt: 'Vorm',
    description: 'Create surveys and forms',
    descriptionEt: 'Loo küsitlusi ja vorme',
    icon: 'ClipboardList',
    color: '#8b5cf6',
    extension: 'json',
    mimeType: 'application/json',
  },
  diagram: {
    type: 'diagram',
    name: 'Diagram',
    nameEt: 'Diagramm',
    description: 'Flowcharts and diagrams',
    descriptionEt: 'Vooskeemid ja diagrammid',
    icon: 'GitBranch',
    color: '#f97316',
    extension: 'drawio',
    mimeType: 'application/xml',
  },
  whiteboard: {
    type: 'whiteboard',
    name: 'Whiteboard',
    nameEt: 'Tahvel',
    description: 'Collaborative whiteboard',
    descriptionEt: 'Koostöö tahvel',
    icon: 'PenTool',
    color: '#06b6d4',
    extension: 'excalidraw',
    mimeType: 'application/json',
  },
  code: {
    type: 'code',
    name: 'Code File',
    nameEt: 'Koodifail',
    description: 'Source code file',
    descriptionEt: 'Lähtekoodifail',
    icon: 'Code',
    color: '#22c55e',
    extension: 'js',
    mimeType: 'text/javascript',
  },
  json: {
    type: 'json',
    name: 'JSON File',
    nameEt: 'JSON fail',
    description: 'JSON data file',
    descriptionEt: 'JSON andmefail',
    icon: 'Braces',
    color: '#eab308',
    extension: 'json',
    mimeType: 'application/json',
  },
  html: {
    type: 'html',
    name: 'HTML File',
    nameEt: 'HTML fail',
    description: 'HTML web page',
    descriptionEt: 'HTML veebileht',
    icon: 'Globe',
    color: '#e34c26',
    extension: 'html',
    mimeType: 'text/html',
  },
  css: {
    type: 'css',
    name: 'CSS File',
    nameEt: 'CSS fail',
    description: 'CSS stylesheet',
    descriptionEt: 'CSS stiilileht',
    icon: 'Palette',
    color: '#264de4',
    extension: 'css',
    mimeType: 'text/css',
  },
}

export interface FileTypeDefinition {
  type: CreatableFileType
  name: string
  nameEt: string
  description: string
  descriptionEt: string
  icon: string
  color: string
  extension: string
  mimeType: string
}

/**
 * Default templates for new files
 */
export const DEFAULT_FILE_TEMPLATES: FileTemplate[] = [
  // Documents
  {
    id: 'blank-document',
    type: 'document',
    name: 'Blank Document',
    nameEt: 'Tühi dokument',
    icon: 'FileText',
    isDefault: true,
    isBuiltIn: true,
    category: 'basic',
  },
  {
    id: 'report-template',
    type: 'document',
    name: 'Report',
    nameEt: 'Aruanne',
    description: 'Professional report template',
    descriptionEt: 'Professionaalne aruande mall',
    icon: 'FileText',
    isDefault: false,
    isBuiltIn: true,
    category: 'business',
  },
  {
    id: 'letter-template',
    type: 'document',
    name: 'Letter',
    nameEt: 'Kiri',
    description: 'Formal letter template',
    descriptionEt: 'Ametlik kirja mall',
    icon: 'Mail',
    isDefault: false,
    isBuiltIn: true,
    category: 'business',
  },

  // Spreadsheets
  {
    id: 'blank-spreadsheet',
    type: 'spreadsheet',
    name: 'Blank Spreadsheet',
    nameEt: 'Tühi tabel',
    icon: 'Table',
    isDefault: true,
    isBuiltIn: true,
    category: 'basic',
  },
  {
    id: 'budget-template',
    type: 'spreadsheet',
    name: 'Budget',
    nameEt: 'Eelarve',
    description: 'Budget tracking spreadsheet',
    descriptionEt: 'Eelarve jälgimise tabel',
    icon: 'DollarSign',
    isDefault: false,
    isBuiltIn: true,
    category: 'finance',
  },

  // Presentations
  {
    id: 'blank-presentation',
    type: 'presentation',
    name: 'Blank Presentation',
    nameEt: 'Tühi esitlus',
    icon: 'Presentation',
    isDefault: true,
    isBuiltIn: true,
    category: 'basic',
  },

  // Notes
  {
    id: 'blank-note',
    type: 'note',
    name: 'Quick Note',
    nameEt: 'Kiirmärkmed',
    icon: 'StickyNote',
    isDefault: true,
    isBuiltIn: true,
    category: 'basic',
  },
  {
    id: 'meeting-notes',
    type: 'note',
    name: 'Meeting Notes',
    nameEt: 'Koosoleku märkmed',
    description: 'Template for meeting notes',
    descriptionEt: 'Koosoleku märkmete mall',
    icon: 'Users',
    isDefault: false,
    isBuiltIn: true,
    category: 'business',
  },

  // Markdown
  {
    id: 'blank-markdown',
    type: 'markdown',
    name: 'Markdown File',
    nameEt: 'Markdown fail',
    icon: 'FileCode',
    content: '# Title\n\nStart writing here...\n',
    isDefault: true,
    isBuiltIn: true,
    category: 'basic',
  },

  // Text
  {
    id: 'blank-text',
    type: 'text',
    name: 'Text File',
    nameEt: 'Tekstifail',
    icon: 'FileType',
    content: '',
    isDefault: true,
    isBuiltIn: true,
    category: 'basic',
  },
]

/**
 * Default file creation configuration
 */
export const DEFAULT_FILE_CREATION_CONFIG: FileCreationConfig = {
  enabledTypes: [
    'document',
    'spreadsheet',
    'presentation',
    'note',
    'markdown',
    'text',
  ],
  templates: DEFAULT_FILE_TEMPLATES,
  defaultLocation: 'current-folder',
  openAfterCreate: true,
  defaultNamePattern: 'Uus {type}',
  askForName: true,
}

// =============================================
// LARGE FILE UPLOAD (1GB+)
// =============================================

/**
 * Configuration for large file uploads (up to 1GB+)
 */
export interface LargeFileUploadConfig {
  // Size limits
  maxFileSize: number              // Max single file size (bytes)
  maxTotalUploadSize: number       // Max total upload size per session

  // Chunking settings
  enableChunkedUpload: boolean
  chunkSize: number                // Chunk size in bytes (default 10MB)
  maxConcurrentChunks: number      // Parallel chunk uploads
  retryAttempts: number            // Retry failed chunks
  retryDelay: number               // Delay between retries (ms)

  // Resumable uploads
  enableResumable: boolean
  resumeExpiry: number             // How long to keep partial uploads (hours)

  // Progress & feedback
  showDetailedProgress: boolean
  showUploadSpeed: boolean
  showTimeRemaining: boolean

  // Background upload
  enableBackgroundUpload: boolean
  continueOnAppClose: boolean      // Mobile - continue in background

  // Optimization
  enableCompression: boolean
  compressionTypes: string[]       // File types to compress
  compressionLevel: 'low' | 'medium' | 'high'

  // Validation
  validateBeforeUpload: boolean
  scanForViruses: boolean
}

export interface ChunkedUploadSession {
  id: string
  fileId: string
  fileName: string
  fileSize: number
  mimeType: string

  // Chunking info
  chunkSize: number
  totalChunks: number
  uploadedChunks: number[]
  failedChunks: number[]

  // Progress
  uploadedBytes: number
  progress: number                 // 0-100

  // Timing
  startedAt: Date
  lastActivityAt: Date
  expiresAt: Date

  // Status
  status: ChunkedUploadStatus
  error?: string

  // Metadata
  targetVaultId: string
  targetFolderId?: string
  uploadedBy: string
}

export type ChunkedUploadStatus =
  | 'initializing'
  | 'uploading'
  | 'paused'
  | 'resuming'
  | 'processing'       // Server processing after upload
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'expired'

export interface UploadProgress {
  // File info
  fileName: string
  fileSize: number

  // Progress
  uploadedBytes: number
  progress: number                 // 0-100

  // Speed
  speed: number                    // bytes/second
  averageSpeed: number

  // Time
  elapsedTime: number              // ms
  remainingTime: number            // ms (estimated)

  // Chunks (for chunked uploads)
  currentChunk?: number
  totalChunks?: number

  // Status
  status: 'preparing' | 'uploading' | 'processing' | 'completed' | 'error'
  error?: string
}

/**
 * Default large file upload configuration
 * Supports files up to 1GB
 */
export const DEFAULT_LARGE_UPLOAD_CONFIG: LargeFileUploadConfig = {
  // 1GB max file size
  maxFileSize: 1073741824,         // 1GB
  maxTotalUploadSize: 5368709120,  // 5GB per session

  // Chunking for files > 10MB
  enableChunkedUpload: true,
  chunkSize: 10485760,             // 10MB chunks
  maxConcurrentChunks: 4,
  retryAttempts: 3,
  retryDelay: 2000,

  // Resumable
  enableResumable: true,
  resumeExpiry: 72,                // 72 hours

  // Progress
  showDetailedProgress: true,
  showUploadSpeed: true,
  showTimeRemaining: true,

  // Background
  enableBackgroundUpload: true,
  continueOnAppClose: true,

  // Optimization
  enableCompression: false,
  compressionTypes: [],
  compressionLevel: 'medium',

  // Validation
  validateBeforeUpload: true,
  scanForViruses: true,
}

/**
 * Size thresholds for upload strategies
 */
export const UPLOAD_SIZE_THRESHOLDS = {
  // Simple upload (no chunking)
  simpleUpload: 10485760,          // < 10MB

  // Chunked upload
  chunkedUpload: 104857600,        // 10MB - 100MB

  // Large file (show detailed progress)
  largeFile: 104857600,            // > 100MB

  // Very large file (require confirmation)
  veryLargeFile: 524288000,        // > 500MB

  // Maximum supported
  maxSupported: 1073741824,        // 1GB
}

/**
 * Human-readable size formatter
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`
}

/**
 * Calculate upload time estimate
 */
export function estimateUploadTime(
  fileSize: number,
  speedBps: number
): { seconds: number; formatted: string } {
  if (speedBps <= 0) return { seconds: 0, formatted: 'Arvutamine...' }

  const seconds = Math.ceil(fileSize / speedBps)

  if (seconds < 60) {
    return { seconds, formatted: `${seconds} sek` }
  } else if (seconds < 3600) {
    const mins = Math.ceil(seconds / 60)
    return { seconds, formatted: `${mins} min` }
  } else {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.ceil((seconds % 3600) / 60)
    return { seconds, formatted: `${hours}h ${mins}min` }
  }
}
