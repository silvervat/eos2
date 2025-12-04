# 📊 SÜSTEEMI INTEGRATSIOON - VISUAALNE ÜLEVAADE

---

## 🎯 SÜSTEEMI STRUKTUUR

```
┌─────────────────────────────────────────────────────────────┐
│                    RIVEST EOS2 PLATFORM                     │
└─────────────────────────────────────────────────────────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   PROJECTS   │◄──►│  PERSONNEL   │◄──►│  LOCATIONS   │
│              │    │              │    │              │
│ • List       │    │ • Employees  │    │ • GPS Points │
│ • Details    │    │ • Check-in   │    │ • Geofence   │
│ • Status     │    │ • Leaves     │    │ • Validation │
└──────────────┘    └──────────────┘    └──────────────┘
```

---

## 🔄 ANDMEVOOG

### 1. Projekti Seadistamine

```
ADMIN
  │
  ├─► Loo Projekt (projects table)
  │
  ├─► Lisa Asukohad kaardile
  │   └─► Klõpsa kaardile või kasuta GPS
  │   └─► Määra raadius (nt. 100m)
  │   └─► Seadista GPS nõue
  │   └─► Salvesta (project_locations table)
  │
  └─► Lisa Töötajad projektile
      └─► Vali employees list'ist
      └─► Määra roll (monteerija, jne)
      └─► Salvesta (project_employees table)
```

### 2. Töötaja Check-in Protsess

```
TÖÖTAJA (MOBILE)
  │
  ├─► Ava Personnel app
  │
  ├─► Vali Projekt
  │   └─► Näitab ainult oma projekte
  │
  ├─► Vali Asukoht projektist
  │   └─► Näitab ainult selle projekti asukohtasid
  │
  ├─► Vajuta "TULE TÖÖLE"
  │   └─► GPS aktiveerub automaatselt
  │   └─► Võtab foto (kui require_photo = true)
  │
  ├─► VALIDEERIMINE (backend trigger):
  │   ├─► Kas töötaja on projektile määratud? ✓
  │   ├─► Kas GPS on kohustuslik? ✓
  │   ├─► Kas GPS koordinaadid on olemas? ✓
  │   ├─► Arvuta kaugus asukohast
  │   ├─► Kas kaugus <= raadius? (nt. 85m <= 100m) ✓
  │   └─► is_within_geofence = TRUE
  │
  └─► VASTUS:
      ├─► ✅ Tööle registreeritud! (kui geofence OK)
      └─► ⚠️  Oled väljaspool tööala! (kui geofence FAIL)
```

### 3. Andmebaasi Suhted

```sql
projects
   │
   ├─1:N─► project_locations (GPS asukohad)
   │         │
   │         └─► latitude, longitude, radius_meters
   │
   ├─N:M─► project_employees ◄─N:M─ employees
   │
   └─1:N─► attendance (check-ins)
             │
             ├─► employee_id
             ├─► project_id
             ├─► project_location_id
             ├─► latitude, longitude (töötaja GPS)
             ├─► distance_from_location (meetrites)
             └─► is_within_geofence (TRUE/FALSE)
```

---

## 📱 UI FLOW

### Projects Page → Locations

```
/projects
  │
  ├─► [Project Row]
  │     └─► [📍 Asukohad] button
  │           │
  │           └─► /projects/[id]/locations
  │                 │
  │                 ├─► [🗺️  MAP VIEW]
  │                 │     ├─► Markers (green/red)
  │                 │     ├─► Circles (geofence radius)
  │                 │     └─► Click to add location
  │                 │
  │                 ├─► [📋 LOCATIONS LIST]
  │                 │     ├─► Name
  │                 │     ├─► Radius
  │                 │     ├─► GPS Required
  │                 │     └─► [Edit] [Delete]
  │                 │
  │                 └─► [👥 ASSIGNED EMPLOYEES]
  │                       ├─► Employee Cards
  │                       └─► [+ Add Employee]
```

### Personnel Page → Check-in

```
/personnel
  │
  └─► [📍 TÖÖAJA REGISTREERIMINE]
        │
        ├─► Select Projekt: [Dropdown]
        │     └─► Shows only assigned projects
        │
        ├─► Select Asukoht: [Dropdown]
        │     └─► Shows only project's locations
        │
        ├─► GPS Status:
        │     └─► 📍 59.437123, 24.753456 (täpsus: 12m)
        │
        ├─► [🟢 TULE TÖÖLE] button
        │
        └─► [🔴 LAHKU TÖÖLT] button
```

