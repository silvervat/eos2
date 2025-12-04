/**
 * EOS2 Registry Module
 *
 * Ekspordib kõik registry komponendid
 *
 * @example
 * import { defineModule, registerModule } from '@/core/registry'
 */

// Types
export type {
  ModuleDefinition,
  FieldDefinition,
  IndexDefinition,
  DatabaseDefinition,
  PermissionDefinition,
  ComponentDefinition,
  RelationDefinition,
  ViewDefinition,
  StatusDefinition,
  MenuDefinition,
  MetaDefinition,
  RegisteredModule,
} from './types'

// defineModule
export { defineModule, ModuleValidationError } from './defineModule'

// registerModule
export {
  registerModule,
  registerModules,
  getRegisteredModules,
  getModule,
} from './registerModule'
