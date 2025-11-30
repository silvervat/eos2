# 🚀 LAOHALDUSE KIIRE ALUSTAMISE JUHEND

## 📋 Sammud projekti alustamiseks

### 1. ANDMEBAASI SEADISTAMINE

#### Käivita SQL migratsioon
```bash
# Logi Supabase projekti
cd eos2-main

# Käivita migratsioon
supabase migration new warehouse_management
# Kopeeri 004_warehouse_management.sql sisu migration faili

# Rakenda migratsioon
supabase db push
```

#### Kontrolli tabeleid
```sql
-- Supabase SQL Editor's
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%asset%' OR table_name LIKE 'warehouse%';
```

### 2. API ROUTE'IDE LOOMINE

#### Loo kausta struktuur
```bash
cd apps/web/src/app/api
mkdir -p warehouse/{warehouses,assets,transfers,maintenance,orders,reminders,reports}
```

#### Kopeeri API failid
```bash
# Warehouses
touch warehouse/warehouses/route.ts
touch warehouse/warehouses/[id]/route.ts
touch warehouse/warehouses/[id]/stats/route.ts

# Assets
touch warehouse/assets/route.ts
touch warehouse/assets/[id]/route.ts
touch warehouse/assets/[id]/history/route.ts
touch warehouse/assets/[id]/photos/route.ts
touch warehouse/assets/scan/route.ts
touch warehouse/assets/low-stock/route.ts

# Transfers
touch warehouse/transfers/route.ts
touch warehouse/transfers/[id]/route.ts
touch warehouse/transfers/[id]/approve/route.ts
touch warehouse/transfers/[id]/complete/route.ts
touch warehouse/transfers/pending/route.ts

# Maintenance
touch warehouse/maintenance/route.ts
touch warehouse/maintenance/[id]/route.ts
touch warehouse/maintenance/upcoming/route.ts
touch warehouse/maintenance/overdue/route.ts

# Orders
touch warehouse/orders/route.ts
touch warehouse/orders/[id]/route.ts
```

Kasuta `api-routes-examples.ts` faili sisu nende route'ide loomiseks.

### 3. UI KOMPONENTIDE LOOMINE

#### Loo warehouse komponendid
```bash
cd apps/web/src/components
mkdir -p warehouse
```

#### Põhikomponendid
```
components/warehouse/
├── AssetsTable.tsx          # ✅ On juba näite fail
├── AssetDetail.tsx          # Vara detailvaade
├── AddAssetDialog.tsx       # Uue vara lisamine
├── TransfersTable.tsx       # Ülekannete tabel
├── CreateTransferDialog.tsx # Ülekande loomine
├── MaintenanceCalendar.tsx  # Hoolduste kalender
├── QRScanner.tsx            # QR/Barcode scanner
├── PhotoGallery.tsx         # Fotogalerii
├── WarehouseStats.tsx       # Statistika kaardid
└── RemindersPanel.tsx       # Meeldetuletused
```

### 4. LEHTEDE LOOMINE

#### Loo warehouse lehekülgede struktuur
```bash
cd apps/web/src/app/(dashboard)
mkdir -p warehouse/{assets,transfers,maintenance,orders,reports}
```

#### Põhilehed
```
warehouse/
├── page.tsx                  # Ülevaade
├── assets/
│   ├── page.tsx             # Varade nimekiri
│   └── [id]/page.tsx        # Vara detailvaade
├── transfers/
│   ├── page.tsx             # Ülekanded
│   └── [id]/page.tsx        # Ülekande detailvaade
├── maintenance/
│   └── page.tsx             # Hoolduste kalender
├── orders/
│   └── page.tsx             # Tellimused
└── reports/
    └── page.tsx             # Raportid
```