---

## 📁 FAILIDE STRUKTUUR

```
apps/web/src/
│
├── app/
│   ├── (dashboard)/
│   │   ├── projects/
│   │   │   ├── page.tsx                    [✅ Olemas]
│   │   │   └── [id]/
│   │   │       └── locations/
│   │   │           └── page.tsx            [🆕 UUS]
│   │   │
│   │   └── personnel/
│   │       ├── page.tsx                    [🆕 UUS - Dashboard]
│   │       ├── employees/
│   │       │   └── page.tsx                [✅ Olemas]
│   │       ├── attendance/
│   │       │   └── page.tsx                [🆕 UUS]
│   │       └── leave-requests/
│   │           └── page.tsx                [🆕 UUS]
│   │
│   └── api/
│       ├── projects/
│       │   └── [id]/
│       │       ├── locations/
│       │       │   ├── route.ts            [🆕 UUS]
│       │       │   └── [locationId]/
│       │       │       └── route.ts        [🆕 UUS]
│       │       └── employees/
│       │           └── route.ts            [🆕 UUS]
│       │
│       └── personnel/
│           ├── attendance/
│           │   └── route.ts                [🆕 UUS]
│           └── leave-requests/
│               ├── route.ts                [🆕 UUS]
│               └── [id]/
│                   ├── approve/
│                   │   └── route.ts        [🆕 UUS]
│                   └── reject/
│                       └── route.ts        [🆕 UUS]
│
└── components/
    ├── projects/
    │   ├── ProjectLocationsMap.tsx         [🆕 UUS]
    │   ├── LocationDialog.tsx              [🆕 UUS]
    │   ├── ProjectEmployees.tsx            [🆕 UUS]
    │   ├── projects-table.tsx              [✅ Olemas - UUENDA]
    │   └── add-project-modal.tsx           [✅ Olemas]
    │
    └── personnel/
        ├── AttendanceCheckIn.tsx           [🆕 UUS]
        ├── AttendanceHistory.tsx           [🆕 UUS]
        ├── LeaveRequestForm.tsx            [🆕 UUS]
        └── LeaveRequestsList.tsx           [🆕 UUS]
```

---

## 🔌 API ENDPOINTS

```
GET    /api/projects                        [✅ Olemas]
POST   /api/projects                        [✅ Olemas]
GET    /api/projects/[id]                   [✅ Olemas]

GET    /api/projects/[id]/locations         [🆕 UUS]
POST   /api/projects/[id]/locations         [🆕 UUS]
PATCH  /api/projects/[id]/locations/[lid]   [🆕 UUS]
DELETE /api/projects/[id]/locations/[lid]   [🆕 UUS]

GET    /api/projects/[id]/employees         [🆕 UUS]
POST   /api/projects/[id]/employees         [🆕 UUS]
DELETE /api/projects/[id]/employees/[eid]   [🆕 UUS]

GET    /api/personnel/attendance            [🆕 UUS]
POST   /api/personnel/attendance            [🆕 UUS]

GET    /api/personnel/leave-requests        [🆕 UUS]
POST   /api/personnel/leave-requests        [🆕 UUS]
POST   /api/personnel/leave-requests/[id]/approve   [🆕 UUS]
POST   /api/personnel/leave-requests/[id]/reject    [🆕 UUS]
```

---

## 📊 ANDMEBAASI TABELID

```
✅ OLEMAS (EOS2 baas):
  - tenants
  - user_profiles
  - projects
  - companies

🆕 UUED (010_personnel_project_locations.sql):
  - departments
  - positions
  - shifts
  - employees
  - project_locations          ← GPS asukohad
  - project_employees          ← Töötajad projektidel
  - attendance                 ← Check-in/check-out
  - attendance_summaries       ← Igapäevased kokkuvõtted
  - leave_types
  - leave_requests
  - leave_balances
```

---

## ⚙️ SEADISTAMISE SAMMUD

### 1. Andmebaas

```bash
# 1. Kopeeri SQL fail Supabase'i
cd /home/claude/eos2-main/supabase/migrations

# 2. Loo fail
nano 010_personnel_project_locations.sql

# 3. Kopeeri sisu OUTPUT failist:
# /mnt/user-data/outputs/010_personnel_project_locations.sql

# 4. Rakenda
supabase db push
```

