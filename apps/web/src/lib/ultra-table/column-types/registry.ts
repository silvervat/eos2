/**
 * Column Type Registry
 *
 * Central registry for all 55 column types.
 * Provides lookup, categorization, and search functionality.
 */

import type { ColumnType } from '@/types/ultra-table'
import type { ColumnTypeDefinition, ColumnTypeGroup, ColumnCategory, COLUMN_CATEGORIES } from './types'

// Import column type definitions
import { TextColumn } from './basic/text'
import { LongTextColumn } from './basic/long-text'
import { NumberColumn } from './basic/number'
import { CurrencyColumn } from './basic/currency'
import { PercentColumn } from './basic/percent'
import { DecimalColumn } from './basic/decimal'
import { RatingColumn } from './basic/rating'
import { SliderColumn } from './basic/slider'

import { DropdownColumn } from './selection/dropdown'
import { MultiSelectColumn } from './selection/multi-select'
import { TagsColumn } from './selection/tags'
import { StatusColumn } from './selection/status'
import { PriorityColumn } from './selection/priority'
import { CheckboxColumn } from './selection/checkbox'
import { ToggleColumn } from './selection/toggle'

import { DateColumn } from './datetime/date'
import { DateTimeColumn } from './datetime/datetime'
import { TimeColumn } from './datetime/time'
import { DurationColumn } from './datetime/duration'
import { CreatedTimeColumn } from './datetime/created-time'
import { ModifiedTimeColumn } from './datetime/modified-time'

import { UserColumn } from './people/user'
import { MultiUserColumn } from './people/multi-user'
import { CreatedByColumn } from './people/created-by'
import { ModifiedByColumn } from './people/modified-by'
import { CollaboratorColumn } from './people/collaborator'

import { ImageColumn } from './media/image'
import { ImagesColumn } from './media/images'
import { FileColumn } from './media/file'
import { FilesColumn } from './media/files'
import { VideoColumn } from './media/video'
import { AudioColumn } from './media/audio'
import { AttachmentColumn } from './media/attachment'

import { EmailColumn } from './contact/email'
import { PhoneColumn } from './contact/phone'
import { UrlColumn } from './contact/url'
import { LocationColumn } from './contact/location'

import { QRCodeColumn } from './code/qr-code'
import { BarcodeColumn } from './code/barcode'
import { JsonColumn } from './code/json'
import { CodeColumn } from './code/code'

import { RelationColumn } from './relations/relation'
import { LookupColumn } from './relations/lookup'
import { RollupColumn } from './relations/rollup'
import { CountColumn } from './relations/count'

import { FormulaColumn } from './formulas/formula'
import { AutoNumberColumn } from './formulas/auto-number'

import { ColorColumn } from './visual/color'
import { IconColumn } from './visual/icon'
import { ProgressColumn } from './visual/progress'
import { ButtonColumn } from './visual/button'
import { LinkColumn } from './visual/link'

import { AITextColumn } from './advanced/ai-text'
import { SignatureColumn } from './advanced/signature'
import { VoteColumn } from './advanced/vote'

// =============================================
// COLUMN TYPE REGISTRY
// =============================================

export const COLUMN_TYPE_REGISTRY: Record<ColumnType, ColumnTypeDefinition> = {
  // Basic types
  text: TextColumn,
  long_text: LongTextColumn,
  number: NumberColumn,
  currency: CurrencyColumn,
  percent: PercentColumn,
  decimal: DecimalColumn,
  rating: RatingColumn,
  slider: SliderColumn,

  // Selection types
  dropdown: DropdownColumn,
  multi_select: MultiSelectColumn,
  tags: TagsColumn,
  status: StatusColumn,
  priority: PriorityColumn,
  checkbox: CheckboxColumn,
  toggle: ToggleColumn,

  // DateTime types
  date: DateColumn,
  datetime: DateTimeColumn,
  time: TimeColumn,
  duration: DurationColumn,
  created_time: CreatedTimeColumn,
  modified_time: ModifiedTimeColumn,

  // People types
  user: UserColumn,
  multi_user: MultiUserColumn,
  created_by: CreatedByColumn,
  modified_by: ModifiedByColumn,
  collaborator: CollaboratorColumn,

  // Media types
  image: ImageColumn,
  images: ImagesColumn,
  file: FileColumn,
  files: FilesColumn,
  video: VideoColumn,
  audio: AudioColumn,
  attachment: AttachmentColumn,

  // Contact types
  email: EmailColumn,
  phone: PhoneColumn,
  url: UrlColumn,
  location: LocationColumn,

  // Code types
  qr_code: QRCodeColumn,
  barcode: BarcodeColumn,
  json: JsonColumn,
  code: CodeColumn,

  // Relation types
  relation: RelationColumn,
  lookup: LookupColumn,
  rollup: RollupColumn,
  count: CountColumn,

  // Formula types
  formula: FormulaColumn,
  auto_number: AutoNumberColumn,

  // Visual types
  color: ColorColumn,
  icon: IconColumn,
  progress: ProgressColumn,
  button: ButtonColumn,
  link: LinkColumn,

  // Advanced types
  ai_text: AITextColumn,
  signature: SignatureColumn,
  vote: VoteColumn,
}

