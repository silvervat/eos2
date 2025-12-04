import {
  FolderKanban,
  Building2,
  FileText,
  Users,
  Truck,
  Package,
  Warehouse,
  Wrench,
  ArrowRightLeft,
  FolderOpen,
  LayoutGrid,
} from 'lucide-react'
import type { ResourceDefinition } from './types'

// ============ PROJECTS ============

export const projectsResource: ResourceDefinition = {
  name: 'projects',
  label: 'Projekt',
  labelPlural: 'Projektid',
  icon: FolderKanban,
  basePath: '/projects',
  select: '*, client:clients(id, name)',

  columns: [
    { field: 'code', label: 'Kood', type: 'text', sortable: true, width: 100 },
    { field: 'name', label: 'Nimi', type: 'text', sortable: true },
    { field: 'client.name', label: 'Klient', type: 'relation', relationField: 'client.name' },
    {
      field: 'status',
      label: 'Staatus',
      type: 'status',
      sortable: true,
      width: 120,
      statusColors: {
        planning: 'blue',
        active: 'green',
        completed: 'gray',
        on_hold: 'orange',
      },
    },
    { field: 'start_date', label: 'Algus', type: 'date', sortable: true, width: 110 },
    { field: 'end_date', label: 'Lõpp', type: 'date', sortable: true, width: 110 },
    { field: 'budget', label: 'Eelarve', type: 'currency', sortable: true, width: 120 },
  ],

  fields: [
    { name: 'code', label: 'Projekti kood', type: 'text', required: true, placeholder: 'nt RM2506', span: 8 },
    { name: 'name', label: 'Projekti nimi', type: 'text', required: true, span: 16 },
    { name: 'client_id', label: 'Klient', type: 'relation', relationResource: 'clients', relationLabel: 'name', span: 12 },
    {
      name: 'status',
      label: 'Staatus',
      type: 'select',
      span: 12,
      defaultValue: 'planning',
      options: [
        { value: 'planning', label: 'Planeerimisel', color: 'blue' },
        { value: 'active', label: 'Aktiivne', color: 'green' },
        { value: 'completed', label: 'Lõpetatud', color: 'gray' },
        { value: 'on_hold', label: 'Ootel', color: 'orange' },
      ],
    },
    { name: 'location', label: 'Asukoht', type: 'text', span: 24 },
    { name: 'start_date', label: 'Alguskuupäev', type: 'date', span: 12 },
    { name: 'end_date', label: 'Lõppkuupäev', type: 'date', span: 12 },
    { name: 'budget', label: 'Eelarve (€)', type: 'currency', span: 12 },
    { name: 'description', label: 'Kirjeldus', type: 'textarea', span: 24, rows: 4 },
  ],

  filters: [
    {
      field: 'status',
      label: 'Staatus',
      type: 'multiselect',
      options: [
        { value: 'planning', label: 'Planeerimisel' },
        { value: 'active', label: 'Aktiivne' },
        { value: 'completed', label: 'Lõpetatud' },
        { value: 'on_hold', label: 'Ootel' },
      ],
    },
    { field: 'start_date', label: 'Ajavahemik', type: 'daterange' },
    { field: 'client_id', label: 'Klient', type: 'relation', relationResource: 'clients', relationLabel: 'name' },
  ],

  capabilities: {
    create: true,
    edit: true,
    delete: true,
    bulkDelete: true,
    export: true,
    show: true,
  },

  search: {
    fields: ['name', 'code', 'location'],
    placeholder: 'Otsi projekti...',
  },

  defaultSort: {
    field: 'created_at',
    order: 'desc',
  },
}

// ============ CLIENTS (COMPANIES) ============

