# 🏗️ TÄIUSTATUD LAOHALDUSSÜSTEEMI PLAAN

## 📋 UUED FUNKTSIOONID

### 1. ASUKOHTADE HIERARHILINE SÜSTEEM

#### Andmebaasi Tabel: `warehouse_locations`
```sql
CREATE TABLE warehouse_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES warehouse_locations(id) ON DELETE CASCADE,
  
  code TEXT NOT NULL, -- 'RUUM1', 'A', '3'
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'zone', 'room', 'shelf', 'row', 'bin'
  
  path TEXT, -- Materialized path: /RUUM1/A/3
  level INTEGER DEFAULT 0,
  
  capacity INTEGER, -- Max items
  current_count INTEGER DEFAULT 0,
  
  barcode TEXT, -- Asukoha barcode
  qr_code TEXT,
  
  dimensions TEXT, -- 'L x W x H'
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(tenant_id, warehouse_id, code, parent_id)
);

CREATE INDEX idx_locations_warehouse ON warehouse_locations(warehouse_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_locations_parent ON warehouse_locations(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_locations_path ON warehouse_locations USING GIN(path gin_trgm_ops);
```

#### Warehouse Settings Extension
```sql
-- Lisa warehouses tabelisse
ALTER TABLE warehouses ADD COLUMN settings JSONB DEFAULT '{}';

-- Settings structure:
{
  "location_system_enabled": true,
  "location_levels": [
    { "type": "zone", "label": "Tsoon", "required": false },
    { "type": "room", "label": "Ruum", "required": true },
    { "type": "shelf", "label": "Riiul", "required": true },
    { "type": "row", "label": "Rida", "required": true },
    { "type": "bin", "label": "Kast", "required": false }
  ],
  "photo_requirements": {
    "require_photos_on_checkout": true,
    "require_photos_on_checkin": true,
    "min_photos": 2,
    "max_photos": 10,
    "auto_add_metadata": true,
    "photo_metadata_fields": [
      "location",
      "timestamp",
      "user",
      "transfer_id",
      "condition",
      "quantity"
    ]
  },
  "inventory_settings": {
    "require_scan_verification": true,
    "allow_manual_entry": false,
    "require_photos": true,
    "variance_threshold_percent": 5
  }
}
```

---

### 2. FOTODE AUTOMAATNE METADATA

#### Photo Metadata System
```typescript
// utils/photoMetadata.ts
interface PhotoMetadata {
  // Automaatsed
  timestamp: string;
  user_id: string;
  user_name: string;
  
  // Asukoht
  warehouse_id: string;
  warehouse_name: string;
  location_id?: string;
  location_path?: string; // "RUUM1 / Riiul A / Rida 3"
  
  // Seotud tegevus
  transfer_id?: string;
  transfer_type?: string; // 'check_out' | 'check_in'
  transfer_direction?: 'from' | 'to';
  
  // Vara info
  asset_id: string;
  asset_code: string;
  asset_name: string;
  quantity?: number;
  condition?: string;
  
  // GPS (kui mobile)
  gps_coordinates?: {
    latitude: number;
    longitude: number;
    accuracy: number;
  };
  
  // Device info
  device_type?: string; // 'mobile' | 'desktop' | 'scanner'
  device_id?: string;
}

export async function addPhotoMetadata(
  photo: File,
  metadata: PhotoMetadata,
  warehouseSettings: any
): Promise<ProcessedPhoto> {
  // 1. Compress image
  const compressed = await compressImage(photo, {
    maxWidth: 1920,
    maxHeight: 1080,
    quality: 0.85
  });
  
  // 2. Generate watermark text
  const watermarkText = generateWatermarkText(metadata, warehouseSettings);
  
  // 3. Add watermark to image
  const watermarked = await addWatermark(compressed, watermarkText);
  
  // 4. Generate thumbnail
  const thumbnail = await generateThumbnail(watermarked, {
    width: 300,
    height: 300
  });
  
  return {
    original: watermarked,
    thumbnail,
    metadata
  };
}

function generateWatermarkText(
  metadata: PhotoMetadata,
  settings: any
): string {
  const fields = settings.photo_metadata_fields || [];
  const parts: string[] = [];
  
  if (fields.includes('timestamp')) {
    parts.push(new Date(metadata.timestamp).toLocaleString('et-EE'));
  }
  
  if (fields.includes('location') && metadata.location_path) {
    parts.push(metadata.location_path);
  }
  
  if (fields.includes('user')) {
    parts.push(metadata.user_name);
  }
  
  if (fields.includes('transfer_id') && metadata.transfer_id) {
    parts.push(`${metadata.transfer_direction === 'from' ? 'Välja' : 'Sisse'}: ${metadata.transfer_id}`);
  }
  
  if (fields.includes('condition') && metadata.condition) {
    parts.push(`Seisukord: ${metadata.condition}`);
  }
  
  return parts.join(' | ');
}
```

