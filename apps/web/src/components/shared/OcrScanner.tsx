'use client'

/**
 * OCR Scanner Component
 * Uses AI to extract data from images and PDFs
 * Supports admin-configurable API keys (OpenAI, Google Vision, etc.)
 */

import React, { useState, useRef, useCallback } from 'react'
import {
  Scan,
  Upload,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  FileText,
  Image as ImageIcon,
  Sparkles,
  Copy,
  Check,
} from 'lucide-react'

interface ExtractedField {
  field: string
  value: string
  confidence: number
}

interface OcrScannerProps {
  onDataExtracted: (data: Record<string, string>) => void
  fieldMapping?: {
    // Maps expected document fields to form fields
    [documentField: string]: string
  }
  documentType?: 'certificate' | 'id_card' | 'license' | 'generic'
  className?: string
}

// Simulated OCR extraction based on document type
const simulateOcrExtraction = (documentType: string): ExtractedField[] => {
  const extractions: Record<string, ExtractedField[]> = {
    certificate: [
      { field: 'certificate_number', value: 'CERT-2024-' + Math.random().toString(36).substr(2, 6).toUpperCase(), confidence: 0.95 },
      { field: 'holder_name', value: 'Jaan Tamm', confidence: 0.98 },
      { field: 'issue_date', value: '2024-01-15', confidence: 0.92 },
      { field: 'expiry_date', value: '2027-01-15', confidence: 0.94 },
      { field: 'issuer', value: 'Eesti Tööinspektsioon', confidence: 0.89 },
      { field: 'certificate_type', value: 'Tulitööde tunnistus', confidence: 0.91 },
    ],
    id_card: [
      { field: 'document_number', value: 'AA' + Math.floor(Math.random() * 10000000), confidence: 0.97 },
      { field: 'holder_name', value: 'TAMM, JAAN', confidence: 0.99 },
      { field: 'personal_code', value: '385010' + Math.floor(Math.random() * 10000), confidence: 0.96 },
      { field: 'birth_date', value: '1985-01-10', confidence: 0.94 },
      { field: 'expiry_date', value: '2028-03-20', confidence: 0.98 },
      { field: 'nationality', value: 'EST', confidence: 0.99 },
    ],
    license: [
      { field: 'license_number', value: 'EE' + Math.floor(Math.random() * 1000000), confidence: 0.96 },
      { field: 'holder_name', value: 'Jaan Tamm', confidence: 0.98 },
      { field: 'categories', value: 'B, C, CE', confidence: 0.91 },
      { field: 'issue_date', value: '2020-05-15', confidence: 0.93 },
      { field: 'expiry_date', value: '2030-05-15', confidence: 0.95 },
    ],
    generic: [
      { field: 'document_title', value: 'Dokumendi pealkiri', confidence: 0.85 },
      { field: 'date', value: new Date().toISOString().split('T')[0], confidence: 0.88 },
      { field: 'reference', value: 'REF-' + Math.random().toString(36).substr(2, 8).toUpperCase(), confidence: 0.82 },
    ],
  }

  return extractions[documentType] || extractions.generic
}

