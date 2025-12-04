import { DataProviderError } from './provider'

describe('DataProviderError', () => {
  it('should create an error with message and code', () => {
    const error = new DataProviderError('Not found', 'PGRST116')

    expect(error).toBeInstanceOf(Error)
    expect(error).toBeInstanceOf(DataProviderError)
    expect(error.message).toBe('Not found')
    expect(error.code).toBe('PGRST116')
    expect(error.name).toBe('DataProviderError')
  })

  it('should create an error with status', () => {
    const error = new DataProviderError('Server error', 'ERR500', 500)

    expect(error.message).toBe('Server error')
    expect(error.code).toBe('ERR500')
    expect(error.status).toBe(500)
  })

  it('should create an error with details', () => {
    const details = { field: 'email', reason: 'invalid format' }
    const error = new DataProviderError('Validation failed', 'VALIDATION', 400, details)

    expect(error.message).toBe('Validation failed')
    expect(error.code).toBe('VALIDATION')
    expect(error.status).toBe(400)
    expect(error.details).toEqual(details)
  })

  it('should create an error without optional parameters', () => {
    const error = new DataProviderError('Unknown error', 'UNKNOWN')

    expect(error.status).toBeUndefined()
    expect(error.details).toBeUndefined()
    expect(error.message).toBe('Unknown error')
  })

  it('should be throwable and catchable', () => {
    const throwError = () => {
      throw new DataProviderError('Test error', 'TEST')
    }

    expect(throwError).toThrow(DataProviderError)
    expect(throwError).toThrow('Test error')
  })

  it('should have correct error name', () => {
    const error = new DataProviderError('Test', 'TEST')

    expect(error.name).toBe('DataProviderError')
  })
})

// Note: Full provider integration tests require a real Supabase instance
// These would be better suited as integration tests with a test database
describe('DataProvider', () => {
  it('should export DataProviderError', () => {
    expect(DataProviderError).toBeDefined()
    expect(typeof DataProviderError).toBe('function')
  })
})