---

### 3. INVENTUURI SÜSTEEM

#### Tabel: `inventory_counts`
```sql
CREATE TABLE inventory_counts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  
  count_number TEXT NOT NULL,
  count_type TEXT DEFAULT 'full', -- 'full', 'partial', 'cycle', 'spot'
  status TEXT DEFAULT 'planned', -- 'planned', 'in_progress', 'completed', 'cancelled'
  
  planned_date DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  responsible_user_id UUID REFERENCES user_profiles(id),
  
  -- Ulatus
  location_ids UUID[], -- Kui partial, siis ainult teatud asukohad
  category_ids UUID[], -- Kui partial, siis ainult teatud kategooriad
  
  -- Tulemused
  total_items_expected INTEGER,
  total_items_counted INTEGER,
  total_items_matched INTEGER,
  total_items_variance INTEGER,
  variance_value DECIMAL(15,2),
  
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(tenant_id, count_number)
);

CREATE TABLE inventory_count_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  count_id UUID NOT NULL REFERENCES inventory_counts(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id),
  
  expected_quantity DECIMAL(10,2),
  expected_location_id UUID REFERENCES warehouse_locations(id),
  
  counted_quantity DECIMAL(10,2),
  counted_location_id UUID REFERENCES warehouse_locations(id),
  
  variance DECIMAL(10,2), -- counted - expected
  variance_percent DECIMAL(5,2),
  
  status TEXT DEFAULT 'pending', -- 'pending', 'counted', 'verified', 'adjusted'
  
  counted_at TIMESTAMPTZ,
  counted_by_user_id UUID REFERENCES user_profiles(id),
  
  photos JSONB DEFAULT '[]',
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Inventory Mobile App Workflow
```typescript
// Inventuuri workflow
interface InventorySession {
  count_id: string;
  current_location?: string;
  scanned_items: Map<string, number>;
  photos: Map<string, string[]>;
}

// 1. Skaneeri asukoht
async function scanLocation(barcode: string): Promise<Location> {
  const location = await api.scanLocation(barcode);
  // Näita asukohta ja oodatavaid varasid
  return location;
}

// 2. Skaneeri vara
async function scanAsset(barcode: string, location: Location): Promise<void> {
  const asset = await api.scanAsset(barcode);
  
  // Kontrolli kas oodatud
  const expected = await api.getExpectedAtLocation(location.id);
  
  if (expected.includes(asset.id)) {
    // ✓ Õige koht
    recordCount(asset, location, 'matched');
  } else {
    // ⚠️ Vale koht või üleliigne
    showWarning('Vara ei peaks siin olema!');
    // Paku võimalusi:
    // 1. Märgi vale asukoht (loob parandusülesande)
    // 2. Jätka ikkagi (variance)
  }
  
  // Küsi foto
  if (settings.require_photos) {
    await takePhoto(asset, location);
  }
}

// 3. Lõpeta asukoht
async function completeLocation(location: Location): Promise<void> {
  // Kontrolli puuduvad
  const missing = await api.getMissingItems(location.id);
  
  if (missing.length > 0) {
    showMissingItems(missing);
    // Kasutaja saab märkida:
    // - Teisaldatud (kus on?)
    // - Kadunud
    // - Hoolduses
  }
  
  // Salvesta
  await api.saveLocationCount(location.id);
}
```

---

### 4. TÜKIKAUPADE KAALUD

#### Laienda Assets tabelit
```sql
ALTER TABLE assets 
  ADD COLUMN unit_weight_kg DECIMAL(10,4),
  ADD COLUMN weight_tolerance_percent DECIMAL(5,2) DEFAULT 5;

