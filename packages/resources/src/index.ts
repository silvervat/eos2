/**
 * @eos2/resources
 *
 * Declarative resource definitions for EOS2.
 * Define your resources once and get automatic CRUD, forms, tables, and navigation.
 *
 * @example
 * ```tsx
 * import { getResource, getAllResources, resources } from '@eos2/resources'
 *
 * // Get a single resource definition
 * const projectsResource = getResource('projects')
 * console.log(projectsResource.label) // "Projekt"
 *
 * // Get all resources for navigation
 * const allResources = getAllResources()
 *
 * // Access resource directly
 * const { columns, fields } = resources.projects
 * ```
 *
 * @packageDocumentation
 */

// Export types
export type {
  ResourceDefinition,
  ResourceCapabilities,
  ResourceHooks,
  ColumnDefinition,
  ColumnType,
  StatusColor,
  FieldDefinition,
  FieldType,
  FieldValidation,
  SelectOption,
  FilterDefinition,
  FilterType,
  ResourceRecord,
  FieldNames,
  ColumnFields,
} from './types'

// Export all resource definitions
export {
  resources,
  projectsResource,
  clientsResource,
  invoicesResource,
  employeesResource,
  vehiclesResource,
  warehouseAssetsResource,
  warehousesResource,
  warehouseCategoriesResource,
  maintenanceLogsResource,
  stockTransfersResource,
  ultraTablesResource,
} from './definitions'

// Import for helper functions
import { resources } from './definitions'
import type { ResourceDefinition } from './types'

// ============ HELPER FUNCTIONS ============

/**
 * Get a resource definition by name
 * @param name - The resource name (e.g., 'projects', 'clients')
 * @throws Error if resource is not found
 *
 * @example
 * ```tsx
 * const projectsResource = getResource('projects')
 * console.log(projectsResource.columns)
 * ```
 */
export function getResource(name: string): ResourceDefinition {
  const resource = resources[name]
  if (!resource) {
    throw new Error(`Resource "${name}" not found. Available resources: ${Object.keys(resources).join(', ')}`)
  }
  return resource
}

/**
 * Get a resource definition by name, returns undefined if not found
 * @param name - The resource name
 *
 * @example
 * ```tsx
 * const resource = getResourceSafe('unknown')
 * if (resource) {
 *   // use resource
 * }
 * ```
 */
export function getResourceSafe(name: string): ResourceDefinition | undefined {
  return resources[name]
}

/**
 * Get all resource definitions as an array
 *
 * @example
 * ```tsx
 * const allResources = getAllResources()
 * allResources.forEach(resource => {
 *   console.log(resource.name, resource.label)
 * })
 * ```
 */
export function getAllResources(): ResourceDefinition[] {
  return Object.values(resources)
}

/**
 * Get all resource names
 *
 * @example
 * ```tsx
 * const names = getResourceNames()
 * // ['projects', 'clients', 'invoices', ...]
 * ```
 */
export function getResourceNames(): string[] {
  return Object.keys(resources)
}

/**
 * Check if a resource exists
 * @param name - The resource name to check
 *
 * @example
 * ```tsx
 * if (hasResource('projects')) {
 *   // resource exists
 * }
 * ```
 */
export function hasResource(name: string): boolean {
  return name in resources
}

/**
 * Get resources filtered by capability
 * @param capability - The capability to filter by
 *
 * @example
 * ```tsx
 * // Get all resources that support export
 * const exportableResources = getResourcesByCapability('export')
 * ```
 */
export function getResourcesByCapability(
  capability: keyof NonNullable<ResourceDefinition['capabilities']>
): ResourceDefinition[] {
  return getAllResources().filter(
    (resource) => resource.capabilities?.[capability] === true
  )
}

/**
 * Get resources for navigation menu
 * Returns resources sorted for display in a navigation menu
 *
 * @example
 * ```tsx
 * const navResources = getNavigationResources()
 * navResources.forEach(resource => {
 *   // render navigation item
 * })
 * ```
 */
export function getNavigationResources(): ResourceDefinition[] {
  // Define navigation order
  const order: Record<string, number> = {
    projects: 1,
    clients: 2,
    invoices: 3,
    employees: 4,
    vehicles: 5,
    warehouse_assets: 10,
    warehouses: 11,
    warehouse_categories: 12,
    maintenance_logs: 13,
    stock_transfers: 14,
    ultra_tables: 99,
  }

  return getAllResources()
    .filter((resource) => resource.capabilities?.show !== false)
    .sort((a, b) => {
      const orderA = order[a.name] ?? 50
      const orderB = order[b.name] ?? 50
      return orderA - orderB
    })
}

