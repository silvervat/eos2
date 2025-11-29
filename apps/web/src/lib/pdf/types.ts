// PDF Template Types - Rivest Platform
// Based on pdfme library

export interface PDFTemplate {
  id: string
  tenantId: string
  name: string
  description?: string
  category: PDFTemplateCategory
  basePdf: BasePDF
  schemas: Schema[][]
  sampleData?: Record<string, string>[]
  createdAt: Date
  updatedAt: Date
  isDefault?: boolean
  isActive: boolean
}

export type PDFTemplateCategory =
  | 'invoice'      // Arved
  | 'quote'        // Hinnapakkumised
  | 'contract'     // Lepingud
  | 'report'       // Aruanded
  | 'certificate'  // Sertifikaadid
  | 'additional_work' // Lisatööd
  | 'timesheet'    // Tööajatabelid
  | 'delivery'     // Saatelehed
  | 'other'        // Muud

export interface BasePDF {
  width: number   // mm
  height: number  // mm
  padding: [number, number, number, number] // [top, right, bottom, left]
}

export type SchemaType =
  | 'text'
  | 'image'
  | 'table'
  | 'qrcode'
  | 'barcode'
  | 'line'
  | 'rectangle'
  | 'ellipse'
  | 'svg'
  | 'date'
  | 'time'
  | 'dateTime'

export interface BaseSchema {
  type: SchemaType
  name: string
  position: { x: number; y: number }
  width: number
  height: number
  rotate?: number
  opacity?: number
}

export interface TextSchema extends BaseSchema {
  type: 'text'
  content?: string
  fontName?: string
  fontSize?: number
  fontColor?: string
  alignment?: 'left' | 'center' | 'right'
  verticalAlignment?: 'top' | 'middle' | 'bottom'
  lineHeight?: number
  characterSpacing?: number
  backgroundColor?: string
}

export interface ImageSchema extends BaseSchema {
  type: 'image'
  content?: string // base64 or URL
}

export interface TableSchema extends BaseSchema {
  type: 'table'
  head?: string[][]
  content?: string[][]
  headStyles?: TableCellStyle
  bodyStyles?: TableCellStyle
  columnStyles?: Record<number, TableCellStyle>
  tableStyles?: {
    borderWidth?: number
    borderColor?: string
  }
  showHead?: boolean
}

export interface TableCellStyle {
  fontName?: string
  fontSize?: number
  fontColor?: string
  backgroundColor?: string
  alignment?: 'left' | 'center' | 'right'
  padding?: number | [number, number, number, number]
  borderWidth?: number
  borderColor?: string
  minCellHeight?: number
}

export interface QRCodeSchema extends BaseSchema {
  type: 'qrcode'
  content?: string
  backgroundColor?: string
  foregroundColor?: string
}

export interface BarcodeSchema extends BaseSchema {
  type: 'barcode'
  content?: string
  barcodeType?: 'code128' | 'code39' | 'ean13' | 'ean8' | 'upca' | 'upce' | 'itf14' | 'nw7'
  backgroundColor?: string
  foregroundColor?: string
  includeText?: boolean
}

export interface ShapeSchema extends BaseSchema {
  type: 'line' | 'rectangle' | 'ellipse'
  color?: string
  borderColor?: string
  borderWidth?: number
}

export interface DateSchema extends BaseSchema {
  type: 'date' | 'time' | 'dateTime'
  format?: string
  fontName?: string
  fontSize?: number
  fontColor?: string
  alignment?: 'left' | 'center' | 'right'
}

export type Schema =
  | TextSchema
  | ImageSchema
  | TableSchema
  | QRCodeSchema
  | BarcodeSchema
  | ShapeSchema
  | DateSchema

// Template variables for dynamic data
export interface TemplateVariable {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'currency' | 'image' | 'table'
  defaultValue?: string
  format?: string
  required?: boolean
}

// Page sizes
export const PAGE_SIZES = {
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
  A5: { width: 148, height: 210 },
  LETTER: { width: 216, height: 279 },
  LEGAL: { width: 216, height: 356 },
} as const

export type PageSize = keyof typeof PAGE_SIZES

// Template category labels (Estonian)
export const CATEGORY_LABELS: Record<PDFTemplateCategory, string> = {
  invoice: 'Arved',
  quote: 'Hinnapakkumised',
  contract: 'Lepingud',
  report: 'Aruanded',
  certificate: 'Sertifikaadid',
  additional_work: 'Lisatööd',
  timesheet: 'Tööajatabelid',
  delivery: 'Saatelehed',
  other: 'Muud',
}

// Generate unique ID
export function generateTemplateId(): string {
  return `tpl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}
