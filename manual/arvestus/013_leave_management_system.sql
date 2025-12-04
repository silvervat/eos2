-- ============================================
-- WORK & LEAVE SYSTEM - LEAVE MANAGEMENT
-- ============================================
-- Version: 1.0.0
-- Date: 2024-12-04
-- Description: Complete leave/vacation management system
-- ============================================

-- ============================================
-- LEAVE TYPES
-- ============================================

CREATE TABLE IF NOT EXISTS leave_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Basic info
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Rules
  days_per_year INTEGER,
  requires_approval BOOLEAN DEFAULT true,
  requires_document BOOLEAN DEFAULT false,
  requires_substitute BOOLEAN DEFAULT true,
  min_notice_days INTEGER DEFAULT 14,
  max_consecutive_days INTEGER,
  
  -- Carryover
  allow_carryover BOOLEAN DEFAULT true,
  carryover_max_days INTEGER DEFAULT 10,
  
  -- Display
  color TEXT DEFAULT '#3B82F6',
  icon TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(COALESCE(tenant_id::TEXT, 'global'), code)
);

-- Insert default leave types
INSERT INTO leave_types (tenant_id, code, name, description, days_per_year, requires_document, color, icon) VALUES
  (NULL, 'ANNUAL', 'Põhipuhkus', 'Aastane tasustatav puhkus', 28, false, '#1890ff', '🏖️'),
  (NULL, 'SICK', 'Haiguspuhkus', 'Haiguse tõttu puudumine', NULL, true, '#ff7a45', '🏥'),
  (NULL, 'UNPAID', 'Palgata puhkus', 'Tasustamata vaba', 30, false, '#8c8c8c', '📴'),
  (NULL, 'PARENTAL', 'Lapsehoolduspuhkus', 'Lapsehoolduspuhkus', NULL, false, '#722ed1', '👶'),
  (NULL, 'STUDY', 'Õppepuhkus', 'Õppimisega seotud vaba', 10, true, '#13c2c2', '📚'),
  (NULL, 'BEREAVEMENT', 'Matusepuhkus', 'Pereliikmete kaotus', 3, false, '#262626', '🕊️')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE leave_types IS 'Types of leave/vacation with rules and entitlements';

-- ============================================
-- LEAVE REQUESTS
-- ============================================

CREATE TABLE IF NOT EXISTS leave_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Who
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id),
  
  -- When
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  working_days INTEGER NOT NULL,
  calendar_days INTEGER GENERATED ALWAYS AS (end_date - start_date + 1) STORED,
  
  -- Details
  reason TEXT,
  notes TEXT,
  
  -- Substitute
  substitute_id UUID REFERENCES employees(id),
  
  -- Documents
  documents JSONB DEFAULT '[]',
  
  -- Approval workflow
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  approved_by UUID REFERENCES employees(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  
  -- Cancellation
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES employees(id),
  cancellation_reason TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES employees(id),
  
  -- Constraints
  CONSTRAINT valid_date_range CHECK (end_date >= start_date),
  CONSTRAINT valid_working_days CHECK (working_days > 0)
);

CREATE INDEX idx_leave_requests_employee ON leave_requests(employee_id);
CREATE INDEX idx_leave_requests_dates ON leave_requests(start_date, end_date);
CREATE INDEX idx_leave_requests_status ON leave_requests(status);
CREATE INDEX idx_leave_requests_type ON leave_requests(leave_type_id);
CREATE INDEX idx_leave_requests_substitute ON leave_requests(substitute_id);
CREATE INDEX idx_leave_requests_created ON leave_requests(created_at DESC);

COMMENT ON TABLE leave_requests IS 'Leave/vacation requests from employees';

-- ============================================
-- LEAVE BALANCES
-- ============================================

CREATE TABLE IF NOT EXISTS leave_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id),
  year INTEGER NOT NULL,
  
  -- Balance tracking
  total_days DECIMAL(5,2) NOT NULL DEFAULT 0,
  used_days DECIMAL(5,2) NOT NULL DEFAULT 0,
  planned_days DECIMAL(5,2) NOT NULL DEFAULT 0,
  remaining_days DECIMAL(5,2) GENERATED ALWAYS AS (total_days - used_days - planned_days) STORED,
  
  -- Carryover
  carryover_days DECIMAL(5,2) DEFAULT 0,
  
  -- Manual adjustments
  adjustment_days DECIMAL(5,2) DEFAULT 0,
  adjustment_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(employee_id, leave_type_id, year)
);

