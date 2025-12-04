import type { SupabaseClient } from '@supabase/supabase-js'

// ============ CONFIGURATION ============

export interface DataProviderConfig {
  /** Supabase project URL */
  supabaseUrl: string
  /** Supabase anonymous key */
  supabaseKey: string
  /** Default page size for list queries (default: 25) */
  defaultPageSize?: number
  /** Use soft delete with deleted_at column instead of hard delete */
  softDelete?: boolean
  /** Field name for multi-tenant filtering (e.g., 'tenant_id') */
  tenantField?: string
  /** Automatically manage created_at/updated_at fields */
  auditFields?: boolean
  /** Default sort field when none specified */
  defaultSortField?: string
  /** Default sort order when none specified */
  defaultSortOrder?: 'asc' | 'desc'
}

// ============ QUERY PARAMETERS ============

export interface QueryParams {
  /** Database table/resource name */
  resource: string
  /** Pagination settings */
  pagination?: PaginationParams
  /** Sorting configuration */
  sort?: SortParams[]
  /** Filter conditions */
  filters?: Filter[]
  /** Supabase select string (e.g., '*, client:clients(id, name)') */
  select?: string
  /** Additional metadata (e.g., tenantId for multi-tenant) */
  meta?: Record<string, unknown>
}

export interface PaginationParams {
  /** Current page number (1-indexed) */
  page: number
  /** Number of items per page */
  pageSize: number
}

export interface SortParams {
  /** Field to sort by */
  field: string
  /** Sort direction */
  order: 'asc' | 'desc'
}

// ============ FILTERS ============

export interface Filter {
  /** Field name to filter on */
  field: string
  /** Filter operator */
  operator: FilterOperator
  /** Filter value */
  value: unknown
}

export type FilterOperator =
  | 'eq'         // Equal
  | 'neq'        // Not equal
  | 'gt'         // Greater than
  | 'gte'        // Greater than or equal
  | 'lt'         // Less than
  | 'lte'        // Less than or equal
  | 'contains'   // Contains substring (case-insensitive)
  | 'startswith' // Starts with (case-insensitive)
  | 'endswith'   // Ends with (case-insensitive)
  | 'in'         // In array
  | 'nin'        // Not in array
  | 'null'       // Is null
  | 'nnull'      // Is not null
  | 'between'    // Between two values [min, max]

// ============ RESPONSE TYPES ============

export interface ListResponse<T> {
  /** Array of records */
  data: T[]
  /** Total count of records (for pagination) */
  total: number
}

export interface GetOneParams {
  /** Database table/resource name */
  resource: string
  /** Record ID */
  id: string
  /** Supabase select string */
  select?: string
  /** Additional metadata */
  meta?: Record<string, unknown>
}

export interface CreateParams<T = Record<string, unknown>> {
  /** Database table/resource name */
  resource: string
  /** Data to create */
  data: Partial<T>
  /** Supabase select string for returned data */
  select?: string
  /** Additional metadata */
  meta?: Record<string, unknown>
}

export interface UpdateParams<T = Record<string, unknown>> {
  /** Database table/resource name */
  resource: string
  /** Record ID */
  id: string
  /** Data to update */
  data: Partial<T>
  /** Supabase select string for returned data */
  select?: string
  /** Additional metadata */
  meta?: Record<string, unknown>
}

export interface DeleteParams {
  /** Database table/resource name */
  resource: string
  /** Record ID */
  id: string
  /** Additional metadata */
  meta?: Record<string, unknown>
}

export interface DeleteManyParams {
  /** Database table/resource name */
  resource: string
  /** Array of record IDs */
  ids: string[]
  /** Additional metadata */
  meta?: Record<string, unknown>
}

export interface UpdateManyParams<T = Record<string, unknown>> {
  /** Database table/resource name */
  resource: string
  /** Array of record IDs */
  ids: string[]
  /** Data to update */
  data: Partial<T>
  /** Additional metadata */
  meta?: Record<string, unknown>
}

export interface CustomQueryParams<T = unknown> {
  /** Database table/resource name */
  resource: string
  /** Custom query builder function */
  query: (queryBuilder: unknown) => Promise<{ data: T | null; error: unknown }>
}

export interface SubscribeParams {
  /** Database table/resource name */
  resource: string
  /** Callback function for changes */
  callback: (payload: RealtimePayload) => void
  /** Optional filter for subscription */
  filter?: string
  /** Event types to listen to */
  events?: ('INSERT' | 'UPDATE' | 'DELETE')[]
}

export interface RealtimePayload<T = Record<string, unknown>> {
  /** Type of event */
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  /** New record data (for INSERT/UPDATE) */
  new: T
  /** Old record data (for UPDATE/DELETE) */
  old: T
  /** Commit timestamp */
  commit_timestamp: string
}

// ============ DATA PROVIDER INTERFACE ============

export interface DataProvider {
  /** Get a list of records with pagination, sorting, and filtering */
  getList: <T = Record<string, unknown>>(params: QueryParams) => Promise<ListResponse<T>>

  /** Get a single record by ID */
  getOne: <T = Record<string, unknown>>(params: GetOneParams) => Promise<T>

  /** Create a new record */
  create: <T = Record<string, unknown>>(params: CreateParams<T>) => Promise<T>

  /** Update an existing record */
  update: <T = Record<string, unknown>>(params: UpdateParams<T>) => Promise<T>

  /** Delete a record */
  delete: (params: DeleteParams) => Promise<void>

  /** Delete multiple records */
  deleteMany: (params: DeleteManyParams) => Promise<void>

  /** Update multiple records */
  updateMany: <T = Record<string, unknown>>(params: UpdateManyParams<T>) => Promise<void>

  /** Execute a custom query */
  custom: <T = unknown>(params: CustomQueryParams<T>) => Promise<T>

  /** Subscribe to real-time changes */
  subscribe: (params: SubscribeParams) => () => void

  /** Get the underlying Supabase client */
  getClient: () => SupabaseClient
}

// ============ ERROR TYPES ============

export interface DataProviderErrorDetails {
  /** Error message */
  message: string
  /** Error code from Supabase */
  code: string
  /** HTTP status code if applicable */
  status?: number
  /** Additional error details */
  details?: unknown
}
