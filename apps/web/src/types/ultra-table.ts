/**
 * RIVEST ULTRA TABLE SYSTEM - TypeScript Types
 *
 * Complete type definitions for the Ultra Table dynamic table system.
 * 55 column types with full Airtable compatibility + 27 exclusive types.
 */

// =============================================
// COLUMN TYPES (55 types)
// =============================================

/**
 * All available column types
 *
 * - 28 Airtable-compatible types
 * - 27 Rivest exclusive types
 */
export type ColumnType =
  // ═══════════════════════════════════════════════════════════
  // AIRTABLE-COMPATIBLE TYPES (28 types)
  // ═══════════════════════════════════════════════════════════

  // Basic Text & Numbers (9 types)
  | 'text'                    // Single line text
  | 'long_text'               // Long text / Rich text
  | 'number'                  // Number
  | 'currency'                // Currency
  | 'percent'                 // Percentage
  | 'duration'                // Duration
  | 'rating'                  // Star rating
  | 'auto_number'             // Auto number
  | 'formula'                 // Calculated field

  // Selection (3 types)
  | 'dropdown'                // Single select
  | 'multi_select'            // Multi-select
  | 'checkbox'                // Boolean checkbox

  // Date & Time (4 types)
  | 'datetime'                // Date & time
  | 'created_time'            // Auto-created timestamp
  | 'modified_time'           // Auto-updated timestamp
  | 'date'                    // Date only

  // People (3 types)
  | 'user'                    // Single user
  | 'created_by'              // Auto-created by
  | 'modified_by'             // Auto-modified by

  // Media (1 type)
  | 'attachment'              // File attachments

  // Contact (3 types)
  | 'email'                   // Email address
  | 'phone'                   // Phone number
  | 'url'                     // URL/Link

  // Code (2 types)
  | 'barcode'                 // Barcode
  | 'button'                  // Action button

  // Relations (4 types)
  | 'relation'                // Link to another table
  | 'lookup'                  // Lookup from relation
  | 'rollup'                  // Aggregate from relation
  | 'count'                   // Count relations

  // ═══════════════════════════════════════════════════════════
  // RIVEST EXCLUSIVE TYPES (27 types)
  // ═══════════════════════════════════════════════════════════

  // Enhanced Selection
  | 'tags'                    // Tags with colors (Notion-style)
  | 'status'                  // Status badge (Notion-style)
  | 'priority'                // Priority levels (ClickUp-style)
  | 'toggle'                  // Toggle switch (Notion-style)

  // Enhanced Date & Time
  | 'time'                    // Time only (no date)

  // Enhanced People
  | 'multi_user'              // Multiple users (assignees)
  | 'collaborator'            // Collaborator (extended user)

  // Enhanced Media
  | 'image'                   // Single image
  | 'images'                  // Multiple images
  | 'file'                    // Single file
  | 'files'                   // Multiple files
  | 'video'                   // Video upload
  | 'audio'                   // Audio upload

  // Enhanced Contact
  | 'location'                // Address/Location (Google Maps)

  // Enhanced Code & Tech
  | 'qr_code'                 // QR code generator
  | 'json'                    // JSON data editor
  | 'code'                    // Code snippet with syntax highlighting

  // Enhanced Numbers
  | 'decimal'                 // Decimal with precision control
  | 'slider'                  // Number slider (visual input)

  // Visual & Interactive
  | 'color'                   // Color picker
  | 'icon'                    // Icon selector
  | 'progress'                // Progress bar (0-100%)
  | 'link'                    // External link button

  // Advanced
  | 'ai_text'                 // AI-generated text
  | 'signature'               // Digital signature
  | 'vote'                    // Voting/polling

// =============================================
// DROPDOWN & TAG OPTIONS
// =============================================

export interface DropdownOption {
  id: string
  label: string
  color?: string
  icon?: string
  order: number
}

export interface TagOption {
  id: string
  label: string
  color: string
  icon?: string
}

export interface StatusOption {
  id: string
  label: string
  color: string
  icon?: string
  type: 'todo' | 'in_progress' | 'done' | 'blocked' | 'custom'
}

export interface PriorityOption {
  id: string
  label: string
  color: string
  icon: string
  level: number // 1-5
}

// =============================================
// COLUMN CONFIGURATION
// =============================================

export interface ColumnConfig {
  // Text config
  text?: {
    maxLength?: number
    placeholder?: string
  }

  // Long text config
  longText?: {
    enableRichText?: boolean
    enableMarkdown?: boolean
    minHeight?: number
    maxHeight?: number
  }

