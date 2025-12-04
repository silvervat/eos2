/**
 * Supabase Database Types
 * Auto-generated based on database migrations
 * Last updated: 2024-12-04
 */

// ============================================
// COMMON TYPES
// ============================================

export type UUID = string
export type Timestamp = string
export type Json = Record<string, unknown> | unknown[] | string | number | boolean | null

export interface TimestampFields {
  created_at: Timestamp
  updated_at: Timestamp
}

export interface SoftDeleteFields {
  deleted_at: Timestamp | null
}

export interface TenantFields {
  tenant_id: UUID
}

// ============================================
// TENANTS
// ============================================

export interface Tenant extends TimestampFields, SoftDeleteFields {
  id: UUID
  name: string
  slug: string
  domain: string | null
  logo_url: string | null
  primary_color: string
  secondary_color: string
  settings: Json
  features: Json
  max_users: number
  max_projects: number
  max_storage_gb: number
  status: 'active' | 'inactive' | 'suspended'
  subscription_tier: 'basic' | 'pro' | 'enterprise'
  trial_ends_at: Timestamp | null
  subscription_starts_at: Timestamp | null
  subscription_ends_at: Timestamp | null
  billing_email: string | null
}

export type TenantInsert = Omit<Tenant, 'id' | 'created_at' | 'updated_at'>
export type TenantUpdate = Partial<TenantInsert>

// ============================================
// USER PROFILES
// ============================================

export interface UserProfile extends TimestampFields, SoftDeleteFields, TenantFields {
  id: UUID
  auth_user_id: UUID
  email: string
  full_name: string | null
  avatar_url: string | null
  role: 'admin' | 'manager' | 'user' | 'viewer'
  permissions: string[]
  settings: Json
  last_login_at: Timestamp | null
}

export type UserProfileInsert = Omit<UserProfile, 'id' | 'created_at' | 'updated_at'>
export type UserProfileUpdate = Partial<UserProfileInsert>

// ============================================
// COMPANIES
// ============================================

export type CompanyType = 'client' | 'supplier' | 'subcontractor' | 'partner' | 'manufacturer'

export interface Company extends TimestampFields, SoftDeleteFields, TenantFields {
  id: UUID
  registry_code: string | null
  vat_number: string | null
  name: string
  type: CompanyType
  email: string | null
  phone: string | null
  address: string | null
  city: string | null
  country: string
  bank_account: string | null
  payment_term_days: number
  credit_limit: number | null
  notes: string | null
  metadata: Json
}

export type CompanyInsert = Omit<Company, 'id' | 'created_at' | 'updated_at'>
export type CompanyUpdate = Partial<CompanyInsert>

// ============================================
// COMPANY CONTACTS
// ============================================

export interface CompanyContact extends TimestampFields, SoftDeleteFields, TenantFields {
  id: UUID
  company_id: UUID
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  mobile: string | null
  position: string | null
  department: string | null
  is_primary: boolean
  is_billing_contact: boolean
  notes: string | null
  metadata: Json
}

export type CompanyContactInsert = Omit<CompanyContact, 'id' | 'created_at' | 'updated_at'>
export type CompanyContactUpdate = Partial<CompanyContactInsert>

// ============================================
// COMPANY ROLES
// ============================================

export type CompanyRoleType = 'client' | 'supplier' | 'subcontractor' | 'partner' | 'manufacturer'

export interface CompanyRole extends TimestampFields, TenantFields {
  id: UUID
  company_id: UUID
  role: CompanyRoleType
  is_active: boolean
  started_at: string | null
  ended_at: string | null
  credit_limit: number | null
  payment_term_days: number | null
  discount_percent: number | null
  notes: string | null
  metadata: Json
}

export type CompanyRoleInsert = Omit<CompanyRole, 'id' | 'created_at' | 'updated_at'>
export type CompanyRoleUpdate = Partial<CompanyRoleInsert>

// ============================================
// PROJECTS
// ============================================

export type ProjectStatus = 'draft' | 'active' | 'on_hold' | 'completed' | 'cancelled'

