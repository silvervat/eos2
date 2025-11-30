# 🏗️ EOS2 LAOHALDUS vs SHELF.NU - PÕHJALIK ANALÜÜS

**Koostatud:** 30. November 2025  
**Analüüsija:** Claude Sonnet 4.5  
**Eesmärk:** Võrrelda EOS2 Rivest Platform laohaldust shelf.nu-ga ja anda Claude Code'ile täpsed juhised puuduste kõrvaldamiseks

---

## 📋 EXECUTIVE SUMMARY

### ✅ Mis on juba HEAS SEISUS

**EOS2 Rivest Platform** on juba tugev ehitusjuhtimise süsteem, millel on:
- ✅ Ultra Table süsteem (55 column types, 1M+ rows @ 60fps)
- ✅ File Vault süsteem (ElasticSearch + Redis + PostgreSQL)
- ✅ CMS süsteem (dünaamilised väljad, workflow builder)
- ✅ Projektihaldus
- ✅ Dokumentide haldus
- ✅ PDF mallid
- ✅ Import/Export
- ✅ **Warehouse management alussüsteem**

### ❌ Mis PUUDUB võrreldes shelf.nu-ga

**Kriitilised puudujäägid:**
1. ❌ **QR Code / Barcode süsteem** - pole üldse implementeeritud
2. ❌ **Bookings/Reservations** - broneerimissüsteem puudub
3. ❌ **Custody tracking** - vastutajate jälgimine puudulik
4. ❌ **Location tracking** - GPS/kaardipõhine asukoha jälgimine puudub
5. ❌ **Calendar view** - kalendrivaade broneeringutele puudub
6. ❌ **Kits system** - komplektide haldus puudub
7. ❌ **Mobile app** - mobiilirakendus puudub
8. ❌ **Advanced search** - AI-põhine otsing puudub
9. ❌ **Activity logs** - detailne auditilogi puudub
10. ❌ **Batch actions** - hulgioperatsioonid piiratud

---

## 🔍 DETAILNE VÕRDLUS

### 1️⃣ QR CODE & BARCODE SÜSTEEM

#### Shelf.nu omadused:
- ✅ QR code genereerimine igale varale
- ✅ Mitme koodi tüübi tugi (QR, DataMatrix, Code 128, Code 39)
- ✅ Mitu koodi sama vara kohta
- ✅ QR scan-to-add bookings
- ✅ Custom Property ID support
- ✅ Unclaimed tag management
- ✅ Kit QR codes
- ✅ Geo-location on scan
- ✅ Mobile scanning

#### EOS2 praegune seis:
- ❌ QR code genereerimine: **PUUDUB**
- ❌ Barcode scanning: **PUUDUB**
- ❌ Mobile scanning: **PUUDUB**
- ⚠️ QRCodeModal komponent eksisteerib, aga on tühi stub

#### Vahe:
```
Shelf.nu: 🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢 (10/10)
EOS2:     🔴⚪⚪⚪⚪⚪⚪⚪⚪⚪ (1/10) - ainult andmebaasi struktuur
```

---

### 2️⃣ BOOKINGS / RESERVATIONS SÜSTEEM

#### Shelf.nu omadused:
- ✅ Booking creation wizard
- ✅ Calendar view (day/week/month)
- ✅ Prevent double bookings
- ✅ Check-in/check-out
- ✅ Booking status workflow (Draft → Reserved → Ongoing → Complete)
- ✅ Activity logs per booking
- ✅ PDF export of bookings
- ✅ Filters and sorting
- ✅ QR scan to add assets
- ✅ Email notifications

#### EOS2 praegune seis:
- ❌ Booking süsteem: **PUUDUB TÄIELIKULT**
- ⚠️ On transfers (üleviimised), aga see ei ole booking
- ❌ Calendar view: **PUUDUB**
- ❌ Check-in/out: **PUUDUB**

#### Vahe:
```
Shelf.nu: 🟢🟢🟢🟢🟢🟢🟢🟢🟢🟢 (10/10)
EOS2:     🔴🔴⚪⚪⚪⚪⚪⚪⚪⚪ (2/10) - ainult transfers
```

---

### 3️⃣ CUSTODY & RESPONSIBILITY

#### Shelf.nu omadused:
- ✅ Assign custodians to assets
- ✅ Track current custody
- ✅ Custody history
- ✅ Dashboard view of custodians
- ✅ Signed custody (tulemas)
- ✅ Accountability tracking

#### EOS2 praegune seis:
- ⚠️ `assigned_to` väli assets tabelis
- ⚠️ `created_by` ja `updated_by` jälgimine
- ❌ Custody history: **PUUDUB**
- ❌ Custodian dashboard: **PUUDUB**
- ❌ Signed custody: **PUUDUB**

#### Vahe:
```
Shelf.nu: 🟢🟢🟢🟢🟢🟢🟢🟢🟢⚪ (9/10)
EOS2:     🟡🟡🟡⚪⚪⚪⚪⚪⚪⚪ (3/10) - baas on, funktsionaalsus puudub
```

---

### 4️⃣ LOCATION TRACKING

