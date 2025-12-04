import type { Filter } from './types'

/**
 * Apply an array of filters to a Supabase query builder
 * @param query - The Supabase query builder
 * @param filters - Array of filter conditions
 * @returns The modified query builder
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyFilters(query: any, filters: Filter[]): any {
  let result = query

  for (const filter of filters) {
    result = applyFilter(result, filter)
  }

  return result
}

/**
 * Apply a single filter to a Supabase query builder
 * @param query - The Supabase query builder
 * @param filter - Single filter condition
 * @returns The modified query builder
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function applyFilter(query: any, filter: Filter): any {
  const { field, operator, value } = filter

  switch (operator) {
    case 'eq':
      return query.eq(field, value)

    case 'neq':
      return query.neq(field, value)

    case 'gt':
      return query.gt(field, value)

    case 'gte':
      return query.gte(field, value)

    case 'lt':
      return query.lt(field, value)

    case 'lte':
      return query.lte(field, value)

    case 'contains':
      // Case-insensitive contains using ilike
      return query.ilike(field, `%${value}%`)

    case 'startswith':
      // Case-insensitive starts with using ilike
      return query.ilike(field, `${value}%`)

    case 'endswith':
      // Case-insensitive ends with using ilike
      return query.ilike(field, `%${value}`)

    case 'in':
      // Value should be an array
      if (!Array.isArray(value)) {
        console.warn(`Filter operator 'in' expects an array value, got: ${typeof value}`)
        return query
      }
      return query.in(field, value)

    case 'nin':
      // Not in array - uses PostgreSQL's NOT IN
      if (!Array.isArray(value)) {
        console.warn(`Filter operator 'nin' expects an array value, got: ${typeof value}`)
        return query
      }
      // Use .not().in() for "not in" functionality
      return query.not(field, 'in', `(${value.map((v: unknown) => typeof v === 'string' ? `"${v}"` : v).join(',')})`)

    case 'null':
      // Check if field is null
      return query.is(field, null)

    case 'nnull':
      // Check if field is not null
      return query.not(field, 'is', null)

    case 'between':
      // Value should be a tuple [min, max]
      if (!Array.isArray(value) || value.length !== 2) {
        console.warn(`Filter operator 'between' expects an array with 2 values [min, max], got: ${value}`)
        return query
      }
      const [min, max] = value
      return query.gte(field, min).lte(field, max)

    default:
      console.warn(`Unknown filter operator: ${operator}`)
      return query
  }
}

/**
 * Build a filter from common search patterns
 * @param searchTerm - The search term
 * @param fields - Array of fields to search in
 * @returns SQL-like OR condition string for Supabase
 */
export function buildSearchFilter(searchTerm: string, fields: string[]): string {
  if (!searchTerm || !fields.length) return ''

  const escapedTerm = searchTerm.replace(/[%_]/g, '\\$&')
  const conditions = fields.map(field => `${field}.ilike.%${escapedTerm}%`)

  return conditions.join(',')
}

/**
 * Parse URL search params into filter array
 * @param searchParams - URLSearchParams object
 * @param allowedFields - Optional whitelist of allowed filter fields
 * @returns Array of filters
 */
export function parseFiltersFromSearchParams(
  searchParams: URLSearchParams,
  allowedFields?: string[]
): Filter[] {
  const filters: Filter[] = []

  // Common filter patterns: field=value, field_op=value
  // e.g., status=active, price_gte=100, name_contains=test

  for (const [key, value] of searchParams.entries()) {
    // Skip non-filter params
    if (['page', 'pageSize', 'sort', 'sortOrder', 'select', 'search'].includes(key)) {
      continue
    }

    let field: string
    let operator: Filter['operator'] = 'eq'

    // Check for operator suffix
    const operatorMatch = key.match(/^(.+)_(eq|neq|gt|gte|lt|lte|contains|startswith|endswith|in|nin|null|nnull|between)$/)

    if (operatorMatch) {
      field = operatorMatch[1]
      operator = operatorMatch[2] as Filter['operator']
    } else {
      field = key
    }

    // Check against whitelist if provided
    if (allowedFields && !allowedFields.includes(field)) {
      continue
    }

    // Parse value based on operator
    let parsedValue: unknown = value

    if (operator === 'in' || operator === 'nin' || operator === 'between') {
      // Parse comma-separated values
      parsedValue = value.split(',').map(v => {
        const num = Number(v)
        return isNaN(num) ? v.trim() : num
      })
    } else if (operator === 'null' || operator === 'nnull') {
      // These don't need a value
      parsedValue = null
    } else if (value === 'true') {
      parsedValue = true
    } else if (value === 'false') {
      parsedValue = false
    } else if (!isNaN(Number(value)) && value !== '') {
      parsedValue = Number(value)
    }

    filters.push({ field, operator, value: parsedValue })
  }

  return filters
}

/**
 * Convert filters array to URLSearchParams
 * @param filters - Array of filters
 * @returns URLSearchParams object
 */
export function filtersToSearchParams(filters: Filter[]): URLSearchParams {
  const params = new URLSearchParams()

  for (const filter of filters) {
    const key = filter.operator === 'eq' ? filter.field : `${filter.field}_${filter.operator}`

    if (filter.value === null || filter.value === undefined) {
      params.set(key, '')
    } else if (Array.isArray(filter.value)) {
      params.set(key, filter.value.join(','))
    } else if (typeof filter.value === 'boolean') {
      params.set(key, String(filter.value))
    } else {
      params.set(key, String(filter.value))
    }
  }

  return params
}
