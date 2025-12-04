# 🎄 PÜHADE SÜSTEEM - VISUAL OVERVIEW & QUICK START

---

## 🎯 SÜSTEEMI ÜLEVAADE

```
┌─────────────────────────────────────────────────────────────┐
│                    PÜHADE HALDUSSÜSTEEM                     │
└─────────────────────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  AUTOMAATNE  │    │   KÄSITSI    │    │   TÖÖTASU    │
│    IMPORT    │    │   HALDAMINE  │    │   REEGLID    │
│              │    │              │    │              │
│ • Nager API  │    │ • Lisa       │    │ • 1.0x norm  │
│ • Abstract   │    │ • Muuda      │    │ • 1.5x näda  │
│ • 90+ riiki  │    │ • Kustuta    │    │ • 2.0x püha  │
└──────────────┘    └──────────────┘    └──────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             ▼
                   ┌─────────────────┐
                   │   ATTENDANCE    │
                   │  INTEGRATION    │
                   │                 │
                   │ Automaatne      │
                   │ pühade tasu     │
                   │ arvutus         │
                   └─────────────────┘
```

---

## 📊 ANDMEVOOG

### 1. Import Flow

```
ADMIN
  │
  │  1. Vali aasta ja riik
  │     (nt. 2025, Eesti)
  │
  ├─► POST /api/holidays/import
  │   {
  │     year: 2025,
  │     countryCode: "EE",
  │     source: "nager"
  │   }
  │
  │  2. Loo import job
  │     status: "pending"
  │
  ├─► Fetch from Nager.Date API
  │   GET https://date.nager.at/api/v3/publicholidays/2025/EE
  │
  │  3. Parse response
  │     [
  │       {date: "2025-01-01", name: "New Year", ...},
  │       {date: "2025-02-24", name: "Independence Day", ...},
  │       ...
  │     ]
  │
  ├─► UPSERT to holidays table
  │   - Insert new
  │   - Update existing
  │
  │  4. Update job
  │     status: "completed"
  │     imported: 12
  │
  └─► ✅ Done!
```

### 2. Manual Add Flow

```
ADMIN
  │
  │  1. Klõpsa "Lisa püha"
  │
  ├─► Fill form:
  │   - Date: 01.01.2025
  │   - Name: Uusaasta
  │   - Country: EE
  │   - Type: Riigipüha
  │   - Pay: 2.0x
  │   - Work: Ei
  │
  ├─► POST /api/holidays
  │
  ├─► INSERT INTO holidays
  │
  └─► ✅ Lisatud!
```

### 3. Attendance Integration Flow

```
TÖÖTAJA CHECK-IN
  │
  │  Date: 2025-01-01 (Uusaasta)
  │
  ├─► INSERT attendance
  │   {
  │     employee_id,
  │     date: "2025-01-01",
  │     type: "check_in"
  │   }
  │
  ├─► TRIGGER: calculate_holiday_pay()
  │   │
  │   ├─► SELECT FROM holidays
  │   │   WHERE date = "2025-01-01"
  │   │   AND country_code = "EE"
  │   │
  │   ├─► Found: "Uusaasta"
  │   │   pay_multiplier: 2.0
  │   │
  │   └─► UPDATE attendance_summaries
  │       SET is_holiday = true
  │           holiday_name = "Uusaasta"
  │           holiday_pay_multiplier = 2.0
  │           holiday_pay = worked_hours * base_rate * 1.0
  │                        (extra pay above normal)
  │
  └─► ✅ Holiday pay calculated!
```

---

## 🎨 UI KOMPONENDID

### 1. Holidays Table

