-- ============================================
-- WORK HOURS MANAGEMENT SYSTEM
-- ============================================
-- Version: 1.0.0
-- Date: 2024-12-04
-- Description: Approval, comments, notifications, audit trail
-- ============================================

-- ============================================
-- EXTEND ATTENDANCE TABLE
-- ============================================

-- Add status and approval columns
ALTER TABLE attendance 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' 
  CHECK (status IN ('pending', 'approved', 'rejected', 'modified'));

ALTER TABLE attendance ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES employees(id);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE attendance ADD COLUMN IF NOT EXISTS modified_by UUID REFERENCES employees(id);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS modified_at TIMESTAMPTZ;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS modification_reason TEXT;

ALTER TABLE attendance ADD COLUMN IF NOT EXISTS worked_hours DECIMAL(5,2);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS overtime_hours DECIMAL(5,2) DEFAULT 0;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_approved_by ON attendance(approved_by);
CREATE INDEX IF NOT EXISTS idx_attendance_modified_by ON attendance(modified_by);

-- ============================================
-- ATTENDANCE COMMENTS
-- ============================================

CREATE TABLE IF NOT EXISTS attendance_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  attendance_id UUID NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
  
  comment TEXT NOT NULL,
  
  -- Author
  created_by UUID NOT NULL REFERENCES employees(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Visibility
  is_internal BOOLEAN DEFAULT false, -- Only visible to managers
  
  CONSTRAINT comment_length CHECK (length(comment) > 0 AND length(comment) <= 1000)
);

CREATE INDEX IF NOT EXISTS idx_attendance_comments_attendance ON attendance_comments(attendance_id);
CREATE INDEX IF NOT EXISTS idx_attendance_comments_created_at ON attendance_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_comments_created_by ON attendance_comments(created_by);

COMMENT ON TABLE attendance_comments IS 'Comments on attendance records with public/internal visibility';
COMMENT ON COLUMN attendance_comments.is_internal IS 'Internal comments only visible to managers/admins';

-- ============================================
-- ATTENDANCE AUDIT LOG
-- ============================================