export const clientsResource: ResourceDefinition = {
  name: 'clients',
  label: 'Klient',
  labelPlural: 'Kliendid',
  icon: Building2,
  basePath: '/clients',
  select: '*',

  columns: [
    { field: 'name', label: 'Nimi', type: 'text', sortable: true },
    { field: 'registry_code', label: 'Registrikood', type: 'text', width: 120 },
    { field: 'vat_number', label: 'KMKR', type: 'text', width: 140 },
    { field: 'email', label: 'E-post', type: 'email' },
    { field: 'phone', label: 'Telefon', type: 'phone', width: 130 },
    { field: 'contact_person', label: 'Kontaktisik', type: 'text' },
    { field: 'is_active', label: 'Aktiivne', type: 'boolean', width: 90 },
  ],

  fields: [
    { name: 'name', label: 'Ettevõtte nimi', type: 'text', required: true, span: 16 },
    { name: 'registry_code', label: 'Registrikood', type: 'text', span: 8 },
    { name: 'vat_number', label: 'KMKR number', type: 'text', span: 8, placeholder: 'EE123456789' },
    {
      name: 'country',
      label: 'Riik',
      type: 'select',
      span: 8,
      defaultValue: 'EE',
      options: [
        { value: 'EE', label: 'Eesti' },
        { value: 'FI', label: 'Soome' },
        { value: 'SE', label: 'Rootsi' },
        { value: 'LV', label: 'Läti' },
        { value: 'LT', label: 'Leedu' },
        { value: 'NO', label: 'Norra' },
        { value: 'DE', label: 'Saksamaa' },
        { value: 'PL', label: 'Poola' },
      ],
    },
    { name: 'email', label: 'E-post', type: 'email', span: 8 },
    { name: 'phone', label: 'Telefon', type: 'phone', span: 8 },
    { name: 'contact_person', label: 'Kontaktisik', type: 'text', span: 8 },
    { name: 'address', label: 'Aadress', type: 'textarea', span: 24, rows: 2 },
    { name: 'is_active', label: 'Aktiivne', type: 'switch', defaultValue: true, span: 8 },
  ],

  filters: [
    { field: 'is_active', label: 'Staatus', type: 'boolean' },
    {
      field: 'country',
      label: 'Riik',
      type: 'multiselect',
      options: [
        { value: 'EE', label: 'Eesti' },
        { value: 'FI', label: 'Soome' },
        { value: 'SE', label: 'Rootsi' },
        { value: 'LV', label: 'Läti' },
        { value: 'LT', label: 'Leedu' },
      ],
    },
  ],

  capabilities: {
    create: true,
    edit: true,
    delete: true,
    export: true,
    show: true,
  },

  search: {
    fields: ['name', 'registry_code', 'email', 'contact_person'],
    placeholder: 'Otsi klienti...',
  },
}

// ============ INVOICES ============

