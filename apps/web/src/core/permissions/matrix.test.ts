/**
 * Permission Matrix Tests
 *
 * Testib õiguste maatriksit
 */

import {
  roleHasPermission,
  getPermissionsForRole,
  getAllPermissions,
  PermissionMatrix,
} from './matrix'

describe('PermissionMatrix', () => {
  it('should have all 5 roles defined', () => {
    expect(PermissionMatrix).toHaveProperty('owner')
    expect(PermissionMatrix).toHaveProperty('admin')
    expect(PermissionMatrix).toHaveProperty('manager')
    expect(PermissionMatrix).toHaveProperty('user')
    expect(PermissionMatrix).toHaveProperty('viewer')
  })

  it('owner should have wildcard permission', () => {
    expect(PermissionMatrix.owner).toContain('*')
  })

  it('viewer should only have read permissions', () => {
    const viewerPermissions = PermissionMatrix.viewer
    for (const perm of viewerPermissions) {
      expect(perm.endsWith(':read')).toBe(true)
    }
  })

  it('admin should have more permissions than viewer', () => {
    expect(PermissionMatrix.admin.length).toBeGreaterThan(PermissionMatrix.viewer.length)
  })
})

describe('roleHasPermission', () => {
  it('should return true for owner with any permission', () => {
    expect(roleHasPermission('owner', 'any:action')).toBe(true)
    expect(roleHasPermission('owner', 'project:delete')).toBe(true)
  })

  it('should check permission for admin', () => {
    // Admin has 'project:*' wildcard
    expect(roleHasPermission('admin', 'project:read')).toBe(true)
    expect(roleHasPermission('admin', 'project:create')).toBe(true)
    expect(roleHasPermission('admin', 'project:update')).toBe(true)
  })

  it('should check permission for viewer', () => {
    expect(roleHasPermission('viewer', 'project:read')).toBe(true)
    expect(roleHasPermission('viewer', 'project:create')).toBe(false)
    expect(roleHasPermission('viewer', 'project:delete')).toBe(false)
  })

  it('should return false for unknown role', () => {
    expect(roleHasPermission('unknown' as any, 'project:read')).toBe(false)
  })

  it('should check module-level permissions correctly', () => {
    // Viewer has project:read
    expect(roleHasPermission('viewer', 'project:read')).toBe(true)
    // User should have project:read and project:update (own resources)
    expect(roleHasPermission('user', 'project:read')).toBe(true)
    expect(roleHasPermission('user', 'project:update')).toBe(true)
  })
})

describe('getPermissionsForRole', () => {
  it('should return permissions array for valid role', () => {
    const permissions = getPermissionsForRole('admin')
    expect(Array.isArray(permissions)).toBe(true)
    expect(permissions.length).toBeGreaterThan(0)
  })

  it('should return empty array for unknown role', () => {
    const permissions = getPermissionsForRole('unknown' as any)
    expect(permissions).toEqual([])
  })

  it('should return different permissions for different roles', () => {
    const adminPerms = getPermissionsForRole('admin')
    const viewerPerms = getPermissionsForRole('viewer')

    expect(adminPerms.length).not.toBe(viewerPerms.length)
  })
})

describe('getAllPermissions', () => {
  it('should return unique list of all permissions', () => {
    const allPerms = getAllPermissions()

    expect(Array.isArray(allPerms)).toBe(true)
    expect(allPerms.length).toBeGreaterThan(0)

    // Check for duplicates
    const unique = new Set(allPerms)
    expect(unique.size).toBe(allPerms.length)
  })

  it('should include common permissions', () => {
    const allPerms = getAllPermissions()

    expect(allPerms).toContain('project:read')
    expect(allPerms).toContain('project:update')
    expect(allPerms).toContain('warehouse:read')
    expect(allPerms).toContain('vehicle:read')
  })
})
