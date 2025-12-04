import { NextResponse } from 'next/server'

/**
 * Custom API Error class with status code and optional error code
 */
export class APIError extends Error {
  constructor(
    public status: number,
    message: string,
    public code?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

/**
 * Common API errors
 */
export const Errors = {
  Unauthorized: () => new APIError(401, 'Unauthorized', 'UNAUTHORIZED'),
  Forbidden: () => new APIError(403, 'Forbidden', 'FORBIDDEN'),
  NotFound: (resource = 'Resource') => new APIError(404, `${resource} not found`, 'NOT_FOUND'),
  BadRequest: (message = 'Bad request') => new APIError(400, message, 'BAD_REQUEST'),
  Conflict: (message = 'Conflict') => new APIError(409, message, 'CONFLICT'),
  ValidationError: (message: string) => new APIError(422, message, 'VALIDATION_ERROR'),
  InternalError: (message = 'Internal server error') => new APIError(500, message, 'INTERNAL_ERROR'),
}

/**
 * Standard API response format
 */
interface APIResponse<T> {
  data?: T
  error?: string
  code?: string
  meta?: {
    total?: number
    page?: number
    limit?: number
    hasMore?: boolean
    cursor?: string
  }
}

/**
 * Wraps an async handler with error handling
 */
export async function handleAPIRequest<T>(
  handler: () => Promise<T>,
  options?: {
    successStatus?: number
  }
): Promise<NextResponse<APIResponse<T>>> {
  const startTime = performance.now()

  try {
    const result = await handler()
    const duration = performance.now() - startTime

    // Log slow queries (> 1s)
    if (duration > 1000) {
      console.warn(`Slow API request: ${duration.toFixed(0)}ms`)
    }

    return NextResponse.json(
      { data: result },
      { status: options?.successStatus || 200 }
    )
  } catch (error) {
    const duration = performance.now() - startTime

    if (error instanceof APIError) {
      console.error(`API Error [${error.code}]: ${error.message} (${duration.toFixed(0)}ms)`)
      return NextResponse.json(
        { error: error.message, code: error.code },
        { status: error.status }
      )
    }

    // Handle Supabase errors
    if (error && typeof error === 'object' && 'code' in error) {
      const supabaseError = error as { code: string; message: string }

      // Handle specific Supabase error codes
      if (supabaseError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Not found', code: 'NOT_FOUND' },
          { status: 404 }
        )
      }

      if (supabaseError.code === '23505') {
        return NextResponse.json(
          { error: 'Duplicate entry', code: 'DUPLICATE' },
          { status: 409 }
        )
      }

      if (supabaseError.code === '23503') {
        return NextResponse.json(
          { error: 'Referenced record not found', code: 'FOREIGN_KEY' },
          { status: 400 }
        )
      }
    }

    console.error('Unhandled API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

/**
 * Parse and validate pagination parameters
 */
export function parsePaginationParams(searchParams: URLSearchParams) {
  const limit = Math.min(
    Math.max(parseInt(searchParams.get('limit') || '50'), 1),
    100 // Max 100 per page
  )
  const cursor = searchParams.get('cursor') || undefined
  const direction = (searchParams.get('direction') || 'forward') as 'forward' | 'backward'

  return { limit, cursor, direction }
}

/**
 * Create cursor from last item
 */
export function createCursor(item: { created_at: string; id: string }): string {
  return `${item.created_at}|${item.id}`
}

/**
 * Parse cursor into components
 */
export function parseCursor(cursor: string): { timestamp: string; id: string } | null {
  const parts = cursor.split('|')
  if (parts.length !== 2) return null
  return { timestamp: parts[0], id: parts[1] }
}