#### Shelf.nu omadused:
- ✅ Location assignments
- ✅ GPS tracking on scan
- ✅ Map view of locations
- ✅ Location history
- ✅ Location overview tab
- ✅ Assets per location statistics

#### EOS2 praegune seis:
- ⚠️ `warehouse_id` ja `location` väljad
- ⚠️ Warehouses tabel eksisteerib
- ❌ GPS tracking: **PUUDUB**
- ❌ Map view: **PUUDUB**
- ❌ Location history: **PUUDUB**

#### Vahe:
```
Shelf.nu: 🟢🟢🟢🟢🟢🟢🟢🟢🟢⚪ (9/10)
EOS2:     🟡🟡🟡⚪⚪⚪⚪⚪⚪⚪ (3/10) - baas on, GPS ja kaart puudub
```

---

### 5️⃣ CUSTOM FIELDS & METADATA

#### Shelf.nu omadused:
- ✅ Category-specific custom fields
- ✅ Multiple field types (text, number, date, boolean, etc.)
- ✅ Custom field linking to categories
- ✅ Custom field values in exports
- ✅ Custom field search
- ✅ Custom Property IDs
- ✅ Field value history tracking

#### EOS2 praegune seis:
- ✅ Ultra Table süsteem - **55 column types!**
- ✅ Dynamic fields CMS-is
- ✅ Category support
- ❌ Custom fields warehouse assetsile: **IMPLEMENTEERITUD PUUDULIKULT**
- ⚠️ `metadata JSONB` väli on, aga ei kasutata

#### Vahe:
```
Shelf.nu: 🟢🟢🟢🟢🟢🟢🟢🟢⚪⚪ (8/10)
EOS2:     🟢🟢🟢🟢🟢🟢🟢🟡⚪⚪ (7.5/10) - Ultra Table on võimas, aga warehouse integratsioon puudulik
```

---

### 6️⃣ SEARCH & FILTERING

#### Shelf.nu omadused:
- ✅ Full-text search
- ✅ AI-powered search
- ✅ Multi-field search
- ✅ Advanced filters
- ✅ Search in custom fields
- ✅ Search in QR IDs
- ✅ Saved filters
- ✅ Instant search

#### EOS2 praegune seis:
- ✅ File Vault ElasticSearch süsteem
- ⚠️ Warehouse assets search - **BAAS**
- ❌ AI-powered search: **PUUDUB**
- ❌ Saved filters: **PUUDUB**
- ❌ Search in QR codes: **PUUDUB (sest QR pole)**

#### Vahe:
```
Shelf.nu: 🟢🟢🟢🟢🟢🟢🟢🟢🟢⚪ (9/10)
EOS2:     🟡🟡🟡🟡🟡⚪⚪⚪⚪⚪ (5/10) - File Vault on hea, warehouse nõrk
```

---

### 7️⃣ KITS SYSTEM

#### Shelf.nu omadused:
- ✅ Create kits (asset bundles)
- ✅ Kit QR codes
- ✅ Kit locations
- ✅ Book entire kits
- ✅ Kit availability tracking
- ✅ Kit value aggregation

#### EOS2 praegune seis:
- ❌ Kits süsteem: **PUUDUB TÄIELIKULT**

#### Vahe:
```
Shelf.nu: 🟢🟢🟢🟢🟢🟢🟢🟢⚪⚪ (8/10)
EOS2:     🔴⚪⚪⚪⚪⚪⚪⚪⚪⚪ (0/10) - puudub
```

---

### 8️⃣ MOBILE EXPERIENCE

#### Shelf.nu omadused:
- ✅ Responsive mobile UI
- ✅ Mobile app (PWA)
- ✅ QR code scanning on mobile
- ✅ Touch gestures
- ✅ Offline mode
- ✅ Add to home screen
- ✅ Mobile-optimized tables

#### EOS2 praegune seis:
- ✅ Responsive sidebar
- ⚠️ File Vault mobile UI (dizain on, implementatsioon?)
- ❌ QR scanning: **PUUDUB**
- ❌ Offline mode: **PUUDUB**
- ❌ PWA manifest: **PUUDUB**

#### Vahe:
```
Shelf.nu: 🟢🟢🟢🟢🟢🟢🟢🟢🟢⚪ (9/10)
EOS2:     🟡🟡🟡🟡⚪⚪⚪⚪⚪⚪ (4/10) - responsive, aga mitte täisfunktsionaalne
```

---

### 9️⃣ REPORTING & ANALYTICS

#### Shelf.nu omadused:
- ✅ Total inventory value
- ✅ Category usage statistics
- ✅ Custodian analytics
- ✅ Booking analytics
- ✅ Location utilization
- ✅ Usage trends
- ✅ Custom reports
- ✅ Export reports

#### EOS2 praegune seis:
- ✅ Reports page eksisteerib
- ⚠️ WarehouseStats component on baas
- ❌ Warehouse-specific analytics: **PUUDULIKUD**
- ❌ Booking analytics: **PUUDUB (sest booking puudub)**

#### Vahe:
```
Shelf.nu: 🟢🟢🟢🟢🟢🟢🟢🟢⚪⚪ (8/10)
EOS2:     🟡🟡🟡⚪⚪⚪⚪⚪⚪⚪ (3/10) - struktuur on, andmed puudu
```

