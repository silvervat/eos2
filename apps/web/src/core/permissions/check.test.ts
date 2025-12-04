/**
 * Permission Check Tests
 *
 * Testib õiguste kontrollimise loogikat
 */

import {
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

describe('hasPermission', () => {
  const ownerUser: PermissionUser = { id: '1', role: 'owner' }
  const adminUser: PermissionUser = { id: '2', role: 'admin' }
  const managerUser: PermissionUser = { id: '3', role: 'manager' }
  const regularUser: PermissionUser = { id: '4', role: 'user' }
  const viewerUser: PermissionUser = { id: '5', role: 'viewer' }

  it('should return false for null user', () => {
    expect(hasPermission(null, 'project:read')).toBe(false)
    expect(hasPermission(undefined, 'project:read')).toBe(false)
  })

  it('should always allow owner', () => {
    expect(hasPermission(ownerUser, 'project:read')).toBe(true)
    expect(hasPermission(ownerUser, 'project:delete')).toBe(true)
    expect(hasPermission(ownerUser, 'any:action')).toBe(true)
  })

  it('should check denied_permissions first', () => {
    const userWithDenied: PermissionUser = {
      id: '1',
      role: 'admin',
      denied_permissions: ['project:delete'],
    }
    expect(hasPermission(userWithDenied, 'project:delete')).toBe(false)
    expect(hasPermission(userWithDenied, 'project:read')).toBe(true)
  })

  it('should allow custom_permissions', () => {
    const userWithCustom: PermissionUser = {
      id: '1',
      role: 'viewer',
      custom_permissions: ['special:action'],
    }
    expect(hasPermission(userWithCustom, 'special:action')).toBe(true)
  })

  it('should check role permissions from matrix', () => {
    // Admin should have project:read (via project:*)
    expect(hasPermission(adminUser, 'project:read')).toBe(true)
    // Viewer should have project:read (read-only)
    expect(hasPermission(viewerUser, 'project:read')).toBe(true)
    // Viewer should not have project:create
    expect(hasPermission(viewerUser, 'project:create')).toBe(false)
  })

  it('should allow resource owner to update own resource', () => {
    const resource: Resource = {
      id: 'res-1',
      created_by: '4', // regularUser.id
    }
    // Regular user can update own resource
    expect(hasPermission(regularUser, 'project:update', resource)).toBe(true)
  })

  it('should allow resource owner to delete own resource', () => {
    const resource: Resource = {
      id: 'res-1',
      created_by: '4', // regularUser.id
    }
    expect(hasPermission(regularUser, 'project:delete', resource)).toBe(true)
  })
})

describe('hasAnyPermission', () => {
  const adminUser: PermissionUser = { id: '1', role: 'admin' }
  const viewerUser: PermissionUser = { id: '2', role: 'viewer' }

  it('should return true if user has at least one permission', () => {
    expect(hasAnyPermission(adminUser, ['project:read', 'project:create'])).toBe(true)
    expect(hasAnyPermission(viewerUser, ['project:read', 'project:create'])).toBe(true)
  })

  it('should return false if user has none of the permissions', () => {
    expect(hasAnyPermission(viewerUser, ['project:create', 'project:delete'])).toBe(false)
  })

  it('should return false for null user', () => {
    expect(hasAnyPermission(null, ['project:read'])).toBe(false)
  })
})

describe('hasAllPermissions', () => {
  const adminUser: PermissionUser = { id: '1', role: 'admin' }
  const viewerUser: PermissionUser = { id: '2', role: 'viewer' }

  it('should return true if user has all permissions', () => {
    expect(hasAllPermissions(adminUser, ['project:read', 'project:create'])).toBe(true)
  })

  it('should return false if user is missing any permission', () => {
    expect(hasAllPermissions(viewerUser, ['project:read', 'project:create'])).toBe(false)
  })

  it('should return false for null user', () => {
    expect(hasAllPermissions(null, ['project:read'])).toBe(false)
  })
})

describe('hasMinimumRoleLevel', () => {
  const ownerUser: PermissionUser = { id: '1', role: 'owner' }
  const adminUser: PermissionUser = { id: '2', role: 'admin' }
  const viewerUser: PermissionUser = { id: '3', role: 'viewer' }

  it('should return true if role level is sufficient', () => {
    expect(hasMinimumRoleLevel(ownerUser, 'admin')).toBe(true)
    expect(hasMinimumRoleLevel(adminUser, 'admin')).toBe(true)
    expect(hasMinimumRoleLevel(adminUser, 'manager')).toBe(true)
  })

  it('should return false if role level is insufficient', () => {
    expect(hasMinimumRoleLevel(viewerUser, 'admin')).toBe(false)
    expect(hasMinimumRoleLevel(viewerUser, 'manager')).toBe(false)
  })

  it('should return false for null user', () => {
    expect(hasMinimumRoleLevel(null, 'viewer')).toBe(false)
  })
})

describe('canAccessResource', () => {
  const userWithTenant: PermissionUser = { id: '1', role: 'admin', tenant_id: 'tenant-1' }
  const userOtherTenant: PermissionUser = { id: '2', role: 'admin', tenant_id: 'tenant-2' }

  it('should deny access to resources from different tenant', () => {
    const resource: Resource = { id: 'res-1', tenant_id: 'tenant-1' }
    expect(canAccessResource(userOtherTenant, resource, 'project:read')).toBe(false)
  })

  it('should allow access to resources from same tenant', () => {
    const resource: Resource = { id: 'res-1', tenant_id: 'tenant-1' }
    expect(canAccessResource(userWithTenant, resource, 'project:read')).toBe(true)
  })

  it('should return false for null user', () => {
    const resource: Resource = { id: 'res-1' }
    expect(canAccessResource(null, resource, 'project:read')).toBe(false)
  })
})

describe('getUserPermissions', () => {
  it('should return ["*"] for owner', () => {
    const owner: PermissionUser = { id: '1', role: 'owner' }
    expect(getUserPermissions(owner)).toEqual(['*'])
  })

  it('should return role permissions for regular users', () => {
    const admin: PermissionUser = { id: '1', role: 'admin' }
    const permissions = getUserPermissions(admin)
    // Admin has wildcards like 'project:*' which will be included
    expect(permissions).toContain('admin:access')
    expect(permissions).toContain('admin:users')
  })

  it('should include custom permissions', () => {
    const user: PermissionUser = {
      id: '1',
      role: 'viewer',
      custom_permissions: ['special:action'],
    }
    const permissions = getUserPermissions(user)
    expect(permissions).toContain('special:action')
    expect(permissions).toContain('project:read')
  })

  it('should exclude denied permissions', () => {
    const user: PermissionUser = {
      id: '1',
      role: 'admin',
      denied_permissions: ['admin:logs'],
    }
    const permissions = getUserPermissions(user)
    expect(permissions).not.toContain('admin:logs')
  })

  it('should return empty array for null user', () => {
    expect(getUserPermissions(null)).toEqual([])
  })
})

describe('filterByPermission', () => {
  const adminUser: PermissionUser = { id: '1', role: 'admin', tenant_id: 'tenant-1' }
  const regularUser: PermissionUser = { id: '2', role: 'user', tenant_id: 'tenant-1' }

  const items: Resource[] = [
    { id: '1', tenant_id: 'tenant-1', created_by: '2' },
    { id: '2', tenant_id: 'tenant-1', created_by: '3' },
    { id: '3', tenant_id: 'tenant-2', created_by: '4' },
  ]

  it('should return all items for admin', () => {
    const filtered = filterByPermission(adminUser, items, 'project:read')
    expect(filtered.length).toBe(3)
  })

  it('should return empty array for null user', () => {
    const filtered = filterByPermission(null, items, 'project:read')
    expect(filtered).toEqual([])
  })
})
