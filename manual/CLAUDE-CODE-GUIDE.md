# 🤖 CLAUDE CODE - LAOHALDUSE ALUSTAMISE JUHEND

## 📋 Ülevaade

See juhend näitab, kuidas Claude Code abil kiiresti ja tõhusalt EOS2 projekti laohaldussüsteemi ehitada.

---

## 🚀 KIIRE ALGUS

### 1. Esmakordne Seadistamine

```bash
# 1. Klooni projekt
git clone <your-eos2-repo>
cd eos2-main

# 2. Installi sõltuvused
pnpm install

# 3. Seadista Supabase
cp manual/.env.example apps/web/.env.local
# Täida .env.local Supabase kredentsiaalidega
```

### 2. Andmebaasi Migratsioonid

**Claude Code'ile:**
```
Palun rakenda järgmised migratsioonid Supabase'i:

1. Loe fail: manual/warehouse/004_warehouse_management.sql
2. Loe fail: manual/warehouse/005_warehouse_enhanced.sql
3. Rakenda need Supabase projektile

Kui vaja, jaga väiksemateks osadeks ja käivita järjest.
```

**Käsitsi alternatiiv:**
```bash
# Supabase CLI kaudu
supabase db push

# Või Supabase Dashboard's:
# Settings → Database → SQL Editor
# Kopeeri iga migratsiooni sisu ja käivita
```

### 3. API Route'ide Loomine

**Claude Code'ile:**
```
Loo järgmised API route'id:

Põhinedes näidisfailil: manual/warehouse/api-routes-examples.ts

1. apps/web/src/app/api/warehouse/warehouses/route.ts
2. apps/web/src/app/api/warehouse/warehouses/[id]/route.ts
3. apps/web/src/app/api/warehouse/assets/route.ts
4. apps/web/src/app/api/warehouse/assets/[id]/route.ts
5. apps/web/src/app/api/warehouse/assets/[id]/history/route.ts
6. apps/web/src/app/api/warehouse/assets/scan/route.ts
7. apps/web/src/app/api/warehouse/transfers/route.ts
8. apps/web/src/app/api/warehouse/transfers/[id]/approve/route.ts

Kasuta Supabase client'i ja TypeScripti.
Järgi olemasolevat mustrit teistest API route'idest.
```

### 4. Tüüpide Defineerimine

**Claude Code'ile:**
```
Loo warehouse tüübid:

Fail: packages/types/src/warehouse.types.ts

Defineeri:
- Warehouse interface
- Asset interface
- AssetTransfer interface
- WarehouseLocation interface
- AssetRelation interface
- InventoryCount interface
- MaintenanceCostItem interface

Ekspordi kõik index.ts failis.
```

### 5. UI Komponentide Loomine

**Claude Code'ile - Faas 1:**
```
Loo järgmised komponendid:

1. apps/web/src/components/warehouse/WarehouseStats.tsx
   - Statistika kaardid (total, available, in_use, jne)
   - Kasuta Card, Badge komponente

2. apps/web/src/components/warehouse/AssetsTable.tsx
   - Vaata näidet: manual/warehouse/AssetsTable-component.tsx
   - Lisa filters, search, pagination
   - Ultra Table või tavaline Table

3. apps/web/src/components/warehouse/AssetDetail.tsx
   - Tabs: Ülevaade, Fotod, Ajalugu, Hooldused
   - Näita kõik vara detailid
   - Quick actions (transfer, maintenance, jne)

Kasuta shadcn/ui komponente ja Tailwind CSS'i.
```

**Claude Code'ile - Faas 2:**
```
Loo täiendavad komponendid:

1. apps/web/src/components/warehouse/AddAssetDialog.tsx
   - Stepper vorm (6 sammu)
   - Form validation (zod)
   - Photo upload

2. apps/web/src/components/warehouse/TransferCart.tsx
   - Zustand store
   - Sheet komponent
   - Bulk transfer creation

3. apps/web/src/components/warehouse/QRScanner.tsx
   - html5-qrcode library
   - Camera access
   - Scan result handling

4. apps/web/src/components/warehouse/LocationPicker.tsx
   - Tree select
   - Hierarchical display
   - Path breadcrumbs
```

