-- ============================================
-- PERSONNEL & PROJECT LOCATIONS MODULE
-- ============================================
-- Version: 1.0.0
-- Date: 2024-12-04
-- Description: GPS-based attendance with project locations integration
-- ============================================

-- Enable PostGIS for GPS calculations
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- DEPARTMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS departments (
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

CREATE INDEX IF NOT EXISTS idx_departments_tenant ON departments(tenant_id) WHERE deleted_at IS NULL;

-- ============================================
-- POSITIONS
-- ============================================
CREATE TABLE IF NOT EXISTS positions (
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

-- ============================================
-- SHIFTS
-- ============================================
CREATE TABLE IF NOT EXISTS shifts (
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

-- ============================================
-- EMPLOYEES
-- ============================================
CREATE TABLE IF NOT EXISTS employees (
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

CREATE INDEX IF NOT EXISTS idx_employees_tenant ON employees(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_employees_department ON employees(department_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_employees_manager ON employees(manager_id) WHERE deleted_at IS NULL;

-- ============================================
-- PROJECT LOCATIONS (GPS)
-- ============================================
CREATE TABLE IF NOT EXISTS project_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  address TEXT,
  
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  location GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
    ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)
  ) STORED,
  
  radius_meters INTEGER NOT NULL DEFAULT 100,
  is_active BOOLEAN DEFAULT true,
  
  require_gps BOOLEAN DEFAULT true,
  require_photo BOOLEAN DEFAULT false,
  
  work_start_time TIME,
  work_end_time TIME,
  
  metadata JSONB DEFAULT '{}',
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES user_profiles(id),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_project_locations_project ON project_locations(project_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_project_locations_gps ON project_locations USING GIST(location);
CREATE INDEX IF NOT EXISTS idx_project_locations_active ON project_locations(is_active) WHERE deleted_at IS NULL;

-- ============================================
-- PROJECT EMPLOYEES
-- ============================================
CREATE TABLE IF NOT EXISTS project_employees (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  role TEXT,
  
  assigned_date DATE DEFAULT CURRENT_DATE,
  start_date DATE,
  end_date DATE,
  
  is_active BOOLEAN DEFAULT true,
  can_checkin BOOLEAN DEFAULT true,
  can_view_location BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(tenant_id, project_id, employee_id)
);

CREATE INDEX IF NOT EXISTS idx_project_employees_project ON project_employees(project_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_project_employees_employee ON project_employees(employee_id) WHERE is_active = true;

-- ============================================
-- ATTENDANCE (Check-ins)
-- ============================================
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  shift_id UUID REFERENCES shifts(id),
  project_id UUID REFERENCES projects(id),
  project_location_id UUID REFERENCES project_locations(id),
  
  type TEXT NOT NULL CHECK (type IN ('check_in', 'check_out', 'break_start', 'break_end')),
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
  user_agent TEXT,
  
  synced_at TIMESTAMPTZ,
  offline_recorded_at TIMESTAMPTZ,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_attendance_tenant ON attendance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_project ON attendance(project_id);
CREATE INDEX IF NOT EXISTS idx_attendance_location ON attendance USING GIST(location);

-- ============================================
-- ATTENDANCE SUMMARIES
-- ============================================
CREATE TABLE IF NOT EXISTS attendance_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  date DATE NOT NULL,
  check_in_time TIMESTAMPTZ,
  check_out_time TIMESTAMPTZ,
  total_hours DECIMAL(5,2),
  break_hours DECIMAL(5,2),
  overtime_hours DECIMAL(5,2),
  
  status TEXT CHECK (status IN ('present', 'absent', 'late', 'half_day', 'on_leave')),
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

CREATE INDEX IF NOT EXISTS idx_summaries_employee ON attendance_summaries(employee_id);
CREATE INDEX IF NOT EXISTS idx_summaries_date ON attendance_summaries(date DESC);

-- ============================================
-- LEAVE TYPES
-- ============================================
CREATE TABLE IF NOT EXISTS leave_types (
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

-- Default leave types
INSERT INTO leave_types (tenant_id, name, code, max_days_per_year, is_paid, color) VALUES
  (NULL, 'Puhkus', 'ANNUAL', 28, true, '#3B82F6'),
  (NULL, 'Haigusleht', 'SICK', 10, true, '#EF4444'),
  (NULL, 'Tasustamata puhkus', 'UNPAID', NULL, false, '#6B7280'),
  (NULL, 'Raseduspuhkus', 'MATERNITY', 140, true, '#EC4899'),
  (NULL, 'Isapuhkus', 'PATERNITY', 10, true, '#8B5CF6')
ON CONFLICT DO NOTHING;

-- ============================================
-- LEAVE REQUESTS
-- ============================================
CREATE TABLE IF NOT EXISTS leave_requests (
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
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  
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

CREATE INDEX IF NOT EXISTS idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_requests_status ON leave_requests(status);
CREATE INDEX IF NOT EXISTS idx_leave_requests_dates ON leave_requests(start_date, end_date);

-- ============================================
-- LEAVE BALANCES
-- ============================================
CREATE TABLE IF NOT EXISTS leave_balances (
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

-- ============================================
-- FUNCTIONS
-- ============================================

-- GPS Distance Calculation
CREATE OR REPLACE FUNCTION calculate_gps_distance(
  lat1 DECIMAL, 
  lon1 DECIMAL,
  lat2 DECIMAL,
  lon2 DECIMAL
) RETURNS DECIMAL AS $$
BEGIN
  RETURN ST_Distance(
    ST_SetSRID(ST_MakePoint(lon1, lat1), 4326)::geography,
    ST_SetSRID(ST_MakePoint(lon2, lat2), 4326)::geography
  );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Check Employee Project Assignment
CREATE OR REPLACE FUNCTION check_employee_project_assignment(
  p_employee_id UUID,
  p_project_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM project_employees 
    WHERE employee_id = p_employee_id 
      AND project_id = p_project_id 
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql;

-- Validate Project Attendance
CREATE OR REPLACE FUNCTION validate_project_attendance()
RETURNS TRIGGER AS $$
DECLARE
  location_record RECORD;
  distance DECIMAL;
  is_assigned BOOLEAN;
BEGIN
  IF NEW.project_location_id IS NOT NULL THEN
    
    -- Get location info
    SELECT * INTO location_record 
    FROM project_locations 
    WHERE id = NEW.project_location_id 
      AND is_active = true;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Project location not found or not active';
    END IF;
    
    -- Check employee assignment
    is_assigned := check_employee_project_assignment(
      NEW.employee_id, 
      location_record.project_id
    );
    
    IF NOT is_assigned THEN
      RAISE EXCEPTION 'Employee not assigned to this project';
    END IF;
    
    -- Check GPS requirement
    IF location_record.require_gps AND (NEW.latitude IS NULL OR NEW.longitude IS NULL) THEN
      RAISE EXCEPTION 'GPS location is required for this project';
    END IF;
    
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
    
    NEW.project_id := location_record.project_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_project_attendance_trigger
  BEFORE INSERT OR UPDATE ON attendance
  FOR EACH ROW
  EXECUTE FUNCTION validate_project_attendance();

-- ============================================
-- VIEWS
-- ============================================

-- Active project locations
CREATE OR REPLACE VIEW v_active_project_locations AS
SELECT 
  pl.id,
  pl.project_id,
  p.name as project_name,
  p.code as project_code,
  pl.name as location_name,
  pl.address,
  pl.latitude,
  pl.longitude,
  pl.radius_meters,
  pl.require_gps,
  pl.is_active,
  COUNT(DISTINCT pe.employee_id) as assigned_employees_count
FROM project_locations pl
JOIN projects p ON pl.project_id = p.id
LEFT JOIN project_employees pe ON pl.project_id = pe.project_id AND pe.is_active = true
WHERE pl.deleted_at IS NULL 
  AND pl.is_active = true
GROUP BY pl.id, p.id;

-- Employee projects view
CREATE OR REPLACE VIEW v_employee_project_locations AS
SELECT 
  e.id as employee_id,
  e.full_name as employee_name,
  e.employee_code,
  pe.project_id,
  p.name as project_name,
  p.code as project_code,
  pe.role as project_role,
  pe.can_checkin,
  pl.id as location_id,
  pl.name as location_name,
  pl.latitude,
  pl.longitude,
  pl.radius_meters,
  pl.require_gps
FROM employees e
JOIN project_employees pe ON e.id = pe.employee_id
JOIN projects p ON pe.project_id = p.id
LEFT JOIN project_locations pl ON p.id = pl.project_id
WHERE e.deleted_at IS NULL 
  AND pe.is_active = true 
  AND (pl.deleted_at IS NULL OR pl.id IS NULL);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

-- Employees: tenant policy
CREATE POLICY employees_tenant_policy ON employees
  FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

-- Project locations: tenant policy
CREATE POLICY project_locations_tenant_policy ON project_locations
  FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

-- Project employees: access policy
CREATE POLICY project_employees_access_policy ON project_employees
  FOR SELECT
  USING (tenant_id = current_setting('app.tenant_id', true)::UUID);

-- Attendance: own records
CREATE POLICY attendance_own_policy ON attendance
  FOR ALL
  USING (employee_id = current_setting('app.user_id', true)::UUID);

-- Leave Requests: own requests
CREATE POLICY leave_requests_own_policy ON leave_requests
  FOR ALL
  USING (employee_id = current_setting('app.user_id', true)::UUID);

-- ============================================
-- COMPLETE
-- ============================================

COMMENT ON TABLE project_locations IS 'GPS-based project locations with geofencing';
COMMENT ON TABLE project_employees IS 'Employee assignments to projects';
COMMENT ON TABLE attendance IS 'GPS-validated time tracking records';
COMMENT ON TABLE leave_requests IS 'Employee leave request workflow';
