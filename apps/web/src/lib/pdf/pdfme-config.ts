// pdfme Configuration - Rivest Platform
// Configures all available plugins and fonts

import { text, image, barcodes, line, rectangle, ellipse, svg, table, dateTime, date, time } from '@pdfme/schemas'
import type { Template, Font, Plugins } from '@pdfme/common'
import { PAGE_SIZES } from './types'

// All available plugins
export const pdfmePlugins: Plugins = {
  Text: text,
  Image: image,
  Table: table,
  QRCode: barcodes.qrcode,
  Barcode128: barcodes.code128,
  Barcode39: barcodes.code39,
  BarcodeEAN13: barcodes.ean13,
  Line: line,
  Rectangle: rectangle,
  Ellipse: ellipse,
  SVG: svg,
  Date: date,
  Time: time,
  DateTime: dateTime,
}

// Font configuration
// Using system fonts for now - can add custom fonts later
export const pdfmeFonts: Font = {
  // Default font
  Roboto: {
    data: '', // Will be loaded dynamically
    fallback: true,
  },
}

// Default template for A4 portrait
export const createBlankTemplate = (
  pageSize: keyof typeof PAGE_SIZES = 'A4',
  orientation: 'portrait' | 'landscape' = 'portrait'
): Template => {
  const size = PAGE_SIZES[pageSize]
  const width = orientation === 'portrait' ? size.width : size.height
  const height = orientation === 'portrait' ? size.height : size.width

  return {
    basePdf: {
      width,
      height,
      padding: [10, 10, 10, 10],
    },
    schemas: [[]],
  }
}

