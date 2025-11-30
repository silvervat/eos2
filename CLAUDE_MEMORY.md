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

## Olulised märkused

### Andmebaas
- `projects.id` on TEXT tüüp (mitte UUID) - seetõttu `assigned_to_project_id` on assets tabelis TEXT
- RLS peab olema DISABLED warehouse tabelitel arenduse ajaks:
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

### Tenant ID
- Test tenant: `16e26c26-2c98-4b58-a956-b86ac3becf14`

## Järgmised sammud (TODO)
- [ ] Lisa "Lisa vara" vorm (`/warehouse/assets/new`)
- [ ] Lisa "Loo ülekanne" vorm (`/warehouse/transfers/new`)
- [ ] Lisa hoolduste leht (`/warehouse/maintenance`)
- [ ] Lisa QR koodi genereerimine
- [ ] Lisa ekspordi funktsioon (CSV/Excel)
- [ ] Lisa RLS poliitikad tootmiseks