export const invoicesResource: ResourceDefinition = {
  name: 'invoices',
  label: 'Arve',
  labelPlural: 'Arved',
  icon: FileText,
  basePath: '/invoices',
  select: '*, client:clients(id, name), project:projects(id, code, name)',

  columns: [
    { field: 'invoice_number', label: 'Arve nr', type: 'text', sortable: true, width: 110 },
    { field: 'client.name', label: 'Klient', type: 'relation', relationField: 'client.name' },
    { field: 'project.code', label: 'Projekt', type: 'relation', relationField: 'project.code' },
    {
      field: 'status',
      label: 'Staatus',
      type: 'status',
      width: 120,
      statusColors: {
        draft: 'gray',
        sent: 'blue',
        paid: 'green',
        overdue: 'red',
        cancelled: 'gray',
      },
    },
    { field: 'issue_date', label: 'Kuupäev', type: 'date', sortable: true, width: 110 },
    { field: 'due_date', label: 'Tähtaeg', type: 'date', sortable: true, width: 110 },
    { field: 'total', label: 'Summa', type: 'currency', sortable: true, width: 120, align: 'right' },
  ],

  fields: [
    { name: 'invoice_number', label: 'Arve number', type: 'text', required: true, span: 8 },
    { name: 'client_id', label: 'Klient', type: 'relation', required: true, relationResource: 'clients', relationLabel: 'name', span: 8 },
    { name: 'project_id', label: 'Projekt', type: 'relation', relationResource: 'projects', relationLabel: 'code', span: 8 },
    {
      name: 'status',
      label: 'Staatus',
      type: 'select',
      span: 8,
      defaultValue: 'draft',
      options: [
        { value: 'draft', label: 'Mustand', color: 'gray' },
        { value: 'sent', label: 'Saadetud', color: 'blue' },
        { value: 'paid', label: 'Makstud', color: 'green' },
        { value: 'overdue', label: 'Üle tähtaja', color: 'red' },
        { value: 'cancelled', label: 'Tühistatud', color: 'gray' },
      ],
    },
    { name: 'issue_date', label: 'Arve kuupäev', type: 'date', required: true, span: 8 },
    { name: 'due_date', label: 'Maksetähtaeg', type: 'date', required: true, span: 8 },
    { name: 'subtotal', label: 'Summa ilma KM', type: 'currency', span: 8 },
    { name: 'vat_rate', label: 'KM määr (%)', type: 'number', defaultValue: 22, span: 8, min: 0, max: 100 },
    { name: 'total', label: 'Kokku', type: 'currency', span: 8 },
    { name: 'notes', label: 'Märkused', type: 'textarea', span: 24, rows: 3 },
  ],

  filters: [
    {
      field: 'status',
      label: 'Staatus',
      type: 'multiselect',
      options: [
        { value: 'draft', label: 'Mustand' },
        { value: 'sent', label: 'Saadetud' },
        { value: 'paid', label: 'Makstud' },
        { value: 'overdue', label: 'Üle tähtaja' },
      ],
    },
    { field: 'issue_date', label: 'Kuupäev', type: 'daterange' },
    { field: 'client_id', label: 'Klient', type: 'relation', relationResource: 'clients', relationLabel: 'name' },
  ],

  capabilities: {
    create: true,
    edit: true,
    delete: true,
    export: true,
    show: true,
  },

  search: {
    fields: ['invoice_number'],
    placeholder: 'Otsi arvet...',
  },

  defaultSort: {
    field: 'issue_date',
    order: 'desc',
  },
}

// ============ EMPLOYEES ============

export const employeesResource: ResourceDefinition = {
  name: 'employees',
  label: 'Töötaja',
  labelPlural: 'Töötajad',
  icon: Users,
  basePath: '/employees',
  select: '*',

  columns: [
    { field: 'first_name', label: 'Eesnimi', type: 'text', sortable: true },
    { field: 'last_name', label: 'Perenimi', type: 'text', sortable: true },
    { field: 'position', label: 'Ametikoht', type: 'text' },
    { field: 'department', label: 'Osakond', type: 'text' },
    { field: 'email', label: 'E-post', type: 'email' },
    { field: 'phone', label: 'Telefon', type: 'phone', width: 130 },
    { field: 'hourly_rate', label: 'Tunnihind', type: 'currency', width: 100, align: 'right' },
    { field: 'is_active', label: 'Aktiivne', type: 'boolean', width: 90 },
  ],

  fields: [
    { name: 'first_name', label: 'Eesnimi', type: 'text', required: true, span: 8 },
    { name: 'last_name', label: 'Perenimi', type: 'text', required: true, span: 8 },
    { name: 'personal_code', label: 'Isikukood', type: 'text', span: 8 },
    { name: 'email', label: 'E-post', type: 'email', span: 8 },
    { name: 'phone', label: 'Telefon', type: 'phone', span: 8 },
    { name: 'position', label: 'Ametikoht', type: 'text', span: 8 },
    {
      name: 'department',
      label: 'Osakond',
      type: 'select',
      span: 8,
      options: [
        { value: 'management', label: 'Juhtimine' },
        { value: 'construction', label: 'Ehitus' },
        { value: 'transport', label: 'Transport' },
        { value: 'mechanics', label: 'Mehaanikud' },
        { value: 'office', label: 'Kontor' },
      ],
    },
    { name: 'hourly_rate', label: 'Tunnihind (€)', type: 'currency', span: 8 },
    { name: 'hire_date', label: 'Tööle asumise kuupäev', type: 'date', span: 8 },
    { name: 'end_date', label: 'Töösuhte lõpp', type: 'date', span: 8 },
    { name: 'address', label: 'Aadress', type: 'textarea', span: 24, rows: 2 },
    { name: 'notes', label: 'Märkused', type: 'textarea', span: 24, rows: 3 },
    { name: 'is_active', label: 'Aktiivne', type: 'switch', defaultValue: true, span: 8 },
  ],

  filters: [
    { field: 'is_active', label: 'Staatus', type: 'boolean' },
    {
      field: 'department',
      label: 'Osakond',
      type: 'multiselect',
      options: [
        { value: 'management', label: 'Juhtimine' },
        { value: 'construction', label: 'Ehitus' },
        { value: 'transport', label: 'Transport' },
        { value: 'mechanics', label: 'Mehaanikud' },
        { value: 'office', label: 'Kontor' },
      ],
    },
  ],

  capabilities: {
    create: true,
    edit: true,
    delete: true,
    export: true,
    show: true,
  },

  search: {
    fields: ['first_name', 'last_name', 'email', 'position'],
    placeholder: 'Otsi töötajat...',
  },
}