export interface Project extends TimestampFields, SoftDeleteFields, TenantFields {
  id: UUID
  code: string
  name: string
  description: string | null
  client_id: UUID | null
  status: ProjectStatus
  budget: number | null
  currency: string
  start_date: string | null
  end_date: string | null
  address: string | null
  city: string | null
  country: string
  manager_id: UUID | null
  metadata: Json
}

export type ProjectInsert = Omit<Project, 'id' | 'created_at' | 'updated_at'>
export type ProjectUpdate = Partial<ProjectInsert>

// ============================================
// INVOICES
// ============================================

export type InvoiceType = 'sales' | 'purchase' | 'credit'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'

export interface Invoice extends TimestampFields, SoftDeleteFields, TenantFields {
  id: UUID
  invoice_number: string
  type: InvoiceType
  status: InvoiceStatus
  project_id: UUID | null
  company_id: UUID | null
  issue_date: string
  due_date: string
  subtotal: number
  vat_amount: number
  total: number
  currency: string
  paid_amount: number
  paid_at: Timestamp | null
  notes: string | null
  line_items: Json
  metadata: Json
}

export type InvoiceInsert = Omit<Invoice, 'id' | 'created_at' | 'updated_at'>
export type InvoiceUpdate = Partial<InvoiceInsert>

// ============================================
// EMPLOYEES
// ============================================

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'intern'
export type EmployeeStatus = 'active' | 'inactive' | 'on_leave' | 'terminated'

export interface Employee extends TimestampFields, SoftDeleteFields, TenantFields {
  id: UUID
  employee_code: string
  first_name: string
  last_name: string
  full_name: string
  email: string | null
  phone: string | null
  personal_code: string | null
  position: string | null
  department: string | null
  department_id: UUID | null
  manager_id: UUID | null
  employment_type: EmploymentType
  start_date: string | null
  end_date: string | null
  hourly_rate: number | null
  monthly_rate: number | null
  status: EmployeeStatus
  metadata: Json
}

export type EmployeeInsert = Omit<Employee, 'id' | 'created_at' | 'updated_at'>
export type EmployeeUpdate = Partial<EmployeeInsert>

// ============================================
// DOCUMENTS
// ============================================

export interface Document extends TimestampFields, SoftDeleteFields, TenantFields {
  id: UUID
  project_id: UUID | null
  name: string
  type: string
  category: string | null
  file_path: string
  file_size: number | null
  mime_type: string | null
  description: string | null
  version: number
  uploaded_by: UUID | null
  metadata: Json
}

export type DocumentInsert = Omit<Document, 'id' | 'created_at' | 'updated_at'>
export type DocumentUpdate = Partial<DocumentInsert>

// ============================================
// AUDIT LOG
// ============================================

export interface AuditLog {
  id: UUID
  tenant_id: UUID
  user_id: UUID | null
  action: string
  entity_type: string
  entity_id: UUID
  old_values: Json | null
  new_values: Json | null
  ip_address: string | null
  user_agent: string | null
  created_at: Timestamp
}

export type AuditLogInsert = Omit<AuditLog, 'id' | 'created_at'>

// ============================================
// QUOTE ARTICLES
// ============================================

export interface QuoteArticle extends TimestampFields, SoftDeleteFields, TenantFields {
  id: UUID
  code: string
  name: string
  description: string | null
  category: string | null
  unit: string
  default_price: number | null
  cost_price: number | null
  vat_rate: number
  is_active: boolean
  metadata: Json
}

export type QuoteArticleInsert = Omit<QuoteArticle, 'id' | 'created_at' | 'updated_at'>
export type QuoteArticleUpdate = Partial<QuoteArticleInsert>

// ============================================
// QUOTE UNITS
// ============================================

export type UnitCategory = 'length' | 'area' | 'volume' | 'weight' | 'time' | 'quantity'

export interface QuoteUnit extends TimestampFields, SoftDeleteFields, TenantFields {
  id: UUID
  code: string
  name: string
  name_plural: string | null
  symbol: string | null
  is_default: boolean
  category: UnitCategory | null
  base_unit_id: UUID | null
  conversion_factor: number
}