CREATE TABLE IF NOT EXISTS attendance_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  attendance_id UUID NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
  
  action TEXT NOT NULL CHECK (action IN ('approved', 'rejected', 'modified', 'commented', 'created')),
  
  -- Who did it
  performed_by UUID NOT NULL REFERENCES employees(id),
  performed_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Changes
  old_values JSONB,
  new_values JSONB,
  
  -- Reason
  reason TEXT,
  comment TEXT,
  
  -- Metadata
  ip_address INET,
  user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_log_attendance ON attendance_audit_log(attendance_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_performed_at ON attendance_audit_log(performed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_performed_by ON attendance_audit_log(performed_by);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON attendance_audit_log(action);

COMMENT ON TABLE attendance_audit_log IS 'Complete audit trail for all attendance changes';

-- ============================================
-- NOTIFICATIONS
-- ============================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- Recipient
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  
  -- Type
  type TEXT NOT NULL CHECK (type IN (
    'attendance_approved',
    'attendance_rejected', 
    'attendance_modified',
    'attendance_commented',
    'leave_approved',
    'leave_rejected',
    'leave_commented',
    'system_announcement'
  )),
  
  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Related entity
  entity_type TEXT CHECK (entity_type IN ('attendance', 'leave_request', 'system')),
  entity_id UUID,
  
  -- Actions
  action_url TEXT,
  action_label TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Priority
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  
  -- Extra data
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_notifications_employee ON notifications(employee_id) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_entity ON notifications(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority) WHERE is_read = false;

COMMENT ON TABLE notifications IS 'User notifications for various events with read tracking';

-- ============================================
-- FUNCTIONS
-- ============================================

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
  -- Get tenant_id from attendance
  SELECT tenant_id INTO v_tenant_id
  FROM attendance
  WHERE id = p_attendance_id;
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Attendance record not found';
  END IF;
  
  -- Insert notification
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

-- Log audit action function
CREATE OR REPLACE FUNCTION log_attendance_audit(
  p_attendance_id UUID,
  p_action TEXT,
  p_performed_by UUID,
  p_old_values JSONB,
  p_new_values JSONB,
  p_reason TEXT,
  p_comment TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  audit_id UUID;
  v_tenant_id UUID;
BEGIN
  -- Get tenant_id from attendance
  SELECT tenant_id INTO v_tenant_id
  FROM attendance
  WHERE id = p_attendance_id;
  
  IF v_tenant_id IS NULL THEN
    RAISE EXCEPTION 'Attendance record not found';
  END IF;
  
  -- Insert audit log
  INSERT INTO attendance_audit_log (
    tenant_id,
    attendance_id,
    action,
    performed_by,
    old_values,
    new_values,
    reason,
    comment
  ) VALUES (
    v_tenant_id,
    p_attendance_id,
    p_action,
    p_performed_by,
    p_old_values,
    p_new_values,
    p_reason,
    p_comment
  )
  RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Notify employee on status change
CREATE OR REPLACE FUNCTION notify_attendance_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Status changed to approved
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    PERFORM send_attendance_notification(
      NEW.employee_id,
      'attendance_approved',
      'Töötunnid kinnitatud',
      'Sinu töötunnid ' || NEW.date::TEXT || ' on kinnitatud.',
      NEW.id,
      jsonb_build_object(
        'approved_by', NEW.approved_by,
        'approved_at', NEW.approved_at,
        'date', NEW.date,
        'worked_hours', NEW.worked_hours
      )
    );
    
    -- Log audit
    PERFORM log_attendance_audit(
      NEW.id,
      'approved',
      NEW.approved_by,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      'Approved by manager',
      NULL
    );
  END IF;
  
  -- Status changed to rejected
  IF NEW.status = 'rejected' AND (OLD.status IS NULL OR OLD.status != 'rejected') THEN
    PERFORM send_attendance_notification(
      NEW.employee_id,
      'attendance_rejected',
      'Töötunnid tagasi lükatud',
      'Sinu töötunnid ' || NEW.date::TEXT || ' lükati tagasi. Põhjus: ' || COALESCE(NEW.rejection_reason, 'Põhjus puudub'),
      NEW.id,
      jsonb_build_object(
        'rejected_by', NEW.approved_by,
        'rejection_reason', NEW.rejection_reason,
        'date', NEW.date
      )
    );
    
    -- Log audit
    PERFORM log_attendance_audit(
      NEW.id,
      'rejected',
      NEW.approved_by,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status, 'reason', NEW.rejection_reason),
      NEW.rejection_reason,
      NULL
    );
  END IF;
  
  -- Status changed to modified
  IF NEW.status = 'modified' AND (OLD.status IS NULL OR OLD.status != 'modified') THEN
    PERFORM send_attendance_notification(
      NEW.employee_id,
      'attendance_modified',
      'Töötunde muudeti',
      'Sinu töötunde ' || NEW.date::TEXT || ' muudeti. ' || 
        COALESCE(NEW.modification_reason, 'Põhjus puudub'),
      NEW.id,
      jsonb_build_object(
        'modified_by', NEW.modified_by,
        'modified_at', NEW.modified_at,
        'reason', NEW.modification_reason,
        'old_check_in', OLD.timestamp,
        'new_check_in', NEW.timestamp,
        'old_worked_hours', OLD.worked_hours,
        'new_worked_hours', NEW.worked_hours
      )
    );
    
    -- Log audit
    PERFORM log_attendance_audit(
      NEW.id,
      'modified',
      NEW.modified_by,
      jsonb_build_object(
        'timestamp', OLD.timestamp,
        'worked_hours', OLD.worked_hours
      ),
      jsonb_build_object(
        'timestamp', NEW.timestamp,
        'worked_hours', NEW.worked_hours
      ),
      NEW.modification_reason,
      NULL
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS attendance_status_change_trigger ON attendance;

CREATE TRIGGER attendance_status_change_trigger
  AFTER UPDATE OF status ON attendance
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_attendance_status_change();

-- Notify on comment
CREATE OR REPLACE FUNCTION notify_attendance_comment()
RETURNS TRIGGER AS $$
BEGIN
  -- Get attendance employee_id and notify them (if not self and not internal)
  PERFORM send_attendance_notification(
    a.employee_id,
    'attendance_commented',
    'Uus kommentaar töötundidele',
    'Sinu töötundidele ' || a.date::TEXT || ' lisati kommentaar.',
    NEW.attendance_id,
    jsonb_build_object(
      'comment', NEW.comment,
      'commented_by', NEW.created_by,
      'is_internal', NEW.is_internal
    )
  )
  FROM attendance a
  WHERE a.id = NEW.attendance_id
    AND a.employee_id != NEW.created_by -- Don't notify self
    AND NEW.is_internal = false; -- Only notify if not internal
  
  -- Log audit
  PERFORM log_attendance_audit(
    NEW.attendance_id,
    'commented',
    NEW.created_by,
    NULL,
    NULL,
    NULL,
    NEW.comment
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS attendance_comment_trigger ON attendance_comments;

CREATE TRIGGER attendance_comment_trigger
  AFTER INSERT ON attendance_comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_attendance_comment();

-- ============================================
-- VIEWS
-- ============================================

-- Attendance with full details for managers
CREATE OR REPLACE VIEW v_attendance_management AS
SELECT 
  a.id,
  a.tenant_id,
  a.employee_id,
  e.full_name as employee_name,
  e.employee_code,
  e.department_id,
  d.name as department_name,
  e.position_id,
  pos.title as position_title,
  e.manager_id,
  mgr.full_name as manager_name,
  a.project_id,
  p.name as project_name,
  p.code as project_code,
  a.project_location_id,
  pl.name as location_name,
  
  -- Time
  a.date,
  a.type,
  a.timestamp as check_in_timestamp,
  TO_CHAR(a.timestamp, 'HH24:MI') as check_in_time,
  
  -- Get check_out from summary
  ass.check_out_time,
  TO_CHAR(ass.check_out_time, 'HH24:MI') as check_out_time_display,
  
  -- Hours
  a.worked_hours,
  ass.total_hours,
  ass.break_hours,
  ass.overtime_hours,
  a.overtime_hours as record_overtime_hours,
  
  -- Status
  a.status,
  ass.status as day_status,
  ass.is_late,
  ass.late_minutes,
  ass.is_early_out,
  ass.early_out_minutes,
  
  -- GPS
  a.latitude,
  a.longitude,
  a.is_within_geofence,
  a.distance_from_location,
  a.gps_accuracy,
  a.photo_url,
  
  -- Approval
  a.approved_by,
  approver.full_name as approved_by_name,
  a.approved_at,
  a.rejection_reason,
  
  -- Modification
  a.modified_by,
  modifier.full_name as modified_by_name,
  a.modified_at,
  a.modification_reason,
  
  -- Comments count
  (SELECT COUNT(*) FROM attendance_comments WHERE attendance_id = a.id) as comments_count,
  (SELECT COUNT(*) FROM attendance_comments WHERE attendance_id = a.id AND is_internal = false) as public_comments_count,
  
  -- Device info
  a.device_id,
  a.device_model,
  a.ip_address,
  
  -- Timestamps
  a.created_at,
  a.updated_at,
  a.synced_at,
  a.offline_recorded_at
  
FROM attendance a
JOIN employees e ON a.employee_id = e.id
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN positions pos ON e.position_id = pos.id
LEFT JOIN employees mgr ON e.manager_id = mgr.id
LEFT JOIN projects p ON a.project_id = p.id
LEFT JOIN project_locations pl ON a.project_location_id = pl.id
LEFT JOIN employees approver ON a.approved_by = approver.id
LEFT JOIN employees modifier ON a.modified_by = modifier.id
LEFT JOIN attendance_summaries ass ON a.employee_id = ass.employee_id AND a.date = ass.date
WHERE a.type = 'check_in'
  AND a.deleted_at IS NULL
  AND e.deleted_at IS NULL;

COMMENT ON VIEW v_attendance_management IS 'Complete attendance view for management with all related data';

-- Pending approvals view
CREATE OR REPLACE VIEW v_pending_attendance AS
SELECT *
FROM v_attendance_management
WHERE status = 'pending'
ORDER BY date DESC, check_in_timestamp DESC;

COMMENT ON VIEW v_pending_attendance IS 'Attendance records pending manager approval';

-- Rejected attendance view
CREATE OR REPLACE VIEW v_rejected_attendance AS
SELECT *
FROM v_attendance_management
WHERE status = 'rejected'
ORDER BY date DESC, check_in_timestamp DESC;

COMMENT ON VIEW v_rejected_attendance IS 'Rejected attendance records with reasons';

-- Modified attendance view
CREATE OR REPLACE VIEW v_modified_attendance AS
SELECT *
FROM v_attendance_management
WHERE status = 'modified'
ORDER BY modified_at DESC;

COMMENT ON VIEW v_modified_attendance IS 'Modified attendance records with audit trail';

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE attendance_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Attendance comments: own and managed employees
CREATE POLICY attendance_comments_access_policy ON attendance_comments
  FOR SELECT
  USING (
    -- Own comments
    created_by = current_setting('app.user_id', true)::UUID
    OR
    -- Comments on own attendance
    EXISTS (
      SELECT 1 FROM attendance a
      WHERE a.id = attendance_comments.attendance_id
        AND a.employee_id = current_setting('app.user_id', true)::UUID
    )
    OR
    -- Comments on managed employees' attendance
    EXISTS (
      SELECT 1 FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      WHERE a.id = attendance_comments.attendance_id
        AND e.manager_id = current_setting('app.user_id', true)::UUID
    )
  );

-- Insert comments
CREATE POLICY attendance_comments_insert_policy ON attendance_comments
  FOR INSERT
  WITH CHECK (
    -- Can comment on own or managed employees' attendance
    EXISTS (
      SELECT 1 FROM attendance a
      LEFT JOIN employees e ON a.employee_id = e.id
      WHERE a.id = attendance_comments.attendance_id
        AND (
          a.employee_id = current_setting('app.user_id', true)::UUID
          OR e.manager_id = current_setting('app.user_id', true)::UUID
        )
    )
  );

-- Notifications: own only
CREATE POLICY notifications_own_policy ON notifications
  FOR ALL
  USING (employee_id = current_setting('app.user_id', true)::UUID);

-- Audit log: view access
CREATE POLICY audit_log_view_policy ON attendance_audit_log
  FOR SELECT
  USING (
    -- Own attendance
    EXISTS (
      SELECT 1 FROM attendance a
      WHERE a.id = attendance_audit_log.attendance_id
        AND a.employee_id = current_setting('app.user_id', true)::UUID
    )
    OR
    -- Managed employees
    EXISTS (
      SELECT 1 FROM attendance a
      JOIN employees e ON a.employee_id = e.id
      WHERE a.id = attendance_audit_log.attendance_id
        AND e.manager_id = current_setting('app.user_id', true)::UUID
    )
  );

-- ============================================
-- INDEXES FOR VIEWS
-- ============================================

-- Additional indexes for better view performance
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date ON attendance(employee_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_tenant_date ON attendance(tenant_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_tenant_status ON attendance(tenant_id, status) WHERE deleted_at IS NULL;

-- ============================================
-- SAMPLE NOTIFICATIONS DATA
-- ============================================

-- This can be populated by application logic, but here's the structure
COMMENT ON COLUMN notifications.type IS 'Type of notification: attendance_approved, attendance_rejected, attendance_modified, attendance_commented, leave_approved, leave_rejected, system_announcement';
COMMENT ON COLUMN notifications.priority IS 'Notification priority: low, normal, high, urgent';
COMMENT ON COLUMN notifications.action_url IS 'URL to navigate when notification is clicked';
COMMENT ON COLUMN notifications.metadata IS 'Additional data specific to notification type';

-- ============================================
-- COMPLETE
-- ============================================

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON attendance_comments TO authenticated;
-- GRANT SELECT ON attendance_audit_log TO authenticated;
-- GRANT ALL ON notifications TO authenticated;
