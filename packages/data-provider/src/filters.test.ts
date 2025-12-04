import { applyFilter, applyFilters } from './filters'
import type { Filter } from './types'

// Mock Supabase query builder
function createMockQuery() {
  const calls: { method: string; args: unknown[] }[] = []

  const query = {
    eq: jest.fn((...args) => { calls.push({ method: 'eq', args }); return query }),
    neq: jest.fn((...args) => { calls.push({ method: 'neq', args }); return query }),
    gt: jest.fn((...args) => { calls.push({ method: 'gt', args }); return query }),
    gte: jest.fn((...args) => { calls.push({ method: 'gte', args }); return query }),
    lt: jest.fn((...args) => { calls.push({ method: 'lt', args }); return query }),
    lte: jest.fn((...args) => { calls.push({ method: 'lte', args }); return query }),
    ilike: jest.fn((...args) => { calls.push({ method: 'ilike', args }); return query }),
    in: jest.fn((...args) => { calls.push({ method: 'in', args }); return query }),
    is: jest.fn((...args) => { calls.push({ method: 'is', args }); return query }),
    not: jest.fn((...args) => { calls.push({ method: 'not', args }); return query }),
    getCalls: () => calls,
  }

  return query
}

describe('applyFilter', () => {
  it('should apply eq filter', () => {
    const query = createMockQuery()
    const filter: Filter = { field: 'name', operator: 'eq', value: 'test' }

    applyFilter(query, filter)

    expect(query.eq).toHaveBeenCalledWith('name', 'test')
  })

  it('should apply neq filter', () => {
    const query = createMockQuery()
    const filter: Filter = { field: 'status', operator: 'neq', value: 'deleted' }

    applyFilter(query, filter)

    expect(query.neq).toHaveBeenCalledWith('status', 'deleted')
  })

  it('should apply gt filter', () => {
    const query = createMockQuery()
    const filter: Filter = { field: 'price', operator: 'gt', value: 100 }

    applyFilter(query, filter)

    expect(query.gt).toHaveBeenCalledWith('price', 100)
  })

  it('should apply gte filter', () => {
    const query = createMockQuery()
    const filter: Filter = { field: 'quantity', operator: 'gte', value: 5 }

    applyFilter(query, filter)

    expect(query.gte).toHaveBeenCalledWith('quantity', 5)
  })

  it('should apply lt filter', () => {
    const query = createMockQuery()
    const filter: Filter = { field: 'price', operator: 'lt', value: 50 }

    applyFilter(query, filter)

    expect(query.lt).toHaveBeenCalledWith('price', 50)
  })

  it('should apply lte filter', () => {
    const query = createMockQuery()
    const filter: Filter = { field: 'stock', operator: 'lte', value: 10 }

    applyFilter(query, filter)

    expect(query.lte).toHaveBeenCalledWith('stock', 10)
  })

  it('should apply contains filter with ilike', () => {
    const query = createMockQuery()
    const filter: Filter = { field: 'description', operator: 'contains', value: 'search' }

    applyFilter(query, filter)

    expect(query.ilike).toHaveBeenCalledWith('description', '%search%')
  })

  it('should apply startswith filter with ilike', () => {
    const query = createMockQuery()
    const filter: Filter = { field: 'name', operator: 'startswith', value: 'prefix' }

    applyFilter(query, filter)

    expect(query.ilike).toHaveBeenCalledWith('name', 'prefix%')
  })

  it('should apply endswith filter with ilike', () => {
    const query = createMockQuery()
    const filter: Filter = { field: 'email', operator: 'endswith', value: '@example.com' }

    applyFilter(query, filter)

    expect(query.ilike).toHaveBeenCalledWith('email', '%@example.com')
  })

  it('should apply in filter', () => {
    const query = createMockQuery()
    const filter: Filter = { field: 'status', operator: 'in', value: ['active', 'pending'] }

    applyFilter(query, filter)

    expect(query.in).toHaveBeenCalledWith('status', ['active', 'pending'])
  })

  it('should apply null filter', () => {
    const query = createMockQuery()
    const filter: Filter = { field: 'deleted_at', operator: 'null', value: null }

    applyFilter(query, filter)

    expect(query.is).toHaveBeenCalledWith('deleted_at', null)
  })

  it('should apply nnull filter', () => {
    const query = createMockQuery()
    const filter: Filter = { field: 'assigned_to', operator: 'nnull', value: null }

    applyFilter(query, filter)

    expect(query.not).toHaveBeenCalledWith('assigned_to', 'is', null)
  })

  it('should apply between filter', () => {
    const query = createMockQuery()
    const filter: Filter = { field: 'price', operator: 'between', value: [10, 100] }

    applyFilter(query, filter)

    expect(query.gte).toHaveBeenCalledWith('price', 10)
    expect(query.lte).toHaveBeenCalledWith('price', 100)
  })
})

describe('applyFilters', () => {
  it('should apply multiple filters', () => {
    const query = createMockQuery()
    const filters: Filter[] = [
      { field: 'status', operator: 'eq', value: 'active' },
      { field: 'price', operator: 'gt', value: 50 },
      { field: 'name', operator: 'contains', value: 'test' },
    ]

    applyFilters(query, filters)

    expect(query.eq).toHaveBeenCalledWith('status', 'active')
    expect(query.gt).toHaveBeenCalledWith('price', 50)
    expect(query.ilike).toHaveBeenCalledWith('name', '%test%')
  })

  it('should return query when no filters provided', () => {
    const query = createMockQuery()
    const result = applyFilters(query, [])

    expect(result).toBe(query)
    expect(query.getCalls()).toHaveLength(0)
  })

  it('should chain filters correctly', () => {
    const query = createMockQuery()
    const filters: Filter[] = [
      { field: 'a', operator: 'eq', value: 1 },
      { field: 'b', operator: 'eq', value: 2 },
    ]

    const result = applyFilters(query, filters)

    // Should return the same query object (chainable)
    expect(result).toBe(query)
  })
})
