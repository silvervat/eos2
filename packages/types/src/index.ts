// =============================================
// API Types
// =============================================

export interface ApiResponse<T> {
  data: T
  meta?: {
    total: number
    page: number
    pageSize: number
    totalPages: number
  }
}

export interface ApiError {
  code: string
  message: string
  details?: Record<string, string[]>
}

// =============================================
// Project Types
// =============================================

export type ProjectStatus = 'draft' | 'active' | 'on_hold' | 'completed' | 'cancelled' | 'archived'

export interface ProjectCreateInput {
  code: string
  name: string
  description?: string
  clientId?: string
  budget?: number
  currency?: string
  startDate?: string
  endDate?: string
  address?: string
  city?: string
  managerId?: string
}

export interface ProjectUpdateInput extends Partial<ProjectCreateInput> {
  status?: ProjectStatus
}

// =============================================
// Invoice Types
// =============================================

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export type InvoiceType = 'sales' | 'purchase'

export interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  unit: string
  unitPrice: number
  vatRate: number
  total: number
}

export interface InvoiceCreateInput {
  type: InvoiceType
  projectId?: string
  companyId?: string
  issueDate: string
  dueDate: string
  lineItems: InvoiceLineItem[]
  notes?: string
}

// =============================================
// Company Types
// =============================================

export type CompanyType = 'client' | 'supplier' | 'subcontractor'

export interface CompanyCreateInput {
  registryCode?: string
  vatNumber?: string
  name: string
  type: CompanyType
  email?: string
  phone?: string
  address?: string
  city?: string
  country?: string
  bankAccount?: string
  paymentTermDays?: number
  creditLimit?: number
  notes?: string
}

// =============================================
// Employee Types
// =============================================

export type EmploymentType = 'full_time' | 'part_time' | 'contractor'
export type EmployeeStatus = 'active' | 'inactive' | 'terminated'

export interface EmployeeCreateInput {
  employeeCode: string
  firstName: string
  lastName: string
  email?: string
  phone?: string
  personalCode?: string
  position?: string
  department?: string
  employmentType?: EmploymentType
  startDate?: string
  hourlyRate?: number
  monthlyRate?: number
}

// =============================================
// User Types
// =============================================

export type UserRole = 'admin' | 'manager' | 'user' | 'viewer'

export interface UserPermissions {
  projects: ('read' | 'create' | 'update' | 'delete')[]
  invoices: ('read' | 'create' | 'update' | 'delete' | 'approve')[]
  employees: ('read' | 'create' | 'update' | 'delete')[]
  companies: ('read' | 'create' | 'update' | 'delete')[]
  reports: ('read' | 'export')[]
  settings: ('read' | 'update')[]
}

// =============================================
// Tenant Types
// =============================================

export type TenantStatus = 'active' | 'suspended' | 'trial' | 'cancelled'
export type SubscriptionTier = 'basic' | 'pro' | 'enterprise'

export interface TenantSettings {
  language: string
  timezone: string
  currency: string
  dateFormat: string
  firstDayOfWeek: number
  businessHours?: {
    start: string
    end: string
  }
}

export interface TenantFeatures {
  ganttView: boolean
  pdfExport: boolean
  xlsxImport: boolean
  customFields: boolean
  workflowBuilder: boolean
  apiAccess: boolean
  whiteLabel: boolean
}

// =============================================
// Table Types
// =============================================

export interface SortingState {
  id: string
  desc: boolean
}

export interface PaginationState {
  pageIndex: number
  pageSize: number
}

export interface FilterState {
  id: string
  value: unknown
}

export interface TableState {
  sorting: SortingState[]
  pagination: PaginationState
  filters: FilterState[]
  globalFilter: string
}

// =============================================
// CMS Types (re-export)
// =============================================

export * from './cms.types'

// =============================================
// Warehouse Types (re-export)
// =============================================

export * from './warehouse.types'
