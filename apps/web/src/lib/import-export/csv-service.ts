// CSV Import/Export Service - Rivest Platform
// Uses PapaParse for parsing and generating CSV files

import Papa from 'papaparse'
import { saveAs } from 'file-saver'
import type { ColumnConfig, ImportResult, ImportError, ImportOptions } from './xlsx-service'

export interface CSVExportOptions {
  fileName: string
  columns: ColumnConfig[]
  data: Record<string, unknown>[]
  delimiter?: ',' | ';' | '\t'
  includeHeader?: boolean
  dateFormat?: string
  encoding?: 'utf-8' | 'utf-16' | 'windows-1252'
  bom?: boolean
}

export interface CSVImportOptions extends ImportOptions {
  delimiter?: ',' | ';' | '\t' | 'auto'
  encoding?: string
  preview?: number
}

// Format value for CSV export
function formatValue(
  value: unknown,
  type?: string,
  dateFormat?: string
): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (type === 'date' && value instanceof Date) {
    // Simple date formatting
    const d = value
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()

    if (dateFormat === 'YYYY-MM-DD') {
      return `${year}-${month}-${day}`
    }
    return `${day}.${month}.${year}` // Estonian format default
  }

  if (type === 'boolean') {
    return value ? 'Jah' : 'Ei'
  }

  if (type === 'currency' && typeof value === 'number') {
    return value.toFixed(2).replace('.', ',') + ' €'
  }

  if (type === 'number' && typeof value === 'number') {
    return String(value).replace('.', ',')
  }

  return String(value)
}

// Export to CSV
export async function exportToCSV(options: CSVExportOptions): Promise<void> {
  const {
    fileName,
    columns,
    data,
    delimiter = ';', // Semicolon default for Estonian Excel compatibility
    includeHeader = true,
    dateFormat = 'DD.MM.YYYY',
    bom = true, // BOM for Excel UTF-8 compatibility
  } = options

  // Prepare data for CSV
  const csvData: string[][] = []

  // Add header row
  if (includeHeader) {
    csvData.push(columns.map((col) => col.header))
  }

  // Add data rows
  data.forEach((row) => {
    const rowData = columns.map((col) => {
      const value = row[col.key]
      return formatValue(value, col.type, dateFormat)
    })
    csvData.push(rowData)
  })

  // Generate CSV string
  const csv = Papa.unparse(csvData, {
    delimiter,
    newline: '\r\n',
  })

  // Add BOM for Excel compatibility
  const csvContent = bom ? '\ufeff' + csv : csv

  // Create blob and download
  const blob = new Blob([csvContent], {
    type: 'text/csv;charset=utf-8',
  })

  const finalFileName = fileName.endsWith('.csv') ? fileName : `${fileName}.csv`
  saveAs(blob, finalFileName)
}