// =============================================
// REGISTRY FUNCTIONS
// =============================================

/**
 * Get column type definition by type
 */
export function getColumnType(type: ColumnType): ColumnTypeDefinition {
  const definition = COLUMN_TYPE_REGISTRY[type]

  if (!definition) {
    throw new Error(`Unknown column type: ${type}`)
  }

  return definition
}

/**
 * Check if column type exists
 */
export function hasColumnType(type: string): type is ColumnType {
  return type in COLUMN_TYPE_REGISTRY
}

/**
 * Get all available column types
 */
export function getAllColumnTypes(): ColumnTypeDefinition[] {
  return Object.values(COLUMN_TYPE_REGISTRY)
}

/**
 * Get column types by category
 */
export function getColumnTypesByCategory(category: ColumnCategory): ColumnTypeDefinition[] {
  return getAllColumnTypes().filter(type => type.category === category)
}

/**
 * Get column types grouped by category
 */
export function getColumnTypesGrouped(): ColumnTypeGroup[] {
  const groups: Record<ColumnCategory, ColumnTypeDefinition[]> = {
    basic: [],
    selection: [],
    datetime: [],
    people: [],
    media: [],
    contact: [],
    code: [],
    relations: [],
    formulas: [],
    visual: [],
    advanced: [],
  }

  for (const type of getAllColumnTypes()) {
    groups[type.category].push(type)
  }

  return Object.entries(groups)
    .filter(([_, types]) => types.length > 0)
    .map(([category, types]) => ({
      category: category as ColumnCategory,
      types,
    }))
}

/**
 * Search column types by name or description
 */
export function searchColumnTypes(query: string): ColumnTypeDefinition[] {
  const lowerQuery = query.toLowerCase()

  return getAllColumnTypes()
    .filter(type =>
      type.name.toLowerCase().includes(lowerQuery) ||
      type.description.toLowerCase().includes(lowerQuery) ||
      type.type.toLowerCase().includes(lowerQuery)
    )
    .sort((a, b) => {
      // Prioritize exact name matches
      const aNameMatch = a.name.toLowerCase().startsWith(lowerQuery) ? 0 : 1
      const bNameMatch = b.name.toLowerCase().startsWith(lowerQuery) ? 0 : 1
      return aNameMatch - bNameMatch
    })
}

/**
 * Get Airtable-compatible column types only
 */
export function getAirtableCompatibleTypes(): ColumnTypeDefinition[] {
  const airtableTypes: ColumnType[] = [
    'text', 'long_text', 'number', 'currency', 'percent', 'duration', 'rating',
    'auto_number', 'formula', 'dropdown', 'multi_select', 'checkbox', 'datetime',
    'created_time', 'modified_time', 'date', 'user', 'created_by', 'modified_by',
    'attachment', 'email', 'phone', 'url', 'barcode', 'button', 'relation',
    'lookup', 'rollup', 'count'
  ]

  return airtableTypes.map(type => COLUMN_TYPE_REGISTRY[type])
}

/**
 * Get Rivest exclusive column types (not in Airtable)
 */
export function getRivestExclusiveTypes(): ColumnTypeDefinition[] {
  const exclusiveTypes: ColumnType[] = [
    'tags', 'status', 'priority', 'toggle', 'time', 'multi_user', 'collaborator',
    'image', 'images', 'file', 'files', 'video', 'audio', 'location', 'qr_code',
    'json', 'code', 'decimal', 'slider', 'color', 'icon', 'progress', 'link',
    'ai_text', 'signature', 'vote'
  ]

  return exclusiveTypes.map(type => COLUMN_TYPE_REGISTRY[type])
}

/**
 * Get column type icon
 */
export function getColumnTypeIcon(type: ColumnType): React.ComponentType<{ className?: string }> {
  return COLUMN_TYPE_REGISTRY[type]?.icon
}

/**
 * Get column type name
 */
export function getColumnTypeName(type: ColumnType): string {
  return COLUMN_TYPE_REGISTRY[type]?.name || type
}

/**
 * Validate value for column type
 */
export function validateColumnValue(
  type: ColumnType,
  value: any,
  config: any
): boolean | string {
  const definition = COLUMN_TYPE_REGISTRY[type]

  if (!definition?.validate) {
    return true
  }

  return definition.validate(value, config)
}

/**
 * Format value for display
 */
export function formatColumnValue(
  type: ColumnType,
  value: any,
  config: any
): string {
  const definition = COLUMN_TYPE_REGISTRY[type]

  if (!definition?.format) {
    return String(value ?? '')
  }

  return definition.format(value, config)
}

/**
 * Parse value from string input
 */
export function parseColumnValue(
  type: ColumnType,
  value: string,
  config: any
): any {
  const definition = COLUMN_TYPE_REGISTRY[type]

  if (!definition?.parse) {
    return value
  }

  return definition.parse(value, config)
}
