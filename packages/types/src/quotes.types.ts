// =============================================
// QUOTES SYSTEM TYPES
// =============================================
// Comprehensive types for the quote management system
// Supports bilingual content (ET/EN) and full workflow

// =============================================
// Translatable Types
// =============================================

export interface TranslatableText {
  et: string
  en: string
}

// =============================================
// Quote Status Types
// =============================================

export type QuoteStatus =
  | 'draft'      // Mustand - being created
  | 'pending'    // Ootel - waiting for review
  | 'sent'       // Saadetud - sent to client
  | 'viewed'     // Vaadatud - client viewed
  | 'accepted'   // Kinnitatud - client accepted
  | 'rejected'   // Tagasi lükatud - client rejected
  | 'expired'    // Aegunud - past valid_until date
  | 'revised'    // Uuendatud - new revision created

export type InquiryStatus =
  | 'new'         // Uus - just received
  | 'in_progress' // Töös - being processed
  | 'quoted'      // Pakkumine tehtud - quote created
  | 'won'         // Võidetud - won the contract
  | 'lost'        // Kaotatud - lost to competitor
  | 'cancelled'   // Tühistatud - cancelled

export type InquiryPriority = 'low' | 'normal' | 'high' | 'urgent'
export type InquirySource = 'email' | 'phone' | 'web' | 'referral' | 'other'

// =============================================
// Unit Types
// =============================================

export type UnitCategory =
  | 'quantity'  // Kogus (tk, pcs)
  | 'length'    // Pikkus (m, cm, mm)
  | 'area'      // Pindala (m², cm²)
  | 'volume'    // Maht (m³, l)
  | 'weight'    // Kaal (kg, t, g)
  | 'time'      // Aeg (h, min, d)

export interface QuoteUnit {
  id: string
  code: string
  name: TranslatableText
  namePlural: TranslatableText
  symbol: TranslatableText
  category: UnitCategory
  isDefault: boolean
  sortOrder: number
  isActive: boolean
  baseUnitId?: string
  conversionFactor: number
  createdAt: string
  updatedAt: string
}

export interface QuoteUnitCreateInput {
  code: string
  name: TranslatableText
  namePlural?: TranslatableText
  symbol?: TranslatableText
  category: UnitCategory
  isDefault?: boolean
  sortOrder?: number
  baseUnitId?: string
  conversionFactor?: number
}

export interface QuoteUnitUpdateInput extends Partial<QuoteUnitCreateInput> {
  isActive?: boolean
}

// =============================================
// Article (Service Catalog) Types
// =============================================

export interface ArticlePriceStats {
  basePrice: number
  minPrice: number
  maxPrice: number
  avgPrice: number
  lastUsedPrice: number
  usageCount: number
  lastUsedAt?: string
  totalRevenue: number
}

export interface QuoteArticle {
  id: string
  code: string
  name: TranslatableText
  description: TranslatableText
  category: string
  unitId: string
  unitCode?: string
  unitName?: TranslatableText
  defaultPrice: number
  costPrice?: number
  vatRate: number
  priceStats: ArticlePriceStats
  isActive: boolean
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface QuoteArticleCreateInput {
  code: string
  name: TranslatableText
  description?: TranslatableText
  category?: string
  unitId: string
  defaultPrice: number
  costPrice?: number
  vatRate?: number
}

export interface QuoteArticleUpdateInput extends Partial<QuoteArticleCreateInput> {
  isActive?: boolean
}

// =============================================
// Quote Item Types
// =============================================

export interface QuoteItemGroup {
  id: string
  name: TranslatableText
  description?: TranslatableText
  sortOrder: number
  items: QuoteItem[]
}

export interface QuoteItem {
  id: string
  quoteId: string
  groupId?: string
  articleId?: string
  position: number
  code: string
  name: TranslatableText
  description?: TranslatableText
  quantity: number
  unitId: string
  unitCode: string
  unitPrice: number
  discountPercent: number
  vatRate: number
  subtotal: number
  vatAmount: number
  total: number
  notes?: TranslatableText
  metadata?: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export interface QuoteItemCreateInput {
  groupId?: string
  articleId?: string
  position?: number
  code: string
  name: TranslatableText
  description?: TranslatableText
  quantity: number
  unitId: string
  unitPrice: number
  discountPercent?: number
  vatRate?: number
  notes?: TranslatableText
}

export interface QuoteItemUpdateInput extends Partial<QuoteItemCreateInput> {}

// =============================================
// Quote Types
// =============================================

export type QuoteLanguage = 'et' | 'en'

export interface Quote {
  id: string
  tenantId: string
  quoteNumber: string
  year: number
  sequenceNumber: number
  revisionNumber: number