  // Dropdown config
  dropdown?: {
    options: DropdownOption[]
    allowCustom?: boolean
    color?: boolean
  }

  // Tags config
  tags?: {
    options: TagOption[]
    maxTags?: number
    colorized?: boolean
  }

  // Status config
  status?: {
    options: StatusOption[]
  }

  // Priority config
  priority?: {
    options: PriorityOption[]
    showIcon?: boolean
  }

  // Number config
  number?: {
    min?: number
    max?: number
    step?: number
    decimals?: number
    format?: 'number' | 'currency' | 'percent'
    prefix?: string
    suffix?: string
  }

  // Currency config
  currency?: {
    currency: 'EUR' | 'USD' | 'GBP' | 'SEK' | 'NOK' | 'DKK'
    decimals?: number
    symbol?: string
  }

  // Percent config
  percent?: {
    decimals?: number
    showSymbol?: boolean
  }

  // Decimal config
  decimal?: {
    precision: number
    scale: number
  }

  // Slider config
  slider?: {
    min: number
    max: number
    step: number
    showValue?: boolean
    showTicks?: boolean
  }

  // Date config
  date?: {
    format: string
    includeTime?: boolean
    timezone?: string
    minDate?: string
    maxDate?: string
  }

  // Time config
  time?: {
    format: '12h' | '24h'
    step?: number // minutes
  }

  // Duration config
  duration?: {
    format: 'hh:mm' | 'hh:mm:ss' | 'days' | 'weeks'
    showDays?: boolean
  }

  // Rating config
  rating?: {
    max: number
    icon?: 'star' | 'heart' | 'thumbs' | 'circle'
    color?: string
    allowHalf?: boolean
  }

  // Formula config
  formula?: {
    expression: string
    returnType: ColumnType
    dependencies: string[]
    errorHandling?: 'null' | 'error' | 'default'
    defaultValue?: any
  }

  // Relation config
  relation?: {
    tableId: string
    fieldKey: string
    allowMultiple?: boolean
    displayField?: string
    twoWayLink?: boolean
    linkedFieldId?: string
  }

  // Lookup config
  lookup?: {
    relationFieldId: string
    lookupFieldId: string
    returnType?: 'first' | 'last' | 'all'
  }

  // Rollup config
  rollup?: {
    relationFieldId: string
    rollupFieldId: string
    aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'concat' | 'unique'
    format?: string
  }

  // Count config
  count?: {
    relationFieldId: string
    filter?: FilterRule[]
  }

  // Image config
  image?: {
    maxSize?: number        // MB
    allowedTypes?: string[]
    thumbnail?: boolean
    aspectRatio?: string
  }

  // Images config
  images?: {
    maxCount?: number
    maxSize?: number
    layout?: 'grid' | 'list' | 'carousel'
  }

  // File config
  file?: {
    maxSize?: number
    allowedTypes?: string[]
  }

  // Files config
  files?: {
    maxCount?: number
    maxSize?: number
  }

  // Attachment config
  attachment?: {
    maxCount?: number
    maxSize?: number
    allowedTypes?: string[]
  }

  // User config
  user?: {
    allowMultiple?: boolean
    showAvatar?: boolean
    filterByRole?: string[]
  }

  // Button config
  button?: {
    label: string
    action: 'api' | 'navigation' | 'script' | 'workflow'
    config: {
      url?: string
      method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
      payload?: Record<string, any>
      navigateTo?: string
      script?: string
      workflowId?: string
    }
    variant?: 'default' | 'primary' | 'secondary' | 'destructive'
    icon?: string
  }

  // Code config
  code?: {
    language: 'javascript' | 'typescript' | 'python' | 'sql' | 'json' | 'html' | 'css'
    theme?: 'light' | 'dark'
    lineNumbers?: boolean
  }

  // JSON config
  json?: {
    schema?: Record<string, any>
    validate?: boolean
    formatOnBlur?: boolean
  }

  // Location config
  location?: {
    enableMap?: boolean
    geocoding?: boolean
    format?: 'address' | 'coordinates' | 'both'
  }

  // QR Code config
  qrCode?: {
    size?: number
    includeText?: boolean
    errorCorrection?: 'L' | 'M' | 'Q' | 'H'
  }

  // Barcode config
  barcode?: {
    format: 'CODE128' | 'EAN13' | 'UPC' | 'QR'
    showValue?: boolean
  }

  // Color config
  color?: {
    format: 'hex' | 'rgb' | 'hsl'
    swatches?: string[]
    allowCustom?: boolean
  }