// ============ VEHICLES / EQUIPMENT ============

export const vehiclesResource: ResourceDefinition = {
  name: 'vehicles',
  label: 'Sõiduk',
  labelPlural: 'Tehnika',
  icon: Truck,
  basePath: '/vehicles',
  select: '*, current_project:projects(id, code, name)',

  columns: [
    {
      field: 'type',
      label: 'Tüüp',
      type: 'status',
      width: 110,
      statusColors: {
        car: 'blue',
        truck: 'green',
        trailer: 'gray',
        excavator: 'orange',
        jcb: 'yellow',
        crane: 'purple',
      },
    },
    { field: 'make', label: 'Mark', type: 'text' },
    { field: 'model', label: 'Mudel', type: 'text' },
    { field: 'reg_number', label: 'Reg. nr', type: 'text', width: 100 },
    { field: 'year', label: 'Aasta', type: 'number', width: 80 },
    {
      field: 'status',
      label: 'Staatus',
      type: 'status',
      width: 110,
      statusColors: {
        available: 'green',
        in_use: 'blue',
        maintenance: 'orange',
        sold: 'gray',
      },
    },
    { field: 'insurance_expires', label: 'Kindlustus', type: 'date', width: 110 },
    { field: 'inspection_expires', label: 'Ülevaatus', type: 'date', width: 110 },
  ],

  fields: [
    {
      name: 'type',
      label: 'Tüüp',
      type: 'select',
      required: true,
      span: 8,
      options: [
        { value: 'car', label: 'Sõiduauto', color: 'blue' },
        { value: 'truck', label: 'Veoauto', color: 'green' },
        { value: 'trailer', label: 'Haagis', color: 'gray' },
        { value: 'excavator', label: 'Ekskavaator', color: 'orange' },
        { value: 'jcb', label: 'JCB / Laadur', color: 'yellow' },
        { value: 'crane', label: 'Kraana', color: 'purple' },
        { value: 'other', label: 'Muu', color: 'gray' },
      ],
    },
    { name: 'make', label: 'Mark', type: 'text', span: 8 },
    { name: 'model', label: 'Mudel', type: 'text', span: 8 },
    { name: 'reg_number', label: 'Registreerimisnumber', type: 'text', span: 8 },
    { name: 'vin_code', label: 'VIN kood', type: 'text', span: 8 },
    { name: 'year', label: 'Aasta', type: 'number', span: 8, min: 1990, max: 2030 },
    {
      name: 'status',
      label: 'Staatus',
      type: 'select',
      span: 8,
      defaultValue: 'available',
      options: [
        { value: 'available', label: 'Vaba', color: 'green' },
        { value: 'in_use', label: 'Kasutuses', color: 'blue' },
        { value: 'maintenance', label: 'Hoolduses', color: 'orange' },
        { value: 'sold', label: 'Müüdud', color: 'gray' },
      ],
    },
    { name: 'current_project_id', label: 'Praegune projekt', type: 'relation', relationResource: 'projects', relationLabel: 'code', span: 8 },
    {
      name: 'fuel_type',
      label: 'Kütus',
      type: 'select',
      span: 8,
      options: [
        { value: 'diesel', label: 'Diisel' },
        { value: 'petrol', label: 'Bensiin' },
        { value: 'electric', label: 'Elekter' },
        { value: 'hybrid', label: 'Hübriid' },
      ],
    },
    { name: 'insurance_expires', label: 'Kindlustus kehtib kuni', type: 'date', span: 8 },
    { name: 'inspection_expires', label: 'Tehnoülevaatus kehtib kuni', type: 'date', span: 8 },
    { name: 'mileage', label: 'Läbisõit (km)', type: 'number', span: 8 },
    { name: 'notes', label: 'Märkused', type: 'textarea', span: 24, rows: 3 },
  ],

  filters: [
    {
      field: 'type',
      label: 'Tüüp',
      type: 'multiselect',
      options: [
        { value: 'car', label: 'Sõiduauto' },
        { value: 'truck', label: 'Veoauto' },
        { value: 'trailer', label: 'Haagis' },
        { value: 'excavator', label: 'Ekskavaator' },
        { value: 'jcb', label: 'JCB' },
        { value: 'crane', label: 'Kraana' },
      ],
    },
    {
      field: 'status',
      label: 'Staatus',
      type: 'multiselect',
      options: [
        { value: 'available', label: 'Vaba' },
        { value: 'in_use', label: 'Kasutuses' },
        { value: 'maintenance', label: 'Hoolduses' },
      ],
    },
  ],

  capabilities: {
    create: true,
    edit: true,
    delete: true,
    export: true,
    show: true,
  },

  search: {
    fields: ['make', 'model', 'reg_number', 'vin_code'],
    placeholder: 'Otsi tehnikat...',
  },
}

