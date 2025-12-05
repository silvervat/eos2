-- ============================================
-- PERSONNEL & PROJECT LOCATIONS MODULE
-- ============================================
-- Version: 1.0.0
-- Date: 2024-12-04
-- Description: GPS-based attendance with project locations integration
-- ============================================

-- Enable PostGIS for GPS calculations (may already exist)
CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================
-- EXTEND EMPLOYEES TABLE
-- ============================================
ALTER TABLE employees
ADD COLUMN IF NOT EXISTS full_name TEXT GENERATED ALWAYS AS (first_name || ' ' || last_name) STORED;

ALTER TABLE employees ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES employees(id);
ALTER TABLE employees ADD COLUMN IF NOT EXISTS department_id UUID;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS position_id UUID;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS shift_id UUID;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS work_hours_per_day DECIMAL(4,2) DEFAULT 8.0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS work_days_per_week INTEGER DEFAULT 5;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS annual_leave_days DECIMAL(5,2) DEFAULT 28.0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS leave_balance DECIMAL(5,2) DEFAULT 0.0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS postal_code TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Estonia';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_account TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_name TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS updated_by UUID;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS auth_user_id UUID;

-- Rename hire_date to start_date if exists (compatibility)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'employees' AND column_name = 'hire_date') THEN
    ALTER TABLE employees RENAME COLUMN hire_date TO start_date;
  EXCEPTION WHEN others THEN
    NULL;
  END IF;
END $$;

-- Add start_date if it doesn't exist
ALTER TABLE employees ADD COLUMN IF NOT EXISTS start_date DATE;

CREATE INDEX IF NOT EXISTS idx_employees_manager ON employees(manager_id) WHERE deleted_at IS NULL;

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
  created_by UUID,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_project_locations_project ON project_locations(project_id) WHERE deleted_at IS NULL;
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
  date DATE NOT NULL DEFAULT CURRENT_DATE,

  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
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

  -- Approval fields
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'modified')),
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,

  modified_by UUID REFERENCES employees(id),
  modified_at TIMESTAMPTZ,
  modification_reason TEXT,

  worked_hours DECIMAL(5,2),
  overtime_hours DECIMAL(5,2) DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_attendance_tenant ON attendance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_attendance_employee ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_project ON attendance(project_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date DESC);

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
-- ATTENDANCE COMMENTS
-- ============================================
CREATE TABLE IF NOT EXISTS attendance_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  attendance_id UUID NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,

  comment TEXT NOT NULL,

  created_by UUID NOT NULL REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  is_internal BOOLEAN DEFAULT false,

  CONSTRAINT comment_length CHECK (length(comment) > 0 AND length(comment) <= 1000)
);

CREATE INDEX IF NOT EXISTS idx_attendance_comments_attendance ON attendance_comments(attendance_id);
CREATE INDEX IF NOT EXISTS idx_attendance_comments_created_at ON attendance_comments(created_at DESC);

-- ============================================
-- ATTENDANCE AUDIT LOG
-- ============================================
CREATE TABLE IF NOT EXISTS attendance_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  attendance_id UUID NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,

  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'modified', 'commented', 'created')),

  performed_by UUID NOT NULL REFERENCES employees(id),
  performed_at TIMESTAMPTZ DEFAULT NOW(),

  old_values JSONB,
  new_values JSONB,

  reason TEXT,
  comment TEXT,

  ip_address INET,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_log_attendance ON attendance_audit_log(attendance_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_performed_at ON attendance_audit_log(performed_at DESC);

-- ============================================
-- NOTIFICATIONS
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,

  type TEXT NOT NULL CHECK (type IN (
    'attendance_approved',
    'attendance_rejected',
    'attendance_modified',
    'attendance_commented',
    'leave_approved',
    'leave_rejected',
    'leave_commented',
    'leave_request_pending',
    'leave_substitute_assigned',
    'system_announcement'
  )),

  title TEXT NOT NULL,
  message TEXT NOT NULL,

  entity_type TEXT CHECK (entity_type IN ('attendance', 'leave_request', 'system')),
  entity_id UUID,

  action_url TEXT,
  action_label TEXT,

  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,

  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_notifications_employee ON notifications(employee_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON notifications(entity_type, entity_id);

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

-- Send notification function
CREATE OR REPLACE FUNCTION send_attendance_notification(
  p_employee_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_attendance_id UUID,
  p_metadata JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
  notification_id UUID;
  v_tenant_id UUID;
BEGIN
  SELECT tenant_id INTO v_tenant_id
  FROM attendance
  WHERE id = p_attendance_id;

  IF v_tenant_id IS NULL THEN
    RETURN NULL;
  END IF;

  INSERT INTO notifications (
    tenant_id,
    employee_id,
    type,
    title,
    message,
    entity_type,
    entity_id,
    action_url,
    metadata
  ) VALUES (
    v_tenant_id,
    p_employee_id,
    p_type,
    p_title,
    p_message,
    'attendance',
    p_attendance_id,
    '/personnel/work-hours?id=' || p_attendance_id,
    p_metadata
  )
  RETURNING id INTO notification_id;

  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

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
-- UPDATED_AT TRIGGERS
-- ============================================
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_positions_updated_at BEFORE UPDATE ON positions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shifts_updated_at BEFORE UPDATE ON shifts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_locations_updated_at BEFORE UPDATE ON project_locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_project_employees_updated_at BEFORE UPDATE ON project_employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_summaries_updated_at BEFORE UPDATE ON attendance_summaries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE project_locations IS 'GPS-based project locations with geofencing';
COMMENT ON TABLE project_employees IS 'Employee assignments to projects';
COMMENT ON TABLE attendance IS 'GPS-validated time tracking records';
COMMENT ON TABLE attendance_comments IS 'Comments on attendance records with public/internal visibility';
COMMENT ON TABLE attendance_audit_log IS 'Complete audit trail for all attendance changes';
COMMENT ON TABLE notifications IS 'User notifications for various events with read tracking';
