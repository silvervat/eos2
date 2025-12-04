import { cn } from './utils'

describe('cn utility function', () => {
  it('should merge class names', () => {
    const result = cn('foo', 'bar')
    expect(result).toBe('foo bar')
  })

  it('should handle undefined values', () => {
    const result = cn('foo', undefined, 'bar')
    expect(result).toBe('foo bar')
  })

  it('should handle null values', () => {
    const result = cn('foo', null, 'bar')
    expect(result).toBe('foo bar')
  })

  it('should handle false values', () => {
    const result = cn('foo', false, 'bar')
    expect(result).toBe('foo bar')
  })

  it('should handle conditional classes', () => {
    const isActive = true
    const isDisabled = false
    const result = cn(
      'base',
      isActive && 'active',
      isDisabled && 'disabled'
    )
    expect(result).toBe('base active')
  })

  it('should merge Tailwind classes correctly', () => {
    const result = cn('px-2 py-1', 'px-4')
    expect(result).toBe('py-1 px-4')
  })

  it('should handle conflicting Tailwind classes', () => {
    const result = cn('text-red-500', 'text-blue-500')
    expect(result).toBe('text-blue-500')
  })

  it('should handle empty string', () => {
    const result = cn('')
    expect(result).toBe('')
  })

  it('should handle no arguments', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('should handle object syntax', () => {
    const result = cn({
      'base-class': true,
      'active-class': true,
      'disabled-class': false,
    })
    expect(result).toBe('base-class active-class')
  })

  it('should handle array of classes', () => {
    const result = cn(['foo', 'bar', 'baz'])
    expect(result).toBe('foo bar baz')
  })

  it('should handle mixed inputs', () => {
    const result = cn(
      'base',
      ['array-class'],
      { 'object-class': true },
      'string-class'
    )
    expect(result).toBe('base array-class object-class string-class')
  })

  it('should merge hover states correctly', () => {
    const result = cn('hover:bg-red-500', 'hover:bg-blue-500')
    expect(result).toBe('hover:bg-blue-500')
  })

  it('should preserve responsive variants', () => {
    const result = cn('md:text-lg', 'lg:text-xl')
    expect(result).toBe('md:text-lg lg:text-xl')
  })

  it('should handle complex Tailwind merging', () => {
    const result = cn(
      'rounded-md p-4 text-sm',
      'p-2 text-lg rounded-lg'
    )
    expect(result).toBe('p-2 text-lg rounded-lg')
  })
})
