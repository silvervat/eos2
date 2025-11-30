# Failide Nimekiri manual/tables Kausta

## 📁 KOPEERI NEED FAILID

### 1. Põhidokumendid
Kopeeri need failid `/home/claude/` kataloogist `manual/tables/` kataloogi:

```
manual/tables/
├── TABLES-IMPLEMENTATION-GUIDE.md  ✅ Põhiline implementeerimise juhend
├── TABLES-QUICKSTART.md            ✅ Kiire alustamise juhend
└── FILES-TO-COPY.md                ✅ See fail
```

### 2. SQL Migratsioon
Loo see fail käsitsi või kopeeri guide'ist:

```
manual/tables/
└── 006_ultra_tables_system.sql     ⚠️ Kopeeri TABLES-IMPLEMENTATION-GUIDE.md failist
```

### 3. Olemasolevad Komponendid
Need on juba projektis olemas, aga reference'ks:

```
JUBA OLEMAS:
/apps/web/src/lib/ultra-table/column-types/
├── registry.ts                     ✅ 55 tüübi register
├── types.ts                        ✅ TypeScript definitsioonid
├── basic/                          ✅ 8 põhi tüüpi
├── selection/                      ✅ 7 valiku tüüpi
├── datetime/                       ✅ 6 kuupäeva tüüpi
├── people/                         ✅ 5 inimeste tüüpi
├── media/                          ✅ 7 meedia tüüpi
├── contact/                        ✅ 4 kontakti tüüpi
├── code/                           ✅ 4 koodi tüüpi
├── relations/                      ✅ 4 seose tüüpi
├── formulas/                       ✅ 2 valemi tüüpi
├── visual/                         ✅ 5 visuaalset tüüpi
└── advanced/                       ✅ 3 advanced tüüpi

/apps/web/src/components/admin/ultra-table/
├── column-manager/                 ✅ Veergude haldamine
└── dialog-designer/                ✅ Dialoogide disainer

/apps/web/src/components/shared/ultra-table/
├── DynamicCell.tsx                 ✅ Dünaamiline cell
├── useUltraTable.ts                ✅ Peamine hook
└── usePerformanceMonitor.ts        ✅ Performance jälgimine
```

## 📋 LOOMIST VAJAVAD FAILID

Claude Code peab looma need failid:

### API Routes (4 faili)
```
/apps/web/src/app/api/ultra-tables/
├── route.ts                        🆕 Loo see
├── [id]/
│   ├── route.ts                    🆕 Loo see
│   ├── columns/
│   │   └── route.ts                🆕 Loo see
│   └── records/
│       └── route.ts                🆕 Loo see
```

### UI Components (5 faili)
```
/apps/web/src/components/admin/ultra-tables/
├── CreateTableDialog.tsx           🆕 Loo see
├── TableDataView.tsx               🆕 Loo see
├── VirtualTable.tsx                🆕 Loo see
├── TableSettings.tsx               🆕 Loo see
└── ViewsManager.tsx                🆕 Loo see
```

### Pages (2 faili)
```
/apps/web/src/app/(dashboard)/admin/
├── ultra-tables/
│   ├── page.tsx                    🆕 Loo see (tabelite nimekiri)
│   └── [id]/
│       └── page.tsx                🆕 Loo see (tabeli detail)
└── menu/
    └── page.tsx                    🆕 Loo see (menüü haldus)
```

### Utilities (2 faili - valikuline)
```
/apps/web/src/lib/ultra-tables/
├── cache.ts                        🆕 Loo see (IndexedDB cache)
└── export.ts                       🆕 Loo see (CSV/XLSX export)
```

## 🔄 MUUDATUSI VAJAVAD FAILID

### 1. Dashboard Layout
```
/apps/web/src/app/(dashboard)/layout.tsx
```
**Muudatus:** Lisa 2 uut menüü elementi `adminItems` array'sse:
- `/admin/ultra-tables` - Tabelid
- `/admin/menu` - Menüü haldus

### 2. Supabase Migrations
```
/supabase/migrations/
└── 006_ultra_tables_system.sql     🆕 Loo see
```

## 📦 PACKAGE.JSON

Lisa need dependencid:
```json
{
  "dependencies": {
    "react-window": "^1.8.10",
    "@hello-pangea/dnd": "^16.5.0",
    "idb": "^8.0.0"
  }
}
```

## 🗂️ LÕPLIK STRUKTUUR