// Import from CSV
export async function importFromCSV<T = Record<string, unknown>>(
  file: File,
  options: CSVImportOptions
): Promise<ImportResult<T>> {
  const {
    columns,
    delimiter = 'auto',
    skipEmptyRows = true,
    validateRequired = true,
    transformers = {},
    preview,
  } = options

  return new Promise((resolve) => {
    const result: ImportResult<T> = {
      success: true,
      data: [],
      errors: [],
      warnings: [],
      totalRows: 0,
      validRows: 0,
    }

    Papa.parse(file, {
      delimiter: delimiter === 'auto' ? undefined : delimiter,
      header: true,
      skipEmptyLines: skipEmptyRows,
      preview,
      encoding: options.encoding || 'UTF-8',
      transformHeader: (header: string) => header.trim().toLowerCase(),
      complete: (results) => {
        if (results.errors.length > 0) {
          results.errors.forEach((error) => {
            result.errors.push({
              row: error.row || 0,
              column: '',
              value: null,
              message: error.message,
            })
          })
        }

        // Map CSV headers to column configs
        const headerMap = new Map<string, ColumnConfig>()
        columns.forEach((col) => {
          headerMap.set(col.header.toLowerCase(), col)
          headerMap.set(col.key.toLowerCase(), col)
        })

        // Check for missing required columns
        const csvHeaders = results.meta.fields || []
        const foundKeys = new Set<string>()

        csvHeaders.forEach((header) => {
          const col = headerMap.get(header.toLowerCase())
          if (col) {
            foundKeys.add(col.key)
          }
        })

        const missingRequired = columns.filter(
          (col) => col.required && !foundKeys.has(col.key)
        )

        if (missingRequired.length > 0) {
          result.warnings.push(
            `Puuduvad veerud: ${missingRequired.map((c) => c.header).join(', ')}`
          )
        }

        // Process each row
        (results.data as Record<string, string>[]).forEach((row, index) => {
          result.totalRows++

          const rowData: Record<string, unknown> = {}
          let rowValid = true

          columns.forEach((col) => {
            // Find the value - try different key variations
            let value: unknown =
              row[col.key.toLowerCase()] ||
              row[col.header.toLowerCase()] ||
              row[col.key] ||
              row[col.header]

            // Type conversion
            if (col.type === 'number' && value !== null && value !== undefined && value !== '') {
              // Handle Estonian number format (comma as decimal separator)
              const numStr = String(value).replace(',', '.').replace(/\s/g, '')
              const num = Number(numStr)
              if (isNaN(num)) {
                result.errors.push({
                  row: index + 2, // +2 for header and 0-index
                  column: col.header,
                  value,
                  message: `Vigane number: "${value}"`,
                })
                rowValid = false
              } else {
                value = num
              }
            } else if (col.type === 'currency' && value) {
              // Remove currency symbol and parse
              const numStr = String(value)
                .replace(/[€$£]/g, '')
                .replace(',', '.')
                .replace(/\s/g, '')
                .trim()
              const num = Number(numStr)
              if (isNaN(num)) {
                result.errors.push({
                  row: index + 2,
                  column: col.header,
                  value,
                  message: `Vigane summa: "${value}"`,
                })
                rowValid = false
              } else {
                value = num
              }
            } else if (col.type === 'date' && value) {
              // Parse Estonian date format (DD.MM.YYYY)
              const dateStr = String(value).trim()
              let parsed: Date | null = null

              // Try DD.MM.YYYY
              const ddmmyyyy = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
              if (ddmmyyyy) {
                parsed = new Date(
                  parseInt(ddmmyyyy[3]),
                  parseInt(ddmmyyyy[2]) - 1,
                  parseInt(ddmmyyyy[1])
                )
              }

              // Try YYYY-MM-DD (ISO)
              if (!parsed) {
                const iso = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
                if (iso) {
                  parsed = new Date(dateStr)
                }
              }

              // Try general parsing
              if (!parsed) {
                parsed = new Date(dateStr)
              }

              if (!parsed || isNaN(parsed.getTime())) {
                result.errors.push({
                  row: index + 2,
                  column: col.header,
                  value,
                  message: `Vigane kuupäev: "${value}"`,
                })
                rowValid = false
              } else {
                value = parsed
              }
            } else if (col.type === 'boolean') {
              const strValue = String(value).toLowerCase().trim()
              value =
                strValue === 'jah' ||
                strValue === 'yes' ||
                strValue === 'true' ||
                strValue === '1' ||
                strValue === 'x'
            }

            // Apply custom transformer
            if (transformers[col.key]) {
              value = transformers[col.key](value)
            }

            // Validate required
            if (
              validateRequired &&
              col.required &&
              (value === null || value === undefined || value === '')
            ) {
              result.errors.push({
                row: index + 2,
                column: col.header,
                value,
                message: 'Kohustuslik väli on tühi',
              })
              rowValid = false
            }

            rowData[col.key] = value
          })

          if (rowValid) {
            result.data.push(rowData as T)
            result.validRows++
          }
        })

        result.success = result.errors.length === 0
        resolve(result)
      },
      error: (error) => {
        result.success = false
        result.errors.push({
          row: 0,
          column: '',
          value: null,
          message: `CSV lugemise viga: ${error.message}`,
        })
        resolve(result)
      },
    })
  })
}

// Preview CSV file (first N rows)
export async function previewCSV(
  file: File,
  options: { rows?: number; delimiter?: ',' | ';' | '\t' | 'auto' } = {}
): Promise<{
  headers: string[]
  data: Record<string, string>[]
  delimiter: string
}> {
  const { rows = 5, delimiter = 'auto' } = options

  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      delimiter: delimiter === 'auto' ? undefined : delimiter,
      header: true,
      preview: rows,
      skipEmptyLines: true,
      complete: (results) => {
        resolve({
          headers: results.meta.fields || [],
          data: results.data as Record<string, string>[],
          delimiter: results.meta.delimiter,
        })
      },
      error: (error) => {
        reject(error)
      },
    })
  })
}

export default {
  exportToCSV,
  importFromCSV,
  previewCSV,
}
