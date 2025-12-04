'use client'

import { useState } from 'react'
import {
  FileText,
  Download,
  Eye,
  Loader2,
  AlertCircle,
  Check,
  Globe,
} from 'lucide-react'
import type { Quote, QuoteLanguage } from '@rivest/types'

interface QuotePDFGeneratorProps {
  quote: Quote
  onGenerated?: (language: QuoteLanguage, url: string) => void
}

export default function QuotePDFGenerator({ quote, onGenerated }: QuotePDFGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState<QuoteLanguage | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generatePDF = async (language: QuoteLanguage) => {
    setIsGenerating(language)
    setError(null)

    try {
      const res = await fetch(`/api/quotes/${quote.id}/generate-pdf`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'PDF genereerimine ebaõnnestus')
      }

      const data = await res.json()
      onGenerated?.(language, data.url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF genereerimine ebaõnnestus')
    } finally {
      setIsGenerating(null)
    }
  }

  const downloadPDF = (url: string, language: QuoteLanguage) => {
    const link = document.createElement('a')
    link.href = url
    link.download = `${quote.quoteNumber}_${language.toUpperCase()}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const previewPDF = (url: string) => {
    window.open(url, '_blank')
  }

  const pdfUrlEt = quote.pdfUrls?.et
  const pdfUrlEn = quote.pdfUrls?.en

  return (
    <div className="space-y-3">
      {error && (
        <div className="flex items-center gap-2 p-2 text-sm text-red-700 bg-red-50 rounded-lg">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Estonian PDF */}
      <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg">
        <div className="flex items-center gap-2 flex-1">
          <FileText className="w-5 h-5 text-slate-400" />
          <div>
            <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
              {quote.quoteNumber}_ET.pdf
              <span className="text-xs">🇪🇪</span>
            </div>
            {pdfUrlEt && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <Check className="w-3 h-3" /> Genereeritud
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {pdfUrlEt ? (
            <>
              <button
                onClick={() => previewPDF(pdfUrlEt)}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                title="Eelvaade"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => downloadPDF(pdfUrlEt, 'et')}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                title="Lae alla"
              >
                <Download className="w-4 h-4" />
              </button>
            </>
          ) : null}
          <button
            onClick={() => generatePDF('et')}
            disabled={isGenerating !== null}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#279989' }}
          >
            {isGenerating === 'et' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : pdfUrlEt ? (
              'Uuenda'
            ) : (
              'Genereeri'
            )}
          </button>
        </div>
      </div>

      {/* English PDF */}
      <div className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg">
        <div className="flex items-center gap-2 flex-1">
          <FileText className="w-5 h-5 text-slate-400" />
          <div>
            <div className="text-sm font-medium text-slate-900 flex items-center gap-2">
              {quote.quoteNumber}_EN.pdf
              <span className="text-xs">🇬🇧</span>
            </div>
            {pdfUrlEn && (
              <span className="text-xs text-green-600 flex items-center gap-1">
                <Check className="w-3 h-3" /> Genereeritud
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {pdfUrlEn ? (
            <>
              <button
                onClick={() => previewPDF(pdfUrlEn)}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                title="Preview"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => downloadPDF(pdfUrlEn, 'en')}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded transition-colors"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </button>
            </>
          ) : null}
          <button
            onClick={() => generatePDF('en')}
            disabled={isGenerating !== null}
            className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: '#279989' }}
          >
            {isGenerating === 'en' ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : pdfUrlEn ? (
              'Uuenda'
            ) : (
              'Genereeri'
            )}
          </button>
        </div>
      </div>

      {/* Generate both */}
      <button
        onClick={async () => {
          await generatePDF('et')
          await generatePDF('en')
        }}
        disabled={isGenerating !== null}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
      >
        <Globe className="w-4 h-4" />
        Genereeri mõlemad PDF-id
      </button>
    </div>
  )
}
