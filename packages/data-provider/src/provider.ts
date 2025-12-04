import { createClient, SupabaseClient, RealtimeChannel } from '@supabase/supabase-js'
import type {
  DataProviderConfig,
  DataProvider,
  QueryParams,
  GetOneParams,
  CreateParams,
  UpdateParams,
  DeleteParams,
  DeleteManyParams,
  UpdateManyParams,
  CustomQueryParams,
  SubscribeParams,
  ListResponse,
} from './types'
import { applyFilters } from './filters'

/**
 * Custom error class for data provider operations
 */
export class DataProviderError extends Error {
  /** Error code from Supabase or custom error code */
  code: string
  /** HTTP status code if applicable */
  status?: number
  /** Additional error details */
  details?: unknown

  constructor(message: string, code: string, status?: number, details?: unknown) {
    super(message)
    this.name = 'DataProviderError'
    this.code = code
    this.status = status
    this.details = details
  }
}

/**
 * Map common Supabase error codes to user-friendly messages
 */
function getErrorMessage(code: string, originalMessage: string): string {
  const errorMessages: Record<string, string> = {
    '23505': 'Kirje juba eksisteerib (duplikaat)',
    '23503': 'Seotud kirje puudub (foreign key)',
    '23502': 'Kohustuslik väli on täitmata',
    '42501': 'Puudub õigus selle toimingu tegemiseks',
    '42P01': 'Tabel ei eksisteeri',
    'PGRST116': 'Kirjet ei leitud',
    'PGRST301': 'Ühendus andmebaasiga ebaõnnestus',
  }

  return errorMessages[code] || originalMessage
}

/**
 * Create a Supabase data provider instance
 *
 * @example
 * ```typescript
 * const provider = createDataProvider({
 *   supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
 *   supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
 *   softDelete: true,
 *   tenantField: 'tenant_id',
 *   auditFields: true,
 * })
 *
 * // Use the provider
 * const { data, total } = await provider.getList({
 *   resource: 'projects',
 *   pagination: { page: 1, pageSize: 25 },
 *   filters: [{ field: 'status', operator: 'eq', value: 'active' }],
 * })
 * ```
 */
