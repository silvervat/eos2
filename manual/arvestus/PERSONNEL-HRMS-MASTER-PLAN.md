# 🎯 PERSONALI TÖÖAJA JA PUHKUSE ARVESTUSE SÜSTEEM
## Frappe HRMS Tasemel Professionaalne Lahendus

**Projekt:** Rivest EOS2 Personnel Module  
**Versioon:** 1.0.0  
**Kuupäev:** 04.12.2024  
**Autor:** Silver / Claude Code  

---

## 📋 SISUKORD

1. [Executive Summary](#executive-summary)
2. [Arhitektuuri Ülevaade](#arhitektuur)
3. [Andmebaasi Skeem](#andmebaas)
4. [API Endpoints](#api-endpoints)
5. [Frontend Komponendid](#frontend)
6. [Mobiilirakendus](#mobile)
7. [Implementatsiooni Sammud](#implementation)
8. [Testimine & QA](#testing)
9. [Deployment](#deployment)

---

## 🎯 1. EXECUTIVE SUMMARY

### Eesmärk
Luua täisfunktsionaalne personali halduse moodul GPS-põhise tööaja arvestuse ja puhkuste haldusega, mis vastab Frappe HRMS tasemele.

### Põhifunktsioonid
✅ **Tööaja Arvestus**
- GPS check-in/check-out
- Automaatne asukoha valideerimine
- Geofencing töökohajärgsetele asukohtadele
- Tööaja raportid ja statistika
- Õigetest kohtadest registreerumine

✅ **Puhkuste Haldus**
- Puhkuse taotlused
- Kinnitamise workflow (Manager → HR)
- Puhkuse saldod ja liigid
- Kalendrivaade
- Automaatsed teavitused

✅ **Töötajate Haldus**
- Põhjalik töötaja profiil
- Osakondade struktuur
- Rollid ja load
- Shift management
- Ametikohad

✅ **Raportid & Analüütika**
- Tööaja raportid
- Puhkuste kokkuvõtted
- GPS asukohad ja marsruudid
- Ekspordid (PDF, Excel)
- Dashboard statistika

---

## 🏗️ 2. ARHITEKTUURI ÜLEVAADE

### Tech Stack

```
┌─────────────────────────────────────────────┐
│           FRONTEND (React/TypeScript)       │
│  ┌─────────────┐  ┌──────────────────────┐ │
│  │  Web App    │  │   Mobile PWA/Native  │ │
│  │  Next.js    │  │   React Native       │ │
│  └─────────────┘  └──────────────────────┘ │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│              API LAYER                      │
│  Next.js API Routes + Supabase Functions   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │Attendance│  │  Leaves  │  │Employees │ │
│  └──────────┘  └──────────┘  └──────────┘ │
└─────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────┐
│          BACKEND (Supabase)                 │
│  ┌──────────────┐  ┌─────────────────────┐ │
│  │ PostgreSQL   │  │  Real-time Subs     │ │
│  │ + PostGIS    │  │  Push Notifications │ │
│  └──────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────┘
```

### Põhimõtted
- **Multi-tenant:** Iga ettevõte oma andmed
- **Real-time:** Kohesed uuendused
- **Offline-first:** Mobile töötab ilma internetita
- **Security-first:** Row Level Security (RLS)
- **Audit Trail:** Kõik muudatused logitakse

---

## 💾 3. ANDMEBAASI SKEEM

### 3.1 Core Tables

```sql
-- ============================================
-- PERSONNEL MODULE TABLES
-- ============================================

-- TÖÖTAJAD (Employees)
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Põhiandmed
  employee_code TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  email TEXT NOT NULL,
  phone TEXT,
  personal_id TEXT, -- Isikukood
  
  -- Töökorraldus
  department_id UUID REFERENCES departments(id),
  position_id UUID REFERENCES positions(id),
  manager_id UUID REFERENCES employees(id),
  employment_type TEXT DEFAULT 'full_time', -- full_time, part_time, contract
  employment_status TEXT DEFAULT 'active', -- active, on_leave, terminated
  
  -- Tööaeg
  shift_id UUID REFERENCES shifts(id),
  work_hours_per_day DECIMAL(4,2) DEFAULT 8.0,
  work_days_per_week INTEGER DEFAULT 5,
  
  -- Puhkused
  annual_leave_days DECIMAL(5,2) DEFAULT 28.0,
  leave_balance DECIMAL(5,2) DEFAULT 0.0,
  
  -- Kuupäevad
  hire_date DATE NOT NULL,
  termination_date DATE,
  date_of_birth DATE,
  
  -- Kontakt & Aadress
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Estonia',
  
  -- Pank
  bank_account TEXT,
  bank_name TEXT,
  
  -- Foto
  avatar_url TEXT,
  
  -- Metaandmed
  metadata JSONB DEFAULT '{}',
  notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  updated_by UUID REFERENCES user_profiles(id),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(tenant_id, employee_code)
);

CREATE INDEX idx_employees_tenant ON employees(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_department ON employees(department_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_manager ON employees(manager_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_employees_status ON employees(employment_status) WHERE deleted_at IS NULL;

-- OSAKONNAD (Departments)
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES departments(id), -- Hierarchical structure
  
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  head_id UUID REFERENCES employees(id), -- Department head
  
  -- Cost center
  cost_center_code TEXT,
  budget_code TEXT,
  
  -- Metaandmed
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(tenant_id, code)
);

CREATE INDEX idx_departments_tenant ON departments(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_departments_parent ON departments(parent_id) WHERE deleted_at IS NULL;

-- AMETIKOHAD (Positions)
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  level INTEGER, -- 1-10 hierarchy level
  
  -- Salary range
  min_salary DECIMAL(10,2),
  max_salary DECIMAL(10,2),
  currency TEXT DEFAULT 'EUR',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(tenant_id, code)
);

-- SHIFTS (Vahetused)
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  
  -- Work hours
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_minutes INTEGER DEFAULT 0,
  
  -- Work days (JSON array: [1,2,3,4,5] for Mon-Fri)
  work_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
  
  -- Geofencing
  is_geofenced BOOLEAN DEFAULT false,
  
  -- Flexible
  is_flexible BOOLEAN DEFAULT false,
  grace_period_minutes INTEGER DEFAULT 15,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(tenant_id, code)
);

-- TÖÖKOHTADE ASUKOHAD (Work Locations)
CREATE TABLE work_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  address TEXT,
  
  -- GPS koordinaadid (PostGIS)
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  location GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
  ) STORED,
  
  -- Geofence radius (meetrites)
  radius_meters INTEGER DEFAULT 100,
  
  -- Töötingimused
  is_active BOOLEAN DEFAULT true,
  requires_photo BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(tenant_id, code)
);

CREATE INDEX idx_work_locations_tenant ON work_locations(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_work_locations_gps ON work_locations USING GIST(location);

-- TÖÖAJA REGISTREERINGUD (Attendance / Check-ins)
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES shifts(id),
  work_location_id UUID REFERENCES work_locations(id),
  
  -- Tüüp
  type TEXT NOT NULL, -- check_in, check_out, break_start, break_end
  
  -- Aeg
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  date DATE GENERATED ALWAYS AS (timestamp::DATE) STORED,
  
  -- GPS andmed
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  location GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
    CASE 
      WHEN latitude IS NOT NULL AND longitude IS NOT NULL 
      THEN ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
      ELSE NULL
    END
  ) STORED,
  gps_accuracy DECIMAL(6,2), -- meetrites
  
  -- Valideerimine
  is_valid BOOLEAN DEFAULT true,
  is_within_geofence BOOLEAN,
  distance_from_location DECIMAL(8,2), -- meetrites
  
  -- Foto (nt näotuvastus)
  photo_url TEXT,
  
  -- Device info
  device_id TEXT,
  device_model TEXT,
  app_version TEXT,
  ip_address INET,
  user_agent TEXT,
  
  -- Offline sync
  synced_at TIMESTAMPTZ,
  offline_recorded_at TIMESTAMPTZ,
  
  -- Notes
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attendance_tenant ON attendance(tenant_id);
CREATE INDEX idx_attendance_employee ON attendance(employee_id);
CREATE INDEX idx_attendance_date ON attendance(date DESC);
CREATE INDEX idx_attendance_timestamp ON attendance(timestamp DESC);
CREATE INDEX idx_attendance_type ON attendance(type);
CREATE INDEX idx_attendance_location ON attendance USING GIST(location);

-- TÖÖAJA KOKKUVÕTTED (Daily summaries)
CREATE TABLE attendance_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  date DATE NOT NULL,
  
  -- Ajad
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  total_hours DECIMAL(5,2),
  break_hours DECIMAL(5,2),
  overtime_hours DECIMAL(5,2),
  
  -- Status
  status TEXT, -- present, absent, late, half_day, on_leave
  is_late BOOLEAN DEFAULT false,
  late_minutes INTEGER,
  is_early_out BOOLEAN DEFAULT false,
  early_out_minutes INTEGER,
  
  -- Approval
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  
  -- Metaandmed
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, employee_id, date)
);

CREATE INDEX idx_summaries_tenant ON attendance_summaries(tenant_id);
CREATE INDEX idx_summaries_employee ON attendance_summaries(employee_id);
CREATE INDEX idx_summaries_date ON attendance_summaries(date DESC);
CREATE INDEX idx_summaries_status ON attendance_summaries(status);

-- PUHKUSE LIIGID (Leave Types)
CREATE TABLE leave_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  
  -- Piirangud
  max_days_per_year DECIMAL(5,2),
  requires_approval BOOLEAN DEFAULT true,
  is_paid BOOLEAN DEFAULT true,
  affects_balance BOOLEAN DEFAULT true,
  
  -- Värvus UI jaoks
  color TEXT DEFAULT '#3B82F6',
  icon TEXT,
  
  -- Järjekord
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(tenant_id, code)
);

-- Vaikimisi puhkuse liigid
INSERT INTO leave_types (tenant_id, name, code, max_days_per_year, is_paid, color) VALUES
  (NULL, 'Annual Leave', 'ANNUAL', 28, true, '#3B82F6'),
  (NULL, 'Sick Leave', 'SICK', 10, true, '#EF4444'),
  (NULL, 'Unpaid Leave', 'UNPAID', NULL, false, '#6B7280'),
  (NULL, 'Maternity Leave', 'MATERNITY', 140, true, '#EC4899'),
  (NULL, 'Paternity Leave', 'PATERNITY', 10, true, '#8B5CF6'),
  (NULL, 'Study Leave', 'STUDY', 30, true, '#F59E0B');

-- PUHKUSE TAOTLUSED (Leave Requests)
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id),
  
  -- Kuupäevad
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days DECIMAL(5,2) NOT NULL,
  
  -- Half day options
  is_half_day BOOLEAN DEFAULT false,
  half_day_type TEXT, -- first_half, second_half
  
  -- Põhjus
  reason TEXT,
  attachment_urls TEXT[],
  
  -- Workflow
  status TEXT DEFAULT 'pending', -- pending, approved, rejected, cancelled
  
  -- Manager approval
  manager_id UUID REFERENCES employees(id),
  manager_approved_at TIMESTAMPTZ,
  manager_notes TEXT,
  
  -- HR approval (if needed)
  hr_id UUID REFERENCES employees(id),
  hr_approved_at TIMESTAMPTZ,
  hr_notes TEXT,
  
  -- Rejection
  rejected_by UUID REFERENCES employees(id),
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Cancel
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leave_requests_tenant ON leave_requests(tenant_id);
CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX idx_leave_requests_manager ON leave_requests(manager_id) WHERE status = 'pending';

-- PUHKUSE SALDOD (Leave Balances)
CREATE TABLE leave_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id),
  
  year INTEGER NOT NULL,
  
  -- Saldod
  opening_balance DECIMAL(5,2) DEFAULT 0,
  earned DECIMAL(5,2) DEFAULT 0,
  taken DECIMAL(5,2) DEFAULT 0,
  pending DECIMAL(5,2) DEFAULT 0,
  closing_balance DECIMAL(5,2) GENERATED ALWAYS AS (
    opening_balance + earned - taken
  ) STORED,
  
  -- Metaandmed
  last_calculated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, employee_id, leave_type_id, year)
);

CREATE INDEX idx_leave_balances_tenant ON leave_balances(tenant_id);
CREATE INDEX idx_leave_balances_employee ON leave_balances(employee_id);
CREATE INDEX idx_leave_balances_year ON leave_balances(year);

-- PUHKUSE KALENDER (Leave Calendar - materialized view)
CREATE MATERIALIZED VIEW leave_calendar AS
SELECT 
  lr.id,
  lr.tenant_id,
  lr.employee_id,
  e.full_name as employee_name,
  e.department_id,
  d.name as department_name,
  lr.leave_type_id,
  lt.name as leave_type,
  lt.color as leave_color,
  lr.start_date,
  lr.end_date,
  lr.total_days,
  lr.status,
  lr.reason
FROM leave_requests lr
JOIN employees e ON lr.employee_id = e.id
LEFT JOIN departments d ON e.department_id = d.id
JOIN leave_types lt ON lr.leave_type_id = lt.id
WHERE lr.status IN ('approved', 'pending');

CREATE INDEX idx_leave_calendar_tenant ON leave_calendar(tenant_id);
CREATE INDEX idx_leave_calendar_dates ON leave_calendar(start_date, end_date);
CREATE INDEX idx_leave_calendar_department ON leave_calendar(department_id);

-- TEAVITUSED (Notifications)
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL, -- leave_request, leave_approved, leave_rejected, etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Related entities
  entity_type TEXT, -- leave_request, attendance, etc.
  entity_id UUID,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Actions
  action_url TEXT,
  action_label TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_created ON notifications(created_at DESC);
```

### 3.2 Functions & Triggers

```sql
-- ============================================
-- GPS DISTANCE CALCULATION
-- ============================================

CREATE OR REPLACE FUNCTION calculate_gps_distance(
  lat1 DECIMAL, 
  lon1 DECIMAL,
  lat2 DECIMAL,
  lon2 DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
  distance DECIMAL;
BEGIN
  -- Haversine formula meetrites
  distance := ST_Distance(
    ST_SetSRID(ST_MakePoint(lon1, lat1), 4326)::geography,
    ST_SetSRID(ST_MakePoint(lon2, lat2), 4326)::geography
  );
  RETURN distance;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- VALIDATE ATTENDANCE CHECK-IN
-- ============================================

CREATE OR REPLACE FUNCTION validate_attendance()
RETURNS TRIGGER AS $$
DECLARE
  location_record RECORD;
  distance DECIMAL;
BEGIN
  -- Get work location if specified
  IF NEW.work_location_id IS NOT NULL THEN
    SELECT * INTO location_record 
    FROM work_locations 
    WHERE id = NEW.work_location_id;
    
    -- Calculate distance
    IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
      distance := calculate_gps_distance(
        NEW.latitude, NEW.longitude,
        location_record.latitude, location_record.longitude
      );
      
      NEW.distance_from_location := distance;
      NEW.is_within_geofence := (distance <= location_record.radius_meters);
      NEW.is_valid := NEW.is_within_geofence;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_attendance_trigger
  BEFORE INSERT OR UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION validate_attendance();

-- ============================================
-- UPDATE ATTENDANCE SUMMARY
-- ============================================

CREATE OR REPLACE FUNCTION update_attendance_summary()
RETURNS TRIGGER AS $$
DECLARE
  summary_date DATE;
  check_in_time TIMESTAMPTZ;
  check_out_time TIMESTAMPTZ;
  work_hours DECIMAL;
BEGIN
  summary_date := NEW.date;
  
  -- Get check-in and check-out times for the day
  SELECT MIN(timestamp), MAX(timestamp) INTO check_in_time, check_out_time
  FROM attendance
  WHERE employee_id = NEW.employee_id 
    AND date = summary_date
    AND type IN ('check_in', 'check_out')
    AND is_valid = true;
  
  -- Calculate work hours
  IF check_in_time IS NOT NULL AND check_out_time IS NOT NULL THEN
    work_hours := EXTRACT(EPOCH FROM (check_out_time - check_in_time)) / 3600;
  END IF;
  
  -- Insert or update summary
  INSERT INTO attendance_summaries (
    tenant_id,
    employee_id,
    date,
    check_in_time,
    check_out_time,
    total_hours,
    status
  ) VALUES (
    NEW.tenant_id,
    NEW.employee_id,
    summary_date,
    check_in_time,
    check_out_time,
    work_hours,
    CASE 
      WHEN check_in_time IS NULL THEN 'absent'
      WHEN work_hours < 4 THEN 'half_day'
      ELSE 'present'
    END
  )
  ON CONFLICT (tenant_id, employee_id, date) 
  DO UPDATE SET
    check_in_time = EXCLUDED.check_in_time,
    check_out_time = EXCLUDED.check_out_time,
    total_hours = EXCLUDED.total_hours,
    status = EXCLUDED.status,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_summary_trigger
  AFTER INSERT OR UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION update_attendance_summary();

-- ============================================
-- UPDATE LEAVE BALANCE
-- ============================================

CREATE OR REPLACE FUNCTION update_leave_balance()
RETURNS TRIGGER AS $$
DECLARE
  balance_year INTEGER;
BEGIN
  balance_year := EXTRACT(YEAR FROM NEW.start_date);
  
  -- Update pending balance
  IF NEW.status = 'pending' THEN
    UPDATE leave_balances
    SET pending = pending + NEW.total_days
    WHERE employee_id = NEW.employee_id
      AND leave_type_id = NEW.leave_type_id
      AND year = balance_year;
  
  -- Update taken balance when approved
  ELSIF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    UPDATE leave_balances
    SET taken = taken + NEW.total_days,
        pending = pending - NEW.total_days
    WHERE employee_id = NEW.employee_id
      AND leave_type_id = NEW.leave_type_id
      AND year = balance_year;
  
  -- Restore balance when rejected
  ELSIF NEW.status = 'rejected' AND OLD.status = 'pending' THEN
    UPDATE leave_balances
    SET pending = pending - NEW.total_days
    WHERE employee_id = NEW.employee_id
      AND leave_type_id = NEW.leave_type_id
      AND year = balance_year;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_leave_balance_trigger
  AFTER UPDATE ON leave_requests
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION update_leave_balance();

-- ============================================
-- SEND NOTIFICATION
-- ============================================

CREATE OR REPLACE FUNCTION send_leave_notification()
RETURNS TRIGGER AS $$
DECLARE
  recipient_id UUID;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- New leave request -> notify manager
  IF TG_OP = 'INSERT' THEN
    SELECT manager_id INTO recipient_id
    FROM employees
    WHERE id = NEW.employee_id;
    
    INSERT INTO notifications (
      tenant_id, user_id, type, title, message, 
      entity_type, entity_id, action_url
    ) VALUES (
      NEW.tenant_id,
      recipient_id,
      'leave_request',
      'New Leave Request',
      'New leave request from ' || (SELECT full_name FROM employees WHERE id = NEW.employee_id),
      'leave_request',
      NEW.id,
      '/personnel/leave-requests/' || NEW.id
    );
  
  -- Status changed -> notify employee
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO notifications (
      tenant_id, user_id, type, title, message,
      entity_type, entity_id
    ) VALUES (
      NEW.tenant_id,
      (SELECT auth_user_id FROM user_profiles WHERE id = NEW.employee_id),
      'leave_' || NEW.status,
      'Leave Request ' || UPPER(NEW.status),
      'Your leave request has been ' || NEW.status,
      'leave_request',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER leave_notification_trigger
  AFTER INSERT OR UPDATE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION send_leave_notification();
```

### 3.3 Row Level Security (RLS)

```sql
-- ============================================
-- RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;

-- Employees: See own tenant's employees
CREATE POLICY employees_tenant_policy ON employees
  FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id')::UUID);

-- Employees: Managers can see their team
CREATE POLICY employees_manager_policy ON employees
  FOR SELECT
  USING (
    manager_id = current_setting('app.user_id')::UUID
    OR id = current_setting('app.user_id')::UUID
  );

-- Attendance: Employees see own records
CREATE POLICY attendance_own_policy ON attendance
  FOR ALL
  USING (employee_id = current_setting('app.user_id')::UUID);

-- Attendance: Managers see team records
CREATE POLICY attendance_manager_policy ON attendance
  FOR SELECT
  USING (
    employee_id IN (
      SELECT id FROM employees 
      WHERE manager_id = current_setting('app.user_id')::UUID
    )
  );

-- Leave Requests: Employees manage own
CREATE POLICY leave_requests_own_policy ON leave_requests
  FOR ALL
  USING (employee_id = current_setting('app.user_id')::UUID);

-- Leave Requests: Managers approve team requests
CREATE POLICY leave_requests_manager_policy ON leave_requests
  FOR UPDATE
  USING (
    manager_id = current_setting('app.user_id')::UUID
    AND status = 'pending'
  );
```

---

## 🔌 4. API ENDPOINTS

### 4.1 Attendance Endpoints

```typescript
// File: apps/web/src/app/api/personnel/attendance/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/personnel/attendance
// Get attendance records with filters
export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  
  const employeeId = searchParams.get('employeeId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const type = searchParams.get('type');
  
  let query = supabase
    .from('attendance')
    .select(`
      *,
      employee:employees(id, full_name, employee_code),
      work_location:work_locations(id, name)
    `)
    .order('timestamp', { ascending: false });
  
  if (employeeId) query = query.eq('employee_id', employeeId);
  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);
  if (type) query = query.eq('type', type);
  
  const { data, error } = await query;
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  return NextResponse.json(data);
}

// POST /api/personnel/attendance
// Create check-in/check-out record
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();
  
  const {
    employeeId,
    type, // check_in, check_out
    latitude,
    longitude,
    workLocationId,
    photo,
    notes,
  } = body;
  
  // Validate required fields
  if (!employeeId || !type) {
    return NextResponse.json(
      { error: 'Employee ID and type are required' },
      { status: 400 }
    );
  }
  
  // Get device info
  const deviceInfo = {
    ip_address: request.headers.get('x-forwarded-for') || request.ip,
    user_agent: request.headers.get('user-agent'),
  };
  
  // Create attendance record
  const { data, error } = await supabase
    .from('attendance')
    .insert({
      employee_id: employeeId,
      type,
      latitude,
      longitude,
      work_location_id: workLocationId,
      photo_url: photo,
      notes,
      ...deviceInfo,
    })
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  return NextResponse.json(data, { status: 201 });
}
```

### 4.2 Leave Requests Endpoints

```typescript
// File: apps/web/src/app/api/personnel/leave-requests/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/personnel/leave-requests
export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  
  const employeeId = searchParams.get('employeeId');
  const status = searchParams.get('status');
  const year = searchParams.get('year');
  
  let query = supabase
    .from('leave_requests')
    .select(`
      *,
      employee:employees(id, full_name, employee_code),
      leave_type:leave_types(id, name, color),
      manager:manager_id(id, full_name)
    `)
    .order('created_at', { ascending: false });
  
  if (employeeId) query = query.eq('employee_id', employeeId);
  if (status) query = query.eq('status', status);
  if (year) {
    query = query
      .gte('start_date', `${year}-01-01`)
      .lte('end_date', `${year}-12-31`);
  }
  
  const { data, error } = await query;
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  return NextResponse.json(data);
}

// POST /api/personnel/leave-requests
export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();
  
  const {
    employeeId,
    leaveTypeId,
    startDate,
    endDate,
    totalDays,
    reason,
    isHalfDay,
  } = body;
  
  // Validate
  if (!employeeId || !leaveTypeId || !startDate || !endDate) {
    return NextResponse.json(
      { error: 'Required fields missing' },
      { status: 400 }
    );
  }
  
  // Get employee's manager
  const { data: employee } = await supabase
    .from('employees')
    .select('manager_id')
    .eq('id', employeeId)
    .single();
  
  // Create request
  const { data, error } = await supabase
    .from('leave_requests')
    .insert({
      employee_id: employeeId,
      leave_type_id: leaveTypeId,
      start_date: startDate,
      end_date: endDate,
      total_days: totalDays,
      reason,
      is_half_day: isHalfDay,
      manager_id: employee?.manager_id,
      status: 'pending',
    })
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  return NextResponse.json(data, { status: 201 });
}
```

### 4.3 Approval Endpoints

```typescript
// File: apps/web/src/app/api/personnel/leave-requests/[id]/approve/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const body = await request.json();
  const { notes, approverId } = body;
  
  const { data, error } = await supabase
    .from('leave_requests')
    .update({
      status: 'approved',
      manager_id: approverId,
      manager_approved_at: new Date().toISOString(),
      manager_notes: notes,
    })
    .eq('id', params.id)
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  return NextResponse.json(data);
}
```

---

## 🎨 5. FRONTEND KOMPONENDID

### 5.1 Attendance Check-in Component

```typescript
// File: apps/web/src/components/personnel/AttendanceCheckIn.tsx

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Camera, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface Location {
  latitude: number;
  longitude: number;
  accuracy: number;
}

export function AttendanceCheckIn() {
  const [location, setLocation] = useState<Location | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<any>(null);

  useEffect(() => {
    // Get current location
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          toast.error('GPS viga: ' + error.message);
        }
      );
    }
  }, []);

  const handleCheckIn = async (type: 'check_in' | 'check_out') => {
    if (!location) {
      toast.error('GPS asukoht ei ole saadaval');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/personnel/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: 'current-user-id', // Get from auth
          type,
          latitude: location.latitude,
          longitude: location.longitude,
          workLocationId: 'location-id', // From settings
        }),
      });

      if (!response.ok) throw new Error('Check-in ebaõnnestus');

      const data = await response.json();
      
      if (!data.is_within_geofence) {
        toast.warning('Oled väljaspool lubatud tööala!');
      } else {
        toast.success(
          type === 'check_in' ? 'Tööle registreeritud!' : 'Töölt lahkunud!'
        );
      }

      setLastCheckIn(data);
    } catch (error) {
      toast.error('Viga registreerimisel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Tööaja Registreerimine</h3>
          <Clock className="h-5 w-5 text-muted-foreground" />
        </div>

        {location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              GPS: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </span>
            <span className="text-xs">
              (täpsus: {Math.round(location.accuracy)}m)
            </span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => handleCheckIn('check_in')}
            disabled={!location || loading}
            size="lg"
            className="h-20"
          >
            <div className="flex flex-col items-center gap-1">
              <Clock className="h-6 w-6" />
              <span>Tule tööle</span>
            </div>
          </Button>

          <Button
            onClick={() => handleCheckIn('check_out')}
            disabled={!location || loading}
            variant="outline"
            size="lg"
            className="h-20"
          >
            <div className="flex flex-col items-center gap-1">
              <Clock className="h-6 w-6" />
              <span>Lahku töölt</span>
            </div>
          </Button>
        </div>

        {lastCheckIn && (
          <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
            <p className="font-medium">Viimane registreering:</p>
            <p className="text-muted-foreground">
              {new Date(lastCheckIn.timestamp).toLocaleString('et-EE')}
            </p>
            {lastCheckIn.distance_from_location && (
              <p className="text-muted-foreground">
                Kaugus: {Math.round(lastCheckIn.distance_from_location)}m
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
```

### 5.2 Leave Request Form

```typescript
// File: apps/web/src/components/personnel/LeaveRequestForm.tsx

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

const formSchema = z.object({
  leaveTypeId: z.string().min(1, 'Vali puhkuse liik'),
  startDate: z.date(),
  endDate: z.date(),
  reason: z.string().min(10, 'Põhjus peab olema vähemalt 10 tähemärki'),
});

export function LeaveRequestForm({ leaveTypes, onSuccess }: any) {
  const [loading, setLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      reason: '',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setLoading(true);

    try {
      // Calculate working days
      const totalDays = calculateWorkingDays(
        values.startDate,
        values.endDate
      );

      const response = await fetch('/api/personnel/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: 'current-user-id',
          leaveTypeId: values.leaveTypeId,
          startDate: values.startDate.toISOString(),
          endDate: values.endDate.toISOString(),
          totalDays,
          reason: values.reason,
        }),
      });

      if (!response.ok) throw new Error('Taotlus ebaõnnestus');

      toast.success('Puhkuse taotlus saadetud!');
      onSuccess?.();
      form.reset();
    } catch (error) {
      toast.error('Viga taotluse saatmisel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="leaveTypeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Puhkuse liik</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Vali puhkuse liik" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {leaveTypes.map((type: any) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Alguskuupäev</FormLabel>
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={(date) => date < new Date()}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Lõppkuupäev</FormLabel>
                <Calendar
                  mode="single"
                  selected={field.value}
                  onSelect={field.onChange}
                  disabled={(date) => date < new Date()}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="reason"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Põhjus</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Kirjelda puhkuse põhjust..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Saadan...' : 'Saada taotlus'}
        </Button>
      </form>
    </Form>
  );
}

function calculateWorkingDays(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++; // Skip weekends
    current.setDate(current.getDate() + 1);
  }

  return count;
}
```

---

## 📱 6. MOBIILIRAKENDUS

### 6.1 React Native Setup

```bash
# Loo React Native projekt
npx create-expo-app@latest personnel-mobile --template tabs

cd personnel-mobile

# Install dependencies
npm install @react-navigation/native @react-navigation/bottom-tabs
npm install @supabase/supabase-js
npm install expo-location expo-camera
npm install react-native-maps
npm install @tanstack/react-query
```

### 6.2 GPS Check-in Screen

```typescript
// File: personnel-mobile/app/(tabs)/checkin.tsx

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';

export default function CheckInScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Viga', 'GPS luba on vajalik');
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(location);
    })();
  }, []);

  const handleCheckIn = async (type: 'check_in' | 'check_out') => {
    if (!location) {
      Alert.alert('Viga', 'GPS asukoht pole saadaval');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('attendance')
        .insert({
          employee_id: 'current-user-id',
          type,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          gps_accuracy: location.coords.accuracy,
        })
        .select()
        .single();

      if (error) throw error;

      setLastCheckIn(data);
      Alert.alert(
        'Õnnestus',
        type === 'check_in' ? 'Tööle registreeritud!' : 'Töölt lahkunud!'
      );
    } catch (error) {
      Alert.alert('Viga', 'Registreerimine ebaõnnestus');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tööaja Registreerimine</Text>

      {location && (
        <View style={styles.locationInfo}>
          <Text>GPS: {location.coords.latitude.toFixed(6)}</Text>
          <Text>Täpsus: {Math.round(location.coords.accuracy)}m</Text>
        </View>
      )}

      <View style={styles.buttons}>
        <TouchableOpacity
          style={[styles.button, styles.checkInButton]}
          onPress={() => handleCheckIn('check_in')}
          disabled={!location || loading}
        >
          <Text style={styles.buttonText}>TULE TÖÖLE</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.checkOutButton]}
          onPress={() => handleCheckIn('check_out')}
          disabled={!location || loading}
        >
          <Text style={styles.buttonText}>LAHKU TÖÖLT</Text>
        </TouchableOpacity>
      </View>

      {lastCheckIn && (
        <View style={styles.lastCheckIn}>
          <Text>Viimane: {new Date(lastCheckIn.timestamp).toLocaleString()}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  locationInfo: {
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 20,
  },
  buttons: {
    gap: 15,
  },
  button: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkInButton: {
    backgroundColor: '#279989',
  },
  checkOutButton: {
    backgroundColor: '#6B7280',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  lastCheckIn: {
    marginTop: 20,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
});
```

---

## ⚙️ 7. IMPLEMENTATSIOONI SAMMUD CLAUDE CODE JAOKS

### Faas 1: Andmebaas (1-2 päeva)

```bash
# 1. Loo migration fail
supabase migration new personnel_module

# 2. Kopeeri SQL kood migration faili
# (Kõik ülaltoodud SQL)

# 3. Rakenda migratsioon
supabase db push

# 4. Genereeri TypeScript types
supabase gen types typescript --local > types/database.ts
```

### Faas 2: API Endpoints (2-3 päeva)

```bash
# Loo API route failid:
apps/web/src/app/api/personnel/
├── attendance/
│   ├── route.ts (GET, POST)
│   └── [id]/route.ts (GET, PATCH, DELETE)
├── leave-requests/
│   ├── route.ts (GET, POST)
│   └── [id]/
│       ├── route.ts (GET, PATCH, DELETE)
│       ├── approve/route.ts (POST)
│       └── reject/route.ts (POST)
├── employees/
│   ├── route.ts (GET, POST)
│   └── [id]/route.ts (GET, PATCH, DELETE)
├── leave-balances/
│   └── route.ts (GET)
└── reports/
    ├── attendance/route.ts
    └── leaves/route.ts
```

### Faas 3: Frontend Komponendid (3-4 päeva)

```bash
# Loo komponendid:
apps/web/src/components/personnel/
├── AttendanceCheckIn.tsx
├── AttendanceHistory.tsx
├── AttendanceCalendar.tsx
├── LeaveRequestForm.tsx
├── LeaveRequestsList.tsx
├── LeaveApprovalDialog.tsx
├── LeaveCalendar.tsx
├── EmployeeCard.tsx
├── EmployeeForm.tsx
├── DepartmentTree.tsx
└── PersonnelDashboard.tsx
```

### Faas 4: Pages (2-3 päeva)

```bash
# Loo lehed:
apps/web/src/app/(dashboard)/personnel/
├── page.tsx (Dashboard)
├── attendance/
│   ├── page.tsx (List)
│   └── [id]/page.tsx (Details)
├── leave-requests/
│   ├── page.tsx (List)
│   ├── new/page.tsx (Create)
│   └── [id]/page.tsx (Details)
├── employees/
│   ├── page.tsx (List)
│   ├── new/page.tsx (Create)
│   └── [id]/
│       ├── page.tsx (Details)
│       └── edit/page.tsx (Edit)
└── reports/
    ├── attendance/page.tsx
    └── leaves/page.tsx
```

### Faas 5: Mobile App (4-5 päeva)

```bash
# Loo mobile projekt
cd personnel-mobile

# Loo screens:
app/(tabs)/
├── checkin.tsx
├── history.tsx
├── leaves.tsx
└── profile.tsx

app/
├── _layout.tsx
└── (auth)/
    ├── login.tsx
    └── register.tsx
```

### Faas 6: Testing & QA (2-3 päeva)

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Manual testing checklist
```

### Faas 7: Deployment (1 päev)

```bash
# Deploy database
supabase db push --project-ref xxx

# Deploy web app
vercel --prod

# Deploy mobile app
eas build --platform all
eas submit --platform all
```

---

## ✅ 8. TESTIMISE CHECKLIST

### GPS Check-in Testing
- [ ] Check-in õiges asukohas
- [ ] Check-in vales asukohas (geofence fail)
- [ ] Check-out
- [ ] Offline check-in (sync hiljem)
- [ ] GPS täpsus < 50m
- [ ] Foto capture
- [ ] Device info salvestamine

### Leave Requests Testing
- [ ] Create request
- [ ] Manager approval
- [ ] Manager rejection
- [ ] Cancel request
- [ ] Balance update
- [ ] Notification send
- [ ] Calendar view
- [ ] Overlapping requests validation

### Reports Testing
- [ ] Daily summary
- [ ] Weekly report
- [ ] Monthly report
- [ ] Export PDF
- [ ] Export Excel
- [ ] GPS location map

---

## 🚀 9. DEPLOYMENT

### Supabase Setup
```bash
# Link project
supabase link --project-ref your-project-ref

# Push database
supabase db push

# Deploy functions
supabase functions deploy
```

### Vercel Deployment
```bash
# Deploy web app
vercel --prod

# Set environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Mobile Deployment
```bash
# Build iOS
eas build --platform ios

# Build Android
eas build --platform android

# Submit to stores
eas submit --platform all
```

---

## 📊 10. SUCCESS METRICS

### Funktsionaalsus
✅ GPS check-in/check-out töötab 100% täpsusega  
✅ Geofencing valideerib asukohti  
✅ Leave requests workflow 3-tasemeline  
✅ Real-time notifications  
✅ Offline mode mobile apps  

### Performance
✅ Check-in response < 2s  
✅ Dashboard load < 1s  
✅ Reports generate < 5s  
✅ Mobile app size < 50MB  

### User Experience
✅ Intuitive UI  
✅ Estonian language support  
✅ Mobile-first design  
✅ Accessibility compliance  

---

## 🎓 11. TRAINING & DOCUMENTATION

### User Documentation
- [ ] Admin guide
- [ ] Manager guide
- [ ] Employee guide
- [ ] Mobile app guide
- [ ] FAQ

### Technical Documentation
- [ ] API documentation
- [ ] Database schema
- [ ] Deployment guide
- [ ] Troubleshooting guide

---

## 📞 12. SUPPORT & MAINTENANCE

### Support Channels
- Email: support@rivest.ee
- Phone: +372 XXX XXXX
- Help desk: https://help.rivest.ee

### Maintenance Schedule
- Daily: Automated backups
- Weekly: Performance monitoring
- Monthly: Security updates
- Quarterly: Feature updates

---

## ✨ KOKKUVÕTE

See on täielik implementatsiooni plaan Personali mooduli loomiseks, mis vastab Frappe HRMS tasemele. Claude Code saab seda plaani kasutada sammhaaval rakendamise jaoks.

**Järgmised sammud:**
1. Kopeeri andmebaasi SQL Supabase'i
2. Loo API endpoints
3. Ehita frontend komponendid
4. Testi GPS funktsionaalsust
5. Deploy production

**Küsimused? Probleem?** => Kirjuta Silver'ile!
