/**
 * EOS2 Õiguste Maatriks
 *
 * Defineerib millistel rollidel on milliseid õigusi.
 * Wildcard (*) lubab kõiki toiminguid selle mooduli all.
 */

import type { RoleType } from './roles'
import { AdminAction, WarehouseAction, ProjectAction, InvoiceAction, VehicleAction } from './actions'

/**
 * Õiguste maatriks - millistel rollidel on mis õigused
 */
export const PermissionMatrix: Record<RoleType, string[]> = {
  /**
   * OWNER - Täielik ligipääs kõigele
   */
  owner: ['*'],

  /**
   * ADMIN - Peaaegu kõik õigused, välja arvatud billing ja tenant deletion
   */
  admin: [
    // Admin
    AdminAction.ACCESS,
    AdminAction.USERS,
    AdminAction.MODULES,
    AdminAction.PERMISSIONS,
    AdminAction.LOGS,

    // Warehouse - kõik
    'warehouse:*',

    // Projects - kõik
    'project:*',

    // Invoices - kõik
    'invoice:*',

    // Vehicles - kõik
    'vehicle:*',
  ],

  /**
   * MANAGER - Projektid, arved, ladu täielikult, sõidukid osaliselt
   */
  manager: [
    // Warehouse
    WarehouseAction.READ,
    WarehouseAction.CREATE,
    WarehouseAction.UPDATE,
    WarehouseAction.TRANSFER,
    WarehouseAction.EXPORT,

    // Projects - kõik
    'project:*',

    // Invoices - kõik peale kustutamise
    InvoiceAction.READ,
    InvoiceAction.CREATE,
    InvoiceAction.UPDATE,
    InvoiceAction.SEND,
    InvoiceAction.APPROVE,
    InvoiceAction.EXPORT,

    // Vehicles
    VehicleAction.READ,
    VehicleAction.CREATE,
    VehicleAction.UPDATE,
    VehicleAction.ASSIGN,
    VehicleAction.MAINTENANCE,
    VehicleAction.EXPORT,
  ],

  /**
   * USER - Põhiliselt lugemine + mõned toimingud
   */
  user: [
    // Warehouse
    WarehouseAction.READ,
    WarehouseAction.TRANSFER,

    // Projects
    ProjectAction.READ,
    ProjectAction.UPDATE, // Ainult oma projektid (kontrollitakse ressursi tasemel)

    // Invoices
    InvoiceAction.READ,

    // Vehicles
    VehicleAction.READ,
    VehicleAction.MAINTENANCE,
  ],

  /**
   * VIEWER - Ainult lugemine
   */
  viewer: [
    WarehouseAction.READ,
    ProjectAction.READ,
    InvoiceAction.READ,
    VehicleAction.READ,
  ],
}

/**
 * Kontrollib kas roll omab konkreetset õigust
 */
export function roleHasPermission(role: RoleType, action: string): boolean {
  const permissions = PermissionMatrix[role] || []

  // Global wildcard
  if (permissions.includes('*')) {
    return true
  }

  // Otsene vaste
  if (permissions.includes(action)) {
    return true
  }

  // Mooduli wildcard (nt 'warehouse:*')
  if (action.includes(':')) {
    const [module] = action.split(':')
    if (permissions.includes(`${module}:*`)) {
      return true
    }
  }

  return false
}

/**
 * Tagastab kõik rollid kellel on konkreetne õigus
 */
export function getRolesWithPermission(action: string): RoleType[] {
  const roles: RoleType[] = []

  for (const [role, permissions] of Object.entries(PermissionMatrix)) {
    if (roleHasPermission(role as RoleType, action)) {
      roles.push(role as RoleType)
    }
  }

  return roles
}

/**
 * Tagastab kõik õigused konkreetse rolli jaoks (lahendab wildcardid)
 */
export function getExpandedPermissions(role: RoleType): string[] {
  const permissions = PermissionMatrix[role] || []
  const expanded: string[] = []

  // Kui on global wildcard, tagasta kõik teadaolevad õigused
  if (permissions.includes('*')) {
    // Kogu kõik teadaolevad õigused teistest rollidest
    const allPermissions = new Set<string>()
    for (const perms of Object.values(PermissionMatrix)) {
      for (const perm of perms) {
        if (perm !== '*' && !perm.endsWith(':*')) {
          allPermissions.add(perm)
        }
      }
    }
    return Array.from(allPermissions)
  }

  for (const perm of permissions) {
    if (perm.endsWith(':*')) {
      // Laienda mooduli wildcard
      const module = perm.replace(':*', '')
      // Lisa kõik selle mooduli teadaolevad toimingud
      for (const perms of Object.values(PermissionMatrix)) {
        for (const p of perms) {
          if (p.startsWith(`${module}:`) && !p.endsWith(':*')) {
            expanded.push(p)
          }
        }
      }
    } else {
      expanded.push(perm)
    }
  }

  return [...new Set(expanded)]
}

/**
 * Tagastab rolli otsesed õigused (ilma laiendamata)
 */
export function getPermissionsForRole(role: RoleType): string[] {
  return PermissionMatrix[role] || []
}

/**
 * Tagastab kõik unikaalsed õigused süsteemis
 */
export function getAllPermissions(): string[] {
  const allPermissions = new Set<string>()

  for (const permissions of Object.values(PermissionMatrix)) {
    for (const perm of permissions) {
      // Jäta wildcardid välja
      if (perm !== '*' && !perm.endsWith(':*')) {
        allPermissions.add(perm)
      }
    }
  }

  return Array.from(allPermissions).sort()
}
