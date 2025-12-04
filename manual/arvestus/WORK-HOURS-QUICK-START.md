# ⏰ TÖÖTUNDIDE HALDUS - QUICK START & ÜLEVAADE

---

## 🎯 SÜSTEEMI ÜLEVAADE

```
TÖÖTAJA                    MANAGER/ADMIN              SÜSTEEM
   │                            │                        │
   │  1. Check-in (GPS)         │                        │
   │─────────────────────────►  │                        │
   │                            │                        │
   │  Status: PENDING           │                        │
   │                            │                        │
   │                            │  2. Vaata tabelit     │
   │                            │◄───────────────────────│
   │                            │                        │
   │                            │  3. Tegevus:          │
   │                            │     [KINNITA]         │
   │                            │     [LÜKKA TAGASI]    │
   │                            │     [MUUDA]           │
   │                            │     [KOMMENTEERI]     │
   │                            │                        │
   │  4. Teavitus              │                        │
   │◄───────────────────────────────────────────────────│
   │                            │                        │
   │  "Sinu töötunnid          │                        │
   │   kinnitati"              │                        │
   │                            │                        │
```

---

## 📊 ANDMEBAASI STRUKTUUR

```sql
attendance (laiendatud)
  ├─► status (pending/approved/rejected/modified)
  ├─► approved_by → employees
  ├─► approved_at
  ├─► rejection_reason
  ├─► modified_by → employees
  ├─► modified_at
  ├─► modification_reason
  ├─► worked_hours
  └─► overtime_hours

attendance_comments (uus)
  ├─► attendance_id → attendance
  ├─► comment
  ├─► created_by → employees
  ├─► is_internal (nähtav ainult juhtidele)
  └─► created_at

attendance_audit_log (uus)
  ├─► attendance_id → attendance
  ├─► action (approved/rejected/modified/commented)
  ├─► performed_by → employees
  ├─► old_values (JSONB)
  ├─► new_values (JSONB)
  ├─► reason
  └─► performed_at

notifications (uus)
  ├─► employee_id → employees
  ├─► type (attendance_approved/rejected/modified/commented)
  ├─► title
  ├─► message
  ├─► entity_id → attendance
  ├─► action_url
  ├─► is_read
  └─► created_at
```

---

## 🎨 UI KOMPONENDID

### Põhitabel (WorkHoursTable.tsx)

```
┌─────────────────────────────────────────────────────────────┐
│  [Otsi...] [Staatus ▼] [Kuupäev ▼] [Filtreeri] [Eksport]   │
│                                                24 valitud ✓   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Kuup. │ Töötaja        │ Saabumine │ Lahkum. │ Tunnid │ ...│
├───────┼────────────────┼───────────┼─────────┼────────┼────┤
│ 04.12 │ Mari Maasikas  │ 08:05 🔴  │ 16:30   │ 8.4h   │ ⏸ │
│       │ MM-001         │           │         │ +0.4h  │🗨 💬│
│       │ Projektid      │           │         │ ⚠ GPS  │    │
├───────┼────────────────┼───────────┼─────────┼────────┼────┤
│ 04.12 │ Jaan Tamm      │ 07:55     │ -       │ -      │ ⏸ │
│       │ JT-002         │           │         │        │🗨 💬│
│       │ Montaaž        │           │         │ ✓ GPS  │    │
├───────┼────────────────┼───────────┼─────────┼────────┼────┤
```

**Võimalused:**
- ✅ Sortimine (kõik veerud)
- ✅ Filtreerimine (staatus, osakond, projekt, kuupäev)
- ✅ Grupeerimine (osakonna/projekti järgi)
- ✅ Bulk actions (kinnita kõik valitud)
- ✅ Export (CSV, Excel, PDF)

### Dialoogid

#### 1. Kinnitamise dialoog (kiire)
```
┌─────────────────────────────────────┐
│  ✅ Kinnita - Mari Maasikas        │
├─────────────────────────────────────┤
│                                     │
│  Kuupäev: 04.12.2024               │
│  Aeg: 08:05 - 16:30 (8.4h)         │
│                                     │
│  Kommentaar (valikuline):          │
│  ┌─────────────────────────────┐   │
│  │                             │   │
│  └─────────────────────────────┘   │
│                                     │
│      [Tühista]  [Kinnita] ✓        │
└─────────────────────────────────────┘
```

