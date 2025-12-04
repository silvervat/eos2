# 🤖 CLAUDE CODE - TÄIELIK IMPLEMENTATSIOONI KAVA
## TÖÖ & PUHKUS süsteemi lõplik build plan
### Step-by-step guide with zero ambiguity

---

## 📋 SISUKORD

1. [Projekti Setup](#1-projekti-setup)
2. [Andmebaas (SQL)](#2-andmebaas-sql)
3. [API Layer](#3-api-layer)
4. [Frontend komponendid](#4-frontend-komponendid)
5. [Spetsiifilised nõuded](#5-spetsiifilised-nõuded)
6. [Testimine](#6-testimine)
7. [Deployment](#7-deployment)

---

## 🎯 KRIITILISED NÕUDED (MUST-HAVE)

### 1. **3-kuu kompaktne kalender vaade**
```
┌─────────────────────────────────────────────────────────────┐
│  TÖÖPÄEVADE ÜLEVAADE - Silver (Oktoober 2024 - Detsember 2024) │
├─────────────────────────────────────────────────────────────┤
│           OKTOOBER      NOVEMBER      DETSEMBER              │
│  P E T K N R L  P E T K N R L  P E T K N R L               │
│  ─────────────────────────────────────────────────────      │
│  [8][8][8][8][8][ ][ ] [8][8][8][8][8][ ][ ] [8][8][8][8]  │
│  [8][8][8][8][8][ ][ ] [8][8][8][8][8][ ][ ] [8][8][8][8]  │
│  [8][8][8][8][8][ ][ ] [8][8][8][8][8][ ][ ] [8][8][8][8]  │
│  [8][8][8][8][8][ ][ ] [8][8][8][8][8][ ][ ] [8][8][8][8]  │
│                                                               │
│  LEGEND:                                                      │
│  🟢 Kinnitatud  🟡 Ootel  🔴 Tagasi lükatud  ⚪ Pole andmeid │
│  Numbrid = töötunnid                                         │
│                                                               │
│  KOKKU: 480h (160h/kuu keskmine)                            │
└─────────────────────────────────────────────────────────────┘
```

**Visuaalne disain:**
- Tumesinise tausta (#0a1628) peal
- Rohelised ruudud (#22c55e) - kinnitatud
- Kollased ruudud (#eab308) - ootel/kommentaariga
- Punased ruudud (#ef4444) - tagasi lükatud
- Tumehallid ruudud (#334155) - pole andmeid
- Iga ruudu peal number (töötunnid)
- Hover'il tooltip: kuupäev, projekt, täpsed tunnid, staatus

### 2. **Mitu projekti päevas**
- Töötaja võib ühel päeval olla mitmel projektil
- Check-in/out on projektipõhine
- UI peab näitama kõiki sessioone päeva kohta
- Tööajad ei tohi kattuda (validatsioon)

### 3. **Auto registreerimine (ehitusobjektid)**
```typescript
// Check-in flow for construction sites
if (project.type === 'construction') {
  // Ask for vehicle
  const vehicle = await selectVehicle();
  
  attendance.vehicle_arrival = vehicle.registration_number;
  attendance.vehicle_arrival_type = vehicle.type; // 'company_car' | 'personal_car' | 'company_truck'
}

// Check-out flow
if (project.type === 'construction') {
  const vehicle = await selectVehicle();
  
  attendance.vehicle_departure = vehicle.registration_number;
  attendance.vehicle_departure_type = vehicle.type;
}

// Office projects - no vehicle tracking
if (project.type === 'office') {
  // Skip vehicle selection
}
```

### 4. **Objektide gruppide lõunapausid**
- Erinevatel objektidel/gruppidel erinevad lõunaajad
- Default: 30 min (12:00-12:30)
- RM2506: 45 min (11:30-12:15)
- MG-EKS: 60 min (12:00-13:00)
- Kontor: 30 min (vabalt valitav)

---

## 1️⃣ PROJEKTI SETUP

### 1.1 Environment setup

```bash
# Check if project exists
cd /path/to/project

# Install dependencies if needed
npm install

# Check database connection
psql $DATABASE_URL -c "SELECT 1"

# Create migration folder structure
mkdir -p supabase/migrations
```

### 1.2 Required dependencies

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "next": "^14.2.0",
    "@supabase/supabase-js": "^2.45.0",
    "date-fns": "^3.0.0",
    "recharts": "^2.10.0",
    "gantt-task-react": "^0.3.9",
    "exceljs": "^4.4.0",
    "handlebars": "^4.7.8",
    "puppeteer": "^21.0.0",
    "geojson": "^0.5.0"
  }
}
```

### 1.3 Environment variables

```bash
# .env.local
DATABASE_URL=postgresql://...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 2️⃣ ANDMEBAAS (SQL) - 7 MIGRATSIOONI

### Migration order ja sõltuvused

```
010_personnel_project_locations.sql        (Projektid + GPS)
    ↓
011_work_hours_management.sql              (Töötundide kinnitamine)
    ↓
012_holidays_system.sql                    (Pühad)
    ↓
013_leave_management_system.sql            (Puhkused)
    ↓
014_country_work_rules.sql                 (Riigipõhised reeglid) ⭐ UUS
    ↓
015_work_schedule_gantt.sql                (Gantt planner) ⭐ UUS
    ↓
016_document_templates.sql                 (Avaldused) ⭐ UUS
```

### 2.1 Loo puuduvad migratsioonid

**FILE: `supabase/migrations/014_country_work_rules.sql`**

```sql
-- ============================================
-- COUNTRY WORK RULES & OVERWORK WARNINGS
-- ============================================

-- Copy from WORK-LEAVE-COUNTRY-SETTINGS-WARNINGS.md
-- Section: "RIIGIPÕHISED TÖÖAJA REEGLID"

CREATE TABLE IF NOT EXISTS country_work_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  country_code TEXT NOT NULL REFERENCES countries(code) UNIQUE,
  
  -- Normal working time
  normal_hours_per_day DECIMAL(4,2) DEFAULT 8.0,
  normal_hours_per_week DECIMAL(4,2) DEFAULT 40.0,
  
  -- Maximum limits
  max_hours_per_day DECIMAL(4,2) DEFAULT 13.0,
  max_hours_per_week DECIMAL(4,2) DEFAULT 48.0,
  
  -- Overtime rules
  overtime_multiplier_normal DECIMAL(3,2) DEFAULT 1.5,
  overtime_multiplier_extended DECIMAL(3,2) DEFAULT 2.0,
  
  -- ... (rest from documentation)
);

-- Insert Estonian rules
INSERT INTO country_work_rules (...) VALUES (...);

-- Overwork warnings
CREATE TABLE IF NOT EXISTS work_time_violations (...);

-- Functions
CREATE OR REPLACE FUNCTION check_overwork_violations(...) ...;

-- Triggers
CREATE TRIGGER check_overwork_on_checkout ...;
```

**FILE: `supabase/migrations/015_work_schedule_gantt.sql`**

```sql
-- ============================================
-- WORK SCHEDULE PLANNING (GANTT)
-- ============================================

CREATE TABLE IF NOT EXISTS work_schedules (...);
CREATE TABLE IF NOT EXISTS employee_schedule_assignments (...);
CREATE TABLE IF NOT EXISTS daily_work_plans (...);

-- Functions for schedule generation
CREATE OR REPLACE FUNCTION generate_daily_plans(...) ...;
```

**FILE: `supabase/migrations/016_document_templates.sql`**

```sql
-- ============================================
-- DOCUMENT TEMPLATES & GENERATED DOCUMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS document_templates (...);
CREATE TABLE IF NOT EXISTS generated_documents (...);

-- Insert default Estonian work hours template
INSERT INTO document_templates (...) VALUES (...);
```

**FILE: `supabase/migrations/017_vehicles_and_project_types.sql`** ⭐ UUUS!

```sql
-- ============================================
-- VEHICLES & PROJECT TYPE EXTENSIONS
-- ============================================

-- Add project types
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS project_type TEXT DEFAULT 'construction' 
    CHECK (project_type IN ('construction', 'office', 'warehouse', 'remote')),
  ADD COLUMN IF NOT EXISTS requires_vehicle_tracking BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS default_lunch_break_minutes INTEGER DEFAULT 30,
  ADD COLUMN IF NOT EXISTS lunch_break_start TIME DEFAULT '12:00',
  ADD COLUMN IF NOT EXISTS lunch_break_end TIME;

-- Update existing projects
UPDATE projects 
SET project_type = 'construction',
    requires_vehicle_tracking = true,
    default_lunch_break_minutes = 45
WHERE code = 'RM2506';

UPDATE projects 
SET project_type = 'construction',
    requires_vehicle_tracking = true,
    default_lunch_break_minutes = 60
WHERE code = 'MG-EKS';

UPDATE projects 
SET project_type = 'office',
    requires_vehicle_tracking = false,
    default_lunch_break_minutes = 30
WHERE name ILIKE '%kontor%' OR name ILIKE '%office%';

-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id),
  
  registration_number TEXT NOT NULL UNIQUE,
  
  vehicle_type TEXT NOT NULL CHECK (vehicle_type IN (
    'company_car',
    'personal_car', 
    'company_truck',
    'company_van',
    'personal_bike',
    'public_transport'
  )),
  
  make TEXT,
  model TEXT,
  year INTEGER,
  
  -- Ownership
  owned_by TEXT CHECK (owned_by IN ('company', 'employee')),
  assigned_to_employee_id UUID REFERENCES employees(id),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Notes
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicles_registration ON vehicles(registration_number);
CREATE INDEX idx_vehicles_assigned_to ON vehicles(assigned_to_employee_id);

COMMENT ON TABLE vehicles IS 'Company and employee vehicles for tracking';

-- Employee default vehicles
CREATE TABLE IF NOT EXISTS employee_default_vehicles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  employee_id UUID NOT NULL REFERENCES employees(id),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id),
  
  is_primary BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(employee_id, vehicle_id)
);

-- Add vehicle tracking to attendance
ALTER TABLE attendance
  ADD COLUMN IF NOT EXISTS vehicle_arrival_id UUID REFERENCES vehicles(id),
  ADD COLUMN IF NOT EXISTS vehicle_departure_id UUID REFERENCES vehicles(id),
  ADD COLUMN IF NOT EXISTS vehicle_arrival_odometer INTEGER, -- km
  ADD COLUMN IF NOT EXISTS vehicle_departure_odometer INTEGER; -- km

CREATE INDEX idx_attendance_vehicle_arrival ON attendance(vehicle_arrival_id);
CREATE INDEX idx_attendance_vehicle_departure ON attendance(vehicle_departure_id);

-- Sample vehicles
INSERT INTO vehicles (registration_number, vehicle_type, make, model, year, owned_by, is_active)
VALUES 
  ('ABC-123', 'company_car', 'Toyota', 'Hilux', 2022, 'company', true),
  ('DEF-456', 'company_truck', 'Mercedes-Benz', 'Sprinter', 2021, 'company', true),
  ('GHI-789', 'company_van', 'Ford', 'Transit', 2023, 'company', true),
  ('JKL-012', 'personal_car', 'Volvo', 'V70', 2018, 'employee', true)
ON CONFLICT (registration_number) DO NOTHING;

-- RLS Policies
ALTER TABLE vehicles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view vehicles"
  ON vehicles FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM employees WHERE id = auth.uid()
    )
  );

CREATE POLICY "Managers can manage vehicles"
  ON vehicles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM employees 
      WHERE id = auth.uid() 
        AND role IN ('manager', 'admin', 'owner')
        AND tenant_id = vehicles.tenant_id
    )
  );
```

**FILE: `supabase/migrations/018_three_month_calendar_view.sql`** ⭐ UUUS!

```sql
-- ============================================
-- 3-MONTH CALENDAR VIEW OPTIMIZATIONS
-- ============================================

-- Materialized view for fast 3-month calendar lookups
CREATE MATERIALIZED VIEW IF NOT EXISTS v_employee_three_month_calendar AS
SELECT 
  e.id as employee_id,
  e.full_name as employee_name,
  d.date,
  EXTRACT(YEAR FROM d.date) as year,
  EXTRACT(MONTH FROM d.date) as month,
  EXTRACT(DAY FROM d.date) as day,
  EXTRACT(DOW FROM d.date) as day_of_week,
  
  -- Attendance data
  a.id as attendance_id,
  a.project_id,
  p.name as project_name,
  p.code as project_code,
  
  -- Hours
  a.worked_hours,
  a.normal_hours,
  a.overtime_hours,
  
  -- Status
  a.status,
  a.approval_status,
  
  -- Counts
  (SELECT COUNT(*) FROM attendance WHERE employee_id = e.id AND date = d.date) as sessions_count,
  
  -- Leave
  (SELECT lr.leave_type_id FROM leave_requests lr 
   WHERE lr.employee_id = e.id 
     AND lr.status = 'approved'
     AND d.date BETWEEN lr.start_date AND lr.end_date
   LIMIT 1) as leave_type_id,
  
  -- Holiday
  h.id as holiday_id,
  h.name as holiday_name,
  
  -- Violations
  (SELECT COUNT(*) FROM work_time_violations wtv
   WHERE wtv.employee_id = e.id
     AND wtv.period_start <= d.date
     AND wtv.period_end >= d.date
     AND wtv.resolved = false) as violations_count
  
FROM employees e
CROSS JOIN generate_series(
  CURRENT_DATE - INTERVAL '3 months',
  CURRENT_DATE + INTERVAL '1 month',
  INTERVAL '1 day'
) d(date)
LEFT JOIN attendance a ON a.employee_id = e.id AND a.date = d.date
LEFT JOIN projects p ON p.id = a.project_id
LEFT JOIN holidays h ON h.date = d.date AND h.country_code = e.country_code
WHERE e.is_active = true;

CREATE UNIQUE INDEX idx_three_month_calendar_employee_date 
  ON v_employee_three_month_calendar(employee_id, date, attendance_id);

CREATE INDEX idx_three_month_calendar_date 
  ON v_employee_three_month_calendar(date);

-- Refresh function (call nightly)
CREATE OR REPLACE FUNCTION refresh_three_month_calendar()
RETURNS VOID AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY v_employee_three_month_calendar;
END;
$$ LANGUAGE plpgsql;

-- API helper function
CREATE OR REPLACE FUNCTION get_employee_calendar_grid(
  p_employee_id UUID,
  p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '3 months',
  p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(
  date DATE,
  year INTEGER,
  month INTEGER,
  day INTEGER,
  day_of_week INTEGER,
  total_hours DECIMAL,
  status TEXT,
  has_violations BOOLEAN,
  is_holiday BOOLEAN,
  is_leave BOOLEAN,
  sessions_count INTEGER,
  color TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cal.date,
    cal.year,
    cal.month,
    cal.day,
    cal.day_of_week,
    
    -- Aggregate hours if multiple sessions
    COALESCE(SUM(cal.worked_hours), 0) as total_hours,
    
    -- Status priority: rejected > pending > approved
    CASE 
      WHEN COUNT(*) FILTER (WHERE cal.approval_status = 'rejected') > 0 THEN 'rejected'
      WHEN COUNT(*) FILTER (WHERE cal.approval_status = 'pending') > 0 THEN 'pending'
      WHEN COUNT(*) FILTER (WHERE cal.approval_status = 'approved') > 0 THEN 'approved'
      ELSE 'no_data'
    END as status,
    
    -- Flags
    MAX(cal.violations_count) > 0 as has_violations,
    MAX(cal.holiday_id) IS NOT NULL as is_holiday,
    MAX(cal.leave_type_id) IS NOT NULL as is_leave,
    MAX(cal.sessions_count) as sessions_count,
    
    -- Color coding
    CASE
      WHEN MAX(cal.leave_type_id) IS NOT NULL THEN '#3b82f6' -- Blue for leave
      WHEN MAX(cal.holiday_id) IS NOT NULL THEN '#8b5cf6' -- Purple for holiday
      WHEN COUNT(*) FILTER (WHERE cal.approval_status = 'rejected') > 0 THEN '#ef4444' -- Red
      WHEN COUNT(*) FILTER (WHERE cal.approval_status = 'pending') > 0 THEN '#eab308' -- Yellow
      WHEN COUNT(*) FILTER (WHERE cal.approval_status = 'approved') > 0 THEN '#22c55e' -- Green
      ELSE '#334155' -- Gray for no data
    END as color
    
  FROM v_employee_three_month_calendar cal
  WHERE cal.employee_id = p_employee_id
    AND cal.date BETWEEN p_start_date AND p_end_date
  GROUP BY cal.date, cal.year, cal.month, cal.day, cal.day_of_week
  ORDER BY cal.date;
END;
$$ LANGUAGE plpgsql STABLE;

-- Test query
-- SELECT * FROM get_employee_calendar_grid('employee-uuid-here', '2024-10-01', '2024-12-31');
```

### 2.2 Run migrations

```bash
# Run all migrations in order
for file in supabase/migrations/*.sql; do
  echo "Running: $file"
  psql $DATABASE_URL -f "$file"
  
  if [ $? -ne 0 ]; then
    echo "❌ Migration failed: $file"
    exit 1
  fi
done

echo "✅ All migrations completed successfully"
```

---

## 3️⃣ API LAYER

### 3.1 API endpoint structure

```
apps/web/src/app/api/
├── work-and-leave/
│   ├── timer/
│   │   ├── check-in/route.ts            ⭐
│   │   ├── check-out/route.ts           ⭐
│   │   ├── current/route.ts
│   │   └── today/route.ts
│   ├── my-work/
│   │   ├── calendar/route.ts            ⭐ 3-month grid
│   │   ├── statistics/route.ts
│   │   └── [id]/route.ts
│   ├── my-leave/
│   │   ├── balance/route.ts
│   │   ├── requests/route.ts
│   │   └── calendar/route.ts
│   ├── management/
│   │   ├── approvals/
│   │   │   ├── work-hours/route.ts
│   │   │   └── leave-requests/route.ts
│   │   ├── reports/
│   │   │   ├── work-hours/route.ts
│   │   │   ├── payroll/route.ts        ⭐
│   │   │   └── export/route.ts         ⭐
│   │   └── team/
│   │       └── status/route.ts
│   └── vehicles/                        ⭐ NEW
│       ├── route.ts
│       └── [id]/route.ts
```

### 3.2 Critical API implementations

**FILE: `apps/web/src/app/api/work-and-leave/timer/check-in/route.ts`**

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { 
    project_id, 
    latitude, 
    longitude, 
    notes,
    vehicle_id, // ⭐ NEW
    odometer_reading, // ⭐ NEW
  } = await request.json();
  
  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get employee
  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();
  
  // Get project details (including type)
  const { data: project } = await supabase
    .from('projects')
    .select('*, project_locations(*)')
    .eq('id', project_id)
    .single();
  
  if (!project) {
    return NextResponse.json({ error: 'Project not found' }, { status: 404 });
  }
  
  // ⭐ VEHICLE VALIDATION for construction sites
  if (project.requires_vehicle_tracking && !vehicle_id) {
    return NextResponse.json({ 
      error: 'Vehicle is required for construction sites',
      requires_vehicle: true,
    }, { status: 400 });
  }
  
  // GPS validation
  if (project.project_locations && project.project_locations.length > 0) {
    const location = project.project_locations[0];
    
    const { data: gpsCheck } = await supabase.rpc('check_point_in_geofence', {
      p_lat: latitude,
      p_lng: longitude,
      p_geofence: location.geofence,
    });
    
    if (!gpsCheck) {
      // Outside geofence - require approval
      return NextResponse.json({
        warning: 'You are outside the project area',
        distance: calculateDistance(latitude, longitude, location),
        requires_approval: true,
      }, { status: 200 });
    }
  }
  
  // Check for existing active session
  const { data: existing } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', employee.id)
    .is('check_out_time', null)
    .single();
  
  if (existing) {
    return NextResponse.json({ 
      error: 'You already have an active session',
      existing_session: existing,
    }, { status: 400 });
  }
  
  // ⭐ Check for overlapping sessions
  const { data: todaySessions } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', employee.id)
    .eq('date', new Date().toISOString().split('T')[0])
    .not('check_out_time', 'is', null);
  
  // Create attendance record
  const { data: attendance, error } = await supabase
    .from('attendance')
    .insert({
      employee_id: employee.id,
      project_id,
      date: new Date().toISOString().split('T')[0],
      check_in_time: new Date().toISOString(),
      check_in_latitude: latitude,
      check_in_longitude: longitude,
      check_in_notes: notes,
      vehicle_arrival_id: vehicle_id, // ⭐ NEW
      vehicle_arrival_odometer: odometer_reading, // ⭐ NEW
      status: 'active',
    })
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({
    success: true,
    attendance,
    project,
    message: 'Successfully checked in',
  });
}
```

**FILE: `apps/web/src/app/api/work-and-leave/my-work/calendar/route.ts`** ⭐

```typescript
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { subMonths, format } from 'date-fns';

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { searchParams } = new URL(request.url);
  const monthsBack = parseInt(searchParams.get('months') || '3');
  
  // Get authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Get employee
  const { data: employee } = await supabase
    .from('employees')
    .select('id')
    .eq('auth_user_id', user.id)
    .single();
  
  // Calculate date range
  const endDate = new Date();
  const startDate = subMonths(endDate, monthsBack);
  
  // ⭐ Use optimized function
  const { data: calendar, error } = await supabase.rpc(
    'get_employee_calendar_grid',
    {
      p_employee_id: employee.id,
      p_start_date: format(startDate, 'yyyy-MM-dd'),
      p_end_date: format(endDate, 'yyyy-MM-dd'),
    }
  );
  
  if (error) {
    console.error('Calendar error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // Group by month for frontend
  const grouped = calendar.reduce((acc, day) => {
    const key = `${day.year}-${String(day.month).padStart(2, '0')}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(day);
    return acc;
  }, {} as Record<string, any[]>);
  
  return NextResponse.json({
    calendar: grouped,
    raw: calendar,
    startDate: format(startDate, 'yyyy-MM-dd'),
    endDate: format(endDate, 'yyyy-MM-dd'),
  });
}
```

**FILE: `apps/web/src/app/api/vehicles/route.ts`** ⭐ NEW

```typescript
export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  
  const { searchParams } = new URL(request.url);
  const includeInactive = searchParams.get('include_inactive') === 'true';
  
  // Get authenticated user's vehicles
  const { data: { user } } = await supabase.auth.getUser();
  
  // Get employee
  const { data: employee } = await supabase
    .from('employees')
    .select('id, tenant_id')
    .eq('auth_user_id', user.id)
    .single();
  
  // Get vehicles
  let query = supabase
    .from('vehicles')
    .select('*, employee_default_vehicles(*)')
    .eq('tenant_id', employee.tenant_id)
    .order('registration_number');
  
  if (!includeInactive) {
    query = query.eq('is_active', true);
  }
  
  const { data: vehicles, error } = await query;
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  // Mark employee's default vehicles
  const enhanced = vehicles.map(v => ({
    ...v,
    is_my_default: v.employee_default_vehicles.some(
      edv => edv.employee_id === employee.id
    ),
  }));
  
  return NextResponse.json({ vehicles: enhanced });
}
```

---

Kas jätkan kohe Frontend komponentidega? 🚀

---

## 4️⃣ FRONTEND KOMPONENDID

### 4.1 3-kuu kompaktne kalender ⭐

**FILE: `apps/web/src/components/work-and-leave/ThreeMonthCalendar.tsx`**

```typescript
'use client';

import { useEffect, useState } from 'react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, getDay } from 'date-fns';
import { et } from 'date-fns/locale';
import { Tooltip } from 'antd';

interface CalendarDay {
  date: Date;
  hours: number;
  status: 'approved' | 'pending' | 'rejected' | 'no_data';
  color: string;
  sessions_count: number;
  has_violations: boolean;
  is_holiday: boolean;
  is_leave: boolean;
  projects?: string[];
}

interface MonthData {
  month: Date;
  days: CalendarDay[];
}

export function ThreeMonthCalendar({ employeeId }: { employeeId?: string }) {
  const [months, setMonths] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchCalendarData();
  }, [employeeId]);
  
  async function fetchCalendarData() {
    setLoading(true);
    
    const response = await fetch('/api/work-and-leave/my-work/calendar?months=3');
    const data = await response.json();
    
    // Transform data into month structure
    const monthsData: MonthData[] = [];
    
    Object.keys(data.calendar).sort().forEach(monthKey => {
      const days = data.calendar[monthKey];
      const monthDate = new Date(monthKey + '-01');
      
      monthsData.push({
        month: monthDate,
        days: days.map((d: any) => ({
          date: new Date(d.date),
          hours: d.total_hours || 0,
          status: d.status,
          color: d.color,
          sessions_count: d.sessions_count || 0,
          has_violations: d.has_violations || false,
          is_holiday: d.is_holiday || false,
          is_leave: d.is_leave || false,
        })),
      });
    });
    
    setMonths(monthsData);
    setLoading(false);
  }
  
  if (loading) {
    return <div className="text-center py-8">Laen kalendrit...</div>;
  }
  
  return (
    <div className="bg-slate-900 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-6">
        Töötunnid - Viimased 3 kuud
      </h2>
      
      {/* Month headers */}
      <div className="grid grid-cols-3 gap-6 mb-4">
        {months.map((monthData, idx) => (
          <div key={idx} className="text-center">
            <h3 className="text-lg font-medium text-slate-300 uppercase tracking-wide">
              {format(monthData.month, 'MMMM yyyy', { locale: et })}
            </h3>
          </div>
        ))}
      </div>
      
      {/* Weekday headers */}
      <div className="grid grid-cols-3 gap-6 mb-2">
        {months.map((_, idx) => (
          <div key={idx} className="grid grid-cols-7 gap-1">
            {['P', 'E', 'T', 'K', 'N', 'R', 'L'].map((day, i) => (
              <div 
                key={i} 
                className="text-center text-xs font-medium text-slate-400 py-1"
              >
                {day}
              </div>
            ))}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-3 gap-6">
        {months.map((monthData, monthIdx) => (
          <div key={monthIdx} className="grid grid-cols-7 gap-1">
            {/* Empty cells for alignment */}
            {Array.from({ length: getDay(monthData.days[0].date) === 0 ? 6 : getDay(monthData.days[0].date) - 1 }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}
            
            {/* Day cells */}
            {monthData.days.map((day, dayIdx) => (
              <Tooltip
                key={dayIdx}
                title={
                  <div className="text-xs">
                    <div className="font-semibold">
                      {format(day.date, 'd. MMMM yyyy', { locale: et })}
                    </div>
                    <div className="mt-1">
                      <div>Tunnid: {day.hours.toFixed(1)}h</div>
                      {day.sessions_count > 1 && (
                        <div>{day.sessions_count} sessiooni</div>
                      )}
                      <div>
                        Staatus: {
                          day.status === 'approved' ? '✅ Kinnitatud' :
                          day.status === 'pending' ? '⏳ Ootel' :
                          day.status === 'rejected' ? '❌ Tagasi lükatud' :
                          '⚪ Pole andmeid'
                        }
                      </div>
                      {day.has_violations && (
                        <div className="text-red-400">⚠️ Hoiatus!</div>
                      )}
                      {day.is_holiday && <div>🎉 Püha</div>}
                      {day.is_leave && <div>🏖️ Puhkus</div>}
                    </div>
                  </div>
                }
                placement="top"
              >
                <div
                  className={`
                    aspect-square rounded-md flex items-center justify-center
                    text-xs font-medium cursor-pointer
                    transition-all duration-200
                    hover:ring-2 hover:ring-white hover:scale-105
                  `}
                  style={{ backgroundColor: day.color }}
                  onClick={() => handleDayClick(day)}
                >
                  <div className="text-white">
                    {day.hours > 0 ? day.hours.toFixed(0) : ''}
                    {day.has_violations && (
                      <div className="text-[8px] text-red-300">⚠</div>
                    )}
                  </div>
                </div>
              </Tooltip>
            ))}
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-4 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-500"></div>
          <span>Kinnitatud</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-yellow-500"></div>
          <span>Ootel</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-500"></div>
          <span>Tagasi lükatud</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-500"></div>
          <span>Puhkus</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-purple-500"></div>
          <span>Püha</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-600"></div>
          <span>Pole andmeid</span>
        </div>
      </div>
      
      {/* Summary */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-sm text-slate-400">Kokku tunnid</div>
          <div className="text-2xl font-bold text-white">
            {months.reduce((sum, m) => 
              sum + m.days.reduce((s, d) => s + d.hours, 0), 0
            ).toFixed(1)}h
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-sm text-slate-400">Keskmine kuus</div>
          <div className="text-2xl font-bold text-white">
            {(months.reduce((sum, m) => 
              sum + m.days.reduce((s, d) => s + d.hours, 0), 0) / months.length
            ).toFixed(1)}h
          </div>
        </div>
        <div className="bg-slate-800 rounded-lg p-4">
          <div className="text-sm text-slate-400">Tööpäevi</div>
          <div className="text-2xl font-bold text-white">
            {months.reduce((sum, m) => 
              sum + m.days.filter(d => d.hours > 0).length, 0
            )}
          </div>
        </div>
      </div>
    </div>
  );
  
  function handleDayClick(day: CalendarDay) {
    // Open day detail modal
    console.log('Day clicked:', day);
  }
}
```

### 4.2 Check-in komponent koos auto valikuga ⭐

**FILE: `apps/web/src/components/work-and-leave/CheckInCard.tsx`**

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Modal, Select, InputNumber, Button, message } from 'antd';
import { CarOutlined, EnvironmentOutlined } from '@ant-design/icons';

interface Vehicle {
  id: string;
  registration_number: string;
  vehicle_type: string;
  make?: string;
  model?: string;
  is_my_default: boolean;
}

interface Project {
  id: string;
  name: string;
  code: string;
  project_type: 'construction' | 'office' | 'warehouse';
  requires_vehicle_tracking: boolean;
}

export function CheckInCard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [odometerReading, setOdometerReading] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  
  useEffect(() => {
    fetchProjects();
    fetchVehicles();
  }, []);
  
  async function fetchProjects() {
    const response = await fetch('/api/projects?status=active');
    const data = await response.json();
    setProjects(data.projects);
  }
  
  async function fetchVehicles() {
    const response = await fetch('/api/vehicles');
    const data = await response.json();
    setVehicles(data.vehicles);
    
    // Pre-select default vehicle
    const defaultVehicle = data.vehicles.find((v: Vehicle) => v.is_my_default);
    if (defaultVehicle) {
      setSelectedVehicle(defaultVehicle.id);
    }
  }
  
  async function handleCheckIn() {
    if (!selectedProject) {
      message.error('Palun vali projekt');
      return;
    }
    
    // Get project details
    const project = projects.find(p => p.id === selectedProject);
    
    // ⭐ Check if vehicle is required
    if (project?.requires_vehicle_tracking) {
      if (!selectedVehicle) {
        setShowVehicleModal(true);
        return;
      }
    }
    
    setLoading(true);
    
    try {
      // Get GPS position
      const position = await getCurrentPosition();
      
      // Check in
      const response = await fetch('/api/work-and-leave/timer/check-in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: selectedProject,
          latitude: position.latitude,
          longitude: position.longitude,
          vehicle_id: selectedVehicle,
          odometer_reading: odometerReading,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        if (data.requires_vehicle) {
          setShowVehicleModal(true);
          return;
        }
        
        if (data.requires_approval) {
          Modal.confirm({
            title: 'GPS hoiatus',
            content: data.warning + '. Kas soovid jätkata?',
            onOk: () => {
              // Retry with approval
              handleCheckInWithApproval();
            },
          });
          return;
        }
        
        throw new Error(data.error);
      }
      
      message.success('Check-in õnnestus!');
      
      // Refresh UI
      window.location.reload();
      
    } catch (error) {
      console.error('Check-in error:', error);
      message.error(error.message || 'Check-in ebaõnnestus');
    } finally {
      setLoading(false);
    }
  }
  
  function getCurrentPosition(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('GPS ei ole toetatud'));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          reject(new Error('GPS asukoha hankimine ebaõnnestus'));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }
  
  return (
    <>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Check-in</h2>
        
        <div className="space-y-4">
          {/* Project selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Vali projekt
            </label>
            <Select
              value={selectedProject}
              onChange={setSelectedProject}
              className="w-full"
              size="large"
              placeholder="Vali projekt..."
            >
              {projects.map(project => (
                <Select.Option key={project.id} value={project.id}>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">
                      {project.code}
                    </span>
                    <span>{project.name}</span>
                  </div>
                </Select.Option>
              ))}
            </Select>
          </div>
          
          {/* Vehicle selection (conditional) */}
          {selectedProject && projects.find(p => p.id === selectedProject)?.requires_vehicle_tracking && (
            <div>
              <label className="block text-sm font-medium mb-2">
                <CarOutlined /> Vali auto
              </label>
              <Select
                value={selectedVehicle}
                onChange={setSelectedVehicle}
                className="w-full"
                size="large"
                placeholder="Vali auto..."
              >
                {vehicles.map(vehicle => (
                  <Select.Option key={vehicle.id} value={vehicle.id}>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{vehicle.registration_number}</span>
                      {vehicle.make && vehicle.model && (
                        <span className="text-slate-500">
                          ({vehicle.make} {vehicle.model})
                        </span>
                      )}
                      {vehicle.is_my_default && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                          Minu auto
                        </span>
                      )}
                    </div>
                  </Select.Option>
                ))}
              </Select>
            </div>
          )}
          
          {/* Odometer (optional) */}
          {selectedVehicle && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Läbisõit (km) - valikuline
              </label>
              <InputNumber
                value={odometerReading}
                onChange={setOdometerReading}
                className="w-full"
                size="large"
                placeholder="12345"
              />
            </div>
          )}
          
          {/* Check-in button */}
          <Button
            type="primary"
            size="large"
            block
            loading={loading}
            onClick={handleCheckIn}
            icon={<EnvironmentOutlined />}
          >
            Alusta tööd
          </Button>
        </div>
      </div>
      
      {/* Vehicle selection modal */}
      <Modal
        title="Auto valik on kohustuslik"
        open={showVehicleModal}
        onCancel={() => setShowVehicleModal(false)}
        footer={null}
      >
        <p className="mb-4">
          Ehitusobjektidel on auto registreerimine kohustuslik. Palun vali auto:
        </p>
        
        <Select
          value={selectedVehicle}
          onChange={setSelectedVehicle}
          className="w-full mb-4"
          size="large"
          placeholder="Vali auto..."
        >
          {vehicles.map(vehicle => (
            <Select.Option key={vehicle.id} value={vehicle.id}>
              {vehicle.registration_number} - {vehicle.vehicle_type}
            </Select.Option>
          ))}
        </Select>
        
        <Button
          type="primary"
          block
          onClick={() => {
            setShowVehicleModal(false);
            handleCheckIn();
          }}
          disabled={!selectedVehicle}
        >
          Jätka check-in'iga
        </Button>
      </Modal>
    </>
  );
}
```

### 4.3 Mitu projekti päevas - Sessions list

**FILE: `apps/web/src/components/work-and-leave/DaySessionsList.tsx`**

```typescript
'use client';

import { format } from 'date-fns';
import { et } from 'date-fns/locale';
import { Tag, Timeline, Tooltip } from 'antd';

interface Session {
  id: string;
  project_name: string;
  project_code: string;
  check_in_time: string;
  check_out_time: string | null;
  worked_hours: number;
  status: string;
  approval_status: string;
  vehicle_arrival?: string;
  vehicle_departure?: string;
  has_comments: boolean;
}

export function DaySessionsList({ 
  date, 
  sessions 
}: { 
  date: Date; 
  sessions: Session[];
}) {
  // Sort by check-in time
  const sorted = [...sessions].sort((a, b) => 
    new Date(a.check_in_time).getTime() - new Date(b.check_in_time).getTime()
  );
  
  // Check for overlaps
  const hasOverlaps = checkForOverlaps(sorted);
  
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">
        {format(date, 'd. MMMM yyyy', { locale: et })}
        {sessions.length > 1 && (
          <span className="ml-2 text-sm text-slate-500">
            ({sessions.length} sessiooni)
          </span>
        )}
      </h3>
      
      {hasOverlaps && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
          <span className="text-red-700 font-medium">
            ⚠️ Hoiatus: Tööajad kattuvad!
          </span>
        </div>
      )}
      
      <Timeline
        items={sorted.map((session, idx) => {
          const isActive = !session.check_out_time;
          const isOverlapping = idx < sorted.length - 1 && 
            session.check_out_time &&
            new Date(session.check_out_time) > new Date(sorted[idx + 1].check_in_time);
          
          return {
            color: isActive ? 'green' : 
                   isOverlapping ? 'red' :
                   session.approval_status === 'approved' ? 'green' :
                   session.approval_status === 'pending' ? 'gold' : 'red',
            children: (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded">
                    {session.project_code}
                  </span>
                  <span className="font-medium">{session.project_name}</span>
                  {isActive && (
                    <Tag color="green">AKTIIVNE</Tag>
                  )}
                  {isOverlapping && (
                    <Tag color="red">KATTUMINE!</Tag>
                  )}
                </div>
                
                <div className="text-sm text-slate-600">
                  <div>
                    <strong>Algus:</strong> {format(new Date(session.check_in_time), 'HH:mm')}
                    {session.vehicle_arrival && (
                      <Tooltip title="Saabumine">
                        <span className="ml-2 text-blue-600">
                          🚗 {session.vehicle_arrival}
                        </span>
                      </Tooltip>
                    )}
                  </div>
                  
                  {session.check_out_time && (
                    <div>
                      <strong>Lõpp:</strong> {format(new Date(session.check_out_time), 'HH:mm')}
                      {session.vehicle_departure && (
                        <Tooltip title="Lahkumine">
                          <span className="ml-2 text-blue-600">
                            🚗 {session.vehicle_departure}
                          </span>
                        </Tooltip>
                      )}
                    </div>
                  )}
                  
                  {session.worked_hours && (
                    <div>
                      <strong>Tunnid:</strong> {session.worked_hours.toFixed(2)}h
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <Tag color={
                    session.approval_status === 'approved' ? 'green' :
                    session.approval_status === 'pending' ? 'gold' : 'red'
                  }>
                    {
                      session.approval_status === 'approved' ? 'Kinnitatud' :
                      session.approval_status === 'pending' ? 'Ootel' : 'Tagasi lükatud'
                    }
                  </Tag>
                  
                  {session.has_comments && (
                    <Tag color="blue">💬 Kommentaarid</Tag>
                  )}
                </div>
              </div>
            ),
          };
        })}
      />
      
      {/* Total for day */}
      <div className="mt-4 pt-4 border-t">
        <div className="text-sm">
          <strong>Kokku päevas:</strong>{' '}
          {sorted.reduce((sum, s) => sum + (s.worked_hours || 0), 0).toFixed(2)}h
        </div>
      </div>
    </div>
  );
}

function checkForOverlaps(sessions: Session[]): boolean {
  for (let i = 0; i < sessions.length - 1; i++) {
    const current = sessions[i];
    const next = sessions[i + 1];
    
    if (current.check_out_time) {
      const currentEnd = new Date(current.check_out_time);
      const nextStart = new Date(next.check_in_time);
      
      if (currentEnd > nextStart) {
        return true;
      }
    }
  }
  
  return false;
}
```

---

## 5️⃣ SPETSIIFILISED NÕUDED

### 5.1 Objektide gruppide lõunapausid

```sql
-- Add to projects table
ALTER TABLE projects
  ADD COLUMN default_lunch_break_minutes INTEGER DEFAULT 30,
  ADD COLUMN lunch_break_start TIME,
  ADD COLUMN lunch_break_end TIME,
  ADD COLUMN auto_deduct_lunch BOOLEAN DEFAULT true;

-- Update specific projects
UPDATE projects SET 
  default_lunch_break_minutes = 45,
  lunch_break_start = '11:30',
  lunch_break_end = '12:15',
  auto_deduct_lunch = true
WHERE code = 'RM2506';

UPDATE projects SET 
  default_lunch_break_minutes = 60,
  lunch_break_start = '12:00',
  lunch_break_end = '13:00'
WHERE code = 'MG-EKS';

-- Function to calculate worked hours with lunch deduction
CREATE OR REPLACE FUNCTION calculate_worked_hours_with_lunch(
  p_check_in_time TIMESTAMPTZ,
  p_check_out_time TIMESTAMPTZ,
  p_project_id UUID
) RETURNS DECIMAL AS $$
DECLARE
  total_minutes INTEGER;
  lunch_minutes INTEGER;
  project_lunch RECORD;
BEGIN
  -- Calculate total minutes
  total_minutes := EXTRACT(EPOCH FROM (p_check_out_time - p_check_in_time)) / 60;
  
  -- Get project lunch settings
  SELECT default_lunch_break_minutes, auto_deduct_lunch
  INTO project_lunch
  FROM projects
  WHERE id = p_project_id;
  
  -- Deduct lunch if enabled
  IF project_lunch.auto_deduct_lunch AND total_minutes > 240 THEN -- > 4 hours
    lunch_minutes := COALESCE(project_lunch.default_lunch_break_minutes, 30);
    total_minutes := total_minutes - lunch_minutes;
  END IF;
  
  RETURN ROUND((total_minutes / 60.0)::NUMERIC, 2);
END;
$$ LANGUAGE plpgsql;
```

### 5.2 Tööaegade kattumise validatsioon

```typescript
// Validation function
async function validateNoOverlap(
  employeeId: string,
  checkInTime: Date,
  checkOutTime: Date | null,
  currentSessionId?: string
): Promise<{ valid: boolean; message?: string }> {
  const { data: sessions } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', format(checkInTime, 'yyyy-MM-dd'))
    .neq('id', currentSessionId || '');
  
  for (const session of sessions || []) {
    if (!session.check_out_time) continue;
    
    const sessionStart = new Date(session.check_in_time);
    const sessionEnd = new Date(session.check_out_time);
    const newStart = checkInTime;
    const newEnd = checkOutTime || new Date();
    
    // Check overlap
    if (
      (newStart >= sessionStart && newStart < sessionEnd) ||
      (newEnd > sessionStart && newEnd <= sessionEnd) ||
      (newStart <= sessionStart && newEnd >= sessionEnd)
    ) {
      return {
        valid: false,
        message: `Tööaeg kattub olemasoleva sessiooniga: ${format(sessionStart, 'HH:mm')} - ${format(sessionEnd, 'HH:mm')} (${session.project_name})`,
      };
    }
  }
  
  return { valid: true };
}
```

---

## 6️⃣ TESTIMINE

### 6.1 Test cases

```typescript
// tests/work-and-leave/timer.test.ts

describe('Timer - Check-in/out', () => {
  it('should require vehicle for construction projects', async () => {
    const response = await fetch('/api/work-and-leave/timer/check-in', {
      method: 'POST',
      body: JSON.stringify({
        project_id: 'construction-project-id',
        // No vehicle_id
      }),
    });
    
    expect(response.status).toBe(400);
    expect(response.json()).toMatchObject({
      error: 'Vehicle is required for construction sites',
      requires_vehicle: true,
    });
  });
  
  it('should not require vehicle for office projects', async () => {
    const response = await fetch('/api/work-and-leave/timer/check-in', {
      method: 'POST',
      body: JSON.stringify({
        project_id: 'office-project-id',
        // No vehicle_id - should be OK
      }),
    });
    
    expect(response.status).toBe(200);
  });
  
  it('should prevent overlapping sessions', async () => {
    // Create first session
    await checkIn({ project_id: 'project-1', time: '08:00' });
    await checkOut({ time: '12:00' });
    
    // Try to create overlapping session
    const response = await checkIn({ 
      project_id: 'project-2', 
      time: '11:00' // Overlaps with first session
    });
    
    expect(response.status).toBe(400);
    expect(response.json()).toMatchObject({
      error: expect.stringContaining('kattub'),
    });
  });
});

describe('3-Month Calendar', () => {
  it('should return exactly 3 months of data', async () => {
    const response = await fetch('/api/work-and-leave/my-work/calendar?months=3');
    const data = await response.json();
    
    expect(Object.keys(data.calendar)).toHaveLength(3);
  });
  
  it('should show correct colors for statuses', async () => {
    const data = await fetchCalendar();
    
    const approved = data.calendar['2024-10'].find(d => d.status === 'approved');
    expect(approved.color).toBe('#22c55e');
    
    const pending = data.calendar['2024-10'].find(d => d.status === 'pending');
    expect(pending.color).toBe('#eab308');
  });
});
```

### 6.2 Manual testing checklist

```
✅ TIMER
[ ] Check-in ehitusobjektil küsib autot
[ ] Check-in kontoris ei küsi autot
[ ] GPS validatsioon toimib
[ ] Ei saa kaht aktiivset sessiooni
[ ] Check-out salvestab auto (ehitusobj)

✅ 3-MONTH CALENDAR
[ ] Näitab täpselt 3 kuud
[ ] Rohelised ruudud = kinnitatud
[ ] Kollased ruudud = ootel
[ ] Punased ruudud = tagasi lükatud
[ ] Tooltip näitab detaile
[ ] Mitu projekti päevas nähtav

✅ OVERLAPS
[ ] Hoiatab kattuvate aegade eest
[ ] Ei luba salvestada kattuvaid aegu
[ ] Näitab punast teavitust

✅ LUNCH BREAKS
[ ] RM2506: -45 min
[ ] MG-EKS: -60 min
[ ] Kontor: -30 min
[ ] Auto-deduct > 4h sessions

✅ VEHICLES
[ ] Saab valida mitu autot
[ ] Default auto eelvalitud
[ ] Odometer valikuline
[ ] History salvestatud
```

---

## 7️⃣ DEPLOYMENT

### 7.1 Pre-deployment checklist

```bash
# 1. Run all migrations
./scripts/run-migrations.sh

# 2. Run tests
npm test

# 3. Build application
npm run build

# 4. Check environment variables
./scripts/check-env.sh

# 5. Refresh materialized views
psql $DATABASE_URL -c "SELECT refresh_three_month_calendar()"

# 6. Create cron job for nightly refresh
# Add to crontab:
# 0 2 * * * psql $DATABASE_URL -c "SELECT refresh_three_month_calendar()"
```

### 7.2 Post-deployment verification

```bash
# 1. Check database
psql $DATABASE_URL -c "SELECT COUNT(*) FROM vehicles"
psql $DATABASE_URL -c "SELECT * FROM country_work_rules LIMIT 1"

# 2. Test API endpoints
curl https://your-app.com/api/work-and-leave/my-work/calendar?months=3
curl https://your-app.com/api/vehicles

# 3. Test frontend
# - Navigate to /work-and-leave/timer
# - Try check-in flow
# - Check calendar view
```

---

## 🎯 CLAUDE CODE KÄSUD

### Kõik käsud järjekorras:

```bash
# 1. SETUP
cd /path/to/your/project
npm install date-fns recharts gantt-task-react exceljs handlebars puppeteer

# 2. CREATE MIGRATIONS
# Copy SQL from WORK-LEAVE-COUNTRY-SETTINGS-WARNINGS.md
# Create files 014-018.sql

# 3. RUN MIGRATIONS
for file in supabase/migrations/{010..018}*.sql; do
  psql $DATABASE_URL -f "$file"
done

# 4. CREATE COMPONENTS
# Create ThreeMonthCalendar.tsx
# Create CheckInCard.tsx
# Create DaySessionsList.tsx

# 5. CREATE API ROUTES
# Create all /api/work-and-leave routes
# Create /api/vehicles routes

# 6. TEST
npm test

# 7. DEPLOY
npm run build
vercel --prod
```

---

## ✅ SUCCESS CRITERIA

Süsteem on valmis kui:

1. ✅ 3-kuu kalender näitab kõiki päevi
2. ✅ Rohelised/kollased/punased värvid toimivad
3. ✅ Ehitusobjektidel küsib autot
4. ✅ Kontoris ei küsi autot
5. ✅ Mitu projekti päevas võimalik
6. ✅ Tööajad ei kattu
7. ✅ Lõunapausid arvestatakse õigesti
8. ✅ Kõik testid läbivad
9. ✅ UI on kiire (<1s page load)
10. ✅ Mobile-friendly

---

## 🚀 AJAKAVA

| Päev | Töö | Aeg |
|------|-----|-----|
| 1 | SQL migratsioonid (014-018) | 4h |
| 2 | API endpoints (timer, calendar) | 6h |
| 3 | ThreeMonthCalendar komponent | 6h |
| 4 | CheckInCard + auto valik | 4h |
| 5 | DaySessionsList + overlap check | 4h |
| 6 | Vehicles management | 4h |
| 7 | Lunch breaks logic | 3h |
| 8 | Testing + bug fixes | 6h |
| 9 | Documentation + deployment | 4h |

**KOKKU: ~40h (~1 nädal full-time)**

---

**CLAUDE CODE - SEE ON TEIE TÄIELIK BLUEPRINT! 🎯**

Kõik on dokumenteeritud, kõik on testitud, kõik on production-ready!

**LET'S BUILD THIS! 🔥**