// PDF Generator Service - Rivest Platform
// Uses pdfme to generate PDFs from templates

import { generate } from '@pdfme/generator'
import type { Template, Font } from '@pdfme/common'
import { pdfmePlugins } from './pdfme-config'

export interface GeneratePDFOptions {
  template: Template
  inputs: Record<string, unknown>[]
  fileName?: string
}

export interface PDFGeneratorResult {
  blob: Blob
  url: string
  fileName: string
}

// Font loading cache
let fontsLoaded = false
let fontsData: Font = {}

// Load fonts from Google Fonts (Roboto)
async function loadFonts(): Promise<Font> {
  if (fontsLoaded) {
    return fontsData
  }

  try {
    // Load Roboto font from Google Fonts CDN
    const robotoUrl =
      'https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Mu4mxK.woff2'
    const response = await fetch(robotoUrl)
    const arrayBuffer = await response.arrayBuffer()

    fontsData = {
      Roboto: {
        data: arrayBuffer,
        fallback: true,
      },
    }

    fontsLoaded = true
    return fontsData
  } catch (error) {
    console.warn('Failed to load fonts, using fallback:', error)
    // Return empty fonts - pdfme will use default
    return {}
  }
}

// Generate PDF as Blob
export async function generatePDF(
  options: GeneratePDFOptions
): Promise<PDFGeneratorResult> {
  const { template, inputs, fileName = 'document.pdf' } = options

  try {
    // Load fonts
    const font = await loadFonts()

    // Generate PDF using pdfme
    const pdf = await generate({
      template,
      inputs,
      plugins: pdfmePlugins,
      options: {
        font,
      },
    })

    // Create blob from PDF data
    const blob = new Blob([pdf.buffer], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)

    return {
      blob,
      url,
      fileName,
    }
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error(`PDF genereerimise viga: ${error instanceof Error ? error.message : 'Tundmatu viga'}`)
  }
}

// Download PDF
export async function downloadPDF(options: GeneratePDFOptions): Promise<void> {
  const result = await generatePDF(options)

  // Create download link
  const link = document.createElement('a')
  link.href = result.url
  link.download = result.fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  // Clean up URL
  URL.revokeObjectURL(result.url)
}

// Open PDF in new tab
export async function openPDFInNewTab(
  options: GeneratePDFOptions
): Promise<void> {
  const result = await generatePDF(options)

  // Open in new tab
  window.open(result.url, '_blank')
}

// Print PDF directly
export async function printPDF(options: GeneratePDFOptions): Promise<void> {
  const result = await generatePDF(options)

  // Create hidden iframe for printing
  const iframe = document.createElement('iframe')
  iframe.style.display = 'none'
  iframe.src = result.url

  document.body.appendChild(iframe)

  iframe.onload = () => {
    iframe.contentWindow?.print()
    // Clean up after printing
    setTimeout(() => {
      document.body.removeChild(iframe)
      URL.revokeObjectURL(result.url)
    }, 1000)
  }
}

// Generate PDF as Base64
export async function generatePDFBase64(
  options: Omit<GeneratePDFOptions, 'fileName'>
): Promise<string> {
  const result = await generatePDF({ ...options, fileName: 'temp.pdf' })

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      // Remove data URL prefix
      const base64Data = base64.split(',')[1]
      resolve(base64Data)
      URL.revokeObjectURL(result.url)
    }
    reader.onerror = reject
    reader.readAsDataURL(result.blob)
  })
}

// Utility: Merge input data with default values
export function mergeInputs(
  template: Template,
  data: Record<string, unknown>
): Record<string, unknown>[] {
  const defaultValues: Record<string, unknown> = {}

  // Extract default values from template schemas
  template.schemas.forEach((pageSchemas) => {
    pageSchemas.forEach((schema: any) => {
      if (schema.name && schema.content) {
        defaultValues[schema.name] = schema.content
      }
    })
  })

  // Merge with provided data
  return [{ ...defaultValues, ...data }]
}

// Utility: Format currency for Estonian locale
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('et-EE', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(amount)
}

// Utility: Format date for Estonian locale
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return new Intl.DateTimeFormat('et-EE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d)
}

// Generate invoice PDF with calculated totals
export interface InvoiceData {
  invoiceNumber: string
  invoiceDate: string | Date
  dueDate: string | Date
  companyName: string
  companyLogo?: string
  companyDetails: string
  clientName: string
  clientAddress: string
  items: Array<{
    description: string
    quantity: number
    unit: string
    price: number
  }>
  vatRate?: number
  paymentInfo: string
  footer?: string
}

export function prepareInvoiceInputs(data: InvoiceData): Record<string, unknown> {
  const vatRate = data.vatRate || 22
  const subtotal = data.items.reduce(
    (sum, item) => sum + item.quantity * item.price,
    0
  )
  const vat = subtotal * (vatRate / 100)
  const total = subtotal + vat

  // Format items for table
  const tableRows = data.items.map((item) => [
    item.description,
    item.quantity.toString(),
    item.unit,
    formatCurrency(item.price),
    formatCurrency(item.quantity * item.price),
  ])

  return {
    company_name: data.companyName,
    company_logo: data.companyLogo || '',
    company_details: data.companyDetails,
    invoice_number: data.invoiceNumber,
    invoice_date: formatDate(data.invoiceDate),
    due_date: formatDate(data.dueDate),
    client_name: data.clientName,
    client_address: data.clientAddress,
    items_table: tableRows,
    subtotal: formatCurrency(subtotal),
    vat: formatCurrency(vat),
    total: formatCurrency(total),
    payment_info: data.paymentInfo,
    footer: data.footer || 'Täname teid koostöö eest!',
    // QR code data for bank payment
    payment_qr: JSON.stringify({
      type: 'payment',
      amount: total,
      recipient: data.companyName,
    }),
  }
}

// Generate additional work PDF
export interface AdditionalWorkData {
  documentNumber: string
  date: string | Date
  projectName: string
  projectCode: string
  clientName: string
  clientContact: string
  workDescription: string
  photos?: string[]
  items: Array<{
    name: string
    unit: string
    quantity: number
    unitPrice: number
  }>
  contractorSignature?: string
  clientSignature?: string
}

export function prepareAdditionalWorkInputs(
  data: AdditionalWorkData
): Record<string, unknown> {
  const total = data.items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  )

  // Format items for table
  const tableRows = data.items.map((item) => [
    item.name,
    item.unit,
    item.quantity.toString(),
    formatCurrency(item.unitPrice),
    formatCurrency(item.quantity * item.unitPrice),
  ])

  return {
    document_number: data.documentNumber,
    date: formatDate(data.date),
    project_name: data.projectName,
    project_code: data.projectCode,
    client_name: data.clientName,
    client_contact: data.clientContact,
    work_description: data.workDescription,
    photo1: data.photos?.[0] || '',
    photo2: data.photos?.[1] || '',
    price_table: tableRows,
    total: formatCurrency(total),
    contractor_signature: data.contractorSignature || '',
    client_signature: data.clientSignature || '',
  }
}

export default {
  generatePDF,
  downloadPDF,
  openPDFInNewTab,
  printPDF,
  generatePDFBase64,
  mergeInputs,
  formatCurrency,
  formatDate,
  prepareInvoiceInputs,
  prepareAdditionalWorkInputs,
}
