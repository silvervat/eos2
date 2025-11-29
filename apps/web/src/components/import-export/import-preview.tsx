'use client'

import { useState, useCallback, useRef } from 'react'
import { Button, Card, Badge, Input } from '@rivest/ui'
import {
  Upload,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  Download,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import {
  importFromXLSX,
  createImportTemplate,
  type ColumnConfig,
  type ImportResult,
} from '@/lib/import-export/xlsx-service'
import { importFromCSV, previewCSV } from '@/lib/import-export/csv-service'

interface ImportPreviewProps {
  columns: ColumnConfig[]
  onImport: (data: Record<string, unknown>[]) => void | Promise<void>
  onCancel: () => void
  templateFileName?: string
  title?: string
  description?: string
  maxRows?: number
}

type FileType = 'xlsx' | 'csv' | null

export function ImportPreview({
  columns,
  onImport,
  onCancel,
  templateFileName = 'import-mall',
  title = 'Impordi andmeid',
  description = 'Laadi üles XLSX või CSV fail andmete importimiseks',
  maxRows = 10000,
}: ImportPreviewProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [fileType, setFileType] = useState<FileType>(null)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [dragActive, setDragActive] = useState(false)

  const rowsPerPage = 10
  const totalPages = Math.ceil(previewData.length / rowsPerPage)
  const paginatedData = previewData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  )

  // Handle file selection
  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      const extension = selectedFile.name.split('.').pop()?.toLowerCase()

      if (extension !== 'xlsx' && extension !== 'csv') {
        alert('Palun valige XLSX või CSV fail')
        return
      }

      setFile(selectedFile)
      setFileType(extension as FileType)
      setLoading(true)
      setResult(null)

      try {
        let importResult: ImportResult

        if (extension === 'xlsx') {
          importResult = await importFromXLSX(selectedFile, {
            columns,
            validateRequired: true,
          })
        } else {
          importResult = await importFromCSV(selectedFile, {
            columns,
            validateRequired: true,
          })
        }

        // Limit preview data
        if (importResult.data.length > maxRows) {
          importResult.warnings.push(
            `Fail sisaldab ${importResult.totalRows} rida, kuid maksimaalselt saab importida ${maxRows} rida`
          )
          importResult.data = importResult.data.slice(0, maxRows)
        }

        setResult(importResult)
        setPreviewData(importResult.data)
        setCurrentPage(1)
      } catch (error) {
        setResult({
          success: false,
          data: [],
          errors: [
            {
              row: 0,
              column: '',
              value: null,
              message:
                error instanceof Error ? error.message : 'Faili lugemise viga',
            },
          ],
          warnings: [],
          totalRows: 0,
          validRows: 0,
        })
      } finally {
        setLoading(false)
      }
    },
    [columns, maxRows]
  )

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        handleFileSelect(e.dataTransfer.files[0])
      }
    },
    [handleFileSelect]
  )

  // Download template
  const handleDownloadTemplate = async () => {
    await createImportTemplate(columns, templateFileName, [
      // Add sample row
      columns.reduce((acc, col) => {
        if (col.type === 'number' || col.type === 'currency') {
          acc[col.key] = 100
        } else if (col.type === 'date') {
          acc[col.key] = new Date()
        } else if (col.type === 'boolean') {
          acc[col.key] = true
        } else {
          acc[col.key] = `Näidis ${col.header}`
        }
        return acc
      }, {} as Record<string, unknown>),
    ])
  }

  // Handle import
  const handleImport = async () => {
    if (!result || result.data.length === 0) return

    setImporting(true)
    try {
      await onImport(result.data)
    } finally {
      setImporting(false)
    }
  }

  // Reset
  const handleReset = () => {
    setFile(null)
    setFileType(null)
    setResult(null)
    setPreviewData([])
    setCurrentPage(1)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">{title}</h2>
          <p className="text-slate-500 mt-1">{description}</p>
        </div>
        <Button variant="outline" onClick={handleDownloadTemplate} className="gap-2">
          <Download className="w-4 h-4" />
          Laadi mall
        </Button>
      </div>

      {/* Upload area */}
      {!file && (
        <div
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            dragActive
              ? 'border-[#279989] bg-[#279989]/5'
              : 'border-slate-300 hover:border-slate-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.csv"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFileSelect(e.target.files[0])
              }
            }}
            className="hidden"
          />

          <Upload className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-slate-900 mb-2">
            Lohista fail siia või klõpsa valimiseks
          </p>
          <p className="text-slate-500 mb-4">Toetatud formaadid: XLSX, CSV</p>

          <div className="flex items-center justify-center gap-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="gap-2 bg-[#279989] hover:bg-[#1e7a6d]"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Vali fail
            </Button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <Card className="p-8 text-center">
          <Loader2 className="w-8 h-8 text-[#279989] mx-auto mb-4 animate-spin" />
          <p className="text-slate-600">Faili töötlemine...</p>
        </Card>
      )}

      {/* File info and results */}
      {file && !loading && result && (
        <>
          {/* File info bar */}
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {fileType === 'xlsx' ? (
                  <FileSpreadsheet className="w-8 h-8 text-green-600" />
                ) : (
                  <FileText className="w-8 h-8 text-blue-600" />
                )}
                <div>
                  <p className="font-medium text-slate-900">{file.name}</p>
                  <p className="text-sm text-slate-500">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm text-slate-600">
                    Ridu kokku: <span className="font-medium">{result.totalRows}</span>
                  </p>
                  <p className="text-sm text-slate-600">
                    Korrektsed:{' '}
                    <span className="font-medium text-green-600">
                      {result.validRows}
                    </span>
                  </p>
                </div>

                <button
                  onClick={handleReset}
                  className="p-2 rounded-lg hover:bg-slate-100"
                  title="Eemalda fail"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>
            </div>
          </Card>

          {/* Warnings */}
          {result.warnings.length > 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-amber-800">Hoiatused</p>
                  <ul className="mt-1 text-sm text-amber-700 list-disc list-inside">
                    {result.warnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Errors */}
          {result.errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-800">
                    Vead ({result.errors.length})
                  </p>
                  <div className="mt-2 max-h-40 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-red-700">
                          <th className="pb-1">Rida</th>
                          <th className="pb-1">Veerg</th>
                          <th className="pb-1">Viga</th>
                        </tr>
                      </thead>
                      <tbody className="text-red-600">
                        {result.errors.slice(0, 20).map((error, i) => (
                          <tr key={i}>
                            <td className="py-0.5">{error.row}</td>
                            <td className="py-0.5">{error.column}</td>
                            <td className="py-0.5">{error.message}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {result.errors.length > 20 && (
                      <p className="text-red-600 mt-2">
                        ... ja veel {result.errors.length - 20} viga
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview table */}
          {previewData.length > 0 && (
            <Card className="overflow-hidden">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h3 className="font-medium text-slate-900">
                  Eelvaade ({previewData.length} rida)
                </h3>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="px-4 py-3 text-left font-medium text-slate-600 border-b">
                        #
                      </th>
                      {columns.map((col) => (
                        <th
                          key={col.key}
                          className="px-4 py-3 text-left font-medium text-slate-600 border-b"
                        >
                          {col.header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedData.map((row, index) => (
                      <tr
                        key={index}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        <td className="px-4 py-3 text-slate-500">
                          {(currentPage - 1) * rowsPerPage + index + 1}
                        </td>
                        {columns.map((col) => (
                          <td key={col.key} className="px-4 py-3 text-slate-900">
                            {formatCellValue(row[col.key], col.type)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-slate-200 flex items-center justify-between">
                  <p className="text-sm text-slate-600">
                    Leht {currentPage} / {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <Button variant="outline" onClick={onCancel}>
              Tühista
            </Button>
            <Button
              onClick={handleImport}
              disabled={importing || result.validRows === 0}
              className="gap-2 bg-[#279989] hover:bg-[#1e7a6d]"
            >
              {importing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Impordin...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Impordi {result.validRows} rida
                </>
              )}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}

// Helper function to format cell values for display
function formatCellValue(value: unknown, type?: string): string {
  if (value === null || value === undefined) return '-'

  if (type === 'date' && value instanceof Date) {
    return value.toLocaleDateString('et-EE')
  }

  if (type === 'currency' && typeof value === 'number') {
    return value.toLocaleString('et-EE', { style: 'currency', currency: 'EUR' })
  }

  if (type === 'boolean') {
    return value ? 'Jah' : 'Ei'
  }

  if (typeof value === 'number') {
    return value.toLocaleString('et-EE')
  }

  return String(value)
}

export default ImportPreview
