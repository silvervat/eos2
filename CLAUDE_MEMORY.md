# Claude Memory - EOS2 Enterprise Operating System

**Viimati uuendatud:** 2025-12-04
**Projekt:** EOS2 - Modulaarne ERP süsteem

---

## OLULINE - LOE ALATI ESIMESENA

1. **SYSTEM.md** - Süsteemi ülevaade, moodulid, struktuur
2. **TODO.md** - Pooleli asjad ja planeeritud tööd
3. **manual/04.12/** - Täielik dokumentatsioon modulaarse süsteemi kohta

---

## IMPLEMENTATSIOONI SEIS (2025-12-04)

### ✅ KÕIK 8 FAASI ON TEHTUD!

| Faas | Staatus | Kirjeldus |
|------|---------|-----------|
| PHASE 1 | ✅ DONE | Baassüsteem - DB migratsioonid |
| PHASE 2 | ✅ DONE | Õiguste süsteem - RBAC |
| PHASE 3 | ✅ DONE | Admin paneel - Dashboard |
| PHASE 4 | ✅ DONE | Registry süsteem - defineModule/registerModule |
| PHASE 5 | ✅ DONE | Design System - Tokens/Theme |
| PHASE 6 | ✅ DONE | Vehicles näidismoodul |
| PHASE 7 | ✅ DONE | Testimine - Unit testid |
| PHASE 8 | ✅ DONE | Dokumentatsioon |

---

## Tehtud tööd (2025-12-04) - Modulaarne süsteem

### PHASE 1: Baassüsteem
**Fail:** `supabase/migrations/008_modules_system.sql`

Loodud tabelid:
- `modules` - Moodulite register
- `components` - Komponentide register
- `module_actions` - Toimingud
- `roles` - 5 vaikerolli (owner, admin, manager, user, viewer)
- `user_module_access` - Kasutaja-mooduli õigused
- `user_component_access` - Kasutaja-komponendi õigused
- `module_relations` - Moodulite seosed

### PHASE 2: Õiguste süsteem
**Asukoht:** `apps/web/src/core/permissions/`

Failid:
- `roles.ts` - RoleType, RoleHierarchy (owner=100, admin=80, manager=60, user=40, viewer=20)
- `actions.ts` - BaseAction, AdminAction, WarehouseAction, ProjectAction, InvoiceAction, VehicleAction
- `matrix.ts` - PermissionMatrix, roleHasPermission, getAllPermissions
- `check.ts` - hasPermission, canAccessResource, getUserPermissions, filterByPermission
- `hooks.ts` - usePermission, useModulePermissions, useIsAdmin
- `components.tsx` - ProtectedComponent, AdminOnly, withPermission HOC

### PHASE 3: Admin paneel
**Asukoht:** `apps/web/src/app/(dashboard)/admin/`

Leheküljed:
- `page.tsx` - Admin dashboard (statistika, süsteemi tervis, TODO)
- `modules/page.tsx` - Moodulite haldus
- `permissions/page.tsx` - Õiguste maatriks

### PHASE 4: Registry süsteem
**Asukoht:** `apps/web/src/core/registry/`

Failid:
- `types.ts` - ModuleDefinition, FieldDefinition, PermissionDefinition jne
- `defineModule.ts` - defineModule() helper koos valideerimisega
- `registerModule.ts` - registerModule(), registerModules(), getModule()

### PHASE 5: Design System
**Asukoht:** `apps/web/src/design/`

Failid:
- `tokens.ts` - Design tokens (colors, spacing, typography, shadows, breakpoints, zIndex, status, transitions)
- `theme.ts` - Ant Design theme (antdTheme, antdDarkTheme)

Brand värv: `#279989` (Rivest teal)

### PHASE 6: Vehicles näidismoodul
**Asukoht:** `apps/web/src/modules/vehicles/`

Failid:
- `definition.ts` - Täielik mooduli definitsioon
- `MODULE.md` - Mooduli dokumentatsioon
- `index.ts` - Ekspordid
- `pages/index.tsx` - Nimekirja leht
- `pages/[id].tsx` - Detail leht
- `pages/new.tsx` - Lisamise leht
- `pages/edit.tsx` - Muutmise leht
- `components/VehicleForm.tsx` - Sõiduki vorm
- `components/VehicleCard.tsx` - Sõiduki kaart

**Template:** `apps/web/src/modules/_template/definition.ts`

### PHASE 7: Testid
**Asukoht:** `apps/web/src/`

Testifailid:
- `core/permissions/check.test.ts` - hasPermission, canAccessResource testid
- `core/permissions/matrix.test.ts` - PermissionMatrix, roleHasPermission testid
- `core/registry/defineModule.test.ts` - defineModule testid
- `core/registry/registerModule.test.ts` - registerModule, getModule testid
- `design/tokens.test.ts` - Design tokens testid

### PHASE 8: Dokumentatsioon
Uuendatud:
- `SYSTEM.md` - Versioon 2.1.0
- `TODO.md` - Kõik faasid märgitud tehtuks
- `CLAUDE_MEMORY.md` - See fail

---

## Dokumentatsiooni ülevaade

### Loodud failid
- `SYSTEM.md` - Süsteemi dokumentatsioon
- `TODO.md` - Pooleli ja planeeritud tööd
- `manual/04.12/` - EOS2 modulaarse süsteemi juhendid:
  - `00-INDEX.md` - Navigatsioon
  - `00-CLAUDE-CODE-MASTER-JUHEND.md` - Põhjalik 12-peatükkiline juhend
  - `01-IMPLEMENTATSIOONI-PLAAN.md` - 8-faasiline ehitusplaan
  - `02-QUICK-START.md` - Igapäevane juhend
  - `03-SUMMARY.md` - Kokkuvõte
  - `04-DOKUMENTATSIOONIPUU.md` - Visuaalne ülevaade

### Visioon
> **"Lego-stiilis ERP süsteem"** - uus moodul valmib 30 minutiga, kõik on ühes kohas hallatav

### 3 Peamist printsiipi
1. **Single Source of Truth** - üks definition.ts fail = kogu moodul
2. **DRY** - ära korda koodi, kasuta core komponente
3. **Automaatne registreerimine** - moodul on kohe nähtav kõikjal

---

## Tehtud tööd (2024-11-30) - Warehouse moodul

### Faas 1: Põhifunktsionaalsus
- SQL migratsioonid: `004_warehouse_management.sql`, `005_warehouse_enhanced.sql`
- TypeScript tüübid: `packages/types/src/warehouse.types.ts`
- API marsruudid:
  - `/api/warehouse/warehouses` - Ladude CRUD
  - `/api/warehouse/assets` - Varade CRUD
  - `/api/warehouse/transfers` - Ülekanded
- UI komponendid:
  - `AssetsTable.tsx` - Varade tabel filtritega
  - `WarehouseStats.tsx` - Statistika kaardid
- Leheküljed:
  - `/warehouse` - Ülevaade
  - `/warehouse/assets` - Varade nimekiri
  - `/warehouse/assets/[id]` - Vara detail
  - `/warehouse/transfers` - Ülekanded
- Navigatsioon lisatud `layout.tsx` faili

### Faas 2: Täiendused
- Stock movements API (`/api/warehouse/assets/[id]/stock`)
- Low stock alerts API (`/api/warehouse/assets/low-stock`)
- Photo gallery API (`/api/warehouse/assets/[id]/photos`)
- Komponendid:
  - `LowStockAlerts.tsx` - Madala laoseisu hoiatused
  - `StockMovements.tsx` - Laoseisu liikumised
  - `PhotoGallery.tsx` - Fotogalerii lightboxiga
- `useDebounce` hook (`/hooks/use-debounce.ts`)

### Faas 3: Tootmisvalmidus (30.11.2024)
- **Uued leheküljed:**
  - `/warehouse/assets/new` - Vara lisamise vorm
  - `/warehouse/assets/[id]/edit` - Vara muutmise vorm
  - `/warehouse/transfers/new` - Ülekande loomine
  - `/warehouse/maintenance` - Hoolduste nimekiri
  - `/warehouse/maintenance/new` - Hoolduse lisamine
  - `/warehouse/categories` - Kategooriate haldus

- **Uued API endpointid:**
  - `/api/warehouse/categories` - Kategooriate CRUD
  - `/api/warehouse/categories/[id]` - Kategooria detail
  - `/api/warehouse/maintenance` - Hoolduste CRUD
  - `/api/warehouse/maintenance/[id]` - Hoolduse detail
  - `/api/warehouse/users` - Kasutajate nimekiri (ülekanneteks)
  - `/api/warehouse/projects` - Projektide nimekiri (ülekanneteks)
  - `/api/warehouse/assets/export` - CSV/Excel eksport

- **Uued komponendid:**
  - `QRCodeModal.tsx` - QR koodi genereerimine ja printimine

- **RLS poliitikad:**
  - `006_warehouse_rls.sql` - Täielikud RLS poliitikad warehouse moodulile

---

## Olulised märkused

### Andmebaas
- `projects.id` on TEXT tüüp (mitte UUID) - seetõttu `assigned_to_project_id` on assets tabelis TEXT
- RLS poliitikad on nüüd olemas failis `006_warehouse_rls.sql`
- Arenduskeskkonnaks võib RLS välja lülitada:
```sql
ALTER TABLE warehouses DISABLE ROW LEVEL SECURITY;
ALTER TABLE assets DISABLE ROW LEVEL SECURITY;
ALTER TABLE asset_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE asset_photos DISABLE ROW LEVEL SECURITY;
ALTER TABLE asset_transfers DISABLE ROW LEVEL SECURITY;
ALTER TABLE asset_maintenances DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements DISABLE ROW LEVEL SECURITY;
```

### UI komponendid
- Kasuta `@rivest/ui` paketti (MITTE `@/components/ui/`)
- Tabelid on plain HTML + Tailwind CSS
- Brändi värv: `#279989`

### Tenant ID
- Test tenant: `16e26c26-2c98-4b58-a956-b86ac3becf14`

---

## Järgmine samm

### Järgmised prioriteedid:
1. **Supabase integratsioon:** Vehicles tabeli migratsioon + RLS poliitikad
2. **Core komponendid:** DataTable, FormBuilder, StatusBadge
3. **Uued moodulid:** projects, clients, invoices vastavalt _template'ile

---

**NB!** Uuenda seda faili iga suurema muudatuse järel!
