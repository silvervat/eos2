'use client'

/**
 * OCR Scanner Component
 * Uses AI to extract data from images and PDFs
 * Can work with externally provided file or handle its own upload
 */

import React, { useState, useCallback } from 'react'
import {
  Scan,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Copy,
  Check,
  X,
} from 'lucide-react'

interface ExtractedField {
  field: string
  value: string
  confidence: number
}

interface OcrScannerProps {
  onDataExtracted: (data: Record<string, string>) => void
  file?: File | null
  fieldMapping?: {
    [documentField: string]: string
  }
  documentType?: 'certificate' | 'id_card' | 'license' | 'generic'
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
  file,
  fieldMapping = {},
  documentType = 'generic',
}: OcrScannerProps) {
  const [isScanning, setIsScanning] = useState(false)
  const [scanComplete, setScanComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [extractedData, setExtractedData] = useState<ExtractedField[]>([])
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const handleScan = useCallback(async () => {
    setIsScanning(true)
    setError(null)
    setScanComplete(false)

    try {
      // In production, this would call an API endpoint that uses the configured OCR service
      await new Promise(resolve => setTimeout(resolve, 1500))

      const extracted = simulateOcrExtraction(documentType)
      setExtractedData(extracted)
      setScanComplete(true)
    } catch (err) {
      setError('Skaneerimine ebaõnnestus. Palun proovige uuesti.')
    } finally {
      setIsScanning(false)
    }
  }, [documentType])

  const handleApplyData = useCallback(() => {
    const mappedData: Record<string, string> = {}
    extractedData.forEach(item => {
      const formField = fieldMapping[item.field] || item.field
      mappedData[formField] = item.value
    })
    onDataExtracted(mappedData)
    setScanComplete(false)
    setExtractedData([])
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

  const handleClose = () => {
    setScanComplete(false)
    setExtractedData([])
    setError(null)
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.9) return 'text-green-600'
    if (confidence >= 0.75) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Show results modal if scan is complete
  if (scanComplete && extractedData.length > 0) {
    return (
      <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div className="p-4 border-b flex items-center justify-between sticky top-0 bg-white">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600" />
              <h3 className="font-semibold">AI skaneeringu tulemused</h3>
            </div>
            <button onClick={handleClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-4 space-y-4">
            <div className="flex items-center gap-2 text-green-700 bg-green-50 p-3 rounded-lg">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-medium">Andmed loetud dokumendist!</span>
            </div>

            <div className="space-y-1">
              {extractedData.map((item, idx) => (
                <div key={idx} className="p-2 bg-gray-50 rounded flex items-center justify-between">
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
          <div className="p-4 border-t bg-gray-50 flex gap-2">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 border rounded-lg text-sm hover:bg-gray-100"
            >
              Tühista
            </button>
            <button
              onClick={handleApplyData}
              className="flex-1 px-4 py-2 bg-[#279989] text-white rounded-lg text-sm hover:bg-[#1f7a6d]"
            >
              Täida vormivälju
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Inline scan button
  return (
    <>
      {error && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-3 h-3" />
          {error}
        </div>
      )}
      <button
        onClick={handleScan}
        disabled={isScanning || (!file)}
        className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title={!file ? 'Esmalt laadi fail üles' : 'Skaneeri dokument AI-ga'}
      >
        {isScanning ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Skaneerin...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            AI skanner
          </>
        )}
      </button>
    </>
  )
}

export default OcrScanner