#### 2. Tagasilükkamise dialoog
```
┌─────────────────────────────────────┐
│  ❌ Lükka tagasi - Mari Maasikas   │
├─────────────────────────────────────┤
│                                     │
│  Põhjus (kohustuslik):              │
│  ┌─────────────────────────────┐   │
│  │ GPS asukoht ei ole korrekt...│   │
│  │                             │   │
│  └─────────────────────────────┘   │
│  Min 10 tähemärki                   │
│                                     │
│  ⚠️ Töötaja saab teavituse         │
│                                     │
│      [Tühista]  [Lükka tagasi]     │
└─────────────────────────────────────┘
```

#### 3. Muutmise dialoog
```
┌─────────────────────────────────────┐
│  ✏️  Muuda - Mari Maasikas          │
├─────────────────────────────────────┤
│  Kuupäev: 04.12.2024               │
│  Projekt: RM2506                    │
│                                     │
│  Saabumine:    Lahkumine:           │
│  [08:00 ▼]    [16:30 ▼]           │
│                                     │
│  Töötunde kokku:                    │
│  [8.5] tundi                        │
│                                     │
│  Muutmise põhjus:                   │
│  ┌─────────────────────────────┐   │
│  │ GPS oli vale, korrigeerin...│   │
│  └─────────────────────────────┘   │
│                                     │
│  ⚠️ Töötaja saab teavituse         │
│                                     │
│      [Tühista]  [Salvesta]         │
└─────────────────────────────────────┘
```

### Külgpaneelid (Drawers)

#### Kommentaarid
```
┌───────────────────────────────────┐
│  💬 Kommentaarid                  │
│  Mari Maasikas - 04.12.2024       │
├───────────────────────────────────┤
│                                   │
│  👤 Jüri Juht    2h tagasi        │
│  "GPS ei ole täpne, korriger..."  │
│  🔒 Sisene                         │
│                                   │
│  👤 Mari Maasikas  1h tagasi      │
│  "Telefon oli laadimas, GPS..."  │
│                                   │
├───────────────────────────────────┤
│  Lisa kommentaar:                 │
│  ┌─────────────────────────────┐ │
│  │                             │ │
│  └─────────────────────────────┘ │
│                                   │
│  [🔓 Avalik / 🔒 Sisene]         │
│              [Saada] →            │
└───────────────────────────────────┘
```

#### Audit Log (Ajalugu)
```
┌───────────────────────────────────┐
│  📜 Muudatuste ajalugu            │
│  Mari Maasikas - 04.12.2024       │
├───────────────────────────────────┤
│                                   │
│  ● ✅ Kinnitatud                  │
│    Jüri Juht                      │
│    04.12.2024 14:30               │
│                                   │
│  ● ✏️  Muudetud                    │
│    Jüri Juht                      │
│    04.12.2024 14:25               │
│    Põhjus: GPS ei ole täpne       │
│    ┌─────────────────────────┐   │
│    │ Saabumine:              │   │
│    │ 08:05 → 08:00           │   │
│    │ Tunnid: 8.4h → 8.5h     │   │
│    └─────────────────────────┘   │
│                                   │
│  ● 💬 Kommenteeritud              │
│    Mari Maasikas                  │
│    04.12.2024 13:15               │
│                                   │
│  ● ➕ Loodud                      │
│    Süsteem (Check-in)             │
│    04.12.2024 08:05               │
│                                   │
└───────────────────────────────────┘
```

### Teavituste Badge
```
┌───────────────────────────────────┐
│  🔔 Teavitused (3)                │
├───────────────────────────────────┤
│                                   │
│  🟢 Töötunnid kinnitatud          │
│     Sinu töötunnid 04.12 on...   │
│     2 minutit tagasi              │
│                                   │
│  🔴 Töötunnid tagasi lükatud      │
│     Sinu töötunnid 03.12 lükati   │
│     1 tund tagasi                 │
│                                   │
│  💬 Uus kommentaar                │
│     Lisati kommentaar 02.12       │
│     3 tundi tagasi                │
│                                   │
├───────────────────────────────────┤
│  [Vaata kõiki teavitusi] →        │
└───────────────────────────────────┘
```

---

