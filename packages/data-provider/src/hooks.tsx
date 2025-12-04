'use client'

import { createContext, useContext, useEffect, type ReactNode } from 'react'
import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query'
import type {
  DataProvider,
  QueryParams,
  Filter,
  SortParams,
  PaginationParams,
  ListResponse,
  RealtimePayload,
} from './types'

// ============ CONTEXT ============

const DataProviderContext = createContext<DataProvider | null>(null)

interface DataProviderProviderProps {
  provider: DataProvider
  children: ReactNode
}

/**
 * Provider component to make the data provider available throughout the app
 *
 * @example
 * ```tsx
 * import { DataProviderProvider, createDataProvider } from '@eos2/data-provider'
 *
 * const provider = createDataProvider({
 *   supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
 *   supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
 * })
 *
 * function App() {
 *   return (
 *     <DataProviderProvider provider={provider}>
 *       <YourApp />
 *     </DataProviderProvider>
 *   )
 * }
 * ```
 */
export function DataProviderProvider({ provider, children }: DataProviderProviderProps) {
  return (
    <DataProviderContext.Provider value={provider}>
      {children}
    </DataProviderContext.Provider>
  )
}

/**
 * Hook to access the data provider instance
 * @throws Error if used outside of DataProviderProvider
 */
export function useDataProvider(): DataProvider {
  const provider = useContext(DataProviderContext)
  if (!provider) {
    throw new Error('useDataProvider must be used within DataProviderProvider')
  }
  return provider
}

// ============ QUERY KEY BUILDERS ============

/**
 * Build a query key for list queries
 */
export function getListQueryKey(
  resource: string,
  params?: Omit<QueryParams, 'resource'>
): readonly [string, 'list', typeof params] {
  return [resource, 'list', params] as const
}

/**
 * Build a query key for single record queries
 */
export function getOneQueryKey(
  resource: string,
  id: string
): readonly [string, 'one', string] {
  return [resource, 'one', id] as const
}

// ============ USE LIST ============

interface UseListParams {
  /** Pagination settings */
  pagination?: PaginationParams
  /** Sort configuration */
  sort?: SortParams[]
  /** Filter conditions */
  filters?: Filter[]
  /** Supabase select string */
  supabaseSelect?: string
  /** Additional metadata (e.g., tenantId) */
  meta?: Record<string, unknown>
}

interface UseListOptions<T> extends Omit<UseQueryOptions<ListResponse<T>, Error>, 'queryKey' | 'queryFn'> {}

/**
 * Hook to fetch a list of records with pagination, sorting, and filtering
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useList<Project>('projects', {
 *   pagination: { page: 1, pageSize: 25 },
 *   filters: [{ field: 'status', operator: 'eq', value: 'active' }],
 *   sort: [{ field: 'created_at', order: 'desc' }],
 * })
 *
 * // Access the data
 * data?.data // Array of projects
 * data?.total // Total count for pagination
 * ```
 */
export function useList<T = Record<string, unknown>>(
  resource: string,
  params?: UseListParams,
  options?: UseListOptions<T>
) {
  const provider = useDataProvider()

  const {
    pagination,
    sort,
    filters,
    supabaseSelect,
    meta,
  } = params || {}

  const queryParams = { pagination, sort, filters, select: supabaseSelect, meta }

  return useQuery<ListResponse<T>, Error>({
    queryKey: getListQueryKey(resource, queryParams),
    queryFn: () => provider.getList<T>({ resource, ...queryParams }),
    ...options,
  })
}

// ============ USE ONE ============

interface UseOneParams {
  /** Supabase select string */
  supabaseSelect?: string
  /** Additional metadata */
  meta?: Record<string, unknown>
}

interface UseOneOptions<T> extends Omit<UseQueryOptions<T, Error>, 'queryKey' | 'queryFn'> {}

/**
 * Hook to fetch a single record by ID
 *
 * @example
 * ```tsx
 * const { data: project, isLoading } = useOne<Project>('projects', projectId, {
 *   supabaseSelect: '*, client:clients(id, name)',
 * })
 * ```
 */
