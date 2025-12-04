/**
 * EOS2 Design Tokens
 *
 * Kõik disaini konstandid ühes kohas.
 * Kasuta neid kõikjal kus on vaja värve, spacing'u, fonte jne.
 *
 * @example
 * import { tokens } from '@/design/tokens'
 *
 * const styles = {
 *   color: tokens.colors.primary,
 *   padding: tokens.spacing.md,
 * }
 */

export const tokens = {
  // ═══════════════════════════════════════════════════════════════
  // VÄRVID
  // ═══════════════════════════════════════════════════════════════
  colors: {
    // Bränd (Rivest)
    primary: '#279989',
    primaryHover: '#1f7a6d',
    primaryActive: '#165a51',
    primaryLight: '#e6f7f5',

    // Staatused
    success: '#52c41a',
    successLight: '#f6ffed',
    successBorder: '#b7eb8f',

    warning: '#faad14',
    warningLight: '#fffbe6',
    warningBorder: '#ffe58f',

    error: '#ff4d4f',
    errorLight: '#fff2f0',
    errorBorder: '#ffccc7',

    info: '#1890ff',
    infoLight: '#e6f7ff',
    infoBorder: '#91d5ff',

    // Neutraalsed
    text: {
      primary: '#262626',
      secondary: '#595959',
      tertiary: '#8c8c8c',
      disabled: '#bfbfbf',
      inverse: '#ffffff',
    },

    bg: {
      primary: '#ffffff',
      secondary: '#fafafa',
      tertiary: '#f5f5f5',
      dark: '#001529',
    },

    border: {
      primary: '#d9d9d9',
      secondary: '#e8e8e8',
      light: '#f0f0f0',
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // SPACING
  // ═══════════════════════════════════════════════════════════════
  spacing: {
    /** 4px */
    xs: 4,
    /** 8px */
    sm: 8,
    /** 12px */
    md: 12,
    /** 16px */
    lg: 16,
    /** 24px */
    xl: 24,
    /** 32px */
    '2xl': 32,
    /** 48px */
    '3xl': 48,
    /** 64px */
    '4xl': 64,
  },

  // ═══════════════════════════════════════════════════════════════
  // TYPOGRAPHY
  // ═══════════════════════════════════════════════════════════════
  typography: {
    fontFamily: {
      sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      mono: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    },

    fontSize: {
      /** 12px */
      xs: 12,
      /** 14px */
      sm: 14,
      /** 16px */
      base: 16,
      /** 18px */
      lg: 18,
      /** 20px */
      xl: 20,
      /** 24px */
      '2xl': 24,
      /** 30px */
      '3xl': 30,
      /** 36px */
      '4xl': 36,
    },

    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },

    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // BORDER RADIUS
  // ═══════════════════════════════════════════════════════════════
  radius: {
    /** 2px */
    sm: 2,
    /** 4px */
    base: 4,
    /** 6px */
    md: 6,
    /** 8px */
    lg: 8,
    /** 12px */
    xl: 12,
    /** 16px */
    '2xl': 16,
    /** 9999px - täielikult ümar */
    full: 9999,
  },

  // ═══════════════════════════════════════════════════════════════
  // SHADOWS
  // ═══════════════════════════════════════════════════════════════
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  },

  // ═══════════════════════════════════════════════════════════════
  // Z-INDEX
  // ═══════════════════════════════════════════════════════════════
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },

  // ═══════════════════════════════════════════════════════════════
  // BREAKPOINTS
  // ═══════════════════════════════════════════════════════════════
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
    '2xl': 1536,
  },

  // ═══════════════════════════════════════════════════════════════
  // STAATUSTE KUJUNDUS
  // ═══════════════════════════════════════════════════════════════
  status: {
    active: {
      bg: '#f6ffed',
      color: '#52c41a',
      border: '#b7eb8f',
      label: 'Aktiivne',
    },
    beta: {
      bg: '#e6f7ff',
      color: '#1890ff',
      border: '#91d5ff',
      label: 'Beeta',
    },
    development: {
      bg: '#fffbe6',
      color: '#faad14',
      border: '#ffe58f',
      label: 'Arenduses',
    },
    todo: {
      bg: '#f5f5f5',
      color: '#8c8c8c',
      border: '#d9d9d9',
      label: 'Planeeritud',
    },
    disabled: {
      bg: '#fafafa',
      color: '#bfbfbf',
      border: '#e8e8e8',
      label: 'Keelatud',
    },
    error: {
      bg: '#fff2f0',
      color: '#ff4d4f',
      border: '#ffccc7',
      label: 'Viga',
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // TRANSITIONS
  // ═══════════════════════════════════════════════════════════════
  transitions: {
    fast: '150ms ease',
    normal: '200ms ease',
    slow: '300ms ease',
  },
} as const

// Tüüp tokenite jaoks
export type Tokens = typeof tokens
