/**
 * React Query Key Factory
 * Centralized query key management for consistent caching
 */

// ============================================
// QUERY KEY FACTORY
// ============================================

export const queryKeys = {
  // Companies / Partners
  companies: {
    all: ['companies'] as const,
    lists: () => [...queryKeys.companies.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.companies.lists(), filters] as const,
    details: () => [...queryKeys.companies.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.companies.details(), id] as const,
    contacts: (id: string) => [...queryKeys.companies.detail(id), 'contacts'] as const,
    roles: (id: string) => [...queryKeys.companies.detail(id), 'roles'] as const,
    projects: (id: string) => [...queryKeys.companies.detail(id), 'projects'] as const,
    invoices: (id: string) => [...queryKeys.companies.detail(id), 'invoices'] as const,
  },

  // Projects
  projects: {
    all: ['projects'] as const,
    lists: () => [...queryKeys.projects.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.projects.lists(), filters] as const,
    details: () => [...queryKeys.projects.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.projects.details(), id] as const,
    members: (id: string) => [...queryKeys.projects.detail(id), 'members'] as const,
    documents: (id: string) => [...queryKeys.projects.detail(id), 'documents'] as const,
    invoices: (id: string) => [...queryKeys.projects.detail(id), 'invoices'] as const,
  },

  // Quotes
  quotes: {
    all: ['quotes'] as const,
    lists: () => [...queryKeys.quotes.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.quotes.lists(), filters] as const,
    details: () => [...queryKeys.quotes.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.quotes.details(), id] as const,
    items: (id: string) => [...queryKeys.quotes.detail(id), 'items'] as const,
    statistics: () => [...queryKeys.quotes.all, 'statistics'] as const,
  },

  // Quote Articles
  quoteArticles: {
    all: ['quote-articles'] as const,
    lists: () => [...queryKeys.quoteArticles.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.quoteArticles.lists(), filters] as const,
    details: () => [...queryKeys.quoteArticles.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.quoteArticles.details(), id] as const,
  },

  // Quote Units
  quoteUnits: {
    all: ['quote-units'] as const,
    lists: () => [...queryKeys.quoteUnits.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.quoteUnits.lists(), filters] as const,
  },

  // Inquiries
  inquiries: {
    all: ['inquiries'] as const,
    lists: () => [...queryKeys.inquiries.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.inquiries.lists(), filters] as const,
    details: () => [...queryKeys.inquiries.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.inquiries.details(), id] as const,
  },

  // Employees
  employees: {
    all: ['employees'] as const,
    lists: () => [...queryKeys.employees.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.employees.lists(), filters] as const,
    details: () => [...queryKeys.employees.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.employees.details(), id] as const,
    attendance: (id: string) => [...queryKeys.employees.detail(id), 'attendance'] as const,
    leaves: (id: string) => [...queryKeys.employees.detail(id), 'leaves'] as const,
  },

  // Attendance
  attendance: {
    all: ['attendance'] as const,
    lists: () => [...queryKeys.attendance.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.attendance.lists(), filters] as const,
    today: () => [...queryKeys.attendance.all, 'today'] as const,
    current: () => [...queryKeys.attendance.all, 'current'] as const,
    monthly: (year: number, month: number) => [...queryKeys.attendance.all, 'monthly', year, month] as const,
  },

  // Leave Requests
  leaveRequests: {
    all: ['leave-requests'] as const,
    lists: () => [...queryKeys.leaveRequests.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.leaveRequests.lists(), filters] as const,
    details: () => [...queryKeys.leaveRequests.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.leaveRequests.details(), id] as const,
    pending: () => [...queryKeys.leaveRequests.all, 'pending'] as const,
    upcoming: () => [...queryKeys.leaveRequests.all, 'upcoming'] as const,
    current: () => [...queryKeys.leaveRequests.all, 'current'] as const,
  },

  // Leave Types
  leaveTypes: {
    all: ['leave-types'] as const,
    lists: () => [...queryKeys.leaveTypes.all, 'list'] as const,
    active: () => [...queryKeys.leaveTypes.all, 'active'] as const,
  },

  // Leave Balances
  leaveBalances: {
    all: ['leave-balances'] as const,
    byEmployee: (employeeId: string) => [...queryKeys.leaveBalances.all, employeeId] as const,
    byYear: (employeeId: string, year: number) => [...queryKeys.leaveBalances.byEmployee(employeeId), year] as const,
  },

  // Holidays
  holidays: {
    all: ['holidays'] as const,
    byYear: (year: number) => [...queryKeys.holidays.all, year] as const,
    range: (startDate: string, endDate: string) => [...queryKeys.holidays.all, 'range', startDate, endDate] as const,
  },

  // File Vault
  fileVault: {
    all: ['file-vault'] as const,
    vaults: () => [...queryKeys.fileVault.all, 'vaults'] as const,
    vault: (id: string) => [...queryKeys.fileVault.vaults(), id] as const,
    folders: (vaultId: string) => [...queryKeys.fileVault.vault(vaultId), 'folders'] as const,
    folder: (folderId: string) => [...queryKeys.fileVault.all, 'folder', folderId] as const,
    files: (folderId: string | null) => [...queryKeys.fileVault.all, 'files', folderId ?? 'root'] as const,
    filesInfinite: (folderId: string | null) => [...queryKeys.fileVault.files(folderId), 'infinite'] as const,
    file: (id: string) => [...queryKeys.fileVault.all, 'file', id] as const,
    search: (query: string) => [...queryKeys.fileVault.all, 'search', query] as const,
    stats: () => [...queryKeys.fileVault.all, 'stats'] as const,
  },

  // Warehouse
  warehouse: {
    all: ['warehouse'] as const,
    locations: () => [...queryKeys.warehouse.all, 'locations'] as const,
    location: (id: string) => [...queryKeys.warehouse.locations(), id] as const,
    categories: () => [...queryKeys.warehouse.all, 'categories'] as const,
    category: (id: string) => [...queryKeys.warehouse.categories(), id] as const,
    assets: () => [...queryKeys.warehouse.all, 'assets'] as const,
    assetsList: (filters: Record<string, unknown>) => [...queryKeys.warehouse.assets(), 'list', filters] as const,
    asset: (id: string) => [...queryKeys.warehouse.assets(), id] as const,
    lowStock: () => [...queryKeys.warehouse.all, 'low-stock'] as const,
    stats: () => [...queryKeys.warehouse.all, 'stats'] as const,
  },

  // Invoices
  invoices: {
    all: ['invoices'] as const,
    lists: () => [...queryKeys.invoices.all, 'list'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.invoices.lists(), filters] as const,
    details: () => [...queryKeys.invoices.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.invoices.details(), id] as const,
    overdue: () => [...queryKeys.invoices.all, 'overdue'] as const,
    stats: () => [...queryKeys.invoices.all, 'stats'] as const,
  },

  // Notifications
  notifications: {
    all: ['notifications'] as const,
    unread: () => [...queryKeys.notifications.all, 'unread'] as const,
    list: (filters: Record<string, unknown>) => [...queryKeys.notifications.all, 'list', filters] as const,
    count: () => [...queryKeys.notifications.all, 'count'] as const,
  },

  // User / Auth
  user: {
    all: ['user'] as const,
    current: () => [...queryKeys.user.all, 'current'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
    settings: () => [...queryKeys.user.all, 'settings'] as const,
  },

  // Dashboard
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => [...queryKeys.dashboard.all, 'stats'] as const,
    recentActivity: () => [...queryKeys.dashboard.all, 'recent-activity'] as const,
    widgets: () => [...queryKeys.dashboard.all, 'widgets'] as const,
  },
} as const

// ============================================
// TYPE HELPERS
// ============================================

/** Generic query key type */
export type QueryKey = readonly unknown[]