-- Näide: 1 kruvi = 0.0023 kg
-- Kui kaalud 2.3 kg = ~1000 kruvi
```

#### Weighing Assistant
```typescript
// components/warehouse/WeighingAssistant.tsx
interface WeighingAssistantProps {
  asset: Asset; // Consumable vara
  onComplete: (quantity: number) => void;
}

export function WeighingAssistant({ asset, onComplete }: WeighingAssistantProps) {
  const [weight, setWeight] = useState<number>(0);
  
  const calculatedQuantity = useMemo(() => {
    if (!asset.unit_weight_kg || weight === 0) return 0;
    return Math.round(weight / asset.unit_weight_kg);
  }, [weight, asset.unit_weight_kg]);
  
  const tolerance = useMemo(() => {
    const expected = calculatedQuantity * asset.unit_weight_kg;
    const diff = Math.abs(weight - expected);
    const percent = (diff / expected) * 100;
    return {
      within: percent <= asset.weight_tolerance_percent,
      percent
    };
  }, [weight, calculatedQuantity, asset]);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Kaalumine: {asset.name}</CardTitle>
        <CardDescription>
          Ühe ühiku kaal: {asset.unit_weight_kg} kg
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Kaalu sisestus */}
        <div>
          <Label>Kaalu tulemus (kg)</Label>
          <Input
            type="number"
            step="0.001"
            value={weight}
            onChange={(e) => setWeight(parseFloat(e.target.value))}
            placeholder="0.000"
          />
        </div>
        
        {/* Arvutatud kogus */}
        <div className="p-4 bg-muted rounded-lg">
          <div className="text-sm text-muted-foreground">Arvutatud kogus</div>
          <div className="text-3xl font-bold">
            {calculatedQuantity} {asset.quantity_unit}
          </div>
          
          {weight > 0 && (
            <div className={`text-sm mt-2 ${tolerance.within ? 'text-green-600' : 'text-yellow-600'}`}>
              {tolerance.within ? '✓' : '⚠️'} Tolerants: {tolerance.percent.toFixed(2)}%
            </div>
          )}
        </div>
        
        {/* Kiirvalikud */}
        <div className="grid grid-cols-3 gap-2">
          {[100, 500, 1000].map(qty => (
            <Button
              key={qty}
              variant="outline"
              onClick={() => setWeight(qty * asset.unit_weight_kg)}
            >
              {qty} tk
            </Button>
          ))}
        </div>
        
        <Button 
          onClick={() => onComplete(calculatedQuantity)}
          disabled={!tolerance.within}
          className="w-full"
        >
          Kinnita kogus
        </Button>
      </CardContent>
    </Card>
  );
}
```

---

### 5. VARADE SEOSED (KOMPLEKTID)

#### Tabel: `asset_relations`
```sql
CREATE TABLE asset_relations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  parent_asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  child_asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  
  relation_type TEXT DEFAULT 'component', -- 'component', 'accessory', 'compatible', 'alternative'
  
  quantity INTEGER DEFAULT 1, -- Kui palju child'i parent vajab
  is_required BOOLEAN DEFAULT false, -- Kas kohustuslik
  auto_transfer BOOLEAN DEFAULT false, -- Kas automaatselt kaasa
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(parent_asset_id, child_asset_id)
);