## 🔄 TÖÖVOOG

### 1. Töötaja Check-in
```typescript
// Töötaja teeb check-in (mobile app)
POST /api/personnel/attendance
{
  employeeId: "...",
  type: "check_in",
  latitude: 59.437,
  longitude: 24.753,
  projectId: "...",
  projectLocationId: "..."
}

↓ Trigger validates GPS
↓ Creates attendance record with status: "pending"
```

### 2. Manager Kinnitab
```typescript
// Manager vaatab tabelit
GET /api/personnel/work-hours?status=pending

// Manager kinnitab
POST /api/personnel/work-hours/{id}/approve
{
  comment: "Kõik korras" // optional
}

↓ Updates status to "approved"
↓ Trigger sends notification to employee
↓ Logs audit entry
```

### 3. Töötaja Saab Teavituse
```typescript
// Töötaja saab teavituse
{
  type: "attendance_approved",
  title: "Töötunnid kinnitatud",
  message: "Sinu töötunnid 04.12.2024 on kinnitatud.",
  action_url: "/personnel/attendance?id=..."
}

// Notification badge number increases
// Push notification sent (if configured)
```

---

## 📁 FAILIDE STRUKTUUR

```
apps/web/src/

├── app/
│   ├── api/
│   │   └── personnel/
│   │       ├── work-hours/
│   │       │   ├── route.ts                    [GET list]
│   │       │   └── [id]/
│   │       │       ├── approve/route.ts        [POST]
│   │       │       ├── reject/route.ts         [POST]
│   │       │       ├── modify/route.ts         [PATCH]
│   │       │       ├── comments/route.ts       [GET, POST]
│   │       │       └── audit/route.ts          [GET]
│   │       └── notifications/
│   │           ├── route.ts                    [GET]
│   │           ├── [id]/read/route.ts          [PATCH]
│   │           └── mark-all-read/route.ts      [PATCH]
│   │
│   └── (dashboard)/
│       └── personnel/
│           └── work-hours/
│               └── page.tsx                    [Main page]
│
├── components/
│   └── personnel/
│       ├── WorkHoursTable.tsx                 [Main table]
│       ├── RejectDialog.tsx                   [Reject dialog]
│       ├── ModifyDialog.tsx                   [Modify dialog]
│       ├── CommentsDrawer.tsx                 [Comments drawer]
│       ├── AuditLogDrawer.tsx                 [Audit drawer]
│       └── NotificationsBadge.tsx             [Notifications]
│
└── lib/
    └── supabase/
        └── migrations/
            └── 011_work_hours_management.sql  [Database]
```

---

## 🚀 IMPLEMENTATSIOONI SAMMUD

### Faas 1: Andmebaas (30 min)

```bash
# 1. Kopeeri SQL fail
cp /mnt/user-data/outputs/011_work_hours_management.sql \
   supabase/migrations/

# 2. Rakenda migratsioon
supabase db push

# 3. Kontrolli
supabase db diff
```

**Kontrolli:**
- ✅ `attendance` tabel laiendatud
- ✅ `attendance_comments` tabel loodud
- ✅ `attendance_audit_log` tabel loodud
- ✅ `notifications` tabel loodud
- ✅ Triggerid töötavad
- ✅ Views loodud

### Faas 2: API Endpoints (1-2h)

Loo järgmised failid:

1. `apps/web/src/app/api/personnel/work-hours/route.ts`
2. `apps/web/src/app/api/personnel/work-hours/[id]/approve/route.ts`
3. `apps/web/src/app/api/personnel/work-hours/[id]/reject/route.ts`
4. `apps/web/src/app/api/personnel/work-hours/[id]/modify/route.ts`
5. `apps/web/src/app/api/personnel/work-hours/[id]/comments/route.ts`
6. `apps/web/src/app/api/personnel/work-hours/[id]/audit/route.ts`

**Test:**
```bash
# Test GET
curl http://localhost:3000/api/personnel/work-hours

# Test approve
curl -X POST http://localhost:3000/api/personnel/work-hours/{id}/approve \
  -H "Content-Type: application/json" \
  -d '{"comment": "Test"}'
```

### Faas 3: Frontend Komponendid (2-3h)

Loo komponendid selles järjekorras:

