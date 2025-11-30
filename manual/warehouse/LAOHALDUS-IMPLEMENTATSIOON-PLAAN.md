# 🏗️ LAOHALDUSRAKENDUSE DETAILNE IMPLEMENTATSIOONIPLAANI

## 📋 SISUKORD

1. [Ülevaade](#ülevaade)
2. [Andmebaasi Mudel](#andmebaasi-mudel)
3. [API Struktuur](#api-struktuur)
4. [UI Komponendid](#ui-komponendid)
5. [Funktsioonid & Moodulid](#funktsioonid--moodulid)
6. [Implementatsiooni Järjekord](#implementatsiooni-järjekord)
7. [Tehnilised Detailid](#tehnilised-detailid)

---

## 🎯 ÜLEVAADE

### Eesmärk
Luua terviklik laohaldussüsteem, mis asendab Hilti ONTrack, AssetTiger ja AssetPanda funktsionaalsused ühe platvormina.

### Põhifunktsioonid
- ✅ Mitme lao haldus
- ✅ Varade ja tükikaupade (consumables) jälgimine
- ✅ QR/ribakoodide skaneerimine
- ✅ Fotogaleriid (enne/pärast)
- ✅ Hoolduskavad ja meeldetuletused
- ✅ Ülekanded ja kinnitused
- ✅ Ajaloo jälgimine (kes, kus, mis projektil)
- ✅ Automaatsed raportid ja teatised
- ✅ Min/max koguste jälgimine
- ✅ Keskmine hinna arvutus
- ✅ Kindlustused ja fleedi aruandlus
- ✅ Rendi jälgimine

---

## 🗄️ ANDMEBAASI MUDEL

### 1. Ladude Tabelid

#### `warehouses` - Laod
```sql
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'main', -- 'main', 'mobile', 'external', 'vehicle'
  location TEXT,
  address TEXT,
  manager_id UUID REFERENCES user_profiles(id),
  contact_phone TEXT,
  contact_email TEXT,
  capacity_m3 DECIMAL(10,2),
  temperature_controlled BOOLEAN DEFAULT false,
  security_level TEXT DEFAULT 'standard', -- 'low', 'standard', 'high', 'maximum'
  access_hours TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'maintenance'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(tenant_id, code)
);

CREATE INDEX idx_warehouses_tenant ON warehouses(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_warehouses_status ON warehouses(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_warehouses_manager ON warehouses(manager_id) WHERE deleted_at IS NULL;
```

### 2. Kategooriate Tabelid

#### `asset_categories` - Kategooriad (lõputu hierarhia)
```sql
CREATE TABLE asset_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES asset_categories(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  path TEXT, -- Materialized path: /parent/child/grandchild
  level INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  requires_maintenance BOOLEAN DEFAULT false,
  maintenance_interval_days INTEGER,
  is_consumable BOOLEAN DEFAULT false, -- Kas tükikaup (kruvid, värvid) või vara (masinad)
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(tenant_id, code)
);

CREATE INDEX idx_categories_tenant ON asset_categories(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_categories_parent ON asset_categories(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_categories_path ON asset_categories USING GIN(path gin_trgm_ops);
CREATE INDEX idx_categories_consumable ON asset_categories(is_consumable) WHERE deleted_at IS NULL;
```

### 3. Varade/Toodete Tabelid

#### `assets` - Varad ja Tooted
```sql
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES asset_categories(id),
  
  -- Identifikatsioon
  asset_code TEXT NOT NULL,
  barcode TEXT,
  qr_code TEXT,
  serial_number TEXT,
  
  -- Põhiinfo
  name TEXT NOT NULL,
  model TEXT,
  manufacturer TEXT,
  description TEXT,
  keywords TEXT[], -- Otsinguks
  
  -- Tüüp ja staatus
  type TEXT DEFAULT 'asset', -- 'asset' (vara), 'consumable' (tükikaup), 'tool' (tööriist)
  status TEXT DEFAULT 'available', -- 'available', 'in_use', 'maintenance', 'rented', 'retired', 'lost', 'damaged'
  condition TEXT DEFAULT 'good', -- 'excellent', 'good', 'fair', 'poor'
  
  -- Asukoht
  current_warehouse_id UUID REFERENCES warehouses(id),
  current_location TEXT, -- Täpne asukoht laos (riiul, kast jne)
  
  -- Kasutaja ja projekt
  assigned_to_user_id UUID REFERENCES user_profiles(id),
  assigned_to_project_id UUID REFERENCES projects(id),
  assigned_at TIMESTAMPTZ,
  
  -- Hinnad (consumables puhul keskmine hind)
  purchase_price DECIMAL(15,2),
  current_value DECIMAL(15,2),
  average_price DECIMAL(15,2), -- Ainult consumables jaoks
  currency TEXT DEFAULT 'EUR',
  
  -- Tükikaupade spetsiifilised väljad
  is_consumable BOOLEAN DEFAULT false,
  quantity_available DECIMAL(10,2) DEFAULT 0,
  quantity_reserved DECIMAL(10,2) DEFAULT 0,
  quantity_unit TEXT DEFAULT 'tk', -- 'tk', 'kg', 'l', 'm', 'm2', 'm3'
  min_quantity DECIMAL(10,2), -- Minimaalne kogus
  max_quantity DECIMAL(10,2), -- Maksimaalne kogus
  reorder_point DECIMAL(10,2), -- Kui alla selle, siis hoiatus
  reorder_quantity DECIMAL(10,2), -- Kui palju tellida
  
  -- Hooldus
  requires_maintenance BOOLEAN DEFAULT false,
  maintenance_interval_days INTEGER,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  maintenance_notes TEXT,
  
  -- Rentimine
  is_rental BOOLEAN DEFAULT false,
  rental_start_date DATE,
  rental_end_date DATE,
  rental_company TEXT,
  rental_contract_number TEXT,
  rental_monthly_cost DECIMAL(15,2),
  rental_deposit DECIMAL(15,2),
  
  -- Kindlustus
  is_insured BOOLEAN DEFAULT false,
  insurance_company TEXT,
  insurance_policy_number TEXT,
  insurance_value DECIMAL(15,2),
  insurance_expires_at DATE,
  
  -- Kuupäevad ja audit
  purchase_date DATE,
  warranty_expires_at DATE,
  acquisition_date DATE,
  retirement_date DATE,
  
  -- Muud
  dimensions TEXT, -- 'L x W x H'
  weight_kg DECIMAL(10,2),
  color TEXT,
  notes TEXT,
  defects JSONB DEFAULT '[]', -- Puuduste ajalugu
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(tenant_id, asset_code)
);

-- Indeksid
CREATE INDEX idx_assets_tenant ON assets(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_category ON assets(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_warehouse ON assets(current_warehouse_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_assigned_user ON assets(assigned_to_user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_assigned_project ON assets(assigned_to_project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_status ON assets(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_barcode ON assets(barcode) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_qr ON assets(qr_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_serial ON assets(serial_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_consumable ON assets(is_consumable) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_rental ON assets(is_rental) WHERE is_rental = true AND deleted_at IS NULL;
CREATE INDEX idx_assets_insurance_expiry ON assets(insurance_expires_at) WHERE is_insured = true AND deleted_at IS NULL;
CREATE INDEX idx_assets_maintenance ON assets(next_maintenance_date) WHERE requires_maintenance = true AND deleted_at IS NULL;
CREATE INDEX idx_assets_keywords ON assets USING GIN(keywords);
```

### 4. Fotogalerii Tabelid

#### `asset_photos` - Varade Fotod
```sql
CREATE TABLE asset_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  
  file_url TEXT NOT NULL,
  file_size BIGINT,
  file_type TEXT,
  width INTEGER,
  height INTEGER,
  
  photo_type TEXT DEFAULT 'general', -- 'general', 'check_in', 'check_out', 'damage', 'repair', 'maintenance'
  category TEXT, -- 'before', 'after', 'damage', 'current'
  
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  taken_by_user_id UUID REFERENCES user_profiles(id),
  location TEXT,
  
  title TEXT,
  description TEXT,
  tags TEXT[],
  is_primary BOOLEAN DEFAULT false,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_asset_photos_asset ON asset_photos(asset_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_asset_photos_type ON asset_photos(photo_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_asset_photos_primary ON asset_photos(is_primary) WHERE is_primary = true AND deleted_at IS NULL;
```

### 5. Ülekannete Tabelid

#### `asset_transfers` - Ülekanded
```sql
CREATE TABLE asset_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  transfer_number TEXT NOT NULL,
  
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) DEFAULT 1, -- Consumables puhul võib olla rohkem kui 1
  
  -- Kust ja kuhu
  from_warehouse_id UUID REFERENCES warehouses(id),
  to_warehouse_id UUID REFERENCES warehouses(id),
  from_user_id UUID REFERENCES user_profiles(id),
  to_user_id UUID REFERENCES user_profiles(id),
  from_project_id UUID REFERENCES projects(id),
  to_project_id UUID REFERENCES projects(id),
  
  -- Staatus ja kinnitused
  status TEXT DEFAULT 'pending', -- 'pending', 'in_transit', 'delivered', 'rejected', 'cancelled'
  transfer_type TEXT DEFAULT 'warehouse', -- 'warehouse', 'user', 'project', 'rental_out', 'rental_return'
  
  -- Kuupäevad
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  requested_by_user_id UUID REFERENCES user_profiles(id),
  approved_at TIMESTAMPTZ,
  approved_by_user_id UUID REFERENCES user_profiles(id),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  expected_return_date DATE,
  
  -- Fotod ja seisund
  check_out_photos JSONB DEFAULT '[]',
  check_in_photos JSONB DEFAULT '[]',
  condition_before TEXT,
  condition_after TEXT,
  
  -- Muud
  notes TEXT,
  reason TEXT,
  rejection_reason TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(tenant_id, transfer_number)
);

CREATE INDEX idx_transfers_tenant ON asset_transfers(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transfers_asset ON asset_transfers(asset_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transfers_status ON asset_transfers(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_transfers_from_warehouse ON asset_transfers(from_warehouse_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transfers_to_warehouse ON asset_transfers(to_warehouse_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transfers_from_user ON asset_transfers(from_user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transfers_to_user ON asset_transfers(to_user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transfers_requested ON asset_transfers(requested_at) WHERE deleted_at IS NULL;
```

### 6. Hoolduste Tabelid

#### `asset_maintenances` - Hooldused
```sql
CREATE TABLE asset_maintenances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  
  maintenance_type TEXT DEFAULT 'routine', -- 'routine', 'repair', 'inspection', 'calibration', 'certification'
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled', 'overdue'
  
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  due_date DATE,
  
  performed_by_user_id UUID REFERENCES user_profiles(id),
  performed_by_company TEXT, -- Kui väline firma
  
  cost DECIMAL(15,2),
  invoice_number TEXT,
  
  description TEXT,
  work_performed TEXT,
  parts_replaced TEXT,
  issues_found TEXT,
  recommendations TEXT,
  
  next_maintenance_date DATE,
  next_maintenance_type TEXT,
  
  -- Fotod ja dokumendid
  photos JSONB DEFAULT '[]',
  documents JSONB DEFAULT '[]',
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_maintenances_asset ON asset_maintenances(asset_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_maintenances_status ON asset_maintenances(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_maintenances_scheduled ON asset_maintenances(scheduled_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_maintenances_due ON asset_maintenances(due_date) WHERE status = 'scheduled' AND deleted_at IS NULL;
```

#### `maintenance_templates` - Hoolduskavad
```sql
CREATE TABLE maintenance_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES asset_categories(id),
  
  name TEXT NOT NULL,
  description TEXT,
  maintenance_type TEXT DEFAULT 'routine',
  
  interval_days INTEGER,
  interval_type TEXT DEFAULT 'days', -- 'days', 'weeks', 'months', 'years', 'usage_hours'
  
  checklist JSONB DEFAULT '[]', -- [{task: 'Check oil', required: true}, ...]
  required_parts TEXT[],
  estimated_duration_hours DECIMAL(5,2),
  estimated_cost DECIMAL(15,2),
  
  notification_days_before INTEGER DEFAULT 7,
  notification_users UUID[],
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

### 7. Ostude ja Liikumiste Tabelid

#### `asset_purchases` - Ostud (consumables keskmine hinna arvutamiseks)
```sql
CREATE TABLE asset_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  
  purchase_order_number TEXT,
  invoice_number TEXT,
  supplier_id UUID REFERENCES companies(id),
  
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  
  purchase_date DATE NOT NULL,
  received_date DATE,
  received_by_user_id UUID REFERENCES user_profiles(id),
  
  warehouse_id UUID REFERENCES warehouses(id),
  
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_purchases_asset ON asset_purchases(asset_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_purchases_date ON asset_purchases(purchase_date) WHERE deleted_at IS NULL;
```

#### `stock_movements` - Lao Liikumised
```sql
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  
  movement_type TEXT NOT NULL, -- 'in', 'out', 'adjustment', 'transfer', 'lost', 'found', 'damaged'
  quantity DECIMAL(10,2) NOT NULL,
  quantity_before DECIMAL(10,2),
  quantity_after DECIMAL(10,2),
  
  reference_type TEXT, -- 'purchase', 'transfer', 'project', 'maintenance', 'disposal'
  reference_id UUID,
  
  user_id UUID REFERENCES user_profiles(id),
  project_id UUID REFERENCES projects(id),
  
  reason TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_asset ON stock_movements(asset_id);
CREATE INDEX idx_stock_movements_warehouse ON stock_movements(warehouse_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(created_at);
```

### 8. Meeldetuletuste Tabelid

#### `asset_reminders` - Meeldetuletused
```sql
CREATE TABLE asset_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  reminder_type TEXT NOT NULL, -- 'maintenance', 'insurance_expiry', 'warranty_expiry', 'rental_end', 'low_stock', 'return_overdue'
  status TEXT DEFAULT 'active', -- 'active', 'snoozed', 'completed', 'dismissed'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
  
  asset_id UUID REFERENCES assets(id),
  category_id UUID REFERENCES asset_categories(id),
  
  title TEXT NOT NULL,
  message TEXT,
  
  due_date DATE,
  remind_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ,
  
  notify_users UUID[],
  notification_sent BOOLEAN DEFAULT false,
  last_notification_at TIMESTAMPTZ,
  
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_reminders_tenant ON asset_reminders(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reminders_status ON asset_reminders(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_reminders_due ON asset_reminders(due_date) WHERE status = 'active' AND deleted_at IS NULL;
CREATE INDEX idx_reminders_asset ON asset_reminders(asset_id) WHERE deleted_at IS NULL;
```

### 9. Tellimuste Tabelid

#### `warehouse_orders` - Lao Tellimused
```sql
CREATE TABLE warehouse_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  
  order_type TEXT DEFAULT 'purchase', -- 'purchase', 'replenishment', 'emergency'
  status TEXT DEFAULT 'draft', -- 'draft', 'submitted', 'approved', 'ordered', 'partially_received', 'received', 'cancelled'
  
  warehouse_id UUID REFERENCES warehouses(id),
  supplier_id UUID REFERENCES companies(id),
  
  requested_by_user_id UUID REFERENCES user_profiles(id),
  approved_by_user_id UUID REFERENCES user_profiles(id),
  
  total_amount DECIMAL(15,2),
  currency TEXT DEFAULT 'EUR',
  
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(tenant_id, order_number)
);

CREATE INDEX idx_orders_tenant ON warehouse_orders(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_status ON warehouse_orders(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_warehouse ON warehouse_orders(warehouse_id) WHERE deleted_at IS NULL;
```

#### `warehouse_order_items` - Tellimuse Read
```sql
CREATE TABLE warehouse_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES warehouse_orders(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id),
  
  quantity_ordered DECIMAL(10,2) NOT NULL,
  quantity_received DECIMAL(10,2) DEFAULT 0,
  
  unit_price DECIMAL(15,2),
  total_price DECIMAL(15,2),
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON warehouse_order_items(order_id);
CREATE INDEX idx_order_items_asset ON warehouse_order_items(asset_id);
```

---

## 🔌 API STRUKTUUR

### API Route'id

```
/api/warehouse/
├── warehouses/
│   ├── GET     /               # Kõik laod
│   ├── POST    /               # Loo uus ladu
│   ├── GET     /[id]           # Ühe lao info
│   ├── PUT     /[id]           # Uuenda ladu
│   ├── DELETE  /[id]           # Kustuta ladu
│   └── GET     /[id]/stats     # Lao statistika
│
├── categories/
│   ├── GET     /               # Kõik kategooriad (tree)
│   ├── POST    /               # Loo kategooria
│   ├── PUT     /[id]           # Uuenda
│   ├── DELETE  /[id]           # Kustuta
│   └── GET     /[id]/tree      # Alamkategooriad
│
├── assets/
│   ├── GET     /               # Kõik varad (filter, search, pagination)
│   ├── POST    /               # Loo vara
│   ├── GET     /[id]           # Vara detailid
│   ├── PUT     /[id]           # Uuenda
│   ├── DELETE  /[id]           # Kustuta
│   ├── GET     /[id]/history   # Ajalugu
│   ├── GET     /[id]/photos    # Fotod
│   ├── POST    /[id]/photos    # Lisa foto
│   ├── DELETE  /[id]/photos/[photoId] # Kustuta foto
│   ├── POST    /scan           # QR/Barcode scan
│   └── GET     /low-stock      # Madalad laoseisud
│
├── transfers/
│   ├── GET     /               # Kõik ülekanded
│   ├── POST    /               # Loo ülekanne
│   ├── GET     /[id]           # Ülekande info
│   ├── PUT     /[id]           # Uuenda
│   ├── POST    /[id]/approve   # Kinnita
│   ├── POST    /[id]/reject    # Keeldu
│   ├── POST    /[id]/complete  # Lõpeta
│   └── GET     /pending        # Kinnitamata
│
├── maintenance/
│   ├── GET     /               # Kõik hooldused
│   ├── POST    /               # Loo hooldus
│   ├── GET     /[id]           # Hoolduse info
│   ├── PUT     /[id]           # Uuenda
│   ├── POST    /[id]/complete  # Lõpeta
│   ├── GET     /upcoming       # Tulevased
│   ├── GET     /overdue        # Tähtaja ületanud
│   └── GET     /templates      # Hoolduskavad
│
├── purchases/
│   ├── GET     /               # Kõik ostud
│   ├── POST    /               # Registreeri ost
│   └── GET     /[id]           # Ostu info
│
├── orders/
│   ├── GET     /               # Tellimused
│   ├── POST    /               # Loo tellimus
│   ├── GET     /[id]           # Tellimuse info
│   ├── PUT     /[id]           # Uuenda
│   ├── POST    /[id]/submit    # Esita
│   ├── POST    /[id]/approve   # Kinnita
│   └── POST    /[id]/receive   # Võta vastu
│
├── reminders/
│   ├── GET     /               # Meeldetuletused
│   ├── POST    /               # Loo meeldetuletus
│   ├── PUT     /[id]           # Uuenda
│   ├── POST    /[id]/snooze    # Edasi lükka
│   └── POST    /[id]/dismiss   # Keeldu
│
├── reports/
│   ├── GET     /inventory      # Inventuuri raport
│   ├── GET     /movements      # Liikumiste raport
│   ├── GET     /maintenance    # Hoolduste raport
│   ├── GET     /assignments    # Määramiste raport
│   ├── GET     /fleet          # Fleedi raport
│   ├── GET     /rentals        # Rendi raport
│   └── GET     /insurance      # Kindlustuste raport
│
└── qr-codes/
    ├── POST    /generate       # Genereeri QR kood
    └── POST    /print          # Prindi QR koodid
```

---

## 🎨 UI KOMPONENDID

### 1. Lao Lehekülg (`/dashboard/warehouse`)

#### Pealeht - Ülevaade
```tsx
<WarehouseOverview>
  <StatsCards>
    - Kogu varasid: 1,247
    - Vabasid: 823
    - Kasutuses: 389
    - Hoolduses: 35
    - Madal laoseis: 12 ⚠️
    - Tulevased hooldused: 8
  </StatsCards>
  
  <QuickActions>
    - Lisa uus vara
    - Skaneeri QR/Barcode
    - Loo ülekanne
    - Alusta hooldust
    - Loo tellimus
  </QuickActions>
  
  <RecentActivity>
    - Viimased ülekanded
    - Hoiatused ja meeldetuletused
    - Madalad laoseisud
  </RecentActivity>
</WarehouseOverview>
```

### 2. Varade Loend (`/dashboard/warehouse/assets`)

```tsx
<AssetsPage>
  <Filters>
    - Otsing (nimi, kood, seerianumber)
    - Kategooria (tree dropdown)
    - Ladu
    - Staatus
    - Tüüp (vara/tükikaup)
    - Kasutaja
    - Projekt
    - Hoolduse kuupäev
  </Filters>
  
  <ViewToggle>
    - Tabel (Ultra Table)
    - Kaardid (Card Grid)
    - Galerii (Photos)
  </ViewToggle>
  
  <AssetTable>
    Columns:
    - Foto (thumbnail)
    - Kood
    - Nimi
    - Kategooria
    - Ladu
    - Staatus (badge)
    - Kasutaja/Projekt
    - Kogus (consumables)
    - Järgmine hooldus
    - Tegevused (⋮ menu)
  </AssetTable>
  
  <BulkActions>
    - Loo ülekanne
    - Prindi QR koodid
    - Ekspordi Excel
    - Kustuta
  </BulkActions>
</AssetsPage>
```

### 3. Vara Detailvaade (`/dashboard/warehouse/assets/[id]`)

```tsx
<AssetDetail>
  <Header>
    <Title>
      <Photo />
      <Name />
      <AssetCode />
      <StatusBadge />
    </Title>
    
    <Actions>
      - Redigeeri
      - Loo ülekanne
      - Lisa hooldus
      - Prindi QR
      - Lisa foto
      - Kustuta
    </Actions>
  </Header>
  
  <Tabs>
    <Tab name="Ülevaade">
      <InfoGrid>
        - Kategooria
        - Tootja, mudel
        - Seerianumber, barcode
        - Asukoht (ladu + täpne koht)
        - Kasutaja
        - Projekt
        - Seisukord
        - Ostuhind, praegune väärtus
        - Ostukoht, kuupäev
        - Garantii
      </InfoGrid>
      
      {asset.is_consumable && (
        <StockInfo>
          - Saadaval: 150 tk
          - Reserveeritud: 20 tk
          - Min kogus: 50 tk ⚠️
          - Max kogus: 500 tk
          - Keskmine hind: €2.45/tk
        </StockInfo>
      )}
      
      {asset.is_rental && (
        <RentalInfo>
          - Rendifirma
          - Lepingu nr
          - Algus-lõpp kuupäev
          - Kuu maksumus
          - Deposiit
        </RentalInfo>
      )}
      
      {asset.is_insured && (
        <InsuranceInfo>
          - Kindlustusfirma
          - Poliisi nr
          - Kindlustussumma
          - Kehtib kuni
        </InsuranceInfo>
      )}
    </Tab>
    
    <Tab name="Fotod">
      <PhotoGallery>
        <PhotoCategories>
          - Kõik
          - Lao sisenemine
          - Lao väljumine
          - Kahjustused
          - Hooldused
          - Üldine
        </PhotoCategories>
        
        <PhotoGrid>
          {photos.map(photo => (
            <PhotoCard>
              <Image />
              <Date />
              <Category />
              <User />
              <Actions />
            </PhotoCard>
          ))}
        </PhotoGrid>
        
        <UploadButton>
          - Lisa fotod
          - Võta pilt (mobile)
        </UploadButton>
      </PhotoGallery>
    </Tab>
    
    <Tab name="Ajalugu">
      <Timeline>
        {history.map(event => (
          <TimelineEvent>
            <Icon />
            <Date />
            <Type /> {/* Ülekanne, Hooldus, Ost, Muutus */}
            <Description />
            <User />
            <Details />
          </TimelineEvent>
        ))}
      </Timeline>
    </Tab>
    
    <Tab name="Hooldused">
      <MaintenanceSchedule>
        <NextMaintenance>
          - Järgmine hooldus: 15.12.2024 ⚠️
          - Tüüp: Aastakontroll
          - Vastutaja: Kristjan Meimvald
        </NextMaintenance>
        
        <MaintenanceHistory>
          {maintenances.map(m => (
            <MaintenanceCard>
              <Date />
              <Type />
              <Status />
              <PerformedBy />
              <Cost />
              <Notes />
            </MaintenanceCard>
          ))}
        </MaintenanceHistory>
        
        <AddMaintenanceButton />
      </MaintenanceSchedule>
    </Tab>
    
    <Tab name="Ülekanded">
      <TransfersHistory>
        {transfers.map(t => (
          <TransferCard>
            <Date />
            <From /> → <To />
            <Type />
            <Status />
            <User />
            <Photos />
          </TransferCard>
        ))}
      </TransfersHistory>
    </Tab>
    
    <Tab name="Dokumendid">
      <Documents>
        - Manuaalid
        - Arved
        - Garantiikirjad
        - Kindlustuspolissid
        - Sertifikaadid
      </Documents>
    </Tab>
  </Tabs>
</AssetDetail>
```

### 4. Uue Vara Lisamine (Modal/Drawer)

```tsx
<AddAssetDialog>
  <Stepper>
    <Step 1: "Põhiinfo">
      - Nimi
      - Kategooria (tree select)
      - Tüüp (vara/tükikaup)
      - Kood (auto-generate võimalus)
      - Barcode/QR
      - Seerianumber
    </Step>
    
    <Step 2: "Detailid">
      - Tootja, mudel
      - Kirjeldus
      - Märksõnad
      - Mõõtmed, kaal
      - Värv
      
      {type === 'consumable' && (
        <>
          - Kogus
          - Ühik
          - Min/Max kogus
          - Tellimispunkt
        </>
      )}
    </Step>
    
    <Step 3: "Asukoht">
      - Ladu
      - Täpne asukoht
      - Kasutaja (optional)
      - Projekt (optional)
    </Step>
    
    <Step 4: "Hinnad">
      - Ostuhind
      - Praegune väärtus
      - Ostukoht, kuupäev
      - Garantii
    </Step>
    
    <Step 5: "Hooldus" (optional)>
      - Vajab hooldust?
      - Hoolduse intervall
      - Hoolduskava (template)
    </Step>
    
    <Step 6: "Fotod" (optional)>
      - Upload või võta pilt
      - Galerii
    </Step>
  </Stepper>
</AddAssetDialog>
```

### 5. Ülekannete Haldus (`/dashboard/warehouse/transfers`)

```tsx
<TransfersPage>
  <StatusTabs>
    - Kõik
    - Ootel ({pending})
    - Töös ({inTransit})
    - Tarnitud ({delivered})
    - Tagasi lükatud ({rejected})
  </StatusTabs>
  
  <Filters>
    - Vara
    - Tüüp (ladu/kasutaja/projekt)
    - Kuupäev
    - Kasutaja
  </Filters>
  
  <TransfersTable>
    Columns:
    - Vara (foto + nimi)
    - Kogus
    - Kust → Kuhu
    - Tüüp
    - Staatus (badge)
    - Nõudja
    - Kuupäev
    - Tegevused
  </TransfersTable>
</TransfersPage>
```

### 6. Ülekande Loomine (Modal)

```tsx
<CreateTransferDialog>
  <AssetSelector>
    - Otsi vara
    - Skaneeri QR/Barcode
    - Vali nimekirjast
    - Kogus (consumables)
  </AssetSelector>
  
  <TransferType>
    - Ladu → Ladu
    - Ladu → Kasutaja
    - Ladu → Projekt
    - Kasutaja → Ladu
    - Projekt → Ladu
  </TransferType>
  
  <FromTo>
    {type === 'warehouse' && <WarehouseSelect />}
    {type === 'user' && <UserSelect />}
    {type === 'project' && <ProjectSelect />}
  </FromTo>
  
  <Photos>
    <CheckOutPhotos>
      - Võta pildid (enne)
      - Upload
    </CheckOutPhotos>
  </Photos>
  
  <Details>
    - Oodatav tagastuskuupäev
    - Põhjus
    - Märkused
    - Seisukord
  </Details>
</CreateTransferDialog>
```

### 7. Hoolduste Kalender (`/dashboard/warehouse/maintenance`)

```tsx
<MaintenancePage>
  <ViewToggle>
    - Kalender
    - Nimekiri
    - Kanban (Planeeritud/Töös/Lõpetatud)
  </ViewToggle>
  
  <Filters>
    - Staatus
    - Tüüp
    - Vara
    - Kategooria
    - Vastutaja
  </Filters>
  
  <Calendar>
    {/* Kalendervaade tulevaste hoolduste jaoks */}
    - Today marker
    - Overdue (punane)
    - Coming soon (kollane)
    - Scheduled (sinine)
  </Calendar>
  
  <OverdueAlert>
    ⚠️ 3 hooldust on tähtaja ületanud!
  </OverdueAlert>
</MaintenancePage>
```

### 8. QR/Barcode Scanner

```tsx
<QRScannerDialog>
  <Camera>
    {/* HTML5 QR scanner */}
    - Kaamera vaade
    - Skaneeri automaatselt
  </Camera>
  
  <ManualInput>
    - Sisesta käsitsi
    - Barcode number
  </ManualInput>
  
  <Result>
    {scanned && (
      <AssetCard>
        <Photo />
        <Name />
        <Code />
        <Status />
        <Location />
        
        <QuickActions>
          - Vaata detaile
          - Loo ülekanne
          - Lisa hooldus
          - Lisa foto
        </QuickActions>
      </AssetCard>
    )}
  </Result>
</QRScannerDialog>
```

### 9. Tellimuste Haldus (`/dashboard/warehouse/orders`)

```tsx
<OrdersPage>
  <StatusTabs>
    - Mustandid
    - Esitatud
    - Kinnitatud
    - Tellitud
    - Osaliselt vastu võetud
    - Vastu võetud
  </StatusTabs>
  
  <OrdersTable>
    Columns:
    - Tellimuse nr
    - Kuupäev
    - Tarnija
    - Ladu
    - Kaupade arv
    - Summa
    - Staatus
    - Tegevused
  </OrdersTable>
  
  <CreateOrderButton />
</OrdersPage>
```

### 10. Raportid (`/dashboard/warehouse/reports`)

```tsx
<ReportsPage>
  <ReportTypes>
    <ReportCard title="Inventuuri raport">
      - Kõik varad lao kaupa
      - Väärtus kokku
      - Seisukorra jaotus
      - Excel/PDF export
    </ReportCard>
    
    <ReportCard title="Liikumiste raport">
      - Ülekanded perioodil
      - Enim liigutatud varad
      - Kasutajate aktiivsus
    </ReportCard>
    
    <ReportCard title="Hoolduste raport">
      - Teostatud hooldused
      - Kulud
      - Tulevased hooldused
    </ReportCard>
    
    <ReportCard title="Määramiste raport">
      - Kes kellel on
      - Projekt kaupa
      - Oodatavad tagastused
    </ReportCard>
    
    <ReportCard title="Fleedi raport">
      - Kõik varad kasutajate käes
      - Väärtus
      - Vastutajad
    </ReportCard>
    
    <ReportCard title="Rendi raport">
      - Rendis olevad varad
      - Kuukulud
      - Lõppevad lepingud
    </ReportCard>
    
    <ReportCard title="Kindlustuste raport">
      - Kindlustatud varad
      - Kindlustussummad
      - Lõppevad polissid
    </ReportCard>
    
    <ReportCard title="Madalad laoseisud">
      - Tükikaubad alla min koguse
      - Tellimise vajadus
      - Soovitatavad tellimused
    </ReportCard>
  </ReportTypes>
</ReportsPage>
```

### 11. Meeldetuletused (Notification Center)

```tsx
<RemindersPanel>
  <Categories>
    - Hooldused (8)
    - Kindlustused lõppevad (2)
    - Garantiid lõppevad (3)
    - Rendi lepingud (1)
    - Madalad laoseisud (12)
    - Tagastamata varad (5)
  </Categories>
  
  <RemindersList>
    {reminders.map(reminder => (
      <ReminderCard>
        <Priority /> {/* dot: red/yellow/green */}
        <Icon />
        <Title />
        <Message />
        <DueDate />
        <Asset />
        
        <Actions>
          - Vaata
          - Lükka edasi
          - Märgi tehtuks
          - Ignoreeri
        </Actions>
      </ReminderCard>
    ))}
  </RemindersList>
</RemindersPanel>
```

---

## 🔧 FUNKTSIOONID & MOODULID

### 1. Keskmine Hinna Arvutus (Consumables)

```typescript
// utils/averagePrice.ts
export function calculateAveragePrice(
  currentQuantity: number,
  currentAveragePrice: number,
  newQuantity: number,
  newUnitPrice: number
): number {
  const currentTotal = currentQuantity * currentAveragePrice;
  const newTotal = newQuantity * newUnitPrice;
  const totalQuantity = currentQuantity + newQuantity;
  
  return (currentTotal + newTotal) / totalQuantity;
}

// Näide:
// Laos on 100 kruvi @ €0.50 = €50
// Ostetakse 200 kruvi @ €0.60 = €120
// Uus keskmine: (€50 + €120) / 300 = €0.567
```

### 2. QR Koodi Genereerimine

```typescript
// utils/qrCode.ts
import QRCode from 'qrcode';

export async function generateAssetQRCode(assetId: string): Promise<string> {
  const qrData = {
    type: 'asset',
    id: assetId,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/warehouse/scan/${assetId}`
  };
  
  const qrCodeDataUrl = await QRCode.toDataURL(JSON.stringify(qrData), {
    width: 300,
    margin: 1
  });
  
  return qrCodeDataUrl;
}

export async function generateBatchQRCodes(
  assetIds: string[]
): Promise<{ assetId: string; qrCode: string }[]> {
  return Promise.all(
    assetIds.map(async (id) => ({
      assetId: id,
      qrCode: await generateAssetQRCode(id)
    }))
  );
}
```

### 3. Barcode Scanner (Frontend)

```typescript
// components/warehouse/BarcodeScanner.tsx
import { Html5QrcodeScanner } from 'html5-qrcode';

export function BarcodeScanner({ onScan }: { onScan: (code: string) => void }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      'reader',
      { fps: 10, qrbox: 250 },
      false
    );
    
    scanner.render(
      (decodedText) => {
        onScan(decodedText);
        scanner.clear();
      },
      (error) => {
        console.warn(error);
      }
    );
    
    return () => scanner.clear();
  }, []);
  
  return <div id="reader" />;
}
```

### 4. Hoolduste Automaatne Planeerimine

```typescript
// utils/maintenanceScheduler.ts
export function scheduleNextMaintenance(
  lastMaintenanceDate: Date,
  intervalDays: number
): Date {
  const nextDate = new Date(lastMaintenanceDate);
  nextDate.setDate(nextDate.getDate() + intervalDays);
  return nextDate;
}

export function createMaintenanceReminders(
  asset: Asset,
  nextMaintenanceDate: Date,
  notificationDaysBefore: number = 7
): void {
  const reminderDate = new Date(nextMaintenanceDate);
  reminderDate.setDate(reminderDate.getDate() - notificationDaysBefore);
  
  // Loo meeldetuletus andmebaasis
  createReminder({
    type: 'maintenance',
    assetId: asset.id,
    dueDate: nextMaintenanceDate,
    remindAt: reminderDate,
    notifyUsers: [asset.assignedToUserId, /* lao manager */]
  });
}
```

### 5. Lao Liikumiste Tracker

```typescript
// utils/stockMovement.ts
export async function recordStockMovement(
  assetId: string,
  warehouseId: string,
  type: 'in' | 'out' | 'adjustment',
  quantity: number,
  referenceType?: string,
  referenceId?: string
) {
  // Leia praegune kogus
  const asset = await getAsset(assetId);
  const quantityBefore = asset.quantityAvailable;
  
  // Arvuta uus kogus
  let quantityAfter = quantityBefore;
  if (type === 'in') {
    quantityAfter += quantity;
  } else if (type === 'out') {
    quantityAfter -= quantity;
  } else {
    quantityAfter = quantity;
  }
  
  // Salvesta liikumine
  await createStockMovement({
    assetId,
    warehouseId,
    movementType: type,
    quantity,
    quantityBefore,
    quantityAfter,
    referenceType,
    referenceId
  });
  
  // Uuenda vara kogust
  await updateAsset(assetId, {
    quantityAvailable: quantityAfter
  });
  
  // Kontrolli min/max piire
  if (quantityAfter <= asset.reorderPoint) {
    // Loo hoiatus
    await createReminder({
      type: 'low_stock',
      assetId,
      title: `Madal laoseis: ${asset.name}`,
      message: `Kogus: ${quantityAfter} ${asset.quantityUnit}. Tellimispunkt: ${asset.reorderPoint}`,
      priority: 'high'
    });
  }
}
```

### 6. Ülekannete Workflow

```typescript
// workflows/transferWorkflow.ts
export async function processTransfer(transfer: AssetTransfer) {
  switch (transfer.status) {
    case 'pending':
      // Ootel - vajab kinnitust
      await notifyApprovers(transfer);
      break;
      
    case 'approved':
      // Kinnitatud - alusta ülekannet
      await updateTransferStatus(transfer.id, 'in_transit');
      await recordCheckOut(transfer);
      break;
      
    case 'in_transit':
      // Teel - ootel delivery
      break;
      
    case 'delivered':
      // Tarnitud - uuenda asukohad
      await updateAssetLocation(transfer);
      await recordCheckIn(transfer);
      await recordStockMovement(/* ... */);
      
      // Kui tagastus oodatud, loo meeldetuletus
      if (transfer.expectedReturnDate) {
        await createReturnReminder(transfer);
      }
      break;
  }
}
```

### 7. Fotode Töötlemine

```typescript
// utils/photoProcessing.ts
import sharp from 'sharp';

export async function processAssetPhoto(
  file: File,
  assetId: string,
  photoType: string
): Promise<string> {
  // Resize ja optimeerib
  const buffer = await file.arrayBuffer();
  
  const processedImage = await sharp(Buffer.from(buffer))
    .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  
  // Upload Supabase Storage'sse
  const fileName = `${assetId}/${photoType}/${Date.now()}.jpg`;
  const { data, error } = await supabase.storage
    .from('asset-photos')
    .upload(fileName, processedImage, {
      contentType: 'image/jpeg'
    });
  
  if (error) throw error;
  
  // Loo thumbnail
  const thumbnail = await sharp(processedImage)
    .resize(300, 300, { fit: 'cover' })
    .jpeg({ quality: 70 })
    .toBuffer();
  
  const thumbFileName = `${assetId}/${photoType}/thumbs/${Date.now()}.jpg`;
  await supabase.storage
    .from('asset-photos')
    .upload(thumbFileName, thumbnail);
  
  return data.path;
}
```

### 8. Excel Raportid

```typescript
// utils/excelReports.ts
import ExcelJS from 'exceljs';

export async function generateInventoryReport(
  warehouseId?: string,
  categoryId?: string
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Inventuur');
  
  // Headers
  worksheet.columns = [
    { header: 'Kood', key: 'code', width: 15 },
    { header: 'Nimi', key: 'name', width: 30 },
    { header: 'Kategooria', key: 'category', width: 20 },
    { header: 'Ladu', key: 'warehouse', width: 20 },
    { header: 'Kogus', key: 'quantity', width: 10 },
    { header: 'Ühik', key: 'unit', width: 10 },
    { header: 'Seisukord', key: 'condition', width: 15 },
    { header: 'Väärtus (€)', key: 'value', width: 12 }
  ];
  
  // Fetch data
  const assets = await getAssets({ warehouseId, categoryId });
  
  assets.forEach(asset => {
    worksheet.addRow({
      code: asset.assetCode,
      name: asset.name,
      category: asset.category?.name,
      warehouse: asset.warehouse?.name,
      quantity: asset.quantityAvailable,
      unit: asset.quantityUnit,
      condition: asset.condition,
      value: asset.currentValue
    });
  });
  
  // Styling
  worksheet.getRow(1).font = { bold: true };
  worksheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF279989' }
  };
  
  // Total row
  const totalValue = assets.reduce((sum, a) => sum + (a.currentValue || 0), 0);
  worksheet.addRow({});
  worksheet.addRow({
    code: 'KOKKU',
    value: totalValue
  });
  
  return workbook.xlsx.writeBuffer();
}
```

### 9. PDF Printimiseks (QR koodid)

```typescript
// utils/pdfGenerator.ts
import { jsPDF } from 'jspdf';

export async function generateQRCodePDF(
  assets: Asset[]
): Promise<Blob> {
  const pdf = new jsPDF();
  let y = 20;
  
  for (const asset of assets) {
    // Generate QR code
    const qrCode = await generateAssetQRCode(asset.id);
    
    // Add to PDF
    pdf.addImage(qrCode, 'PNG', 20, y, 50, 50);
    
    // Asset info
    pdf.setFontSize(12);
    pdf.text(asset.name, 80, y + 10);
    pdf.setFontSize(10);
    pdf.text(`Kood: ${asset.assetCode}`, 80, y + 20);
    pdf.text(`Ladu: ${asset.warehouse?.name}`, 80, y + 30);
    
    y += 70;
    
    // New page if needed
    if (y > 250) {
      pdf.addPage();
      y = 20;
    }
  }
  
  return pdf.output('blob');
}
```

### 10. Meeldetuletuste Süsteem (Cron Job)

```typescript
// cron/reminders.ts
export async function checkAndSendReminders() {
  const today = new Date();
  
  // 1. Hoolduste meeldetuletused
  const upcomingMaintenances = await getUpcomingMaintenances(7); // 7 päeva ette
  for (const maintenance of upcomingMaintenances) {
    await createReminder({
      type: 'maintenance',
      assetId: maintenance.assetId,
      title: `Hooldus: ${maintenance.asset.name}`,
      message: `Hooldus planeeritud ${maintenance.scheduledDate}`,
      dueDate: maintenance.scheduledDate,
      notifyUsers: [maintenance.asset.assignedToUserId]
    });
  }
  
  // 2. Kindlustuste lõppemine
  const expiringInsurances = await getExpiringInsurances(30); // 30 päeva ette
  for (const asset of expiringInsurances) {
    await createReminder({
      type: 'insurance_expiry',
      assetId: asset.id,
      title: `Kindlustus lõppeb: ${asset.name}`,
      message: `Kindlustus lõpeb ${asset.insuranceExpiresAt}`,
      dueDate: asset.insuranceExpiresAt,
      priority: 'high'
    });
  }
  
  // 3. Rendi lepingud
  const endingRentals = await getEndingRentals(14); // 2 nädalat ette
  for (const asset of endingRentals) {
    await createReminder({
      type: 'rental_end',
      assetId: asset.id,
      title: `Rendi leping lõppeb: ${asset.name}`,
      message: `Leping lõpeb ${asset.rentalEndDate}. Tagasta või pikenda.`,
      dueDate: asset.rentalEndDate,
      priority: 'high'
    });
  }
  
  // 4. Madalad laoseisud
  const lowStockAssets = await getLowStockAssets();
  for (const asset of lowStockAssets) {
    await createReminder({
      type: 'low_stock',
      assetId: asset.id,
      title: `Madal laoseis: ${asset.name}`,
      message: `Laos ${asset.quantityAvailable} ${asset.quantityUnit}. Min: ${asset.minQuantity}`,
      priority: 'high'
    });
  }
  
  // 5. Tagastamata varad
  const overdueTransfers = await getOverdueTransfers();
  for (const transfer of overdueTransfers) {
    await createReminder({
      type: 'return_overdue',
      assetId: transfer.assetId,
      title: `Tagastamata: ${transfer.asset.name}`,
      message: `Oodatud tagastus: ${transfer.expectedReturnDate}. Kasutaja: ${transfer.toUser.fullName}`,
      dueDate: transfer.expectedReturnDate,
      priority: 'critical',
      notifyUsers: [transfer.toUserId]
    });
  }
  
  // Saada e-mailid
  await sendReminderEmails();
}
```

---

## 📅 IMPLEMENTATSIOONI JÄRJEKORD

### Faas 1: Alus (1-2 nädalat)
**Prioriteet: Põhifunktsioonid tööle**

1. ✅ **Andmebaasi Migratsioonid**
   - Loo kõik tabelid
   - Seadista indeksid
   - Lisa RLS policies

2. ✅ **Põhi API Rajad**
   - Varad CRUD
   - Laod CRUD
   - Kategooriad CRUD
   - Ülekanded CRUD

3. ✅ **Lihtne UI**
   - Varade nimekiri (Ultra Table)
   - Vara lisamine
   - Vara detailvaade
   - Ladude nimekiri

### Faas 2: Tükikaubad & Liikumised (1 nädal)

4. ✅ **Consumables Loogika**
   - Koguste jälgimine
   - Keskmine hinna arvutus
   - Min/max hoiatused
   - Ostude registreerimine

5. ✅ **Lao Liikumised**
   - Stock movements API
   - Liikumiste ajalugu
   - Raportid

### Faas 3: Fotod & QR (1 nädal)

6. ✅ **Fotogalerii**
   - Fotode üleslaadimine
   - Galerii vaade
   - Kategooriad (check-in/out, damage)
   - Thumbnail generation

7. ✅ **QR/Barcode**
   - QR koodi genereerimine
   - Scanner komponent
   - Printimise funktsioon
   - Scan-to-action workflow

### Faas 4: Ülekanded & Workflow (1 nädal)

8. ✅ **Ülekannete Süsteem**
   - Ülekande loomine
   - Kinnituste workflow
   - Check-in/out fotod
   - Staatuste jälgimine
   - Ajalugu

### Faas 5: Hooldused (1 nädal)

9. ✅ **Hoolduste Haldus**
   - Hoolduste registreerimine
   - Hoolduskavad (templates)
   - Automaatne planeerimine
   - Hoolduste kalender
   - Tähtaja ületanud hoiatused

### Faas 6: Meeldetuletused & Teatised (3-4 päeva)

10. ✅ **Meeldetuletuste Süsteem**
    - Reminder engine
    - E-mail teatised
    - In-app notifications
    - Snooze funktsioon
    - Cron job

### Faas 7: Tellimused & Rendi (3-4 päeva)

11. ✅ **Tellimuste Süsteem**
    - Tellimuste loomine
    - Automaatne tellimine (low stock)
    - Vastuvõtt
    - Tarnija haldus

12. ✅ **Rendi Haldus**
    - Rendi varade jälgimine
    - Lepingud
    - Kulud
    - Lõppemise hoiatused

### Faas 8: Raportid & Analüütika (1 nädal)

13. ✅ **Raportite Moodul**
    - Inventuuri raport
    - Liikumiste raport
    - Hoolduste raport
    - Fleedi raport
    - PDF/Excel export

14. ✅ **Dashboard & Statistika**
    - KPI kaardid
    - Graafikud
    - Trendid
    - Kulude analüüs

### Faas 9: Täiustused (1-2 nädalat)

15. ✅ **UX Täiustused**
    - Bulk tegevused
    - Advanced search
    - Filters
    - Sorting
    - Pagination optimizations

16. ✅ **Mobile Optimizations**
    - Responsive design
    - Touch gestures
    - Mobile scanner
    - Offline support (optional)

17. ✅ **Permissions & Access Control**
    - Rollid (admin, warehouse_manager, user)
    - Row-level security
    - Action permissions

### Faas 10: Integratsioonid (optional, 1 nädal)

18. ⏱️ **Välised Integratsioonid**
    - E-mail gateway (SendGrid/AWS SES)
    - SMS gateway (optional)
    - Excel import/export
    - API webhooks

---

## 🔐 TEHNILISED DETAILID

### Row Level Security (RLS) Policies

```sql
-- Varad - kasutaja näeb ainult oma tenant'i varasid
CREATE POLICY "Users can view own tenant assets"
  ON assets FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles
      WHERE auth_user_id = auth.uid()
    )
  );

-- Varad - ainult warehouse manager ja admin saab lisada
CREATE POLICY "Warehouse managers can insert assets"
  ON assets FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles
      WHERE auth_user_id = auth.uid()
      AND role IN ('admin', 'warehouse_manager')
    )
  );

-- Ülekanded - kasutaja näeb ainult oma ülekandeid või tema poolt nõutud
CREATE POLICY "Users can view own transfers"
  ON asset_transfers FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles
      WHERE auth_user_id = auth.uid()
    )
    AND (
      requested_by_user_id IN (
        SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
      )
      OR to_user_id IN (
        SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
      )
      OR from_user_id IN (
        SELECT id FROM user_profiles WHERE auth_user_id = auth.uid()
      )
    )
  );
```

### Optimized Queries

```sql
-- Varade otsing koos kategooriatega (materialized path)
SELECT a.*, c.name as category_name, c.path as category_path
FROM assets a
LEFT JOIN asset_categories c ON c.id = a.category_id
WHERE 
  a.tenant_id = $1
  AND a.deleted_at IS NULL
  AND (
    a.name ILIKE $2
    OR a.asset_code ILIKE $2
    OR a.serial_number ILIKE $2
    OR a.keywords && ARRAY[$3]::text[]
  )
ORDER BY a.name
LIMIT 50 OFFSET $4;

-- Lao statistika (optimized aggregation)
SELECT 
  w.id,
  w.name,
  COUNT(a.id) as total_assets,
  COUNT(CASE WHEN a.status = 'available' THEN 1 END) as available,
  COUNT(CASE WHEN a.status = 'in_use' THEN 1 END) as in_use,
  COUNT(CASE WHEN a.status = 'maintenance' THEN 1 END) as maintenance,
  SUM(a.current_value) as total_value
FROM warehouses w
LEFT JOIN assets a ON a.current_warehouse_id = w.id AND a.deleted_at IS NULL
WHERE w.tenant_id = $1 AND w.deleted_at IS NULL
GROUP BY w.id, w.name;
```

### Indeksite Strateegia

```sql
-- Composite index ülekannete filtreerimiseks
CREATE INDEX idx_transfers_composite 
  ON asset_transfers(tenant_id, status, created_at DESC) 
  WHERE deleted_at IS NULL;

-- Partial index ainult aktiivsete varade jaoks
CREATE INDEX idx_assets_active 
  ON assets(tenant_id, current_warehouse_id, status) 
  WHERE deleted_at IS NULL AND status != 'retired';

-- GIN index märksõnade otsinguks
CREATE INDEX idx_assets_keywords_gin 
  ON assets USING GIN(keywords);

-- Covering index (include) kiiremaks päringuteks
CREATE INDEX idx_assets_warehouse_covering 
  ON assets(current_warehouse_id) 
  INCLUDE (name, asset_code, status, quantity_available)
  WHERE deleted_at IS NULL;
```

### Caching Strateegia

```typescript
// React Query configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min
      cacheTime: 10 * 60 * 1000, // 10 min
      refetchOnWindowFocus: true,
      retry: 1
    }
  }
});

// Cache keys
const CACHE_KEYS = {
  assets: (filters?: AssetFilters) => ['assets', filters],
  asset: (id: string) => ['asset', id],
  warehouses: ['warehouses'],
  transfers: (status?: string) => ['transfers', status],
  reminders: ['reminders']
};

// Optimistic updates
const updateAssetMutation = useMutation({
  mutationFn: updateAsset,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: CACHE_KEYS.asset(newData.id) });
    const previous = queryClient.getQueryData(CACHE_KEYS.asset(newData.id));
    queryClient.setQueryData(CACHE_KEYS.asset(newData.id), newData);
    return { previous };
  },
  onError: (err, newData, context) => {
    queryClient.setQueryData(
      CACHE_KEYS.asset(newData.id),
      context?.previous
    );
  },
  onSettled: (data) => {
    queryClient.invalidateQueries({ 
      queryKey: CACHE_KEYS.asset(data.id) 
    });
  }
});
```

### Real-time Updates (Supabase Realtime)

```typescript
// Realtime subscriptions
useEffect(() => {
  const channel = supabase
    .channel('warehouse-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'assets',
        filter: `tenant_id=eq.${tenantId}`
      },
      (payload) => {
        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.assets() });
      }
    )
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'asset_transfers',
        filter: `tenant_id=eq.${tenantId}`
      },
      (payload) => {
        queryClient.invalidateQueries({ queryKey: CACHE_KEYS.transfers() });
        // Show toast notification
        if (payload.eventType === 'INSERT') {
          toast.info('Uus ülekanne loodud');
        }
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, [tenantId]);
```

### File Storage Struktuur

```
supabase-storage/
├── asset-photos/
│   └── {tenant-id}/
│       └── {asset-id}/
│           ├── general/
│           │   ├── {timestamp}.jpg
│           │   └── thumbs/
│           │       └── {timestamp}.jpg
│           ├── check-in/
│           ├── check-out/
│           ├── damage/
│           └── maintenance/
│
├── asset-documents/
│   └── {tenant-id}/
│       └── {asset-id}/
│           ├── manuals/
│           ├── invoices/
│           ├── warranties/
│           └── certificates/
│
└── qr-codes/
    └── {tenant-id}/
        └── {asset-code}.png
```

---

## 📊 ANDMEMUDELI VISUAAL

```
┌─────────────┐
│  tenants    │
└──────┬──────┘
       │
       ├───────────────────────────────────────────┐
       │                                           │
       ▼                                           ▼
┌──────────────┐                           ┌──────────────┐
│ warehouses   │                           │asset_categories│
└──────┬───────┘                           └───────┬──────┘
       │                                           │
       │ ┌─────────────────────────────────────────┤
       │ │                                         │
       ▼ ▼                                         ▼
    ┌──────────┐                            ┌─────────────┐
    │  assets  │────────────────────────────│  projects   │
    └────┬─────┘                            └─────────────┘
         │
         ├────────────────┬──────────────┬──────────────┬─────────────┐
         │                │              │              │             │
         ▼                ▼              ▼              ▼             ▼
  ┌─────────────┐  ┌──────────────┐ ┌─────────┐  ┌──────────┐ ┌──────────┐
  │asset_photos │  │asset_transfers│ │purchases│  │maintenances│ │reminders │
  └─────────────┘  └──────────────┘ └─────────┘  └──────────┘ └──────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │stock_movements│
                   └──────────────┘
```

---

## 🎯 PEAMISED EELISED HILTI ONTRACK, ASSETTIGER JA ASSETPANDA ASEMEL

1. **Üks Integreeritud Platvorm**
   - Kõik andmed ühes kohas
   - Ei vaja mitut süsteemi
   - Ühtne kasutajakogemus

2. **Eesti Turul Optimeeritud**
   - Eesti keel
   - Eesti äriprotsessid
   - Kohalik tugi

3. **Täielik Kontrolli**
   - Oma andmebaas
   - Kohandatav
   - Ei sõltu välisest teenusest

4. **Ehitustööstuse Spetsiifika**
   - Projektidega integratsioon
   - Töötajatega seotud
   - Ehitusplatside logistika

5. **Madalam Maksumus**
   - Ei vaja kolme eraldi litsentsi
   - Unlimited kasutajad
   - Unlimited varad

6. **Paindlik Kohandamine**
   - Saad lisada oma funktsioone
   - Integratsioonid teiste süsteemidega
   - Custom raportid

---

## 📝 JÄRGMISED SAMMUD

1. **Kinnita plaan** - Vaata üle ja anna feedback
2. **Seadista keskkond** - Supabase tabelid
3. **Alusta Faas 1** - Põhifunktsioonid
4. **Iteratiivne arendus** - Faas faasi kaupa
5. **Testimine** - Igal faasil
6. **Deploy** - Staging keskkonda
7. **Kasutajate feedback** - Beta testimine
8. **Production** - Käivitamine

---

**Valmis alustama? Küsi julgelt, kui midagi vajab täpsustamist! 🚀**