```
┌─────────────────────────────────────────────────────────────┐
│  [2025 ▼] [🇪🇪 Eesti ▼] [Otsi...] [Impordi] [Lisa] [Eksport]│
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ 📊 STATISTIKA                                               │
├─────────────┬─────────────┬─────────────┬─────────────────┤
│ 12 Pühad    │ 12 Tasust.  │ 12 Topelt   │ 0 Tööpäeva      │
└─────────────┴─────────────┴─────────────┴─────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Kuupäev    │ Nimetus           │ Tüüp  │ Töötasu │ Tööpäev │
├────────────┼───────────────────┼───────┼─────────┼─────────┤
│ 01.01.2025 │ New Year's Day    │ 🔴    │ ✅ 2.0x │ ❌      │
│ P          │ Uusaasta          │ Riigi │         │         │
├────────────┼───────────────────┼───────┼─────────┼─────────┤
│ 24.02.2025 │ Independence Day  │ 🔴    │ ✅ 2.0x │ ❌      │
│ E          │ Iseseisvuspäev    │ Riigi │         │         │
├────────────┼───────────────────┼───────┼─────────┼─────────┤
│ 18.04.2025 │ Good Friday       │ 🔴    │ ✅ 2.0x │ ❌      │
│ R          │ Suur reede        │ Riigi │         │         │
└────────────┴───────────────────┴───────┴─────────┴─────────┘
```

### 2. Import Dialog

```
┌───────────────────────────────────┐
│  ☁️  Impordi pühad                │
├───────────────────────────────────┤
│                                   │
│  ℹ️  Impordime riiklikud pühad    │
│     välisest API-st              │
│                                   │
│  Aasta: [2025      ]             │
│                                   │
│  Riik:  [🇪🇪 Eesti ▼]            │
│                                   │
│  API:   [Nager.Date ▼]           │
│         (Soovitatav)             │
│                                   │
│      [Tühista]  [Impordi] →      │
└───────────────────────────────────┘

// Progress view:
┌───────────────────────────────────┐
│  ☁️  Impordi pühad                │
├───────────────────────────────────┤
│                                   │
│  ●────●────○  Importimine...     │
│  │    │    │                      │
│  │    │    └─ Valmis             │
│  │    └─ Importimine (⏳)        │
│  └─ Alustamine (✓)               │
│                                   │
└───────────────────────────────────┘
```

### 3. Add/Edit Dialog

```
┌───────────────────────────────────┐
│  ➕ Lisa uus püha                 │
├───────────────────────────────────┤
│                                   │
│  Kuupäev: [01.01.2025 📅]        │
│                                   │
│  Nimetus:  [Uusaasta      ]      │
│  Kohalik:  [New Year      ]      │
│                                   │
│  Riik:  [🇪🇪 Eesti ▼]            │
│  Tüüp:  [Riigipüha ▼]            │
│                                   │
│  Kirjeldus:                       │
│  ┌─────────────────────────────┐ │
│  │                             │ │
│  └─────────────────────────────┘ │
│                                   │
│  ─── Töötasu reeglid ───         │
│                                   │
│  Tasustatud püha:  [✓]           │
│                                   │
│  Töötasu kordaja:  [2.0] x       │
│  (1.0=tavaline, 2.0=topelt)      │
│                                   │
│  Võimalik töötada: [  ]          │
│                                   │
│  Nõutav heakskiit: [  ]          │
│                                   │
│      [Tühista]  [Salvesta]       │
└───────────────────────────────────┘
```

### 4. Calendar View

```
┌─────────────────────────────────────────────────────────────┐
│                     JAANUAR 2025                            │
├───────┬───────┬───────┬───────┬───────┬───────┬───────────┤
│  P    │  E    │  T    │  K    │  N    │  R    │  L        │
├───────┼───────┼───────┼───────┼───────┼───────┼───────────┤
│       │       │  1    │  2    │  3    │  4    │  5        │
│       │       │ 🔴    │       │       │       │           │
│       │       │ Uus   │       │       │       │           │
│       │       │ aasta │       │       │       │           │
├───────┼───────┼───────┼───────┼───────┼───────┼───────────┤
│  6    │  7    │  8    │  9    │  10   │  11   │  12       │
│       │       │       │       │       │       │           │
├───────┼───────┼───────┼───────┼───────┼───────┼───────────┤
│ ...                                                         │
└─────────────────────────────────────────────────────────────┘

Legend:
🔴 Riigipüha (2.0x)
🟣 Usupüha (1.0x)
🔵 Tähtpäev (1.0x)
```

