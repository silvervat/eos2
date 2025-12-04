'use client'

/**
 * EOS2 Õiguste Hookid
 *
 * React hookid õiguste kontrollimiseks komponentides
 */

import { useMemo } from 'react'
import {
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  hasMinimumRoleLevel,
  getUserPermissions,
  type PermissionUser,
  type Resource,
} from './check'
import type { RoleType } from './roles'

// TODO: Asenda oma auth hookiga
// import { useAuth } from '@/lib/auth'

/**
 * Mock useAuth hook - asenda oma implementatsiooniga
 */
function useAuth(): { user: PermissionUser | null; isLoading: boolean } {
  // TODO: Integreeri oma auth süsteemiga
  // See on ajutine mock
  return {
    user: {
      id: 'mock-user-id',
      role: 'admin' as RoleType,
      tenant_id: '16e26c26-2c98-4b58-a956-b86ac3becf14',
    },
    isLoading: false,
  }
}

/**
 * Hook üksiku õiguse kontrollimiseks
 *
 * @example
 * const canCreate = usePermission('warehouse:create')
 * if (canCreate) { ... }
 */
export function usePermission(action: string, resource?: Resource): boolean {
  const { user } = useAuth()
  return useMemo(() => hasPermission(user, action, resource), [user, action, resource])
}

/**
 * Hook mitme õiguse kontrollimiseks (vähemalt üks)
 *
 * @example
 * const canModify = useAnyPermission(['warehouse:update', 'warehouse:delete'])
 */
export function useAnyPermission(actions: string[]): boolean {
  const { user } = useAuth()
  return useMemo(() => hasAnyPermission(user, actions), [user, actions])
}

/**
 * Hook mitme õiguse kontrollimiseks (kõik nõutud)
 *
 * @example
 * const canManage = useAllPermissions(['warehouse:create', 'warehouse:update', 'warehouse:delete'])
 */
export function useAllPermissions(actions: string[]): boolean {
  const { user } = useAuth()
  return useMemo(() => hasAllPermissions(user, actions), [user, actions])
}

/**
 * Hook rolli taseme kontrollimiseks
 *
 * @example
 * const isManager = useMinimumRole('manager')
 */
export function useMinimumRole(minimumRole: RoleType): boolean {
  const { user } = useAuth()
  return useMemo(() => hasMinimumRoleLevel(user, minimumRole), [user, minimumRole])
}

/**
 * Hook kasutaja kõigi õiguste saamiseks
 *
 * @example
 * const permissions = useUserPermissions()
 * console.log(permissions) // ['warehouse:read', 'warehouse:create', ...]
 */
export function useUserPermissions(): string[] {
  const { user } = useAuth()
  return useMemo(() => getUserPermissions(user), [user])
}

/**
 * Hook kasutaja rolli saamiseks
 *
 * @example
 * const role = useUserRole()
 * console.log(role) // 'admin'
 */
export function useUserRole(): RoleType | null {
  const { user } = useAuth()
  return user?.role ?? null
}

/**
 * Hook admin ligipääsu kontrollimiseks
 *
 * @example
 * const isAdmin = useIsAdmin()
 */
export function useIsAdmin(): boolean {
  return useMinimumRole('admin')
}

/**
 * Hook owner ligipääsu kontrollimiseks
 *
 * @example
 * const isOwner = useIsOwner()
 */
export function useIsOwner(): boolean {
  const { user } = useAuth()
  return user?.role === 'owner'
}

/**
 * Hook CRUD õiguste kontrollimiseks mooduli jaoks
 *
 * @example
 * const { canRead, canCreate, canUpdate, canDelete } = useModulePermissions('warehouse')
 */
export function useModulePermissions(module: string): {
  canRead: boolean
  canCreate: boolean
  canUpdate: boolean
  canDelete: boolean
  canExport: boolean
} {
  const { user } = useAuth()

  return useMemo(
    () => ({
      canRead: hasPermission(user, `${module}:read`),
      canCreate: hasPermission(user, `${module}:create`),
      canUpdate: hasPermission(user, `${module}:update`),
      canDelete: hasPermission(user, `${module}:delete`),
      canExport: hasPermission(user, `${module}:export`),
    }),
    [user, module]
  )
}
