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
  ChevronRight,
  ChevronLeft,
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
  Building2,
  Hammer,
  ShoppingCart,
  Handshake,
  Home,
  Zap,
  UsersRound,
  ChevronsUpDown,
  PanelLeftClose,
  PanelLeft,
  Building,
  Receipt,
  Mail,
  Send,
  TrendingUp,
  Ruler,
  Clock,
  CalendarDays,
  ScanLine,
  FilePlus,
  FileCheck,
  FileMinus,
  CreditCard,
  Eye,
  WrenchIcon,
  Calendar,
  UserCheck,
  Boxes,
  ClipboardList,
  Tags,
  Truck,
  Caravan,
  HardHat,
  FileCheck2,
  Banknote,
  Shield,
  ClipboardCheck,
  MapPin,
  HardDrive,
} from 'lucide-react'
import { NotificationDropdown } from '@/components/notifications/notification-dropdown'
import { HeaderWorkTimer } from '@/components/personnel'
import { WorkSessionProvider } from '@/contexts/WorkSessionContext'

// Project types
const projectTypes = [
  { href: '/projects', label: 'Kõik', icon: FolderKanban },
  { href: '/projects/ptv', label: 'PTV', icon: Zap },
  { href: '/projects/montaaz', label: 'Montaaž', icon: Hammer },
  { href: '/projects/muuk', label: 'Müük', icon: ShoppingCart },
  { href: '/projects/vahendus', label: 'Vahendus', icon: Handshake },
  { href: '/projects/rent', label: 'Rent', icon: Home },
]

// Personnel items
const personnelItems = [
  { href: '/personnel', label: 'Ülevaade', icon: UsersRound },
  { href: '/personnel/employees', label: 'Töötajad', icon: Users },
  { href: '/personnel/work-hours', label: 'Tööaeg', icon: Clock },
  { href: '/personnel/leave', label: 'Puhkused', icon: CalendarDays },
  { href: '/personnel/groups', label: 'Grupid', icon: Building2 },
]

// Warehouse items
const warehouseItems = [
  { href: '/warehouse', label: 'Ülevaade', icon: LayoutDashboard },
  { href: '/warehouse/locations', label: 'Laod', icon: MapPin },
  { href: '/warehouse/assets', label: 'Varad', icon: Package },
  { href: '/warehouse/transfers', label: 'Ülekanded', icon: ArrowRightLeft },
  { href: '/warehouse/maintenance', label: 'Hooldused', icon: Wrench },
]

// Quotes items
const quotesItems = [
  { href: '/quotes', label: 'Kõik', icon: Receipt },
  { href: '/quotes/inquiries', label: 'Päringud', icon: Mail },
  { href: '/quotes/sent', label: 'Saadetud', icon: Send },
  { href: '/quotes/articles', label: 'Artiklid', icon: FileText },
  { href: '/quotes/units', label: 'Ühikud', icon: Ruler },
  { href: '/quotes/statistics', label: 'Statistika', icon: TrendingUp },
]

// Invoices items
const invoicesItems = [
  { href: '/invoices', label: 'Ülevaade', icon: Receipt },
  { href: '/invoices/approval', label: 'Viseerimine', icon: FileCheck },
  { href: '/invoices/scanning', label: 'Skaneerimine', icon: ScanLine },
  { href: '/invoices/received', label: 'Saabunud arved', icon: FileMinus },
  { href: '/invoices/created', label: 'Koostatud arved', icon: FilePlus },
  { href: '/invoices/payments', label: 'Tasumised', icon: CreditCard },
  { href: '/invoices/reports', label: 'Ülevaated', icon: Eye },
  { href: '/invoices/new', label: 'Arve koostamine', icon: FilePlus },
]