export function useOne<T = Record<string, unknown>>(
  resource: string,
  id: string,
  params?: UseOneParams,
  options?: UseOneOptions<T>
) {
  const provider = useDataProvider()

  const { supabaseSelect, meta } = params || {}

  return useQuery<T, Error>({
    queryKey: getOneQueryKey(resource, id),
    queryFn: () => provider.getOne<T>({ resource, id, select: supabaseSelect, meta }),
    enabled: !!id && (options?.enabled ?? true),
    ...options,
  })
}

// ============ USE CREATE ============

interface UseCreateParams {
  /** Supabase select string for returned data */
  supabaseSelect?: string
  /** Additional metadata */
  meta?: Record<string, unknown>
  /** Invalidate list queries after successful mutation */
  invalidateList?: boolean
}

interface UseCreateOptions<T, TInput> extends Omit<UseMutationOptions<T, Error, TInput>, 'mutationFn'> {}

/**
 * Hook to create a new record
 *
 * @example
 * ```tsx
 * const { mutate: createProject, isPending } = useCreate<Project>('projects')
 *
 * // Create a project
 * createProject({ name: 'New Project', code: 'NP001' })
 * ```
 */
export function useCreate<T = Record<string, unknown>, TInput = Partial<T>>(
  resource: string,
  params?: UseCreateParams,
  options?: UseCreateOptions<T, TInput>
) {
  const provider = useDataProvider()
  const queryClient = useQueryClient()

  const { supabaseSelect, meta, invalidateList = true } = params || {}

  return useMutation<T, Error, TInput>({
    mutationFn: (data: TInput) =>
      provider.create<T>({ resource, data: data as Partial<T>, select: supabaseSelect, meta }),
    onSuccess: (data, variables, context) => {
      if (invalidateList) {
        queryClient.invalidateQueries({ queryKey: [resource] })
      }
    },
    ...options,
  })
}

// ============ USE UPDATE ============

interface UseUpdateParams {
  /** Supabase select string for returned data */
  supabaseSelect?: string
  /** Additional metadata */
  meta?: Record<string, unknown>
  /** Invalidate list queries after successful mutation */
  invalidateList?: boolean
}

interface UseUpdateInput<TInput> {
  id: string
  data: TInput
}

interface UseUpdateOptions<T, TInput> extends Omit<UseMutationOptions<T, Error, UseUpdateInput<TInput>>, 'mutationFn'> {}

/**
 * Hook to update an existing record
 *
 * @example
 * ```tsx
 * const { mutate: updateProject, isPending } = useUpdate<Project>('projects')
 *
 * // Update a project
 * updateProject({ id: projectId, data: { name: 'Updated Name' } })
 * ```
 */
export function useUpdate<T = Record<string, unknown>, TInput = Partial<T>>(
  resource: string,
  params?: UseUpdateParams,
  options?: UseUpdateOptions<T, TInput>
) {
  const provider = useDataProvider()
  const queryClient = useQueryClient()

  const { supabaseSelect, meta, invalidateList = true } = params || {}

  return useMutation<T, Error, UseUpdateInput<TInput>>({
    mutationFn: ({ id, data }: UseUpdateInput<TInput>) =>
      provider.update<T>({ resource, id, data: data as Partial<T>, select: supabaseSelect, meta }),
    onSuccess: (data, variables) => {
      if (invalidateList) {
        queryClient.invalidateQueries({ queryKey: [resource] })
      }
      // Also invalidate the specific record
      queryClient.invalidateQueries({ queryKey: getOneQueryKey(resource, variables.id) })
    },
    ...options,
  })
}

// ============ USE DELETE ============

interface UseDeleteParams {
  /** Additional metadata */
  meta?: Record<string, unknown>
  /** Invalidate list queries after successful mutation */
  invalidateList?: boolean
}

interface UseDeleteOptions extends Omit<UseMutationOptions<void, Error, string>, 'mutationFn'> {}

