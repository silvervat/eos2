# EOS2 SYSTEM DOCUMENTATION

**Viimati uuendatud:** 2025-12-04
**Versioon:** 2.1.0
**Projekt:** EOS2 - Enterprise Operating System 2

---

## QUICK LINKS

- **Dokumentatsioon:** `manual/04.12/`
- **Quick Start:** `manual/04.12/02-QUICK-START.md`
- **Master juhend:** `manual/04.12/00-CLAUDE-CODE-MASTER-JUHEND.md`
- **Implementatsiooni plaan:** `manual/04.12/01-IMPLEMENTATSIOONI-PLAAN.md`

---

## VISIOON

> **"Lego-stiilis ERP süsteem"** - modulaarne arhitektuur, kus uus moodul valmib 30 minutiga ja kood on ühes kohas hallatav.

---

## IMPLEMENTATSIOONI SEIS

| Faas | Staatus | Kirjeldus |
|------|---------|-----------|
| PHASE 1 | ✅ DONE | Baassüsteem - migratsioonid |
| PHASE 2 | ✅ DONE | Õiguste süsteem |
| PHASE 3 | ✅ DONE | Admin paneel |
| PHASE 4 | ✅ DONE | Registry süsteem |
| PHASE 5 | ✅ DONE | Design System |
| PHASE 6 | ✅ DONE | Vehicles näidismoodul |
| PHASE 7 | ✅ DONE | Testimine |
| PHASE 8 | ✅ DONE | Dokumentatsioon |

---

## PROJEKTI STRUKTUUR

```
eos2/
├── SYSTEM.md              # See fail - LOE ALATI ESIMESENA
├── TODO.md                # Pooleli asjad ja planeeritud
├── CLAUDE_MEMORY.md       # Claude'i mälu - tehtu ülevaade
├── README.md              # Projekti üldine kirjeldus
│
├── apps/
│   └── web/               # Next.js 14 rakendus
│       └── src/
│           ├── core/      # ✅ Core süsteemid
│           │   ├── permissions/  # Õiguste süsteem
│           │   └── registry/     # Moodulite registry
│           ├── design/    # ✅ Design System
│           └── modules/   # ✅ Moodulid
│               ├── _template/    # Mooduli template
│               └── vehicles/     # Näidismoodul
│
├── packages/
│   ├── data-provider/     # Data layer
│   ├── db/                # Prisma + Supabase
│   ├── resources/         # Ressursside definitsioonid
│   ├── types/             # TypeScript tüübid
│   ├── ui/                # Jagatud UI komponendid
│   └── ui-crud/           # CRUD komponendid
│
├── manual/                # Dokumentatsioon
│   ├── 04.12/             # EOS2 modulaarse süsteemi juhendid
│   ├── warehouse/         # Laohalduse dokumentatsioon
│   ├── tables/            # Tabelite dokumentatsioon
│   └── files/             # File Vault dokumentatsioon
│
├── supabase/
│   └── migrations/        # SQL migratsioonid
│       └── 008_modules_system.sql  # ✅ Moodulite süsteem
│
├── plop-templates/        # Koodi genereerimise mallid
│
└── scripts/               # Automatiseerimise skriptid
```

---

## CORE SÜSTEEMID (Uus!)

### Permissions System

**Asukoht:** `apps/web/src/core/permissions/`

| Fail | Kirjeldus |
|------|-----------|
| `roles.ts` | 5 rolli definitsioon (owner, admin, manager, user, viewer) |
| `actions.ts` | Toimingute definitsioonid (CRUD + custom) |
| `matrix.ts` | Õiguste maatriks - kes mida teha saab |
| `check.ts` | hasPermission, canAccessResource jm funktsioonid |
| `hooks.ts` | usePermission, useModulePermissions React hookid |
| `components.tsx` | ProtectedComponent, AdminOnly komponendid |

**Kasutamine:**
```typescript
import { usePermission, ProtectedComponent, AdminOnly } from '@/core/permissions'

// Hook
const canEdit = usePermission('project:update')

// Komponent
<ProtectedComponent permission="project:delete">
  <DeleteButton />
</ProtectedComponent>

// Admin-only
<AdminOnly>
  <AdminPanel />
</AdminOnly>
```

### Registry System

**Asukoht:** `apps/web/src/core/registry/`

| Fail | Kirjeldus |
|------|-----------|
| `types.ts` | ModuleDefinition, FieldDefinition jm tüübid |
| `defineModule.ts` | defineModule() helper valideerimisega |
| `registerModule.ts` | registerModule(), getModule() funktsioonid |

**Kasutamine:**
```typescript
import { defineModule, registerModule } from '@/core/registry'

export default defineModule({
  name: 'vehicles',
  label: 'Sõidukid',
  // ... täielik definitsioon
})
```