CREATE INDEX idx_leave_balances_employee ON leave_balances(employee_id);
CREATE INDEX idx_leave_balances_year ON leave_balances(year);
CREATE INDEX idx_leave_balances_employee_year ON leave_balances(employee_id, year);

COMMENT ON TABLE leave_balances IS 'Leave balance tracking per employee per year';

-- ============================================
-- LEAVE AUDIT LOG
-- ============================================

CREATE TABLE IF NOT EXISTS leave_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  
  leave_request_id UUID NOT NULL REFERENCES leave_requests(id) ON DELETE CASCADE,
  
  action TEXT NOT NULL CHECK (action IN ('created', 'approved', 'rejected', 'modified', 'cancelled')),
  performed_by UUID NOT NULL REFERENCES employees(id),
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  comment TEXT,
  
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leave_audit_request ON leave_audit_log(leave_request_id);
CREATE INDEX idx_leave_audit_performed ON leave_audit_log(performed_by);
CREATE INDEX idx_leave_audit_created ON leave_audit_log(created_at DESC);

COMMENT ON TABLE leave_audit_log IS 'Audit trail for all leave request changes';

-- ============================================
-- FUNCTIONS
-- ============================================

-- Calculate working days between dates
CREATE OR REPLACE FUNCTION calculate_leave_working_days(
  p_start_date DATE,
  p_end_date DATE,
  p_country_code TEXT DEFAULT 'EE',
  p_tenant_id UUID DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  working_days INTEGER := 0;
  current_date DATE := p_start_date;
BEGIN
  WHILE current_date <= p_end_date LOOP
    -- Skip weekends (Saturday=6, Sunday=0)
    IF EXTRACT(DOW FROM current_date) NOT IN (0, 6) THEN
      -- Skip holidays
      IF NOT is_holiday(current_date, p_country_code, p_tenant_id) THEN
        working_days := working_days + 1;
      END IF;
    END IF;
    
    current_date := current_date + INTERVAL '1 day';
  END LOOP;
  
  RETURN working_days;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calculate_leave_working_days IS 'Calculate working days excluding weekends and holidays';

-- Initialize leave balance for new employee
CREATE OR REPLACE FUNCTION initialize_leave_balance(
  p_employee_id UUID,
  p_year INTEGER DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  leave_type RECORD;
  target_year INTEGER := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE));
BEGIN
  FOR leave_type IN 
    SELECT * FROM leave_types 
    WHERE is_active = true 
      AND days_per_year IS NOT NULL
  LOOP
    INSERT INTO leave_balances (
      employee_id,
      leave_type_id,
      year,
      total_days
    ) VALUES (
      p_employee_id,
      leave_type.id,
      target_year,
      leave_type.days_per_year
    )
    ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION initialize_leave_balance IS 'Create leave balance records for new employee';

-- Update leave balance when request status changes
CREATE OR REPLACE FUNCTION update_leave_balance()
RETURNS TRIGGER AS $$
DECLARE
  balance_id UUID;
  request_year INTEGER;
BEGIN
  request_year := EXTRACT(YEAR FROM NEW.start_date);
  
  -- Ensure balance record exists
  INSERT INTO leave_balances (
    employee_id,
    leave_type_id,
    year,
    total_days
  )
  SELECT 
    NEW.employee_id,
    NEW.leave_type_id,
    request_year,
    COALESCE((SELECT days_per_year FROM leave_types WHERE id = NEW.leave_type_id), 0)
  ON CONFLICT (employee_id, leave_type_id, year) DO NOTHING;
  
  -- Get balance record
  SELECT id INTO balance_id
  FROM leave_balances
  WHERE employee_id = NEW.employee_id
    AND leave_type_id = NEW.leave_type_id
    AND year = request_year;
  
  -- Status change: pending → approved
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status = 'pending') THEN
    IF NEW.start_date > CURRENT_DATE THEN
      -- Future leave, add to planned
      UPDATE leave_balances
      SET planned_days = planned_days + NEW.working_days
      WHERE id = balance_id;
    ELSE
      -- Current or past leave, add to used
      UPDATE leave_balances
      SET used_days = used_days + NEW.working_days
      WHERE id = balance_id;
    END IF;
  
  -- Status change: approved → rejected/cancelled
  ELSIF (NEW.status = 'rejected' OR NEW.status = 'cancelled') AND OLD.status = 'approved' THEN
    IF NEW.start_date > CURRENT_DATE THEN
      -- Was planned, remove from planned
      UPDATE leave_balances
      SET planned_days = GREATEST(0, planned_days - NEW.working_days)
      WHERE id = balance_id;
    ELSE
      -- Was used, remove from used
      UPDATE leave_balances
      SET used_days = GREATEST(0, used_days - NEW.working_days)
      WHERE id = balance_id;
    END IF;
  
  -- Date change for approved request
  ELSIF NEW.status = 'approved' AND OLD.status = 'approved' 
    AND (NEW.working_days != OLD.working_days OR NEW.start_date != OLD.start_date) THEN
    
    -- Remove old allocation
    IF OLD.start_date > CURRENT_DATE THEN
      UPDATE leave_balances
      SET planned_days = GREATEST(0, planned_days - OLD.working_days)
      WHERE id = balance_id;
    ELSE
      UPDATE leave_balances
      SET used_days = GREATEST(0, used_days - OLD.working_days)
      WHERE id = balance_id;
    END IF;
    
    -- Add new allocation
    IF NEW.start_date > CURRENT_DATE THEN
      UPDATE leave_balances
      SET planned_days = planned_days + NEW.working_days
      WHERE id = balance_id;
    ELSE
      UPDATE leave_balances
      SET used_days = used_days + NEW.working_days
      WHERE id = balance_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leave_request_balance_update ON leave_requests;

