/**
 * Column Type System - Type Definitions
 */

import { z } from 'zod'
import type { ReactNode, ComponentType } from 'react'
import type {
  ColumnType,
  ColumnConfig,
  UltraTableColumn,
  UltraTableRow,
} from '@/types/ultra-table'

// =============================================
// COLUMN CATEGORIES
// =============================================

export type ColumnCategory =
  | 'basic'
  | 'selection'
  | 'datetime'
  | 'people'
  | 'media'
  | 'contact'
  | 'code'
  | 'relations'
  | 'formulas'
  | 'visual'
  | 'advanced'

export const COLUMN_CATEGORIES: Record<ColumnCategory, {
  name: string
  description: string
  order: number
}> = {
  basic: { name: 'Basic', description: 'Text and numbers', order: 1 },
  selection: { name: 'Selection', description: 'Dropdowns and checkboxes', order: 2 },
  datetime: { name: 'Date & Time', description: 'Dates, times, and durations', order: 3 },
  people: { name: 'People', description: 'Users and collaborators', order: 4 },
  media: { name: 'Media', description: 'Images, files, and attachments', order: 5 },
  contact: { name: 'Contact', description: 'Email, phone, and location', order: 6 },
  code: { name: 'Code & Tech', description: 'QR codes, barcodes, JSON', order: 7 },
  relations: { name: 'Relations', description: 'Links between tables', order: 8 },
  formulas: { name: 'Formulas', description: 'Calculated fields', order: 9 },
  visual: { name: 'Visual', description: 'Colors, icons, progress', order: 10 },
  advanced: { name: 'Advanced', description: 'AI, signatures, voting', order: 11 },
}

// =============================================
// RENDERER PROPS
// =============================================

export interface CellRendererProps {
  value: any
  column: UltraTableColumn
  row: UltraTableRow
  isEditing: boolean
  onChange: (value: any) => void
  onStartEdit?: () => void
  onEndEdit?: () => void
}

export interface EditorRendererProps extends CellRendererProps {
  onSave: (value: any) => void
  onCancel: () => void
  autoFocus?: boolean
}

export interface HeaderRendererProps {
  column: UltraTableColumn
  onSort?: (direction: 'asc' | 'desc' | null) => void
  sortDirection?: 'asc' | 'desc' | null
  onFilter?: (value: any) => void
  filterValue?: any
}

export interface ConfigEditorProps {
  config: ColumnConfig
  onChange: (config: ColumnConfig) => void
}

// =============================================
// AGGREGATION TYPES
// =============================================

export type AggregationType =
  | 'sum'
  | 'avg'
  | 'min'
  | 'max'
  | 'count'
  | 'count_unique'
  | 'count_empty'
  | 'count_not_empty'
  | 'percent_empty'
  | 'percent_not_empty'

// =============================================
// COLUMN TYPE DEFINITION
// =============================================

export interface ColumnTypeDefinition {
  // Metadata
  type: ColumnType
  name: string
  description: string
  category: ColumnCategory
  icon: ComponentType<{ className?: string }>

  // Configuration
  defaultConfig: Partial<ColumnConfig>
  configSchema?: z.ZodSchema

  // Rendering
  CellRenderer: ComponentType<CellRendererProps>
  EditorRenderer?: ComponentType<EditorRendererProps>
  HeaderRenderer?: ComponentType<HeaderRendererProps>
  ConfigEditor?: ComponentType<ConfigEditorProps>

  // Value handling
  defaultValue?: any
  validate?: (value: any, config: ColumnConfig) => boolean | string
  format?: (value: any, config: ColumnConfig) => string
  parse?: (value: string, config: ColumnConfig) => any

  // Sorting & Filtering
  sort?: (a: any, b: any, config: ColumnConfig) => number
  filter?: (value: any, filterValue: any, operator: string, config: ColumnConfig) => boolean
  getFilterOperators?: () => { value: string; label: string }[]

  // Aggregation
  supportedAggregations?: AggregationType[]
  aggregate?: (values: any[], aggregation: AggregationType, config: ColumnConfig) => any

  // Formula support
  calculateFormula?: (expression: string, row: UltraTableRow, allRows: UltraTableRow[]) => any

  // Import/Export
  exportValue?: (value: any, config: ColumnConfig) => string
  importValue?: (value: string, config: ColumnConfig) => any

  // Copy/Paste
  copyValue?: (value: any, config: ColumnConfig) => string
  pasteValue?: (value: string, config: ColumnConfig) => any

  // Read-only flag (for computed columns)
  isReadOnly?: boolean

  // Auto-fill support
  supportsAutoFill?: boolean
  autoFillNext?: (currentValue: any, direction: 'down' | 'up', config: ColumnConfig) => any
}

// =============================================
// HELPER TYPES
// =============================================

export interface ColumnTypeGroup {
  category: ColumnCategory
  types: ColumnTypeDefinition[]
}

export interface ColumnTypeSearchResult {
  type: ColumnTypeDefinition
  score: number
}

// =============================================
// FILTER OPERATORS
// =============================================

export const COMMON_FILTER_OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Does not equal' },
  { value: 'is_empty', label: 'Is empty' },
  { value: 'is_not_empty', label: 'Is not empty' },
]

export const TEXT_FILTER_OPERATORS = [
  ...COMMON_FILTER_OPERATORS,
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Does not contain' },
  { value: 'starts_with', label: 'Starts with' },
  { value: 'ends_with', label: 'Ends with' },
]

export const NUMBER_FILTER_OPERATORS = [
  ...COMMON_FILTER_OPERATORS,
  { value: 'greater_than', label: 'Greater than' },
  { value: 'less_than', label: 'Less than' },
  { value: 'greater_or_equal', label: 'Greater than or equal' },
  { value: 'less_or_equal', label: 'Less than or equal' },
  { value: 'between', label: 'Between' },
]

export const DATE_FILTER_OPERATORS = [
  ...COMMON_FILTER_OPERATORS,
  { value: 'before', label: 'Before' },
  { value: 'after', label: 'After' },
  { value: 'between', label: 'Between' },
  { value: 'today', label: 'Is today' },
  { value: 'this_week', label: 'This week' },
  { value: 'this_month', label: 'This month' },
  { value: 'past_week', label: 'Past week' },
  { value: 'past_month', label: 'Past month' },
]

export const SELECTION_FILTER_OPERATORS = [
  { value: 'equals', label: 'Is' },
  { value: 'not_equals', label: 'Is not' },
  { value: 'in', label: 'Is any of' },
  { value: 'not_in', label: 'Is none of' },
  { value: 'is_empty', label: 'Is empty' },
  { value: 'is_not_empty', label: 'Is not empty' },
]