### 6. Lehtede Loomine

**Claude Code'ile:**
```
Loo warehouse lehekülgi:

1. apps/web/src/app/(dashboard)/warehouse/page.tsx
   - Dashboard layout
   - Stats widgets
   - Quick actions
   - Recent activity

2. apps/web/src/app/(dashboard)/warehouse/assets/page.tsx
   - Assets table
   - Filters & search
   - Bulk actions
   - Add asset button

3. apps/web/src/app/(dashboard)/warehouse/assets/[id]/page.tsx
   - Asset detail view
   - Tabs
   - Actions menu

Kasuta async/await server components kus võimalik.
```

---

## 🎯 SAMM-SAMMULT ARENDUS

### FAAS 1: Põhifunktsioonid (1-2 nädalat)

**Päev 1-2: Andmebaas & API**
```
Claude Code'ile:

1. Rakenda migratsioonid (004 ja 005)
2. Kontrolli tabelite loomist
3. Loo API route'id: warehouses, assets
4. Testi API'sid (GET, POST, PUT, DELETE)
```

**Päev 3-4: Põhikomponendid**
```
Claude Code'ile:

1. Loo WarehouseStats komponent
2. Loo AssetsTable komponent
3. Loo warehouse/page.tsx
4. Loo warehouse/assets/page.tsx
5. Testi UI'des andmete kuvamine
```

**Päev 5-7: Detailvaated**
```
Claude Code'ile:

1. Loo AssetDetail komponent
2. Loo AddAssetDialog komponent
3. Implementeeri fotode upload
4. Loo warehouse/assets/[id]/page.tsx
5. Testi vara lisamine ja kuvamine
```

### FAAS 2: Asukohtade Süsteem (3-5 päeva)

```
Claude Code'ile:

1. Loo LocationPicker komponent
   - Tree select dropdown
   - Location path display
   - Barcode support

2. Loo WarehouseLocationSettings komponent
   - Location levels configuration
   - Location type management

3. Lisa asukohad AssetsTable'isse
4. Lisa asukohad AssetDetail'i
5. Implementeeri location scanning

Test: Lisa ladu koos asukohtadega, määra varale asukoht
```

### FAAS 3: Fotod & Metadata (3-5 päeva)

```
Claude Code'ile:

1. Implementeeri photo metadata service
   - Auto-generate watermark
   - Location info
   - Transfer info
   - Compression

2. Loo PhotoGallery komponent
   - Grid view
   - Category filters
   - Upload modal
   - Metadata display

3. Lisa fotod transfer workflow'sse
   - Check-out photos
   - Check-in photos
   - Auto-metadata

Test: Lisa fotosid varele erinevatel viisidel
```

### FAAS 4: Ülekannete Süsteem (5-7 päeva)

```
Claude Code'ile:

1. Loo TransfersTable komponent
2. Loo CreateTransferDialog komponent
3. Loo TransferCart komponent (Zustand)
4. Implementeeri transfer workflow
   - Create
   - Approve
   - In transit
   - Complete

5. Loo warehouse/transfers/page.tsx
6. Lisa notifications

Test: Loo ülekanne, kinnita, lõpeta
```

### FAAS 5: Tükikaubad & Kaalud (3-4 päeva)

```
Claude Code'ile:

1. Loo WeighingAssistant komponent
2. Implementeeri average price calculation
3. Lisa stock movements tracking
4. Loo low stock alerts

Test: Lisa consumable, osta juurde, vaata keskmist hinda
```

### FAAS 6: Inventuur (5-7 päeva)

```
Claude Code'ile:

1. Loo inventory count creation
2. Loo InventoryMobile komponent
   - Scanner integration
   - Location workflow
   - Photo capture
   - Variance tracking

3. Loo inventory reports
4. Implementeeri adjustment workflow

Test: Tee inventuur ühes asukohas
```

