'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  Users,
  File,
  Settings,
  Database,
  Bell,
  Search,
  User,
  ChevronDown,
  BarChart3,
  Menu,
  X,
  FileType,
  Trash2,
  FolderArchive,
  Warehouse,
  Package,
  ArrowRightLeft,
  Wrench,
  Table,
  Menu as MenuIcon,
} from 'lucide-react'
import { NotificationDropdown } from '@/components/notifications/notification-dropdown'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Close sidebar on route change
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Close sidebar on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSidebarOpen(false)
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [])

  // Prevent body scroll when sidebar is open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [sidebarOpen])

  const navItems = [
    { href: '/dashboard', label: 'Töölaud', icon: LayoutDashboard },
    { href: '/projects', label: 'Projektid', icon: FolderKanban },
    { href: '/invoices', label: 'Arved', icon: FileText },
    { href: '/employees', label: 'Töötajad', icon: Users },
    { href: '/documents', label: 'Dokumendid', icon: File },
    { href: '/file-vault', label: 'Failihaldus', icon: FolderArchive },
    { href: '/warehouse', label: 'Laohaldus', icon: Warehouse },
    { href: '/reports', label: 'Aruanded', icon: BarChart3 },
  ]

  const warehouseItems = [
    { href: '/warehouse', label: 'Ülevaade', icon: LayoutDashboard },
    { href: '/warehouse/warehouses', label: 'Laod', icon: Warehouse },
    { href: '/warehouse/assets', label: 'Varad', icon: Package },
    { href: '/warehouse/transfers', label: 'Ülekanded', icon: ArrowRightLeft },
    { href: '/warehouse/maintenance', label: 'Hooldused', icon: Wrench },
  ]

  const adminItems = [
    { href: '/admin/cms', label: 'CMS Haldus', icon: Database },
    { href: '/admin/templates', label: 'PDF Mallid', icon: FileType },
    { href: '/admin/ultra-tables', label: 'Tabelid', icon: Table },
    { href: '/admin/menu', label: 'Menüü', icon: MenuIcon },
    { href: '/trash', label: 'Prügikast', icon: Trash2 },
    { href: '/notifications', label: 'Teavitused', icon: Bell },
    { href: '/settings', label: 'Seaded', icon: Settings },
  ]

  return (
    <div className="min-h-screen flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          w-64 bg-slate-900 text-white flex flex-col
          transform transition-transform duration-200 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="p-4 border-b border-slate-700 flex items-center justify-between">
          <Link href="/dashboard" className="text-xl font-bold" style={{ color: '#279989' }}>
            Rivest
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.href}>
                <NavItem
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={item.href === '/dashboard' ? pathname === '/dashboard' : pathname?.startsWith(item.href)}
                />
                {/* Warehouse submenu */}
                {item.href === '/warehouse' && pathname?.startsWith('/warehouse') && (
                  <ul className="ml-4 mt-1 space-y-1 border-l border-slate-700 pl-4">
                    {warehouseItems.map((subItem) => (
                      <NavItem
                        key={subItem.href}
                        href={subItem.href}
                        label={subItem.label}
                        icon={subItem.icon}
                        active={subItem.href === '/warehouse'
                          ? pathname === '/warehouse'
                          : pathname?.startsWith(subItem.href) && subItem.href !== '/warehouse'}
                      />
                    ))}
                  </ul>
                )}
              </li>
            ))}
            <li className="pt-4 mt-4 border-t border-slate-700">
              <span className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Admin
              </span>
            </li>
            {adminItems.map((item) => (
              <li key={item.href}>
                <NavItem
                  href={item.href}
                  label={item.label}
                  icon={item.icon}
                  active={item.href === '/notifications' || item.href === '/settings'
                    ? pathname === item.href
                    : pathname?.startsWith(item.href)}
                />
              </li>
            ))}
          </ul>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center">
              <User className="w-5 h-5 text-slate-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">Admin Kasutaja</p>
              <p className="text-xs text-slate-400 truncate">admin@rivest.ee</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-slate-50 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>

            {/* Search - hidden on mobile, visible on tablet+ */}
            <div className="hidden sm:block relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Otsi..."
                className="w-48 md:w-64 pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            {/* Mobile search button */}
            <button className="sm:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors">
              <Search className="w-5 h-5 text-slate-600" />
            </button>

            <NotificationDropdown />

            {/* User menu - simplified on mobile */}
            <button className="flex items-center gap-2 p-2 sm:px-3 rounded-lg hover:bg-slate-100 transition-colors">
              <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center">
                <User className="w-4 h-4 text-slate-600" />
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 hidden sm:block" />
            </button>
          </div>
        </header>
        <div className="flex-1 p-4 lg:p-6 overflow-y-auto">{children}</div>
      </main>
    </div>
  )
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  active?: boolean
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors ${
        active
          ? 'bg-slate-800 text-white'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      }`}
    >
      <Icon className="w-5 h-5 flex-shrink-0" />
      <span className="truncate">{label}</span>
    </Link>
  )
}