### 2. API Endpoints

```bash
# Loo API failid järgmises järjekorras:

# Projects endpoints
apps/web/src/app/api/projects/[id]/locations/route.ts
apps/web/src/app/api/projects/[id]/locations/[locationId]/route.ts
apps/web/src/app/api/projects/[id]/employees/route.ts

# Personnel endpoints
apps/web/src/app/api/personnel/attendance/route.ts
apps/web/src/app/api/personnel/leave-requests/route.ts
apps/web/src/app/api/personnel/leave-requests/[id]/approve/route.ts
```

### 3. Komponendid

```bash
# Projects komponendid
apps/web/src/components/projects/ProjectLocationsMap.tsx
apps/web/src/components/projects/LocationDialog.tsx
apps/web/src/components/projects/ProjectEmployees.tsx

# Personnel komponendid
apps/web/src/components/personnel/AttendanceCheckIn.tsx
apps/web/src/components/personnel/LeaveRequestForm.tsx
```

### 4. Pages

```bash
# Locations page
apps/web/src/app/(dashboard)/projects/[id]/locations/page.tsx

# Personnel pages
apps/web/src/app/(dashboard)/personnel/page.tsx
apps/web/src/app/(dashboard)/personnel/attendance/page.tsx
apps/web/src/app/(dashboard)/personnel/leave-requests/page.tsx
```

### 5. Integratsioon

```typescript
// Uuenda: apps/web/src/components/projects/projects-table.tsx

// Lisa action column'i:
<Button
  variant="ghost"
  size="sm"
  onClick={() => router.push(`/projects/${project.id}/locations`)}
>
  <MapPin className="w-4 h-4 mr-2" />
  Asukohad
</Button>
```

---

## 🧪 TESTIMINE

### 1. Andmebaas

```bash
# Kontrolli tabelite loomist
supabase db diff

# Test migrations
supabase db test
```

### 2. Project Locations

```
1. Mine /projects
2. Vali projekt
3. Klõpsa "Asukohad"
4. Kaardil klõpsa asukoha lisamiseks
5. Täida vorm:
   - Nimi: "Arlanda T5"
   - GPS: 59.652222, 17.918889
   - Raadius: 100m
   - GPS kohustuslik: ✓
6. Salvesta
7. Kontrolli:
   - Marker kaardil
   - Circle (geofence) kaardil
   - List all'
```

### 3. Employee Assignment

```
1. Samal lehel (/projects/[id]/locations)
2. Parem pool: "Assigned Employees"
3. Klõpsa "+ Lisa töötaja"
4. Vali töötaja
5. Määra roll: "Monteerija"
6. Salvesta
7. Kontrolli andmebaasis:
   SELECT * FROM project_employees;
```

### 4. GPS Check-in

```
1. Mine /personnel
2. Vali projekt dropdown'ist
3. Vali asukoht
4. GPS aktiveerub automaatselt
5. Klõpsa "TULE TÖÖLE"
6. Kontrolli:
   - GPS koordinaadid nähtavad
   - Distance arvutatud
   - is_within_geofence = true/false
   - Toast message vastavalt
```

---

## 🚀 DEPLOY CHECKLIST

- [ ] Andmebaas migreeritud
- [ ] API endpoints töötavad
- [ ] Komponendid renderdavad
- [ ] GPS funktsioon töötab
- [ ] Geofencing valideerib
- [ ] Check-in salvestub
- [ ] Leave requests workflow töötab
- [ ] RLS policies rakendatud
- [ ] Mobile responsive
- [ ] Error handling
- [ ] Loading states
- [ ] Toast notifications

---

## 📞 SUPPORT

Kui tekib probleeme:

1. **Andmebaas:** Kontrolli Supabase logs
2. **API:** Vaata Network tab DevTools'is
3. **GPS:** Kontrolli browser permissions
4. **Geofencing:** Vaata distance_from_location väärtust

---

## ✨ JÄRGMISED SAMMUD

1. ✅ **Kopeeri SQL** - 010_personnel_project_locations.sql
2. ✅ **Rakenda DB** - supabase db push
3. 🔄 **Ehita API** - Järjekorras endpoints
4. 🎨 **Loo UI** - Komponendid ja pages
5. 🧪 **Testi GPS** - Eriti geofencing
6. 🚀 **Deploy** - Production

**VALMIS! 🎉**