export function createDataProvider(config: DataProviderConfig): DataProvider {
  const {
    supabaseUrl,
    supabaseKey,
    defaultPageSize = 25,
    softDelete = false,
    tenantField,
    auditFields = true,
    defaultSortField = 'created_at',
    defaultSortOrder = 'desc',
  } = config

  const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey)

  // Track active subscriptions for cleanup
  const activeChannels = new Map<string, RealtimeChannel>()

  return {
    // ============ GET LIST ============
    async getList<T = Record<string, unknown>>({
      resource,
      pagination,
      sort,
      filters,
      select = '*',
      meta,
    }: QueryParams): Promise<ListResponse<T>> {
      let query = supabase
        .from(resource)
        .select(select, { count: 'exact' })

      // Soft delete filter - exclude deleted records
      if (softDelete) {
        query = query.is('deleted_at', null)
      }

      // Multi-tenant filter
      if (tenantField && meta?.tenantId) {
        query = query.eq(tenantField, meta.tenantId)
      }

      // Apply custom filters
      if (filters && filters.length > 0) {
        query = applyFilters(query, filters)
      }

      // Apply sorting
      if (sort && sort.length > 0) {
        for (const { field, order } of sort) {
          query = query.order(field, { ascending: order === 'asc' })
        }
      } else {
        // Default sort
        query = query.order(defaultSortField, { ascending: defaultSortOrder === 'asc' })
      }

      // Apply pagination
      const page = pagination?.page ?? 1
      const pageSize = pagination?.pageSize ?? defaultPageSize
      const from = (page - 1) * pageSize
      const to = from + pageSize - 1
      query = query.range(from, to)

      const { data, error, count } = await query

      if (error) {
        throw new DataProviderError(
          getErrorMessage(error.code, error.message),
          error.code,
          undefined,
          error
        )
      }

      return {
        data: (data || []) as T[],
        total: count ?? 0,
      }
    },

    // ============ GET ONE ============
    async getOne<T = Record<string, unknown>>({
      resource,
      id,
      select = '*',
      meta,
    }: GetOneParams): Promise<T> {
      let query = supabase
        .from(resource)
        .select(select)
        .eq('id', id)

      // Multi-tenant filter
      if (tenantField && meta?.tenantId) {
        query = query.eq(tenantField, meta.tenantId)
      }

      // Soft delete - ensure we don't fetch deleted records
      if (softDelete) {
        query = query.is('deleted_at', null)
      }

      const { data, error } = await query.single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new DataProviderError(
            'Kirjet ei leitud',
            'NOT_FOUND',
            404,
            error
          )
        }
        throw new DataProviderError(
          getErrorMessage(error.code, error.message),
          error.code,
          undefined,
          error
        )
      }

      return data as T
    },

    // ============ CREATE ============
    async create<T = Record<string, unknown>>({
      resource,
      data: inputData,
      select = '*',
      meta,
    }: CreateParams<T>): Promise<T> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: Record<string, any> = { ...inputData }

      // Auto-add tenant_id
      if (tenantField && meta?.tenantId) {
        payload[tenantField] = meta.tenantId
      }

      // Auto-add audit fields
      if (auditFields) {
        const now = new Date().toISOString()
        if (!payload.created_at) {
          payload.created_at = now
        }
        if (!payload.updated_at) {
          payload.updated_at = now
        }
      }

      // Add created_by if provided
      if (meta?.userId && !payload.created_by) {
        payload.created_by = meta.userId
      }

      const { data, error } = await supabase
        .from(resource)
        .insert(payload)
        .select(select)
        .single()

      if (error) {
        if (error.code === '23505') {
          throw new DataProviderError(
            'Kirje juba eksisteerib',
            'DUPLICATE',
            409,
            error
          )
        }
        throw new DataProviderError(
          getErrorMessage(error.code, error.message),
          error.code,
          undefined,
          error
        )
      }

      return data as T
    },

    // ============ UPDATE ============
    async update<T = Record<string, unknown>>({
      resource,
      id,
      data: inputData,
      select = '*',
      meta,
    }: UpdateParams<T>): Promise<T> {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: Record<string, any> = { ...inputData }

      // Auto-update updated_at
      if (auditFields) {
        payload.updated_at = new Date().toISOString()
      }

      // Add updated_by if provided
      if (meta?.userId) {
        payload.updated_by = meta.userId
      }

      let query = supabase
        .from(resource)
        .update(payload)
        .eq('id', id)

      // Multi-tenant filter for security
      if (tenantField && meta?.tenantId) {
        query = query.eq(tenantField, meta.tenantId)
      }

      const { data, error } = await query.select(select).single()

      if (error) {
        if (error.code === 'PGRST116') {
          throw new DataProviderError(
            'Kirjet ei leitud',
            'NOT_FOUND',
            404,
            error
          )
        }
        throw new DataProviderError(
          getErrorMessage(error.code, error.message),
          error.code,
          undefined,
          error
        )
      }

      return data as T
    },

    // ============ DELETE ============
    async delete({
      resource,
      id,
      meta,
    }: DeleteParams): Promise<void> {
      if (softDelete) {
        // Soft delete - update deleted_at timestamp
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: Record<string, any> = {
          deleted_at: new Date().toISOString(),
        }

        if (meta?.userId) {
          payload.deleted_by = meta.userId
        }

        let query = supabase
          .from(resource)
          .update(payload)
          .eq('id', id)

        // Multi-tenant filter
        if (tenantField && meta?.tenantId) {
          query = query.eq(tenantField, meta.tenantId)
        }

        const { error } = await query

        if (error) {
          throw new DataProviderError(
            getErrorMessage(error.code, error.message),
            error.code,
            undefined,
            error
          )
        }
      } else {
        // Hard delete
        let query = supabase
          .from(resource)
          .delete()
          .eq('id', id)

        // Multi-tenant filter
        if (tenantField && meta?.tenantId) {
          query = query.eq(tenantField, meta.tenantId)
        }

        const { error } = await query

        if (error) {
          throw new DataProviderError(
            getErrorMessage(error.code, error.message),
            error.code,
            undefined,
            error
          )
        }
      }
    },

    // ============ DELETE MANY ============
    async deleteMany({
      resource,
      ids,
      meta,
    }: DeleteManyParams): Promise<void> {
      if (ids.length === 0) return

      if (softDelete) {
        // Soft delete multiple records
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const payload: Record<string, any> = {
          deleted_at: new Date().toISOString(),
        }

        if (meta?.userId) {
          payload.deleted_by = meta.userId
        }

        let query = supabase
          .from(resource)
          .update(payload)
          .in('id', ids)

        // Multi-tenant filter
        if (tenantField && meta?.tenantId) {
          query = query.eq(tenantField, meta.tenantId)
        }

        const { error } = await query

        if (error) {
          throw new DataProviderError(
            getErrorMessage(error.code, error.message),
            error.code,
            undefined,
            error
          )
        }
      } else {
        // Hard delete multiple records
        let query = supabase
          .from(resource)
          .delete()
          .in('id', ids)

        // Multi-tenant filter
        if (tenantField && meta?.tenantId) {
          query = query.eq(tenantField, meta.tenantId)
        }

        const { error } = await query

        if (error) {
          throw new DataProviderError(
            getErrorMessage(error.code, error.message),
            error.code,
            undefined,
            error
          )
        }
      }
    },

    // ============ UPDATE MANY ============
    async updateMany<T = Record<string, unknown>>({
      resource,
      ids,
      data: inputData,
      meta,
    }: UpdateManyParams<T>): Promise<void> {
      if (ids.length === 0) return

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const payload: Record<string, any> = { ...inputData }

      // Auto-update updated_at
      if (auditFields) {
        payload.updated_at = new Date().toISOString()
      }

      // Add updated_by if provided
      if (meta?.userId) {
        payload.updated_by = meta.userId
      }

      let query = supabase
        .from(resource)
        .update(payload)
        .in('id', ids)

      // Multi-tenant filter
      if (tenantField && meta?.tenantId) {
        query = query.eq(tenantField, meta.tenantId)
      }

      const { error } = await query

      if (error) {
        throw new DataProviderError(
          getErrorMessage(error.code, error.message),
          error.code,
          undefined,
          error
        )
      }
    },

    // ============ CUSTOM QUERY ============
    async custom<T = unknown>({
      resource,
      query,
    }: CustomQueryParams<T>): Promise<T> {
      const baseQuery = supabase.from(resource)
      const result = await query(baseQuery)

      if (result.error) {
        throw new DataProviderError(
          getErrorMessage((result.error as { code?: string })?.code || 'UNKNOWN', String(result.error)),
          (result.error as { code?: string })?.code || 'UNKNOWN',
          undefined,
          result.error
        )
      }

      return result.data as T
    },

    // ============ SUBSCRIBE (Real-time) ============
    subscribe({
      resource,
      callback,
      filter,
      events = ['INSERT', 'UPDATE', 'DELETE'],
    }: SubscribeParams): () => void {
      const channelName = `${resource}_${filter || 'all'}_${Date.now()}`

      // Clean up existing channel with same name if exists
      const existingChannel = activeChannels.get(channelName)
      if (existingChannel) {
        supabase.removeChannel(existingChannel)
        activeChannels.delete(channelName)
      }

      // Build the channel configuration
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const channelConfig: any = {
        event: '*',
        schema: 'public',
        table: resource,
      }

      // Add filter if provided (e.g., 'tenant_id=eq.123')
      if (filter) {
        channelConfig.filter = filter
      }

      const channel = supabase
        .channel(channelName)
        .on(
          'postgres_changes',
          channelConfig,
          (payload) => {
            // Only call callback for subscribed event types
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const eventType = payload.eventType as any
            if (events.includes(eventType)) {
              callback({
                eventType,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                new: payload.new as any,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                old: payload.old as any,
                commit_timestamp: payload.commit_timestamp,
              })
            }
          }
        )
        .subscribe()

      activeChannels.set(channelName, channel)

      // Return unsubscribe function
      return () => {
        supabase.removeChannel(channel)
        activeChannels.delete(channelName)
      }
    },

    // ============ GET CLIENT ============
    getClient(): SupabaseClient {
      return supabase
    },
  }
}

/**
 * Type guard to check if an error is a DataProviderError
 */
export function isDataProviderError(error: unknown): error is DataProviderError {
  return error instanceof DataProviderError
}