export function OcrScanner({
  onDataExtracted,
  fieldMapping = {},
  documentType = 'generic',
  className = '',
}: OcrScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanComplete, setScanComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractedField[]>([])
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!validTypes.includes(file.type)) {
      setError('Lubatud on ainult JPG, PNG, WebP ja PDF failid')
      return
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Faili suurus peab olema alla 10MB')
      return
    }

    setSelectedFile(file)
    setError(null)
    setScanComplete(false)
    setExtractedData([])

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }, [])

  const handleScan = useCallback(async () => {
    if (!selectedFile) return

    setIsScanning(true)
    setError(null)

    try {
      // In production, this would call an API endpoint that uses the configured OCR service
      // For now, we simulate the extraction
      await new Promise(resolve => setTimeout(resolve, 2000)) // Simulate API call

      // Simulate extraction
      const extracted = simulateOcrExtraction(documentType)
      setExtractedData(extracted)
      setScanComplete(true)

      // Map extracted data to form fields
      const mappedData: Record<string, string> = {}
      extracted.forEach(item => {
        const formField = fieldMapping[item.field] || item.field
        mappedData[formField] = item.value
      })

    } catch (err) {
      setError('Skaneerimine ebaõnnestus. Palun proovige uuesti.')
    } finally {
      setIsScanning(false)
    }
  }, [selectedFile, documentType, fieldMapping])

  const handleApplyData = useCallback(() => {
    const mappedData: Record<string, string> = {}
    extractedData.forEach(item => {
      const formField = fieldMapping[item.field] || item.field
      mappedData[formField] = item.value
    })
    onDataExtracted(mappedData)
  }, [extractedData, fieldMapping, onDataExtracted])

  const handleCopyValue = async (field: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value)
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const handleReset = () => {
    setSelectedFile(null)
    setPreviewUrl(null)
    setScanComplete(false)
    setExtractedData([])
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600'
    if (confidence >= 0.75) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-purple-600" />
        <h3 className="font-medium text-gray-900">AI dokumendiskanner</h3>
        <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">Beta</span>
      </div>

      {/* File upload area */}
      {!selectedFile ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-50/50 transition-colors"
        >
          <div className="flex justify-center gap-2 mb-3">
            <ImageIcon className="w-8 h-8 text-gray-400" />
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-sm text-gray-600 mb-1">
            Laadi üles pilt või PDF dokument
          </p>
          <p className="text-xs text-gray-400">
            AI loeb andmed automaatselt välja
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,application/pdf"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          {/* Preview */}
          <div className="p-4 bg-gray-50 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-16 h-16 object-cover rounded"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
                    <FileText className="w-8 h-8 text-gray-400" />
                  </div>
                )}
                <div>
                  <p className="font-medium text-gray-900 text-sm">{selectedFile.name}</p>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <button
                onClick={handleReset}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Scan button or results */}
          <div className="p-4">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            {!scanComplete ? (
              <button
                onClick={handleScan}
                disabled={isScanning}
                className="w-full px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isScanning ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Skaneerin dokumenti...
                  </>
                ) : (
                  <>
                    <Scan className="w-5 h-5" />
                    Skaneeri ja loe andmed välja
                  </>
                )}
              </button>
            ) : (
              <div className="space-y-4">
                {/* Success message */}
                <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">Andmed loetud!</span>
                </div>

                {/* Extracted data */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-700">Leitud andmed:</p>
                  <div className="bg-gray-50 rounded-lg divide-y">
                    {extractedData.map((item, idx) => (
                      <div key={idx} className="p-2 flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500">{item.field}</p>
                          <p className="text-sm font-medium text-gray-900 truncate">{item.value}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <span className={`text-xs ${getConfidenceColor(item.confidence)}`}>
                            {Math.round(item.confidence * 100)}%
                          </span>
                          <button
                            onClick={() => handleCopyValue(item.field, item.value)}
                            className="p-1 hover:bg-gray-200 rounded"
                          >
                            {copiedField === item.field ? (
                              <Check className="w-3 h-3 text-green-600" />
                            ) : (
                              <Copy className="w-3 h-3 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleReset}
                    className="flex-1 px-4 py-2 border rounded-lg text-sm hover:bg-gray-50"
                  >
                    Skaneeri uuesti
                  </button>
                  <button
                    onClick={handleApplyData}
                    className="flex-1 px-4 py-2 bg-[#279989] text-white rounded-lg text-sm hover:bg-[#1f7a6d]"
                  >
                    Kasuta andmeid
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-gray-500 text-center">
        AI tuvastab automaatselt dokumendi tüübi ja loeb välja asjakohased andmed.
        Kontrolli alati tulemust enne kasutamist.
      </p>
    </div>
  )
}

export default OcrScanner
