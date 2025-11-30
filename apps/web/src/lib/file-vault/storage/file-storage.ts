/**
 * FILE VAULT - Storage Utilities
 * Handles file uploads to Supabase Storage
 */

import { supabaseAdmin } from '@/lib/supabase/admin'
import crypto from 'crypto'

// Storage bucket name
export const FILE_VAULT_BUCKET = 'file-vault'

// Supported image formats for thumbnails
export const IMAGE_FORMATS = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']

// Max file size (1GB)
export const MAX_FILE_SIZE = 1024 * 1024 * 1024

// Chunk size for large uploads (10MB)
export const CHUNK_SIZE = 10 * 1024 * 1024

/**
 * Generate a unique storage key for a file
 */
export function generateStorageKey(
  vaultId: string,
  folderId: string | null,
  filename: string
): string {
  const timestamp = Date.now()
  const random = crypto.randomBytes(8).toString('hex')
  const extension = filename.split('.').pop()?.toLowerCase() || ''
  const safeFilename = filename
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[^a-z0-9]/gi, '_') // Replace special chars
    .substring(0, 50) // Limit length

  return `${vaultId}/${folderId || 'root'}/${timestamp}_${random}_${safeFilename}.${extension}`
}

/**
 * Calculate MD5 checksum of a buffer
 */
export function calculateMd5(buffer: Buffer): string {
  return crypto.createHash('md5').update(buffer).digest('hex')
}

/**
 * Calculate SHA256 checksum of a buffer
 */
export function calculateSha256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex')
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.')
  return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : ''
}

/**
 * Detect MIME type from buffer (magic bytes)
 */
export function detectMimeType(buffer: Buffer, filename: string): string {
  // Check magic bytes for common file types
  const header = buffer.slice(0, 12)
  const hex = header.toString('hex').toLowerCase()

  // Images
  if (hex.startsWith('ffd8ff')) return 'image/jpeg'
  if (hex.startsWith('89504e47')) return 'image/png'
  if (hex.startsWith('47494638')) return 'image/gif'
  if (hex.startsWith('52494646') && hex.slice(16, 24) === '57454250') return 'image/webp'

  // PDF
  if (hex.startsWith('255044462d')) return 'application/pdf'

  // ZIP/Office documents
  if (hex.startsWith('504b0304')) {
    const ext = getFileExtension(filename)
    if (ext === 'docx') return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    if (ext === 'xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    if (ext === 'pptx') return 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    return 'application/zip'
  }

  // Videos
  if (hex.startsWith('000000') && (hex.slice(8, 16) === '66747970' || hex.slice(8, 16) === '6d6f6f76')) {
    return 'video/mp4'
  }
  if (hex.startsWith('1a45dfa3')) return 'video/webm'

  // Audio
  if (hex.startsWith('494433') || hex.startsWith('fffb') || hex.startsWith('fff3')) return 'audio/mpeg'
  if (hex.startsWith('4f676753')) return 'audio/ogg'

  // Text-based files - fallback to extension
  const ext = getFileExtension(filename)
  const textExtensions: Record<string, string> = {
    txt: 'text/plain',
    html: 'text/html',
    htm: 'text/html',
    css: 'text/css',
    js: 'text/javascript',
    json: 'application/json',
    xml: 'application/xml',
    md: 'text/markdown',
    csv: 'text/csv',
    ts: 'text/typescript',
    tsx: 'text/typescript',
    jsx: 'text/javascript',
    py: 'text/x-python',
    sql: 'text/sql',
    yaml: 'text/yaml',
    yml: 'text/yaml',
    svg: 'image/svg+xml',
  }

  if (textExtensions[ext]) return textExtensions[ext]

  // Default to octet-stream
  return 'application/octet-stream'
}

/**
 * Upload file to Supabase Storage
 */
export async function uploadFileToStorage(
  buffer: Buffer,
  storageKey: string,
  mimeType: string
): Promise<{ path: string; publicUrl: string }> {
  const { data, error } = await supabaseAdmin.storage
    .from(FILE_VAULT_BUCKET)
    .upload(storageKey, buffer, {
      contentType: mimeType,
      upsert: false,
    })

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  const { data: urlData } = supabaseAdmin.storage
    .from(FILE_VAULT_BUCKET)
    .getPublicUrl(storageKey)

  return {
    path: data.path,
    publicUrl: urlData.publicUrl,
  }
}

/**
 * Get signed URL for private file download
 */
export async function getSignedDownloadUrl(
  storageKey: string,
  expiresIn: number = 3600
): Promise<string> {
  const { data, error } = await supabaseAdmin.storage
    .from(FILE_VAULT_BUCKET)
    .createSignedUrl(storageKey, expiresIn)

  if (error) {
    throw new Error(`Failed to create signed URL: ${error.message}`)
  }

  return data.signedUrl
}

/**
 * Delete file from storage
 */
export async function deleteFileFromStorage(storageKey: string): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(FILE_VAULT_BUCKET)
    .remove([storageKey])

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}

/**
 * Initialize upload session for chunked uploads
 */
export interface UploadSessionData {
  id: string
  storageKey: string
  filename: string
  totalSize: number
  totalChunks: number
  uploadedChunks: number[]
  resumeToken: string
  expiresAt: Date
}

export function createUploadSession(
  vaultId: string,
  folderId: string | null,
  filename: string,
  totalSize: number,
  chunkSize: number = CHUNK_SIZE
): UploadSessionData {
  const id = crypto.randomUUID()
  const storageKey = generateStorageKey(vaultId, folderId, filename)
  const totalChunks = Math.ceil(totalSize / chunkSize)
  const resumeToken = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  return {
    id,
    storageKey,
    filename,
    totalSize,
    totalChunks,
    uploadedChunks: [],
    resumeToken,
    expiresAt,
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${units[i]}`
}

/**
 * Check if file type is allowed
 */
export function isFileTypeAllowed(
  mimeType: string,
  allowedTypes?: string[]
): boolean {
  if (!allowedTypes || allowedTypes.length === 0) {
    return true // All types allowed
  }

  return allowedTypes.some(type => {
    if (type.endsWith('/*')) {
      const category = type.slice(0, -2)
      return mimeType.startsWith(category)
    }
    return mimeType === type
  })
}

/**
 * Check if file is an image
 */
export function isImage(mimeType: string): boolean {
  return mimeType.startsWith('image/')
}

/**
 * Check if file is a video
 */
export function isVideo(mimeType: string): boolean {
  return mimeType.startsWith('video/')
}

/**
 * Check if file is audio
 */
export function isAudio(mimeType: string): boolean {
  return mimeType.startsWith('audio/')
}

/**
 * Check if file is a document
 */
export function isDocument(mimeType: string): boolean {
  const documentTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'text/markdown',
    'text/html',
    'text/csv',
  ]
  return documentTypes.includes(mimeType)
}
