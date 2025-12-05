// =============================================
// TABLE REGISTRY - All tables in the system
// =============================================

export interface TableFeature {
  id: string
  name: string
  description: string
  enabled: boolean
  category: 'display' | 'data' | 'actions' | 'export' | 'advanced'
}

export interface TableColumn {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'status' | 'currency' | 'boolean' | 'relation' | 'json'
  sortable?: boolean
  filterable?: boolean
  visible?: boolean
}

export interface RegisteredTable {
  id: string
  name: string
  namePlural: string
  description: string
  icon: string
  category: 'core' | 'module' | 'system' | 'cms' | 'custom'
  module?: string

  // Database info
  dbTable: string
  dbSchema: 'public'

  // UI info
  uiPath?: string
  componentPath?: string
  apiPath?: string

  // Features
  features: TableFeature[]

  // Columns (discovered or defined)
  columns: TableColumn[]

  // Stats
  estimatedRows?: number
  lastUpdated?: string
}

// Default features available for all tables
export const DEFAULT_FEATURES: TableFeature[] = [
  // Display features
  { id: 'pagination', name: 'Lehekülgede loomine', description: 'Kuva andmeid lehekülgedena', enabled: true, category: 'display' },
  { id: 'search', name: 'Otsing', description: 'Võimalda otsingut tabeli sees', enabled: true, category: 'display' },
  { id: 'sorting', name: 'Sorteerimine', description: 'Võimalda veergude järgi sorteerimist', enabled: true, category: 'display' },
  { id: 'filtering', name: 'Filtreerimine', description: 'Võimalda andmete filtreerimist', enabled: true, category: 'display' },
  { id: 'column_visibility', name: 'Veergude nähtavus', description: 'Võimalda veergude peitmist/näitamist', enabled: false, category: 'display' },
  { id: 'row_selection', name: 'Ridade valik', description: 'Võimalda mitme rea valikut', enabled: true, category: 'display' },
  { id: 'virtual_scroll', name: 'Virtuaalne kerimine', description: 'Kasuta virtuaalset kerimist suurte andmehulkade jaoks', enabled: false, category: 'display' },

  // Data features
  { id: 'inline_edit', name: 'Kohapealne muutmine', description: 'Võimalda andmete muutmist otse tabelis', enabled: false, category: 'data' },
  { id: 'add_record', name: 'Lisa kirje', description: 'Võimalda uute kirjete lisamist', enabled: true, category: 'data' },
  { id: 'edit_record', name: 'Muuda kirjet', description: 'Võimalda kirjete muutmist', enabled: true, category: 'data' },
  { id: 'delete_record', name: 'Kustuta kirje', description: 'Võimalda kirjete kustutamist', enabled: true, category: 'data' },
  { id: 'soft_delete', name: 'Pehme kustutamine', description: 'Märgi kirjed kustutatuks ilma neid tegelikult eemaldamata', enabled: true, category: 'data' },
  { id: 'bulk_operations', name: 'Hulgioperatsioonid', description: 'Võimalda korraga mitme kirje töötlemist', enabled: false, category: 'data' },

  // Action features
  { id: 'row_actions', name: 'Rea tegevused', description: 'Näita tegevuste menüüd igal real', enabled: true, category: 'actions' },
  { id: 'quick_view', name: 'Kiirvaade', description: 'Võimalda kirje kiirvaatamist modaalis', enabled: false, category: 'actions' },
  { id: 'duplicate', name: 'Dubleerimine', description: 'Võimalda kirje dubleerimist', enabled: false, category: 'actions' },
  { id: 'archive', name: 'Arhiveerimine', description: 'Võimalda kirjete arhiveerimist', enabled: false, category: 'actions' },

  // Export features
  { id: 'export_csv', name: 'Eksport CSV', description: 'Võimalda andmete eksporti CSV formaadis', enabled: false, category: 'export' },
  { id: 'export_excel', name: 'Eksport Excel', description: 'Võimalda andmete eksporti Excel formaadis', enabled: false, category: 'export' },
  { id: 'export_pdf', name: 'Eksport PDF', description: 'Võimalda andmete eksporti PDF formaadis', enabled: false, category: 'export' },
  { id: 'print', name: 'Printimine', description: 'Võimalda tabeli printimist', enabled: false, category: 'export' },

  // Advanced features
  { id: 'audit_log', name: 'Auditilogi', description: 'Salvesta kõik muudatused auditilogi', enabled: false, category: 'advanced' },
  { id: 'versioning', name: 'Versioonihaldus', description: 'Hoia alles eelnevad versioonid', enabled: false, category: 'advanced' },
  { id: 'comments', name: 'Kommentaarid', description: 'Võimalda kirjetele kommentaaride lisamist', enabled: false, category: 'advanced' },
  { id: 'attachments', name: 'Manused', description: 'Võimalda failide lisamist kirjetele', enabled: false, category: 'advanced' },
  { id: 'workflow', name: 'Töövoog', description: 'Kasuta töövoo süsteemi staatuste haldamiseks', enabled: false, category: 'advanced' },
  { id: 'notifications', name: 'Teavitused', description: 'Saada teavitusi muudatuste kohta', enabled: false, category: 'advanced' },
]