/**
 * Hook to delete a single record
 *
 * @example
 * ```tsx
 * const { mutate: deleteProject, isPending } = useDelete('projects')
 *
 * // Delete a project
 * deleteProject(projectId)
 * ```
 */
export function useDelete(
  resource: string,
  params?: UseDeleteParams,
  options?: UseDeleteOptions
) {
  const provider = useDataProvider()
  const queryClient = useQueryClient()

  const { meta, invalidateList = true } = params || {}

  return useMutation<void, Error, string>({
    mutationFn: (id: string) => provider.delete({ resource, id, meta }),
    onSuccess: (_data, id) => {
      if (invalidateList) {
        queryClient.invalidateQueries({ queryKey: [resource] })
      }
      // Remove the specific record from cache
      queryClient.removeQueries({ queryKey: getOneQueryKey(resource, id) })
    },
    ...options,
  })
}

// ============ USE DELETE MANY ============

interface UseDeleteManyParams {
  /** Additional metadata */
  meta?: Record<string, unknown>
  /** Invalidate list queries after successful mutation */
  invalidateList?: boolean
}

interface UseDeleteManyOptions extends Omit<UseMutationOptions<void, Error, string[]>, 'mutationFn'> {}

/**
 * Hook to delete multiple records
 *
 * @example
 * ```tsx
 * const { mutate: deleteProjects, isPending } = useDeleteMany('projects')
 *
 * // Delete multiple projects
 * deleteProjects(['id1', 'id2', 'id3'])
 * ```
 */
export function useDeleteMany(
  resource: string,
  params?: UseDeleteManyParams,
  options?: UseDeleteManyOptions
) {
  const provider = useDataProvider()
  const queryClient = useQueryClient()

  const { meta, invalidateList = true } = params || {}

  return useMutation<void, Error, string[]>({
    mutationFn: (ids: string[]) => provider.deleteMany({ resource, ids, meta }),
    onSuccess: (_data, ids) => {
      if (invalidateList) {
        queryClient.invalidateQueries({ queryKey: [resource] })
      }
      // Remove specific records from cache
      for (const id of ids) {
        queryClient.removeQueries({ queryKey: getOneQueryKey(resource, id) })
      }
    },
    ...options,
  })
}

// ============ USE UPDATE MANY ============

interface UseUpdateManyParams {
  /** Additional metadata */
  meta?: Record<string, unknown>
  /** Invalidate list queries after successful mutation */
  invalidateList?: boolean
}

interface UseUpdateManyInput<TInput> {
  ids: string[]
  data: TInput
}

interface UseUpdateManyOptions<TInput> extends Omit<UseMutationOptions<void, Error, UseUpdateManyInput<TInput>>, 'mutationFn'> {}

/**
 * Hook to update multiple records with the same data
 *
 * @example
 * ```tsx
 * const { mutate: updateProjects, isPending } = useUpdateMany<{ status: string }>('projects')
 *
 * // Mark multiple projects as completed
 * updateProjects({ ids: ['id1', 'id2'], data: { status: 'completed' } })
 * ```
 */
export function useUpdateMany<TInput = Record<string, unknown>>(
  resource: string,
  params?: UseUpdateManyParams,
  options?: UseUpdateManyOptions<TInput>
) {
  const provider = useDataProvider()
  const queryClient = useQueryClient()

  const { meta, invalidateList = true } = params || {}

  return useMutation<void, Error, UseUpdateManyInput<TInput>>({
    mutationFn: ({ ids, data }: UseUpdateManyInput<TInput>) =>
      provider.updateMany({ resource, ids, data: data as Record<string, unknown>, meta }),
    onSuccess: (_data, variables) => {
      if (invalidateList) {
        queryClient.invalidateQueries({ queryKey: [resource] })
      }
      // Invalidate specific records
      for (const id of variables.ids) {
        queryClient.invalidateQueries({ queryKey: getOneQueryKey(resource, id) })
      }
    },
    ...options,
  })
}

// ============ USE REALTIME ============