Pärast implementeerimist peaks projekt välja nägema nii:

```
eos2-main/
├── manual/
│   └── tables/
│       ├── TABLES-IMPLEMENTATION-GUIDE.md      ← SA KOPEERID
│       ├── TABLES-QUICKSTART.md                ← SA KOPEERID
│       ├── FILES-TO-COPY.md                    ← SA KOPEERID
│       └── 006_ultra_tables_system.sql         ← SA KOPEERID GUIDE'ist
│
├── supabase/
│   └── migrations/
│       └── 006_ultra_tables_system.sql         ← CLAUDE CODE LOOB
│
├── apps/web/src/
│   ├── app/
│   │   ├── api/
│   │   │   └── ultra-tables/                   ← CLAUDE CODE LOOB
│   │   │       ├── route.ts
│   │   │       └── [id]/
│   │   │           ├── route.ts
│   │   │           ├── columns/route.ts
│   │   │           └── records/route.ts
│   │   │
│   │   └── (dashboard)/
│   │       ├── layout.tsx                      ← CLAUDE CODE UUENDAB
│   │       └── admin/
│   │           ├── ultra-tables/               ← CLAUDE CODE LOOB
│   │           │   ├── page.tsx
│   │           │   └── [id]/page.tsx
│   │           └── menu/                       ← CLAUDE CODE LOOB
│   │               └── page.tsx
│   │
│   ├── components/
│   │   ├── admin/
│   │   │   ├── ultra-table/                    ← JUBA OLEMAS
│   │   │   │   ├── column-manager/
│   │   │   │   └── dialog-designer/
│   │   │   │
│   │   │   └── ultra-tables/                   ← CLAUDE CODE LOOB
│   │   │       ├── CreateTableDialog.tsx
│   │   │       ├── TableDataView.tsx
│   │   │       ├── VirtualTable.tsx
│   │   │       ├── TableSettings.tsx
│   │   │       └── ViewsManager.tsx
│   │   │
│   │   └── shared/
│   │       └── ultra-table/                    ← JUBA OLEMAS
│   │
│   ├── lib/
│   │   ├── ultra-table/                        ← JUBA OLEMAS
│   │   │   └── column-types/                   ← 55 TÜÜPI
│   │   │
│   │   └── ultra-tables/                       ← CLAUDE CODE LOOB (valikuline)
│   │       ├── cache.ts
│   │       └── export.ts
│   │
│   └── types/
│       └── ultra-table.ts                      ← JUBA OLEMAS
│
└── package.json                                ← CLAUDE CODE UUENDAB
```

## ✅ CHECKLIST KASUTAJALE

Enne Claude Code'le andmist:

- [ ] Kopeeri `TABLES-IMPLEMENTATION-GUIDE.md` → `manual/tables/`
- [ ] Kopeeri `TABLES-QUICKSTART.md` → `manual/tables/`
- [ ] Kopeeri `FILES-TO-COPY.md` → `manual/tables/`
- [ ] Kopeeri SQL migration guide'ist → `manual/tables/006_ultra_tables_system.sql`
- [ ] Commit muudatused Git'i
- [ ] Anna Claude Code'le teada, et failid on olemas

## 📝 CLAUDE CODE'LE ANTAV JUHIS

```
Tere Claude Code!

Palun implementeeri EOS2 projektis Ultra Tables süsteem järgides täpselt:
- manual/tables/TABLES-IMPLEMENTATION-GUIDE.md (detailne juhend)
- manual/tables/TABLES-QUICKSTART.md (kiire ülevaade)

Alusta SAMM 1'st ja tee kõik 5 sammu läbi.

Olulised märkused:
1. Kõik column types on juba olemas lib/ultra-table/column-types/
2. Column manager ja dialog designer on juba olemas components/admin/ultra-table/
3. Sul on vaja ainult luua API routes, UI komponendid ja pages
4. Järgi TÄPSELT guide'is olevat koodi - ära leia uusi lahendusi
5. Performance on KRIITILINE - kasuta virtual scrolling'ut

Alusta!
```

## 🎯 TULEMUS

Pärast kõike peaks Sul olema:
- ✅ Täielik tabelite haldussüsteem
- ✅ 55 erinevat veeru tüüpi
- ✅ 1M+ ridade tugi
- ✅ Professional admin UI
- ✅ Menüü haldus

**Edu!** 🚀
