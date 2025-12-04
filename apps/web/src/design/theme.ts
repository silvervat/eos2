/**
 * EOS2 Ant Design Theme
 *
 * Ant Design theme konfiguratsioon kasutades meie design tokens.
 *
 * @example
 * import { ConfigProvider } from 'antd'
 * import { antdTheme } from '@/design/theme'
 *
 * <ConfigProvider theme={antdTheme}>
 *   <App />
 * </ConfigProvider>
 */

import type { ThemeConfig } from 'antd'
import { tokens } from './tokens'

export const antdTheme: ThemeConfig = {
  // ═══════════════════════════════════════════════════════════════
  // GLOBAL TOKENS
  // ═══════════════════════════════════════════════════════════════
  token: {
    // Värvid
    colorPrimary: tokens.colors.primary,
    colorSuccess: tokens.colors.success,
    colorWarning: tokens.colors.warning,
    colorError: tokens.colors.error,
    colorInfo: tokens.colors.info,

    // Link
    colorLink: tokens.colors.primary,
    colorLinkHover: tokens.colors.primaryHover,
    colorLinkActive: tokens.colors.primaryActive,

    // Tekst
    colorText: tokens.colors.text.primary,
    colorTextSecondary: tokens.colors.text.secondary,
    colorTextTertiary: tokens.colors.text.tertiary,
    colorTextDisabled: tokens.colors.text.disabled,

    // Taust
    colorBgContainer: tokens.colors.bg.primary,
    colorBgLayout: tokens.colors.bg.secondary,
    colorBgElevated: tokens.colors.bg.primary,

    // Borders
    colorBorder: tokens.colors.border.primary,
    colorBorderSecondary: tokens.colors.border.secondary,

    // Typography
    fontFamily: tokens.typography.fontFamily.sans,
    fontSize: tokens.typography.fontSize.base,
    fontSizeSM: tokens.typography.fontSize.sm,
    fontSizeLG: tokens.typography.fontSize.lg,

    // Border Radius
    borderRadius: tokens.radius.md,
    borderRadiusSM: tokens.radius.base,
    borderRadiusLG: tokens.radius.lg,

    // Spacing
    padding: tokens.spacing.lg,
    paddingXS: tokens.spacing.xs,
    paddingSM: tokens.spacing.sm,
    paddingLG: tokens.spacing.xl,
    margin: tokens.spacing.lg,
    marginXS: tokens.spacing.xs,
    marginSM: tokens.spacing.sm,
    marginLG: tokens.spacing.xl,

    // Shadows
    boxShadow: tokens.shadows.base,
    boxShadowSecondary: tokens.shadows.md,

    // Motion
    motionDurationFast: '0.1s',
    motionDurationMid: '0.2s',
    motionDurationSlow: '0.3s',
  },

  // ═══════════════════════════════════════════════════════════════
  // COMPONENT TOKENS
  // ═══════════════════════════════════════════════════════════════
  components: {
    // Button
    Button: {
      controlHeight: 36,
      fontSize: tokens.typography.fontSize.sm,
      borderRadius: tokens.radius.md,
      fontWeight: tokens.typography.fontWeight.medium,
    },

    // Input
    Input: {
      controlHeight: 36,
      fontSize: tokens.typography.fontSize.sm,
      borderRadius: tokens.radius.md,
    },

    // Select
    Select: {
      controlHeight: 36,
      fontSize: tokens.typography.fontSize.sm,
      borderRadius: tokens.radius.md,
    },

    // Table
    Table: {
      headerBg: tokens.colors.bg.tertiary,
      headerColor: tokens.colors.text.secondary,
      headerSortActiveBg: tokens.colors.bg.secondary,
      rowHoverBg: tokens.colors.bg.secondary,
      borderRadius: tokens.radius.lg,
      fontSize: tokens.typography.fontSize.sm,
    },

    // Card
    Card: {
      borderRadiusLG: tokens.radius.xl,
      boxShadow: tokens.shadows.base,
      headerFontSize: tokens.typography.fontSize.lg,
    },

    // Modal
    Modal: {
      borderRadiusLG: tokens.radius.xl,
      headerBg: tokens.colors.bg.primary,
    },

    // Drawer
    Drawer: {
      borderRadiusLG: tokens.radius.xl,
    },

    // Menu
    Menu: {
      itemBg: 'transparent',
      subMenuItemBg: 'transparent',
      itemSelectedBg: tokens.colors.primaryLight,
      itemSelectedColor: tokens.colors.primary,
      itemHoverBg: tokens.colors.bg.secondary,
      borderRadius: tokens.radius.md,
    },

    // Tabs
    Tabs: {
      itemSelectedColor: tokens.colors.primary,
      itemHoverColor: tokens.colors.primaryHover,
      inkBarColor: tokens.colors.primary,
    },

    // Tag
    Tag: {
      borderRadiusSM: tokens.radius.base,
    },

    // Badge
    Badge: {
      indicatorHeight: 20,
      indicatorHeightSM: 16,
    },

    // Message
    Message: {
      contentBg: tokens.colors.bg.primary,
      borderRadiusLG: tokens.radius.lg,
    },

    // Notification
    Notification: {
      borderRadiusLG: tokens.radius.lg,
    },

    // Form
    Form: {
      labelFontSize: tokens.typography.fontSize.sm,
      verticalLabelPadding: `0 0 ${tokens.spacing.sm}px`,
    },

    // DatePicker
    DatePicker: {
      controlHeight: 36,
      fontSize: tokens.typography.fontSize.sm,
      borderRadius: tokens.radius.md,
    },

    // Pagination
    Pagination: {
      itemActiveBg: tokens.colors.primary,
      borderRadius: tokens.radius.md,
    },

    // Breadcrumb
    Breadcrumb: {
      linkColor: tokens.colors.text.secondary,
      linkHoverColor: tokens.colors.primary,
      lastItemColor: tokens.colors.text.primary,
    },

    // Steps
    Steps: {
      colorPrimary: tokens.colors.primary,
    },

    // Progress
    Progress: {
      defaultColor: tokens.colors.primary,
      remainingColor: tokens.colors.bg.tertiary,
    },

    // Tooltip
    Tooltip: {
      borderRadius: tokens.radius.md,
    },

    // Popover
    Popover: {
      borderRadiusLG: tokens.radius.lg,
    },
  },
}

// Dark theme variant (optional)
export const antdDarkTheme: ThemeConfig = {
  ...antdTheme,
  token: {
    ...antdTheme.token,
    colorBgContainer: '#141414',
    colorBgLayout: '#000000',
    colorBgElevated: '#1f1f1f',
    colorText: '#ffffff',
    colorTextSecondary: '#a6a6a6',
    colorBorder: '#434343',
    colorBorderSecondary: '#303030',
  },
}
