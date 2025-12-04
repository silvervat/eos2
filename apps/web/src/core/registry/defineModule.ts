/**
 * EOS2 defineModule Helper
 *
 * Valideerib ja tagastab mooduli definitsooni.
 * Kasuta seda iga mooduli definition.ts failis.
 *
 * @example
 * // modules/vehicles/definition.ts
 * import { defineModule } from '@/core/registry'
 *
 * export default defineModule({
 *   name: 'vehicles',
 *   label: 'Sõidukid',
 *   // ...
 * })
 */

import type { ModuleDefinition } from './types'

/**
 * Valideerimise viga
 */
class ModuleValidationError extends Error {
  constructor(moduleName: string, message: string) {
    super(`Module "${moduleName}": ${message}`)
    this.name = 'ModuleValidationError'
  }
}

/**
 * Valideerib mooduli definitsooni
 */
function validateModule(definition: ModuleDefinition): void {
  const { name } = definition

  // Kohustuslikud väljad
  if (!definition.name) {
    throw new ModuleValidationError(name || 'unknown', 'name is required')
  }

  if (!definition.label) {
    throw new ModuleValidationError(name, 'label is required')
  }

  if (!definition.labelSingular) {
    throw new ModuleValidationError(name, 'labelSingular is required')
  }

  if (!definition.icon) {
    throw new ModuleValidationError(name, 'icon is required')
  }

  // Menüü
  if (!definition.menu) {
    throw new ModuleValidationError(name, 'menu is required')
  }

  if (!definition.menu.group) {
    throw new ModuleValidationError(name, 'menu.group is required')
  }

  // Andmebaas
  if (!definition.database) {
    throw new ModuleValidationError(name, 'database is required')
  }

  if (!definition.database.table) {
    throw new ModuleValidationError(name, 'database.table is required')
  }

  if (!definition.database.fields || Object.keys(definition.database.fields).length === 0) {
    throw new ModuleValidationError(name, 'database.fields must have at least one field')
  }

  // Õigused
  if (!definition.permissions) {
    throw new ModuleValidationError(name, 'permissions is required')
  }

  // Vähemalt read õigus peab olema
  if (!definition.permissions.read) {
    throw new ModuleValidationError(name, 'permissions.read is required')
  }

  // Komponendid
  if (!definition.components || !Array.isArray(definition.components)) {
    throw new ModuleValidationError(name, 'components must be an array')
  }

  // Meta
  if (!definition.meta) {
    throw new ModuleValidationError(name, 'meta is required')
  }

  if (!definition.meta.version) {
    throw new ModuleValidationError(name, 'meta.version is required')
  }

  if (!definition.meta.status) {
    throw new ModuleValidationError(name, 'meta.status is required')
  }

  // Valideeri nimi (lowercase, no spaces)
  if (!/^[a-z][a-z0-9_]*$/.test(definition.name)) {
    throw new ModuleValidationError(
      name,
      'name must be lowercase, start with a letter, and contain only letters, numbers, and underscores'
    )
  }

  // Valideeri tabeli nimi
  if (!/^[a-z][a-z0-9_]*$/.test(definition.database.table)) {
    throw new ModuleValidationError(
      name,
      'database.table must be lowercase and contain only letters, numbers, and underscores'
    )
  }
}

/**
 * Lisab vaikeväärtused
 */
function applyDefaults(definition: ModuleDefinition): ModuleDefinition {
  return {
    ...definition,
    description: definition.description || '',
    menu: {
      ...definition.menu,
      order: definition.menu.order ?? 0,
      visible: definition.menu.visible ?? true,
    },
    database: {
      ...definition.database,
      rls: definition.database.rls ?? true,
      indexes: definition.database.indexes || [],
    },
    components: definition.components.map((comp) => ({
      ...comp,
      status: comp.status || 'todo',
      todoRefs: comp.todoRefs || [],
      bugRefs: comp.bugRefs || [],
    })),
    relations: definition.relations || [],
    views: definition.views || [],
    statuses: definition.statuses || {},
    meta: {
      ...definition.meta,
      bugRefs: definition.meta.bugRefs || [],
      todoRefs: definition.meta.todoRefs || [],
    },
  }
}

/**
 * defineModule - mooduli definitsioonifunktsioon
 *
 * Kasutamine:
 * ```typescript
 * export default defineModule({
 *   name: 'vehicles',
 *   label: 'Sõidukid',
 *   labelSingular: 'Sõiduk',
 *   icon: 'CarOutlined',
 *   // ...
 * })
 * ```
 *
 * @param definition - Mooduli definitsioon
 * @returns Valideeritud ja täiendatud mooduli definitsioon
 * @throws ModuleValidationError kui definitsioon on vigane
 */
export function defineModule(definition: ModuleDefinition): ModuleDefinition {
  // Valideeri
  validateModule(definition)

  // Lisa vaikeväärtused
  const enhancedDefinition = applyDefaults(definition)

  // Development log
  if (process.env.NODE_ENV === 'development') {
    console.log(`📦 Module defined: ${definition.name}`)
  }

  return enhancedDefinition
}

export { ModuleValidationError }
