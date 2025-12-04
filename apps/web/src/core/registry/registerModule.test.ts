/**
 * RegisterModule Tests
 *
 * Testib moodulite registreerimise loogikat
 */

import {
  registerModule,
  registerModules,
  getRegisteredModules,
  getModule,
} from './registerModule'
import type { ModuleDefinition } from './types'

// Test moodul
const testModule: ModuleDefinition = {
  name: 'test_register',
  label: 'Test Register',
  labelSingular: 'Test Register',
  icon: 'AppstoreOutlined',
  database: {
    table: 'test_register_items',
    fields: {
      name: { type: 'text', label: 'Nimi', required: true },
    },
    rls: true,
  },
  permissions: {
    read: {
      label: 'Vaata',
      description: 'Kirjete vaatamine',
      default: ['viewer', 'user', 'manager', 'admin', 'owner'],
    },
  },
  components: [],
  meta: {
    version: '1.0.0',
    status: 'development',
  },
}

const testModule2: ModuleDefinition = {
  ...testModule,
  name: 'test_register_2',
  label: 'Test Register 2',
  database: { ...testModule.database, table: 'test_register_2_items' },
}

describe('registerModule', () => {
  beforeEach(() => {
    // Clear registry before each test
    const modules = getRegisteredModules()
    // Registry should start fresh or we work with existing state
  })

  it('should register a module and return it', () => {
    const registered = registerModule(testModule)

    expect(registered).toBeDefined()
    expect(registered.definition.name).toBe('test_register')
    expect(registered.registeredAt).toBeInstanceOf(Date)
  })

  it('should include registeredAt timestamp', () => {
    const before = new Date()
    const registered = registerModule(testModule)
    const after = new Date()

    expect(registered.registeredAt.getTime()).toBeGreaterThanOrEqual(before.getTime())
    expect(registered.registeredAt.getTime()).toBeLessThanOrEqual(after.getTime())
  })

  it('should overwrite existing module with same name', () => {
    const first = registerModule(testModule)
    const updatedModule = { ...testModule, label: 'Updated Label' }
    const second = registerModule(updatedModule)

    expect(second.definition.label).toBe('Updated Label')
  })
})

describe('registerModules', () => {
  it('should register multiple modules at once', () => {
    const modules = [testModule, testModule2]
    const registered = registerModules(modules)

    expect(registered).toHaveLength(2)
    expect(registered[0].definition.name).toBe('test_register')
    expect(registered[1].definition.name).toBe('test_register_2')
  })

  it('should handle empty array', () => {
    const registered = registerModules([])
    expect(registered).toHaveLength(0)
  })
})

describe('getRegisteredModules', () => {
  it('should return array of registered modules', () => {
    registerModule(testModule)
    const modules = getRegisteredModules()

    expect(Array.isArray(modules)).toBe(true)
  })

  it('should include recently registered module', () => {
    registerModule(testModule)
    const modules = getRegisteredModules()

    const found = modules.find((m) => m.definition.name === 'test_register')
    expect(found).toBeDefined()
  })
})

describe('getModule', () => {
  it('should return registered module by name', () => {
    registerModule(testModule)
    const module = getModule('test_register')

    expect(module).toBeDefined()
    expect(module?.definition.name).toBe('test_register')
  })

  it('should return undefined for non-existent module', () => {
    const module = getModule('non_existent_module_xyz')

    expect(module).toBeUndefined()
  })

  it('should return correct module when multiple registered', () => {
    registerModule(testModule)
    registerModule(testModule2)

    const module1 = getModule('test_register')
    const module2 = getModule('test_register_2')

    expect(module1?.definition.name).toBe('test_register')
    expect(module2?.definition.name).toBe('test_register_2')
  })
})