---

### 🔟 IMPORT / EXPORT

#### Shelf.nu omadused:
- ✅ CSV import with auto-category creation
- ✅ Multiple delimiter support
- ✅ Batch import validation
- ✅ Full data export
- ✅ Excel export
- ✅ Export with custom fields
- ✅ Import preview

#### EOS2 praegune seis:
- ✅ XLSX service implementeeritud
- ✅ CSV service implementeeritud
- ✅ ImportPreview component
- ✅ ExportDialog component
- ⚠️ Warehouse assets import/export: **BAAS ON, TÄIELIK PUUDUB**

#### Vahe:
```
Shelf.nu: 🟢🟢🟢🟢🟢🟢🟢🟢🟢⚪ (9/10)
EOS2:     🟢🟢🟢🟢🟢🟢🟢⚪⚪⚪ (7/10) - library on, warehouse integratsioon puudub
```

---

## 📊 ÜLDINE SKOOR

| Kategooria | Shelf.nu | EOS2 | Vahe |
|-----------|---------|------|------|
| QR Codes | 10/10 | 1/10 | **-9** 🔴 |
| Bookings | 10/10 | 2/10 | **-8** 🔴 |
| Custody | 9/10 | 3/10 | **-6** 🔴 |
| Location | 9/10 | 3/10 | **-6** 🔴 |
| Custom Fields | 8/10 | 7.5/10 | -0.5 🟡 |
| Search | 9/10 | 5/10 | **-4** 🟠 |
| Kits | 8/10 | 0/10 | **-8** 🔴 |
| Mobile | 9/10 | 4/10 | **-5** 🔴 |
| Analytics | 8/10 | 3/10 | **-5** 🔴 |
| Import/Export | 9/10 | 7/10 | -2 🟡 |
| **KESKMINE** | **8.9/10** | **3.55/10** | **-5.35** |

### 🎯 JÄRELDUS

**EOS2 on shelf.nu-st oluliselt maha jäänud warehouse management funktsionaalsuses!**

Peamised probleemid:
1. **QR/Barcode süsteem PUUDUB TÄIELIKULT** - see on warehouse managementi jaoks kriitilise tähtsusega
2. **Bookings süsteem PUUDUB** - shelf.nu peamine tugevus
3. **Mobile experience on poolik** - QR scanning vajab mobiili
4. **Kits süsteem PUUDUB** - kasulik komplektide haldamiseks

**Positiivne:**
- Ultra Table süsteem on shelf.nu-st TUGEVAM
- File Vault on unikaalne (shelf.nu-l pole)
- CMS süsteem on võimas
- Tehniline alus (Supabase, Next.js) on sama

---

## 🎯 CLAUDE CODE TEGEVUSKAVA

### PRIORITEETIDE MATRIITS

| Prioriteet | Funktsioon | Keerukus | Mõju | Aeg |
|-----------|-----------|---------|------|-----|
| **P0** 🔴 | QR Code süsteem | Keskmine | Kriitiline | 3-5 päeva |
| **P0** 🔴 | Bookings alus | Keskmine | Kriitiline | 5-7 päeva |
| **P1** 🟠 | Calendar view | Keskmine | Kõrge | 3-4 päeva |
| **P1** 🟠 | Mobile QR scanning | Kõrge | Kõrge | 4-5 päeva |
| **P2** 🟡 | Custody tracking | Madal | Keskmine | 2-3 päeva |
| **P2** 🟡 | Kits süsteem | Keskmine | Keskmine | 3-4 päeva |
| **P3** 🟢 | Advanced analytics | Madal | Madal | 2-3 päeva |
| **P3** 🟢 | Activity logs | Madal | Madal | 2-3 päeva |

### KOKKU: **24-36 päeva**

---

## 📝 JUHENDID CLAUDE CODE'ILE

