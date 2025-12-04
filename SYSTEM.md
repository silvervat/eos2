# EOS2 SYSTEM DOCUMENTATION

**Viimati uuendatud:** 2025-12-04
**Versioon:** 2.0.0
**Projekt:** EOS2 - Enterprise Operating System 2

---

## QUICK LINKS

- **Dokumentatsioon:** `manual/04.12/`
- **Quick Start:** `manual/04.12/02-QUICK-START.md`
- **Master juhend:** `manual/04.12/00-CLAUDE-CODE-MASTER-JUHEND.md`
- **Implementatsiooni plaan:** `manual/04.12/01-IMPLEMENTATSIOONI-PLAAN.md`

---

## VISIOON

> **"Lego-stiilis ERP suusteem"** - modulaarne arhitektuur, kus uus moodul valmib 30 minutiga ja kook on uhes kohas hallatav.

---

## PROJEKTI STRUKTUUR

```
eos2/
├── SYSTEM.md              # See fail - LOE ALATI ESIMESENA
├── TODO.md                # Pooleli asjad ja planeeritud
├── CLAUDE_MEMORY.md       # Claude'i malu - tehtu ulevaade
├── README.md              # Projekti uldine kirjeldus
│
├── apps/
│   └── web/               # Next.js 14 rakendus
│
├── packages/
│   ├── data-provider/     # Data layer
│   ├── db/                # Prisma + Supabase
│   ├── resources/         # Ressursside definitsioonid
│   ├── types/             # TypeScript tuubid
│   ├── ui/                # Jagatud UI komponendid
│   └── ui-crud/           # CRUD komponendid
│
├── manual/                # Dokumentatsioon
│   ├── 04.12/             # EOS2 modulaarse suusteemi juhendid
│   ├── warehouse/         # Laohalduse dokumentatsioon
│   ├── tables/            # Tabelite dokumentatsioon
│   └── files/             # File Vault dokumentatsioon
│
├── supabase/
│   └── migrations/        # SQL migratsioonid
│
├── plop-templates/        # Koodi genereerimise mallid
│   ├── api/
│   ├── component/
│   ├── hook/
│   └── page/
│
└── scripts/               # Automatiseerimise skriptid
```

---

## MOODULID

### Implementeeritud

| Moodul | Staatus | Kirjeldus |
|--------|---------|-----------|
| **warehouse** | Active | Laohaldus - varad, ulekanded, hooldused |
| **file-vault** | Beta | Failihalduse suusteem |

### Planeeritud (vastavalt dokumentatsioonile)

| Moodul | Prioriteet | Kirjeldus |
|--------|------------|-----------|
| projects | Korge | Projektide haldus |
| clients | Korge | Klientide haldus |
| invoices | Korge | Arvete haldus |
| vehicles | Keskmine | Soidukipargi haldus |
| gantt-planner | Madal | Gantt planeerimine |
| reports | Madal | Raportid ja eksport |

---

## CORE KOMPONENDID

### Packages

| Pakett | Kirjeldus |
|--------|-----------|
| `@rivest/ui` | Jagatud UI komponendid |
| `@rivest/db` | Prisma + Supabase |
| `@rivest/types` | TypeScript tuubid |
| `packages/data-provider` | Data layer hookid |
| `packages/ui-crud` | CRUD komponendid |

### Olemasolevad komponendid (warehouse)

- `AssetsTable.tsx` - Varade tabel filtritega
- `WarehouseStats.tsx` - Statistika kaardid
- `LowStockAlerts.tsx` - Madala laoseisu hoiatused
- `StockMovements.tsx` - Laoseisu liikumised
- `PhotoGallery.tsx` - Fotogalerii lightboxiga
- `QRCodeModal.tsx` - QR koodi genereerimine

---

## DESIGN SYSTEM

### Brandi varv
```
Primary: #279989 (Rivest teal)
```

### UI Framework
- **Ant Design** - UI komponendid
- **Tailwind CSS** - Utiliit klassid
- **shadcn/ui** - Lisaomponendid

### Kasutamise reeglid
```typescript
// OIGE - kasuta @rivest/ui paketti
import { Button } from '@rivest/ui'

// VALE - ara kasuta @/components/ui/
import { Button } from '@/components/ui/button'
```

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

## ANDMEBAAS

### Test tenant
```
ID: 16e26c26-2c98-4b58-a956-b86ac3becf14
```

### RLS (Row Level Security)
- Koik tabelid on tenant-isolated
- RLS poliitikad failides `supabase/migrations/`

### Tabelid (warehouse)
- `warehouses` - Laod
- `assets` - Varad
- `asset_categories` - Kategooriad
- `asset_photos` - Fotod
- `asset_transfers` - Ulekanded
- `asset_maintenances` - Hooldused
- `stock_movements` - Laoseisu liikumised

---

## KASUD

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

### 2025-12-04
- [ADDED] EOS2 modulaarse suusteemi dokumentatsioon (manual/04.12/)
- [ADDED] SYSTEM.md ja TODO.md failid
- [UPDATED] CLAUDE_MEMORY.md uuendatud

### Varasemad (warehouse)
- [ADDED] Warehouse mooduli pohifunktsionaalsus
- [ADDED] Stock movements API
- [ADDED] Low stock alerts
- [ADDED] Photo gallery
- [ADDED] QR koodide genereerimine
- [ADDED] CSV eksport
- [ADDED] RLS poliitikad

---

## TEADAOLEVAD PROBLEEMID

Hetkel ei ole kriitilisi bugisid.

---

## JARMINE SAMM

1. **LOE:** `manual/04.12/02-QUICK-START.md`
2. **TUTVU:** `manual/04.12/00-CLAUDE-CODE-MASTER-JUHEND.md`
3. **PLANEERI:** `manual/04.12/01-IMPLEMENTATSIOONI-PLAAN.md`
4. **ALUSTA** implementatsiooniga vastavalt PHASE 1-8

---

## KONTAKT

**Projekt:** EOS2 - Enterprise Operating System 2
**Ettevote:** Rivest OU
**Arendaja:** Silver

---

**NB!** See fail tuleb uuendada iga suurema muudatuse jarel!
