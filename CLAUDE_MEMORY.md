# Claude Memory - EOS2 Laohaldussüsteem

## Tehtud tööd (2024-11-30)

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

## Süsteemi ülevaade

### Implementeeritud funktsioonid
- [x] Varade haldus (CRUD)
- [x] Tükikaupade/laoseisu haldus
- [x] Laoseisu liikumised
- [x] Madala laoseisu hoiatused
- [x] Ülekannete süsteem (warehouse/user/project)
- [x] Hoolduste planeerimine ja jälgimine
- [x] Kategooriate hierarhia
- [x] Fotogalerii
- [x] QR koodide genereerimine ja printimine
- [x] CSV eksport
- [x] RLS poliitikad multi-tenant turvalisuseks

### Tehniline arhitektuur
```
apps/web/
├── src/
│   ├── app/
│   │   ├── (dashboard)/warehouse/
│   │   │   ├── page.tsx              # Ülevaade
│   │   │   ├── assets/
│   │   │   │   ├── page.tsx          # Varade nimekiri
│   │   │   │   ├── new/page.tsx      # Lisa vara
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx      # Vara detail
│   │   │   │       └── edit/page.tsx # Muuda vara
│   │   │   ├── transfers/
│   │   │   │   ├── page.tsx          # Ülekanded
│   │   │   │   └── new/page.tsx      # Loo ülekanne
│   │   │   ├── maintenance/
│   │   │   │   ├── page.tsx          # Hooldused
│   │   │   │   └── new/page.tsx      # Lisa hooldus
│   │   │   └── categories/
│   │   │       └── page.tsx          # Kategooriate haldus
│   │   └── api/warehouse/
│   │       ├── assets/...
│   │       ├── categories/...
│   │       ├── maintenance/...
│   │       ├── transfers/...
│   │       ├── warehouses/...
│   │       ├── users/
│   │       └── projects/
│   └── components/warehouse/
│       ├── AssetsTable.tsx
│       ├── WarehouseStats.tsx
│       ├── LowStockAlerts.tsx
│       ├── PhotoGallery.tsx
│       ├── StockMovements.tsx
│       ├── QRCodeModal.tsx
│       └── index.ts
│
supabase/migrations/
├── 004_warehouse_management.sql  # Põhitabelid
├── 005_warehouse_enhanced.sql    # Täiendavad tabelid
└── 006_warehouse_rls.sql         # RLS poliitikad
```

## Konkurendid
- AssetTiger - https://www.assettiger.com/
- Asset Panda - https://www.assetpanda.com/

Meie eelised:
- Eestikeelne kasutajaliides
- Integreeritud projekti- ja töötajate haldusega
- Paindlik kategooriate süsteem
- Hoolduste planeerimine
- Tükikaupade/laoseisu jälgimine
- QR koodid ja mobiilne skaneerimine