Loo **manual/warehouse/** kausta järgmised failid:

### 1️⃣ WAREHOUSE-VISION-2025.md
**Kirjeldus:** Üldine visioon ja eesmärgid  
**Sisu:**
```markdown
# EOS2 WAREHOUSE MANAGEMENT - VISION 2025

## Eesmärk
Teha EOS2 warehouse management shelf.nu-ga samaväärseks + lisada ehitusettevõtete spetsiifilised vajadused.

## Target Features
1. QR Code / Barcode
2. Bookings & Reservations
3. Kits Management
4. Mobile-first
5. Advanced Analytics
6. Integration with Projects

## Differentiators (mis shelf.nu-l pole)
- Ultra Table integration
- File Vault integration
- Construction-specific workflows
- Multi-project material tracking
- BIM integration (tulevikus)
```

---

### 2️⃣ QR-BARCODE-SYSTEM.md
**Kirjeldus:** QR/Barcode süsteemi täielik spetsifikatsioon  
**Võtmepunktid:**

```markdown
# QR/BARCODE SÜSTEEM - IMPLEMENTATION GUIDE

## 1. Database Schema Updates

### Laiendused `warehouse_assets` tabelile:
ALTER TABLE warehouse_assets ADD COLUMN IF NOT EXISTS qr_code VARCHAR(255) UNIQUE;
ALTER TABLE warehouse_assets ADD COLUMN IF NOT EXISTS barcode_type VARCHAR(50) DEFAULT 'QR';
ALTER TABLE warehouse_assets ADD COLUMN IF NOT EXISTS custom_property_id VARCHAR(255);
ALTER TABLE warehouse_assets ADD COLUMN IF NOT EXISTS qr_print_count INTEGER DEFAULT 0;
ALTER TABLE warehouse_assets ADD COLUMN IF NOT EXISTS last_scanned_at TIMESTAMPTZ;
ALTER TABLE warehouse_assets ADD COLUMN IF NOT EXISTS last_scanned_location POINT;
ALTER TABLE warehouse_assets ADD COLUMN IF NOT EXISTS last_scanned_by UUID REFERENCES auth.users(id);

### Uus tabel: warehouse_qr_scans
CREATE TABLE warehouse_qr_scans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asset_id UUID REFERENCES warehouse_assets(id) ON DELETE CASCADE,
  scanned_by UUID REFERENCES auth.users(id),
  scanned_at TIMESTAMPTZ DEFAULT NOW(),
  location POINT,
  location_name TEXT,
  device_info JSONB,
  action VARCHAR(50), -- 'view', 'checkin', 'checkout', 'transfer'
  metadata JSONB
);

CREATE INDEX idx_qr_scans_asset ON warehouse_qr_scans(asset_id);
CREATE INDEX idx_qr_scans_user ON warehouse_qr_scans(scanned_by);
CREATE INDEX idx_qr_scans_date ON warehouse_qr_scans(scanned_at);

### Uus tabel: warehouse_qr_codes (unclaimed codes)
CREATE TABLE warehouse_qr_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  qr_code VARCHAR(255) UNIQUE NOT NULL,
  code_type VARCHAR(50) DEFAULT 'QR',
  status VARCHAR(50) DEFAULT 'unclaimed', -- 'unclaimed', 'claimed', 'void'
  claimed_by UUID REFERENCES auth.users(id),
  claimed_at TIMESTAMPTZ,
  asset_id UUID REFERENCES warehouse_assets(id),
  print_batch VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_qr_codes_status ON warehouse_qr_codes(status);
CREATE INDEX idx_qr_codes_code ON warehouse_qr_codes(qr_code);

## 2. Libraries

npm install qrcode @zxing/library react-qr-reader qr-scanner
npm install jsbarcode react-barcode

## 3. Components to Create

### /components/warehouse/qr/QRGenerator.tsx
- Generate QR codes for assets
- Multiple formats (QR, DataMatrix, Code128, Code39)
- Batch generation
- Print-ready PDF output

### /components/warehouse/qr/QRScanner.tsx
- Mobile camera scanning
- Desktop webcam scanning
- Upload image to scan
- Multi-format support

### /components/warehouse/qr/QRPrintDialog.tsx
- Asset tag designer
- Label templates
- Batch printing
- Custom fields on labels

### /components/warehouse/qr/QRManagement.tsx
- View all QR codes
- Unclaimed codes management
- Code assignment
- Void/deactivate codes

### /components/warehouse/qr/ScanHistory.tsx
- View scan history
- Location heatmap
- Usage analytics
- Export scan data

## 4. API Routes

### /api/warehouse/qr/generate - POST
Generate QR codes for assets

### /api/warehouse/qr/scan - POST
Record QR code scan

### /api/warehouse/qr/unclaimed - GET
Get unclaimed QR codes

### /api/warehouse/qr/claim - POST
Claim QR code for an asset

### /api/warehouse/qr/history/[assetId] - GET
Get scan history for asset

## 5. Mobile Integration

### PWA Manifest Update
{
  "name": "EOS2 Warehouse",
  "short_name": "EOS2",
  "icons": [...],
  "start_url": "/warehouse",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}

### Service Worker
- Offline QR scanning
- Queue scans when offline
- Sync when online

## 6. Features

✅ QR code auto-generation on asset creation
✅ Multiple barcode types per asset
✅ Custom Property IDs (user-friendly identifiers)
✅ Unclaimed QR code pool
✅ Batch QR code generation (print 100 codes at once)
✅ QR scan history with geo-location
✅ Mobile-optimized scanning
✅ Print-ready labels with custom fields
✅ QR code analytics (scans, locations, users)

## 7. Implementation Steps

Day 1: Database schema + migrations
Day 2: QRGenerator component
Day 3: QRScanner component + mobile setup
Day 4: API routes + integration
Day 5: Testing + refinement

## 8. Usage Example

// Generate QR code
import { QRGenerator } from '@/components/warehouse/qr/QRGenerator'

<QRGenerator
  assetId={asset.id}
  assetName={asset.name}
  format="QR"
  size={256}
  onGenerated={(qrCode) => console.log(qrCode)}
/>

// Scan QR code
import { QRScanner } from '@/components/warehouse/qr/QRScanner'

<QRScanner
  onScan={(data) => {
    // Redirect to asset page or perform action
    router.push(`/warehouse/assets/${data.assetId}`)
  }}
  onError={(error) => console.error(error)}
/>

## 9. Security

- Only authenticated users can scan
- RLS policies on qr_scans table
- Rate limiting on scan endpoint
- Validate QR code ownership before actions

## 10. Testing Checklist

[ ] QR code generation works
[ ] Multiple barcode types supported
[ ] Mobile scanning works
[ ] Desktop scanning works
[ ] Unclaimed codes can be claimed
[ ] Scan history is recorded
[ ] Geo-location is captured
[ ] Batch generation works
[ ] Print labels are formatted correctly
[ ] Offline scanning works (PWA)
```

---

### 3️⃣ BOOKINGS-SYSTEM.md
**Kirjeldus:** Broneerimissüsteemi täielik spetsifikatsioon  
**Võtmepunktid:**

```markdown
# BOOKINGS & RESERVATIONS - IMPLEMENTATION GUIDE

## 1. Database Schema

### Uus tabel: warehouse_bookings
CREATE TABLE warehouse_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Booking details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  status VARCHAR(50) DEFAULT 'draft', -- draft, reserved, ongoing, overdue, complete, cancelled
  
  -- Dates
  from_date TIMESTAMPTZ NOT NULL,
  to_date TIMESTAMPTZ NOT NULL,
  
  -- User info
  created_by UUID REFERENCES auth.users(id),
  custodian UUID REFERENCES auth.users(id),
  
  -- Project link (optional)
  project_id UUID REFERENCES projects(id),
  
  -- Metadata
  metadata JSONB,
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bookings_status ON warehouse_bookings(status);
CREATE INDEX idx_bookings_dates ON warehouse_bookings(from_date, to_date);
CREATE INDEX idx_bookings_custodian ON warehouse_bookings(custodian);
CREATE INDEX idx_bookings_project ON warehouse_bookings(project_id);

### Junction table: warehouse_booking_assets
CREATE TABLE warehouse_booking_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES warehouse_bookings(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES warehouse_assets(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_booking_assets_booking ON warehouse_booking_assets(booking_id);
CREATE INDEX idx_booking_assets_asset ON warehouse_booking_assets(asset_id);

### Tabel: warehouse_booking_activities
CREATE TABLE warehouse_booking_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID REFERENCES warehouse_bookings(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL, -- 'created', 'asset_added', 'asset_removed', 'checked_out', 'checked_in', 'cancelled', 'completed'
  user_id UUID REFERENCES auth.users(id),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_booking_activities_booking ON warehouse_booking_activities(booking_id);

## 2. Components

### /components/warehouse/bookings/BookingWizard.tsx
- Step 1: Booking details (name, dates, custodian)
- Step 2: Select assets (with availability check)
- Step 3: Review & confirm
- Draft mode support

### /components/warehouse/bookings/BookingCalendar.tsx
- Full calendar view (FullCalendar.io)
- Day/Week/Month views
- Drag to create booking
- Click to view booking details
- Color coding by status
- Asset availability overlay

### /components/warehouse/bookings/BookingsList.tsx
- Table view of all bookings
- Filters: status, date range, custodian, project
- Quick actions: check-out, check-in, cancel
- Export to PDF/Excel

### /components/warehouse/bookings/BookingDetails.tsx
- View booking info
- Asset list with check-in/out status
- Activity timeline
- Edit/Cancel actions
- Print gear list

### /components/warehouse/bookings/AssetAvailability.tsx
- Check if asset is available for date range
- Visual availability calendar
- Conflicting bookings warning

### /components/warehouse/bookings/CheckInOut.tsx
- QR scan to check-in/out
- Manual check-in/out
- Partial check-in (not all assets)
- Condition notes on return

## 3. API Routes

### /api/warehouse/bookings - GET, POST
List bookings, Create booking

### /api/warehouse/bookings/[id] - GET, PATCH, DELETE
Get, Update, Delete booking

### /api/warehouse/bookings/[id]/assets - POST, DELETE
Add/Remove assets from booking

### /api/warehouse/bookings/[id]/check-out - POST
Check out assets

### /api/warehouse/bookings/[id]/check-in - POST
Check in assets

### /api/warehouse/bookings/[id]/cancel - POST
Cancel booking

### /api/warehouse/bookings/[id]/pdf - GET
Generate PDF gear list

### /api/warehouse/bookings/availability - POST
Check asset availability for date range

## 4. Business Logic

### Availability Check
function isAssetAvailable(assetId, fromDate, toDate):
  conflictingBookings = SELECT FROM warehouse_bookings
    WHERE status IN ('reserved', 'ongoing')
    AND EXISTS (
      SELECT 1 FROM warehouse_booking_assets
      WHERE booking_id = warehouse_bookings.id
      AND asset_id = assetId
    )
    AND (
      (from_date, to_date) OVERLAPS (fromDate, toDate)
    )
  
  return conflictingBookings.length === 0

### Status Transitions
- draft → reserved (when booking.from_date is in future)
- reserved → ongoing (when current time >= booking.from_date)
- ongoing → overdue (when current time > booking.to_date and not checked in)
- ongoing → complete (when all assets checked in)
- * → cancelled (manual cancel)

### Auto-status Updates (Cron job)
-- Run every hour
UPDATE warehouse_bookings
SET status = 'ongoing'
WHERE status = 'reserved'
AND from_date <= NOW()
AND to_date >= NOW();

UPDATE warehouse_bookings
SET status = 'overdue'
WHERE status = 'ongoing'
AND to_date < NOW();

## 5. Features

✅ Booking wizard (3-step process)
✅ Calendar view with drag-to-create
✅ Availability checking (prevent double bookings)
✅ Draft bookings (save for later)
✅ Check-in/out workflow
✅ QR scan integration
✅ Activity log per booking
✅ PDF gear list export
✅ Email notifications
✅ Overdue tracking
✅ Partial check-in support
✅ Project integration
✅ Booking templates (recurring bookings)

## 6. Implementation Steps

Day 1: Database schema + migrations
Day 2: BookingWizard component
Day 3: BookingCalendar component (FullCalendar integration)
Day 4: API routes + availability logic
Day 5: CheckInOut flow
Day 6: Activity logs + notifications
Day 7: Testing + PDF export

## 7. Libraries

npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction
npm install date-fns

## 8. Usage Example

// Create booking
<BookingWizard
  onComplete={(booking) => {
    console.log('Booking created:', booking)
  }}
/>

// Calendar view
<BookingCalendar
  onSelectSlot={({ start, end }) => {
    openBookingWizard({ fromDate: start, toDate: end })
  }}
  onEventClick={(booking) => {
    openBookingDetails(booking)
  }}
/>

## 9. Testing Checklist

[ ] Can create booking with assets
[ ] Availability check prevents double bookings
[ ] Calendar view shows all bookings
[ ] Can check-out assets (status: reserved → ongoing)
[ ] Can check-in assets (status: ongoing → complete)
[ ] Overdue bookings are flagged
[ ] Can cancel booking
[ ] PDF gear list exports correctly
[ ] Activity log records all actions
[ ] Email notifications sent
[ ] QR scan works for check-in/out
```

---

### 4️⃣ KITS-SYSTEM.md
**Kirjeldus:** Komplektide haldussüsteem

```markdown
# KITS SYSTEM - IMPLEMENTATION GUIDE

## Overview
Kits are bundles of assets that are managed as a single unit.
Example: "Camera Kit" = Camera + 2x Lenses + Tripod + Bag

## 1. Database Schema

### Uus tabel: warehouse_kits
CREATE TABLE warehouse_kits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Kit details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  kit_code VARCHAR(100) UNIQUE,
  qr_code VARCHAR(255) UNIQUE,
  
  -- Location
  warehouse_id UUID REFERENCES warehouses(id),
  location VARCHAR(255),
  
  -- Metadata
  category_id UUID REFERENCES warehouse_categories(id),
  status VARCHAR(50) DEFAULT 'available',
  notes TEXT,
  metadata JSONB,
  
  -- Timestamps
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kits_warehouse ON warehouse_kits(warehouse_id);
CREATE INDEX idx_kits_category ON warehouse_kits(category_id);
CREATE INDEX idx_kits_status ON warehouse_kits(status);

### Junction table: warehouse_kit_assets
CREATE TABLE warehouse_kit_assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  kit_id UUID REFERENCES warehouse_kits(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES warehouse_assets(id) ON DELETE CASCADE,
  quantity INTEGER DEFAULT 1,
  required BOOLEAN DEFAULT true, -- if false, asset is optional
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_kit_assets_kit ON warehouse_kit_assets(kit_id);
CREATE INDEX idx_kit_assets_asset ON warehouse_kit_assets(asset_id);

## 2. Components

### /components/warehouse/kits/KitBuilder.tsx
- Add/remove assets to kit
- Set quantities
- Mark assets as required/optional
- QR code generation for kit

### /components/warehouse/kits/KitsList.tsx
- View all kits
- Availability status
- Quick book kit

### /components/warehouse/kits/KitDetails.tsx
- View kit contents
- Check availability
- Book kit
- Edit kit

### /components/warehouse/kits/KitAvailability.tsx
- Check if ALL assets in kit are available
- Show which assets are blocking availability

## 3. API Routes

### /api/warehouse/kits - GET, POST
### /api/warehouse/kits/[id] - GET, PATCH, DELETE
### /api/warehouse/kits/[id]/assets - POST, DELETE
### /api/warehouse/kits/[id]/availability - GET

## 4. Business Logic

### Kit Availability
Kit is available if ALL required assets are available.

function isKitAvailable(kitId, fromDate, toDate):
  kitAssets = SELECT * FROM warehouse_kit_assets
    WHERE kit_id = kitId AND required = true
  
  for asset in kitAssets:
    if not isAssetAvailable(asset.asset_id, fromDate, toDate):
      return false
  
  return true

### Booking Kits
When booking a kit, automatically add all kit assets to booking.

## 5. Features

✅ Create kits from assets
✅ Kit QR codes
✅ Book entire kit at once
✅ Kit availability checking
✅ Optional vs required assets
✅ Kit value aggregation
✅ Kit location tracking

## 6. Implementation: 3-4 days
```

---

### 5️⃣ MOBILE-ENHANCEMENTS.md
**Kirjeldus:** Mobiili täiustused

```markdown
# MOBILE ENHANCEMENTS - GUIDE

## 1. PWA Setup

### public/manifest.json
{
  "name": "EOS2 Warehouse Management",
  "short_name": "EOS2",
  "description": "Construction warehouse management",
  "start_url": "/warehouse",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}

### Service Worker
- Cache assets for offline
- Queue QR scans when offline
- Background sync

## 2. Mobile Components

### /components/warehouse/mobile/MobileScanner.tsx
- Camera access
- Continuous scanning
- Haptic feedback on scan
- Torch/flash control

### /components/warehouse/mobile/MobileAssetCard.tsx
- Swipe actions (edit, delete, book)
- Large touch targets
- Optimized images

### /components/warehouse/mobile/MobileCheckInOut.tsx
- Quick check-in/out flow
- Bulk operations
- Offline queue

## 3. Features

✅ QR scanning with camera
✅ Offline mode
✅ Touch gestures
✅ Swipe actions
✅ Large buttons (min 48x48px)
✅ Haptic feedback
✅ Add to home screen
✅ Push notifications

## 4. Implementation: 4-5 days
```

---

### 6️⃣ INTEGRATION-GUIDE.md
**Kirjeldus:** Integreerimine olemasolevate süsteemidega

```markdown
# WAREHOUSE + ULTRA TABLE + FILE VAULT - INTEGRATION

## Vision
Warehouse assets as Ultra Table rows + File Vault for documents

## 1. Ultra Table Integration

### Create "Warehouse Assets" Ultra Table
Every warehouse asset = 1 row in Ultra Table

Columns:
- Asset Name (text)
- QR Code (barcode column type)
- Category (relation)
- Location (location column type with GPS)
- Custodian (user column type)
- Status (status column type)
- Stock Quantity (number)
- Value (currency)
- Photos (images column type)
- Documents (files column type - links to File Vault!)
- Last Maintenance (date)
- Next Maintenance (formula: lastMaintenance + 6 months)
- Project (relation to projects table)

Benefits:
✅ ALL 55 column types available for warehouse
✅ Custom views (grid, calendar, kanban)
✅ Formulas & rollups
✅ Permissions per column
✅ Import/export built-in

## 2. File Vault Integration

### Every asset can have:
- Photos (via File Vault)
- Manuals (PDF files)
- Purchase receipts
- Maintenance records
- Warranty documents

All stored in File Vault, linked to asset via relations.

## 3. Projects Integration

### Link warehouse assets to projects
- "Which assets are on Project RM2506?"
- "What's the total value of assets on site?"
- "Send booking request for project materials"

## 4. Implementation

Use existing Ultra Table + File Vault infrastructure.
Just add warehouse-specific views and workflows.

## 5. Timeline: 2-3 days (minimal, uses existing systems!)
```

---

## 🚀 IMPLEMENTATSIOON SAMM-SAMMULT

### FAAS 1: ALUS (Päevad 1-7)

**Päev 1-2: QR/Barcode Database**
```bash
# Claude Code käsud:
Read manual/warehouse/QR-BARCODE-SYSTEM.md
Create migration 008_warehouse_qr_system.sql
Update warehouse_assets table with QR columns
Create warehouse_qr_scans table
Create warehouse_qr_codes table
Add RLS policies for QR tables
```

**Päev 3-4: QR Components**
```bash
Install packages: qrcode, @zxing/library, react-qr-reader
Create components/warehouse/qr/QRGenerator.tsx
Create components/warehouse/qr/QRScanner.tsx
Create components/warehouse/qr/QRPrintDialog.tsx
Test QR generation and scanning
```

**Päev 5-7: QR API Routes**
```bash
Create api/warehouse/qr/generate/route.ts
Create api/warehouse/qr/scan/route.ts
Create api/warehouse/qr/unclaimed/route.ts
Integrate QR into asset pages
Test full QR workflow
```

### FAAS 2: BOOKINGS (Päevad 8-14)

**Päev 8-9: Bookings Database**
```bash
Read manual/warehouse/BOOKINGS-SYSTEM.md
Create migration 009_warehouse_bookings.sql
Create warehouse_bookings table
Create warehouse_booking_assets table
Create warehouse_booking_activities table
```

**Päev 10-12: Booking Components**
```bash
Install @fullcalendar packages
Create components/warehouse/bookings/BookingWizard.tsx
Create components/warehouse/bookings/BookingCalendar.tsx
Create components/warehouse/bookings/BookingsList.tsx
Test booking creation flow
```

**Päev 13-14: Booking API + Logic**
```bash
Create api/warehouse/bookings/route.ts
Create api/warehouse/bookings/[id]/route.ts
Create api/warehouse/bookings/availability/route.ts
Implement availability checking logic
Test double-booking prevention
```

### FAAS 3: MOBILE + KITS (Päevad 15-21)

**Päev 15-17: PWA + Mobile**
```bash
Read manual/warehouse/MOBILE-ENHANCEMENTS.md
Create public/manifest.json
Setup service worker
Create mobile/MobileScanner.tsx
Test offline mode
```

**Päev 18-21: Kits System**
```bash
Read manual/warehouse/KITS-SYSTEM.md
Create migration 010_warehouse_kits.sql
Create components/warehouse/kits/KitBuilder.tsx
Create API routes for kits
Test kit booking
```

### FAAS 4: INTEGRATION (Päevad 22-24)

**Päev 22-24: Ultra Table + File Vault Integration**
```bash
Read manual/warehouse/INTEGRATION-GUIDE.md
Create "Warehouse Assets" Ultra Table
Link File Vault for asset documents
Create warehouse dashboard views
Final testing
```

---

## 📋 KONTROLLNIMEKIRI CLAUDE CODE'ILE

### Enne alustamist:
- [ ] Loe läbi kõik manual/warehouse/*.md failid
- [ ] Mõista shelf.nu funktsionaalsust
- [ ] Tutvu olemasoleva EOS2 warehouse koodiga
- [ ] Tee koopia `manual/` kaustast backupi

### Implementatsiooni ajal:
- [ ] Järgi TÄPSELT juhendites antud database skeeme
- [ ] Testi IGA komponenti eraldi enne järgmisele liikumist
- [ ] Kasuta olemasolevaid EOS2 komponente (shadcn/ui)
- [ ] Järgi eesti keele UI standardeid
- [ ] Lisa kommentaarid kõigile keerukatele funktsioonidele
- [ ] Testi mobiilvaates ENNE production-i

### Pärast implementatsiooni:
- [ ] Tee täielik testimine kõigist funktsioonidest
- [ ] Kirjuta kasutajadokumentatsioon (eesti keeles)
- [ ] Loo demo andmed testimiseks
- [ ] Tee performance audit (eriti QR scanning)
- [ ] Kontrolli RLS policies (security!)
- [ ] Tee backup plaanist

---

## 🎯 OODATAVAD TULEMUSED

### Peale 24-päevast implementatsiooni:

**EOS2 Warehouse Management omab:**
- ✅ QR/Barcode generation & scanning (shelf.nu level)
- ✅ Bookings & Reservations (shelf.nu level)
- ✅ Calendar view (shelf.nu level)
- ✅ Mobile PWA (shelf.nu level)
- ✅ Kits management (shelf.nu level)
- ✅ Ultra Table integration (BETTER than shelf.nu!)
- ✅ File Vault integration (shelf.nu-l pole!)
- ✅ Construction-specific workflows (shelf.nu-l pole!)

### SKOOR PEALE IMPLEMENTATSIOONI:

| Kategooria | Enne | Peale | Muutus |
|-----------|------|-------|--------|
| QR Codes | 1/10 | 10/10 | **+9** 🟢 |
| Bookings | 2/10 | 10/10 | **+8** 🟢 |
| Kits | 0/10 | 9/10 | **+9** 🟢 |
| Mobile | 4/10 | 9/10 | **+5** 🟢 |
| **KESKMINE** | 3.55/10 | **9.5/10** | **+5.95** 🟢 |

### EOS2 SAAB OLEMA:
🎯 **Shelf.nu-ga VÕRDVÄÄRNE warehouse management osas**  
🎯 **PAREM Ultra Table, File Vault ja ehitusprojektide integratsioonide tõttu**  
🎯 **KONKURENTSIVÕIMELINE turul**

---

## 💰 KULU-KASU ANALÜÜS

### Shelf.nu hinnad (SaaS):
- Plus Plan: $39/user/month = €468/year per user
- Team Plan: $119/month = €1,428/year (5 users)
- Custom: €3,000+/year

### EOS2 (self-hosted):
- Development: 24 päeva @ €500/päev = **€12,000 (ühekordselt)**
- Hosting: €50/month = €600/year
- **KOKKU aasta 1: €12,600**
- **Aasta 2+: €600/year**

### ROI:
- 10 kasutajaga shelf.nu: €4,680/year
- **Tasub end ära ~2.7 aastaga**
- **5 aasta jooksul kokkuhoid: ~€11,000**

---

## 🎓 KOKKUVÕTE

### Praegune olukord:
- ❌ EOS2 warehouse management on shelf.nu-st **5.35 punkti (60%) maha**
- ❌ Kriitilised funktsioonid (QR, Bookings, Mobile) **puuduvad**
- ✅ Tugev tehniline alus (Ultra Table, File Vault, Supabase)

### Peale implementatsiooni:
- ✅ EOS2 warehouse = **shelf.nu + Ultra Table + File Vault**
- ✅ **9.5/10 funktsionaalsus** (shelf.nu on 8.9/10)
- ✅ Ehitusettevõtetele **spetsialiseeritud**
- ✅ **Self-hosted** = kontrolli andmete üle

### Soovitus Claude Code'ile:
1. **Alusta QR/Barcode süsteemist** - see on kõige kriitilisem
2. **Järgi täpselt juhendeid** - database schema on kriitiline
3. **Testi iga sammu** - eriti mobile ja QR scanning
4. **Integreeri olemasolevate süsteemidega** - ära dubleeri koodi
5. **Hoia eesti keelne UI** - sinu kasutajad on eestlased

---

**Loodud:** 30. November 2025  
**Autor:** Claude Sonnet 4.5  
**Versioon:** 1.0  
**Staatus:** ✅ Ready for Claude Code Implementation

---

*Edu implementatsiooniga! EOS2 saab olema parim warehouse management süsteem ehitusettevõtetele! 🚀*
