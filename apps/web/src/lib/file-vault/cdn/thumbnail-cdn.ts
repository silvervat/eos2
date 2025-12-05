/**
 * CDN THUMBNAIL DELIVERY - Enterprise File Vault
 *
 * Optimizes thumbnail delivery using CDN:
 * - CloudFront, Cloudflare, or custom CDN support
 * - Signed URLs for private content
 * - Cache-busting for updates
 * - Responsive image srcset generation
 * - WebP/AVIF format selection
 *
 * Configuration via environment variables:
 * - CDN_URL: Base CDN URL (e.g., https://cdn.example.com)
 * - CDN_PROVIDER: 'cloudfront' | 'cloudflare' | 'bunny' | 'custom'
 * - CDN_SIGN_URLS: Enable URL signing for private content
 * - CDN_SIGN_KEY: Key for URL signing
 */

interface CDNConfig {
  baseUrl: string
  provider: 'cloudfront' | 'cloudflare' | 'bunny' | 'custom' | 'none'
  signUrls: boolean
  signKey?: string
  signExpiry: number // seconds
  defaultFormat: 'webp' | 'avif' | 'auto' | 'original'
  qualityPresets: {
    thumbnail: number // 0-100
    preview: number
    full: number
  }
}

interface ThumbnailOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'avif' | 'jpeg' | 'png' | 'auto'
  fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside'
}

interface ResponsiveImage {
  src: string
  srcset: string
  sizes: string
  width: number
  height: number
}

// Default configuration
const DEFAULT_CONFIG: CDNConfig = {
  baseUrl: process.env.CDN_URL || '',
  provider: (process.env.CDN_PROVIDER as CDNConfig['provider']) || 'none',
  signUrls: process.env.CDN_SIGN_URLS === 'true',
  signKey: process.env.CDN_SIGN_KEY,
  signExpiry: 3600, // 1 hour
  defaultFormat: 'webp',
  qualityPresets: {
    thumbnail: 60,
    preview: 75,
    full: 85,
  },
}

// Thumbnail size presets
export const THUMBNAIL_SIZES = {
  small: { width: 100, height: 100 },
  medium: { width: 300, height: 300 },
  large: { width: 800, height: 800 },
  xlarge: { width: 1200, height: 1200 },
} as const

// Responsive breakpoints
const RESPONSIVE_BREAKPOINTS = [320, 640, 768, 1024, 1280, 1536]

class ThumbnailCDN {
  private config: CDNConfig

  constructor(config: Partial<CDNConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
  }

  /**
   * Check if CDN is enabled
   */
  isEnabled(): boolean {
    return !!this.config.baseUrl && this.config.provider !== 'none'
  }

  /**
   * Get CDN URL for a thumbnail
   */
  getThumbnailUrl(
    storagePath: string,
    options: ThumbnailOptions = {}
  ): string {
    // If CDN not enabled, return original path
    if (!this.isEnabled()) {
      return storagePath
    }

    const {
      width = THUMBNAIL_SIZES.medium.width,
      height = THUMBNAIL_SIZES.medium.height,
      quality = this.config.qualityPresets.preview,
      format = this.config.defaultFormat,
      fit = 'cover',
    } = options

    let url: string

    switch (this.config.provider) {
      case 'cloudfront':
        url = this.buildCloudFrontUrl(storagePath, { width, height, quality, format, fit })
        break
      case 'cloudflare':
        url = this.buildCloudflareUrl(storagePath, { width, height, quality, format, fit })
        break
      case 'bunny':
        url = this.buildBunnyUrl(storagePath, { width, height, quality, format, fit })
        break
      default:
        url = this.buildCustomUrl(storagePath, { width, height, quality, format, fit })
    }

    // Sign URL if required
    if (this.config.signUrls && this.config.signKey) {
      url = this.signUrl(url)
    }

    return url
  }

  /**
   * Get responsive image data
   */
  getResponsiveImage(
    storagePath: string,
    options: {
      aspectRatio?: number
      maxWidth?: number
      sizes?: string
    } = {}
  ): ResponsiveImage {
    const {
      aspectRatio = 1,
      maxWidth = 1200,
      sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    } = options

    // Generate srcset for different widths
    const srcsetParts = RESPONSIVE_BREAKPOINTS
      .filter(w => w <= maxWidth)
      .map(width => {
        const height = Math.round(width / aspectRatio)
        const url = this.getThumbnailUrl(storagePath, { width, height, format: 'auto' })
        return `${url} ${width}w`
      })

    const srcset = srcsetParts.join(', ')

    // Default src (medium size)
    const defaultWidth = Math.min(640, maxWidth)
    const defaultHeight = Math.round(defaultWidth / aspectRatio)
    const src = this.getThumbnailUrl(storagePath, {
      width: defaultWidth,
      height: defaultHeight,
    })

    return {
      src,
      srcset,
      sizes,
      width: defaultWidth,
      height: defaultHeight,
    }
  }