---

## 🗄️ ANDMEBAASI STRUKTUUR

```sql
countries
  ├─► code (EE, SE, FI, ...)
  ├─► name (Estonia, Sweden, ...)
  └─► native_name (Eesti, Sverige, ...)

holiday_types
  ├─► code (PUBLIC, RELIGIOUS, ...)
  ├─► name (Riigipüha, Usupüha, ...)
  ├─► is_paid
  ├─► pay_multiplier (1.0, 1.5, 2.0, ...)
  ├─► is_work_day
  └─► requires_approval

holidays
  ├─► date
  ├─► name (New Year's Day)
  ├─► local_name (Uusaasta)
  ├─► country_code → countries
  ├─► holiday_type_id → holiday_types
  ├─► is_paid
  ├─► pay_multiplier
  ├─► is_work_day
  ├─► requires_approval
  └─► source (nager, manual, ...)

holiday_import_jobs
  ├─► year
  ├─► country_code
  ├─► source
  ├─► status (pending, running, completed, failed)
  ├─► holidays_imported
  └─► error_message

attendance (extended)
  ├─► holiday_id → holidays
  └─► holiday_pay_multiplier

attendance_summaries (extended)
  ├─► is_holiday
  ├─► holiday_name
  ├─► holiday_pay_multiplier
  └─► holiday_pay
```

---

## 🔧 FUNKTSIOONID

### 1. is_holiday(date, country_code)
```sql
SELECT is_holiday('2025-01-01', 'EE');
-- Returns: true
```

### 2. get_holiday_info(date, country_code)
```sql
SELECT * FROM get_holiday_info('2025-01-01', 'EE');
-- Returns:
-- holiday_name: "New Year's Day"
-- is_paid: true
-- pay_multiplier: 2.0
-- is_work_day: false
```

### 3. get_pay_multiplier(date, country_code)
```sql
SELECT get_pay_multiplier('2025-01-01', 'EE');
-- Returns: 2.0 (holiday)

SELECT get_pay_multiplier('2025-01-04', 'EE');
-- Returns: 1.5 (Saturday)

SELECT get_pay_multiplier('2025-01-06', 'EE');
-- Returns: 1.0 (normal Monday)
```

### 4. calculate_working_days(start, end, country)
```sql
SELECT calculate_working_days('2025-01-01', '2025-01-31', 'EE');
-- Returns: 22 (excluding weekends and holidays)
```

---

## 🚀 IMPLEMENTATSIOON

### Faas 1: Andmebaas (30 min)

```bash
# 1. Kopeeri SQL fail
cp /mnt/user-data/outputs/HOLIDAYS-PAGE-AND-SQL.md \
   supabase/migrations/012_holidays_system.sql

# 2. Rakenda
supabase db push

# 3. Kontrolli
supabase db diff
```

**Kontrolli:**
```sql
-- Tabelid
SELECT * FROM countries;
SELECT * FROM holiday_types;
SELECT * FROM holidays WHERE country_code = 'EE' AND year = 2025;

-- Funktsioonid
SELECT is_holiday('2025-01-01', 'EE');
SELECT get_pay_multiplier('2025-01-01', 'EE');
```

### Faas 2: API Endpoints (1h)

Loo failid:
1. `apps/web/src/app/api/holidays/route.ts`
2. `apps/web/src/app/api/holidays/import/route.ts`
3. `apps/web/src/app/api/holidays/types/route.ts`
4. `apps/web/src/app/api/holidays/[id]/route.ts`

**Test:**
```bash
# Get holidays
curl http://localhost:3000/api/holidays?year=2025&countryCode=EE

# Import
curl -X POST http://localhost:3000/api/holidays/import \
  -H "Content-Type: application/json" \
  -d '{"year":2025,"countryCode":"EE","source":"nager"}'
```

### Faas 3: Frontend Komponendid (2h)

Loo komponendid:
1. `HolidaysTable.tsx` - tabel
2. `ImportDialog.tsx` - import
3. `HolidayDialog.tsx` - add/edit
4. `HolidayCalendar.tsx` - kalender