CREATE INDEX idx_asset_relations_parent ON asset_relations(parent_asset_id);
CREATE INDEX idx_asset_relations_child ON asset_relations(child_asset_id);
```

#### Transfer with Relations Logic
```typescript
// Kui kasutaja loob ülekande
async function createTransferWithRelations(assetId: string): Promise<void> {
  // 1. Leia seotud varad
  const relations = await api.getAssetRelations(assetId);
  
  // 2. Filtreeri auto_transfer või required
  const autoTransfer = relations.filter(r => r.auto_transfer || r.is_required);
  
  if (autoTransfer.length > 0) {
    // 3. Küsi kasutajalt
    const confirmed = await showDialog({
      title: 'Seotud varad',
      message: `Sellel varal on ${autoTransfer.length} seotud vara. Kas soovid need ka üle kanda?`,
      items: autoTransfer.map(r => ({
        asset: r.child_asset,
        quantity: r.quantity,
        required: r.is_required
      })),
      options: [
        { label: 'Kõik korraga', value: 'all' },
        { label: 'Vali käsitsi', value: 'select' },
        { label: 'Ainult põhivara', value: 'none' }
      ]
    });
    
    if (confirmed === 'all') {
      // Lisa kõik automaatselt
      const assets = [assetId, ...autoTransfer.map(r => r.child_asset_id)];
      await createBulkTransfer(assets);
    } else if (confirmed === 'select') {
      // Näita valiku UI
      showRelationSelector(assetId, autoTransfer);
    } else {
      // Ainult põhivara
      await createSingleTransfer(assetId);
    }
  } else {
    // Ei ole seoseid
    await createSingleTransfer(assetId);
  }
}
```

---

### 6. HOOLDUSTE KULUARUANDED

#### Laienda maintenance tabelit
```sql
ALTER TABLE asset_maintenances 
  ADD COLUMN labor_cost DECIMAL(15,2),
  ADD COLUMN parts_cost DECIMAL(15,2),
  ADD COLUMN external_service_cost DECIMAL(15,2),
  ADD COLUMN other_costs DECIMAL(15,2),
  ADD COLUMN total_cost DECIMAL(15,2) GENERATED ALWAYS AS (
    COALESCE(labor_cost, 0) + 
    COALESCE(parts_cost, 0) + 
    COALESCE(external_service_cost, 0) + 
    COALESCE(other_costs, 0)
  ) STORED;