// Workshop items
const workshopItems = [
  { href: '/workshop', label: 'Ülevaade', icon: WrenchIcon },
  { href: '/workshop/schedule', label: 'Graafik', icon: Calendar },
  { href: '/workshop/sales', label: 'Müük', icon: ShoppingCart },
  { href: '/workshop/clients', label: 'Kliendid', icon: UserCheck },
  { href: '/workshop/units', label: 'Üksused', icon: Boxes },
  { href: '/workshop/inventory', label: 'Ladu', icon: Package },
  { href: '/workshop/orders', label: 'Tellimused', icon: ClipboardList },
  { href: '/workshop/services', label: 'Teenused & hinnakirjad', icon: Tags },
]

// Vehicles items
const vehiclesItems = [
  { href: '/vehicles', label: 'Ülevaade', icon: Truck },
  { href: '/vehicles/cars', label: 'Sõidukid', icon: Truck },
  { href: '/vehicles/trailers', label: 'Haagised', icon: Caravan },
  { href: '/vehicles/equipment', label: 'Tehnika', icon: HardHat },
  { href: '/vehicles/inspections', label: 'Ülevaatused & kindlustused', icon: FileCheck2 },
  { href: '/vehicles/leasing', label: 'Liisingud', icon: Banknote },
  { href: '/vehicles/maintenance', label: 'Hooldused', icon: Wrench },
  { href: '/vehicles/warranties', label: 'Garantiid', icon: Shield },
  { href: '/vehicles/checks', label: 'Kontrollid', icon: ClipboardCheck },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [projectsExpanded, setProjectsExpanded] = useState(false)
  const [personnelExpanded, setPersonnelExpanded] = useState(false)
  const [warehouseExpanded, setWarehouseExpanded] = useState(false)
  const [quotesExpanded, setQuotesExpanded] = useState(false)
  const [invoicesExpanded, setInvoicesExpanded] = useState(false)
  const [workshopExpanded, setWorkshopExpanded] = useState(false)
  const [vehiclesExpanded, setVehiclesExpanded] = useState(false)
  const [allExpanded, setAllExpanded] = useState(false)

  // Auto-expand menus based on current path
  useEffect(() => {
    if (pathname?.startsWith('/projects')) setProjectsExpanded(true)
    if (pathname?.startsWith('/personnel')) setPersonnelExpanded(true)
    if (pathname?.startsWith('/warehouse')) setWarehouseExpanded(true)
    if (pathname?.startsWith('/quotes')) setQuotesExpanded(true)
    if (pathname?.startsWith('/invoices')) setInvoicesExpanded(true)
    if (pathname?.startsWith('/workshop')) setWorkshopExpanded(true)
    if (pathname?.startsWith('/vehicles')) setVehiclesExpanded(true)
  }, [pathname])

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  // Toggle all submenus
  const toggleAllSubmenus = () => {
    const newState = !allExpanded
    setAllExpanded(newState)
    setProjectsExpanded(newState)
    setPersonnelExpanded(newState)
    setWarehouseExpanded(newState)
    setQuotesExpanded(newState)
    setInvoicesExpanded(newState)
    setWorkshopExpanded(newState)
    setVehiclesExpanded(newState)
  }

  // Load collapsed state from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved === 'true') setSidebarCollapsed(true)
  }, [])

  // Save collapsed state
  const toggleCollapse = () => {
    const newState = !sidebarCollapsed
    setSidebarCollapsed(newState)
    localStorage.setItem('sidebar-collapsed', String(newState))
  }

  const navItems = [
    { href: '/dashboard', label: 'Töölaud', icon: LayoutDashboard },
    { href: '/projects', label: 'Projektid', icon: FolderKanban, hasSubmenu: true, submenuKey: 'projects' },
    { href: '/partners', label: 'Partnerid', icon: Building },
    { href: '/quotes', label: 'Pakkumised', icon: Receipt, hasSubmenu: true, submenuKey: 'quotes' },
    { href: '/personnel', label: 'Personaal', icon: UsersRound, hasSubmenu: true, submenuKey: 'personnel' },
    { href: '/warehouse', label: 'Laohaldus', icon: Warehouse, hasSubmenu: true, submenuKey: 'warehouse' },
    { href: '/invoices', label: 'Arved', icon: FileText, hasSubmenu: true, submenuKey: 'invoices' },
    { href: '/workshop', label: 'Töökoda', icon: WrenchIcon, hasSubmenu: true, submenuKey: 'workshop' },
    { href: '/vehicles', label: 'Sõidukid & Tehnika', icon: Truck, hasSubmenu: true, submenuKey: 'vehicles' },
    { href: '/documents', label: 'Dokumendid', icon: File },
    { href: '/file-vault', label: 'Failid', icon: FolderArchive },
    { href: '/reports', label: 'Aruanded', icon: BarChart3 },
  ]

  const adminItems = [
    { href: '/admin/cms', label: 'CMS', icon: Database },
    { href: '/admin/templates', label: 'Mallid', icon: FileType },
    { href: '/admin/tables', label: 'Tabelid', icon: Table },
    { href: '/admin/cache', label: 'Vahemälu', icon: HardDrive },
    { href: '/trash', label: 'Prügi', icon: Trash2 },
    { href: '/notifications', label: 'Teavitused', icon: Bell },
    { href: '/settings', label: 'Seaded', icon: Settings },
  ]

  const getSubmenuItems = (key: string) => {
    if (key === 'projects') return projectTypes
    if (key === 'personnel') return personnelItems
    if (key === 'warehouse') return warehouseItems
    if (key === 'quotes') return quotesItems
    if (key === 'invoices') return invoicesItems
    if (key === 'workshop') return workshopItems
    if (key === 'vehicles') return vehiclesItems
    return []
  }

  const isSubmenuExpanded = (key: string) => {
    if (key === 'projects') return projectsExpanded
    if (key === 'personnel') return personnelExpanded
    if (key === 'warehouse') return warehouseExpanded
    if (key === 'quotes') return quotesExpanded
    if (key === 'invoices') return invoicesExpanded
    if (key === 'workshop') return workshopExpanded
    if (key === 'vehicles') return vehiclesExpanded
    return false
  }

  const toggleSubmenu = (key: string) => {
    if (key === 'projects') setProjectsExpanded(!projectsExpanded)
    if (key === 'personnel') setPersonnelExpanded(!personnelExpanded)
    if (key === 'warehouse') setWarehouseExpanded(!warehouseExpanded)
    if (key === 'quotes') setQuotesExpanded(!quotesExpanded)
    if (key === 'invoices') setInvoicesExpanded(!invoicesExpanded)
    if (key === 'workshop') setWorkshopExpanded(!workshopExpanded)
    if (key === 'vehicles') setVehiclesExpanded(!vehiclesExpanded)
  }

  return (
    <WorkSessionProvider>
    <div className="min-h-screen flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          ${sidebarCollapsed ? 'w-16' : 'w-52'}
          bg-slate-900 text-white flex flex-col
          transform transition-transform duration-150 ease-out will-change-transform
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Header */}
        <div className={`h-12 border-b border-slate-700 flex items-center ${sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-3'}`}>
          {!sidebarCollapsed && (
            <Link href="/dashboard" className="text-lg font-bold" style={{ color: '#279989' }}>
              Rivest
            </Link>
          )}
          {sidebarCollapsed && (
            <Link href="/dashboard" className="text-lg font-bold" style={{ color: '#279989' }}>
              R
            </Link>
          )}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-1 rounded hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Toggle buttons */}
        {!sidebarCollapsed && (
          <div className="px-2 py-1.5 border-b border-slate-700 flex gap-1">
            <button
              onClick={toggleAllSubmenus}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title={allExpanded ? 'Peida kõik' : 'Näita kõik'}
            >
              <ChevronsUpDown className="w-3 h-3" />
              <span>{allExpanded ? 'Peida' : 'Näita'}</span>
            </button>
            <button
              onClick={toggleCollapse}
              className="flex items-center justify-center px-2 py-1 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Voldi kokku"
            >
              <PanelLeftClose className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 py-1.5 px-1.5 overflow-y-auto">
          <ul className="space-y-0.5">
            {navItems.map((item) => (
              <li key={item.href}>
                {item.hasSubmenu ? (
                  <>
                    <button
                      onClick={() => !sidebarCollapsed && toggleSubmenu(item.submenuKey!)}
                      className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                        pathname?.startsWith(item.href)
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="w-4 h-4 flex-shrink-0" />
                        {!sidebarCollapsed && <span>{item.label}</span>}
                      </div>
                      {!sidebarCollapsed && (
                        isSubmenuExpanded(item.submenuKey!) ? (
                          <ChevronDown className="w-3 h-3" />
                        ) : (
                          <ChevronRight className="w-3 h-3" />
                        )
                      )}
                    </button>
                    {!sidebarCollapsed && isSubmenuExpanded(item.submenuKey!) && (
                      <ul className="ml-3 mt-0.5 space-y-0.5 border-l border-slate-700 pl-2">
                        {getSubmenuItems(item.submenuKey!).map((subItem) => (
                          <li key={subItem.href}>
                            <Link
                              href={subItem.href}
                              className={`flex items-center gap-2 px-2 py-1 rounded text-xs transition-colors ${
                                pathname === subItem.href || (subItem.href !== item.href && pathname?.startsWith(subItem.href))
                                  ? 'bg-slate-800 text-white'
                                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                              }`}
                            >
                              <subItem.icon className="w-3.5 h-3.5 flex-shrink-0" />
                              <span>{subItem.label}</span>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''} gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                      (item.href === '/dashboard' ? pathname === '/dashboard' : pathname?.startsWith(item.href))
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </Link>
                )}
              </li>
            ))}

            {/* Admin section */}
            <li className="pt-2 mt-2 border-t border-slate-700">
              {!sidebarCollapsed && (
                <span className="px-2 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                  Admin
                </span>
              )}
            </li>
            {adminItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center ${sidebarCollapsed ? 'justify-center' : ''} gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                    pathname?.startsWith(item.href)
                      ? 'bg-slate-800 text-white'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <item.icon className="w-4 h-4 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Collapse toggle (desktop) */}
        {sidebarCollapsed && (
          <div className="p-2 border-t border-slate-700">
            <button
              onClick={toggleCollapse}
              className="w-full flex items-center justify-center p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors"
              title="Laienda"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* User section */}
        {!sidebarCollapsed && (
          <div className="p-2 border-t border-slate-700">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center flex-shrink-0">
                <User className="w-3.5 h-3.5 text-slate-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-white truncate">Admin</p>
                <p className="text-[10px] text-slate-400 truncate">admin@rivest.ee</p>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-slate-50 flex flex-col min-w-0">
        <header className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-3 lg:px-4 flex-shrink-0">
          <div className="flex items-center gap-2">
            {/* Mobile menu button */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-1.5 -ml-1 rounded hover:bg-slate-100"
            >
              <Menu className="w-5 h-5 text-slate-600" />
            </button>

            {/* Search */}
            <div className="hidden sm:block relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Otsi..."
                className="w-40 md:w-56 pl-8 pr-3 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-[#279989] focus:border-[#279989]"
              />
            </div>

            {/* Work Timer */}
            <HeaderWorkTimer />
          </div>

          <div className="flex items-center gap-1">
            <button className="sm:hidden p-1.5 rounded hover:bg-slate-100">
              <Search className="w-4 h-4 text-slate-600" />
            </button>
            <NotificationDropdown />
            <button className="flex items-center gap-1.5 p-1.5 rounded hover:bg-slate-100">
              <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center">
                <User className="w-3.5 h-3.5 text-slate-600" />
              </div>
              <ChevronDown className="w-3 h-3 text-slate-400 hidden sm:block" />
            </button>
          </div>
        </header>
        <div className="flex-1 p-3 lg:p-4 overflow-y-auto">{children}</div>
      </main>
    </div>
    </WorkSessionProvider>
  )
}
