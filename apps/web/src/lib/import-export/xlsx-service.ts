// XLSX Import/Export Service - Rivest Platform
// Uses ExcelJS for reading and writing Excel files

import ExcelJS from 'exceljs'
import { saveAs } from 'file-saver'

export interface ColumnConfig {
  key: string
  header: string
  width?: number
  type?: 'string' | 'number' | 'date' | 'currency' | 'boolean'
  format?: string
  required?: boolean
}

export interface ExportOptions {
  fileName: string
  sheetName?: string
  columns: ColumnConfig[]
  data: Record<string, unknown>[]
  includeFilters?: boolean
  freezeHeader?: boolean
  headerStyle?: Partial<ExcelJS.Style>
  dateFormat?: string
  currencySymbol?: string
}

export interface ImportResult<T = Record<string, unknown>> {
  success: boolean
  data: T[]
  errors: ImportError[]
  warnings: string[]
  totalRows: number
  validRows: number
}

export interface ImportError {
  row: number
  column: string
  value: unknown
  message: string
}

export interface ImportOptions {
  columns: ColumnConfig[]
  headerRow?: number
  skipEmptyRows?: boolean
  validateRequired?: boolean
  transformers?: Record<string, (value: unknown) => unknown>
}

// Default styles
const DEFAULT_HEADER_STYLE: Partial<ExcelJS.Style> = {
  font: { bold: true, color: { argb: 'FFFFFFFF' } },
  fill: {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF279989' }, // Rivest primary color
  },
  alignment: { horizontal: 'center', vertical: 'middle' },
  border: {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  },
}