export type QuoteUnitInsert = Omit<QuoteUnit, 'id' | 'created_at' | 'updated_at'>
export type QuoteUnitUpdate = Partial<QuoteUnitInsert>

// ============================================
// INQUIRIES
// ============================================

export type InquiryStatus = 'new' | 'in_progress' | 'quoted' | 'won' | 'lost' | 'cancelled'
export type InquiryPriority = 'low' | 'normal' | 'high' | 'urgent'
export type InquirySource = 'email' | 'phone' | 'web' | 'referral'

export interface Inquiry extends TimestampFields, SoftDeleteFields, TenantFields {
  id: UUID
  inquiry_number: string
  company_id: UUID | null
  contact_id: UUID | null
  project_id: UUID | null
  subject: string
  description: string | null
  status: InquiryStatus
  priority: InquiryPriority
  source: InquirySource | null
  received_at: Timestamp
  response_deadline: Timestamp | null
  assigned_to: UUID | null
  notes: string | null
  attachments: Json
  metadata: Json
}

export type InquiryInsert = Omit<Inquiry, 'id' | 'created_at' | 'updated_at'>
export type InquiryUpdate = Partial<InquiryInsert>

// ============================================
// QUOTES
// ============================================

export type QuoteStatus = 'draft' | 'sent' | 'viewed' | 'accepted' | 'rejected' | 'expired' | 'revised'

export interface Quote extends TimestampFields, SoftDeleteFields, TenantFields {
  id: UUID
  quote_number: string
  revision: number
  inquiry_id: UUID | null
  company_id: UUID | null
  contact_id: UUID | null
  project_id: UUID | null
  title: string
  description: string | null
  status: QuoteStatus
  valid_until: string | null
  sent_at: Timestamp | null
  viewed_at: Timestamp | null
  responded_at: Timestamp | null
  subtotal: number
  discount_amount: number
  discount_percent: number
  vat_amount: number
  total: number
  currency: string
  terms_and_conditions: string | null
  notes: string | null
  internal_notes: string | null
  created_by: UUID | null
  metadata: Json
}

export type QuoteInsert = Omit<Quote, 'id' | 'created_at' | 'updated_at'>
export type QuoteUpdate = Partial<QuoteInsert>

// ============================================
// QUOTE ITEMS
// ============================================

export interface QuoteItem extends TimestampFields {
  id: UUID
  quote_id: UUID
  article_id: UUID | null
  position: number
  code: string | null
  name: string
  description: string | null
  quantity: number
  unit: string
  unit_price: number
  discount_percent: number
  vat_rate: number
  subtotal: number
  vat_amount: number
  total: number
  notes: string | null
  metadata: Json
}

export type QuoteItemInsert = Omit<QuoteItem, 'id' | 'created_at' | 'updated_at'>
export type QuoteItemUpdate = Partial<QuoteItemInsert>

// ============================================
// PROJECT COMPANIES
// ============================================

export type ProjectCompanyRole = 'client' | 'subcontractor' | 'supplier' | 'consultant'

export interface ProjectCompany {
  id: UUID
  project_id: UUID
  company_id: UUID
  role: ProjectCompanyRole
  contract_value: number | null
  notes: string | null
  created_at: Timestamp
}

export type ProjectCompanyInsert = Omit<ProjectCompany, 'id' | 'created_at'>

// ============================================
// CONTACT PROJECTS
// ============================================

export type ContactProjectRole = 'project_manager' | 'site_manager' | 'architect' | 'engineer'

export interface ContactProject {
  id: UUID
  contact_id: UUID
  project_id: UUID
  role: ContactProjectRole | null
  is_primary: boolean
  notes: string | null
  created_at: Timestamp
}

export type ContactProjectInsert = Omit<ContactProject, 'id' | 'created_at'>

// ============================================
// FILE VAULT
// ============================================

export interface FileVault extends TimestampFields, SoftDeleteFields, TenantFields {
  id: UUID
  name: string
  description: string | null
  config: Json
  quota_bytes: number
  used_bytes: number
  created_by: UUID
}

export type FileVaultInsert = Omit<FileVault, 'id' | 'created_at' | 'updated_at'>
export type FileVaultUpdate = Partial<FileVaultInsert>

