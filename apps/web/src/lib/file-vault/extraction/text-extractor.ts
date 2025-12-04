/**
 * TEXT EXTRACTION SERVICE
 * Extracts text from PDF, DOCX, and images (OCR)
 */

/**
 * Extract text from a PDF file
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import to handle ESM/CJS compatibility
    const pdfParse = await import('pdf-parse').then(m => m.default || m)
    const data = await pdfParse(buffer)
    return data.text?.trim() || ''
  } catch (error) {
    console.error('Error extracting PDF text:', error)
    return ''
  }
}

/**
 * Extract text from a DOCX file
 */
export async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    const mammoth = await import('mammoth')
    const result = await mammoth.extractRawText({ buffer })
    return result.value?.trim() || ''
  } catch (error) {
    console.error('Error extracting DOCX text:', error)
    return ''
  }
}

/**
 * Extract text from an image using OCR (Tesseract.js)
 * Note: This is computationally expensive, use sparingly
 */
export async function extractImageText(buffer: Buffer): Promise<string> {
  try {
    // Dynamic import to avoid loading Tesseract in all contexts
    const Tesseract = await import('tesseract.js')

    // Convert buffer to base64 data URL
    const base64 = buffer.toString('base64')
    const mimeType = 'image/png' // Default, will work for most images
    const dataUrl = `data:${mimeType};base64,${base64}`

    const result = await Tesseract.recognize(dataUrl, 'eng+est', {
      // Use basic config for better performance
    })

    return result.data.text?.trim() || ''
  } catch (error) {
    console.error('Error extracting image text (OCR):', error)
    return ''
  }
}

/**
 * Extract text from plain text files
 */
export function extractPlainText(buffer: Buffer): string {
  try {
    return buffer.toString('utf-8').trim()
  } catch (error) {
    console.error('Error extracting plain text:', error)
    return ''
  }
}

/**
 * Main extraction function - routes to appropriate extractor based on mime type
 */
export async function extractText(
  buffer: Buffer,
  mimeType: string,
  options?: {
    enableOcr?: boolean
    maxLength?: number
  }
): Promise<string> {
  const { enableOcr = false, maxLength = 100000 } = options || {}

  let text = ''

  // PDF
  if (mimeType === 'application/pdf') {
    text = await extractPdfText(buffer)
  }
  // Word documents
  else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    text = await extractDocxText(buffer)
  }
  // Plain text files
  else if (
    mimeType.startsWith('text/') ||
    mimeType === 'application/json' ||
    mimeType === 'application/xml'
  ) {
    text = extractPlainText(buffer)
  }
  // Images (OCR) - only if enabled
  else if (enableOcr && mimeType.startsWith('image/')) {
    text = await extractImageText(buffer)
  }

  // Truncate if too long
  if (text.length > maxLength) {
    text = text.substring(0, maxLength)
  }

  return text
}

/**
 * Check if file type supports text extraction
 */
export function supportsTextExtraction(mimeType: string): boolean {
  const supportedTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'text/plain',
    'text/csv',
    'text/html',
    'text/markdown',
    'application/json',
    'application/xml',
  ]

  return supportedTypes.includes(mimeType) || mimeType.startsWith('text/')
}

/**
 * Check if file type supports OCR
 */
export function supportsOcr(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}