  // Relations
  inquiryId?: string
  companyId?: string
  companyName?: string
  contactId?: string
  contactName?: string
  contactEmail?: string
  projectId?: string
  projectName?: string

  // Content
  title: string
  description?: string
  language: QuoteLanguage

  // Status & Dates
  status: QuoteStatus
  validUntil?: string
  validDays: number
  sentAt?: string
  viewedAt?: string
  respondedAt?: string
  createdAt: string
  updatedAt: string

  // Items
  groups: QuoteItemGroup[]
  itemsCount: number

  // Financials
  subtotal: number
  discountAmount: number
  discountPercent: number
  vatAmount: number
  total: number
  currency: string

  // Notes
  notes?: TranslatableText
  termsAndConditions?: TranslatableText
  internalNotes?: string

  // Files
  filesFolder?: string
  pdfUrls?: {
    et?: string
    en?: string
  }

  // Revisions
  isLatestRevision: boolean
  previousRevisionId?: string
  nextRevisionId?: string

  // Audit
  createdBy: string
  createdByName?: string
  lastModifiedBy?: string
  lastModifiedByName?: string

  metadata?: Record<string, unknown>
}

export interface QuoteCreateInput {
  inquiryId?: string
  companyId?: string
  contactId?: string
  projectId?: string
  title: string
  description?: string
  language?: QuoteLanguage
  validDays?: number
  validUntil?: string
  currency?: string
  notes?: TranslatableText
  termsAndConditions?: TranslatableText
  internalNotes?: string
}

export interface QuoteUpdateInput extends Partial<QuoteCreateInput> {
  status?: QuoteStatus
}

// =============================================
// Inquiry Types
// =============================================

export interface Inquiry {
  id: string
  tenantId: string
  inquiryNumber: string

  // Relations
  companyId?: string
  companyName?: string
  contactId?: string
  contactName?: string
  contactEmail?: string
  projectId?: string
  projectName?: string

  // Content
  subject: string
  description?: string

  // Status
  status: InquiryStatus
  priority: InquiryPriority
  source: InquirySource

  // Dates
  receivedAt: string
  responseDeadline?: string
  quotedAt?: string
  createdAt: string
  updatedAt: string

  // Assignment
  assignedTo?: string
  assignedToName?: string

  // Related
  quoteId?: string
  quoteNumber?: string

  // Files & Notes
  notes?: string
  attachments: QuoteAttachment[]