CREATE TABLE maintenance_cost_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  maintenance_id UUID NOT NULL REFERENCES asset_maintenances(id) ON DELETE CASCADE,
  
  item_type TEXT NOT NULL, -- 'labor', 'part', 'service', 'other'
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(15,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  
  supplier_id UUID REFERENCES companies(id),
  invoice_number TEXT,
  invoice_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### Maintenance Cost Report
```typescript
// API: GET /api/warehouse/maintenance/cost-report
interface MaintenanceCostReport {
  summary: {
    total_maintenances: number;
    total_cost: number;
    avg_cost_per_maintenance: number;
    total_labor: number;
    total_parts: number;
    total_external: number;
  };
  
  by_asset: Array<{
    asset_id: string;
    asset_name: string;
    maintenance_count: number;
    total_cost: number;
    avg_cost: number;
  }>;
  
  by_category: Array<{
    category_name: string;
    total_cost: number;
    percentage: number;
  }>;
  
  by_month: Array<{
    month: string;
    count: number;
    total_cost: number;
  }>;
  
  top_expensive: Array<{
    maintenance_id: string;
    asset_name: string;
    date: string;
    cost: number;
  }>;
}
```

---

### 7. EXCEL IMPORT/EXPORT

#### Import Service
```typescript
// services/excelImport.ts
import * as XLSX from 'xlsx';

interface ImportMapping {
  asset_code: string | number; // Excel column
  name: string | number;
  category: string | number;
  warehouse: string | number;
  quantity?: string | number;
  unit_price?: string | number;
  // ... more fields
}

export async function importAssetsFromExcel(
  file: File,
  mapping: ImportMapping,
  options: {
    updateExisting: boolean;
    createCategories: boolean;
    createWarehouses: boolean;
    skipErrors: boolean;
  }
): Promise<ImportResult> {
  // 1. Parse Excel
  const workbook = XLSX.read(await file.arrayBuffer());
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet);
  
  const results = {
    total: rows.length,
    success: 0,
    failed: 0,
    errors: [] as ImportError[]
  };
  
  // 2. Validate and prepare
  for (const [index, row] of rows.entries()) {
    try {
      const asset = mapRowToAsset(row, mapping);
      
      // Validate
      const validation = validateAsset(asset);
      if (!validation.valid) {
        throw new Error(validation.errors.join(', '));
      }
      
      // Check category exists
      if (asset.category_code) {
        let category = await findCategory(asset.category_code);
        if (!category && options.createCategories) {
          category = await createCategory({
            code: asset.category_code,
            name: asset.category_code
          });
        }
        asset.category_id = category?.id;
      }
      
      // Check warehouse exists
      if (asset.warehouse_code) {
        let warehouse = await findWarehouse(asset.warehouse_code);
        if (!warehouse && options.createWarehouses) {
          warehouse = await createWarehouse({
            code: asset.warehouse_code,
            name: asset.warehouse_code
          });
        }
        asset.current_warehouse_id = warehouse?.id;
      }
      
      // Import
      if (options.updateExisting) {
        await upsertAsset(asset);
      } else {
        await createAsset(asset);
      }
      
      results.success++;
      
    } catch (error) {
      results.failed++;
      results.errors.push({
        row: index + 2, // Excel row (1-indexed + header)
        error: error.message,
        data: row
      });
      
      if (!options.skipErrors) {
        break;
      }
    }
  }
  
  return results;
}

// Export service
export async function exportAssetsToExcel(
  filters: AssetFilters
): Promise<Blob> {
  // 1. Fetch data
  const assets = await api.getAssets(filters);
  
  // 2. Prepare data
  const data = assets.map(asset => ({
    'Kood': asset.asset_code,
    'Nimi': asset.name,
    'Kategooria': asset.category?.name,
    'Ladu': asset.warehouse?.name,
    'Asukoht': asset.current_location,
    'Staatus': asset.status,
    'Seisukord': asset.condition,
    'Kogus': asset.quantity_available,
    'Ühik': asset.quantity_unit,
    'Ostuhind': asset.purchase_price,
    'Praegune väärtus': asset.current_value,
    'Tootja': asset.manufacturer,
    'Mudel': asset.model,
    'Seerianumber': asset.serial_number,
    'Kasutaja': asset.assigned_user?.full_name,
    'Projekt': asset.assigned_project?.name,
    'Järgmine hooldus': asset.next_maintenance_date,
  }));
  
  // 3. Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  
  // Auto-size columns
  const colWidths = Object.keys(data[0] || {}).map(key => ({
    wch: Math.max(
      key.length,
      ...data.map(row => String(row[key] || '').length)
    ) + 2
  }));
  ws['!cols'] = colWidths;
  
  XLSX.utils.book_append_sheet(wb, ws, 'Varad');
  
  // 4. Generate file
  const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([buffer], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
}
```

---

### 8. MASS EDITING

#### Tabel: õiguste jaoks
```sql
-- user_profiles tabelis
ALTER TABLE user_profiles 
  ADD COLUMN permissions JSONB DEFAULT '{}';

-- Permissions structure:
{
  "warehouse": {
    "bulk_edit": true,
    "bulk_delete": true,
    "bulk_transfer": true,
    "export_all": true,
    "import": true
  }
}
```

#### Bulk Edit Component
```typescript
// components/warehouse/BulkEditDialog.tsx
interface BulkEditDialogProps {
  selectedAssets: string[];
  onComplete: () => void;
}

export function BulkEditDialog({ selectedAssets, onComplete }: BulkEditDialogProps) {
  const [field, setField] = useState<string>('');
  const [value, setValue] = useState<any>('');
  const [operation, setOperation] = useState<'set' | 'add' | 'remove'>('set');
  
  const editableFields = [
    { value: 'status', label: 'Staatus', type: 'select' },
    { value: 'condition', label: 'Seisukord', type: 'select' },
    { value: 'category_id', label: 'Kategooria', type: 'select' },
    { value: 'current_warehouse_id', label: 'Ladu', type: 'select' },
    { value: 'assigned_to_user_id', label: 'Kasutaja', type: 'select' },
    { value: 'assigned_to_project_id', label: 'Projekt', type: 'select' },
    { value: 'keywords', label: 'Märksõnad', type: 'tags', supportsAdd: true },
    { value: 'notes', label: 'Märkused', type: 'text' },
  ];
  
  const handleBulkEdit = async () => {
    const confirmed = await confirm(
      `Kas oled kindel, et soovid muuta ${selectedAssets.length} vara?`
    );
    
    if (!confirmed) return;
    
    try {
      await api.bulkEditAssets({
        asset_ids: selectedAssets,
        field,
        value,
        operation
      });
      
      toast.success(`${selectedAssets.length} vara edukalt uuendatud`);
      onComplete();
    } catch (error) {
      toast.error('Viga massilise muutmise tegemisel');
    }
  };
  
  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Massiline muutmine</DialogTitle>
          <DialogDescription>
            Valitud varad: {selectedAssets.length}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Välja valik */}
          <div>
            <Label>Muudetav väli</Label>
            <Select value={field} onValueChange={setField}>
              <SelectTrigger>
                <SelectValue placeholder="Vali väli" />
              </SelectTrigger>
              <SelectContent>
                {editableFields.map(f => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Operatsioon (kui tags) */}
          {editableFields.find(f => f.value === field)?.supportsAdd && (
            <div>
              <Label>Tegevus</Label>
              <Select value={operation} onValueChange={setOperation}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="set">Asenda</SelectItem>
                  <SelectItem value="add">Lisa juurde</SelectItem>
                  <SelectItem value="remove">Eemalda</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {/* Väärtus */}
          <div>
            <Label>Uus väärtus</Label>
            <FieldInput field={field} value={value} onChange={setValue} />
          </div>
          
          {/* Preview */}
          <Alert>
            <AlertDescription>
              <strong>Eelvaade:</strong> {operation === 'set' ? 'Määra' : operation === 'add' ? 'Lisa' : 'Eemalda'}{' '}
              <strong>{editableFields.find(f => f.value === field)?.label}</strong>{' '}
              {operation !== 'remove' && `väärtuseks "${value}"`}{' '}
              {selectedAssets.length} varale
            </AlertDescription>
          </Alert>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onComplete()}>
            Tühista
          </Button>
          <Button onClick={handleBulkEdit} disabled={!field || !value}>
            Rakenda muudatused
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

---

### 9. ÜLEKANDE KORV (TRANSFER CART)

#### Transfer Cart State Management
```typescript
// stores/transferCart.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TransferCartItem {
  asset_id: string;
  asset: Asset;
  quantity: number;
  expected_return_date?: string;
  notes?: string;
}