// ============================================
// FILE FOLDERS
// ============================================

export interface FileFolder extends TimestampFields, SoftDeleteFields {
  id: UUID
  vault_id: UUID
  parent_id: UUID | null
  name: string
  path: string
  color: string | null
  icon: string | null
  metadata: Json
  is_public: boolean
  owner_id: UUID | null
  created_by: UUID
  updated_by: UUID | null
  deleted_by: UUID | null
}

export type FileFolderInsert = Omit<FileFolder, 'id' | 'created_at' | 'updated_at'>
export type FileFolderUpdate = Partial<FileFolderInsert>

// ============================================
// FILES
// ============================================

export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface File extends TimestampFields, SoftDeleteFields {
  id: UUID
  vault_id: UUID
  folder_id: UUID | null
  name: string
  path: string
  mime_type: string
  size_bytes: number
  extension: string | null
  storage_provider: string
  storage_bucket: string
  storage_path: string | null
  storage_key: string | null
  checksum_md5: string | null
  checksum_sha256: string | null
  width: number | null
  height: number | null
  duration: number | null
  exif_data: Json | null
  camera_make: string | null
  camera_model: string | null
  lens: string | null
  iso: number | null
  aperture: string | null
  shutter_speed: string | null
  focal_length: string | null
  taken_at: Timestamp | null
  gps_latitude: number | null
  gps_longitude: number | null
  gps_location: string | null
  thumbnail_small: string | null
  thumbnail_medium: string | null
  thumbnail_large: string | null
  preview_url: string | null
  processing_status: ProcessingStatus
  processing_error: string | null
  metadata: Json
  tags: string[]
  searchable_text: string | null
  version: number
  is_latest: boolean
  parent_version_id: UUID | null
  is_public: boolean
  owner_id: UUID | null
  is_starred: boolean
  is_trashed: boolean
  trashed_at: Timestamp | null
  created_by: UUID
  updated_by: UUID | null
  deleted_by: UUID | null
}

export type FileInsert = Omit<File, 'id' | 'created_at' | 'updated_at'>
export type FileUpdate = Partial<FileInsert>

// ============================================
// FILE SHARES
// ============================================

export interface FileShare {
  id: UUID
  vault_id: UUID
  file_id: UUID | null
  folder_id: UUID | null
  short_code: string
  password_hash: string | null
  allow_download: boolean
  allow_upload: boolean
  expires_at: Timestamp | null
  download_limit: number | null
  downloads_count: number
  last_accessed_at: Timestamp | null
  access_count: number
  access_ips: Json
  title: string | null
  message: string | null
  created_at: Timestamp
  created_by: UUID
}

export type FileShareInsert = Omit<FileShare, 'id' | 'created_at'>
export type FileShareUpdate = Partial<FileShareInsert>

// ============================================
// FILE VERSIONS
// ============================================

export interface FileVersion {
  id: UUID
  file_id: UUID
  version: number
  storage_path: string
  size_bytes: number
  checksum_sha256: string
  mime_type: string
  change_description: string | null
  created_at: Timestamp
  created_by: UUID
}

export type FileVersionInsert = Omit<FileVersion, 'id' | 'created_at'>

// ============================================
// FILE ACCESSES
// ============================================

export type FileAccessAction = 'view' | 'download' | 'upload' | 'edit' | 'delete' | 'share'

export interface FileAccess {
  id: UUID
  file_id: UUID | null
  folder_id: UUID | null
  share_id: UUID | null
  action: FileAccessAction
  details: Json
  user_id: UUID | null
  user_email: string | null
  ip_address: string | null
  user_agent: string | null
  bytes_transferred: number
  created_at: Timestamp
}

export type FileAccessInsert = Omit<FileAccess, 'id' | 'created_at'>

// ============================================
// FILE TAGS
// ============================================

export interface FileTag {
  id: UUID
  file_id: UUID
  tag: string
  created_at: Timestamp
  created_by: UUID | null
}

export type FileTagInsert = Omit<FileTag, 'id' | 'created_at'>

// ============================================
// LEAVE TYPES
// ============================================