interface UseRealtimeOptions {
  /** Filter for subscription (e.g., 'tenant_id=eq.123') */
  filter?: string
  /** Event types to listen to */
  events?: ('INSERT' | 'UPDATE' | 'DELETE')[]
  /** Whether to auto-invalidate queries on changes */
  autoInvalidate?: boolean
}

/**
 * Hook to subscribe to real-time changes for a resource
 *
 * @example
 * ```tsx
 * useRealtime<Project>('projects', (payload) => {
 *   console.log('Project changed:', payload.eventType, payload.new)
 * }, { autoInvalidate: true })
 * ```
 */
export function useRealtime<T = Record<string, unknown>>(
  resource: string,
  callback: (payload: RealtimePayload<T>) => void,
  options?: UseRealtimeOptions
) {
  const provider = useDataProvider()
  const queryClient = useQueryClient()

  const { filter, events, autoInvalidate = false } = options || {}

  useEffect(() => {
    const unsubscribe = provider.subscribe({
      resource,
      filter,
      events,
      callback: (payload) => {
        // Call user callback
        callback(payload as RealtimePayload<T>)

        // Auto-invalidate queries if enabled
        if (autoInvalidate) {
          queryClient.invalidateQueries({ queryKey: [resource] })

          // If we have the record ID, invalidate the specific query too
          const recordId = (payload.new as Record<string, unknown>)?.id ||
                          (payload.old as Record<string, unknown>)?.id
          if (recordId) {
            queryClient.invalidateQueries({
              queryKey: getOneQueryKey(resource, recordId as string)
            })
          }
        }
      },
    })

    return unsubscribe
  }, [resource, filter, events?.join(','), autoInvalidate, callback, provider, queryClient])
}

// ============ USE RESOURCE (Combined Hook) ============

interface UseResourceParams {
  /** Pagination settings */
  pagination?: PaginationParams
  /** Sort configuration */
  sort?: SortParams[]
  /** Filter conditions */
  filters?: Filter[]
  /** Supabase select string */
  supabaseSelect?: string
  /** Additional metadata */
  meta?: Record<string, unknown>
  /** Disable the list query */
  enabled?: boolean
}

/**
 * Combined hook that provides all CRUD operations for a resource (Refine-style)
 *
 * @example
 * ```tsx
 * const {
 *   data,
 *   total,
 *   isLoading,
 *   create,
 *   update,
 *   delete: remove,
 *   isCreating,
 *   isUpdating,
 *   isDeleting,
 * } = useResource<Project>('projects', {
 *   pagination: { page: 1, pageSize: 25 },
 *   filters: [{ field: 'status', operator: 'eq', value: 'active' }],
 * })
 *
 * // Create
 * create({ name: 'New Project' })
 *
 * // Update
 * update({ id: '123', data: { name: 'Updated' } })
 *
 * // Delete
 * remove('123')
 * ```
 */
export function useResource<T = Record<string, unknown>>(
  resource: string,
  params?: UseResourceParams
) {
  const { pagination, sort, filters, supabaseSelect, meta, enabled = true } = params || {}

  // List query
  const list = useList<T>(resource, {
    pagination,
    sort,
    filters,
    supabaseSelect,
    meta,
  }, {
    enabled,
  })

  // Mutations
  const createMutation = useCreate<T>(resource, { meta })
  const updateMutation = useUpdate<T>(resource, { meta })
  const deleteMutation = useDelete(resource, { meta })
  const deleteManyMutation = useDeleteMany(resource, { meta })
  const updateManyMutation = useUpdateMany(resource, { meta })

  return {
    // List data
    data: list.data?.data ?? [],
    total: list.data?.total ?? 0,
    isLoading: list.isLoading,
    isFetching: list.isFetching,
    error: list.error,
    refetch: list.refetch,

    // Create
    create: createMutation.mutate,
    createAsync: createMutation.mutateAsync,
    isCreating: createMutation.isPending,
    createError: createMutation.error,

    // Update
    update: updateMutation.mutate,
    updateAsync: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    updateError: updateMutation.error,

    // Delete
    delete: deleteMutation.mutate,
    deleteAsync: deleteMutation.mutateAsync,
    isDeleting: deleteMutation.isPending,
    deleteError: deleteMutation.error,

    // Delete Many
    deleteMany: deleteManyMutation.mutate,
    deleteManyAsync: deleteManyMutation.mutateAsync,
    isDeletingMany: deleteManyMutation.isPending,

    // Update Many
    updateMany: updateManyMutation.mutate,
    updateManyAsync: updateManyMutation.mutateAsync,
    isUpdatingMany: updateManyMutation.isPending,
  }
}