// ============ WAREHOUSE ASSETS ============

export const warehouseAssetsResource: ResourceDefinition = {
  name: 'warehouse_assets',
  label: 'Vara',
  labelPlural: 'Laovara',
  icon: Package,
  basePath: '/warehouse/assets',
  select: '*, category:warehouse_categories(id, name), warehouse:warehouses(id, name)',

  columns: [
    { field: 'code', label: 'Kood', type: 'text', sortable: true, width: 100 },
    { field: 'name', label: 'Nimetus', type: 'text', sortable: true },
    { field: 'category.name', label: 'Kategooria', type: 'relation', relationField: 'category.name' },
    { field: 'warehouse.name', label: 'Ladu', type: 'relation', relationField: 'warehouse.name' },
    { field: 'quantity', label: 'Kogus', type: 'number', sortable: true, width: 90, align: 'right' },
    { field: 'unit', label: 'Ühik', type: 'text', width: 70 },
    { field: 'min_quantity', label: 'Min', type: 'number', width: 70, align: 'right' },
    {
      field: 'status',
      label: 'Staatus',
      type: 'status',
      width: 100,
      statusColors: {
        in_stock: 'green',
        low_stock: 'orange',
        out_of_stock: 'red',
      },
    },
  ],

  fields: [
    { name: 'code', label: 'Kood', type: 'text', required: true, span: 8 },
    { name: 'name', label: 'Nimetus', type: 'text', required: true, span: 16 },
    { name: 'category_id', label: 'Kategooria', type: 'relation', relationResource: 'warehouse_categories', relationLabel: 'name', span: 12 },
    { name: 'warehouse_id', label: 'Ladu', type: 'relation', relationResource: 'warehouses', relationLabel: 'name', span: 12 },
    { name: 'quantity', label: 'Kogus', type: 'number', span: 8, min: 0 },
    {
      name: 'unit',
      label: 'Ühik',
      type: 'select',
      span: 8,
      defaultValue: 'tk',
      options: [
        { value: 'tk', label: 'tk' },
        { value: 'kg', label: 'kg' },
        { value: 'm', label: 'm' },
        { value: 'm2', label: 'm²' },
        { value: 'm3', label: 'm³' },
        { value: 'l', label: 'l' },
        { value: 'kmpl', label: 'kmpl' },
      ],
    },
    { name: 'min_quantity', label: 'Miinimum kogus', type: 'number', span: 8, min: 0 },
    { name: 'purchase_price', label: 'Ostuhind', type: 'currency', span: 8 },
    { name: 'location', label: 'Asukoht laos', type: 'text', span: 16, placeholder: 'nt Riiul A-3' },
    { name: 'description', label: 'Kirjeldus', type: 'textarea', span: 24, rows: 3 },
  ],

  filters: [
    { field: 'category_id', label: 'Kategooria', type: 'relation', relationResource: 'warehouse_categories', relationLabel: 'name' },
    { field: 'warehouse_id', label: 'Ladu', type: 'relation', relationResource: 'warehouses', relationLabel: 'name' },
    {
      field: 'status',
      label: 'Staatus',
      type: 'multiselect',
      options: [
        { value: 'in_stock', label: 'Laos' },
        { value: 'low_stock', label: 'Vähe' },
        { value: 'out_of_stock', label: 'Otsas' },
      ],
    },
  ],

  capabilities: {
    create: true,
    edit: true,
    delete: true,
    bulkDelete: true,
    export: true,
    import: true,
    show: true,
  },

  search: {
    fields: ['name', 'code', 'location'],
    placeholder: 'Otsi vara...',
  },
}