export interface LeaveType extends TimestampFields {
  id: UUID
  tenant_id: UUID | null
  code: string
  name: string
  description: string | null
  days_per_year: number | null
  requires_approval: boolean
  requires_document: boolean
  requires_substitute: boolean
  min_notice_days: number
  max_consecutive_days: number | null
  allow_carryover: boolean
  carryover_max_days: number
  is_paid: boolean
  affects_balance: boolean
  color: string
  icon: string | null
  is_active: boolean
  sort_order: number
}

export type LeaveTypeInsert = Omit<LeaveType, 'id' | 'created_at' | 'updated_at'>
export type LeaveTypeUpdate = Partial<LeaveTypeInsert>

// ============================================
// LEAVE REQUESTS
// ============================================

export type LeaveRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export interface LeaveRequest extends TimestampFields, TenantFields {
  id: UUID
  employee_id: UUID
  leave_type_id: UUID
  start_date: string
  end_date: string
  working_days: number
  calendar_days: number
  is_half_day: boolean
  half_day_type: string | null
  reason: string | null
  notes: string | null
  substitute_id: UUID | null
  documents: Json
  attachment_urls: string[] | null
  status: LeaveRequestStatus
  manager_id: UUID | null
  manager_approved_at: Timestamp | null
  manager_notes: string | null
  hr_id: UUID | null
  hr_approved_at: Timestamp | null
  hr_notes: string | null
  approved_by: UUID | null
  approved_at: Timestamp | null
  rejected_by: UUID | null
  rejected_at: Timestamp | null
  rejection_reason: string | null
  cancelled_at: Timestamp | null
  cancelled_by: UUID | null
  cancellation_reason: string | null
  metadata: Json
  created_by: UUID | null
}

export type LeaveRequestInsert = Omit<LeaveRequest, 'id' | 'created_at' | 'updated_at' | 'calendar_days'>
export type LeaveRequestUpdate = Partial<LeaveRequestInsert>

// ============================================
// LEAVE BALANCES
// ============================================

export interface LeaveBalance extends TimestampFields, TenantFields {
  id: UUID
  employee_id: UUID
  leave_type_id: UUID
  year: number
  total_days: number
  used_days: number
  planned_days: number
  remaining_days: number
  opening_balance: number
  earned: number
  taken: number
  pending: number
  closing_balance: number
  carryover_days: number
  adjustment_days: number
  adjustment_reason: string | null
  last_calculated_at: Timestamp | null
}

export type LeaveBalanceInsert = Omit<LeaveBalance, 'id' | 'created_at' | 'updated_at' | 'remaining_days' | 'closing_balance'>
export type LeaveBalanceUpdate = Partial<LeaveBalanceInsert>

// ============================================
// LEAVE AUDIT LOG
// ============================================

export type LeaveAuditAction = 'created' | 'approved' | 'rejected' | 'modified' | 'cancelled'

export interface LeaveAuditLog extends TenantFields {
  id: UUID
  leave_request_id: UUID
  action: LeaveAuditAction
  performed_by: UUID
  performed_at: Timestamp
  old_values: Json | null
  new_values: Json | null
  reason: string | null
  comment: string | null
  ip_address: string | null
  user_agent: string | null
  created_at: Timestamp
}

export type LeaveAuditLogInsert = Omit<LeaveAuditLog, 'id' | 'created_at' | 'performed_at'>

// ============================================
// ATTENDANCE RECORDS
// ============================================

export type AttendanceStatus = 'active' | 'paused' | 'completed'

export interface AttendanceRecord extends TenantFields {
  id: UUID
  employee_id: UUID
  project_id: UUID | null
  date: string
  check_in: Timestamp
  check_out: Timestamp | null
  status: AttendanceStatus
  total_minutes: number | null
  break_minutes: number
  overtime_minutes: number
  location_check_in: Json | null
  location_check_out: Json | null
  notes: string | null
  metadata: Json
  created_at: Timestamp
  updated_at: Timestamp
}

export type AttendanceRecordInsert = Omit<AttendanceRecord, 'id' | 'created_at' | 'updated_at'>
export type AttendanceRecordUpdate = Partial<AttendanceRecordInsert>