  // Icon config
  icon?: {
    library: 'lucide' | 'heroicons' | 'fontawesome'
    categories?: string[]
  }

  // Progress config
  progress?: {
    showPercentage?: boolean
    color?: string
    height?: number
  }

  // Signature config
  signature?: {
    penColor?: string
    backgroundColor?: string
    width?: number
    height?: number
  }

  // Vote config
  vote?: {
    maxVotes?: number
    showResults?: boolean
    anonymous?: boolean
  }

  // AI Text config
  aiText?: {
    prompt: string
    model?: string
    maxTokens?: number
    context?: string[]  // Column keys to include as context
  }
}

// =============================================
// TABLE CONFIGURATION
// =============================================

export interface TableConfig {
  // Display
  rowHeight: 'compact' | 'normal' | 'tall' | 'auto'
  rowHeightPx?: number
  striped?: boolean
  bordered?: boolean

  // Features
  enableVirtualization: boolean
  enableSubRows: boolean
  enableFormulas: boolean
  enableAggregations: boolean
  enableFilters: boolean
  enableSort: boolean
  enableSearch: boolean
  enableGrouping: boolean
  enableColumnResize: boolean
  enableColumnReorder: boolean
  enableRowSelection: boolean
  enableBulkEdit: boolean

  // Performance
  chunkSize: number         // Rows per chunk (default: 100)
  cacheSize: number         // Cached rows (default: 1000)
  workerCount: number       // Web workers (default: 2)

  // Collaboration
  enableRealtime: boolean
  showCursors: boolean
  showChanges: boolean

  // Appearance
  headerSticky: boolean
  footerSticky: boolean
  showRowNumbers: boolean

  // Permissions
  defaultPermission: 'view' | 'edit' | 'admin'
}

// =============================================
// VIEW CONFIGURATION
// =============================================

export interface ViewConfig {
  // View type
  type: 'table' | 'kanban' | 'calendar' | 'gallery' | 'timeline' | 'form'

  // Filters
  filters?: FilterRule[]
  filterLogic?: 'AND' | 'OR'

  // Sort
  sort?: SortRule[]

  // Group
  groupBy?: string[]
  groupCollapsed?: boolean

  // Hidden columns
  hiddenColumns?: string[]

  // Column order
  columnOrder?: string[]

  // Column widths
  columnWidths?: Record<string, number>

  // Aggregations
  aggregations?: AggregationRule[]

  // Color coding
  rowColors?: ColorRule[]
}

export interface FilterRule {
  id: string
  field: string
  operator: FilterOperator
  value: any
}

export type FilterOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'not_contains'
  | 'starts_with'
  | 'ends_with'
  | 'is_empty'
  | 'is_not_empty'
  | 'greater_than'
  | 'less_than'
  | 'greater_or_equal'
  | 'less_or_equal'
  | 'between'
  | 'in'
  | 'not_in'

export interface SortRule {
  field: string
  direction: 'asc' | 'desc'
}

export interface AggregationRule {
  field: string
  function: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'count_unique'
}

export interface ColorRule {
  condition: FilterRule
  backgroundColor?: string
  textColor?: string
}

// =============================================
// DIALOG CONFIGURATION
// =============================================

export interface DialogConfig {
  // Layout
  layout: DialogLayout

  // Sections
  sections: DialogSection[]

  // Styling
  theme?: 'light' | 'dark' | 'rivest'
  width?: number | string
  height?: number | string

  // Behavior
  submitButton?: {
    label: string
    variant: 'default' | 'primary' | 'destructive'
    icon?: string
  }

  cancelButton?: {
    label: string
    show: boolean
  }

  // Validation
  validateOnChange?: boolean
  showErrors?: 'inline' | 'summary' | 'both'

  // Events
  onSubmit?: string  // Script or API endpoint
  onCancel?: string
}

export interface DialogLayout {
  type: 'vertical' | 'horizontal' | 'grid' | 'tabs'
  columns?: number
  gap?: number
}

export interface DialogSection {
  id: string
  title?: string
  description?: string
  fields: DialogField[]
  layout?: DialogLayout
  visible?: boolean | string  // boolean or formula
  order: number
  collapsible?: boolean
  defaultCollapsed?: boolean
}

export interface DialogField {
  id: string
  columnKey: string
  label?: string
  placeholder?: string
  helpText?: string
  required?: boolean
  disabled?: boolean | string
  visible?: boolean | string
  width?: number | 'full' | 'half' | 'third' | 'quarter'
  order: number