interface TransferCartStore {
  items: TransferCartItem[];
  
  // Actions
  addItem: (asset: Asset, quantity?: number) => void;
  removeItem: (assetId: string) => void;
  updateQuantity: (assetId: string, quantity: number) => void;
  updateReturnDate: (assetId: string, date: string) => void;
  updateNotes: (assetId: string, notes: string) => void;
  clear: () => void;
  
  // Computed
  totalItems: () => number;
}

export const useTransferCart = create<TransferCartStore>()(
  persist(
    (set, get) => ({
      items: [],
      
      addItem: (asset, quantity = 1) => {
        set(state => {
          const existing = state.items.find(i => i.asset_id === asset.id);
          
          if (existing) {
            // Update quantity
            return {
              items: state.items.map(i =>
                i.asset_id === asset.id
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              )
            };
          } else {
            // Add new
            return {
              items: [...state.items, {
                asset_id: asset.id,
                asset,
                quantity,
              }]
            };
          }
        });
      },
      
      removeItem: (assetId) => {
        set(state => ({
          items: state.items.filter(i => i.asset_id !== assetId)
        }));
      },
      
      updateQuantity: (assetId, quantity) => {
        set(state => ({
          items: state.items.map(i =>
            i.asset_id === assetId ? { ...i, quantity } : i
          )
        }));
      },
      
      updateReturnDate: (assetId, date) => {
        set(state => ({
          items: state.items.map(i =>
            i.asset_id === assetId ? { ...i, expected_return_date: date } : i
          )
        }));
      },
      
      updateNotes: (assetId, notes) => {
        set(state => ({
          items: state.items.map(i =>
            i.asset_id === assetId ? { ...i, notes } : i
          )
        }));
      },
      
      clear: () => set({ items: [] }),
      
      totalItems: () => get().items.length,
    }),
    {
      name: 'transfer-cart-storage'
    }
  )
);
```

#### Transfer Cart UI
```typescript
// components/warehouse/TransferCart.tsx
export function TransferCart() {
  const cart = useTransferCart();
  const [isOpen, setIsOpen] = useState(false);
  
  const handleCreateTransfer = async () => {
    // Open transfer dialog with pre-filled items
    showTransferDialog({
      items: cart.items
    });
  };
  
  return (
    <>
      {/* Floating Cart Button */}
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 rounded-full h-16 w-16 shadow-lg"
        size="lg"
      >
        <ShoppingCart className="h-6 w-6" />
        {cart.totalItems() > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">
            {cart.totalItems()}
          </span>
        )}
      </Button>
      
      {/* Cart Sheet */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Ülekande korv</SheetTitle>
            <SheetDescription>
              {cart.totalItems()} vara lisatud
            </SheetDescription>
          </SheetHeader>
          
          <div className="mt-8 space-y-4">
            {cart.items.map(item => (
              <Card key={item.asset_id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Vara info */}
                    <div className="flex-1">
                      <div className="font-medium">{item.asset.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {item.asset.asset_code}
                      </div>
                      
                      {/* Kogus (kui consumable) */}
                      {item.asset.is_consumable && (
                        <div className="mt-2">
                          <Label className="text-xs">Kogus</Label>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => cart.updateQuantity(
                              item.asset_id,
                              parseFloat(e.target.value)
                            )}
                            className="h-8"
                          />
                        </div>
                      )}
                      
                      {/* Tagastustähtaeg */}
                      <div className="mt-2">
                        <Label className="text-xs">Tagastustähtaeg</Label>
                        <Input
                          type="date"
                          value={item.expected_return_date || ''}
                          onChange={(e) => cart.updateReturnDate(
                            item.asset_id,
                            e.target.value
                          )}
                          className="h-8"
                        />
                      </div>
                      
                      {/* Märkused */}
                      <div className="mt-2">
                        <Label className="text-xs">Märkused</Label>
                        <Textarea
                          value={item.notes || ''}
                          onChange={(e) => cart.updateNotes(
                            item.asset_id,
                            e.target.value
                          )}
                          rows={2}
                          className="text-sm"
                        />
                      </div>
                    </div>
                    
                    {/* Eemalda */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => cart.removeItem(item.asset_id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            {cart.items.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Korv on tühi</p>
                <p className="text-sm">Skaneeri või otsi varasid lisamiseks</p>
              </div>
            )}
          </div>
          
          <SheetFooter className="mt-8">
            <Button
              variant="outline"
              onClick={() => cart.clear()}
              disabled={cart.items.length === 0}
            >
              Tühjenda korv
            </Button>
            <Button
              onClick={handleCreateTransfer}
              disabled={cart.items.length === 0}
            >
              Loo ülekanne ({cart.totalItems()})
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

// Add to any assets page
export function AssetsPageWithCart() {
  const cart = useTransferCart();
  
  const handleQuickAdd = (asset: Asset) => {
    cart.addItem(asset);
    toast.success(`${asset.name} lisatud korvi`);
  };
  
  return (
    <div>
      <AssetsTable onQuickAdd={handleQuickAdd} />
      <TransferCart />
    </div>
  );
}
```

---

### 10. TÄIENDAVAD MUGAVUSED

#### 10.1 Kiire Tegevused (Quick Actions)
```typescript
// Vara kaardil/real:
- QR koodi näitamine (modal)
- Kiire ülekanne (1-click)
- Lisa korvi
- Märgi kahjustatuks
- Alusta hooldust
```

#### 10.2 Teadistuste Süsteem
```typescript
// Real-time notifications
- Uus ülekanne sinu jaoks
- Hooldus tähtajast üle
- Madal laoseis
- Inventory variance
- Kinnitamata ülekanded
```

#### 10.3 Mobiili Optimisatsioonid
```typescript
// Mobile-first features:
- Swipe to transfer
- Pull to refresh
- Offline mode (PWA)
- Voice commands (skaneerimine)
- Vibration feedback
```

#### 10.4 Otsingumootor
```typescript
// Advanced search:
- Fuzzy search (typo tolerance)
- Search by photo (visual similarity)
- Search history
- Saved filters
- Smart suggestions
```

#### 10.5 Shortcuts & Hotkeys
```typescript
// Keyboard shortcuts:
Ctrl/Cmd + K - Quick search
Ctrl/Cmd + N - New asset
Ctrl/Cmd + T - New transfer
Ctrl/Cmd + F - Focus search
S - Scan mode
C - Add to cart
```

#### 10.6 Dashboard Widgets
```typescript
// Configurable dashboard:
- Low stock alerts
- Pending transfers
- Upcoming maintenances
- Recent activity
- Value by category chart
- Location capacity
```

#### 10.7 Templates & Presets
```typescript
// Saved templates:
- Transfer templates (common routes)
- Maintenance checklists
- Inspection forms
- Report templates
```

#### 10.8 Audit Log
```sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  entity_type TEXT NOT NULL, -- 'asset', 'transfer', 'maintenance'
  entity_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'transfer', 'check_in', 'check_out'
  
  user_id UUID REFERENCES user_profiles(id),
  
  changes JSONB, -- Before/after values
  metadata JSONB DEFAULT '{}',
  
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_date ON audit_logs(created_at);
```

#### 10.9 Analytics & Insights
```typescript
// Intelligence features:
- Predict maintenance needs (ML)
- Optimize stock levels
- Identify slow-moving items
- Usage patterns
- Cost trends
- Asset depreciation
```

#### 10.10 Integratsioonid
```typescript
// Planned integrations:
- Email notifications (SendGrid)
- SMS alerts (Twilio)
- Barcode label printing (Zebra)
- Google Calendar (maintenance)
- Slack notifications
- Webhooks API
```

---

## 📊 TÄIENDATUD ANDMEMUDEL

```
┌─────────────┐
│  tenants    │
└──────┬──────┘
       │
       ├────────────────────────────────────────────────────────────┐
       │                                                            │
       ▼                                                            ▼
┌──────────────┐                                            ┌──────────────┐
│ warehouses   │◄───────────────────┐                       │asset_categories│
│ + settings   │                    │                       │              │
└──────┬───────┘                    │                       └───────┬──────┘
       │                            │                               │
       │                            │                               │
       ▼                            │                               ▼
┌──────────────────┐                │                        ┌─────────────┐
│warehouse_locations│               │                        │   assets    │
│  (hierarchical)   │               │                        │+ unit_weight│
└──────────────────┘                │                        │+ relations  │
                                    │                        └─────┬───────┘
                                    │                              │
                                    │                              ├──────────────────┬────────────┬──────────────┐
                                    │                              │                  │            │              │
                                    │                              ▼                  ▼            ▼              ▼
                                    │                       ┌─────────────┐    ┌──────────┐ ┌──────────┐  ┌──────────────┐
                                    │                       │asset_photos │    │transfers │ │maintenance│  │asset_relations│
                                    └───────────────────────│+ metadata   │    │+ cart    │ │+ costs   │  │              │
                                                           └─────────────┘    └──────────┘ └──────────┘  └──────────────┘
                                                                                    │
                                                                                    ▼
                                                                             ┌──────────────┐
                                                                             │inventory_counts│
                                                                             │              │
                                                                             └──────────────┘
```

---

## 🎯 IMPLEMENTATSIOONI PRIORITEEDID

### Must-Have (Faas 1-3)
1. ✅ Asukohtade süsteem
2. ✅ Fotode metadata
3. ✅ Tükikaupade kaalud
4. ✅ Ülekande korv
5. ✅ Varade seosed

### Should-Have (Faas 4-6)
6. ✅ Inventuuri süsteem
7. ✅ Hoolduste kulud
8. ✅ Excel import/export
9. ✅ Mass editing
10. ✅ Audit log

### Nice-to-Have (Faas 7-10)
11. ⏳ Analytics
12. ⏳ Mobile PWA
13. ⏳ Integratsioonid
14. ⏳ AI predictions
15. ⏳ Voice commands

---

Kas see katab kõik sinu vajadused? Kas on veel midagi, mida tahaksid lisada või muuta?