// ============================================
// HOLIDAYS
// ============================================

export interface Holiday extends TimestampFields {
  id: UUID
  tenant_id: UUID | null
  date: string
  name: string
  name_en: string | null
  is_public: boolean
  is_working_day: boolean
  country_code: string
  region_code: string | null
  year: number
  metadata: Json
}

export type HolidayInsert = Omit<Holiday, 'id' | 'created_at' | 'updated_at'>
export type HolidayUpdate = Partial<HolidayInsert>

// ============================================
// NOTIFICATIONS
// ============================================

export type NotificationType = 'leave_approved' | 'leave_rejected' | 'leave_request_pending' | 'leave_substitute_assigned' | 'system'
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent'

export interface Notification extends TenantFields {
  id: UUID
  employee_id: UUID
  type: NotificationType
  title: string
  message: string
  entity_type: string | null
  entity_id: UUID | null
  priority: NotificationPriority
  is_read: boolean
  read_at: Timestamp | null
  created_at: Timestamp
}

export type NotificationInsert = Omit<Notification, 'id' | 'created_at'>
export type NotificationUpdate = Partial<NotificationInsert>

// ============================================
// WAREHOUSE
// ============================================

export interface Warehouse extends TimestampFields, SoftDeleteFields, TenantFields {
  id: UUID
  code: string
  name: string
  description: string | null
  address: string | null
  city: string | null
  country: string
  manager_id: UUID | null
  is_active: boolean
  metadata: Json
}

export type WarehouseInsert = Omit<Warehouse, 'id' | 'created_at' | 'updated_at'>
export type WarehouseUpdate = Partial<WarehouseInsert>

// ============================================
// WAREHOUSE CATEGORIES
// ============================================

export interface WarehouseCategory extends TimestampFields, SoftDeleteFields, TenantFields {
  id: UUID
  parent_id: UUID | null
  code: string
  name: string
  description: string | null
  icon: string | null
  color: string | null
  sort_order: number
  metadata: Json
}

export type WarehouseCategoryInsert = Omit<WarehouseCategory, 'id' | 'created_at' | 'updated_at'>
export type WarehouseCategoryUpdate = Partial<WarehouseCategoryInsert>

// ============================================
// WAREHOUSE ASSETS
// ============================================

export type AssetStatus = 'available' | 'in_use' | 'maintenance' | 'retired' | 'lost'

export interface WarehouseAsset extends TimestampFields, SoftDeleteFields, TenantFields {
  id: UUID
  warehouse_id: UUID | null
  category_id: UUID | null
  code: string
  name: string
  description: string | null
  serial_number: string | null
  barcode: string | null
  status: AssetStatus
  quantity: number
  min_quantity: number
  unit: string
  purchase_price: number | null
  purchase_date: string | null
  warranty_expires: string | null
  location: string | null
  notes: string | null
  images: string[]
  metadata: Json
}

export type WarehouseAssetInsert = Omit<WarehouseAsset, 'id' | 'created_at' | 'updated_at'>
export type WarehouseAssetUpdate = Partial<WarehouseAssetInsert>