  /**
   * Get preload link for critical images
   */
  getPreloadLink(storagePath: string, size: keyof typeof THUMBNAIL_SIZES = 'medium'): string {
    const { width, height } = THUMBNAIL_SIZES[size]
    const url = this.getThumbnailUrl(storagePath, { width, height })

    return `<link rel="preload" as="image" href="${url}" />`
  }

  /**
   * Generate cache-busting URL
   */
  getCacheBustedUrl(storagePath: string, version: string | number): string {
    const url = this.getThumbnailUrl(storagePath)
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}v=${version}`
  }

  // Provider-specific URL builders

  private buildCloudFrontUrl(
    path: string,
    opts: Required<ThumbnailOptions>
  ): string {
    // CloudFront with Lambda@Edge or CloudFront Functions for resizing
    const params = new URLSearchParams({
      w: opts.width.toString(),
      h: opts.height.toString(),
      q: opts.quality.toString(),
      f: opts.format === 'auto' ? 'auto' : opts.format,
      fit: opts.fit,
    })

    return `${this.config.baseUrl}/${path}?${params.toString()}`
  }

  private buildCloudflareUrl(
    path: string,
    opts: Required<ThumbnailOptions>
  ): string {
    // Cloudflare Image Resizing
    const options = [
      `width=${opts.width}`,
      `height=${opts.height}`,
      `quality=${opts.quality}`,
      `format=${opts.format}`,
      `fit=${opts.fit}`,
    ].join(',')

    return `${this.config.baseUrl}/cdn-cgi/image/${options}/${path}`
  }

  private buildBunnyUrl(
    path: string,
    opts: Required<ThumbnailOptions>
  ): string {
    // Bunny.net CDN with Bunny Optimizer
    const params = new URLSearchParams({
      width: opts.width.toString(),
      height: opts.height.toString(),
      quality: opts.quality.toString(),
      ...(opts.format !== 'auto' && { format: opts.format }),
    })

    return `${this.config.baseUrl}/${path}?${params.toString()}`
  }

  private buildCustomUrl(
    path: string,
    opts: Required<ThumbnailOptions>
  ): string {
    // Generic URL with query parameters
    const params = new URLSearchParams({
      w: opts.width.toString(),
      h: opts.height.toString(),
      q: opts.quality.toString(),
      f: opts.format,
      fit: opts.fit,
    })

    return `${this.config.baseUrl}/${path}?${params.toString()}`
  }

  /**
   * Sign URL for authenticated access
   */
  private signUrl(url: string): string {
    if (!this.config.signKey) return url

    const expiry = Math.floor(Date.now() / 1000) + this.config.signExpiry

    // Simple signing (production should use proper HMAC)
    // This is a placeholder - implement proper signing based on CDN provider
    const separator = url.includes('?') ? '&' : '?'
    const signature = this.generateSignature(url, expiry)

    return `${url}${separator}exp=${expiry}&sig=${signature}`
  }

  private generateSignature(url: string, expiry: number): string {
    // Placeholder - implement proper HMAC-SHA256 signing
    // For production, use crypto.createHmac('sha256', key).update(data).digest('base64url')
    const data = `${url}${expiry}${this.config.signKey}`
    return Buffer.from(data).toString('base64').slice(0, 32)
  }
}

// Singleton instance
let cdnInstance: ThumbnailCDN | null = null

/**
 * Get CDN instance
 */
export function getCDN(): ThumbnailCDN {
  if (!cdnInstance) {
    cdnInstance = new ThumbnailCDN()
  }
  return cdnInstance
}

/**
 * Helper to transform file record with CDN URLs
 */
export function transformFileWithCDN<T extends {
  thumbnailSmall?: string
  thumbnailMedium?: string
  thumbnailLarge?: string
}>(file: T): T {
  const cdn = getCDN()

  if (!cdn.isEnabled()) {
    return file
  }

  return {
    ...file,
    thumbnailSmall: file.thumbnailSmall
      ? cdn.getThumbnailUrl(file.thumbnailSmall, THUMBNAIL_SIZES.small)
      : undefined,
    thumbnailMedium: file.thumbnailMedium
      ? cdn.getThumbnailUrl(file.thumbnailMedium, THUMBNAIL_SIZES.medium)
      : undefined,
    thumbnailLarge: file.thumbnailLarge
      ? cdn.getThumbnailUrl(file.thumbnailLarge, THUMBNAIL_SIZES.large)
      : undefined,
  }
}

/**
 * Transform array of files with CDN URLs
 */
export function transformFilesWithCDN<T extends {
  thumbnailSmall?: string
  thumbnailMedium?: string
  thumbnailLarge?: string
}>(files: T[]): T[] {
  return files.map(transformFileWithCDN)
}

export { ThumbnailCDN }
export type { CDNConfig, ThumbnailOptions, ResponsiveImage }
export default getCDN
