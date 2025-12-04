'use client'

import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronRight,
  Home,
  LayoutGrid,
  List,
  Filter,
  SortAsc,
  Plus,
  MoreHorizontal,
} from 'lucide-react'
import { Button } from '@rivest/ui'

// Context for TopBar customization
interface TopBarContextType {
  tabs: TopBarTab[]
  setTabs: (tabs: TopBarTab[]) => void
  actions: TopBarAction[]
  setActions: (actions: TopBarAction[]) => void
  viewMode: 'grid' | 'list' | null
  setViewMode: (mode: 'grid' | 'list' | null) => void
  onViewModeChange: ((mode: 'grid' | 'list') => void) | null
  setOnViewModeChange: (fn: ((mode: 'grid' | 'list') => void) | null) => void
  breadcrumbs: Breadcrumb[]
  setBreadcrumbs: (crumbs: Breadcrumb[]) => void
}

export interface TopBarTab {
  id: string
  label: string
  href?: string
  onClick?: () => void
  icon?: React.ComponentType<{ className?: string }>
  badge?: number | string
  active?: boolean
}

export interface TopBarAction {
  id: string
  label: string
  onClick: () => void
  icon?: React.ComponentType<{ className?: string }>
  variant?: 'default' | 'outline' | 'ghost'
  primary?: boolean
}

export interface Breadcrumb {
  label: string
  href?: string
  onClick?: () => void
}

const TopBarContext = createContext<TopBarContextType | null>(null)

export function TopBarProvider({ children }: { children: ReactNode }) {
  const [tabs, setTabs] = useState<TopBarTab[]>([])
  const [actions, setActions] = useState<TopBarAction[]>([])
  const [viewMode, setViewMode] = useState<'grid' | 'list' | null>(null)
  const [onViewModeChange, setOnViewModeChange] = useState<((mode: 'grid' | 'list') => void) | null>(null)
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([])

  return (
    <TopBarContext.Provider
      value={{
        tabs,
        setTabs,
        actions,
        setActions,
        viewMode,
        setViewMode,
        onViewModeChange,
        setOnViewModeChange,
        breadcrumbs,
        setBreadcrumbs,
      }}
    >
      {children}
    </TopBarContext.Provider>
  )
}

export function useTopBar() {
  const context = useContext(TopBarContext)
  if (!context) {
    throw new Error('useTopBar must be used within TopBarProvider')
  }
  return context
}

// Hook for modules to configure TopBar
export function useConfigureTopBar({
  tabs,
  actions,
  viewMode,
  onViewModeChange,
  breadcrumbs,
}: {
  tabs?: TopBarTab[]
  actions?: TopBarAction[]
  viewMode?: 'grid' | 'list'
  onViewModeChange?: (mode: 'grid' | 'list') => void
  breadcrumbs?: Breadcrumb[]
}) {
  const topBar = useTopBar()

  useEffect(() => {
    if (tabs) topBar.setTabs(tabs)
    if (actions) topBar.setActions(actions)
    if (viewMode) topBar.setViewMode(viewMode)
    if (onViewModeChange) topBar.setOnViewModeChange(() => onViewModeChange)
    if (breadcrumbs) topBar.setBreadcrumbs(breadcrumbs)

    return () => {
      topBar.setTabs([])
      topBar.setActions([])
      topBar.setViewMode(null)
      topBar.setOnViewModeChange(null)
      topBar.setBreadcrumbs([])
    }
  }, [tabs, actions, viewMode, onViewModeChange, breadcrumbs])
}

// TopBar component
export function TopBar() {
  const pathname = usePathname()
  const { tabs, actions, viewMode, onViewModeChange, breadcrumbs } = useTopBar()

  // Don't render if no configuration
  if (tabs.length === 0 && actions.length === 0 && !viewMode && breadcrumbs.length === 0) {
    return null
  }

  return (
    <div className="bg-white border-b border-slate-200 px-4 py-2">
      <div className="flex items-center justify-between gap-4">
        {/* Left side: Tabs or Breadcrumbs */}
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1 text-sm">
              <Link href="/" className="text-slate-400 hover:text-slate-600">
                <Home className="w-4 h-4" />
              </Link>
              {breadcrumbs.map((crumb, index) => (
                <div key={index} className="flex items-center gap-1">
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className={`hover:text-[#279989] ${
                        index === breadcrumbs.length - 1
                          ? 'text-slate-900 font-medium'
                          : 'text-slate-500'
                      }`}
                    >
                      {crumb.label}
                    </Link>
                  ) : crumb.onClick ? (
                    <button
                      onClick={crumb.onClick}
                      className={`hover:text-[#279989] ${
                        index === breadcrumbs.length - 1
                          ? 'text-slate-900 font-medium'
                          : 'text-slate-500'
                      }`}
                    >
                      {crumb.label}
                    </button>
                  ) : (
                    <span
                      className={
                        index === breadcrumbs.length - 1
                          ? 'text-slate-900 font-medium'
                          : 'text-slate-500'
                      }
                    >
                      {crumb.label}
                    </span>
                  )}
                </div>
              ))}
            </nav>
          )}

          {/* Tabs */}
          {tabs.length > 0 && (
            <div className="flex items-center gap-1 overflow-x-auto scrollbar-none">
              {tabs.map((tab) => {
                const isActive = tab.active ?? (tab.href ? pathname === tab.href : false)
                const TabIcon = tab.icon

                if (tab.href) {
                  return (
                    <Link
                      key={tab.id}
                      href={tab.href}
                      className={`
                        flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap
                        transition-colors
                        ${isActive
                          ? 'bg-[#279989]/10 text-[#279989] font-medium'
                          : 'text-slate-600 hover:bg-slate-100'
                        }
                      `}
                    >
                      {TabIcon && <TabIcon className="w-4 h-4" />}
                      <span>{tab.label}</span>
                      {tab.badge !== undefined && (
                        <span className={`
                          px-1.5 py-0.5 text-xs rounded-full
                          ${isActive ? 'bg-[#279989]/20' : 'bg-slate-200'}
                        `}>
                          {tab.badge}
                        </span>
                      )}
                    </Link>
                  )
                }

                return (
                  <button
                    key={tab.id}
                    onClick={tab.onClick}
                    className={`
                      flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap
                      transition-colors
                      ${isActive
                        ? 'bg-[#279989]/10 text-[#279989] font-medium'
                        : 'text-slate-600 hover:bg-slate-100'
                      }
                    `}
                  >
                    {TabIcon && <TabIcon className="w-4 h-4" />}
                    <span>{tab.label}</span>
                    {tab.badge !== undefined && (
                      <span className={`
                        px-1.5 py-0.5 text-xs rounded-full
                        ${isActive ? 'bg-[#279989]/20' : 'bg-slate-200'}
                      `}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Right side: View mode toggle and actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* View mode toggle */}
          {viewMode && onViewModeChange && (
            <div className="flex border rounded-lg">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-1.5 rounded-l-lg transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => onViewModeChange('list')}
                className={`p-1.5 rounded-r-lg transition-colors ${
                  viewMode === 'list'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Actions */}
          {actions.map((action) => {
            const ActionIcon = action.icon
            return (
              <Button
                key={action.id}
                variant={action.variant || (action.primary ? 'default' : 'outline')}
                size="sm"
                onClick={action.onClick}
                className={action.primary ? 'bg-[#279989] hover:bg-[#1e7a6d]' : ''}
              >
                {ActionIcon && <ActionIcon className="w-4 h-4 mr-1" />}
                {action.label}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default TopBar
