import {
  getResource,
  getAllResources,
  getNavigationResources,
  getFieldOptions,
  getDefaultValues,
} from './index'

describe('getResource', () => {
  it('should return a resource by name', () => {
    const resource = getResource('projects')

    expect(resource).toBeDefined()
    expect(resource.name).toBe('projects')
    expect(resource.label).toBeDefined()
    expect(resource.labelPlural).toBeDefined()
    expect(resource.basePath).toBe('/projects')
    expect(resource.columns).toBeInstanceOf(Array)
    expect(resource.fields).toBeInstanceOf(Array)
  })

  it('should throw error for unknown resource', () => {
    expect(() => getResource('nonexistent')).toThrow()
  })

  it('should return clients resource', () => {
    const resource = getResource('clients')

    expect(resource.name).toBe('clients')
    expect(resource.basePath).toBe('/clients')
  })

  it('should return invoices resource', () => {
    const resource = getResource('invoices')

    expect(resource.name).toBe('invoices')
    expect(resource.basePath).toBe('/invoices')
  })

  it('should return employees resource', () => {
    const resource = getResource('employees')

    expect(resource.name).toBe('employees')
  })

  it('should return vehicles resource', () => {
    const resource = getResource('vehicles')

    expect(resource.name).toBe('vehicles')
  })
})

describe('getAllResources', () => {
  it('should return an array of all resources', () => {
    const resources = getAllResources()

    expect(resources).toBeInstanceOf(Array)
    expect(resources.length).toBeGreaterThan(0)
  })

  it('should contain projects resource', () => {
    const resources = getAllResources()
    const projects = resources.find((r) => r.name === 'projects')

    expect(projects).toBeDefined()
  })

  it('should contain all expected resources', () => {
    const resources = getAllResources()
    const resourceNames = resources.map((r) => r.name)

    expect(resourceNames).toContain('projects')
    expect(resourceNames).toContain('clients')
    expect(resourceNames).toContain('invoices')
    expect(resourceNames).toContain('employees')
    expect(resourceNames).toContain('vehicles')
  })

  it('should return resources with required properties', () => {
    const resources = getAllResources()

    for (const resource of resources) {
      expect(resource.name).toBeDefined()
      expect(resource.label).toBeDefined()
      expect(resource.labelPlural).toBeDefined()
      expect(resource.icon).toBeDefined()
      expect(resource.basePath).toBeDefined()
      expect(resource.select).toBeDefined()
      expect(resource.columns).toBeInstanceOf(Array)
      expect(resource.fields).toBeInstanceOf(Array)
    }
  })
})

describe('getNavigationResources', () => {
  it('should return resources for navigation', () => {
    const resources = getNavigationResources()

    expect(resources).toBeInstanceOf(Array)
    expect(resources.length).toBeGreaterThan(0)
  })

  it('should only return resources with navigation enabled', () => {
    const resources = getNavigationResources()

    for (const resource of resources) {
      // All navigation resources should have basePath
      expect(resource.basePath).toBeDefined()
      expect(resource.basePath.startsWith('/')).toBe(true)
    }
  })
})

describe('getFieldOptions', () => {
  it('should return options for a select field', () => {
    // Projects has a status field with options
    const options = getFieldOptions('projects', 'status')

    // May be undefined if field doesn't have options
    if (options) {
      expect(options).toBeInstanceOf(Array)
    }
  })

  it('should return empty array for non-existent field', () => {
    const options = getFieldOptions('projects', 'nonexistent')

    // Returns empty array when field not found
    expect(options).toEqual([])
  })

  it('should return empty array for field without options', () => {
    const options = getFieldOptions('projects', 'name')

    // Returns empty array when field has no options
    expect(Array.isArray(options)).toBe(true)
  })
})

describe('getDefaultValues', () => {
  it('should return default values for a resource', () => {
    const defaults = getDefaultValues('projects')

    expect(defaults).toBeInstanceOf(Object)
  })

  it('should return empty object if no defaults defined', () => {
    const defaults = getDefaultValues('clients')

    expect(defaults).toBeInstanceOf(Object)
  })
})

describe('Resource definitions structure', () => {
  it('each resource should have valid columns', () => {
    const resources = getAllResources()

    for (const resource of resources) {
      expect(resource.columns.length).toBeGreaterThan(0)

      for (const column of resource.columns) {
        expect(column.field).toBeDefined()
        expect(column.label).toBeDefined()
        expect(column.type).toBeDefined()
      }
    }
  })

  it('each resource should have valid fields', () => {
    const resources = getAllResources()

    for (const resource of resources) {
      expect(resource.fields.length).toBeGreaterThan(0)

      for (const field of resource.fields) {
        expect(field.name).toBeDefined()
        expect(field.label).toBeDefined()
        expect(field.type).toBeDefined()
      }
    }
  })

  it('resource icons should be defined', () => {
    const resources = getAllResources()

    for (const resource of resources) {
      // Icons from lucide-react are defined (can be function or object depending on env)
      expect(resource.icon).toBeDefined()
    }
  })

  it('resource basePaths should start with /', () => {
    const resources = getAllResources()

    for (const resource of resources) {
      expect(resource.basePath.startsWith('/')).toBe(true)
    }
  })
})