// All registered tables in the system
export const TABLE_REGISTRY: RegisteredTable[] = [
  // =============================================
  // CORE TABLES
  // =============================================
  {
    id: 'tenants',
    name: 'Tenant',
    namePlural: 'Tenandid',
    description: 'Süsteemi üürnike (ettevõtete) haldus',
    icon: 'Building2',
    category: 'core',
    dbTable: 'tenants',
    dbSchema: 'public',
    uiPath: '/admin/system',
    columns: [
      { key: 'name', label: 'Nimi', type: 'text', sortable: true, filterable: true },
      { key: 'slug', label: 'Slug', type: 'text', sortable: true },
      { key: 'domain', label: 'Domeen', type: 'text' },
      { key: 'status', label: 'Staatus', type: 'status', sortable: true, filterable: true },
      { key: 'subscription_tier', label: 'Pakett', type: 'text', filterable: true },
      { key: 'max_users', label: 'Max kasutajaid', type: 'number' },
      { key: 'created_at', label: 'Loodud', type: 'date', sortable: true },
    ],
    features: [...DEFAULT_FEATURES],
  },
  {
    id: 'user_profiles',
    name: 'Kasutaja',
    namePlural: 'Kasutajad',
    description: 'Kasutajakontode haldus',
    icon: 'Users',
    category: 'core',
    dbTable: 'user_profiles',
    dbSchema: 'public',
    uiPath: '/admin/users',
    apiPath: '/api/users',
    columns: [
      { key: 'full_name', label: 'Nimi', type: 'text', sortable: true, filterable: true },
      { key: 'email', label: 'E-post', type: 'text', sortable: true, filterable: true },
      { key: 'role', label: 'Roll', type: 'status', sortable: true, filterable: true },
      { key: 'last_login_at', label: 'Viimane sisselogimine', type: 'date', sortable: true },
      { key: 'created_at', label: 'Loodud', type: 'date', sortable: true },
    ],
    features: [...DEFAULT_FEATURES],
  },

  // =============================================
  // PROJECTS MODULE
  // =============================================
  {
    id: 'projects',
    name: 'Projekt',
    namePlural: 'Projektid',
    description: 'Projektide haldus ja jälgimine',
    icon: 'FolderKanban',
    category: 'module',
    module: 'projects',
    dbTable: 'projects',
    dbSchema: 'public',
    uiPath: '/projects',
    apiPath: '/api/projects',
    componentPath: '/components/projects/projects-table.tsx',
    columns: [
      { key: 'code', label: 'Kood', type: 'text', sortable: true, filterable: true },
      { key: 'name', label: 'Nimi', type: 'text', sortable: true, filterable: true },
      { key: 'status', label: 'Staatus', type: 'status', sortable: true, filterable: true },
      { key: 'client_id', label: 'Klient', type: 'relation' },
      { key: 'budget', label: 'Eelarve', type: 'currency', sortable: true },
      { key: 'start_date', label: 'Alguskuupäev', type: 'date', sortable: true },
      { key: 'end_date', label: 'Lõppkuupäev', type: 'date', sortable: true },
      { key: 'created_at', label: 'Loodud', type: 'date', sortable: true },
    ],
    features: [
      ...DEFAULT_FEATURES.map(f =>
        ['workflow', 'audit_log', 'attachments', 'comments'].includes(f.id)
          ? { ...f, enabled: true }
          : f
      ),
    ],
  },

  // =============================================
  // PARTNERS MODULE
  // =============================================
  {
    id: 'companies',
    name: 'Ettevõte',
    namePlural: 'Ettevõtted',
    description: 'Partnerite, klientide ja tarnijate haldus',
    icon: 'Building',
    category: 'module',
    module: 'partners',
    dbTable: 'companies',
    dbSchema: 'public',
    uiPath: '/partners',
    apiPath: '/api/partners',
    columns: [
      { key: 'name', label: 'Nimi', type: 'text', sortable: true, filterable: true },
      { key: 'registry_code', label: 'Registrikood', type: 'text', sortable: true },
      { key: 'type', label: 'Tüüp', type: 'status', sortable: true, filterable: true },
      { key: 'email', label: 'E-post', type: 'text' },
      { key: 'phone', label: 'Telefon', type: 'text' },
      { key: 'city', label: 'Linn', type: 'text', filterable: true },
      { key: 'created_at', label: 'Loodud', type: 'date', sortable: true },
    ],
    features: [...DEFAULT_FEATURES],
  },
  {
    id: 'company_contacts',
    name: 'Kontakt',
    namePlural: 'Kontaktid',
    description: 'Ettevõtete kontaktisikud',
    icon: 'UserPlus',
    category: 'module',
    module: 'partners',
    dbTable: 'company_contacts',
    dbSchema: 'public',
    uiPath: '/partners/[id]',
    apiPath: '/api/partners/[id]/contacts',
    columns: [
      { key: 'first_name', label: 'Eesnimi', type: 'text', sortable: true },
      { key: 'last_name', label: 'Perenimi', type: 'text', sortable: true },
      { key: 'email', label: 'E-post', type: 'text' },
      { key: 'phone', label: 'Telefon', type: 'text' },
      { key: 'position', label: 'Ametikoht', type: 'text' },
      { key: 'is_primary', label: 'Põhikontakt', type: 'boolean' },
    ],
    features: [...DEFAULT_FEATURES],
  },
  {
    id: 'company_roles',
    name: 'Ettevõtte roll',
    namePlural: 'Ettevõtete rollid',
    description: 'Ettevõtete rollid ja seosed',
    icon: 'Link',
    category: 'module',
    module: 'partners',
    dbTable: 'company_roles',
    dbSchema: 'public',
    columns: [
      { key: 'role', label: 'Roll', type: 'status', sortable: true, filterable: true },
      { key: 'is_active', label: 'Aktiivne', type: 'boolean' },
      { key: 'credit_limit', label: 'Krediidilimiit', type: 'currency' },
      { key: 'payment_term_days', label: 'Maksetähtaeg', type: 'number' },
    ],
    features: [...DEFAULT_FEATURES],
  },

  // =============================================
  // QUOTES MODULE
  // =============================================
  {
    id: 'quotes',
    name: 'Pakkumine',
    namePlural: 'Pakkumised',
    description: 'Hinnapakkumiste haldus',
    icon: 'Receipt',
    category: 'module',
    module: 'quotes',
    dbTable: 'quotes',
    dbSchema: 'public',
    uiPath: '/quotes',
    apiPath: '/api/quotes',
    columns: [
      { key: 'quote_number', label: 'Number', type: 'text', sortable: true },
      { key: 'title', label: 'Pealkiri', type: 'text', sortable: true, filterable: true },
      { key: 'status', label: 'Staatus', type: 'status', sortable: true, filterable: true },
      { key: 'company_id', label: 'Klient', type: 'relation' },
      { key: 'total', label: 'Kokku', type: 'currency', sortable: true },
      { key: 'valid_until', label: 'Kehtib kuni', type: 'date', sortable: true },
      { key: 'created_at', label: 'Loodud', type: 'date', sortable: true },
    ],
    features: [
      ...DEFAULT_FEATURES.map(f =>
        ['export_pdf', 'duplicate', 'workflow'].includes(f.id)
          ? { ...f, enabled: true }
          : f
      ),
    ],
  },
  {
    id: 'quote_items',
    name: 'Pakkumise rida',
    namePlural: 'Pakkumise read',
    description: 'Pakkumiste read',
    icon: 'List',
    category: 'module',
    module: 'quotes',
    dbTable: 'quote_items',
    dbSchema: 'public',
    columns: [
      { key: 'name', label: 'Nimetus', type: 'text', sortable: true },
      { key: 'quantity', label: 'Kogus', type: 'number', sortable: true },
      { key: 'unit', label: 'Ühik', type: 'text' },
      { key: 'unit_price', label: 'Ühikuhind', type: 'currency', sortable: true },
      { key: 'total', label: 'Kokku', type: 'currency', sortable: true },
    ],
    features: [...DEFAULT_FEATURES],
  },
  {
    id: 'quote_articles',
    name: 'Artikkel',
    namePlural: 'Artiklid',
    description: 'Korduvkasutatavad pakkumiste artiklid',
    icon: 'Package',
    category: 'module',
    module: 'quotes',
    dbTable: 'quote_articles',
    dbSchema: 'public',
    uiPath: '/quotes/articles',
    apiPath: '/api/quotes/articles',
    columns: [
      { key: 'code', label: 'Kood', type: 'text', sortable: true },
      { key: 'name', label: 'Nimetus', type: 'text', sortable: true, filterable: true },
      { key: 'category', label: 'Kategooria', type: 'text', filterable: true },
      { key: 'unit', label: 'Ühik', type: 'text' },
      { key: 'default_price', label: 'Hind', type: 'currency', sortable: true },
      { key: 'is_active', label: 'Aktiivne', type: 'boolean' },
    ],
    features: [...DEFAULT_FEATURES],
  },
  {
    id: 'quote_units',
    name: 'Ühik',
    namePlural: 'Ühikud',
    description: 'Mõõtühikud',
    icon: 'Ruler',
    category: 'module',
    module: 'quotes',
    dbTable: 'quote_units',
    dbSchema: 'public',
    uiPath: '/quotes/units',
    apiPath: '/api/quotes/units',
    columns: [
      { key: 'code', label: 'Kood', type: 'text', sortable: true },
      { key: 'name', label: 'Nimetus', type: 'text', sortable: true },
      { key: 'symbol', label: 'Sümbol', type: 'text' },
      { key: 'category', label: 'Kategooria', type: 'text', filterable: true },
    ],
    features: [...DEFAULT_FEATURES],
  },
  {
    id: 'inquiries',
    name: 'Päring',
    namePlural: 'Päringud',
    description: 'Pakkumise päringud',
    icon: 'Mail',
    category: 'module',
    module: 'quotes',
    dbTable: 'inquiries',
    dbSchema: 'public',
    uiPath: '/quotes/inquiries',
    apiPath: '/api/quotes/inquiries',
    columns: [
      { key: 'inquiry_number', label: 'Number', type: 'text', sortable: true },
      { key: 'subject', label: 'Teema', type: 'text', sortable: true, filterable: true },
      { key: 'status', label: 'Staatus', type: 'status', sortable: true, filterable: true },
      { key: 'priority', label: 'Prioriteet', type: 'status', sortable: true, filterable: true },
      { key: 'company_id', label: 'Ettevõte', type: 'relation' },
      { key: 'received_at', label: 'Saabunud', type: 'date', sortable: true },
    ],
    features: [...DEFAULT_FEATURES],
  },

  // =============================================
  // INVOICES MODULE
  // =============================================
  {
    id: 'invoices',
    name: 'Arve',
    namePlural: 'Arved',
    description: 'Arvete haldus',
    icon: 'FileText',
    category: 'module',
    module: 'invoices',
    dbTable: 'invoices',
    dbSchema: 'public',
    uiPath: '/invoices',
    apiPath: '/api/invoices',
    columns: [
      { key: 'invoice_number', label: 'Arve nr', type: 'text', sortable: true },
      { key: 'type', label: 'Tüüp', type: 'status', sortable: true, filterable: true },
      { key: 'status', label: 'Staatus', type: 'status', sortable: true, filterable: true },
      { key: 'company_id', label: 'Klient', type: 'relation' },
      { key: 'total', label: 'Kokku', type: 'currency', sortable: true },
      { key: 'issue_date', label: 'Kuupäev', type: 'date', sortable: true },
      { key: 'due_date', label: 'Maksetähtaeg', type: 'date', sortable: true },
    ],
    features: [
      ...DEFAULT_FEATURES.map(f =>
        ['export_pdf', 'workflow', 'audit_log'].includes(f.id)
          ? { ...f, enabled: true }
          : f
      ),
    ],
  },

  // =============================================
  // PERSONNEL MODULE
  // =============================================
  {
    id: 'employees',
    name: 'Töötaja',
    namePlural: 'Töötajad',
    description: 'Töötajate haldus',
    icon: 'Users',
    category: 'module',
    module: 'personnel',
    dbTable: 'employees',
    dbSchema: 'public',
    uiPath: '/personnel/employees',
    apiPath: '/api/personnel/employees',
    columns: [
      { key: 'employee_code', label: 'Kood', type: 'text', sortable: true },
      { key: 'first_name', label: 'Eesnimi', type: 'text', sortable: true },
      { key: 'last_name', label: 'Perenimi', type: 'text', sortable: true },
      { key: 'email', label: 'E-post', type: 'text' },
      { key: 'position', label: 'Ametikoht', type: 'text', filterable: true },
      { key: 'department', label: 'Osakond', type: 'text', filterable: true },
      { key: 'status', label: 'Staatus', type: 'status', sortable: true, filterable: true },
    ],
    features: [...DEFAULT_FEATURES],
  },

  // =============================================
  // WAREHOUSE MODULE
  // =============================================
  {
    id: 'warehouse_assets',
    name: 'Vara',
    namePlural: 'Varad',
    description: 'Lao varade haldus',
    icon: 'Package',
    category: 'module',
    module: 'warehouse',
    dbTable: 'warehouse_assets',
    dbSchema: 'public',
    uiPath: '/warehouse/assets',
    apiPath: '/api/warehouse/assets',
    componentPath: '/components/warehouse/AssetsTable.tsx',
    columns: [
      { key: 'code', label: 'Kood', type: 'text', sortable: true },
      { key: 'name', label: 'Nimetus', type: 'text', sortable: true, filterable: true },
      { key: 'category', label: 'Kategooria', type: 'text', filterable: true },
      { key: 'status', label: 'Staatus', type: 'status', sortable: true, filterable: true },
      { key: 'quantity', label: 'Kogus', type: 'number', sortable: true },
      { key: 'warehouse_id', label: 'Ladu', type: 'relation', filterable: true },
    ],
    features: [
      ...DEFAULT_FEATURES.map(f =>
        ['bulk_operations', 'export_csv'].includes(f.id)
          ? { ...f, enabled: true }
          : f
      ),
    ],
  },
  {
    id: 'warehouse_transfers',
    name: 'Ülekanne',
    namePlural: 'Ülekanded',
    description: 'Lao ülekanded',
    icon: 'ArrowRightLeft',
    category: 'module',
    module: 'warehouse',
    dbTable: 'warehouse_transfers',
    dbSchema: 'public',
    uiPath: '/warehouse/transfers',
    apiPath: '/api/warehouse/transfers',
    columns: [
      { key: 'transfer_number', label: 'Number', type: 'text', sortable: true },
      { key: 'status', label: 'Staatus', type: 'status', sortable: true, filterable: true },
      { key: 'from_warehouse_id', label: 'Laost', type: 'relation' },
      { key: 'to_warehouse_id', label: 'Lattu', type: 'relation' },
      { key: 'created_at', label: 'Loodud', type: 'date', sortable: true },
    ],
    features: [...DEFAULT_FEATURES],
  },

  // =============================================
  // DOCUMENTS MODULE
  // =============================================
  {
    id: 'documents',
    name: 'Dokument',
    namePlural: 'Dokumendid',
    description: 'Dokumentide haldus',
    icon: 'File',
    category: 'module',
    module: 'documents',
    dbTable: 'documents',
    dbSchema: 'public',
    uiPath: '/documents',
    apiPath: '/api/documents',
    columns: [
      { key: 'name', label: 'Nimi', type: 'text', sortable: true, filterable: true },
      { key: 'type', label: 'Tüüp', type: 'status', sortable: true, filterable: true },
      { key: 'category', label: 'Kategooria', type: 'text', filterable: true },
      { key: 'file_size', label: 'Suurus', type: 'number', sortable: true },
      { key: 'project_id', label: 'Projekt', type: 'relation' },
      { key: 'created_at', label: 'Loodud', type: 'date', sortable: true },
    ],
    features: [...DEFAULT_FEATURES],
  },

  // =============================================
  // CMS TABLES
  // =============================================
  {
    id: 'dynamic_fields',
    name: 'Dünaamiline väli',
    namePlural: 'Dünaamilised väljad',
    description: 'Kohandatavad lisaväljad',
    icon: 'Sliders',
    category: 'cms',
    dbTable: 'dynamic_fields',
    dbSchema: 'public',
    uiPath: '/admin/cms',
    columns: [
      { key: 'key', label: 'Võti', type: 'text', sortable: true },
      { key: 'label', label: 'Nimi', type: 'text', sortable: true },
      { key: 'type', label: 'Tüüp', type: 'text', sortable: true, filterable: true },
      { key: 'entity_type', label: 'Olem', type: 'text', filterable: true },
      { key: 'required', label: 'Kohustuslik', type: 'boolean' },
      { key: 'is_active', label: 'Aktiivne', type: 'boolean' },
    ],
    features: [...DEFAULT_FEATURES],
  },
  {
    id: 'workflows',
    name: 'Töövoog',
    namePlural: 'Töövood',
    description: 'Töövoo definitsioonid',
    icon: 'GitBranch',
    category: 'cms',
    dbTable: 'workflows',
    dbSchema: 'public',
    uiPath: '/admin/cms',
    columns: [
      { key: 'name', label: 'Nimi', type: 'text', sortable: true },
      { key: 'entity_type', label: 'Olem', type: 'text', filterable: true },
      { key: 'initial_state', label: 'Algstaatus', type: 'text' },
      { key: 'is_active', label: 'Aktiivne', type: 'boolean' },
    ],
    features: [...DEFAULT_FEATURES],
  },
  {
    id: 'notification_rules',
    name: 'Teavitusreegel',
    namePlural: 'Teavitusreeglid',
    description: 'Automaatsed teavitused',
    icon: 'Bell',
    category: 'cms',
    dbTable: 'notification_rules',
    dbSchema: 'public',
    columns: [
      { key: 'name', label: 'Nimi', type: 'text', sortable: true },
      { key: 'entity_type', label: 'Olem', type: 'text', filterable: true },
      { key: 'trigger_type', label: 'Päästik', type: 'text', filterable: true },
      { key: 'is_active', label: 'Aktiivne', type: 'boolean' },
    ],
    features: [...DEFAULT_FEATURES],
  },

  // =============================================
  // SYSTEM TABLES
  // =============================================
  {
    id: 'audit_log',
    name: 'Auditi kirje',
    namePlural: 'Auditilogi',
    description: 'Süsteemi auditilogi',
    icon: 'History',
    category: 'system',
    dbTable: 'audit_log',
    dbSchema: 'public',
    uiPath: '/admin/logs',
    columns: [
      { key: 'action', label: 'Tegevus', type: 'text', sortable: true, filterable: true },
      { key: 'entity_type', label: 'Olem', type: 'text', sortable: true, filterable: true },
      { key: 'entity_id', label: 'Olemi ID', type: 'text' },
      { key: 'user_id', label: 'Kasutaja', type: 'relation' },
      { key: 'created_at', label: 'Aeg', type: 'date', sortable: true },
    ],
    features: DEFAULT_FEATURES.map(f =>
      ['add_record', 'edit_record', 'delete_record', 'inline_edit'].includes(f.id)
        ? { ...f, enabled: false }
        : f
    ),
  },
  {
    id: 'notification_log',
    name: 'Teavituse logi',
    namePlural: 'Teavituste logi',
    description: 'Saadetud teavituste logi',
    icon: 'Mail',
    category: 'system',
    dbTable: 'notification_log',
    dbSchema: 'public',
    columns: [
      { key: 'channel', label: 'Kanal', type: 'text', filterable: true },
      { key: 'recipient', label: 'Saaja', type: 'text' },
      { key: 'subject', label: 'Teema', type: 'text' },
      { key: 'status', label: 'Staatus', type: 'status', sortable: true, filterable: true },
      { key: 'created_at', label: 'Aeg', type: 'date', sortable: true },
    ],
    features: DEFAULT_FEATURES.map(f =>
      ['add_record', 'edit_record', 'delete_record', 'inline_edit'].includes(f.id)
        ? { ...f, enabled: false }
        : f
    ),
  },

  // =============================================
  // ULTRA TABLES (Custom)
  // =============================================
  {
    id: 'ultra_tables',
    name: 'Ultra tabel',
    namePlural: 'Ultra tabelid',
    description: 'Kohandatavad dünaamilised tabelid',
    icon: 'Table',
    category: 'custom',
    dbTable: 'ultra_tables',
    dbSchema: 'public',
    uiPath: '/admin/ultra-tables',
    apiPath: '/api/ultra-tables',
    columns: [
      { key: 'name', label: 'Nimi', type: 'text', sortable: true },
      { key: 'description', label: 'Kirjeldus', type: 'text' },
      { key: 'icon', label: 'Ikoon', type: 'text' },
      { key: 'created_at', label: 'Loodud', type: 'date', sortable: true },
    ],
    features: [
      ...DEFAULT_FEATURES.map(f =>
        ['virtual_scroll', 'column_visibility', 'inline_edit', 'bulk_operations', 'export_csv', 'export_excel'].includes(f.id)
          ? { ...f, enabled: true }
          : f
      ),
    ],
  },
]

// Helper functions
export function getTableById(id: string): RegisteredTable | undefined {
  return TABLE_REGISTRY.find(t => t.id === id)
}

export function getTablesByCategory(category: RegisteredTable['category']): RegisteredTable[] {
  return TABLE_REGISTRY.filter(t => t.category === category)
}

export function getTablesByModule(module: string): RegisteredTable[] {
  return TABLE_REGISTRY.filter(t => t.module === module)
}

export function getAllModules(): string[] {
  const modules = new Set<string>()
  TABLE_REGISTRY.forEach(t => {
    if (t.module) modules.add(t.module)
  })
  return Array.from(modules)
}

export function getEnabledFeatures(tableId: string): TableFeature[] {
  const table = getTableById(tableId)
  return table?.features.filter(f => f.enabled) || []
}

export function getFeaturesByCategory(tableId: string, category: TableFeature['category']): TableFeature[] {
  const table = getTableById(tableId)
  return table?.features.filter(f => f.category === category) || []
}
