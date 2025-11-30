# 🚀 CLAUDE CODE QUICK START - WAREHOUSE UPGRADE

**Eesmärk:** Tee EOS2 warehouse management shelf.nu-ga võrdseks 24 päevaga

---

## ⚡ KIIRE ÜLEVAADE

### Mis puudub?
1. ❌ QR/Barcode süsteem
2. ❌ Bookings & Reservations  
3. ❌ Mobile scanning
4. ❌ Kits management
5. ❌ Advanced analytics

### Mis on juba olemas?
✅ Database (Supabase + PostgreSQL)
✅ Ultra Table (55 column types!)
✅ File Vault (ElasticSearch + Redis)
✅ Components library (shadcn/ui)
✅ Warehouse baasstruktuur

---

## 📚 JUHENDID (loo need manual/warehouse/ kausta)

Claude Code, **loo järgmised failid enne alustamist:**

### 1. WAREHOUSE-VISION-2025.md
Üldine visioon ja eesmärgid (1 lehekülg)

### 2. QR-BARCODE-SYSTEM.md  
Täielik QR/Barcode spetsifikatsioon:
- Database schema (3 tabelit)
- Components (5 React komponenti)
- API routes (6 endpoint'i)
- Implementation steps
**Sisu:** Kopeeri EOS2-vs-SHELF-ANALÜÜS.md failist "2️⃣ QR-BARCODE-SYSTEM.md" sektsioon

### 3. BOOKINGS-SYSTEM.md
Broneerimissüsteemi spetsifikatsioon:
- Database schema (3 tabelit)
- Components (6 React komponenti)
- API routes (8 endpoint'i)
- Calendar integration
**Sisu:** Kopeeri EOS2-vs-SHELF-ANALÜÜS.md failist "3️⃣ BOOKINGS-SYSTEM.md" sektsioon

### 4. KITS-SYSTEM.md
Komplektide haldus:
- Database schema (2 tabelit)
- Components (4 komponenti)
- API routes (4 endpoint'i)
**Sisu:** Kopeeri EOS2-vs-SHELF-ANALÜÜS.md failist "4️⃣ KITS-SYSTEM.md" sektsioon

### 5. MOBILE-ENHANCEMENTS.md
PWA ja mobile täiustused:
- manifest.json
- Service Worker
- Mobile components
**Sisu:** Kopeeri EOS2-vs-SHELF-ANALÜÜS.md failist "5️⃣ MOBILE-ENHANCEMENTS.md" sektsioon

### 6. INTEGRATION-GUIDE.md
Ultra Table + File Vault integratsioon:
- How to link warehouse to Ultra Table
- File Vault for asset documents
**Sisu:** Kopeeri EOS2-vs-SHELF-ANALÜÜS.md failist "6️⃣ INTEGRATION-GUIDE.md" sektsioon

---

## 🎯 24-PÄEVANE PLAAN

### NÄDAL 1: QR CODES (Päevad 1-7)

**Päev 1: Database**
```bash
# Loe juhend
cat manual/warehouse/QR-BARCODE-SYSTEM.md

# Loo migratsioon
create file supabase/migrations/008_warehouse_qr_system.sql

# Sisu:
ALTER TABLE warehouse_assets ADD COLUMN qr_code VARCHAR(255) UNIQUE;
ALTER TABLE warehouse_assets ADD COLUMN barcode_type VARCHAR(50) DEFAULT 'QR';
ALTER TABLE warehouse_assets ADD COLUMN custom_property_id VARCHAR(255);
# ... (kopeeri täielik schema juhendist)

# Testi
npx supabase db push
```

**Päev 2: Libraries**
```bash
cd apps/web
pnpm add qrcode @zxing/library react-qr-reader qr-scanner jsbarcode react-barcode
```

**Päev 3-4: QR Generator**
```bash
# Loo komponent
create file apps/web/src/components/warehouse/qr/QRGenerator.tsx

# Test kasutus:
<QRGenerator assetId={asset.id} format="QR" size={256} />
```

**Päev 5-6: QR Scanner**
```bash
# Loo komponent
create file apps/web/src/components/warehouse/qr/QRScanner.tsx

# Test mobiilis (kasuta telefoni!)
<QRScanner onScan={(data) => console.log(data)} />
```

**Päev 7: API & Integration**
```bash
# API routes
create file apps/web/src/app/api/warehouse/qr/generate/route.ts
create file apps/web/src/app/api/warehouse/qr/scan/route.ts

# Lisa asset lehele QR code
# Update apps/web/src/app/(dashboard)/warehouse/assets/[id]/page.tsx
```

### NÄDAL 2: BOOKINGS (Päevad 8-14)

**Päev 8: Database**
```bash
# Loe juhend
cat manual/warehouse/BOOKINGS-SYSTEM.md

# Loo migratsioon
create file supabase/migrations/009_warehouse_bookings.sql

# Sisu:
CREATE TABLE warehouse_bookings (...)
CREATE TABLE warehouse_booking_assets (...)
# ... (kopeeri täielik schema)

# Testi
npx supabase db push
```

**Päev 9: Libraries**
```bash
pnpm add @fullcalendar/react @fullcalendar/daygrid @fullcalendar/timegrid @fullcalendar/interaction date-fns
```

**Päev 10-11: Booking Wizard**
```bash
create file apps/web/src/components/warehouse/bookings/BookingWizard.tsx

# 3-step wizard:
# Step 1: Dates + Custodian
# Step 2: Select Assets (check availability!)
# Step 3: Confirm
```

**Päev 12-13: Calendar View**
```bash
create file apps/web/src/components/warehouse/bookings/BookingCalendar.tsx

# Use FullCalendar
# Day/Week/Month views
# Click to create booking
```

**Päev 14: API + Availability**
```bash
create file apps/web/src/app/api/warehouse/bookings/route.ts
create file apps/web/src/app/api/warehouse/bookings/availability/route.ts

# Implement double-booking prevention!
```

### NÄDAL 3: MOBILE + KITS (Päevad 15-21)

**Päev 15-17: PWA**
```bash
# Create PWA manifest
create file apps/web/public/manifest.json

# Add to layout.tsx:
<link rel="manifest" href="/manifest.json" />

# Create service worker
create file apps/web/public/sw.js

# Mobile scanner
create file apps/web/src/components/warehouse/mobile/MobileScanner.tsx
```

**Päev 18-19: Kits Database**
```bash
create file supabase/migrations/010_warehouse_kits.sql

CREATE TABLE warehouse_kits (...)
CREATE TABLE warehouse_kit_assets (...)
```

**Päev 20-21: Kits Components**
```bash
create file apps/web/src/components/warehouse/kits/KitBuilder.tsx
create file apps/web/src/components/warehouse/kits/KitsList.tsx
create file apps/web/src/app/api/warehouse/kits/route.ts
```

### NÄDAL 4: INTEGRATION & POLISH (Päevad 22-24)

**Päev 22: Ultra Table Integration**
```bash
# Loo "Warehouse Assets" Ultra Table
# See asendab olemasoleva warehouse assets UI
# Kasutaja saab kasutada kõiki 55 column type'i!
```

**Päev 23: File Vault Integration**
```bash
# Link File Vault to assets
# Asset documents, manuals, receipts -> File Vault
```

**Päev 24: Testing & Documentation**
```bash
# Test QR scanning (mobile!)
# Test booking creation
# Test calendar view
# Test kits
# Write user documentation (eesti keeles)
```

---

## 🎯 KRIITILISED PUNKTID

### 1. QR Codes
**Peab töötama mobiilis!** Testi iPhone ja Android telefonidega.

### 2. Bookings
**Double-booking prevention on KRIITILISE TÄHTSUSEGA!**
```typescript
// Kontrolli ALATI availability enne booking creation
const isAvailable = await checkAvailability(assetId, fromDate, toDate)
if (!isAvailable) {
  throw new Error('Asset not available for this period')
}
```

### 3. Database Migrations
**Järgi TÄPSELT schema-sid juhendites!**  
Ära muuda column types ega nimed.

### 4. UI Language
**KÕIK UI on EESTI KEELES!**
- "Broneeri" mitte "Book"
- "Skänni QR" mitte "Scan QR"
- "Komplekt" mitte "Kit"

### 5. Security
**Lisa RLS policies KÕIGILE uutele tabelitele!**
```sql
ALTER TABLE warehouse_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view bookings in their tenant"
  ON warehouse_bookings FOR SELECT
  USING (tenant_id = current_tenant_id());
```

---

## ✅ KONTROLLNIMEKIRI (enne deployment)

### QR System
- [ ] QR code generation töötab
- [ ] Mobile scanning töötab (testi telefonis!)
- [ ] Barcode types: QR, DataMatrix, Code128, Code39
- [ ] Print labels töötab
- [ ] Scan history salvestatakse

### Bookings System
- [ ] Booking wizard (3 steps) töötab
- [ ] Calendar view kuvab bookings
- [ ] Double-booking prevention töötab (TEST THIS!)
- [ ] Check-in/out workflow töötab
- [ ] Email notifications saadetakse

### Mobile
- [ ] PWA manifest on paigas
- [ ] App töötab offline
- [ ] QR scanning töötab mobiilis
- [ ] Service worker cacheib assets

### Kits
- [ ] Saab luua kitte
- [ ] Kit QR code genereeritakse
- [ ] Saab broneerida kogu kit
- [ ] Kit availability check töötab

### Security
- [ ] RLS policies kõigil tabelitel
- [ ] Scan rate limiting
- [ ] Authentication required
- [ ] Tenant isolation töötab

---

## 🆘 ABI

### Kui midagi ei tööta:

**QR scanning mobiilis ei tööta?**
- Kontrolli HTTPS (camera API vajab secure context)
- Kontrolli permissions (allow camera access)
- Testi teises browseris

**Double bookings tekivad?**
- Kontrolli availability query logic
- Lisa transaction availability check + booking creation
- Test concurrent requests

**Database migration error?**
- Kontrolli kas tabel juba eksisteerib
- Kasuta IF NOT EXISTS
- Kontrolli foreign key constraints

---

## 📊 SUCCESS METRICS

Peale 24 päeva peaks olema:

1. **QR System:** ✅ 100% funktsionaalne (generation + scanning)
2. **Bookings:** ✅ 100% funktsionaalne (create, view, check-in/out)
3. **Mobile:** ✅ PWA töötab, QR scanning mobiilis
4. **Kits:** ✅ Saab luua ja broneerida kitte
5. **Integration:** ✅ Ultra Table + File Vault linked

**EOS2 Warehouse Management = shelf.nu level + BETTER!**

---

## 🎓 KASUTAMISE NÄITED

### QR Code genereerimine
```typescript
import { QRGenerator } from '@/components/warehouse/qr/QRGenerator'

// Asset leht
<QRGenerator
  assetId={asset.id}
  assetName={asset.name}
  format="QR"
  onGenerated={(qrCode) => {
    // Salvesta QR code andmebaasi
    updateAsset(asset.id, { qr_code: qrCode })
  }}
/>
```

### QR Scanning
```typescript
import { QRScanner } from '@/components/warehouse/qr/QRScanner'

// Mobile view
<QRScanner
  onScan={async (data) => {
    // Record scan
    await recordScan(data.assetId, {
      location: await getGeolocation(),
      action: 'view'
    })
    
    // Navigate to asset
    router.push(`/warehouse/assets/${data.assetId}`)
  }}
/>
```

### Booking Creation
```typescript
import { BookingWizard } from '@/components/warehouse/bookings/BookingWizard'

<BookingWizard
  onComplete={async (booking) => {
    // Create booking
    const result = await createBooking({
      name: booking.name,
      fromDate: booking.fromDate,
      toDate: booking.toDate,
      assets: booking.selectedAssets
    })
    
    if (result.success) {
      router.push(`/warehouse/bookings/${result.id}`)
    }
  }}
/>
```

---

**Alusta siit:**
1. Loe läbi EOS2-vs-SHELF-ANALÜÜS.md
2. Loo kõik 6 juhend faili manual/warehouse/ kausta
3. Alusta QR süsteemiga (kõige kriitilisem!)
4. Testi ENNE järgmisele sammu liikumist

**Edu! 🚀**

---

*Versioon: 1.0*  
*Loodud: 30. November 2025*  
*Claude Sonnet 4.5*