CREATE TRIGGER leave_request_balance_update
  AFTER INSERT OR UPDATE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_leave_balance();

COMMENT ON FUNCTION update_leave_balance IS 'Automatically update leave balance when request status changes';

-- Move planned to used for started leaves
CREATE OR REPLACE FUNCTION move_planned_to_used()
RETURNS VOID AS $$
BEGIN
  -- Find all approved leaves that started today
  UPDATE leave_balances lb
  SET 
    used_days = used_days + subquery.working_days,
    planned_days = GREATEST(0, planned_days - subquery.working_days)
  FROM (
    SELECT 
      lr.employee_id,
      lr.leave_type_id,
      EXTRACT(YEAR FROM lr.start_date) as year,
      lr.working_days
    FROM leave_requests lr
    WHERE lr.status = 'approved'
      AND lr.start_date = CURRENT_DATE
  ) subquery
  WHERE lb.employee_id = subquery.employee_id
    AND lb.leave_type_id = subquery.leave_type_id
    AND lb.year = subquery.year;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION move_planned_to_used IS 'Daily cron job to move planned leaves to used when they start';

-- Send leave notification
CREATE OR REPLACE FUNCTION send_leave_notification()
RETURNS TRIGGER AS $$
DECLARE
  employee_name TEXT;
  approver_name TEXT;
  leave_type_name TEXT;
