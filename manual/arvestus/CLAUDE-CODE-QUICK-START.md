# ⚡ CLAUDE CODE - PERSONNEL MODULE QUICK START
## Kiire Implementatsioon Juhend

---

## 🎯 ÜLEVAADE

See on **samm-sammu haaval** juhend Claude Code'i jaoks, et implementeerida Personali moodul EOS2 süsteemi.

### Ajakava
- **Faas 1-2:** 2-3 päeva (Andmebaas + API)
- **Faas 3-4:** 3-4 päeva (Frontend)
- **Faas 5:** 2 päeva (Mobile)
- **Kokku:** ~10 tööpäeva

---

## 📦 FAAS 1: ANDMEBAASI SETUP

### 1.1 Loo Migration Fail

```bash
# Terminal
cd /home/claude/eos2-main
supabase migration new 010_personnel_module
```

### 1.2 Kopeeri SQL Kood

**Fail:** `supabase/migrations/010_personnel_module.sql`

<details>
<summary>Kopeeri see SQL (Kliki avamiseks)</summary>

```sql
-- Enable PostGIS for GPS
CREATE EXTENSION IF NOT EXISTS postgis;

-- DEPARTMENTS
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES departments(id),
  
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  head_id UUID,
  
  cost_center_code TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(tenant_id, code)
);

-- POSITIONS
CREATE TABLE positions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  title TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  level INTEGER,
  
  min_salary DECIMAL(10,2),
  max_salary DECIMAL(10,2),
  currency TEXT DEFAULT 'EUR',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(tenant_id, code)
);

-- SHIFTS
CREATE TABLE shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  break_minutes INTEGER DEFAULT 0,
  work_days INTEGER[] DEFAULT ARRAY[1,2,3,4,5],
  
  is_geofenced BOOLEAN DEFAULT false,
  is_flexible BOOLEAN DEFAULT false,
  grace_period_minutes INTEGER DEFAULT 15,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(tenant_id, code)
);

-- EMPLOYEES
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  employee_code TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED,
  email TEXT NOT NULL,
  phone TEXT,
  personal_id TEXT,
  
  department_id UUID REFERENCES departments(id),
  position_id UUID REFERENCES positions(id),
  manager_id UUID REFERENCES employees(id),
  
  employment_type TEXT DEFAULT 'full_time',
  employment_status TEXT DEFAULT 'active',
  shift_id UUID REFERENCES shifts(id),
  
  work_hours_per_day DECIMAL(4,2) DEFAULT 8.0,
  work_days_per_week INTEGER DEFAULT 5,
  annual_leave_days DECIMAL(5,2) DEFAULT 28.0,
  leave_balance DECIMAL(5,2) DEFAULT 0.0,
  
  hire_date DATE NOT NULL,
  termination_date DATE,
  date_of_birth DATE,
  
  address TEXT,
  city TEXT,
  postal_code TEXT,
  country TEXT DEFAULT 'Estonia',
  
  bank_account TEXT,
  bank_name TEXT,
  avatar_url TEXT,
  
  metadata JSONB DEFAULT '{}',
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(tenant_id, employee_code)
);

-- WORK LOCATIONS (GPS)
CREATE TABLE work_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  address TEXT,
  
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  location GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
  ) STORED,
  
  radius_meters INTEGER DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  requires_photo BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(tenant_id, code)
);

CREATE INDEX idx_work_locations_gps ON work_locations USING GIST(location);

-- ATTENDANCE (Check-ins)
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES shifts(id),
  work_location_id UUID REFERENCES work_locations(id),
  
  type TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  date DATE GENERATED ALWAYS AS (timestamp::DATE) STORED,
  
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  location GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
    CASE 
      WHEN latitude IS NOT NULL AND longitude IS NOT NULL 
      THEN ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
      ELSE NULL
    END
  ) STORED,
  gps_accuracy DECIMAL(6,2),
  
  is_valid BOOLEAN DEFAULT true,
  is_within_geofence BOOLEAN,
  distance_from_location DECIMAL(8,2),
  
  photo_url TEXT,
  device_id TEXT,
  device_model TEXT,
  app_version TEXT,
  ip_address INET,
  
  synced_at TIMESTAMPTZ,
  offline_recorded_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_attendance_employee ON attendance(employee_id);
CREATE INDEX idx_attendance_date ON attendance(date DESC);
CREATE INDEX idx_attendance_location ON attendance USING GIST(location);

-- ATTENDANCE SUMMARIES
CREATE TABLE attendance_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  date DATE NOT NULL,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  total_hours DECIMAL(5,2),
  break_hours DECIMAL(5,2),
  overtime_hours DECIMAL(5,2),
  
  status TEXT,
  is_late BOOLEAN DEFAULT false,
  late_minutes INTEGER,
  is_early_out BOOLEAN DEFAULT false,
  early_out_minutes INTEGER,
  
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMPTZ,
  approval_notes TEXT,
  
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, employee_id, date)
);

-- LEAVE TYPES
CREATE TABLE leave_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  description TEXT,
  
  max_days_per_year DECIMAL(5,2),
  requires_approval BOOLEAN DEFAULT true,
  is_paid BOOLEAN DEFAULT true,
  affects_balance BOOLEAN DEFAULT true,
  
  color TEXT DEFAULT '#3B82F6',
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(COALESCE(tenant_id::TEXT, 'global'), code)
);

-- Default leave types (global)
INSERT INTO leave_types (tenant_id, name, code, max_days_per_year, is_paid, color) VALUES
  (NULL, 'Puhkus', 'ANNUAL', 28, true, '#3B82F6'),
  (NULL, 'Haigusleht', 'SICK', 10, true, '#EF4444'),
  (NULL, 'Tasustamata puhkus', 'UNPAID', NULL, false, '#6B7280'),
  (NULL, 'Raseduspuhkus', 'MATERNITY', 140, true, '#EC4899'),
  (NULL, 'Isapuhkus', 'PATERNITY', 10, true, '#8B5CF6');

-- LEAVE REQUESTS
CREATE TABLE leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id),
  
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  total_days DECIMAL(5,2) NOT NULL,
  
  is_half_day BOOLEAN DEFAULT false,
  half_day_type TEXT,
  
  reason TEXT,
  attachment_urls TEXT[],
  
  status TEXT DEFAULT 'pending',
  
  manager_id UUID REFERENCES employees(id),
  manager_approved_at TIMESTAMPTZ,
  manager_notes TEXT,
  
  hr_id UUID REFERENCES employees(id),
  hr_approved_at TIMESTAMPTZ,
  hr_notes TEXT,
  
  rejected_by UUID REFERENCES employees(id),
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- LEAVE BALANCES
CREATE TABLE leave_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id),
  
  year INTEGER NOT NULL,
  opening_balance DECIMAL(5,2) DEFAULT 0,
  earned DECIMAL(5,2) DEFAULT 0,
  taken DECIMAL(5,2) DEFAULT 0,
  pending DECIMAL(5,2) DEFAULT 0,
  closing_balance DECIMAL(5,2) GENERATED ALWAYS AS (
    opening_balance + earned - taken
  ) STORED,
  
  last_calculated_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, employee_id, leave_type_id, year)
);

-- FUNCTIONS

-- GPS Distance Calculation
CREATE OR REPLACE FUNCTION calculate_gps_distance(
  lat1 DECIMAL, lon1 DECIMAL, lat2 DECIMAL, lon2 DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  RETURN ST_Distance(
    ST_SetSRID(ST_MakePoint(lon1, lat1), 4326)::geography,
    ST_SetSRID(ST_MakePoint(lon2, lat2), 4326)::geography
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Validate Attendance
CREATE OR REPLACE FUNCTION validate_attendance()
RETURNS TRIGGER AS $$
DECLARE
  location_record RECORD;
  distance DECIMAL;
BEGIN
  IF NEW.work_location_id IS NOT NULL THEN
    SELECT * INTO location_record 
    FROM work_locations 
    WHERE id = NEW.work_location_id;
    
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

-- RLS POLICIES

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Employees see own tenant
CREATE POLICY employees_tenant_policy ON employees
  FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id')::UUID);

-- Attendance: own records
CREATE POLICY attendance_own_policy ON attendance
  FOR ALL
  USING (employee_id = current_setting('app.user_id')::UUID);

-- Leave Requests: own requests
CREATE POLICY leave_requests_own_policy ON leave_requests
  FOR ALL
  USING (employee_id = current_setting('app.user_id')::UUID);
```