// Export to XLSX
export async function exportToXLSX(options: ExportOptions): Promise<void> {
  const {
    fileName,
    sheetName = 'Andmed',
    columns,
    data,
    includeFilters = true,
    freezeHeader = true,
    headerStyle = DEFAULT_HEADER_STYLE,
    dateFormat = 'DD.MM.YYYY',
    currencySymbol = '€',
  } = options

  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Rivest Platform'
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet(sheetName)

  // Set up columns
  worksheet.columns = columns.map((col) => ({
    header: col.header,
    key: col.key,
    width: col.width || 15,
  }))

  // Apply header styles
  const headerRow = worksheet.getRow(1)
  headerRow.eachCell((cell) => {
    Object.assign(cell, { style: headerStyle })
  })
  headerRow.height = 25

  // Add data rows
  data.forEach((row) => {
    const rowData: Record<string, unknown> = {}
    columns.forEach((col) => {
      let value = row[col.key]

      // Format based on type
      if (col.type === 'date' && value) {
        value = new Date(value as string)
      } else if (col.type === 'currency' && typeof value === 'number') {
        // Will be formatted via cell numFmt
      } else if (col.type === 'boolean') {
        value = value ? 'Jah' : 'Ei'
      }

      rowData[col.key] = value
    })

    const excelRow = worksheet.addRow(rowData)

    // Apply cell formats
    columns.forEach((col, index) => {
      const cell = excelRow.getCell(index + 1)

      if (col.type === 'date') {
        cell.numFmt = dateFormat.replace('DD', 'dd').replace('MM', 'mm').replace('YYYY', 'yyyy')
      } else if (col.type === 'currency') {
        cell.numFmt = `#,##0.00 "${currencySymbol}"`
      } else if (col.type === 'number') {
        cell.numFmt = col.format || '#,##0.00'
      }

      // Add borders
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
      }
    })

    // Alternate row colors
    if (excelRow.number % 2 === 0) {
      excelRow.eachCell((cell) => {
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFF8FAFC' },
        }
      })
    }
  })

  // Freeze header row
  if (freezeHeader) {
    worksheet.views = [{ state: 'frozen', ySplit: 1 }]
  }

  // Add auto filters
  if (includeFilters && data.length > 0) {
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: columns.length },
    }
  }

  // Generate file and trigger download
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const finalFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`
  saveAs(blob, finalFileName)
}

// Import from XLSX
export async function importFromXLSX<T = Record<string, unknown>>(
  file: File,
  options: ImportOptions
): Promise<ImportResult<T>> {
  const {
    columns,
    headerRow = 1,
    skipEmptyRows = true,
    validateRequired = true,
    transformers = {},
  } = options

  const result: ImportResult<T> = {
    success: true,
    data: [],
    errors: [],
    warnings: [],
    totalRows: 0,
    validRows: 0,
  }

  try {
    const workbook = new ExcelJS.Workbook()
    const buffer = await file.arrayBuffer()
    await workbook.xlsx.load(buffer)

    const worksheet = workbook.worksheets[0]
    if (!worksheet) {
      result.success = false
      result.errors.push({
        row: 0,
        column: '',
        value: null,
        message: 'Töölehte ei leitud',
      })
      return result
    }

    // Get header row and map column indices
    const headerRowData = worksheet.getRow(headerRow)
    const columnMap = new Map<number, ColumnConfig>()

    headerRowData.eachCell((cell, colNumber) => {
      const headerValue = String(cell.value || '').trim().toLowerCase()
      const matchingColumn = columns.find(
        (col) =>
          col.header.toLowerCase() === headerValue ||
          col.key.toLowerCase() === headerValue
      )
      if (matchingColumn) {
        columnMap.set(colNumber, matchingColumn)
      }
    })

    // Check if all required columns are present
    const foundKeys = new Set([...columnMap.values()].map((c) => c.key))
    const missingRequired = columns.filter(
      (col) => col.required && !foundKeys.has(col.key)
    )

    if (missingRequired.length > 0) {
      result.warnings.push(
        `Puuduvad veerud: ${missingRequired.map((c) => c.header).join(', ')}`
      )
    }

    // Process data rows
    const startRow = headerRow + 1
    const endRow = worksheet.rowCount

    for (let rowNum = startRow; rowNum <= endRow; rowNum++) {
      const row = worksheet.getRow(rowNum)
      result.totalRows++

      // Skip empty rows
      if (skipEmptyRows) {
        let isEmpty = true
        row.eachCell(() => {
          isEmpty = false
        })
        if (isEmpty) continue
      }

      const rowData: Record<string, unknown> = {}
      let rowValid = true

      columnMap.forEach((colConfig, colNumber) => {
        const cell = row.getCell(colNumber)
        let value: unknown = cell.value

        // Handle rich text
        if (value && typeof value === 'object' && 'richText' in value) {
          value = (value as ExcelJS.CellRichTextValue).richText
            .map((rt) => rt.text)
            .join('')
        }

        // Handle formula results
        if (value && typeof value === 'object' && 'result' in value) {
          value = (value as ExcelJS.CellFormulaValue).result
        }

        // Type conversion
        if (colConfig.type === 'number' && value !== null && value !== undefined) {
          const num = Number(value)
          if (isNaN(num)) {
            result.errors.push({
              row: rowNum,
              column: colConfig.header,
              value,
              message: `Vigane number: "${value}"`,
            })
            rowValid = false
          } else {
            value = num
          }
        } else if (colConfig.type === 'date' && value) {
          if (value instanceof Date) {
            // Already a date
          } else if (typeof value === 'number') {
            // Excel serial date
            value = new Date((value - 25569) * 86400 * 1000)
          } else {
            const parsed = new Date(value as string)
            if (isNaN(parsed.getTime())) {
              result.errors.push({
                row: rowNum,
                column: colConfig.header,
                value,
                message: `Vigane kuupäev: "${value}"`,
              })
              rowValid = false
            } else {
              value = parsed
            }
          }
        } else if (colConfig.type === 'boolean') {
          value =
            value === true ||
            value === 1 ||
            String(value).toLowerCase() === 'jah' ||
            String(value).toLowerCase() === 'yes' ||
            String(value).toLowerCase() === 'true'
        }

        // Apply custom transformer
        if (transformers[colConfig.key]) {
          value = transformers[colConfig.key](value)
        }

        // Validate required
        if (
          validateRequired &&
          colConfig.required &&
          (value === null || value === undefined || value === '')
        ) {
          result.errors.push({
            row: rowNum,
            column: colConfig.header,
            value,
            message: 'Kohustuslik väli on tühi',
          })
          rowValid = false
        }

        rowData[colConfig.key] = value
      })

      if (rowValid) {
        result.data.push(rowData as T)
        result.validRows++
      }
    }

    result.success = result.errors.length === 0
  } catch (error) {
    result.success = false
    result.errors.push({
      row: 0,
      column: '',
      value: null,
      message: `Faili lugemise viga: ${error instanceof Error ? error.message : 'Tundmatu viga'}`,
    })
  }

  return result
}

// Create template XLSX for import
export async function createImportTemplate(
  columns: ColumnConfig[],
  fileName: string,
  sampleData?: Record<string, unknown>[]
): Promise<void> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'Rivest Platform'

  const worksheet = workbook.addWorksheet('Andmed')

  // Set up columns
  worksheet.columns = columns.map((col) => ({
    header: col.header + (col.required ? ' *' : ''),
    key: col.key,
    width: col.width || 15,
  }))

  // Style header
  const headerRow = worksheet.getRow(1)
  headerRow.eachCell((cell, colNumber) => {
    const col = columns[colNumber - 1]
    cell.style = {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: col.required ? 'FFDC2626' : 'FF279989' },
      },
      alignment: { horizontal: 'center' },
    }
  })

  // Add sample data if provided
  if (sampleData && sampleData.length > 0) {
    sampleData.forEach((row) => {
      worksheet.addRow(row)
    })
  }

  // Add instructions sheet
  const instructionsSheet = workbook.addWorksheet('Juhend')
  instructionsSheet.columns = [
    { header: 'Veerg', key: 'column', width: 25 },
    { header: 'Kirjeldus', key: 'description', width: 40 },
    { header: 'Tüüp', key: 'type', width: 15 },
    { header: 'Kohustuslik', key: 'required', width: 15 },
  ]

  const instructionHeader = instructionsSheet.getRow(1)
  instructionHeader.eachCell((cell) => {
    cell.style = {
      font: { bold: true },
      fill: {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE2E8F0' },
      },
    }
  })

  columns.forEach((col) => {
    instructionsSheet.addRow({
      column: col.header,
      description: `${col.header} väli`,
      type: col.type || 'tekst',
      required: col.required ? 'Jah' : 'Ei',
    })
  })

  // Generate and download
  const buffer = await workbook.xlsx.writeBuffer()
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  const finalFileName = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`
  saveAs(blob, finalFileName)
}

export default {
  exportToXLSX,
  importFromXLSX,
  createImportTemplate,
}
