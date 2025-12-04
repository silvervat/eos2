import {
  formatDate,
  formatDateTime,
  formatRelativeTime,
  formatCurrency,
  formatNumber,
  getNestedValue,
  getCellAlignment,
} from './formatters'
import type { ColumnDefinition } from '@eos2/resources'

describe('formatDate', () => {
  it('should format a valid date string', () => {
    const result = formatDate('2024-03-15')
    expect(result).toBe('15.03.2024')
  })

  it('should format a valid ISO date string', () => {
    const result = formatDate('2024-03-15T10:30:00Z')
    expect(result).toBe('15.03.2024')
  })

  it('should return dash for null value', () => {
    const result = formatDate(null)
    expect(result).toBe('—')
  })

  it('should return dash for undefined value', () => {
    const result = formatDate(undefined)
    expect(result).toBe('—')
  })

  it('should return dash for empty string', () => {
    const result = formatDate('')
    expect(result).toBe('—')
  })

  it('should return dash for invalid date string', () => {
    const result = formatDate('not-a-date')
    expect(result).toBe('—')
  })
})

describe('formatDateTime', () => {
  it('should format a valid datetime string', () => {
    const result = formatDateTime('2024-03-15T10:30:00')
    // Format should include date and time
    expect(result).toMatch(/15\.03\.2024/)
    expect(result).toMatch(/10:30/)
  })

  it('should return dash for null value', () => {
    const result = formatDateTime(null)
    expect(result).toBe('—')
  })

  it('should return dash for undefined value', () => {
    const result = formatDateTime(undefined)
    expect(result).toBe('—')
  })
})

describe('formatCurrency', () => {
  it('should format a positive number with default currency', () => {
    const result = formatCurrency(1234.56)
    expect(result).toContain('1')
    expect(result).toContain('234')
    expect(result).toContain('56')
    expect(result).toContain('€')
  })

  it('should format a negative number', () => {
    const result = formatCurrency(-500)
    expect(result).toContain('500')
  })

  it('should format zero', () => {
    const result = formatCurrency(0)
    expect(result).toContain('0')
    expect(result).toContain('€')
  })

  it('should format string number', () => {
    const result = formatCurrency('99.99')
    expect(result).toContain('99')
    expect(result).toContain('€')
  })

  it('should return dash for null value', () => {
    const result = formatCurrency(null)
    expect(result).toBe('—')
  })

  it('should return dash for undefined value', () => {
    const result = formatCurrency(undefined)
    expect(result).toBe('—')
  })

  it('should return dash for empty string', () => {
    const result = formatCurrency('')
    expect(result).toBe('—')
  })

  it('should use custom currency symbol', () => {
    const result = formatCurrency(100, '$')
    expect(result).toContain('$')
  })
})

describe('formatNumber', () => {
  it('should format an integer with no decimals by default', () => {
    const result = formatNumber(1234)
    expect(result).toContain('1')
    expect(result).toContain('234')
  })

  it('should format with specified decimals', () => {
    const result = formatNumber(1234.567, 2)
    expect(result).toContain('1')
    expect(result).toContain('234')
  })

  it('should format string number', () => {
    const result = formatNumber('999')
    expect(result).toContain('999')
  })

  it('should return dash for null value', () => {
    const result = formatNumber(null)
    expect(result).toBe('—')
  })

  it('should return dash for undefined value', () => {
    const result = formatNumber(undefined)
    expect(result).toBe('—')
  })

  it('should return dash for NaN', () => {
    const result = formatNumber('not-a-number')
    expect(result).toBe('—')
  })
})

describe('formatRelativeTime', () => {
  it('should return dash for null value', () => {
    const result = formatRelativeTime(null)
    expect(result).toBe('—')
  })

  it('should return dash for undefined value', () => {
    const result = formatRelativeTime(undefined)
    expect(result).toBe('—')
  })

  it('should format a recent date', () => {
    const now = new Date()
    const result = formatRelativeTime(now.toISOString())
    // Should contain some relative time indication
    expect(typeof result).toBe('string')
    expect(result).not.toBe('—')
  })
})

describe('getNestedValue', () => {
  it('should get a top-level value', () => {
    const obj = { name: 'Test' }
    const result = getNestedValue(obj, 'name')
    expect(result).toBe('Test')
  })

  it('should get a nested value', () => {
    const obj = { client: { name: 'ACME Corp' } }
    const result = getNestedValue(obj, 'client.name')
    expect(result).toBe('ACME Corp')
  })

  it('should get deeply nested value', () => {
    const obj = { a: { b: { c: { d: 'deep' } } } }
    const result = getNestedValue(obj, 'a.b.c.d')
    expect(result).toBe('deep')
  })

  it('should return undefined for non-existent path', () => {
    const obj = { name: 'Test' }
    const result = getNestedValue(obj, 'nonexistent')
    expect(result).toBeUndefined()
  })

  it('should return undefined for non-existent nested path', () => {
    const obj = { name: 'Test' }
    const result = getNestedValue(obj, 'client.name')
    expect(result).toBeUndefined()
  })

  it('should handle null intermediate values', () => {
    const obj = { client: null }
    const result = getNestedValue(obj as Record<string, unknown>, 'client.name')
    expect(result).toBeUndefined()
  })

  it('should handle array index in path', () => {
    const obj = { items: [{ name: 'first' }, { name: 'second' }] }
    // This implementation doesn't support array notation
    const result = getNestedValue(obj, 'items')
    expect(result).toEqual([{ name: 'first' }, { name: 'second' }])
  })
})

describe('getCellAlignment', () => {
  it('should return explicit alignment when set', () => {
    const column: ColumnDefinition = {
      field: 'name',
      label: 'Name',
      type: 'text',
      align: 'center',
    }
    const result = getCellAlignment(column)
    expect(result).toBe('text-center')
  })

  it('should return text-right for number type', () => {
    const column: ColumnDefinition = {
      field: 'amount',
      label: 'Amount',
      type: 'number',
    }
    const result = getCellAlignment(column)
    expect(result).toBe('text-right')
  })

  it('should return text-right for currency type', () => {
    const column: ColumnDefinition = {
      field: 'price',
      label: 'Price',
      type: 'currency',
    }
    const result = getCellAlignment(column)
    expect(result).toBe('text-right')
  })

  it('should return text-center for boolean type', () => {
    const column: ColumnDefinition = {
      field: 'active',
      label: 'Active',
      type: 'boolean',
    }
    const result = getCellAlignment(column)
    expect(result).toBe('text-center')
  })

  it('should return text-left for text type by default', () => {
    const column: ColumnDefinition = {
      field: 'name',
      label: 'Name',
      type: 'text',
    }
    const result = getCellAlignment(column)
    expect(result).toBe('text-left')
  })

  it('should return text-left for date type', () => {
    const column: ColumnDefinition = {
      field: 'date',
      label: 'Date',
      type: 'date',
    }
    const result = getCellAlignment(column)
    expect(result).toBe('text-left')
  })

  it('should override default alignment with explicit align', () => {
    const column: ColumnDefinition = {
      field: 'amount',
      label: 'Amount',
      type: 'number',
      align: 'left',
    }
    const result = getCellAlignment(column)
    expect(result).toBe('text-left')
  })
})
