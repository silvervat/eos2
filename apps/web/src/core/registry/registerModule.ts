/**
 * EOS2 registerModule
 *
 * Registreerib mooduli andmebaasi.
 * Loob/uuendab modules, components ja module_actions tabelid.
 */

import type { ModuleDefinition } from './types'

// TODO: Asenda oma Supabase clientiga
// import { createClient } from '@/lib/supabase/client'

/**
 * Mock Supabase client - asenda päris clientiga
 */
function createClient() {
  // TODO: Integreeri Supabase
  return {
    from: (table: string) => ({
      upsert: async (data: unknown) => {
        console.log(`📝 Upsert to ${table}:`, data)
        return { data, error: null }
      },
      select: async () => ({ data: [], error: null }),
    }),
    rpc: async (fn: string, params: unknown) => {
      console.log(`🔧 RPC ${fn}:`, params)
      return { data: null, error: null }
    },
  }
}

/**
 * Registreerib ühe mooduli andmebaasi
 */
export async function registerModule(definition: ModuleDefinition): Promise<void> {
  const supabase = createClient()

  console.log(`📝 Registering module: ${definition.name}...`)

  try {
    // 1. REGISTREERI MOODUL
    const { error: moduleError } = await supabase.from('modules').upsert({
      name: definition.name,
      label: definition.label,
      label_singular: definition.labelSingular,
      icon: definition.icon,
      description: definition.description || null,
      status: definition.meta.status,
      config: definition,
      menu_group: definition.menu.group,
      menu_order: definition.menu.order,
      menu_visible: definition.menu.visible,
      version: definition.meta.version,
      author: definition.meta.author,
      bug_refs: definition.meta.bugRefs || [],
      todo_refs: definition.meta.todoRefs || [],
    })

    if (moduleError) {
      console.error(`❌ Failed to register module:`, moduleError)
      throw moduleError
    }

    // 2. REGISTREERI KOMPONENDID
    for (const component of definition.components) {
      const { error: componentError } = await supabase.from('components').upsert({
        module_name: definition.name,
        name: component.name,
        type: component.type,
        status: component.status,
        description: component.description || null,
        file_path: component.filePath || null,
        todo_refs: component.todoRefs || [],
        bug_refs: component.bugRefs || [],
      })

      if (componentError) {
        console.warn(`⚠️ Failed to register component ${component.name}:`, componentError)
      }
    }

    // 3. REGISTREERI TOIMINGUD (õigused)
    for (const [action, config] of Object.entries(definition.permissions)) {
      const { error: actionError } = await supabase.from('module_actions').upsert({
        module_name: definition.name,
        action,
        label: config.label,
        description: config.description || null,
        default_roles: config.default,
      })

      if (actionError) {
        console.warn(`⚠️ Failed to register action ${action}:`, actionError)
      }
    }

    // 4. REGISTREERI SEOSED
    if (definition.relations && definition.relations.length > 0) {
      for (const relation of definition.relations) {
        const { error: relationError } = await supabase.from('module_relations').upsert({
          source_module: definition.name,
          target_module: relation.module,
          relation_type: relation.type,
          foreign_key: relation.foreignKey,
          label: relation.label,
        })

        if (relationError) {
          console.warn(`⚠️ Failed to register relation:`, relationError)
        }
      }
    }

    console.log(`✅ Module ${definition.name} registered successfully!`)
  } catch (error) {
    console.error(`❌ Failed to register module ${definition.name}:`, error)
    throw error
  }
}

/**
 * Registreerib mitu moodulit korraga
 */
export async function registerModules(definitions: ModuleDefinition[]): Promise<void> {
  console.log(`🚀 Registering ${definitions.length} modules...`)

  for (const definition of definitions) {
    await registerModule(definition)
  }

  console.log(`✅ All ${definitions.length} modules registered!`)
}

/**
 * Loeb kõik registreeritud moodulid andmebaasist
 */
export async function getRegisteredModules(): Promise<ModuleDefinition[]> {
  const supabase = createClient()

  const { data, error } = await supabase.from('modules').select()

  if (error) {
    console.error('❌ Failed to get modules:', error)
    return []
  }

  return (data || []).map((m: { config: ModuleDefinition }) => m.config)
}

/**
 * Loeb ühe mooduli andmebaasist
 */
export async function getModule(name: string): Promise<ModuleDefinition | null> {
  const modules = await getRegisteredModules()
  return modules.find((m) => m.name === name) || null
}
