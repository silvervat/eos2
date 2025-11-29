'use client'

import { useState } from 'react'
import { Button, Card, Input, Badge } from '@rivest/ui'
import {
  Download,
  FileSpreadsheet,
  FileText,
  X,
  Check,
  Settings,
  Loader2,
} from 'lucide-react'
import { exportToXLSX, type ColumnConfig } from '@/lib/import-export/xlsx-service'
import { exportToCSV } from '@/lib/import-export/csv-service'

interface ExportDialogProps {
  data: Record<string, unknown>[]
  columns: ColumnConfig[]
  defaultFileName?: string
  onClose: () => void
  title?: string
}

type ExportFormat = 'xlsx' | 'csv'
type CSVDelimiter = ',' | ';' | '\t'

export function ExportDialog({
  data,
  columns,
  defaultFileName = 'eksport',
  onClose,
  title = 'Ekspordi andmed',
}: ExportDialogProps) {
  const [fileName, setFileName] = useState(defaultFileName)
  const [format, setFormat] = useState<ExportFormat>('xlsx')
  const [exporting, setExporting] = useState(false)

  // XLSX options
  const [includeFilters, setIncludeFilters] = useState(true)
  const [freezeHeader, setFreezeHeader] = useState(true)

  // CSV options
  const [delimiter, setDelimiter] = useState<CSVDelimiter>(';')
  const [includeBOM, setIncludeBOM] = useState(true)

  // Column selection
  const [selectedColumns, setSelectedColumns] = useState<Set<string>>(
    new Set(columns.map((c) => c.key))
  )

  const toggleColumn = (key: string) => {
    const newSelected = new Set(selectedColumns)
    if (newSelected.has(key)) {
      newSelected.delete(key)
    } else {
      newSelected.add(key)
    }
    setSelectedColumns(newSelected)
  }

  const selectAll = () => {
    setSelectedColumns(new Set(columns.map((c) => c.key)))
  }

  const deselectAll = () => {
    setSelectedColumns(new Set())
  }

  const handleExport = async () => {
    if (selectedColumns.size === 0) {
      alert('Valige vähemalt üks veerg')
      return
    }

    setExporting(true)

    try {
      const exportColumns = columns.filter((c) => selectedColumns.has(c.key))

      if (format === 'xlsx') {
        await exportToXLSX({
          fileName,
          columns: exportColumns,
          data,
          includeFilters,
          freezeHeader,
        })
      } else {
        await exportToCSV({
          fileName,
          columns: exportColumns,
          data,
          delimiter,
          bom: includeBOM,
        })
      }

      onClose()
    } catch (error) {
      console.error('Export error:', error)
      alert('Eksportimine ebaõnnestus')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg bg-white rounded-xl shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* File name */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Faili nimi
            </label>
            <Input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="eksport"
            />
          </div>

          {/* Format selection */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Formaat
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setFormat('xlsx')}
                className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  format === 'xlsx'
                    ? 'border-[#279989] bg-[#279989]/5'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <FileSpreadsheet
                  className={`w-6 h-6 ${
                    format === 'xlsx' ? 'text-[#279989]' : 'text-slate-400'
                  }`}
                />
                <div className="text-left">
                  <p
                    className={`font-medium ${
                      format === 'xlsx' ? 'text-[#279989]' : 'text-slate-700'
                    }`}
                  >
                    Excel (.xlsx)
                  </p>
                  <p className="text-xs text-slate-500">Täisfunktsionaalne</p>
                </div>
                {format === 'xlsx' && (
                  <Check className="w-5 h-5 text-[#279989] ml-auto" />
                )}
              </button>

              <button
                onClick={() => setFormat('csv')}
                className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all ${
                  format === 'csv'
                    ? 'border-[#279989] bg-[#279989]/5'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <FileText
                  className={`w-6 h-6 ${
                    format === 'csv' ? 'text-[#279989]' : 'text-slate-400'
                  }`}
                />
                <div className="text-left">
                  <p
                    className={`font-medium ${
                      format === 'csv' ? 'text-[#279989]' : 'text-slate-700'
                    }`}
                  >
                    CSV (.csv)
                  </p>
                  <p className="text-xs text-slate-500">Universaalne</p>
                </div>
                {format === 'csv' && (
                  <Check className="w-5 h-5 text-[#279989] ml-auto" />
                )}
              </button>
            </div>
          </div>

          {/* Format-specific options */}
          <div className="bg-slate-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Settings className="w-4 h-4 text-slate-500" />
              <span className="text-sm font-medium text-slate-700">Seaded</span>
            </div>

            {format === 'xlsx' ? (
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeFilters}
                    onChange={(e) => setIncludeFilters(e.target.checked)}
                    className="rounded border-slate-300 text-[#279989] focus:ring-[#279989]"
                  />
                  <span className="text-sm text-slate-600">Lisa filtrid</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={freezeHeader}
                    onChange={(e) => setFreezeHeader(e.target.checked)}
                    className="rounded border-slate-300 text-[#279989] focus:ring-[#279989]"
                  />
                  <span className="text-sm text-slate-600">
                    Külmuta päiserida
                  </span>
                </label>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm text-slate-600 mb-2">
                    Eraldaja
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: ';', label: 'Semikoolon (;)' },
                      { value: ',', label: 'Koma (,)' },
                      { value: '\t', label: 'Tab' },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => setDelimiter(opt.value as CSVDelimiter)}
                        className={`px-3 py-1.5 rounded text-sm ${
                          delimiter === opt.value
                            ? 'bg-[#279989] text-white'
                            : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeBOM}
                    onChange={(e) => setIncludeBOM(e.target.checked)}
                    className="rounded border-slate-300 text-[#279989] focus:ring-[#279989]"
                  />
                  <span className="text-sm text-slate-600">
                    UTF-8 BOM (Exceli jaoks)
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Column selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">
                Veerud ({selectedColumns.size}/{columns.length})
              </label>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs text-[#279989] hover:underline"
                >
                  Vali kõik
                </button>
                <button
                  onClick={deselectAll}
                  className="text-xs text-slate-500 hover:underline"
                >
                  Tühista
                </button>
              </div>
            </div>
            <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-lg p-2 space-y-1">
              {columns.map((col) => (
                <label
                  key={col.key}
                  className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedColumns.has(col.key)}
                    onChange={() => toggleColumn(col.key)}
                    className="rounded border-slate-300 text-[#279989] focus:ring-[#279989]"
                  />
                  <span className="text-sm text-slate-700">{col.header}</span>
                  {col.required && (
                    <Badge className="text-xs bg-red-100 text-red-600">*</Badge>
                  )}
                </label>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-slate-100 rounded-lg px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-slate-600">Eksporditakse</span>
            <span className="font-medium text-slate-900">
              {data.length} rida × {selectedColumns.size} veergu
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200">
          <Button variant="outline" onClick={onClose}>
            Tühista
          </Button>
          <Button
            onClick={handleExport}
            disabled={exporting || selectedColumns.size === 0}
            className="gap-2 bg-[#279989] hover:bg-[#1e7a6d]"
          >
            {exporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Ekspordin...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Ekspordi
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default ExportDialog