// ============ WAREHOUSES ============

export const warehousesResource: ResourceDefinition = {
  name: 'warehouses',
  label: 'Ladu',
  labelPlural: 'Laod',
  icon: Warehouse,
  basePath: '/warehouse/warehouses',
  select: '*',

  columns: [
    { field: 'name', label: 'Nimi', type: 'text', sortable: true },
    { field: 'address', label: 'Aadress', type: 'text' },
    { field: 'manager', label: 'Vastutaja', type: 'text' },
    { field: 'is_active', label: 'Aktiivne', type: 'boolean', width: 90 },
  ],

  fields: [
    { name: 'name', label: 'Lao nimi', type: 'text', required: true, span: 12 },
    { name: 'address', label: 'Aadress', type: 'text', span: 12 },
    { name: 'manager', label: 'Vastutaja', type: 'text', span: 12 },
    { name: 'phone', label: 'Telefon', type: 'phone', span: 12 },
    { name: 'description', label: 'Kirjeldus', type: 'textarea', span: 24, rows: 3 },
    { name: 'is_active', label: 'Aktiivne', type: 'switch', defaultValue: true, span: 8 },
  ],

  capabilities: {
    create: true,
    edit: true,
    delete: true,
    show: true,
  },

  search: {
    fields: ['name', 'address', 'manager'],
    placeholder: 'Otsi ladu...',
  },
}

// ============ WAREHOUSE CATEGORIES ============

export const warehouseCategoriesResource: ResourceDefinition = {
  name: 'warehouse_categories',
  label: 'Kategooria',
  labelPlural: 'Kategooriad',
  icon: FolderOpen,
  basePath: '/warehouse/categories',
  select: '*, parent:warehouse_categories(id, name)',

  columns: [
    { field: 'name', label: 'Nimi', type: 'text', sortable: true },
    { field: 'parent.name', label: 'Ülemkategooria', type: 'relation', relationField: 'parent.name' },
    { field: 'description', label: 'Kirjeldus', type: 'text' },
  ],

  fields: [
    { name: 'name', label: 'Kategooria nimi', type: 'text', required: true, span: 12 },
    { name: 'parent_id', label: 'Ülemkategooria', type: 'relation', relationResource: 'warehouse_categories', relationLabel: 'name', span: 12 },
    { name: 'description', label: 'Kirjeldus', type: 'textarea', span: 24, rows: 2 },
  ],

  capabilities: {
    create: true,
    edit: true,
    delete: true,
    show: true,
  },

  search: {
    fields: ['name'],
    placeholder: 'Otsi kategooriat...',
  },
}

// ============ MAINTENANCE LOGS ============