// ============ UTILITY HOOKS ============

/**
 * Hook to invalidate queries for a resource
 *
 * @example
 * ```tsx
 * const invalidate = useInvalidate()
 *
 * // Invalidate all project queries
 * invalidate('projects')
 *
 * // Invalidate a specific project
 * invalidate('projects', projectId)
 * ```
 */
export function useInvalidate() {
  const queryClient = useQueryClient()

  return (resource: string, id?: string) => {
    if (id) {
      queryClient.invalidateQueries({ queryKey: getOneQueryKey(resource, id) })
    } else {
      queryClient.invalidateQueries({ queryKey: [resource] })
    }
  }
}

/**
 * Hook to prefetch data for a resource
 *
 * @example
 * ```tsx
 * const prefetch = usePrefetch()
 *
 * // Prefetch projects on hover
 * <button onMouseEnter={() => prefetch('projects')}>
 *   View Projects
 * </button>
 * ```
 */
export function usePrefetch() {
  const queryClient = useQueryClient()
  const provider = useDataProvider()

  return <T = Record<string, unknown>>(
    resource: string,
    params?: Omit<QueryParams, 'resource'>
  ) => {
    queryClient.prefetchQuery({
      queryKey: getListQueryKey(resource, params),
      queryFn: () => provider.getList<T>({ resource, ...params }),
    })
  }
}

/**
 * Hook to get optimistic update helpers
 */
export function useOptimisticUpdate<T extends { id: string }>(resource: string) {
  const queryClient = useQueryClient()

  return {
    /**
     * Optimistically add an item to the list
     */
    addToList: (item: T, queryParams?: Omit<QueryParams, 'resource'>) => {
      const queryKey = getListQueryKey(resource, queryParams)
      queryClient.setQueryData<ListResponse<T>>(queryKey, (old) => {
        if (!old) return { data: [item], total: 1 }
        return {
          data: [item, ...old.data],
          total: old.total + 1,
        }
      })
    },

    /**
     * Optimistically update an item in the list
     */
    updateInList: (id: string, updates: Partial<T>, queryParams?: Omit<QueryParams, 'resource'>) => {
      const queryKey = getListQueryKey(resource, queryParams)
      queryClient.setQueryData<ListResponse<T>>(queryKey, (old) => {
        if (!old) return old
        return {
          ...old,
          data: old.data.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }
      })
    },

    /**
     * Optimistically remove an item from the list
     */
    removeFromList: (id: string, queryParams?: Omit<QueryParams, 'resource'>) => {
      const queryKey = getListQueryKey(resource, queryParams)
      queryClient.setQueryData<ListResponse<T>>(queryKey, (old) => {
        if (!old) return old
        return {
          data: old.data.filter((item) => item.id !== id),
          total: old.total - 1,
        }
      })
    },

    /**
     * Get snapshot for rollback
     */
    getSnapshot: (queryParams?: Omit<QueryParams, 'resource'>) => {
      const queryKey = getListQueryKey(resource, queryParams)
      return queryClient.getQueryData<ListResponse<T>>(queryKey)
    },

    /**
     * Restore from snapshot
     */
    restore: (snapshot: ListResponse<T> | undefined, queryParams?: Omit<QueryParams, 'resource'>) => {
      const queryKey = getListQueryKey(resource, queryParams)
      queryClient.setQueryData(queryKey, snapshot)
    },
  }
}
