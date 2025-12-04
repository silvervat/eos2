/**
 * EOS2 Toimingute definitsioonid
 *
 * Toimingud on jagatud kategooriatesse:
 * - CRUD baastoimingud (read, create, update, delete)
 * - Mooduli-spetsiifilised toimingud (module:action)
 * - Admin toimingud (admin:*)
 */

/**
 * CRUD baastoimingud
 */
export const BaseAction = {
  READ: 'read',
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  EXPORT: 'export',
} as const

export type BaseActionType = (typeof BaseAction)[keyof typeof BaseAction]

/**
 * Admin toimingud
 */
export const AdminAction = {
  ACCESS: 'admin:access',
  USERS: 'admin:users',
  MODULES: 'admin:modules',
  PERMISSIONS: 'admin:permissions',
  SYSTEM: 'admin:system',
  LOGS: 'admin:logs',
} as const

export type AdminActionType = (typeof AdminAction)[keyof typeof AdminAction]

/**
 * Warehouse mooduli toimingud
 */
export const WarehouseAction = {
  READ: 'warehouse:read',
  CREATE: 'warehouse:create',
  UPDATE: 'warehouse:update',
  DELETE: 'warehouse:delete',
  TRANSFER: 'warehouse:transfer',
  APPROVE_TRANSFER: 'warehouse:approve_transfer',
  EXPORT: 'warehouse:export',
  MANAGE: 'warehouse:manage',
} as const

export type WarehouseActionType = (typeof WarehouseAction)[keyof typeof WarehouseAction]

/**
 * Projektide mooduli toimingud
 */
export const ProjectAction = {
  READ: 'project:read',
  CREATE: 'project:create',
  UPDATE: 'project:update',
  DELETE: 'project:delete',
  ARCHIVE: 'project:archive',
  ASSIGN: 'project:assign',
  EXPORT: 'project:export',
} as const

export type ProjectActionType = (typeof ProjectAction)[keyof typeof ProjectAction]

/**
 * Arvete mooduli toimingud
 */
export const InvoiceAction = {
  READ: 'invoice:read',
  CREATE: 'invoice:create',
  UPDATE: 'invoice:update',
  DELETE: 'invoice:delete',
  SEND: 'invoice:send',
  APPROVE: 'invoice:approve',
  EXPORT: 'invoice:export',
} as const

export type InvoiceActionType = (typeof InvoiceAction)[keyof typeof InvoiceAction]

/**
 * Sõidukite mooduli toimingud
 */
export const VehicleAction = {
  READ: 'vehicle:read',
  CREATE: 'vehicle:create',
  UPDATE: 'vehicle:update',
  DELETE: 'vehicle:delete',
  ASSIGN: 'vehicle:assign',
  MAINTENANCE: 'vehicle:maintenance',
  EXPORT: 'vehicle:export',
} as const

export type VehicleActionType = (typeof VehicleAction)[keyof typeof VehicleAction]

/**
 * Kõik toimingud koos tõlgetega
 */
export const ActionLabels: Record<string, string> = {
  // CRUD
  read: 'Vaata',
  create: 'Lisa',
  update: 'Muuda',
  delete: 'Kustuta',
  export: 'Eksport',

  // Admin
  'admin:access': 'Admin ligipääs',
  'admin:users': 'Halda kasutajaid',
  'admin:modules': 'Halda mooduleid',
  'admin:permissions': 'Halda õigusi',
  'admin:system': 'Süsteemi seaded',
  'admin:logs': 'Vaata logisid',

  // Warehouse
  'warehouse:read': 'Vaata ladu',
  'warehouse:create': 'Lisa varasid',
  'warehouse:update': 'Muuda varasid',
  'warehouse:delete': 'Kustuta varasid',
  'warehouse:transfer': 'Tee ülekanne',
  'warehouse:approve_transfer': 'Kinnita ülekanne',
  'warehouse:export': 'Ekspordi andmed',
  'warehouse:manage': 'Halda ladu',

  // Project
  'project:read': 'Vaata projekte',
  'project:create': 'Lisa projekt',
  'project:update': 'Muuda projekti',
  'project:delete': 'Kustuta projekt',
  'project:archive': 'Arhiveeri projekt',
  'project:assign': 'Määra projekt',
  'project:export': 'Ekspordi projekt',

  // Invoice
  'invoice:read': 'Vaata arveid',
  'invoice:create': 'Koosta arve',
  'invoice:update': 'Muuda arvet',
  'invoice:delete': 'Kustuta arve',
  'invoice:send': 'Saada arve',
  'invoice:approve': 'Kinnita arve',
  'invoice:export': 'Ekspordi arve',

  // Vehicle
  'vehicle:read': 'Vaata sõidukeid',
  'vehicle:create': 'Lisa sõiduk',
  'vehicle:update': 'Muuda sõidukit',
  'vehicle:delete': 'Kustuta sõiduk',
  'vehicle:assign': 'Määra sõiduk',
  'vehicle:maintenance': 'Halda hooldust',
  'vehicle:export': 'Ekspordi sõidukid',
}

/**
 * Parsib toimingu mooduli nimeks ja toiminguks
 * Näide: 'warehouse:read' -> { module: 'warehouse', action: 'read' }
 */
export function parseAction(action: string): { module: string | null; action: string } {
  if (action.includes(':')) {
    const [module, actionName] = action.split(':')
    return { module, action: actionName }
  }
  return { module: null, action }
}

/**
 * Loob toimingu stringi mooduli nimest ja toimingust
 */
export function buildAction(module: string, action: string): string {
  return `${module}:${action}`
}