1. **WorkHoursTable.tsx** (põhitabel)
   - Tabel Ant Design'iga
   - Filtrid, sortimine
   - Bulk actions

2. **RejectDialog.tsx** (tagasilükkamine)
   - Modal
   - Form validation
   - Reason textarea

3. **ModifyDialog.tsx** (muutmine)
   - Modal
   - Time pickers
   - Hour calculation

4. **CommentsDrawer.tsx** (kommentaarid)
   - Drawer
   - Comments list
   - Add comment form
   - Internal/public toggle

5. **AuditLogDrawer.tsx** (ajalugu)
   - Drawer
   - Timeline
   - Change comparison

6. **NotificationsBadge.tsx** (teavitused)
   - Badge
   - Dropdown
   - Notification list

### Faas 4: Page (30 min)

Loo leht:
```typescript
// apps/web/src/app/(dashboard)/personnel/work-hours/page.tsx
```

Integreeri kõik komponendid.

### Faas 5: Test (1h)

**Test Checklist:**
- [ ] GET /api/personnel/work-hours töötab
- [ ] Approve funktsioon töötab
- [ ] Reject funktsioon töötab
- [ ] Modify funktsioon töötab
- [ ] Comments lisamine töötab
- [ ] Audit log näitab muudatusi
- [ ] Teavitused tulevad
- [ ] Bulk approve töötab
- [ ] Filtrid töötavad
- [ ] Sortimine töötab
- [ ] Export töötab

---

## ✅ SUCCESS METRICS

- ✅ Tabel laadib <1s
- ✅ Kinnitamine <500ms
- ✅ Teavitused tulevad <5s
- ✅ Audit log täielik
- ✅ RLS policies töötavad
- ✅ Mobile responsive

---

## 🎯 KASUTAJATE ÕIGUSED

```
Owner/Admin:
  ✅ Näeb kõiki töötunde
  ✅ Kinnitab
  ✅ Lükkab tagasi
  ✅ Muudab
  ✅ Kommenteerib
  ✅ Näeb audit log'i

Manager:
  ✅ Näeb oma meeskonna töötunde
  ✅ Kinnitab
  ✅ Lükkab tagasi
  ✅ Muudab
  ✅ Kommenteerib
  ✅ Näeb audit log'i

User:
  ✅ Näeb oma töötunde (read-only)
  ✅ Kommenteerib oma kirjeid
  ✅ Saab teavitusi
  ❌ Ei saa kinnitada/tagasi lükata
```

---

## 📊 RAPORTID

### 1. Ootel kinnitust
```sql
SELECT COUNT(*)
FROM attendance
WHERE status = 'pending'
  AND date >= CURRENT_DATE - INTERVAL '7 days';
```

### 2. Kinnitatud tänane
```sql
SELECT COUNT(*)
FROM attendance
WHERE status = 'approved'
  AND date = CURRENT_DATE;
```

### 3. Ületunnid sel kuul
```sql
SELECT SUM(overtime_hours)
FROM attendance
WHERE date >= DATE_TRUNC('month', CURRENT_DATE);
```

---

## 🔧 TROUBLESHOOTING

### Teavitused ei tule?
```sql
-- Kontrolli triggereid
SELECT * FROM pg_trigger WHERE tgname LIKE '%attendance%';

-- Test notification function
SELECT send_attendance_notification(
  'employee-id',
  'attendance_approved',
  'Test',
  'Test message',
  'attendance-id'
);
```

### Audit log tühi?
```sql
-- Kontrolli audit trigger
SELECT * FROM attendance_audit_log ORDER BY performed_at DESC LIMIT 10;
```

### RLS blokeerib?
```sql
-- Test RLS policy
SET app.tenant_id = 'your-tenant-id';
SET app.user_id = 'your-user-id';
SELECT * FROM v_attendance_management LIMIT 10;
```

---

## 📚 JÄRGMISED SAMMUD

1. ✅ **SMS teavitused** - Integreeri Twilio
2. ✅ **Email teavitused** - Integreeri SendGrid
3. ✅ **Push notifications** - Integreeri Firebase
4. ✅ **Excel export** - Täiustatud raportid
5. ✅ **Statistika dashboard** - Graafikud
6. ✅ **Bulk edit** - Mass modify

---

**VALMIS! 🎉 Töötundide haldussüsteem on täielik!**
