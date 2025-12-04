/**
 * Vehicles Module Definition
 *
 * Sõidukipargi halduse moodul.
 *
 * See on näidis kuidas defineModule'd kasutada.
 * Kopeeri see fail uue mooduli loomiseks.
 */

import { defineModule } from '@/core/registry'

export default defineModule({
  // ═══════════════════════════════════════════════════════════════
  // BAASTEAVE
  // ═══════════════════════════════════════════════════════════════
  name: 'vehicles',
  label: 'Sõidukid',
  labelSingular: 'Sõiduk',
  icon: 'CarOutlined',
  description: 'Sõidukipargi haldus - sõidukite registreerimine, hooldused ja kasutuse jälgimine',

  // ═══════════════════════════════════════════════════════════════
  // MENÜÜ
  // ═══════════════════════════════════════════════════════════════
  menu: {
    group: 'resources',
    order: 20,
    visible: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // ANDMEBAAS
  // ═══════════════════════════════════════════════════════════════
  database: {
    table: 'vehicles',

    fields: {
      // Põhiinfo
      registration_number: {
        type: 'text',
        label: 'Registreerimisnumber',
        required: true,
        unique: true,
      },
      make: {
        type: 'text',
        label: 'Mark',
        required: true,
      },
      model: {
        type: 'text',
        label: 'Mudel',
        required: true,
      },
      year: {
        type: 'integer',
        label: 'Aasta',
      },
      vin: {
        type: 'text',
        label: 'VIN kood',
        unique: true,
      },

      // Staatus
      status: {
        type: 'enum',
        label: 'Staatus',
        options: ['available', 'in_use', 'maintenance', 'retired'],
        default: 'available',
      },

      // Seosed
      current_project_id: {
        type: 'uuid',
        label: 'Praegune projekt',
        references: 'projects.id',
      },
      assigned_user_id: {
        type: 'uuid',
        label: 'Kasutaja',
        references: 'auth.users.id',
      },

      // Tehniline info
      odometer: {
        type: 'integer',
        label: 'Läbisõit (km)',
        default: 0,
      },
      fuel_type: {
        type: 'enum',
        label: 'Kütuse tüüp',
        options: ['petrol', 'diesel', 'electric', 'hybrid', 'lpg'],
      },

      // Finantsid
      purchase_date: {
        type: 'date',
        label: 'Ostukuupäev',
      },
      purchase_price: {
        type: 'decimal',
        label: 'Ostuhind',
      },
      insurance_valid_until: {
        type: 'date',
        label: 'Kindlustus kehtib kuni',
      },
      inspection_valid_until: {
        type: 'date',
        label: 'Ülevaatus kehtib kuni',
      },

      // Märkused
      notes: {
        type: 'text',
        label: 'Märkused',
      },
    },

    rls: true,

    indexes: [
      { columns: ['tenant_id', 'status'] },
      { columns: ['current_project_id'] },
      { columns: ['assigned_user_id'] },
      { columns: ['registration_number'], unique: true },
    ],
  },

  // ═══════════════════════════════════════════════════════════════
  // ÕIGUSED
  // ═══════════════════════════════════════════════════════════════
  permissions: {
    read: {
      label: 'Vaata',
      description: 'Sõidukite vaatamine',
      default: ['viewer', 'user', 'manager', 'admin', 'owner'],
    },
    create: {
      label: 'Lisa',
      description: 'Uute sõidukite lisamine',
      default: ['manager', 'admin', 'owner'],
    },
    update: {
      label: 'Muuda',
      description: 'Sõidukite andmete muutmine',
      default: ['manager', 'admin', 'owner'],
    },
    delete: {
      label: 'Kustuta',
      description: 'Sõidukite kustutamine',
      default: ['admin', 'owner'],
    },
    assign: {
      label: 'Määra',
      description: 'Sõiduki määramine projektile/kasutajale',
      default: ['manager', 'admin', 'owner'],
    },
    maintenance: {
      label: 'Hooldus',
      description: 'Hoolduste haldamine',
      default: ['user', 'manager', 'admin', 'owner'],
    },
    export: {
      label: 'Eksport',
      description: 'Andmete eksportimine',
      default: ['manager', 'admin', 'owner'],
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // KOMPONENDID
  // ═══════════════════════════════════════════════════════════════
  components: [
    {
      name: 'VehicleList',
      type: 'page',
      status: 'active',
      description: 'Sõidukite nimekiri filtritega',
      filePath: 'modules/vehicles/pages/index.tsx',
    },
    {
      name: 'VehicleDetail',
      type: 'page',
      status: 'active',
      description: 'Sõiduki detailvaade',
      filePath: 'modules/vehicles/pages/[id].tsx',
    },
    {
      name: 'VehicleForm',
      type: 'form',
      status: 'active',
      description: 'Sõiduki lisamise/muutmise vorm',
      filePath: 'modules/vehicles/components/VehicleForm.tsx',
    },
    {
      name: 'VehicleCard',
      type: 'card',
      status: 'active',
      description: 'Sõiduki kaart',
      filePath: 'modules/vehicles/components/VehicleCard.tsx',
    },
    {
      name: 'VehicleMaintenance',
      type: 'tab',
      status: 'beta',
      description: 'Hoolduste tab',
      todoRefs: ['#TODO-V001'],
    },
    {
      name: 'VehicleTimeline',
      type: 'widget',
      status: 'todo',
      description: 'Kasutuse timeline',
      todoRefs: ['#TODO-V002'],
    },
  ],

  // ═══════════════════════════════════════════════════════════════
  // SEOSED
  // ═══════════════════════════════════════════════════════════════
  relations: [
    {
      module: 'projects',
      foreignKey: 'current_project_id',
      label: 'Praegune projekt',
      type: 'many-to-one',
    },
  ],

  // ═══════════════════════════════════════════════════════════════
  // VAATED
  // ═══════════════════════════════════════════════════════════════
  views: [
    {
      name: 'all',
      label: 'Kõik sõidukid',
      filters: {},
      sort: [{ field: 'registration_number', order: 'asc' }],
    },
    {
      name: 'available',
      label: 'Vabad',
      filters: { status: 'available' },
    },
    {
      name: 'in-use',
      label: 'Kasutuses',
      filters: { status: 'in_use' },
    },
    {
      name: 'maintenance',
      label: 'Hoolduses',
      filters: { status: 'maintenance' },
    },
  ],

  // ═══════════════════════════════════════════════════════════════
  // STAATUSED
  // ═══════════════════════════════════════════════════════════════
  statuses: {
    available: {
      label: 'Vaba',
      color: '#52c41a',
      bg: '#f6ffed',
      icon: '✓',
    },
    in_use: {
      label: 'Kasutuses',
      color: '#1890ff',
      bg: '#e6f7ff',
      icon: '🚗',
    },
    maintenance: {
      label: 'Hoolduses',
      color: '#faad14',
      bg: '#fffbe6',
      icon: '🔧',
    },
    retired: {
      label: 'Kasutusest kõrvaldatud',
      color: '#8c8c8c',
      bg: '#f5f5f5',
      icon: '✗',
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // METAINFO
  // ═══════════════════════════════════════════════════════════════
  meta: {
    version: '1.0.0',
    author: 'Silver',
    createdAt: '2025-12-04',
    status: 'development',
    todoRefs: ['#TODO-V001', '#TODO-V002'],
    bugRefs: [],
  },
})