// ============================================
// DATABASE TYPE HELPERS
// ============================================

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: Tenant
        Insert: TenantInsert
        Update: TenantUpdate
      }
      user_profiles: {
        Row: UserProfile
        Insert: UserProfileInsert
        Update: UserProfileUpdate
      }
      companies: {
        Row: Company
        Insert: CompanyInsert
        Update: CompanyUpdate
      }
      company_contacts: {
        Row: CompanyContact
        Insert: CompanyContactInsert
        Update: CompanyContactUpdate
      }
      company_roles: {
        Row: CompanyRole
        Insert: CompanyRoleInsert
        Update: CompanyRoleUpdate
      }
      projects: {
        Row: Project
        Insert: ProjectInsert
        Update: ProjectUpdate
      }
      invoices: {
        Row: Invoice
        Insert: InvoiceInsert
        Update: InvoiceUpdate
      }
      employees: {
        Row: Employee
        Insert: EmployeeInsert
        Update: EmployeeUpdate
      }
      documents: {
        Row: Document
        Insert: DocumentInsert
        Update: DocumentUpdate
      }
      audit_log: {
        Row: AuditLog
        Insert: AuditLogInsert
        Update: never
      }
      quote_articles: {
        Row: QuoteArticle
        Insert: QuoteArticleInsert
        Update: QuoteArticleUpdate
      }
      quote_units: {
        Row: QuoteUnit
        Insert: QuoteUnitInsert
        Update: QuoteUnitUpdate
      }
      inquiries: {
        Row: Inquiry
        Insert: InquiryInsert
        Update: InquiryUpdate
      }
      quotes: {
        Row: Quote
        Insert: QuoteInsert
        Update: QuoteUpdate
      }
      quote_items: {
        Row: QuoteItem
        Insert: QuoteItemInsert
        Update: QuoteItemUpdate
      }
      file_vaults: {
        Row: FileVault
        Insert: FileVaultInsert
        Update: FileVaultUpdate
      }
      file_folders: {
        Row: FileFolder
        Insert: FileFolderInsert
        Update: FileFolderUpdate
      }
      files: {
        Row: File
        Insert: FileInsert
        Update: FileUpdate
      }
      file_shares: {
        Row: FileShare
        Insert: FileShareInsert
        Update: FileShareUpdate
      }
      file_versions: {
        Row: FileVersion
        Insert: FileVersionInsert
        Update: never
      }
      file_accesses: {
        Row: FileAccess
        Insert: FileAccessInsert
        Update: never
      }
      file_tags: {
        Row: FileTag
        Insert: FileTagInsert
        Update: never
      }
      leave_types: {
        Row: LeaveType
        Insert: LeaveTypeInsert
        Update: LeaveTypeUpdate
      }
      leave_requests: {
        Row: LeaveRequest
        Insert: LeaveRequestInsert
        Update: LeaveRequestUpdate
      }
      leave_balances: {
        Row: LeaveBalance
        Insert: LeaveBalanceInsert
        Update: LeaveBalanceUpdate
      }
      leave_audit_log: {
        Row: LeaveAuditLog
        Insert: LeaveAuditLogInsert
        Update: never
      }
      attendance_records: {
        Row: AttendanceRecord
        Insert: AttendanceRecordInsert
        Update: AttendanceRecordUpdate
      }
      holidays: {
        Row: Holiday
        Insert: HolidayInsert
        Update: HolidayUpdate
      }
      notifications: {
        Row: Notification
        Insert: NotificationInsert
        Update: NotificationUpdate
      }
      warehouses: {
        Row: Warehouse
        Insert: WarehouseInsert
        Update: WarehouseUpdate
      }
      warehouse_categories: {
        Row: WarehouseCategory
        Insert: WarehouseCategoryInsert
        Update: WarehouseCategoryUpdate
      }
      warehouse_assets: {
        Row: WarehouseAsset
        Insert: WarehouseAssetInsert
        Update: WarehouseAssetUpdate
      }
    }
  }
}

// ============================================
// UTILITY TYPES
// ============================================

/** Extract table names from Database */
export type TableName = keyof Database['public']['Tables']

/** Get Row type for a table */
export type TableRow<T extends TableName> = Database['public']['Tables'][T]['Row']

/** Get Insert type for a table */
export type TableInsert<T extends TableName> = Database['public']['Tables'][T]['Insert']

/** Get Update type for a table */
export type TableUpdate<T extends TableName> = Database['public']['Tables'][T]['Update']

/** Pagination params */
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

/** Cursor pagination params */
export interface CursorParams {
  cursor?: string
  limit?: number
  direction?: 'forward' | 'backward'
}

/** Sort params */
export interface SortParams {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

/** Filter params */
export interface FilterParams {
  search?: string
  status?: string
  from?: string
  to?: string
  [key: string]: string | undefined
}

/** List response */
export interface ListResponse<T> {
  data: T[]
  total: number
  page: number
  limit: number
  totalPages: number
}

/** Cursor list response */
export interface CursorListResponse<T> {
  data: T[]
  nextCursor: string | null
  prevCursor: string | null
  hasMore: boolean
}
