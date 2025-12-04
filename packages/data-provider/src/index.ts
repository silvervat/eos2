/**
 * @eos2/data-provider
 *
 * Universal Supabase data provider with React Query hooks for EOS2.
 *
 * Features:
 * - Full CRUD operations (getList, getOne, create, update, delete)
 * - Bulk operations (deleteMany, updateMany)
 * - Pagination, sorting, and filtering
 * - Real-time subscriptions
 * - Multi-tenant support
 * - Soft delete support
 * - Automatic audit fields (created_at, updated_at)
 * - Type-safe React hooks with React Query
 * - Optimistic updates
 *
 * @example
 * ```tsx
 * // Setup
 * import { createDataProvider, DataProviderProvider } from '@eos2/data-provider'
 *
 * const provider = createDataProvider({
 *   supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
 *   supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
 *   tenantField: 'tenant_id',
 *   softDelete: true,
 * })
 *
 * function App() {
 *   return (
 *     <DataProviderProvider provider={provider}>
 *       <YourApp />
 *     </DataProviderProvider>
 *   )
 * }
 *
 * // Usage in components
 * import { useList, useCreate, useResource } from '@eos2/data-provider'
 *
 * function ProjectsList() {
 *   const { data, total, isLoading } = useList<Project>('projects', {
 *     pagination: { page: 1, pageSize: 25 },
 *     filters: [{ field: 'status', operator: 'eq', value: 'active' }],
 *   })
 *
 *   // Or use the combined hook
 *   const projects = useResource<Project>('projects')
 *
 *   return (
 *     <div>
 *       {projects.data.map(project => <ProjectCard key={project.id} {...project} />)}
 *     </div>
 *   )
 * }
 * ```
 *
 * @packageDocumentation
 */

// Provider
export { createDataProvider, DataProviderError, isDataProviderError } from './provider'

// Hooks
export {
  // Context
  DataProviderProvider,
  useDataProvider,
  // Query key builders
  getListQueryKey,
  getOneQueryKey,
  // List & One
  useList,
  useOne,
  // Mutations
  useCreate,
  useUpdate,
  useDelete,
  useDeleteMany,
  useUpdateMany,
  // Real-time
  useRealtime,
  // Combined hook (Refine-style)
  useResource,
  // Utilities
  useInvalidate,
  usePrefetch,
  useOptimisticUpdate,
} from './hooks'

// Filters
export {
  applyFilters,
  applyFilter,
  buildSearchFilter,
  parseFiltersFromSearchParams,
  filtersToSearchParams,
} from './filters'

// Types
export type {
  // Config
  DataProviderConfig,
  // Query params
  QueryParams,
  PaginationParams,
  SortParams,
  // Filters
  Filter,
  FilterOperator,
  // Response types
  ListResponse,
  GetOneParams,
  CreateParams,
  UpdateParams,
  DeleteParams,
  DeleteManyParams,
  UpdateManyParams,
  CustomQueryParams,
  SubscribeParams,
  RealtimePayload,
  // Interface
  DataProvider,
  DataProviderErrorDetails,
} from './types'