</details>

### 1.3 Apply Migration

```bash
# Push to Supabase
supabase db push
```

---

## 📡 FAAS 2: API ENDPOINTS

### 2.1 Attendance API

**Fail:** `apps/web/src/app/api/personnel/attendance/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  
  const employeeId = searchParams.get('employeeId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  
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
  
  const { data, error } = await query;
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();
  
  const { data, error } = await supabase
    .from('attendance')
    .insert({
      employee_id: body.employeeId,
      type: body.type,
      latitude: body.latitude,
      longitude: body.longitude,
      work_location_id: body.workLocationId,
      photo_url: body.photo,
      notes: body.notes,
      ip_address: request.headers.get('x-forwarded-for') || request.ip,
    })
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  return NextResponse.json(data, { status: 201 });
}
```

### 2.2 Leave Requests API

**Fail:** `apps/web/src/app/api/personnel/leave-requests/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  
  const { data, error } = await supabase
    .from('leave_requests')
    .select(`
      *,
      employee:employees(full_name, employee_code),
      leave_type:leave_types(name, color)
    `)
    .order('created_at', { ascending: false });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const body = await request.json();
  
  const { data, error } = await supabase
    .from('leave_requests')
    .insert({
      employee_id: body.employeeId,
      leave_type_id: body.leaveTypeId,
      start_date: body.startDate,
      end_date: body.endDate,
      total_days: body.totalDays,
      reason: body.reason,
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

### 2.3 Approve Leave

**Fail:** `apps/web/src/app/api/personnel/leave-requests/[id]/approve/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const body = await request.json();
  
  const { data, error } = await supabase
    .from('leave_requests')
    .update({
      status: 'approved',
      manager_approved_at: new Date().toISOString(),
      manager_notes: body.notes,
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

## 🎨 FAAS 3: FRONTEND KOMPONENDID

### 3.1 Check-in Component

**Fail:** `apps/web/src/components/personnel/AttendanceCheckIn.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MapPin, Clock } from 'lucide-react';
import { toast } from 'sonner';

export function AttendanceCheckIn() {
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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
          employeeId: 'current-user-id', // TODO: Get from auth
          type,
          latitude: location.latitude,
          longitude: location.longitude,
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
    } catch (error) {
      toast.error('Viga registreerimisel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Tööaja Registreerimine</h3>

        {location && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>
              GPS: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
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
            <Clock className="mr-2" />
            Tule tööle
          </Button>

          <Button
            onClick={() => handleCheckIn('check_out')}
            disabled={!location || loading}
            variant="outline"
            size="lg"
            className="h-20"
          >
            <Clock className="mr-2" />
            Lahku töölt
          </Button>
        </div>
      </div>
    </Card>
  );
}
```

### 3.2 Leave Request Form

**Fail:** `apps/web/src/components/personnel/LeaveRequestForm.tsx`

```typescript
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

export function LeaveRequestForm({ leaveTypes }: any) {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!startDate || !endDate) {
      toast.error('Vali kuupäevad');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/personnel/leave-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: 'current-user-id',
          leaveTypeId: leaveTypes[0].id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          totalDays: calculateWorkingDays(startDate, endDate),
          reason,
        }),
      });

      if (!response.ok) throw new Error('Taotlus ebaõnnestus');

      toast.success('Puhkuse taotlus saadetud!');
      setStartDate(undefined);
      setEndDate(undefined);
      setReason('');
    } catch (error) {
      toast.error('Viga taotluse saatmisel');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label>Alguskuupäev</label>
          <Calendar
            mode="single"
            selected={startDate}
            onSelect={setStartDate}
          />
        </div>
        <div>
          <label>Lõppkuupäev</label>
          <Calendar
            mode="single"
            selected={endDate}
            onSelect={setEndDate}
          />
        </div>
      </div>

      <Textarea
        placeholder="Põhjus..."
        value={reason}
        onChange={(e) => setReason(e.target.value)}
      />

      <Button type="submit" disabled={loading}>
        {loading ? 'Saadan...' : 'Saada taotlus'}
      </Button>
    </form>
  );
}

function calculateWorkingDays(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }

  return count;
}
```

---

## 📄 FAAS 4: PAGES

### 4.1 Dashboard Page

**Fail:** `apps/web/src/app/(dashboard)/personnel/page.tsx`

```typescript
import { AttendanceCheckIn } from '@/components/personnel/AttendanceCheckIn';
import { Card } from '@/components/ui/card';

export default async function PersonnelDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Personal</h1>
        <p className="text-muted-foreground">
          Tööaja arvestus ja puhkuste haldus
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="p-6">
          <h3 className="text-sm font-medium">Tänane tööaeg</h3>
          <p className="text-3xl font-bold">8.5h</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium">Puhkuse saldo</h3>
          <p className="text-3xl font-bold">23 päeva</p>
        </Card>
        <Card className="p-6">
          <h3 className="text-sm font-medium">Ootel taotlused</h3>
          <p className="text-3xl font-bold">2</p>
        </Card>
      </div>

      <AttendanceCheckIn />
    </div>
  );
}
```

### 4.2 Leave Requests Page

**Fail:** `apps/web/src/app/(dashboard)/personnel/leave-requests/page.tsx`

```typescript
import { LeaveRequestForm } from '@/components/personnel/LeaveRequestForm';
import { createClient } from '@/lib/supabase/server';

export default async function LeaveRequestsPage() {
  const supabase = createClient();
  
  const { data: leaveTypes } = await supabase
    .from('leave_types')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Puhkuse taotlused</h1>
      <LeaveRequestForm leaveTypes={leaveTypes} />
    </div>
  );
}
```

---

## 📱 FAAS 5: MOBILE APP (OPTIONAL)

### 5.1 Setup React Native

```bash
npx create-expo-app@latest personnel-mobile --template tabs
cd personnel-mobile
npm install @supabase/supabase-js expo-location
```

### 5.2 Check-in Screen

**Fail:** `personnel-mobile/app/(tabs)/checkin.tsx`

```typescript
import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import { supabase } from '@/lib/supabase';

export default function CheckInScreen() {
  const [location, setLocation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const location = await Location.getCurrentPositionAsync({});
      setLocation(location);
    })();
  }, []);

  const handleCheckIn = async (type: 'check_in' | 'check_out') => {
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('attendance')
        .insert({
          employee_id: 'current-user-id',
          type,
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        })
        .select()
        .single();

      if (error) throw error;
      
      alert('Registreeritud!');
    } catch (error) {
      alert('Viga');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tööaja Registreerimine</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => handleCheckIn('check_in')}
      >
        <Text style={styles.buttonText}>TULE TÖÖLE</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => handleCheckIn('check_out')}
      >
        <Text style={styles.buttonText}>LAHKU TÖÖLT</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#279989',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
```

---

## ✅ TESTIMISE CHECKLIST

```bash
# 1. Test andmebaasi
supabase db test

# 2. Test API endpoints
curl http://localhost:3000/api/personnel/attendance

# 3. Test GPS check-in
# - Ava brauser
# - Mine /personnel
# - Testi check-in nuppu

# 4. Test puhkuse taotlus
# - Mine /personnel/leave-requests
# - Täida vorm
# - Kontrolli andmebaasis
```

---

## 🚀 DEPLOYMENT

```bash
# 1. Push database
supabase db push --project-ref your-ref

# 2. Deploy Vercel
vercel --prod

# 3. Test production
# Kontrolli GPS ja check-in
```

---

## ✨ JÄRGMISED SAMMUD

1. **Kopeeri SQL** andmebaasi
2. **Loo API** endpoints
3. **Ehita komponendid**
4. **Lisa pages**
5. **Testi GPS**
6. **Deploy**

**Valmis! 🎉**
