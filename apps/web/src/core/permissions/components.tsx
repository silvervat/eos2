'use client'

/**
 * EOS2 Õiguste Komponendid
 *
 * React komponendid õiguste põhiseks UI kontrolliks
 */

import React from 'react'
import { usePermission, useAnyPermission, useAllPermissions, useMinimumRole } from './hooks'
import type { RoleType } from './roles'

/**
 * ProtectedComponent - näitab sisu ainult kui kasutajal on õigus
 *
 * @example
 * <ProtectedComponent permission="warehouse:create">
 *   <Button>Lisa vara</Button>
 * </ProtectedComponent>
 */
interface ProtectedComponentProps {
  /** Nõutud õigus */
  permission: string
  /** Sisu mis näidatakse kui õigus on olemas */
  children: React.ReactNode
  /** Sisu mis näidatakse kui õigust pole (valikuline) */
  fallback?: React.ReactNode
}

export function ProtectedComponent({
  permission,
  children,
  fallback = null,
}: ProtectedComponentProps): React.ReactNode {
  const hasAccess = usePermission(permission)

  if (!hasAccess) {
    return fallback
  }

  return children
}

/**
 * ProtectedByAny - näitab sisu kui kasutajal on vähemalt üks õigustest
 *
 * @example
 * <ProtectedByAny permissions={['warehouse:update', 'warehouse:delete']}>
 *   <ActionButtons />
 * </ProtectedByAny>
 */
interface ProtectedByAnyProps {
  /** Nõutud õigused (vähemalt üks) */
  permissions: string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedByAny({
  permissions,
  children,
  fallback = null,
}: ProtectedByAnyProps): React.ReactNode {
  const hasAccess = useAnyPermission(permissions)

  if (!hasAccess) {
    return fallback
  }

  return children
}

/**
 * ProtectedByAll - näitab sisu kui kasutajal on kõik nõutud õigused
 *
 * @example
 * <ProtectedByAll permissions={['warehouse:create', 'warehouse:update']}>
 *   <AdvancedEditor />
 * </ProtectedByAll>
 */
interface ProtectedByAllProps {
  /** Nõutud õigused (kõik) */
  permissions: string[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedByAll({
  permissions,
  children,
  fallback = null,
}: ProtectedByAllProps): React.ReactNode {
  const hasAccess = useAllPermissions(permissions)

  if (!hasAccess) {
    return fallback
  }

  return children
}

/**
 * ProtectedByRole - näitab sisu kui kasutaja roll on piisav
 *
 * @example
 * <ProtectedByRole minimumRole="manager">
 *   <ManagerDashboard />
 * </ProtectedByRole>
 */
interface ProtectedByRoleProps {
  /** Minimaalne nõutud roll */
  minimumRole: RoleType
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function ProtectedByRole({
  minimumRole,
  children,
  fallback = null,
}: ProtectedByRoleProps): React.ReactNode {
  const hasAccess = useMinimumRole(minimumRole)

  if (!hasAccess) {
    return fallback
  }

  return children
}

/**
 * AdminOnly - näitab sisu ainult adminidele ja omanikele
 *
 * @example
 * <AdminOnly>
 *   <SystemSettings />
 * </AdminOnly>
 */
interface AdminOnlyProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function AdminOnly({ children, fallback = null }: AdminOnlyProps): React.ReactNode {
  return (
    <ProtectedByRole minimumRole="admin" fallback={fallback}>
      {children}
    </ProtectedByRole>
  )
}

/**
 * OwnerOnly - näitab sisu ainult omanikele
 *
 * @example
 * <OwnerOnly>
 *   <BillingSettings />
 * </OwnerOnly>
 */
interface OwnerOnlyProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function OwnerOnly({ children, fallback = null }: OwnerOnlyProps): React.ReactNode {
  return (
    <ProtectedByRole minimumRole="owner" fallback={fallback}>
      {children}
    </ProtectedByRole>
  )
}

/**
 * NoAccess - näitab "pole ligipääsu" teadet
 *
 * @example
 * <ProtectedComponent permission="admin:access" fallback={<NoAccess />}>
 *   <AdminPanel />
 * </ProtectedComponent>
 */
interface NoAccessProps {
  title?: string
  description?: string
}

export function NoAccess({
  title = 'Ligipääs keelatud',
  description = 'Teil pole piisavalt õigusi selle sisu vaatamiseks.',
}: NoAccessProps): React.ReactNode {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="text-4xl mb-4">🔒</div>
      <h2 className="text-xl font-semibold text-gray-800 mb-2">{title}</h2>
      <p className="text-gray-500">{description}</p>
    </div>
  )
}

/**
 * ProtectedPage - HOC lehtede kaitsmiseks
 * Kasutab Next.js redirect'i kui ligipääs puudub
 *
 * @example
 * export default ProtectedPage(AdminDashboard, 'admin:access')
 */
export function withPermission<P extends object>(
  Component: React.ComponentType<P>,
  permission: string,
  FallbackComponent?: React.ComponentType
) {
  return function ProtectedPageWrapper(props: P) {
    const hasAccess = usePermission(permission)

    if (!hasAccess) {
      if (FallbackComponent) {
        return <FallbackComponent />
      }
      return <NoAccess />
    }

    return <Component {...props} />
  }
}

/**
 * HOC rolli põhiseks lehtede kaitsmiseks
 *
 * @example
 * export default withRole(SettingsPage, 'manager')
 */
export function withRole<P extends object>(
  Component: React.ComponentType<P>,
  minimumRole: RoleType,
  FallbackComponent?: React.ComponentType
) {
  return function ProtectedPageWrapper(props: P) {
    const hasAccess = useMinimumRole(minimumRole)

    if (!hasAccess) {
      if (FallbackComponent) {
        return <FallbackComponent />
      }
      return <NoAccess />
    }

    return <Component {...props} />
  }
}
