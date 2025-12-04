import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

// ============ RESOURCE DEFINITION ============

export interface ResourceDefinition {
  /** Database table name in Supabase */
  name: string
  /** Display name (singular), e.g., "Project" */
  label: string
  /** Display name (plural), e.g., "Projects" */
  labelPlural: string
  /** Icon component from lucide-react */
  icon: LucideIcon
  /** Base URL path, e.g., "/projects" */
  basePath: string
  /** Supabase select string with relations, e.g., "*, client:clients(id, name)" */
  select: string
  /** Column definitions for table display */
  columns: ColumnDefinition[]
  /** Field definitions for forms */
  fields: FieldDefinition[]
  /** Filter definitions for list filtering */
  filters?: FilterDefinition[]
  /** Resource capabilities */
  capabilities?: ResourceCapabilities
  /** Lifecycle hooks */
  hooks?: ResourceHooks
  /** Default sort configuration */
  defaultSort?: {
    field: string
    order: 'asc' | 'desc'
  }
  /** Search configuration */
  search?: {
    /** Fields to search in */
    fields: string[]
    /** Placeholder text */
    placeholder?: string
  }
}

// ============ CAPABILITIES ============

export interface ResourceCapabilities {
  /** Allow creating new records */
  create?: boolean
  /** Allow editing records */
  edit?: boolean
  /** Allow deleting records */
  delete?: boolean
  /** Allow bulk delete */
  bulkDelete?: boolean
  /** Allow exporting data */
  export?: boolean
  /** Allow importing data */
  import?: boolean
  /** Show detail view */
  show?: boolean
}

// ============ HOOKS ============

export interface ResourceHooks {
  /** Transform data before creating */
  beforeCreate?: (data: Record<string, unknown>) => Record<string, unknown>
  /** Called after successful create */
  afterCreate?: (data: Record<string, unknown>) => void
  /** Transform data before updating */
  beforeUpdate?: (data: Record<string, unknown>) => Record<string, unknown>
  /** Called after successful update */
  afterUpdate?: (data: Record<string, unknown>) => void
  /** Called before deleting */
  beforeDelete?: (id: string) => void
  /** Called after successful delete */
  afterDelete?: (id: string) => void
  /** Custom validation */
  validate?: (data: Record<string, unknown>) => Record<string, string> | null
}

// ============ COLUMN DEFINITION ============

export interface ColumnDefinition {
  /** Field name or path (e.g., "name" or "client.name") */
  field: string
  /** Display label */
  label: string
  /** Column type for rendering */
  type: ColumnType
  /** Allow sorting by this column */
  sortable?: boolean
  /** Allow filtering by this column */
  filterable?: boolean
  /** Column width (number for px, string for other units) */
  width?: number | string
  /** Minimum width */
  minWidth?: number
  /** Custom render function */
  render?: (value: unknown, record: Record<string, unknown>) => ReactNode
  /** For relation type: the nested field path */
  relationField?: string
  /** For status type: status color mapping */
  statusColors?: Record<string, StatusColor>
  /** Hide column by default */
  hidden?: boolean
  /** Fixed column position */
  fixed?: 'left' | 'right'
  /** Text alignment */
  align?: 'left' | 'center' | 'right'
  /** Tooltip text */
  tooltip?: string
}

export type ColumnType =
  | 'text'
  | 'number'
  | 'date'
  | 'datetime'
  | 'status'
  | 'currency'
  | 'relation'
  | 'boolean'
  | 'tags'
  | 'email'
  | 'phone'
  | 'image'
  | 'avatar'
  | 'progress'
  | 'link'
  | 'json'

export type StatusColor =
  | 'default'
  | 'blue'
  | 'green'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'purple'
  | 'pink'
  | 'gray'
  | 'cyan'

// ============ FIELD DEFINITION ============

