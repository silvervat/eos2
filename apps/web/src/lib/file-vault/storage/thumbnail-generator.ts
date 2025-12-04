/**
 * FILE VAULT - Thumbnail Generator
 * Generates thumbnails for images using sharp
 */

import sharp from 'sharp'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { FILE_VAULT_BUCKET, isImage } from './file-storage'

// Thumbnail sizes
export const THUMBNAIL_SIZES = {
  small: { width: 150, height: 150 },
  medium: { width: 500, height: 500 },
  large: { width: 1000, height: 1000 },
} as const

export type ThumbnailSize = keyof typeof THUMBNAIL_SIZES

/**
 * Generate thumbnail from image buffer
 */
export async function generateThumbnail(
  buffer: Buffer,
  size: ThumbnailSize
): Promise<Buffer> {
  const dimensions = THUMBNAIL_SIZES[size]

  return sharp(buffer)
    .resize(dimensions.width, dimensions.height, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: 80 })
    .toBuffer()
}

/**
 * Generate all thumbnail sizes for an image
 */
export async function generateAllThumbnails(
  buffer: Buffer,
  storageKeyBase: string
): Promise<{
  small: string | null
  medium: string | null
  large: string | null
}> {
  const results: {
    small: string | null
    medium: string | null
    large: string | null
  } = {
    small: null,
    medium: null,
    large: null,
  }

  const sizes: ThumbnailSize[] = ['small', 'medium', 'large']

  for (const size of sizes) {
    try {
      const thumbnailBuffer = await generateThumbnail(buffer, size)
      const thumbnailKey = `${storageKeyBase}_thumb_${size}.webp`

      const { error } = await supabaseAdmin.storage
        .from(FILE_VAULT_BUCKET)
        .upload(thumbnailKey, thumbnailBuffer, {
          contentType: 'image/webp',
          upsert: true,
        })

      if (error) {
        console.error(`Failed to upload ${size} thumbnail:`, error)
        continue
      }

      // Use signed URL for private bucket (1 year expiry)
      const { data: signedUrlData, error: signedError } = await supabaseAdmin.storage
        .from(FILE_VAULT_BUCKET)
        .createSignedUrl(thumbnailKey, 365 * 24 * 60 * 60) // 1 year

      if (signedError) {
        console.error(`Failed to create signed URL for ${size} thumbnail:`, signedError)
        // Fallback to public URL
        const { data: urlData } = supabaseAdmin.storage
          .from(FILE_VAULT_BUCKET)
          .getPublicUrl(thumbnailKey)
        results[size] = urlData.publicUrl
      } else {
        results[size] = signedUrlData.signedUrl
      }
    } catch (error) {
      console.error(`Failed to generate ${size} thumbnail:`, error)
    }
  }

  return results
}

/**
 * Extract image dimensions from buffer
 */
export async function getImageDimensions(
  buffer: Buffer
): Promise<{ width: number; height: number } | null> {
  try {
    const metadata = await sharp(buffer).metadata()
    if (metadata.width && metadata.height) {
      return {
        width: metadata.width,
        height: metadata.height,
      }
    }
    return null
  } catch (error) {
    console.error('Failed to get image dimensions:', error)
    return null
  }
}

/**
 * Delete all thumbnails for a file
 */
export async function deleteThumbnails(
  storageKeyBase: string
): Promise<void> {
  const sizes: ThumbnailSize[] = ['small', 'medium', 'large']
  const keys = sizes.map(size => `${storageKeyBase}_thumb_${size}.webp`)

  const { error } = await supabaseAdmin.storage
    .from(FILE_VAULT_BUCKET)
    .remove(keys)

  if (error) {
    console.error('Failed to delete thumbnails:', error)
  }
}

/**
 * Compress image while maintaining quality
 */
export async function compressImage(
  buffer: Buffer,
  mimeType: string,
  quality: number = 80
): Promise<Buffer> {
  let sharpInstance = sharp(buffer)

  // Get original dimensions
  const metadata = await sharpInstance.metadata()

  // Limit max dimensions to 4096x4096
  const maxDimension = 4096
  if (metadata.width && metadata.width > maxDimension) {
    sharpInstance = sharpInstance.resize(maxDimension, null, {
      withoutEnlargement: true,
    })
  }
  if (metadata.height && metadata.height > maxDimension) {
    sharpInstance = sharpInstance.resize(null, maxDimension, {
      withoutEnlargement: true,
    })
  }

  // Compress based on format
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') {
    return sharpInstance.jpeg({ quality, progressive: true }).toBuffer()
  } else if (mimeType === 'image/png') {
    return sharpInstance.png({ compressionLevel: 8 }).toBuffer()
  } else if (mimeType === 'image/webp') {
    return sharpInstance.webp({ quality }).toBuffer()
  }

  // Return original if format not supported for compression
  return buffer
}

/**
 * Convert HEIC to JPEG
 */
export async function convertHeicToJpeg(
  buffer: Buffer
): Promise<Buffer> {
  return sharp(buffer)
    .jpeg({ quality: 85 })
    .toBuffer()
}

/**
 * Get image orientation from EXIF
 */
export async function getImageOrientation(
  buffer: Buffer
): Promise<number> {
  try {
    const metadata = await sharp(buffer).metadata()
    return metadata.orientation || 1
  } catch {
    return 1
  }
}

/**
 * Auto-rotate image based on EXIF orientation
 */
export async function autoRotateImage(
  buffer: Buffer
): Promise<Buffer> {
  return sharp(buffer)
    .rotate() // Auto-rotate based on EXIF
    .toBuffer()
}