#### Näide: warehouse/page.tsx (Ülevaade)
```tsx
// apps/web/src/app/(dashboard)/warehouse/page.tsx
import { WarehouseStats } from '@/components/warehouse/WarehouseStats';
import { RemindersPanel } from '@/components/warehouse/RemindersPanel';
import { Button } from '@/components/ui/button';
import { Plus, QrCode, ArrowRightLeft } from 'lucide-react';

export default async function WarehousePage() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Laohaldus</h1>
          <p className="text-muted-foreground">
            Varade ja tükikaupade haldamine
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Lisa vara
          </Button>
          <Button variant="outline">
            <QrCode className="h-4 w-4 mr-2" />
            Skaneeri
          </Button>
          <Button variant="outline">
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Loo ülekanne
          </Button>
        </div>
      </div>
      
      {/* Statistika kaardid */}
      <WarehouseStats />
      
      {/* Meeldetuletused ja hoiatused */}
      <RemindersPanel />
      
      {/* Viimane aktiivsus */}
      <RecentActivity />
    </div>
  );
}
```

### 5. NAVIGATSIOONI MENÜÜ UUENDAMINE

#### Lisa warehouse menüü
```tsx
// apps/web/src/components/layout/Sidebar.tsx
const menuItems = [
  // ... existing items
  {
    title: 'Laohaldus',
    icon: Warehouse,
    items: [
      { title: 'Ülevaade', href: '/warehouse', icon: LayoutDashboard },
      { title: 'Varad', href: '/warehouse/assets', icon: Package },
      { title: 'Ülekanded', href: '/warehouse/transfers', icon: ArrowRightLeft },
      { title: 'Hooldused', href: '/warehouse/maintenance', icon: Wrench },
      { title: 'Tellimused', href: '/warehouse/orders', icon: ShoppingCart },
      { title: 'Raportid', href: '/warehouse/reports', icon: FileText },
    ]
  },
];
```

### 6. SUPABASE RLS POLICIES

#### Lisa Row Level Security policies
```sql
-- Vaata 004_warehouse_management.sql lõpus olevat RLS sektsiooni
-- või lisa need käsitsi:

-- Warehouses
CREATE POLICY "Users can view own tenant warehouses"
  ON warehouses FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles
      WHERE auth_user_id = auth.uid()
    )
  );

-- Assets
CREATE POLICY "Users can view own tenant assets"
  ON assets FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles
      WHERE auth_user_id = auth.uid()
    )
  );

-- Transfers
CREATE POLICY "Users can view own transfers"
  ON asset_transfers FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles
      WHERE auth_user_id = auth.uid()
    )
  );

-- jne...
```

### 7. TYPESCRIPTI TÜÜBID

#### Loo tüübid
```bash
cd packages/types/src
touch warehouse.types.ts
```

```typescript
// packages/types/src/warehouse.types.ts
export interface Warehouse {
  id: string;
  tenant_id: string;
  code: string;
  name: string;
  type: 'main' | 'mobile' | 'external' | 'vehicle';
  location?: string;
  address?: string;
  manager_id?: string;
  status: 'active' | 'inactive' | 'maintenance';
  created_at: string;
  updated_at: string;
}

export interface Asset {
  id: string;
  tenant_id: string;
  category_id?: string;
  asset_code: string;
  barcode?: string;
  qr_code?: string;
  serial_number?: string;
  name: string;
  type: 'asset' | 'consumable' | 'tool';
  status: 'available' | 'in_use' | 'maintenance' | 'rented' | 'retired';
  condition: 'excellent' | 'good' | 'fair' | 'poor';
  current_warehouse_id?: string;
  assigned_to_user_id?: string;
  assigned_to_project_id?: string;
  is_consumable: boolean;
  quantity_available?: number;
  quantity_unit?: string;
  min_quantity?: number;
  max_quantity?: number;
  purchase_price?: number;
  current_value?: number;
  created_at: string;
  updated_at: string;
}

export interface AssetTransfer {
  id: string;
  tenant_id: string;
  transfer_number: string;
  asset_id: string;
  quantity: number;
  status: 'pending' | 'in_transit' | 'delivered' | 'rejected' | 'cancelled';
  transfer_type: 'warehouse' | 'user' | 'project' | 'rental_out' | 'rental_return';
  from_warehouse_id?: string;
  to_warehouse_id?: string;
  from_user_id?: string;
  to_user_id?: string;
  requested_by_user_id: string;
  created_at: string;
  updated_at: string;
}

// Lisa teised tüübid...
```

### 8. REACT QUERY SETUP

