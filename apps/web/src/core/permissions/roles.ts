/**
 * EOS2 Rollide definitsioonid
 *
 * Hierarhiline RBAC süsteem:
 * - owner (100) - Täielik ligipääs
 * - admin (80) - Haldab kasutajaid ja süsteemi
 * - manager (60) - Haldab projekte ja ressursse
 * - user (40) - Tavakasutaja
 * - viewer (20) - Ainult lugemisõigus
 */

export const Role = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MANAGER: 'manager',
  USER: 'user',
  VIEWER: 'viewer',
} as const

export type RoleType = (typeof Role)[keyof typeof Role]

/**
 * Rollide hierarhia - kõrgem number = rohkem õigusi
 */
export const RoleHierarchy: Record<RoleType, number> = {
  owner: 100,
  admin: 80,
  manager: 60,
  user: 40,
  viewer: 20,
}

/**
 * Rollide nimed eesti keeles
 */
export const RoleLabels: Record<RoleType, string> = {
  owner: 'Omanik',
  admin: 'Administraator',
  manager: 'Juhataja',
  user: 'Kasutaja',
  viewer: 'Vaataja',
}

/**
 * Rollide kirjeldused
 */
export const RoleDescriptions: Record<RoleType, string> = {
  owner: 'Täielik ligipääs kõigile süsteemidele ja seadetele',
  admin: 'Haldab kasutajaid, mooduleid ja õigusi',
  manager: 'Haldab projekte, arveid ja ressursse',
  user: 'Tavakasutaja - põhiõigused',
  viewer: 'Vaataja - ainult lugemisõigus',
}

/**
 * Rollide värvid UI jaoks
 */
export const RoleColors: Record<RoleType, string> = {
  owner: '#722ed1', // Purple
  admin: '#1890ff', // Blue
  manager: '#52c41a', // Green
  user: '#faad14', // Gold
  viewer: '#8c8c8c', // Gray
}

/**
 * Kontrollib kas üks roll on kõrgem kui teine
 */
export function isRoleHigherOrEqual(role: RoleType, targetRole: RoleType): boolean {
  return RoleHierarchy[role] >= RoleHierarchy[targetRole]
}

/**
 * Kontrollib kas roll on vähemalt teatud tasemel
 */
export function hasMinimumRole(userRole: RoleType, minimumRole: RoleType): boolean {
  return isRoleHigherOrEqual(userRole, minimumRole)
}

/**
 * Tagastab kõik rollid järjestatud hierarhia järgi (kõrgemast madalamani)
 */
export function getAllRolesSorted(): RoleType[] {
  return Object.entries(RoleHierarchy)
    .sort(([, a], [, b]) => b - a)
    .map(([role]) => role as RoleType)
}
