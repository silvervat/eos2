/**
 * EOS2 Õiguste Kontrolli Loogika
 *
 * Sisaldab:
 * - hasPermission - kontrollib kas kasutajal on õigus
 * - usePermission - React hook
 * - checkResourceAccess - ressursi tasemel kontroll
 */

import { roleHasPermission, PermissionMatrix } from './matrix'
import { RoleHierarchy, type RoleType } from './roles'

/**
 * Kasutaja objekt õiguste kontrolliks
 */
export interface PermissionUser {
  id: string
  role: RoleType
  tenant_id?: string
  // Kohandatud õigused (lisaks rolli õigustele)
  custom_permissions?: string[]
  // Keelatud õigused (eemaldatud rolli õigustest)
  denied_permissions?: string[]
}

/**
 * Ressurss millele ligipääsu kontrollitakse
 */
export interface Resource {
  id?: string
  created_by?: string
  tenant_id?: string
  [key: string]: unknown
}

/**
 * Kontrollib kas kasutajal on konkreetne õigus
 *
 * Kontrollimise järjekord:
 * 1. Owner - alati lubatud
 * 2. Keelatud õigused (denied_permissions)
 * 3. Kohandatud õigused (custom_permissions)
 * 4. Rolli õigused (PermissionMatrix)
 * 5. Ressursi omaniku kontroll
 */
export function hasPermission(
  user: PermissionUser | null | undefined,
  action: string,
  resource?: Resource
): boolean {
  // Kui kasutajat pole, keela ligipääs
  if (!user) {
    return false
  }

  // 1. Owner - alati lubatud
  if (user.role === 'owner') {
    return true
  }

  // 2. Kontrolli keelatud õigusi
  if (user.denied_permissions?.includes(action)) {
    return false
  }

  // 3. Kontrolli kohandatud õigusi
  if (user.custom_permissions?.includes(action)) {
    return true
  }

  // 4. Kontrolli rolli õigusi maatriksist
  if (roleHasPermission(user.role, action)) {
    return true
  }

  // 5. Ressursi omaniku kontroll
  // Kasutaja saab muuta/kustutada oma ressursse
  if (resource && resource.created_by === user.id) {
    // Lubame update ja delete toimingud oma ressurssidele
    if (action.endsWith(':update') || action.endsWith(':delete')) {
      // Aga ainult kui kasutajal on vähemalt read õigus
      const [module] = action.split(':')
      if (roleHasPermission(user.role, `${module}:read`)) {
        return true
      }
    }
  }

  return false
}

/**
 * Kontrollib kas kasutajal on vähemalt üks õigustest
 */
export function hasAnyPermission(
  user: PermissionUser | null | undefined,
  actions: string[]
): boolean {
  return actions.some((action) => hasPermission(user, action))
}

/**
 * Kontrollib kas kasutajal on kõik nõutud õigused
 */
export function hasAllPermissions(
  user: PermissionUser | null | undefined,
  actions: string[]
): boolean {
  return actions.every((action) => hasPermission(user, action))
}

/**
 * Kontrollib kas kasutaja roll on piisavalt kõrge
 */
export function hasMinimumRoleLevel(
  user: PermissionUser | null | undefined,
  minimumRole: RoleType
): boolean {
  if (!user) return false
  return RoleHierarchy[user.role] >= RoleHierarchy[minimumRole]
}

/**
 * Kontrollib kas kasutaja pääseb ligi ressursile
 * (tenant kontroll + õiguste kontroll)
 */
export function canAccessResource(
  user: PermissionUser | null | undefined,
  resource: Resource,
  action: string
): boolean {
  if (!user) return false

  // Tenant kontroll (kui mõlemal on tenant_id)
  if (user.tenant_id && resource.tenant_id) {
    if (user.tenant_id !== resource.tenant_id) {
      return false
    }
  }

  // Õiguste kontroll
  return hasPermission(user, action, resource)
}

/**
 * Tagastab kõik kasutaja õigused (rolli + kohandatud - keelatud)
 */
export function getUserPermissions(user: PermissionUser | null | undefined): string[] {
  if (!user) return []

  // Owner saab kõik
  if (user.role === 'owner') {
    return ['*']
  }

  const permissions = new Set<string>()

  // Lisa rolli õigused
  const rolePermissions = PermissionMatrix[user.role] || []
  for (const perm of rolePermissions) {
    permissions.add(perm)
  }

  // Lisa kohandatud õigused
  if (user.custom_permissions) {
    for (const perm of user.custom_permissions) {
      permissions.add(perm)
    }
  }

  // Eemalda keelatud õigused
  if (user.denied_permissions) {
    for (const perm of user.denied_permissions) {
      permissions.delete(perm)
    }
  }

  return Array.from(permissions)
}

/**
 * Filtreerib andmed vastavalt kasutaja õigustele
 * Kasulik list vaadete jaoks
 */
export function filterByPermission<T extends Resource>(
  user: PermissionUser | null | undefined,
  items: T[],
  action: string
): T[] {
  if (!user) return []

  // Owner ja admin näevad kõike
  if (hasMinimumRoleLevel(user, 'admin')) {
    return items
  }

  return items.filter((item) => canAccessResource(user, item, action))
}