#### Seadista cache keys
```typescript
// apps/web/src/lib/query-keys.ts
export const WAREHOUSE_KEYS = {
  all: ['warehouse'] as const,
  warehouses: () => [...WAREHOUSE_KEYS.all, 'warehouses'] as const,
  warehouse: (id: string) => [...WAREHOUSE_KEYS.all, 'warehouse', id] as const,
  assets: (filters?: any) => [...WAREHOUSE_KEYS.all, 'assets', filters] as const,
  asset: (id: string) => [...WAREHOUSE_KEYS.all, 'asset', id] as const,
  transfers: (status?: string) => [...WAREHOUSE_KEYS.all, 'transfers', status] as const,
  maintenance: (filters?: any) => [...WAREHOUSE_KEYS.all, 'maintenance', filters] as const,
  reminders: () => [...WAREHOUSE_KEYS.all, 'reminders'] as const,
};
```

#### Custom hooks näide
```typescript
// apps/web/src/hooks/use-assets.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { WAREHOUSE_KEYS } from '@/lib/query-keys';

export function useAssets(filters?: any) {
  return useQuery({
    queryKey: WAREHOUSE_KEYS.assets(filters),
    queryFn: async () => {
      const params = new URLSearchParams(filters);
      const res = await fetch(`/api/warehouse/assets?${params}`);
      if (!res.ok) throw new Error('Failed to fetch assets');
      return res.json();
    },
  });
}

export function useAsset(id: string) {
  return useQuery({
    queryKey: WAREHOUSE_KEYS.asset(id),
    queryFn: async () => {
      const res = await fetch(`/api/warehouse/assets/${id}`);
      if (!res.ok) throw new Error('Failed to fetch asset');
      return res.json();
    },
    enabled: !!id,
  });
}

export function useCreateAsset() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/warehouse/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create asset');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: WAREHOUSE_KEYS.assets() });
    },
  });
}
```

### 9. TESTIMINE

#### Testimise checklist
- [ ] API route'id töötavad (Postman/Insomnia)
- [ ] Andmebaasi kirjutamine/lugemine toimib
- [ ] RLS policies on õiged
- [ ] UI komponendid renderdavad
- [ ] Formid salvestavad andmeid
- [ ] Otsing ja filtreerimine töötab
- [ ] QR koodide genereerimine
- [ ] Fotode üleslaadimine
- [ ] Meeldetuletused
- [ ] Raportid

### 10. DEPLOY

#### Supabase production
```bash
# Production environment
supabase link --project-ref your-production-ref
supabase db push
```

#### Vercel/Production build
```bash
# Build
pnpm build

# Deploy
vercel --prod
```

---

## 📝 JÄRGMISED SAMMUD

### Faas 1 (praegu)
1. ✅ Andmebaasi migratsioon
2. ✅ Põhi API route'id (warehouses, assets)
3. ✅ Varade tabel komponent
4. ⏳ Vara detailvaade
5. ⏳ Vara lisamine (modal)

### Faas 2
1. Consumables loogika
2. Stock movements
3. Low stock alerts

### Faas 3
1. Fotogalerii
2. QR scanner
3. QR printing

### Faas 4
1. Ülekannete süsteem
2. Workflow kinnitused

### Faas 5
1. Hoolduste haldus
2. Hoolduste kalender

---

## 🆘 PROBLEEMIDE LAHENDAMINE

### "Failed to fetch" error
- Kontrolli, kas API route on õiges kaustas
- Vaata browser console'i täpsemat viga
- Kontrolli Supabase ühendust

### RLS policy error
- Kontrolli, kas kasutajal on õige tenant_id
- Vaata Supabase logs
- Testi SQL otse Supabase editor'is

### TypeScript errors
- Käivita `pnpm type-check`
- Kontrolli, kas kõik tüübid on importitud
- Uuenda @types pakette

---

## 📞 ABI

Kui tekib küsimusi või probleeme:
1. Vaata detailset plaani: `LAOHALDUS-IMPLEMENTATSIOON-PLAAN.md`
2. Vaata SQL migratsiooni: `004_warehouse_management.sql`
3. Vaata API näiteid: `api-routes-examples.ts`
4. Vaata komponendi näidet: `AssetsTable-component.tsx`

**Valmis alustama? Let's go! 🚀**