export const maintenanceLogsResource: ResourceDefinition = {
  name: 'maintenance_logs',
  label: 'Hooldus',
  labelPlural: 'Hooldused',
  icon: Wrench,
  basePath: '/warehouse/maintenance',
  select: '*, asset:warehouse_assets(id, name, code), vehicle:vehicles(id, make, model, reg_number)',

  columns: [
    { field: 'date', label: 'Kuupäev', type: 'date', sortable: true, width: 110 },
    { field: 'asset.name', label: 'Vara', type: 'relation', relationField: 'asset.name' },
    { field: 'vehicle.reg_number', label: 'Sõiduk', type: 'relation', relationField: 'vehicle.reg_number' },
    {
      field: 'type',
      label: 'Tüüp',
      type: 'status',
      width: 120,
      statusColors: {
        routine: 'blue',
        repair: 'orange',
        inspection: 'green',
        emergency: 'red',
      },
    },
    { field: 'description', label: 'Kirjeldus', type: 'text' },
    { field: 'cost', label: 'Maksumus', type: 'currency', width: 100, align: 'right' },
    { field: 'performed_by', label: 'Teostaja', type: 'text' },
  ],

  fields: [
    { name: 'date', label: 'Kuupäev', type: 'date', required: true, span: 8 },
    {
      name: 'type',
      label: 'Hoolduse tüüp',
      type: 'select',
      required: true,
      span: 8,
      options: [
        { value: 'routine', label: 'Plaaniline hooldus', color: 'blue' },
        { value: 'repair', label: 'Remont', color: 'orange' },
        { value: 'inspection', label: 'Ülevaatus', color: 'green' },
        { value: 'emergency', label: 'Avariiremont', color: 'red' },
      ],
    },
    { name: 'asset_id', label: 'Vara', type: 'relation', relationResource: 'warehouse_assets', relationLabel: 'name', span: 8 },
    { name: 'vehicle_id', label: 'Sõiduk', type: 'relation', relationResource: 'vehicles', relationLabel: 'reg_number', span: 8 },
    { name: 'performed_by', label: 'Teostaja', type: 'text', span: 8 },
    { name: 'cost', label: 'Maksumus (€)', type: 'currency', span: 8 },
    { name: 'description', label: 'Kirjeldus', type: 'textarea', required: true, span: 24, rows: 3 },
    { name: 'next_maintenance_date', label: 'Järgmine hooldus', type: 'date', span: 8 },
  ],

  filters: [
    {
      field: 'type',
      label: 'Tüüp',
      type: 'multiselect',
      options: [
        { value: 'routine', label: 'Plaaniline hooldus' },
        { value: 'repair', label: 'Remont' },
        { value: 'inspection', label: 'Ülevaatus' },
        { value: 'emergency', label: 'Avariiremont' },
      ],
    },
    { field: 'date', label: 'Kuupäev', type: 'daterange' },
  ],

  capabilities: {
    create: true,
    edit: true,
    delete: true,
    export: true,
    show: true,
  },

  search: {
    fields: ['description', 'performed_by'],
    placeholder: 'Otsi hooldust...',
  },

  defaultSort: {
    field: 'date',
    order: 'desc',
  },
}

// ============ STOCK TRANSFERS ============

