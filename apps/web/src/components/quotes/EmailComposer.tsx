'use client'

import { useState, useEffect } from 'react'
import {
  Send,
  X,
  Paperclip,
  FileText,
  Check,
  AlertCircle,
  Eye,
  Globe,
  User,
  Mail,
  ChevronDown,
} from 'lucide-react'
import type { Quote, QuoteLanguage, EmailTemplate } from '@rivest/types'

interface EmailComposerProps {
  quote: Quote
  onClose: () => void
  onSend?: () => void
}

interface EmailDraft {
  to: string[]
  cc: string[]
  subject: string
  body: string
  language: QuoteLanguage
  attachPdfEt: boolean
  attachPdfEn: boolean
}

// Email variable placeholders
const emailVariables: { key: string; label: string; labelEn: string }[] = [
  { key: 'contact_name', label: 'Kontaktisiku nimi', labelEn: 'Contact name' },
  { key: 'company_name', label: 'Ettevõtte nimi', labelEn: 'Company name' },
  { key: 'quote_number', label: 'Pakkumise number', labelEn: 'Quote number' },
  { key: 'project_name', label: 'Projekti nimi', labelEn: 'Project name' },
  { key: 'valid_days', label: 'Kehtivus päevades', labelEn: 'Valid days' },
  { key: 'total', label: 'Kogusumma', labelEn: 'Total amount' },
  { key: 'sender_name', label: 'Saatja nimi', labelEn: 'Sender name' },
]

// Default templates
const defaultTemplates: Record<QuoteLanguage, { subject: string; body: string }> = {
  et: {
    subject: 'Hinnapakkumine {{quote_number}}',
    body: `Tere {{contact_name}},

Saadan Teile hinnapakkumise projekti {{project_name}} kohta.

Pakkumise number: {{quote_number}}
Kehtivus: {{valid_days}} päeva
Kogusumma: {{total}} EUR (koos KM-ga)

Pakkumine on lisatud manusesse.

Küsimuste korral võtke julgelt ühendust.

Lugupidamisega,
{{sender_name}}
RIVEST OÜ
+372 5550 5580
info@rivest.ee`,
  },
  en: {
    subject: 'Quotation {{quote_number}}',
    body: `Dear {{contact_name}},

Please find attached our quotation for project {{project_name}}.

Quotation number: {{quote_number}}
Validity: {{valid_days}} days
Total amount: {{total}} EUR (incl. VAT)

The quotation is attached to this email.

Please do not hesitate to contact us if you have any questions.

Best regards,
{{sender_name}}
RIVEST OÜ
+372 5550 5580
info@rivest.ee`,
  },
}