### Design System

**Asukoht:** `apps/web/src/design/`

| Fail | Kirjeldus |
|------|-----------|
| `tokens.ts` | Design tokens - värvid, spacing, typography jne |
| `theme.ts` | Ant Design theme konfiguratsioon |

**Brand värv:** `#279989` (Rivest teal)

---

## MOODULID

### Implementeeritud

| Moodul | Staatus | Kirjeldus |
|--------|---------|-----------|
| **warehouse** | ✅ Active | Laohaldus - varad, ülekanded, hooldused |
| **file-vault** | 🔶 Beta | Failihalduse süsteem |
| **vehicles** | ✅ Active | Sõidukipargi haldus (näidismoodul) |

### Mooduli Template

**Asukoht:** `apps/web/src/modules/_template/`

Uue mooduli loomiseks:
```bash
cp -r modules/_template modules/[uus-moodul]
```

---

## ADMIN PANEEL (Uus!)

**Asukoht:** `apps/web/src/app/(dashboard)/admin/`

| Leht | Kirjeldus |
|------|-----------|
| `/admin` | Dashboard - süsteemi ülevaade |
| `/admin/modules` | Moodulite haldus |
| `/admin/permissions` | Õiguste maatriks |

---

## TESTID (Uus!)

| Fail | Kirjeldus |
|------|-----------|
| `core/permissions/check.test.ts` | Õiguste kontroll testid |
| `core/permissions/matrix.test.ts` | Maatriksi testid |
| `core/registry/defineModule.test.ts` | Mooduli defineerimise testid |
| `core/registry/registerModule.test.ts` | Registreerimise testid |
| `design/tokens.test.ts` | Design tokens testid |

---

## ANDMEBAAS

### Migratsioonid

| Fail | Kirjeldus |
|------|-----------|
| `008_modules_system.sql` | ✅ Moodulite süsteem (tabelid, rollid, funktsioonid) |

### Uued tabelid (008_modules_system.sql)

| Tabel | Kirjeldus |
|-------|-----------|
| `modules` | Moodulite register |
| `components` | Komponentide register |
| `module_actions` | Moodulite toimingud |
| `roles` | Rollid (5 vaikerolli) |
| `user_module_access` | Kasutaja-mooduli õigused |
| `user_component_access` | Kasutaja-komponendi õigused |
| `module_relations` | Moodulite seosed |

### Rollid (vaikeväärtused)

| Roll | Level | Kirjeldus |
|------|-------|-----------|
| owner | 100 | Täielik ligipääs |
| admin | 80 | Administraator |
| manager | 60 | Juhataja |
| user | 40 | Tavakasutaja |
| viewer | 20 | Ainult vaatamine |

---

## TEHNILINE STACK

| Kiht | Tehnoloogia |
|------|-------------|
| **Monorepo** | Turborepo 2 + pnpm 9 |
| **Frontend** | Next.js 14 App Router |
| **Database** | Supabase (PostgreSQL) |
| **ORM** | Prisma 5 |
| **UI** | Ant Design + Tailwind CSS |
| **State** | TanStack Query + Zustand |

---

## KÄSUD

```bash
# Arendus
pnpm dev

# Build
pnpm build

# Migratsioonid
pnpm db:migrate

# Testi
pnpm test

# Lint
pnpm lint
```

---

## VIIMASED MUUDATUSED

### 2025-12-04 (PHASE 1-8 implementatsioon)
- [ADDED] Core permissions süsteem
- [ADDED] Core registry süsteem
- [ADDED] Design System (tokens, theme)
- [ADDED] Admin paneel (dashboard, modules, permissions)
- [ADDED] Vehicles näidismoodul
- [ADDED] Mooduli template
- [ADDED] Unit testid
- [ADDED] SQL migratsioon 008_modules_system.sql
- [UPDATED] SYSTEM.md, TODO.md, CLAUDE_MEMORY.md

### Varasemad (warehouse)
- [ADDED] Warehouse mooduli põhifunktsionaalsus
- [ADDED] Stock movements API
- [ADDED] Low stock alerts
- [ADDED] Photo gallery
- [ADDED] QR koodide genereerimine
- [ADDED] CSV eksport
- [ADDED] RLS poliitikad

---

## JÄRGMINE SAMM

1. **Supabase integratsioon:** Vehicles migratsioon + RLS
2. **Core komponendid:** DataTable, FormBuilder, StatusBadge
3. **Uued moodulid:** projects, clients, invoices

---

## KONTAKT

**Projekt:** EOS2 - Enterprise Operating System 2
**Ettevõte:** Rivest OÜ
**Arendaja:** Silver

---

**NB!** See fail tuleb uuendada iga suurema muudatuse järel!
