/**
 * EOS2 Registry Types
 *
 * Mooduli definitsioonide TypeScript tüübid
 */

import type { RoleType } from '../permissions/roles'

/**
 * Andmebaasi välja definitsioon
 */
export interface FieldDefinition {
  /** Välja tüüp */
  type:
    | 'text'
    | 'integer'
    | 'decimal'
    | 'boolean'
    | 'date'
    | 'datetime'
    | 'uuid'
    | 'enum'
    | 'json'

  /** Nimi eesti keeles */
  label: string

  /** Kas kohustuslik */
  required?: boolean

  /** Kas unikaalne */
  unique?: boolean

  /** Vaikeväärtus */
  default?: unknown

  /** Enum valikud (kui type === 'enum') */
  options?: string[]

  /** Viide teisele tabelile (kui type === 'uuid') */
  references?: string

  /** Kas peidetud vormidel */
  hidden?: boolean

  /** Täiendav kirjeldus */
  description?: string
}

/**
 * Indeksi definitsioon
 */
export interface IndexDefinition {
  /** Veerud mille kohta indeks tehakse */
  columns: string[]

  /** Kas unikaalne indeks */
  unique?: boolean
}

/**
 * Andmebaasi definitsioon
 */
export interface DatabaseDefinition {
  /** Tabeli nimi */
  table: string

  /** Väljad */
  fields: Record<string, FieldDefinition>

  /** Kas RLS on lubatud */
  rls?: boolean

  /** Indeksid */
  indexes?: IndexDefinition[]
}

/**
 * Õiguse definitsioon
 */
export interface PermissionDefinition {
  /** Nimi eesti keeles */
  label: string

  /** Kirjeldus */
  description?: string

  /** Vaikimisi rollid kellel on see õigus */
  default: RoleType[]
}

/**
 * Komponendi definitsioon
 */
export interface ComponentDefinition {
  /** Komponendi nimi */
  name: string

  /** Komponendi tüüp */
  type: 'page' | 'modal' | 'widget' | 'tab' | 'card' | 'form' | 'table' | 'other'

  /** Staatus */
  status: 'active' | 'beta' | 'development' | 'todo' | 'deprecated'

  /** Kirjeldus */
  description?: string

  /** Faili asukoht */
  filePath?: string

  /** Seotud TODO-d */
  todoRefs?: string[]

  /** Seotud bugid */
  bugRefs?: string[]
}

/**
 * Seose definitsioon
 */
export interface RelationDefinition {
  /** Sihtmoodul */
  module: string

  /** Välisvõti */
  foreignKey: string

  /** Nimi eesti keeles */
  label: string

  /** Seose tüüp */
  type: 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many'
}

/**
 * Vaate definitsioon
 */
export interface ViewDefinition {
  /** Vaate identifikaator */
  name: string

  /** Nimi eesti keeles */
  label: string

  /** Filtrid */
  filters: Record<string, unknown>

  /** Sorteerimine */
  sort?: Array<{ field: string; order: 'asc' | 'desc' }>
}

/**
 * Staatuse definitsioon
 */
export interface StatusDefinition {
  /** Nimi eesti keeles */
  label: string

  /** Värv */
  color: string

  /** Taustavärv */
  bg: string

  /** Ikoon */
  icon?: string
}

/**
 * Menüü seaded
 */
export interface MenuDefinition {
  /** Menüü grupp */
  group: string

  /** Järjekord grupis */
  order: number

  /** Kas nähtav menüüs */
  visible?: boolean
}

/**
 * Metainfo
 */
export interface MetaDefinition {
  /** Versioon */
  version: string

  /** Autor */
  author: string

  /** Loomise kuupäev */
  createdAt: string

  /** Staatus */
  status: 'active' | 'beta' | 'development' | 'todo' | 'disabled'

  /** Seotud bugid */
  bugRefs?: string[]

  /** Seotud TODO-d */
  todoRefs?: string[]
}

/**
 * Täielik mooduli definitsioon
 */
export interface ModuleDefinition {
  // Identifikaator
  name: string

  // Nimed
  label: string
  labelSingular: string

  // UI
  icon: string
  description?: string

  // Menüü
  menu: MenuDefinition

  // Andmebaas
  database: DatabaseDefinition

  // Õigused
  permissions: Record<string, PermissionDefinition>

  // Komponendid
  components: ComponentDefinition[]

  // Seosed (valikuline)
  relations?: RelationDefinition[]

  // Vaated (valikuline)
  views?: ViewDefinition[]

  // Staatused (valikuline)
  statuses?: Record<string, StatusDefinition>

  // Metainfo
  meta: MetaDefinition
}

/**
 * Registreeritud moodul (DB-st tulev)
 */
export interface RegisteredModule {
  id: string
  name: string
  label: string
  label_singular: string
  icon: string
  description: string | null
  status: string
  config: ModuleDefinition
  menu_group: string | null
  menu_order: number
  menu_visible: boolean
  version: string | null
  author: string | null
  bug_refs: string[]
  todo_refs: string[]
  created_at: string
  updated_at: string
}
