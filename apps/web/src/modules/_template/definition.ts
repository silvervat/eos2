/**
 * Module Template
 *
 * Kopeeri see kaust uue mooduli loomiseks:
 * cp -r modules/_template modules/[uus-moodul]
 *
 * Seejärel muuda:
 * 1. name, label, labelSingular
 * 2. database.table ja fields
 * 3. permissions
 * 4. components
 * 5. meta
 */

import { defineModule } from '@/core/registry'

export default defineModule({
  // ═══════════════════════════════════════════════════════════════
  // BAASTEAVE - MUUDA NEED!
  // ═══════════════════════════════════════════════════════════════
  name: 'template', // lowercase, underscore OK
  label: 'Template', // Mitmus eesti keeles
  labelSingular: 'Template', // Ainsus eesti keeles
  icon: 'AppstoreOutlined', // Ant Design ikoon
  description: 'Mooduli kirjeldus',

  // ═══════════════════════════════════════════════════════════════
  // MENÜÜ
  // ═══════════════════════════════════════════════════════════════
  menu: {
    group: 'main', // main, resources, finance, settings, admin
    order: 10, // Järjekord grupis
    visible: true,
  },

  // ═══════════════════════════════════════════════════════════════
  // ANDMEBAAS - MUUDA NEED!
  // ═══════════════════════════════════════════════════════════════
  database: {
    table: 'template_items', // Tabeli nimi

    fields: {
      // Lisa siia oma väljad
      name: {
        type: 'text',
        label: 'Nimi',
        required: true,
      },
      description: {
        type: 'text',
        label: 'Kirjeldus',
      },
      status: {
        type: 'enum',
        label: 'Staatus',
        options: ['active', 'inactive'],
        default: 'active',
      },
    },

    rls: true,
    indexes: [{ columns: ['tenant_id', 'status'] }],
  },

  // ═══════════════════════════════════════════════════════════════
  // ÕIGUSED
  // ═══════════════════════════════════════════════════════════════
  permissions: {
    read: {
      label: 'Vaata',
      description: 'Kirjete vaatamine',
      default: ['viewer', 'user', 'manager', 'admin', 'owner'],
    },
    create: {
      label: 'Lisa',
      description: 'Uute kirjete lisamine',
      default: ['manager', 'admin', 'owner'],
    },
    update: {
      label: 'Muuda',
      description: 'Kirjete muutmine',
      default: ['manager', 'admin', 'owner'],
    },
    delete: {
      label: 'Kustuta',
      description: 'Kirjete kustutamine',
      default: ['admin', 'owner'],
    },
  },

  // ═══════════════════════════════════════════════════════════════
  // KOMPONENDID - MUUDA NEED!
  // ═══════════════════════════════════════════════════════════════
  components: [
    {
      name: 'TemplateList',
      type: 'page',
      status: 'todo',
      description: 'Kirjete nimekiri',
    },
    {
      name: 'TemplateDetail',
      type: 'page',
      status: 'todo',
      description: 'Kirje detailvaade',
    },
    {
      name: 'TemplateForm',
      type: 'form',
      status: 'todo',
      description: 'Lisamise/muutmise vorm',
    },
  ],

  // ═══════════════════════════════════════════════════════════════
  // METAINFO - MUUDA NEED!
  // ═══════════════════════════════════════════════════════════════
  meta: {
    version: '0.0.1',
    author: 'Sinu nimi',
    createdAt: new Date().toISOString().split('T')[0],
    status: 'todo',
  },
})