/**
 * Get a column definition from a resource
 * @param resourceName - The resource name
 * @param columnField - The column field name
 *
 * @example
 * ```tsx
 * const statusColumn = getColumn('projects', 'status')
 * ```
 */
export function getColumn(
  resourceName: string,
  columnField: string
) {
  const resource = getResource(resourceName)
  return resource.columns.find((col) => col.field === columnField)
}

/**
 * Get a field definition from a resource
 * @param resourceName - The resource name
 * @param fieldName - The field name
 *
 * @example
 * ```tsx
 * const statusField = getField('projects', 'status')
 * ```
 */
export function getField(
  resourceName: string,
  fieldName: string
) {
  const resource = getResource(resourceName)
  return resource.fields.find((field) => field.name === fieldName)
}

/**
 * Get options for a select/multiselect field
 * @param resourceName - The resource name
 * @param fieldName - The field name
 *
 * @example
 * ```tsx
 * const statusOptions = getFieldOptions('projects', 'status')
 * // [{ value: 'planning', label: 'Planeerimisel', color: 'blue' }, ...]
 * ```
 */
export function getFieldOptions(
  resourceName: string,
  fieldName: string
) {
  const field = getField(resourceName, fieldName)
  return field?.options ?? []
}

/**
 * Get the label for a field value (for select fields)
 * @param resourceName - The resource name
 * @param fieldName - The field name
 * @param value - The value to get label for
 *
 * @example
 * ```tsx
 * const label = getOptionLabel('projects', 'status', 'active')
 * // 'Aktiivne'
 * ```
 */
export function getOptionLabel(
  resourceName: string,
  fieldName: string,
  value: unknown
): string {
  const options = getFieldOptions(resourceName, fieldName)
  const option = options.find((opt) => opt.value === value)
  return option?.label ?? String(value)
}

/**
 * Get default values for a resource form
 * @param resourceName - The resource name
 *
 * @example
 * ```tsx
 * const defaults = getDefaultValues('projects')
 * // { status: 'planning', ... }
 * ```
 */
export function getDefaultValues(resourceName: string): Record<string, unknown> {
  const resource = getResource(resourceName)
  const defaults: Record<string, unknown> = {}

  for (const field of resource.fields) {
    if (field.defaultValue !== undefined) {
      defaults[field.name] = field.defaultValue
    }
  }

  return defaults
}

/**
 * Get required fields for a resource
 * @param resourceName - The resource name
 *
 * @example
 * ```tsx
 * const requiredFields = getRequiredFields('projects')
 * // ['code', 'name']
 * ```
 */
export function getRequiredFields(resourceName: string): string[] {
  const resource = getResource(resourceName)
  return resource.fields
    .filter((field) => field.required)
    .map((field) => field.name)
}

/**
 * Get searchable fields for a resource
 * @param resourceName - The resource name
 *
 * @example
 * ```tsx
 * const searchFields = getSearchFields('projects')
 * // ['name', 'code', 'location']
 * ```
 */
export function getSearchFields(resourceName: string): string[] {
  const resource = getResource(resourceName)
  return resource.search?.fields ?? []
}

/**
 * Group fields by their group property
 * @param resourceName - The resource name
 *
 * @example
 * ```tsx
 * const grouped = getFieldsByGroup('employees')
 * // { undefined: [...], 'contact': [...], 'employment': [...] }
 * ```
 */
export function getFieldsByGroup(resourceName: string): Record<string | 'default', typeof resources.projects.fields> {
  const resource = getResource(resourceName)
  const groups: Record<string, typeof resource.fields> = {}

  for (const field of resource.fields) {
    const groupName = field.group ?? 'default'
    if (!groups[groupName]) {
      groups[groupName] = []
    }
    groups[groupName].push(field)
  }

  // Sort by order within each group
  for (const groupName of Object.keys(groups)) {
    groups[groupName].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }

  return groups
}

/**
 * Get visible columns for a resource (excluding hidden columns)
 * @param resourceName - The resource name
 */
export function getVisibleColumns(resourceName: string) {
  const resource = getResource(resourceName)
  return resource.columns.filter((col) => !col.hidden)
}

/**
 * Get sortable columns for a resource
 * @param resourceName - The resource name
 */
export function getSortableColumns(resourceName: string) {
  const resource = getResource(resourceName)
  return resource.columns.filter((col) => col.sortable)
}

/**
 * Get filterable columns for a resource
 * @param resourceName - The resource name
 */
export function getFilterableColumns(resourceName: string) {
  const resource = getResource(resourceName)
  return resource.columns.filter((col) => col.filterable)
}
