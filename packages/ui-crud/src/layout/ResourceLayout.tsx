'use client'

import React from 'react'
import { clsx } from 'clsx'
import { ResourceNavigation, type ResourceNavigationProps } from './ResourceNavigation'

// ============ TYPES ============

export interface ResourceLayoutProps extends ResourceNavigationProps {
  /** Child content */
  children: React.ReactNode
  /** Show navigation sidebar */
  showNavigation?: boolean
  /** Whether navigation is collapsed by default */
  navigationCollapsed?: boolean
  /** Additional CSS classes for main content area */
  contentClassName?: string
  /** Fixed header content */
  header?: React.ReactNode
  /** Top notification bar */
  notification?: React.ReactNode
}

// ============ COMPONENT ============

export function ResourceLayout({
  children,
  showNavigation = true,
  navigationCollapsed = false,
  contentClassName,
  header,
  notification,
  // Navigation props
  logo,
  prependItems,
  appendItems,
  resourceFilter,
  resourceTransform,
  footer,
  userProfile,
  appTitle,
}: ResourceLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification bar */}
      {notification && (
        <div className="fixed top-0 left-0 right-0 z-50">
          {notification}
        </div>
      )}

      {/* Navigation sidebar */}
      {showNavigation && (
        <ResourceNavigation
          logo={logo}
          prependItems={prependItems}
          appendItems={appendItems}
          resourceFilter={resourceFilter}
          resourceTransform={resourceTransform}
          footer={footer}
          defaultCollapsed={navigationCollapsed}
          userProfile={userProfile}
          appTitle={appTitle}
        />
      )}

      {/* Main content area */}
      <div
        className={clsx(
          'transition-all',
          showNavigation && (navigationCollapsed ? 'lg:pl-16' : 'lg:pl-64'),
          notification && 'pt-12' // Space for notification bar
        )}
      >
        {/* Fixed header */}
        {header && (
          <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
            {header}
          </header>
        )}

        {/* Page content */}
        <main className={clsx('p-4 md:p-6 lg:p-8', contentClassName)}>
          {children}
        </main>
      </div>
    </div>
  )
}

// ============ HEADER COMPONENT ============

export interface ResourceHeaderProps {
  /** Left side content (usually breadcrumbs or title) */
  left?: React.ReactNode
  /** Center content */
  center?: React.ReactNode
  /** Right side content (usually actions or user menu) */
  right?: React.ReactNode
  /** Additional CSS classes */
  className?: string
}

export function ResourceHeader({
  left,
  center,
  right,
  className,
}: ResourceHeaderProps) {
  return (
    <div className={clsx('flex items-center justify-between h-16 px-4 md:px-6 lg:px-8', className)}>
      <div className="flex items-center gap-4">
        {left}
      </div>
      {center && (
        <div className="flex-1 flex items-center justify-center">
          {center}
        </div>
      )}
      <div className="flex items-center gap-4">
        {right}
      </div>
    </div>
  )
}

// ============ BREADCRUMBS ============

export interface BreadcrumbItem {
  label: string
  href?: string
}

export interface ResourceBreadcrumbsProps {
  items: BreadcrumbItem[]
}

export function ResourceBreadcrumbs({ items }: ResourceBreadcrumbsProps) {
  return (
    <nav className="flex items-center gap-2 text-sm">
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <span className="text-gray-400">/</span>}
          {item.href ? (
            <a
              href={item.href}
              className="text-gray-500 hover:text-gray-700 hover:underline"
            >
              {item.label}
            </a>
          ) : (
            <span className="text-gray-900 font-medium">{item.label}</span>
          )}
        </React.Fragment>
      ))}
    </nav>
  )
}

// ============ PAGE CONTAINER ============

export interface PageContainerProps {
  /** Child content */
  children: React.ReactNode
  /** Maximum width constraint */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  /** Additional CSS classes */
  className?: string
}

export function PageContainer({
  children,
  maxWidth = 'full',
  className,
}: PageContainerProps) {
  const maxWidthClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
    '2xl': 'max-w-7xl',
    full: 'max-w-full',
  }

  return (
    <div className={clsx('mx-auto', maxWidthClasses[maxWidth], className)}>
      {children}
    </div>
  )
}

// ============ CARD COMPONENT ============

export interface CardProps {
  children: React.ReactNode
  title?: string
  description?: string
  actions?: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function Card({
  children,
  title,
  description,
  actions,
  className,
  padding = 'md',
}: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4 md:p-6',
    lg: 'p-6 md:p-8',
  }

  return (
    <div className={clsx('bg-white rounded-lg border border-gray-200 shadow-sm', className)}>
      {(title || description || actions) && (
        <div className="flex items-start justify-between gap-4 px-4 py-3 md:px-6 md:py-4 border-b border-gray-200">
          <div>
            {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
            {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      <div className={paddingClasses[padding]}>
        {children}
      </div>
    </div>
  )
}

export default ResourceLayout