### FAAS 7: Hooldused & Kulud (3-5 päeva)

```
Claude Code'ile:

1. Loo MaintenanceCalendar komponent
2. Loo MaintenanceCostForm komponent
3. Implementeeri cost tracking
4. Loo cost reports & analytics

Test: Lisa hooldus kuludega, vaata statistikat
```

### FAAS 8: Excel Import/Export (2-3 päeva)

```
Claude Code'ile:

1. Implementeeri Excel import service
   - Column mapping
   - Validation
   - Bulk create

2. Implementeeri Excel export service
   - Custom columns
   - Formatting

3. Loo ImportDialog komponent
4. Loo ExportDialog komponent

Test: Impordi 100 vara, ekspordi tagasi
```

### FAAS 9: Varade Seosed (2-3 päeva)

```
Claude Code'ile:

1. Loo AssetRelations management
2. Lisa related assets AssetDetail'i
3. Implementeeri auto-transfer logic
4. Loo relations UI transfer dialog'is

Test: Loo trell + akud seos, testi ülekandeid
```

### FAAS 10: Täiendused & Polish (1 nädal)

```
Claude Code'ile:

1. Lisa bulk editing
2. Lisa audit logging UI
3. Optimiseeri päringud
4. Lisa keyboard shortcuts
5. Mobile optimizations
6. Error handling
7. Loading states
8. Empty states
9. Dokumentatsioon
10. Testimine
```

---

## 💡 CLAUDE CODE KASUTUSNÄITED

### Näide 1: Loo API Route
```
Prompt Claude Code'ile:

Loo fail: apps/web/src/app/api/warehouse/assets/route.ts

Implementeeri GET ja POST meetodid:

GET:
- Võta parameetrid: search, warehouse_id, category_id, status, page, limit
- Supabase päring assets tabelile
- Kaasa category, warehouse, assigned_user info
- Tagasta { data, pagination }

POST:
- Valideeri body (zod schema)
- Loo uus vara
- Genereeri QR kood
- Kui consumable, loo stock movement
- Tagasta loodud vara

Kasuta olemasolevaid API route'e näitena.
Kasuta TypeScripti ja error handling'ut.
```

### Näide 2: Loo Komponent
```
Prompt Claude Code'ile:

Loo fail: apps/web/src/components/warehouse/AssetCard.tsx

Props:
- asset: Asset
- onClick?: (asset: Asset) => void
- onQuickAdd?: (asset: Asset) => void

Näita:
- Foto (või placeholder)
- Nimi, kood
- Staatus badge
- Asukoht
- Quick actions (view, add to cart)

Kasuta Card, Badge, Button komponente.
Responsive design.
```

### Näide 3: Debugimine
```
Prompt Claude Code'ile:

Mul on viga API route'is:
apps/web/src/app/api/warehouse/assets/route.ts

Error: "Cannot read property 'id' of undefined"

Palun:
1. Leia viga
2. Paranda
3. Selgita, mis valesti oli
4. Lisa error handling
```

### Näide 4: Refaktoreerimine
```
Prompt Claude Code'ile:

Refaktoreeri AssetsTable komponent:

1. Tõsta filtrid eraldi komponendiks
2. Tõsta table rows eraldi komponendiks
3. Lisa virtualization (react-window)
4. Optimiseeri re-renders

Hoia funktsionaalsus samaks.
```

### Näide 5: Testimine
```
Prompt Claude Code'ile:

Loo testid failile:
apps/web/src/components/warehouse/AssetsTable.tsx

Kasuta @testing-library/react
Test:
1. Renders correctly
2. Search works
3. Filters apply
4. Pagination works
5. Bulk actions work
```

---

## 🔍 LEIA OLULIST

### Kus on mis?

**Andmebaasi struktuur:**
- `manual/warehouse/004_warehouse_management.sql` - Põhitabelid
- `manual/warehouse/005_warehouse_enhanced.sql` - Täiendused