// Invoice template (Demo)
export const createInvoiceTemplate = (): Template => ({
  basePdf: {
    width: 210,
    height: 297,
    padding: [15, 15, 15, 15],
  },
  schemas: [
    [
      // Company Logo
      {
        name: 'company_logo',
        type: 'image',
        position: { x: 15, y: 15 },
        width: 50,
        height: 20,
      },
      // Company Name
      {
        name: 'company_name',
        type: 'text',
        position: { x: 70, y: 15 },
        width: 80,
        height: 10,
        fontSize: 16,
        fontColor: '#1e293b',
        alignment: 'left',
      },
      // Invoice Title
      {
        name: 'invoice_title',
        type: 'text',
        content: 'ARVE',
        position: { x: 150, y: 15 },
        width: 45,
        height: 12,
        fontSize: 24,
        fontColor: '#279989',
        alignment: 'right',
      },
      // Invoice Number
      {
        name: 'invoice_number',
        type: 'text',
        position: { x: 150, y: 28 },
        width: 45,
        height: 8,
        fontSize: 12,
        fontColor: '#64748b',
        alignment: 'right',
      },
      // Invoice Date Label
      {
        name: 'date_label',
        type: 'text',
        content: 'Kuupäev:',
        position: { x: 130, y: 38 },
        width: 25,
        height: 6,
        fontSize: 10,
        fontColor: '#64748b',
        alignment: 'right',
      },
      // Invoice Date
      {
        name: 'invoice_date',
        type: 'text',
        position: { x: 157, y: 38 },
        width: 38,
        height: 6,
        fontSize: 10,
        fontColor: '#1e293b',
        alignment: 'right',
      },
      // Due Date Label
      {
        name: 'due_date_label',
        type: 'text',
        content: 'Tähtaeg:',
        position: { x: 130, y: 45 },
        width: 25,
        height: 6,
        fontSize: 10,
        fontColor: '#64748b',
        alignment: 'right',
      },
      // Due Date
      {
        name: 'due_date',
        type: 'text',
        position: { x: 157, y: 45 },
        width: 38,
        height: 6,
        fontSize: 10,
        fontColor: '#1e293b',
        alignment: 'right',
      },
      // Divider line
      {
        name: 'divider_top',
        type: 'line',
        position: { x: 15, y: 55 },
        width: 180,
        height: 0.5,
        color: '#e2e8f0',
      },
      // Bill To Section
      {
        name: 'bill_to_label',
        type: 'text',
        content: 'ARVE SAAJA',
        position: { x: 15, y: 62 },
        width: 40,
        height: 6,
        fontSize: 9,
        fontColor: '#64748b',
        alignment: 'left',
      },
      // Client Name
      {
        name: 'client_name',
        type: 'text',
        position: { x: 15, y: 70 },
        width: 80,
        height: 8,
        fontSize: 12,
        fontColor: '#1e293b',
        alignment: 'left',
      },
      // Client Address
      {
        name: 'client_address',
        type: 'text',
        position: { x: 15, y: 79 },
        width: 80,
        height: 20,
        fontSize: 10,
        fontColor: '#64748b',
        alignment: 'left',
        lineHeight: 1.4,
      },
      // From Section
      {
        name: 'from_label',
        type: 'text',
        content: 'ARVE ESITAJA',
        position: { x: 115, y: 62 },
        width: 40,
        height: 6,
        fontSize: 9,
        fontColor: '#64748b',
        alignment: 'left',
      },
      // Company Details
      {
        name: 'company_details',
        type: 'text',
        position: { x: 115, y: 70 },
        width: 80,
        height: 30,
        fontSize: 10,
        fontColor: '#64748b',
        alignment: 'left',
        lineHeight: 1.4,
      },
      // Items Table
      {
        name: 'items_table',
        type: 'table',
        position: { x: 15, y: 110 },
        width: 180,
        height: 100,
        showHead: true,
        head: [['Kirjeldus', 'Kogus', 'Ühik', 'Hind', 'Summa']],
        headStyles: {
          fontSize: 10,
          fontColor: '#ffffff',
          backgroundColor: '#279989',
          alignment: 'left',
          padding: [4, 6, 4, 6],
        },
        bodyStyles: {
          fontSize: 10,
          fontColor: '#1e293b',
          backgroundColor: '#ffffff',
          alignment: 'left',
          padding: [4, 6, 4, 6],
          borderWidth: 0.5,
          borderColor: '#e2e8f0',
        },
        columnStyles: {
          1: { alignment: 'center' },
          2: { alignment: 'center' },
          3: { alignment: 'right' },
          4: { alignment: 'right' },
        },
      },
      // Subtotal
      {
        name: 'subtotal_label',
        type: 'text',
        content: 'Vahesumma:',
        position: { x: 130, y: 215 },
        width: 35,
        height: 6,
        fontSize: 10,
        fontColor: '#64748b',
        alignment: 'right',
      },
      {
        name: 'subtotal',
        type: 'text',
        position: { x: 167, y: 215 },
        width: 28,
        height: 6,
        fontSize: 10,
        fontColor: '#1e293b',
        alignment: 'right',
      },
      // VAT
      {
        name: 'vat_label',
        type: 'text',
        content: 'KM 22%:',
        position: { x: 130, y: 223 },
        width: 35,
        height: 6,
        fontSize: 10,
        fontColor: '#64748b',
        alignment: 'right',
      },
      {
        name: 'vat',
        type: 'text',
        position: { x: 167, y: 223 },
        width: 28,
        height: 6,
        fontSize: 10,
        fontColor: '#1e293b',
        alignment: 'right',
      },
      // Total
      {
        name: 'total_label',
        type: 'text',
        content: 'KOKKU:',
        position: { x: 130, y: 233 },
        width: 35,
        height: 8,
        fontSize: 12,
        fontColor: '#279989',
        alignment: 'right',
      },
      {
        name: 'total',
        type: 'text',
        position: { x: 167, y: 233 },
        width: 28,
        height: 8,
        fontSize: 12,
        fontColor: '#279989',
        alignment: 'right',
      },
      // Payment Info
      {
        name: 'payment_info_label',
        type: 'text',
        content: 'MAKSEANDMED',
        position: { x: 15, y: 250 },
        width: 40,
        height: 6,
        fontSize: 9,
        fontColor: '#64748b',
        alignment: 'left',
      },
      {
        name: 'payment_info',
        type: 'text',
        position: { x: 15, y: 258 },
        width: 100,
        height: 20,
        fontSize: 10,
        fontColor: '#1e293b',
        alignment: 'left',
        lineHeight: 1.4,
      },
      // QR Code for payment
      {
        name: 'payment_qr',
        type: 'qrcode',
        position: { x: 160, y: 250 },
        width: 30,
        height: 30,
      },
      // Footer
      {
        name: 'footer',
        type: 'text',
        content: 'Täname teid koostöö eest!',
        position: { x: 15, y: 285 },
        width: 180,
        height: 6,
        fontSize: 9,
        fontColor: '#94a3b8',
        alignment: 'center',
      },
    ],
  ],
})

