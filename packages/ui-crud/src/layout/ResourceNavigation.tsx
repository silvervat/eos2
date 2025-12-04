'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  type LucideIcon,
} from 'lucide-react'
import { clsx } from 'clsx'
import { getNavigationResources, type ResourceDefinition } from '@eos2/resources'

// ============ TYPES ============

export interface NavigationItem {
  /** Display label */
  label: string
  /** URL path */
  href: string
  /** Icon component */
  icon: LucideIcon
  /** Badge count (optional) */
  badge?: number
  /** Children items for nested navigation */
  children?: NavigationItem[]
  /** Whether to show in navigation */
  show?: boolean
}

export interface ResourceNavigationProps {
  /** Logo component or element */
  logo?: React.ReactNode
  /** Custom navigation items to prepend */
  prependItems?: NavigationItem[]
  /** Custom navigation items to append */
  appendItems?: NavigationItem[]
  /** Filter which resources to show */
  resourceFilter?: (resource: ResourceDefinition) => boolean
  /** Transform resources to navigation items */
  resourceTransform?: (resource: ResourceDefinition) => NavigationItem | null
  /** Footer content */
  footer?: React.ReactNode
  /** Collapsed by default on desktop */
  defaultCollapsed?: boolean
  /** User profile section */
  userProfile?: React.ReactNode
  /** Application title */
  appTitle?: string
}

// ============ NAVIGATION ITEM COMPONENT ============

interface NavItemProps {
  item: NavigationItem
  isCollapsed: boolean
  depth?: number
}

function NavItem({ item, isCollapsed, depth = 0 }: NavItemProps) {
  const pathname = usePathname()
  const [isExpanded, setIsExpanded] = useState(false)
  const hasChildren = item.children && item.children.length > 0
  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

  const Icon = item.icon

  const handleClick = (e: React.MouseEvent) => {
    if (hasChildren) {
      e.preventDefault()
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <div>
      <Link
        href={hasChildren ? '#' : item.href}
        onClick={hasChildren ? handleClick : undefined}
        className={clsx(
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
          depth > 0 && 'ml-4',
          isActive
            ? 'bg-blue-50 text-blue-700'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        )}
        title={isCollapsed ? item.label : undefined}
      >
        <Icon className="w-5 h-5 flex-shrink-0" />
        {!isCollapsed && (
          <>
            <span className="flex-1">{item.label}</span>
            {item.badge !== undefined && (
              <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600">
                {item.badge}
              </span>
            )}
            {hasChildren && (
              <ChevronRight
                className={clsx(
                  'w-4 h-4 transition-transform',
                  isExpanded && 'rotate-90'
                )}
              />
            )}
          </>
        )}
      </Link>

      {/* Children */}
      {hasChildren && isExpanded && !isCollapsed && (
        <div className="mt-1 space-y-1">
          {item.children!.map((child, index) => (
            <NavItem
              key={index}
              item={child}
              isCollapsed={isCollapsed}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ============ NAVIGATION GROUP ============

interface NavGroupProps {
  title?: string
  items: NavigationItem[]
  isCollapsed: boolean
}

function NavGroup({ title, items, isCollapsed }: NavGroupProps) {
  const visibleItems = items.filter((item) => item.show !== false)

  if (visibleItems.length === 0) return null

  return (
    <div className="space-y-1">
      {title && !isCollapsed && (
        <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          {title}
        </h3>
      )}
      {visibleItems.map((item, index) => (
        <NavItem key={index} item={item} isCollapsed={isCollapsed} />
      ))}
    </div>
  )
}

// ============ MAIN COMPONENT ============

export function ResourceNavigation({
  logo,
  prependItems = [],
  appendItems = [],
  resourceFilter,
  resourceTransform,
  footer,
  defaultCollapsed = false,
  userProfile,
  appTitle = 'EOS2',
}: ResourceNavigationProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  // Get resources and convert to navigation items
  const resources = getNavigationResources()
  const filteredResources = resourceFilter
    ? resources.filter(resourceFilter)
    : resources

  const resourceItems: NavigationItem[] = filteredResources
    .map((resource) => {
      if (resourceTransform) {
        return resourceTransform(resource)
      }
      return {
        label: resource.labelPlural,
        href: resource.basePath,
        icon: resource.icon,
        show: true,
      }
    })
    .filter((item): item is NavigationItem => item !== null)

  // Sidebar content
  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={clsx(
        'flex items-center h-16 px-4 border-b border-gray-200',
        isCollapsed ? 'justify-center' : 'justify-between'
      )}>
        {!isCollapsed && (
          <div className="flex items-center gap-3">
            {logo || (
              <span className="text-xl font-bold text-gray-900">{appTitle}</span>
            )}
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg hidden lg:block"
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Prepended items */}
        {prependItems.length > 0 && (
          <NavGroup items={prependItems} isCollapsed={isCollapsed} />
        )}

        {/* Resource items */}
        <NavGroup
          title="Ressursid"
          items={resourceItems}
          isCollapsed={isCollapsed}
        />

        {/* Appended items */}
        {appendItems.length > 0 && (
          <NavGroup items={appendItems} isCollapsed={isCollapsed} />
        )}
      </nav>

      {/* Footer */}
      {(footer || userProfile) && (
        <div className="border-t border-gray-200 p-4 space-y-4">
          {userProfile && !isCollapsed && userProfile}
          {footer && !isCollapsed && footer}
        </div>
      )}
    </div>
  )

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsMobileOpen(true)}
        className="fixed top-4 left-4 z-40 p-2 bg-white border border-gray-200 rounded-lg shadow-sm lg:hidden"
      >
        <Menu className="w-6 h-6 text-gray-600" />
      </button>

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-72 bg-white border-r border-gray-200 transform transition-transform lg:hidden',
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          onClick={() => setIsMobileOpen(false)}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={clsx(
          'hidden lg:block fixed inset-y-0 left-0 z-30 bg-white border-r border-gray-200 transition-all',
          isCollapsed ? 'w-16' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  )
}

export default ResourceNavigation