export const stockTransfersResource: ResourceDefinition = {
  name: 'stock_transfers',
  label: 'Ülekanne',
  labelPlural: 'Ülekanded',
  icon: ArrowRightLeft,
  basePath: '/warehouse/transfers',
  select: '*, asset:warehouse_assets(id, name, code), from_warehouse:warehouses!from_warehouse_id(id, name), to_warehouse:warehouses!to_warehouse_id(id, name), project:projects(id, code)',

  columns: [
    { field: 'date', label: 'Kuupäev', type: 'date', sortable: true, width: 110 },
    { field: 'asset.name', label: 'Vara', type: 'relation', relationField: 'asset.name' },
    { field: 'quantity', label: 'Kogus', type: 'number', width: 80, align: 'right' },
    { field: 'from_warehouse.name', label: 'Kust', type: 'relation', relationField: 'from_warehouse.name' },
    { field: 'to_warehouse.name', label: 'Kuhu', type: 'relation', relationField: 'to_warehouse.name' },
    { field: 'project.code', label: 'Projekt', type: 'relation', relationField: 'project.code' },
    {
      field: 'status',
      label: 'Staatus',
      type: 'status',
      width: 100,
      statusColors: {
        pending: 'blue',
        completed: 'green',
        cancelled: 'gray',
      },
    },
  ],

  fields: [
    { name: 'date', label: 'Kuupäev', type: 'date', required: true, span: 8 },
    { name: 'asset_id', label: 'Vara', type: 'relation', required: true, relationResource: 'warehouse_assets', relationLabel: 'name', span: 16 },
    { name: 'quantity', label: 'Kogus', type: 'number', required: true, span: 8, min: 1 },
    { name: 'from_warehouse_id', label: 'Ladu (kust)', type: 'relation', relationResource: 'warehouses', relationLabel: 'name', span: 8 },
    { name: 'to_warehouse_id', label: 'Ladu (kuhu)', type: 'relation', relationResource: 'warehouses', relationLabel: 'name', span: 8 },
    { name: 'project_id', label: 'Projekt', type: 'relation', relationResource: 'projects', relationLabel: 'code', span: 8 },
    {
      name: 'status',
      label: 'Staatus',
      type: 'select',
      span: 8,
      defaultValue: 'pending',
      options: [
        { value: 'pending', label: 'Ootel', color: 'blue' },
        { value: 'completed', label: 'Lõpetatud', color: 'green' },
        { value: 'cancelled', label: 'Tühistatud', color: 'gray' },
      ],
    },
    { name: 'notes', label: 'Märkused', type: 'textarea', span: 24, rows: 2 },
  ],

  filters: [
    { field: 'date', label: 'Kuupäev', type: 'daterange' },
    {
      field: 'status',
      label: 'Staatus',
      type: 'multiselect',
      options: [
        { value: 'pending', label: 'Ootel' },
        { value: 'completed', label: 'Lõpetatud' },
        { value: 'cancelled', label: 'Tühistatud' },
      ],
    },
    { field: 'from_warehouse_id', label: 'Ladu (kust)', type: 'relation', relationResource: 'warehouses', relationLabel: 'name' },
    { field: 'to_warehouse_id', label: 'Ladu (kuhu)', type: 'relation', relationResource: 'warehouses', relationLabel: 'name' },
  ],

  capabilities: {
    create: true,
    edit: true,
    delete: true,
    export: true,
    show: true,
  },

  defaultSort: {
    field: 'date',
    order: 'desc',
  },
}

// ============ ULTRA TABLES ============

export const ultraTablesResource: ResourceDefinition = {
  name: 'ultra_tables',
  label: 'Tabel',
  labelPlural: 'Ultra Tabelid',
  icon: LayoutGrid,
  basePath: '/admin/ultra-tables',
  select: '*',

  columns: [
    { field: 'name', label: 'Nimi', type: 'text', sortable: true },
    { field: 'slug', label: 'Slug', type: 'text', width: 150 },
    { field: 'description', label: 'Kirjeldus', type: 'text' },
    { field: 'is_active', label: 'Aktiivne', type: 'boolean', width: 90 },
    { field: 'created_at', label: 'Loodud', type: 'datetime', sortable: true, width: 150 },
  ],

  fields: [
    { name: 'name', label: 'Tabeli nimi', type: 'text', required: true, span: 12 },
    { name: 'slug', label: 'Slug', type: 'text', required: true, span: 12, placeholder: 'my-table' },
    { name: 'description', label: 'Kirjeldus', type: 'textarea', span: 24, rows: 2 },
    { name: 'is_active', label: 'Aktiivne', type: 'switch', defaultValue: true, span: 8 },
  ],

  capabilities: {
    create: true,
    edit: true,
    delete: true,
    show: true,
  },

  search: {
    fields: ['name', 'slug', 'description'],
    placeholder: 'Otsi tabelit...',
  },
}

// ============ ALL RESOURCES REGISTRY ============

export const resources: Record<string, ResourceDefinition> = {
  projects: projectsResource,
  clients: clientsResource,
  invoices: invoicesResource,
  employees: employeesResource,
  vehicles: vehiclesResource,
  warehouse_assets: warehouseAssetsResource,
  warehouses: warehousesResource,
  warehouse_categories: warehouseCategoriesResource,
  maintenance_logs: maintenanceLogsResource,
  stock_transfers: stockTransfersResource,
  ultra_tables: ultraTablesResource,
}