export default function EmailComposer({ quote, onClose, onSend }: EmailComposerProps) {
  const [draft, setDraft] = useState<EmailDraft>({
    to: quote.contactEmail ? [quote.contactEmail] : [],
    cc: [],
    subject: '',
    body: '',
    language: quote.language || 'et',
    attachPdfEt: quote.language === 'et',
    attachPdfEn: quote.language === 'en',
  })

  const [toInput, setToInput] = useState(quote.contactEmail || '')
  const [ccInput, setCcInput] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showPreview, setShowPreview] = useState(false)
  const [showVariables, setShowVariables] = useState(false)

  // Set default template based on language
  useEffect(() => {
    const template = defaultTemplates[draft.language]
    setDraft((prev) => ({
      ...prev,
      subject: replaceVariables(template.subject),
      body: replaceVariables(template.body),
    }))
  }, [draft.language])

  // Replace template variables
  const replaceVariables = (text: string): string => {
    const variables: Record<string, string> = {
      contact_name: quote.contactName || 'Lugupeetud klient',
      company_name: quote.companyName || '',
      quote_number: quote.quoteNumber,
      project_name: quote.projectName || '',
      valid_days: String(quote.validDays || 30),
      total: formatCurrency(quote.total),
      sender_name: 'Rivest meeskond', // TODO: Get from current user
    }

    let result = text
    Object.entries(variables).forEach(([key, value]) => {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value)
    })
    return result
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('et-EE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount)
  }

  // Add email to list
  const addEmail = (type: 'to' | 'cc', input: string, setInput: (v: string) => void) => {
    const email = input.trim()
    if (!email) return

    // Simple email validation
    if (!email.includes('@')) {
      setError('Vale e-posti aadress')
      return
    }

    if (type === 'to') {
      if (draft.to.includes(email)) return
      setDraft({ ...draft, to: [...draft.to, email] })
    } else {
      if (draft.cc.includes(email)) return
      setDraft({ ...draft, cc: [...draft.cc, email] })
    }
    setInput('')
    setError(null)
  }

  // Remove email from list
  const removeEmail = (type: 'to' | 'cc', email: string) => {
    if (type === 'to') {
      setDraft({ ...draft, to: draft.to.filter((e) => e !== email) })
    } else {
      setDraft({ ...draft, cc: draft.cc.filter((e) => e !== email) })
    }
  }

  // Insert variable at cursor
  const insertVariable = (varKey: string) => {
    setDraft({
      ...draft,
      body: draft.body + `{{${varKey}}}`,
    })
    setShowVariables(false)
  }

  // Send email
  const handleSend = async () => {
    if (draft.to.length === 0) {
      setError('Valige vähemalt üks saaja')
      return
    }

    if (!draft.subject.trim()) {
      setError('Teema on kohustuslik')
      return
    }

    if (!draft.attachPdfEt && !draft.attachPdfEn) {
      if (!confirm('Kas soovite saata e-maili ilma PDF manuseta?')) {
        return
      }
    }

    setIsSending(true)
    setError(null)

    try {
      const res = await fetch(`/api/quotes/${quote.id}/send-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: draft.to,
          cc: draft.cc.length > 0 ? draft.cc : undefined,
          subject: draft.subject,
          body: draft.body,
          language: draft.language,
          attachPdfLanguages: [
            ...(draft.attachPdfEt ? ['et'] : []),
            ...(draft.attachPdfEn ? ['en'] : []),
          ],
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'E-maili saatmine ebaõnnestus')
      }

      onSend?.()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'E-maili saatmine ebaõnnestus')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-3xl max-h-[90vh] overflow-hidden m-4 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Saada pakkumine</h2>
            <p className="text-sm text-slate-500">{quote.quoteNumber}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              {error}
              <button onClick={() => setError(null)} className="ml-auto">×</button>
            </div>
          )}

          {/* Language selector */}
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-700">E-maili keel:</span>
            <div className="flex gap-2">
              <button
                onClick={() => setDraft({ ...draft, language: 'et' })}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  draft.language === 'et'
                    ? 'bg-[#279989] text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                🇪🇪 Eesti keel
              </button>
              <button
                onClick={() => setDraft({ ...draft, language: 'en' })}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  draft.language === 'en'
                    ? 'bg-[#279989] text-white'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                🇬🇧 English
              </button>
            </div>
          </div>

          {/* Recipients */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              <Mail className="w-4 h-4 inline mr-1" />
              Saaja(d) <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2 p-2 border border-slate-200 rounded-lg bg-white min-h-[42px]">
              {draft.to.map((email) => (
                <span
                  key={email}
                  className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-sm"
                >
                  {email}
                  <button
                    onClick={() => removeEmail('to', email)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="email"
                value={toInput}
                onChange={(e) => setToInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    addEmail('to', toInput, setToInput)
                  }
                }}
                onBlur={() => addEmail('to', toInput, setToInput)}
                placeholder="lisa@email.ee"
                className="flex-1 min-w-[150px] px-2 py-1 text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* CC */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Koopia (CC)
            </label>
            <div className="flex flex-wrap gap-2 p-2 border border-slate-200 rounded-lg bg-white min-h-[42px]">
              {draft.cc.map((email) => (
                <span
                  key={email}
                  className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-sm"
                >
                  {email}
                  <button
                    onClick={() => removeEmail('cc', email)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                type="email"
                value={ccInput}
                onChange={(e) => setCcInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') {
                    e.preventDefault()
                    addEmail('cc', ccInput, setCcInput)
                  }
                }}
                onBlur={() => addEmail('cc', ccInput, setCcInput)}
                placeholder="koopia@email.ee"
                className="flex-1 min-w-[150px] px-2 py-1 text-sm focus:outline-none"
              />
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Teema <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={draft.subject}
              onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989]"
            />
          </div>

          {/* Body */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-sm font-medium text-slate-700">Sisu</label>
              <div className="relative">
                <button
                  onClick={() => setShowVariables(!showVariables)}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700"
                >
                  Muutujad
                  <ChevronDown className="w-3 h-3" />
                </button>
                {showVariables && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                    {emailVariables.map((v) => (
                      <button
                        key={v.key}
                        onClick={() => insertVariable(v.key)}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50"
                      >
                        <span className="text-slate-700">{draft.language === 'et' ? v.label : v.labelEn}</span>
                        <span className="block text-xs text-slate-400 font-mono">{`{{${v.key}}}`}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <textarea
              value={draft.body}
              onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              rows={10}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#279989]/20 focus:border-[#279989] resize-none font-mono"
            />
          </div>

          {/* Attachments */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              <Paperclip className="w-4 h-4 inline mr-1" />
              Manused
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={draft.attachPdfEt}
                  onChange={(e) => setDraft({ ...draft, attachPdfEt: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-[#279989] focus:ring-[#279989]"
                />
                <FileText className="w-5 h-5 text-slate-400" />
                <div className="flex-1">
                  <span className="text-sm text-slate-900">{quote.quoteNumber}_ET.pdf</span>
                  <span className="text-xs text-slate-500 ml-2">🇪🇪 Eestikeelne PDF</span>
                </div>
                {quote.pdfUrls?.et && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Olemas
                  </span>
                )}
              </label>
              <label className="flex items-center gap-3 p-3 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={draft.attachPdfEn}
                  onChange={(e) => setDraft({ ...draft, attachPdfEn: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-[#279989] focus:ring-[#279989]"
                />
                <FileText className="w-5 h-5 text-slate-400" />
                <div className="flex-1">
                  <span className="text-sm text-slate-900">{quote.quoteNumber}_EN.pdf</span>
                  <span className="text-xs text-slate-500 ml-2">🇬🇧 Ingliskeelne PDF</span>
                </div>
                {quote.pdfUrls?.en && (
                  <span className="text-xs text-green-600 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Olemas
                  </span>
                )}
              </label>
            </div>
            {(draft.attachPdfEt && !quote.pdfUrls?.et) || (draft.attachPdfEn && !quote.pdfUrls?.en) ? (
              <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="w-3 h-3" />
                PDF genereeritakse enne saatmist
              </p>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <Eye className="w-4 h-4" />
            {showPreview ? 'Peida eelvaade' : 'Eelvaade'}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Tühista
            </button>
            <button
              onClick={handleSend}
              disabled={isSending || draft.to.length === 0}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-colors hover:opacity-90"
              style={{ backgroundColor: '#279989' }}
            >
              {isSending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  Saadan...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Saada
                </>
              )}
            </button>
          </div>
        </div>

        {/* Preview panel */}
        {showPreview && (
          <div className="border-t border-slate-200 bg-slate-50 p-4 max-h-64 overflow-y-auto">
            <h4 className="text-sm font-medium text-slate-700 mb-2">E-maili eelvaade</h4>
            <div className="bg-white p-4 rounded-lg border border-slate-200">
              <div className="text-sm text-slate-500 mb-1">
                <strong>Kellele:</strong> {draft.to.join(', ')}
              </div>
              {draft.cc.length > 0 && (
                <div className="text-sm text-slate-500 mb-1">
                  <strong>Koopia:</strong> {draft.cc.join(', ')}
                </div>
              )}
              <div className="text-sm text-slate-500 mb-3">
                <strong>Teema:</strong> {draft.subject}
              </div>
              <hr className="mb-3" />
              <div className="text-sm text-slate-700 whitespace-pre-wrap">{draft.body}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