BEGIN
  -- Get employee name
  SELECT full_name INTO employee_name
  FROM employees
  WHERE id = NEW.employee_id;
  
  -- Get leave type name
  SELECT name INTO leave_type_name
  FROM leave_types
  WHERE id = NEW.leave_type_id;
  
  -- Status changed to approved
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    -- Get approver name
    SELECT full_name INTO approver_name
    FROM employees
    WHERE id = NEW.approved_by;
    
    -- Notify employee
    INSERT INTO notifications (
      employee_id,
      type,
      title,
      message,
      entity_type,
      entity_id,
      priority
    ) VALUES (
      NEW.employee_id,
      'leave_approved',
      'Puhkusetaotlus kinnitatud',
      format('Sinu %s taotlus %s - %s (%s päeva) on kinnitatud. Kinnitaja: %s',
        leave_type_name,
        to_char(NEW.start_date, 'DD.MM.YYYY'),
        to_char(NEW.end_date, 'DD.MM.YYYY'),
        NEW.working_days,
        approver_name
      ),
      'leave_request',
      NEW.id,
      'normal'
    );
    
    -- Notify substitute if exists
    IF NEW.substitute_id IS NOT NULL THEN
      INSERT INTO notifications (
        employee_id,
        type,
        title,
        message,
        entity_type,
        entity_id,
        priority
      ) VALUES (
        NEW.substitute_id,
        'leave_substitute_assigned',
        'Sind on määratud asendajaks',
        format('%s on puhkusel %s - %s. Oled määratud asendajaks.',
          employee_name,
          to_char(NEW.start_date, 'DD.MM.YYYY'),
          to_char(NEW.end_date, 'DD.MM.YYYY')
        ),
        'leave_request',
        NEW.id,
        'high'
      );
    END IF;
  
  -- Status changed to rejected
  ELSIF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
    INSERT INTO notifications (
      employee_id,
      type,
      title,
      message,
      entity_type,
      entity_id,
      priority
    ) VALUES (
      NEW.employee_id,
      'leave_rejected',
      'Puhkusetaotlus tagasi lükatud',
      format('Sinu %s taotlus %s - %s on tagasi lükatud. Põhjus: %s',
        leave_type_name,
        to_char(NEW.start_date, 'DD.MM.YYYY'),
        to_char(NEW.end_date, 'DD.MM.YYYY'),
        COALESCE(NEW.rejection_reason, 'Põhjust ei ole märgitud')
      ),
      'leave_request',
      NEW.id,
      'high'
    );
  
  -- New request created - notify manager
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO notifications (
      employee_id,
      type,
      title,
      message,
      entity_type,
      entity_id,
      priority
    ) VALUES (
      (SELECT manager_id FROM employees WHERE id = NEW.employee_id),
      'leave_request_pending',
      'Uus puhkusetaotlus',
      format('%s taotleb %s %s - %s (%s päeva)',
        employee_name,
        leave_type_name,
        to_char(NEW.start_date, 'DD.MM.YYYY'),
        to_char(NEW.end_date, 'DD.MM.YYYY'),
        NEW.working_days
      ),
      'leave_request',
      NEW.id,
      'high'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leave_request_notification ON leave_requests;

CREATE TRIGGER leave_request_notification
  AFTER INSERT OR UPDATE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION send_leave_notification();

COMMENT ON FUNCTION send_leave_notification IS 'Send notifications for leave request status changes';

-- Log leave request changes
CREATE OR REPLACE FUNCTION log_leave_audit()
RETURNS TRIGGER AS $$
DECLARE
  audit_action TEXT;
  old_vals JSONB;
  new_vals JSONB;
BEGIN
  IF TG_OP = 'INSERT' THEN
    audit_action := 'created';
    old_vals := NULL;
    new_vals := to_jsonb(NEW);
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.status != OLD.status THEN
      audit_action := NEW.status;
    ELSE
      audit_action := 'modified';
    END IF;
    old_vals := to_jsonb(OLD);
    new_vals := to_jsonb(NEW);
  ELSIF TG_OP = 'DELETE' THEN
    audit_action := 'deleted';
    old_vals := to_jsonb(OLD);
    new_vals := NULL;
  END IF;
  
  INSERT INTO leave_audit_log (
    leave_request_id,
    action,
    performed_by,
    old_values,
    new_values,
    reason,
    ip_address,
    user_agent
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    audit_action,
    COALESCE(NEW.approved_by, NEW.created_by, OLD.approved_by, OLD.created_by),
    old_vals,
    new_vals,
    CASE 
      WHEN NEW.status = 'rejected' THEN NEW.rejection_reason
      WHEN NEW.status = 'cancelled' THEN NEW.cancellation_reason
      ELSE NULL
    END,
    inet_client_addr(),
    current_setting('application.user_agent', true)
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS leave_request_audit ON leave_requests;

CREATE TRIGGER leave_request_audit
  AFTER INSERT OR UPDATE OR DELETE ON leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION log_leave_audit();

COMMENT ON FUNCTION log_leave_audit IS 'Log all leave request changes to audit trail';

-- ============================================
-- VIEWS
-- ============================================

-- Current year leave balances
CREATE OR REPLACE VIEW v_current_leave_balances AS
SELECT 
  lb.*,
  e.full_name as employee_name,
  e.employee_code,
  lt.name as leave_type_name,
  lt.code as leave_type_code,
  lt.color as leave_type_color
FROM leave_balances lb
JOIN employees e ON lb.employee_id = e.id
JOIN leave_types lt ON lb.leave_type_id = lt.id
WHERE lb.year = EXTRACT(YEAR FROM CURRENT_DATE)
ORDER BY e.full_name, lt.sort_order;

-- Pending leave requests
CREATE OR REPLACE VIEW v_pending_leave_requests AS
SELECT 
  lr.*,
  e.full_name as employee_name,
  e.employee_code,
  d.name as department_name,
  lt.name as leave_type_name,
  lt.color as leave_type_color,
  s.full_name as substitute_name,
  m.full_name as manager_name
FROM leave_requests lr
JOIN employees e ON lr.employee_id = e.id
LEFT JOIN departments d ON e.department_id = d.id
JOIN leave_types lt ON lr.leave_type_id = lt.id
LEFT JOIN employees s ON lr.substitute_id = s.id
LEFT JOIN employees m ON e.manager_id = m.id
WHERE lr.status = 'pending'
ORDER BY lr.created_at;

-- Upcoming leaves
CREATE OR REPLACE VIEW v_upcoming_leaves AS
SELECT 
  lr.*,
  e.full_name as employee_name,
  e.employee_code,
  lt.name as leave_type_name,
  lt.color as leave_type_color,
  s.full_name as substitute_name,
  lr.start_date - CURRENT_DATE as days_until
FROM leave_requests lr
JOIN employees e ON lr.employee_id = e.id
JOIN leave_types lt ON lr.leave_type_id = lt.id
LEFT JOIN employees s ON lr.substitute_id = s.id
WHERE lr.status = 'approved'
  AND lr.start_date >= CURRENT_DATE
  AND lr.start_date <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY lr.start_date;

-- Currently on leave
CREATE OR REPLACE VIEW v_currently_on_leave AS
SELECT 
  lr.*,
  e.full_name as employee_name,
  e.employee_code,
  d.name as department_name,
  lt.name as leave_type_name,
  lt.color as leave_type_color,
  lt.icon as leave_type_icon,
  s.full_name as substitute_name
FROM leave_requests lr
JOIN employees e ON lr.employee_id = e.id
LEFT JOIN departments d ON e.department_id = d.id
JOIN leave_types lt ON lr.leave_type_id = lt.id
LEFT JOIN employees s ON lr.substitute_id = s.id
WHERE lr.status = 'approved'
  AND lr.start_date <= CURRENT_DATE
  AND lr.end_date >= CURRENT_DATE
ORDER BY e.full_name;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE leave_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE leave_audit_log ENABLE ROW LEVEL SECURITY;

-- Leave types: everyone can read
CREATE POLICY leave_types_read_policy ON leave_types
  FOR SELECT
  USING (is_active = true);

-- Leave requests: own + managed + substitute
CREATE POLICY leave_requests_read_policy ON leave_requests
  FOR SELECT
  USING (
    employee_id = get_current_employee_id()
    OR employee_id IN (
      SELECT id FROM employees 
      WHERE manager_id = get_current_employee_id()
    )
    OR substitute_id = get_current_employee_id()
    OR has_role(ARRAY['admin', 'owner'])
  );

-- Leave requests: create own
CREATE POLICY leave_requests_insert_policy ON leave_requests
  FOR INSERT
  WITH CHECK (employee_id = get_current_employee_id());

-- Leave requests: modify own pending
CREATE POLICY leave_requests_update_own_policy ON leave_requests
  FOR UPDATE
  USING (
    employee_id = get_current_employee_id()
    AND status = 'pending'
  );

-- Leave requests: managers can approve
CREATE POLICY leave_requests_approve_policy ON leave_requests
  FOR UPDATE
  USING (
    employee_id IN (
      SELECT id FROM employees 
      WHERE manager_id = get_current_employee_id()
    )
    OR has_role(ARRAY['admin', 'owner'])
  );

-- Leave balances: own + managed
CREATE POLICY leave_balances_read_policy ON leave_balances
  FOR SELECT
  USING (
    employee_id = get_current_employee_id()
    OR employee_id IN (
      SELECT id FROM employees 
      WHERE manager_id = get_current_employee_id()
    )
    OR has_role(ARRAY['admin', 'owner'])
  );

-- Leave audit: own + managed
CREATE POLICY leave_audit_read_policy ON leave_audit_log
  FOR SELECT
  USING (
    leave_request_id IN (
      SELECT id FROM leave_requests
      WHERE employee_id = get_current_employee_id()
        OR employee_id IN (
          SELECT id FROM employees 
          WHERE manager_id = get_current_employee_id()
        )
    )
    OR has_role(ARRAY['admin', 'owner'])
  );

-- ============================================
-- SAMPLE DATA
-- ============================================

-- Initialize balances for existing employees
DO $$
DECLARE
  emp RECORD;
BEGIN
  FOR emp IN SELECT id FROM employees WHERE is_active = true
  LOOP
    PERFORM initialize_leave_balance(emp.id, EXTRACT(YEAR FROM CURRENT_DATE));
  END LOOP;
END $$;

-- ============================================
-- COMPLETE
-- ============================================

COMMENT ON SCHEMA public IS 'Leave management system integrated with work hours';