export interface FieldDefinition {
  /** Field name in the database */
  name: string
  /** Display label */
  label: string
  /** Input type */
  type: FieldType
  /** Field is required */
  required?: boolean
  /** Placeholder text */
  placeholder?: string
  /** Default value */
  defaultValue?: unknown
  /** Help text shown below the field */
  helpText?: string
  /** Validation rules */
  validation?: FieldValidation
  /** For select/multiselect: options list */
  options?: SelectOption[]
  /** For relation: resource name to relate to */
  relationResource?: string
  /** For relation: field to display as label */
  relationLabel?: string
  /** For relation: additional filter */
  relationFilter?: Record<string, unknown>
  /** Conditional display function */
  showIf?: (values: Record<string, unknown>) => boolean
  /** Conditional disable function */
  disableIf?: (values: Record<string, unknown>) => boolean
  /** Grid span (1-24) */
  span?: number
  /** Field group name */
  group?: string
  /** Display order within group */
  order?: number
  /** Read-only field */
  readOnly?: boolean
  /** Hide field in create form */
  hideOnCreate?: boolean
  /** Hide field in edit form */
  hideOnEdit?: boolean
  /** Custom render for display mode */
  renderDisplay?: (value: unknown) => ReactNode
  /** For file/image: accepted file types */
  accept?: string
  /** For file/image: max file size in bytes */
  maxSize?: number
  /** For number/currency: minimum value */
  min?: number
  /** For number/currency: maximum value */
  max?: number
  /** For number/currency: step value */
  step?: number
  /** For textarea: number of rows */
  rows?: number
  /** For text: input mask */
  mask?: string
  /** Transform value before saving */
  transform?: (value: unknown) => unknown
}

export type FieldType =
  | 'text'
  | 'textarea'
  | 'number'
  | 'currency'
  | 'select'
  | 'multiselect'
  | 'date'
  | 'datetime'
  | 'time'
  | 'switch'
  | 'checkbox'
  | 'radio'
  | 'relation'
  | 'file'
  | 'image'
  | 'email'
  | 'phone'
  | 'url'
  | 'color'
  | 'password'
  | 'richtext'
  | 'json'
  | 'tags'
  | 'slider'
  | 'rating'
  | 'hidden'

export interface FieldValidation {
  /** Minimum value (for numbers) */
  min?: number
  /** Maximum value (for numbers) */
  max?: number
  /** Minimum length (for strings) */
  minLength?: number
  /** Maximum length (for strings) */
  maxLength?: number
  /** Regex pattern */
  pattern?: RegExp
  /** Custom validation message */
  message?: string
  /** Custom validation function */
  custom?: (value: unknown, allValues: Record<string, unknown>) => string | null
}

export interface SelectOption {
  /** Option value */
  value: string | number | boolean
  /** Display label */
  label: string
  /** Optional color for status-like selects */
  color?: StatusColor
  /** Disable this option */
  disabled?: boolean
  /** Group name for grouped options */
  group?: string
  /** Optional icon */
  icon?: LucideIcon
}

// ============ FILTER DEFINITION ============

export interface FilterDefinition {
  /** Field name to filter */
  field: string
  /** Display label */
  label: string
  /** Filter input type */
  type: FilterType
  /** For select filters: options */
  options?: SelectOption[]
  /** Default filter value */
  defaultValue?: unknown
  /** Placeholder text */
  placeholder?: string
  /** Allow multiple values */
  multiple?: boolean
  /** For relation: resource to load options from */
  relationResource?: string
  /** For relation: field to display as label */
  relationLabel?: string
}

export type FilterType =
  | 'text'
  | 'select'
  | 'multiselect'
  | 'date'
  | 'daterange'
  | 'number'
  | 'numberrange'
  | 'boolean'
  | 'relation'

// ============ UTILITY TYPES ============

/** Get the type of a specific field from a resource */
export type ResourceRecord<R extends ResourceDefinition> = Record<string, unknown>

/** Extract field names from a resource definition */
export type FieldNames<R extends ResourceDefinition> = R['fields'][number]['name']

/** Get column field names */
export type ColumnFields<R extends ResourceDefinition> = R['columns'][number]['field']