// Additional Work template (Demo)
export const createAdditionalWorkTemplate = (): Template => ({
  basePdf: {
    width: 210,
    height: 297,
    padding: [15, 15, 15, 15],
  },
  schemas: [
    [
      // Company Logo
      {
        name: 'company_logo',
        type: 'image',
        position: { x: 15, y: 15 },
        width: 40,
        height: 15,
      },
      // Title
      {
        name: 'title',
        type: 'text',
        content: 'LISATÖÖ AKT',
        position: { x: 15, y: 35 },
        width: 180,
        height: 12,
        fontSize: 20,
        fontColor: '#279989',
        alignment: 'center',
      },
      // Document Number
      {
        name: 'document_number',
        type: 'text',
        position: { x: 140, y: 15 },
        width: 55,
        height: 8,
        fontSize: 12,
        fontColor: '#64748b',
        alignment: 'right',
      },
      // Date
      {
        name: 'date',
        type: 'text',
        position: { x: 140, y: 24 },
        width: 55,
        height: 6,
        fontSize: 10,
        fontColor: '#1e293b',
        alignment: 'right',
      },
      // Divider
      {
        name: 'divider1',
        type: 'line',
        position: { x: 15, y: 52 },
        width: 180,
        height: 0.5,
        color: '#e2e8f0',
      },
      // Project Info Section
      {
        name: 'project_label',
        type: 'text',
        content: 'PROJEKT',
        position: { x: 15, y: 58 },
        width: 30,
        height: 6,
        fontSize: 9,
        fontColor: '#64748b',
        alignment: 'left',
      },
      {
        name: 'project_name',
        type: 'text',
        position: { x: 15, y: 65 },
        width: 100,
        height: 8,
        fontSize: 12,
        fontColor: '#1e293b',
        alignment: 'left',
      },
      {
        name: 'project_code',
        type: 'text',
        position: { x: 15, y: 74 },
        width: 100,
        height: 6,
        fontSize: 10,
        fontColor: '#64748b',
        alignment: 'left',
      },
      // Client Info
      {
        name: 'client_label',
        type: 'text',
        content: 'TELLIJA',
        position: { x: 115, y: 58 },
        width: 30,
        height: 6,
        fontSize: 9,
        fontColor: '#64748b',
        alignment: 'left',
      },
      {
        name: 'client_name',
        type: 'text',
        position: { x: 115, y: 65 },
        width: 80,
        height: 8,
        fontSize: 12,
        fontColor: '#1e293b',
        alignment: 'left',
      },
      {
        name: 'client_contact',
        type: 'text',
        position: { x: 115, y: 74 },
        width: 80,
        height: 6,
        fontSize: 10,
        fontColor: '#64748b',
        alignment: 'left',
      },
      // Work Description Section
      {
        name: 'work_label',
        type: 'text',
        content: 'LISATÖÖ KIRJELDUS',
        position: { x: 15, y: 90 },
        width: 60,
        height: 6,
        fontSize: 9,
        fontColor: '#64748b',
        alignment: 'left',
      },
      {
        name: 'work_description',
        type: 'text',
        position: { x: 15, y: 98 },
        width: 180,
        height: 40,
        fontSize: 10,
        fontColor: '#1e293b',
        alignment: 'left',
        lineHeight: 1.5,
      },
      // Photo 1
      {
        name: 'photo1_label',
        type: 'text',
        content: 'Foto 1',
        position: { x: 15, y: 145 },
        width: 85,
        height: 5,
        fontSize: 8,
        fontColor: '#94a3b8',
        alignment: 'center',
      },
      {
        name: 'photo1',
        type: 'image',
        position: { x: 15, y: 150 },
        width: 85,
        height: 55,
      },
      // Photo 2
      {
        name: 'photo2_label',
        type: 'text',
        content: 'Foto 2',
        position: { x: 110, y: 145 },
        width: 85,
        height: 5,
        fontSize: 8,
        fontColor: '#94a3b8',
        alignment: 'center',
      },
      {
        name: 'photo2',
        type: 'image',
        position: { x: 110, y: 150 },
        width: 85,
        height: 55,
      },
      // Price Breakdown
      {
        name: 'price_label',
        type: 'text',
        content: 'HINNAKALKULATSIOON',
        position: { x: 15, y: 215 },
        width: 60,
        height: 6,
        fontSize: 9,
        fontColor: '#64748b',
        alignment: 'left',
      },
      // Price Table
      {
        name: 'price_table',
        type: 'table',
        position: { x: 15, y: 223 },
        width: 180,
        height: 35,
        showHead: true,
        head: [['Nimetus', 'Ühik', 'Kogus', 'Ühiku hind', 'Summa']],
        headStyles: {
          fontSize: 9,
          fontColor: '#ffffff',
          backgroundColor: '#475569',
          alignment: 'left',
          padding: [3, 4, 3, 4],
        },
        bodyStyles: {
          fontSize: 9,
          fontColor: '#1e293b',
          alignment: 'left',
          padding: [3, 4, 3, 4],
          borderWidth: 0.5,
          borderColor: '#e2e8f0',
        },
        columnStyles: {
          1: { alignment: 'center' },
          2: { alignment: 'center' },
          3: { alignment: 'right' },
          4: { alignment: 'right' },
        },
      },
      // Total
      {
        name: 'total_label',
        type: 'text',
        content: 'KOKKU:',
        position: { x: 130, y: 262 },
        width: 35,
        height: 8,
        fontSize: 12,
        fontColor: '#279989',
        alignment: 'right',
      },
      {
        name: 'total',
        type: 'text',
        position: { x: 167, y: 262 },
        width: 28,
        height: 8,
        fontSize: 12,
        fontColor: '#279989',
        alignment: 'right',
      },
      // Signatures
      {
        name: 'signatures_label',
        type: 'text',
        content: 'ALLKIRJAD',
        position: { x: 15, y: 275 },
        width: 30,
        height: 5,
        fontSize: 8,
        fontColor: '#94a3b8',
        alignment: 'left',
      },
      {
        name: 'contractor_signature_label',
        type: 'text',
        content: 'Töövõtja:',
        position: { x: 15, y: 282 },
        width: 30,
        height: 5,
        fontSize: 9,
        fontColor: '#64748b',
        alignment: 'left',
      },
      {
        name: 'contractor_signature',
        type: 'text',
        position: { x: 15, y: 288 },
        width: 70,
        height: 5,
        fontSize: 9,
        fontColor: '#1e293b',
        alignment: 'left',
      },
      {
        name: 'client_signature_label',
        type: 'text',
        content: 'Tellija:',
        position: { x: 115, y: 282 },
        width: 30,
        height: 5,
        fontSize: 9,
        fontColor: '#64748b',
        alignment: 'left',
      },
      {
        name: 'client_signature',
        type: 'text',
        position: { x: 115, y: 288 },
        width: 70,
        height: 5,
        fontSize: 9,
        fontColor: '#1e293b',
        alignment: 'left',
      },
    ],
  ],
})

// Export all demo templates
export const DEMO_TEMPLATES = {
  blank: createBlankTemplate,
  invoice: createInvoiceTemplate,
  additional_work: createAdditionalWorkTemplate,
}