  metadata?: Record<string, unknown>
}

export interface InquiryCreateInput {
  companyId?: string
  contactId?: string
  projectId?: string
  subject: string
  description?: string
  priority?: InquiryPriority
  source?: InquirySource
  receivedAt?: string
  responseDeadline?: string
  assignedTo?: string
  notes?: string
}

export interface InquiryUpdateInput extends Partial<InquiryCreateInput> {
  status?: InquiryStatus
}

// =============================================
// Comment Types
// =============================================

export interface QuoteComment {
  id: string
  quoteId: string
  userId: string
  userName: string
  userAvatar?: string
  text: string
  mentions: string[] // User IDs mentioned with @
  attachments: QuoteAttachment[]
  isEdited: boolean
  createdAt: string
  updatedAt?: string
}

export interface QuoteCommentCreateInput {
  quoteId: string
  text: string
  mentions?: string[]
  attachments?: File[]
}

export interface QuoteCommentUpdateInput {
  text: string
  mentions?: string[]
}

// =============================================
// Attachment Types
// =============================================

export interface QuoteAttachment {
  id: string
  name: string
  url: string
  size: number
  mimeType: string
  uploadedAt: string
  uploadedBy: string
}

// =============================================
// Email Types
// =============================================

export type EmailTemplateType = 'new_quote' | 'reminder' | 'follow_up' | 'thank_you'

export interface EmailTemplate {
  id: string
  type: EmailTemplateType
  name: string
  subject: TranslatableText
  body: TranslatableText
  isDefault: boolean
}

export interface EmailDraft {
  to: string[]
  cc?: string[]
  bcc?: string[]
  subject: string
  body: string
  language: QuoteLanguage
  attachments: {
    type: 'pdf_et' | 'pdf_en' | 'file'
    filename: string
    url?: string
    file?: File
  }[]
}

export interface EmailSendInput {
  quoteId: string
  to: string[]
  cc?: string[]
  subject: string
  body: string
  language: QuoteLanguage
  attachPdfLanguages: QuoteLanguage[]
  additionalAttachments?: string[] // File URLs
}

// =============================================
// Statistics Types
// =============================================

export interface QuoteStatistics {
  totalQuotes: number
  totalValue: number
  acceptedQuotes: number
  acceptedValue: number
  rejectedQuotes: number
  rejectedValue: number
  pendingQuotes: number
  pendingValue: number
  expiredQuotes: number
  conversionRate: number // acceptedQuotes / sentQuotes * 100
  avgResponseTime: number // days
  avgQuoteValue: number
  byStatus: Record<QuoteStatus, number>
  byMonth: { month: string; count: number; value: number }[]
  topClients: { companyId: string; companyName: string; count: number; value: number }[]
  byLanguage: { et: number; en: number }
}

// =============================================
// Project Resource Types (Planning)
// =============================================

export type ResourceType = 'person' | 'equipment'

export interface ProjectResource {
  id: string
  projectId: string
  quoteId?: string
  resourceName: string
  resourceType: ResourceType
  startDate: string
  endDate: string
  allocatedHours: number
  notes?: string
  createdAt: string
}

export interface ResourceConflict {
  resourceName: string
  resourceType: ResourceType
  project1Id: string
  project1Name: string
  project2Id: string
  project2Name: string
  overlapStart: string
  overlapEnd: string
}

// =============================================
// Activity Log Types
// =============================================

export type ActivityAction =
  | 'created'
  | 'updated'
  | 'deleted'
  | 'sent'
  | 'viewed'
  | 'accepted'
  | 'rejected'
  | 'revised'
  | 'commented'
  | 'attached'

export type ActivityEntityType = 'quote' | 'inquiry' | 'article' | 'unit'

export interface ActivityLog {
  id: string
  userId: string
  userName: string
  action: ActivityAction
  entityType: ActivityEntityType
  entityId: string
  entityName?: string
  changes?: Record<string, { old: unknown; new: unknown }>
  timestamp: string
}

// =============================================
// API Response Types
// =============================================

export interface QuotesListResponse {
  quotes: Quote[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface QuoteDetailResponse {
  quote: Quote
  items: QuoteItem[]
  comments: QuoteComment[]
  revisions: {
    id: string
    revisionNumber: number
    createdAt: string
    status: QuoteStatus
  }[]
  activities: ActivityLog[]
}

export interface UnitsListResponse {
  units: QuoteUnit[]
}

export interface ArticlesListResponse {
  articles: QuoteArticle[]
  categories: string[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export interface InquiriesListResponse {
  inquiries: Inquiry[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

// =============================================
// Filter Types
// =============================================

export interface QuotesFilter {
  status?: QuoteStatus | QuoteStatus[]
  companyId?: string
  projectId?: string
  language?: QuoteLanguage
  dateFrom?: string
  dateTo?: string
  search?: string
  minValue?: number
  maxValue?: number
}

export interface InquiriesFilter {
  status?: InquiryStatus | InquiryStatus[]
  priority?: InquiryPriority | InquiryPriority[]
  source?: InquirySource
  assignedTo?: string
  companyId?: string
  dateFrom?: string
  dateTo?: string
  search?: string
}

export interface ArticlesFilter {
  category?: string
  isActive?: boolean
  search?: string
  minPrice?: number
  maxPrice?: number
}