  // Custom rendering
  customComponent?: string
  customProps?: Record<string, any>

  // Validation
  validation?: ValidationRule[]
}

export interface ValidationRule {
  type: 'required' | 'min' | 'max' | 'pattern' | 'custom'
  value?: any
  message: string
}

// =============================================
// PERMISSION TYPES
// =============================================

export type ColumnPermissionType = 'hidden' | 'view' | 'edit'

export type RowPolicyType = 'owner' | 'assigned' | 'department' | 'manager' | 'custom'

export interface TablePermission {
  id: string
  tableId: string
  groupId?: string
  userId?: string
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  isAdmin: boolean
}

export interface ColumnPermission {
  id: string
  columnId: string
  groupId?: string
  userId?: string
  permission: ColumnPermissionType
}

export interface RowPolicy {
  id: string
  tableId: string
  name: string
  description?: string
  type: RowPolicyType
  condition: PolicyCondition
  allowView: boolean
  allowEdit: boolean
  allowDelete: boolean
  priority: number
  enabled: boolean
}

export interface PolicyCondition {
  field: string
  operator: 'equals' | 'not_equals' | 'in' | 'contains'
  value: string | string[]  // Can include {{current_user_id}}, {{user_departments}}, etc.
}

// =============================================
// ULTRA TABLE ENTITY TYPES
// =============================================

export interface UltraTable {
  id: string
  tenantId: string
  name: string
  description?: string
  config: TableConfig
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface UltraTableColumn {
  id: string
  tableId: string
  name: string
  key: string
  type: ColumnType
  config: ColumnConfig
  formula?: string
  validation?: ValidationRule[]
  width?: number
  visible: boolean
  pinned?: 'left' | 'right'
  order: number
  createdAt: Date
  updatedAt: Date
}

export interface UltraTableRow {
  id: string
  tableId: string
  parentId?: string
  level: number
  order: number
  data: Record<string, any>
  height?: number
  expanded: boolean
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface UltraTableView {
  id: string
  tableId: string
  name: string
  description?: string
  config: ViewConfig
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface UltraDialog {
  id: string
  tenantId: string
  tableId?: string
  name: string
  type: 'create' | 'edit' | 'view' | 'custom'
  config: DialogConfig
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

// =============================================
// CELL VALUE TYPES
// =============================================

export type CellValue =
  | string
  | number
  | boolean
  | Date
  | null
  | string[]              // multi_select, tags
  | UserReference         // user
  | UserReference[]       // multi_user
  | FileReference         // file, image
  | FileReference[]       // files, images, attachment
  | LocationValue         // location
  | RelationValue[]       // relation
  | Record<string, any>   // json

export interface UserReference {
  id: string
  email: string
  name: string
  avatarUrl?: string
}

export interface FileReference {
  id: string
  name: string
  url: string
  size: number
  type: string
  thumbnailUrl?: string
}

export interface LocationValue {
  address: string
  city?: string
  country?: string
  lat?: number
  lng?: number
}

export interface RelationValue {
  id: string
  displayValue: string
}

// =============================================
// DEFAULT CONFIGS
// =============================================

export const DEFAULT_TABLE_CONFIG: TableConfig = {
  rowHeight: 'normal',
  striped: false,
  bordered: true,
  enableVirtualization: true,
  enableSubRows: false,
  enableFormulas: true,
  enableAggregations: true,
  enableFilters: true,
  enableSort: true,
  enableSearch: true,
  enableGrouping: false,
  enableColumnResize: true,
  enableColumnReorder: true,
  enableRowSelection: true,
  enableBulkEdit: true,
  chunkSize: 100,
  cacheSize: 1000,
  workerCount: 2,
  enableRealtime: false,
  showCursors: false,
  showChanges: false,
  headerSticky: true,
  footerSticky: false,
  showRowNumbers: false,
  defaultPermission: 'view'
}

export const DEFAULT_VIEW_CONFIG: ViewConfig = {
  type: 'table',
  filters: [],
  filterLogic: 'AND',
  sort: [],
  hiddenColumns: [],
  columnOrder: [],
  columnWidths: {}
}

export const DEFAULT_DIALOG_CONFIG: DialogConfig = {
  layout: { type: 'vertical', gap: 16 },
  sections: [],
  theme: 'rivest',
  width: 600,
  submitButton: { label: 'Save', variant: 'primary' },
  cancelButton: { label: 'Cancel', show: true },
  validateOnChange: true,
  showErrors: 'inline'
}
