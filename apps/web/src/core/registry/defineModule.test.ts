/**
 * DefineModule Tests
 *
 * Testib mooduli defineerimise loogikat
 */

import { defineModule, ModuleValidationError } from './defineModule'
import type { ModuleDefinition } from './types'

describe('defineModule', () => {
  const validModule: ModuleDefinition = {
    name: 'test_module',
    label: 'Test Moodulid',
    labelSingular: 'Test Moodul',
    icon: 'AppstoreOutlined',
    description: 'Testi moodul',
    menu: {
      group: 'main',
      order: 10,
      visible: true,
    },
    database: {
      table: 'test_items',
      fields: {
        name: {
          type: 'text',
          label: 'Nimi',
          required: true,
        },
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

  it('should return the same definition for valid module', () => {
    const result = defineModule(validModule)
    expect(result).toEqual(validModule)
  })

  it('should throw error for missing name', () => {
    const invalidModule = { ...validModule, name: '' }
    expect(() => defineModule(invalidModule)).toThrow(ModuleValidationError)
    expect(() => defineModule(invalidModule)).toThrow('name')
  })

  it('should throw error for missing label', () => {
    const invalidModule = { ...validModule, label: '' }
    expect(() => defineModule(invalidModule)).toThrow(ModuleValidationError)
    expect(() => defineModule(invalidModule)).toThrow('label')
  })

  it('should throw error for missing database.table', () => {
    const invalidModule = {
      ...validModule,
      database: { ...validModule.database, table: '' },
    }
    expect(() => defineModule(invalidModule)).toThrow(ModuleValidationError)
    expect(() => defineModule(invalidModule)).toThrow('table')
  })

  it('should accept module without optional fields', () => {
    const minimalModule: ModuleDefinition = {
      name: 'minimal',
      label: 'Minimaalne',
      labelSingular: 'Minimaalne',
      icon: 'AppstoreOutlined',
      database: {
        table: 'minimal_items',
        fields: {},
        rls: true,
      },
      permissions: {},
      components: [],
      meta: {
        version: '1.0.0',
        status: 'development',
      },
    }

    const result = defineModule(minimalModule)
    expect(result.name).toBe('minimal')
  })

  it('should validate field definitions', () => {
    const moduleWithFields: ModuleDefinition = {
      ...validModule,
      database: {
        ...validModule.database,
        fields: {
          name: { type: 'text', label: 'Nimi', required: true },
          email: { type: 'text', label: 'Email', validation: { email: true } },
          status: { type: 'enum', label: 'Staatus', options: ['active', 'inactive'] },
          count: { type: 'number', label: 'Arv', min: 0, max: 100 },
        },
      },
    }

    const result = defineModule(moduleWithFields)
    expect(Object.keys(result.database.fields)).toHaveLength(4)
  })

  it('should preserve all module properties', () => {
    const moduleWithExtras: ModuleDefinition = {
      ...validModule,
      relations: [
        {
          type: 'belongsTo',
          target: 'categories',
          foreignKey: 'category_id',
          label: 'Kategooria',
        },
      ],
      views: [
        {
          name: 'active',
          label: 'Aktiivsed',
          filter: { status: 'active' },
        },
      ],
      statuses: {
        active: {
          label: 'Aktiivne',
          color: '#52c41a',
          icon: 'CheckCircleOutlined',
        },
      },
    }

    const result = defineModule(moduleWithExtras)
    expect(result.relations).toHaveLength(1)
    expect(result.views).toHaveLength(1)
    expect(result.statuses).toHaveProperty('active')
  })
})

describe('ModuleValidationError', () => {
  it('should be instance of Error', () => {
    const error = new ModuleValidationError('test error', 'field')
    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(ModuleValidationError)
  })

  it('should have correct properties', () => {
    const error = new ModuleValidationError('test error', 'fieldName')
    expect(error.message).toBe('test error')
    expect(error.field).toBe('fieldName')
    expect(error.name).toBe('ModuleValidationError')
  })
})