### Faas 4: Page (30 min)

Loo leht:
```typescript
// apps/web/src/app/(dashboard)/holidays/page.tsx
```

### Faas 5: Test (30 min)

**Checklist:**
- [ ] Holidays table näitab pühad
- [ ] Import töötab (Nager API)
- [ ] Käsitsi lisamine töötab
- [ ] Muutmine töötab
- [ ] Kustutamine töötab
- [ ] Kalender näitab pühad
- [ ] Attendance integration töötab
- [ ] Holiday pay arvutus töötab

---

## 📊 NÄITED

### Estonian Holidays 2025

| Kuupäev    | Nimetus              | Töötasu |
|------------|----------------------|---------|
| 01.01.2025 | Uusaasta             | 2.0x    |
| 24.02.2025 | Iseseisvuspäev       | 2.0x    |
| 18.04.2025 | Suur reede           | 2.0x    |
| 20.04.2025 | Ülestõusmispüha      | 2.0x    |
| 01.05.2025 | Kevadpüha            | 2.0x    |
| 08.06.2025 | Nelipüha             | 2.0x    |
| 23.06.2025 | Võidupüha            | 2.0x    |
| 24.06.2025 | Jaanipäev            | 2.0x    |
| 20.08.2025 | Taasiseseisvumispäev | 2.0x    |
| 24.12.2025 | Jõululaupäev         | 2.0x    |
| 25.12.2025 | Jõulupüha            | 2.0x    |
| 26.12.2025 | Teine jõulupüha      | 2.0x    |

### Töötasu Näited

```
Normal day (Mon-Fri):     8h × €10 × 1.0 = €80
Weekend (Sat-Sun):        8h × €10 × 1.5 = €120
Public holiday:           8h × €10 × 2.0 = €160

Holiday extra pay:        €160 - €80 = €80 (stored in holiday_pay)
```

---

## 🔗 INTEGRATSIOON TÖÖTUNDIDEGA

### Automaatne arvutus

Kui töötaja teeb check-in pühal:

```sql
-- Trigger käivitub automaatselt
TRIGGER calculate_holiday_pay_trigger
  ON attendance_summaries

-- Leiab püha
SELECT * FROM holidays 
WHERE date = NEW.date AND country_code = 'EE'

-- Arvutab lisatasu
holiday_pay = worked_hours × base_rate × (pay_multiplier - 1.0)

-- Näide:
-- worked_hours: 8
-- base_rate: €10
-- pay_multiplier: 2.0
-- holiday_pay = 8 × 10 × (2.0 - 1.0) = €80
```

### Work Hours lehel nähtav

```
Töötunnid: 8.0h
Baastasu: €80
Pühatasu: €80 (2.0x) 🎄 Uusaasta
═══════════════════
Kokku: €160
```

---

## 🌍 SUPPORTED COUNTRIES

Vaikimisi seadistatud:
- 🇪🇪 Estonia (EE)
- 🇸🇪 Sweden (SE)
- 🇫🇮 Finland (FI)
- 🇱🇻 Latvia (LV)
- 🇱🇹 Lithuania (LT)
- 🇳🇴 Norway (NO)
- 🇩🇰 Denmark (DK)

Nager.Date API toetab 90+ riiki!

---

## ✅ SUCCESS METRICS

- ✅ Import < 5s (per country/year)
- ✅ Table load < 1s
- ✅ Holiday lookup < 50ms
- ✅ Calendar render < 500ms
- ✅ Pay calculation automatic

---

## 🎯 JÄRGMISED SAMMUD

1. **Regional holidays** - Piirkondlikud pühad (nt. ainult Tallinn)
2. **Company holidays** - Ettevõtte pühad
3. **Shift-specific rules** - Vahetuse-põhised reeglid
4. **Holiday exchange** - Pühade vahetus
5. **Email notifications** - Tulevased pühad

---

**VALMIS! 🎄 Täielik pühade süsteem koos automaatse importi ja töötasu reeglitega!**
