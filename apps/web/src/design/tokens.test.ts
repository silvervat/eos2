/**
 * Design Tokens Tests
 *
 * Testib disaini süsteemi tokeneid
 */

import { tokens, type Tokens } from './tokens'

describe('Design Tokens', () => {
  it('should export tokens object', () => {
    expect(tokens).toBeDefined()
    expect(typeof tokens).toBe('object')
  })

  describe('colors', () => {
    it('should have brand color', () => {
      expect(tokens.colors.brand).toBeDefined()
      expect(tokens.colors.brand.primary).toBe('#279989')
    })

    it('should have semantic colors', () => {
      expect(tokens.colors.success).toBeDefined()
      expect(tokens.colors.warning).toBeDefined()
      expect(tokens.colors.error).toBeDefined()
      expect(tokens.colors.info).toBeDefined()
    })

    it('should have neutral colors', () => {
      expect(tokens.colors.neutral).toBeDefined()
      expect(Object.keys(tokens.colors.neutral).length).toBeGreaterThan(0)
    })

    it('brand colors should be valid hex codes', () => {
      const hexRegex = /^#[0-9a-fA-F]{6}$/
      expect(tokens.colors.brand.primary).toMatch(hexRegex)
      expect(tokens.colors.brand.secondary).toMatch(hexRegex)
    })
  })

  describe('spacing', () => {
    it('should have spacing values', () => {
      expect(tokens.spacing).toBeDefined()
      expect(tokens.spacing.xs).toBeDefined()
      expect(tokens.spacing.sm).toBeDefined()
      expect(tokens.spacing.md).toBeDefined()
      expect(tokens.spacing.lg).toBeDefined()
      expect(tokens.spacing.xl).toBeDefined()
    })

    it('spacing values should be numbers', () => {
      expect(typeof tokens.spacing.xs).toBe('number')
      expect(typeof tokens.spacing.md).toBe('number')
    })

    it('spacing should increase in order', () => {
      expect(tokens.spacing.xs).toBeLessThan(tokens.spacing.sm)
      expect(tokens.spacing.sm).toBeLessThan(tokens.spacing.md)
      expect(tokens.spacing.md).toBeLessThan(tokens.spacing.lg)
      expect(tokens.spacing.lg).toBeLessThan(tokens.spacing.xl)
    })
  })

  describe('typography', () => {
    it('should have font families', () => {
      expect(tokens.typography.fontFamily).toBeDefined()
      expect(tokens.typography.fontFamily.primary).toBeDefined()
      expect(tokens.typography.fontFamily.mono).toBeDefined()
    })

    it('should have font sizes', () => {
      expect(tokens.typography.fontSize).toBeDefined()
      expect(tokens.typography.fontSize.xs).toBeDefined()
      expect(tokens.typography.fontSize.base).toBeDefined()
    })

    it('should have font weights', () => {
      expect(tokens.typography.fontWeight).toBeDefined()
      expect(tokens.typography.fontWeight.normal).toBeDefined()
      expect(tokens.typography.fontWeight.bold).toBeDefined()
    })

    it('should have line heights', () => {
      expect(tokens.typography.lineHeight).toBeDefined()
      expect(tokens.typography.lineHeight.normal).toBeDefined()
    })
  })

  describe('borderRadius', () => {
    it('should have border radius values', () => {
      expect(tokens.borderRadius).toBeDefined()
      expect(tokens.borderRadius.sm).toBeDefined()
      expect(tokens.borderRadius.md).toBeDefined()
      expect(tokens.borderRadius.lg).toBeDefined()
      expect(tokens.borderRadius.full).toBeDefined()
    })

    it('border radius should increase in order', () => {
      expect(tokens.borderRadius.sm).toBeLessThan(tokens.borderRadius.md)
      expect(tokens.borderRadius.md).toBeLessThan(tokens.borderRadius.lg)
    })
  })

  describe('shadows', () => {
    it('should have shadow values', () => {
      expect(tokens.shadows).toBeDefined()
      expect(tokens.shadows.sm).toBeDefined()
      expect(tokens.shadows.md).toBeDefined()
      expect(tokens.shadows.lg).toBeDefined()
    })

    it('shadows should be valid CSS box-shadow strings', () => {
      // Basic check - shadows should contain 'px' for dimension
      expect(tokens.shadows.sm).toContain('px')
      expect(tokens.shadows.md).toContain('px')
    })
  })

  describe('breakpoints', () => {
    it('should have breakpoint values', () => {
      expect(tokens.breakpoints).toBeDefined()
      expect(tokens.breakpoints.xs).toBeDefined()
      expect(tokens.breakpoints.sm).toBeDefined()
      expect(tokens.breakpoints.md).toBeDefined()
      expect(tokens.breakpoints.lg).toBeDefined()
      expect(tokens.breakpoints.xl).toBeDefined()
    })

    it('breakpoints should increase in order', () => {
      expect(tokens.breakpoints.xs).toBeLessThan(tokens.breakpoints.sm)
      expect(tokens.breakpoints.sm).toBeLessThan(tokens.breakpoints.md)
      expect(tokens.breakpoints.md).toBeLessThan(tokens.breakpoints.lg)
      expect(tokens.breakpoints.lg).toBeLessThan(tokens.breakpoints.xl)
    })
  })

  describe('zIndex', () => {
    it('should have z-index values', () => {
      expect(tokens.zIndex).toBeDefined()
      expect(tokens.zIndex.dropdown).toBeDefined()
      expect(tokens.zIndex.modal).toBeDefined()
      expect(tokens.zIndex.tooltip).toBeDefined()
    })

    it('modal should be higher than dropdown', () => {
      expect(tokens.zIndex.modal).toBeGreaterThan(tokens.zIndex.dropdown)
    })
  })

  describe('status', () => {
    it('should have status configuration', () => {
      expect(tokens.status).toBeDefined()
      expect(Object.keys(tokens.status).length).toBeGreaterThan(0)
    })

    it('each status should have color and label', () => {
      for (const [key, value] of Object.entries(tokens.status)) {
        expect(value.color).toBeDefined()
        expect(value.label).toBeDefined()
      }
    })
  })

  describe('transitions', () => {
    it('should have transition values', () => {
      expect(tokens.transitions).toBeDefined()
      expect(tokens.transitions.fast).toBeDefined()
      expect(tokens.transitions.normal).toBeDefined()
      expect(tokens.transitions.slow).toBeDefined()
    })
  })
})
