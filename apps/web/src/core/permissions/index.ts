/**
 * EOS2 Permissions Module
 *
 * Ekspordib kõik õiguste süsteemi komponendid
 *
 * @example
 * import { usePermission, ProtectedComponent, Role } from '@/core/permissions'
 */

// Rollid
export {
  Role,
  RoleHierarchy,
  RoleLabels,
  RoleDescriptions,
  RoleColors,
  isRoleHigherOrEqual,
  hasMinimumRole,
  getAllRolesSorted,
  type RoleType,
} from './roles'

// Toimingud
export {
  BaseAction,
  AdminAction,
  WarehouseAction,
  ProjectAction,
  InvoiceAction,
  VehicleAction,
  ActionLabels,
  parseAction,
  buildAction,
  type BaseActionType,
  type AdminActionType,
  type WarehouseActionType,
  type ProjectActionType,
  type InvoiceActionType,
  type VehicleActionType,
} from './actions'

// Maatriks
export {
  PermissionMatrix,
  roleHasPermission,
  getRolesWithPermission,
  getExpandedPermissions,
} from './matrix'

// Kontroll
export {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasMinimumRoleLevel,
  canAccessResource,
  getUserPermissions,
  filterByPermission,
  type PermissionUser,
  type Resource,
} from './check'

// React Hookid
export {
  usePermission,
  useAnyPermission,
  useAllPermissions,
  useMinimumRole,
  useUserPermissions,
  useUserRole,
  useIsAdmin,
  useIsOwner,
  useModulePermissions,
} from './hooks'

// React Komponendid
export {
  ProtectedComponent,
  ProtectedByAny,
  ProtectedByAll,
  ProtectedByRole,
  AdminOnly,
  OwnerOnly,
  NoAccess,
  withPermission,
  withRole,
} from './components'