**API näited:**
- `manual/warehouse/api-routes-examples.ts` - Kõik route'id

**Komponendi näited:**
- `manual/warehouse/AssetsTable-component.tsx` - Tabel näide

**Plaanid:**
- `manual/warehouse/WAREHOUSE-ENHANCED-PLAN.md` - Detailne plaan
- `manual/warehouse/KIIRE-ALUSTAMISE-JUHEND.md` - Quick start

**TypeScript tüübid:**
- Vaata olemasolevaid: `packages/types/src/`

---

## 🎨 KOODISTIIL & PARIMAD PRAKTIKAD

### 1. API Route'id
```typescript
// ✅ Hea
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    // ...
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ❌ Halb
export async function GET(req) {
  const data = await fetch(...)
  return NextResponse.json(data)
}
```

### 2. Komponendid
```typescript
// ✅ Hea
interface AssetCardProps {
  asset: Asset;
  onClick?: (asset: Asset) => void;
}

export function AssetCard({ asset, onClick }: AssetCardProps) {
  // ...
}

// ❌ Halb
export function AssetCard(props) {
  // ...
}
```

### 3. State Management
```typescript
// ✅ Hea - React Query
const { data, isLoading } = useQuery({
  queryKey: ['assets', filters],
  queryFn: fetchAssets
});

// ✅ Hea - Zustand (global state)
const cart = useTransferCart();

// ❌ Halb - useState for server data
const [assets, setAssets] = useState([]);
```

---

## ⚠️ LEVINUD VEAD & LAHENDUSED

### 1. Supabase RLS Error
**Probleem:** "Row level security policy violated"
**Lahendus:**
```sql
-- Kontrolli policies
SELECT * FROM pg_policies WHERE tablename = 'assets';

-- Lisa puuduv policy
CREATE POLICY "Users view own tenant" ON assets
  FOR SELECT USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles 
      WHERE auth_user_id = auth.uid()
    )
  );
```

### 2. TypeScript tüübi viga
**Probleem:** "Property 'xyz' does not exist on type"
**Lahendus:**
```typescript
// Lisa tüüp
interface Asset {
  // ... existing fields
  xyz: string; // Lisa puuduv väli
}
```

### 3. React Query ei uuenda
**Probleem:** Andmed ei uuene pärast mutatsiooni
**Lahendus:**
```typescript
const mutation = useMutation({
  mutationFn: createAsset,
  onSuccess: () => {
    // Lisa invalidation
    queryClient.invalidateQueries({ queryKey: ['assets'] });
  }
});
```

---

## 📊 EDENEMISE JÄLGIMINE

### Checklist
```
Faas 1: Põhifunktsioonid
- [ ] Andmebaas üles
- [ ] API route'id (warehouses, assets)
- [ ] AssetsTable komponent
- [ ] Warehouse overview page
- [ ] Asset detail page
- [ ] Add asset dialog

Faas 2: Asukohtad
- [ ] Location picker
- [ ] Location settings
- [ ] Location scanning

Faas 3: Fotod
- [ ] Photo gallery
- [ ] Photo metadata
- [ ] Photo upload

Faas 4: Ülekanded
- [ ] Transfer creation
- [ ] Transfer cart
- [ ] Transfer workflow
- [ ] Transfer approvals

... jne
```

---

## 🚀 PRODUKTSIOONI DEPLOY

```bash
# 1. Build
pnpm build

# 2. Kontrolli env muutujaid
# Production Supabase URL & Keys

# 3. Deploy Vercel'sse
vercel --prod

# 4. Käivita production migratsioonid
supabase db push --project-ref your-prod-ref
```

---

## 📞 ABI

Kui jääd hätta:
1. Kontrolli dokumentatsiooni (manual/ kaust)
2. Vaata näiteid (api-routes-examples.ts)
3. Küsi Claude Code'ilt
4. Kontrolli Supabase logs
5. Vaata browser console

---

**Edu arendamisel! 🎉**
