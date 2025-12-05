/**
 * FILE VAULT - Performance Logger
 *
 * Logs file access operations with performance metrics for analytics
 */

import { createClient } from '@/lib/supabase/server'

export type FileAction =
  | 'upload'
  | 'download'
  | 'view'
  | 'preview'
  | 'thumbnail'
  | 'delete'
  | 'move'
  | 'copy'
  | 'share'
  | 'list'

export interface PerformanceLogParams {
  fileId?: string | null
  folderId?: string | null
  vaultId?: string | null
  tenantId?: string | null
  action: FileAction
  operationType?: string
  userId?: string | null
  bytesTransferred?: number
  fileSizeBytes?: number
  mimeType?: string | null
  durationMs?: number
  cacheHit?: boolean
  isError?: boolean
  errorMessage?: string | null
  ipAddress?: string | null
  userAgent?: string | null
  details?: Record<string, unknown>
}

/**
 * Log a file access operation with performance data
 */
export async function logFileAccess(params: PerformanceLogParams): Promise<string | null> {
  try {
    const supabase = createClient()

    const { data, error } = await supabase.rpc('log_file_access', {
      p_file_id: params.fileId || null,
      p_folder_id: params.folderId || null,
      p_vault_id: params.vaultId || null,
      p_tenant_id: params.tenantId || null,
      p_action: params.action,
      p_operation_type: params.operationType || params.action,
      p_user_id: params.userId || null,
      p_bytes_transferred: params.bytesTransferred || 0,
      p_file_size_bytes: params.fileSizeBytes || 0,
      p_mime_type: params.mimeType || null,
      p_duration_ms: params.durationMs || null,
      p_cache_hit: params.cacheHit || false,
      p_is_error: params.isError || false,
      p_error_message: params.errorMessage || null,
      p_ip_address: params.ipAddress || null,
      p_user_agent: params.userAgent || null,
      p_details: params.details || {},
    })

    if (error) {
      // Log error but don't throw - performance logging shouldn't break the main operation
      console.warn('Failed to log file access:', error.message)
      return null
    }

    return data as string
  } catch (error) {
    console.warn('Error in logFileAccess:', error)
    return null
  }
}

/**
 * Helper class for tracking operation duration
 */
export class PerformanceTracker {
  private startTime: number
  private params: Partial<PerformanceLogParams>

  constructor(params: Partial<PerformanceLogParams>) {
    this.startTime = Date.now()
    this.params = params
  }

  /**
   * Complete the tracking and log the result
   */
  async finish(additionalParams?: Partial<PerformanceLogParams>): Promise<string | null> {
    const durationMs = Date.now() - this.startTime

    return logFileAccess({
      action: 'view', // Default action
      ...this.params,
      ...additionalParams,
      durationMs,
    } as PerformanceLogParams)
  }

  /**
   * Log an error
   */
  async error(errorMessage: string, additionalParams?: Partial<PerformanceLogParams>): Promise<string | null> {
    const durationMs = Date.now() - this.startTime

    return logFileAccess({
      action: 'view',
      ...this.params,
      ...additionalParams,
      durationMs,
      isError: true,
      errorMessage,
    } as PerformanceLogParams)
  }

  /**
   * Get elapsed time in milliseconds
   */
  getElapsedMs(): number {
    return Date.now() - this.startTime
  }
}

/**
 * Create a new performance tracker
 */
export function trackPerformance(params: Partial<PerformanceLogParams>): PerformanceTracker {
  return new PerformanceTracker(params)
}

/**
 * Log API request performance
 */
export async function logApiRequest(params: {
  endpoint: string
  method: string
  vaultId?: string | null
  tenantId?: string | null
  userId?: string | null
  durationMs: number
  statusCode: number
  cacheHit?: boolean
  ipAddress?: string | null
  userAgent?: string | null
}): Promise<void> {
  try {
    const supabase = createClient()

    await supabase.from('file_accesses').insert({
      vault_id: params.vaultId,
      tenant_id: params.tenantId,
      action: 'api_request',
      operation_type: `${params.method} ${params.endpoint}`,
      user_id: params.userId,
      duration_ms: params.durationMs,
      cache_hit: params.cacheHit || false,
      is_error: params.statusCode >= 400,
      error_message: params.statusCode >= 400 ? `HTTP ${params.statusCode}` : null,
      ip_address: params.ipAddress,
      user_agent: params.userAgent,
      details: {
        endpoint: params.endpoint,
        method: params.method,
        statusCode: params.statusCode,
      },
    })
  } catch (error) {
    console.warn('Error logging API request:', error)
  }
}

/**
 * Get request metadata from headers
 */
export function getRequestMetadata(request: Request): {
  ipAddress: string | null
  userAgent: string | null
} {
  return {
    ipAddress:
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      null,
    userAgent: request.headers.get('user-agent') || null,
  }
}
