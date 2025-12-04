# ⏰ TÖÖTUNDIDE HALDUSSÜSTEEM
## Kinnitamine, Kommentaarid, Teavitused

---

## 🎯 NÕUDED

### 1. Põhifunktsionaalsus
- ✅ Töötundide vaatamine ja kinnitamine
- ✅ Kommentaaride lisamine
- ✅ Teavitused töötajatele muudatuste kohta
- ✅ Kompaktne tabel
- ✅ Otsing, sortimine, filtreerimine, grupeerimine
- ✅ Audit trail (kes, mida, millal muutis)

### 2. Õigused
- **Owner/Admin:** Kõik tunnid, kõik toimingud
- **Manager:** Oma meeskonna tunnid
- **User:** Ainult oma tunnid (read-only)

### 3. Töövoog
```
Töötaja check-in/out
    ↓
Attendance record loodud (status: pending)
    ↓
Manager/Admin vaatab tabelit
    ↓
Kinnitab/Tagasi lükkab/Kommenteerib
    ↓
Töötaja saab teavituse
```

---

## 📊 ANDMEBAASI SKEEM

### 1. Laienda attendance tabelit

```sql
-- ============================================
-- ATTENDANCE TABLE EXTENSIONS
-- ============================================

-- Lisa puuduvad veerud
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' 
  CHECK (status IN ('pending', 'approved', 'rejected', 'modified'));

ALTER TABLE attendance ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES employees(id);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

ALTER TABLE attendance ADD COLUMN IF NOT EXISTS modified_by UUID REFERENCES employees(id);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS modified_at TIMESTAMPTZ;
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS modification_reason TEXT;

ALTER TABLE attendance ADD COLUMN IF NOT EXISTS worked_hours DECIMAL(5,2);
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS overtime_hours DECIMAL(5,2) DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_approved_by ON attendance(approved_by);

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
  
  -- Metadata
  is_internal BOOLEAN DEFAULT false, -- Nähtav ainult juhtidele
  
  CONSTRAINT comment_length CHECK (length(comment) > 0 AND length(comment) <= 1000)
);

CREATE INDEX idx_attendance_comments_attendance ON attendance_comments(attendance_id);
CREATE INDEX idx_attendance_comments_created_at ON attendance_comments(created_at DESC);

-- ============================================
-- ATTENDANCE AUDIT LOG
-- ============================================

CREATE TABLE IF NOT EXISTS attendance_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  attendance_id UUID NOT NULL REFERENCES attendance(id) ON DELETE CASCADE,
  
  action TEXT NOT NULL, -- 'approved', 'rejected', 'modified', 'commented'
  
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

CREATE INDEX idx_audit_log_attendance ON attendance_audit_log(attendance_id);
CREATE INDEX idx_audit_log_performed_at ON attendance_audit_log(performed_at DESC);

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
    'leave_rejected'
  )),
  
  -- Content
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  
  -- Related entity
  entity_type TEXT, -- 'attendance', 'leave_request'
  entity_id UUID,
  
  -- Actions
  action_url TEXT,
  
  -- Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Extra data
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_notifications_employee ON notifications(employee_id) WHERE is_read = false;
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_entity ON notifications(entity_type, entity_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Send notification
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
BEGIN
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
  )
  SELECT
    a.tenant_id,
    p_employee_id,
    p_type,
    p_title,
    p_message,
    'attendance',
    p_attendance_id,
    '/personnel/attendance?id=' || p_attendance_id,
    p_metadata
  FROM attendance a
  WHERE a.id = p_attendance_id
  RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- Log audit action
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
BEGIN
  INSERT INTO attendance_audit_log (
    tenant_id,
    attendance_id,
    action,
    performed_by,
    old_values,
    new_values,
    reason,
    comment
  )
  SELECT
    a.tenant_id,
    p_attendance_id,
    p_action,
    p_performed_by,
    p_old_values,
    p_new_values,
    p_reason,
    p_comment
  FROM attendance a
  WHERE a.id = p_attendance_id
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
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    PERFORM send_attendance_notification(
      NEW.employee_id,
      'attendance_approved',
      'Töötunnid kinnitatud',
      'Sinu töötunnid ' || NEW.date::TEXT || ' on kinnitatud.',
      NEW.id,
      jsonb_build_object(
        'approved_by', NEW.approved_by,
        'approved_at', NEW.approved_at
      )
    );
    
    -- Log audit
    PERFORM log_attendance_audit(
      NEW.id,
      'approved',
      NEW.approved_by,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status),
      'Approved by manager'
    );
  END IF;
  
  -- Status changed to rejected
  IF NEW.status = 'rejected' AND OLD.status != 'rejected' THEN
    PERFORM send_attendance_notification(
      NEW.employee_id,
      'attendance_rejected',
      'Töötunnid tagasi lükatud',
      'Sinu töötunnid ' || NEW.date::TEXT || ' lükati tagasi. Põhjus: ' || COALESCE(NEW.rejection_reason, 'Põhjus puudub'),
      NEW.id,
      jsonb_build_object(
        'rejected_by', NEW.approved_by,
        'rejection_reason', NEW.rejection_reason
      )
    );
    
    -- Log audit
    PERFORM log_attendance_audit(
      NEW.id,
      'rejected',
      NEW.approved_by,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status, 'reason', NEW.rejection_reason),
      NEW.rejection_reason
    );
  END IF;
  
  -- Status changed to modified
  IF NEW.status = 'modified' AND OLD.status != 'modified' THEN
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
        'old_check_in', OLD.check_in_time,
        'new_check_in', NEW.check_in_time,
        'old_check_out', OLD.check_out_time,
        'new_check_out', NEW.check_out_time
      )
    );
    
    -- Log audit
    PERFORM log_attendance_audit(
      NEW.id,
      'modified',
      NEW.modified_by,
      jsonb_build_object(
        'check_in_time', OLD.check_in_time,
        'check_out_time', OLD.check_out_time,
        'worked_hours', OLD.worked_hours
      ),
      jsonb_build_object(
        'check_in_time', NEW.check_in_time,
        'check_out_time', NEW.check_out_time,
        'worked_hours', NEW.worked_hours
      ),
      NEW.modification_reason
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER attendance_status_change_trigger
  AFTER UPDATE OF status ON attendance
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION notify_attendance_status_change();

-- Notify on comment
CREATE OR REPLACE FUNCTION notify_attendance_comment()
RETURNS TRIGGER AS $$
BEGIN
  -- Get attendance employee_id and notify them
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
  a.project_id,
  p.name as project_name,
  a.project_location_id,
  pl.name as location_name,
  
  -- Time
  a.date,
  a.timestamp as check_in_timestamp,
  DATE_PART('hour', a.timestamp) || ':' || LPAD(DATE_PART('minute', a.timestamp)::TEXT, 2, '0') as check_in_time,
  
  -- Get check_out from attendance_summaries
  ass.check_out_time,
  DATE_PART('hour', ass.check_out_time) || ':' || LPAD(DATE_PART('minute', ass.check_out_time)::TEXT, 2, '0') as check_out_time_display,
  
  -- Hours
  ass.total_hours as worked_hours,
  ass.break_hours,
  ass.overtime_hours,
  
  -- Status
  a.status,
  ass.status as day_status,
  ass.is_late,
  ass.late_minutes,
  
  -- GPS
  a.latitude,
  a.longitude,
  a.is_within_geofence,
  a.distance_from_location,
  
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
  
  -- Timestamps
  a.created_at,
  a.updated_at
  
FROM attendance a
JOIN employees e ON a.employee_id = e.id
LEFT JOIN departments d ON e.department_id = d.id
LEFT JOIN positions pos ON e.position_id = pos.id
LEFT JOIN projects p ON a.project_id = p.id
LEFT JOIN project_locations pl ON a.project_location_id = pl.id
LEFT JOIN employees approver ON a.approved_by = approver.id
LEFT JOIN employees modifier ON a.modified_by = modifier.id
LEFT JOIN attendance_summaries ass ON a.employee_id = ass.employee_id AND a.date = ass.date
WHERE a.type = 'check_in'
  AND a.deleted_at IS NULL
  AND e.deleted_at IS NULL;

-- Pending approvals view
CREATE OR REPLACE VIEW v_pending_attendance AS
SELECT *
FROM v_attendance_management
WHERE status = 'pending'
ORDER BY date DESC, check_in_timestamp DESC;

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE attendance_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Attendance comments: own and managed
CREATE POLICY attendance_comments_access_policy ON attendance_comments
  FOR SELECT
  USING (
    created_by = current_setting('app.user_id', true)::UUID
    OR EXISTS (
      SELECT 1 FROM attendance a
      WHERE a.id = attendance_comments.attendance_id
        AND (
          a.employee_id = current_setting('app.user_id', true)::UUID
          OR EXISTS (
            SELECT 1 FROM employees e
            WHERE e.id = a.employee_id
              AND e.manager_id = current_setting('app.user_id', true)::UUID
          )
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
    EXISTS (
      SELECT 1 FROM attendance a
      WHERE a.id = attendance_audit_log.attendance_id
        AND (
          a.employee_id = current_setting('app.user_id', true)::UUID
          OR EXISTS (
            SELECT 1 FROM employees e
            WHERE e.id = a.employee_id
              AND e.manager_id = current_setting('app.user_id', true)::UUID
          )
        )
    )
  );

-- ============================================
-- SAMPLE DATA
-- ============================================

COMMENT ON TABLE attendance_comments IS 'Comments on attendance records';
COMMENT ON TABLE attendance_audit_log IS 'Audit trail for attendance changes';
COMMENT ON TABLE notifications IS 'User notifications for various events';
COMMENT ON VIEW v_attendance_management IS 'Full attendance details for management';
COMMENT ON VIEW v_pending_attendance IS 'Attendance records pending approval';
```

---

## 🔌 API ENDPOINTS

### 1. Attendance Management API

**Fail:** `apps/web/src/app/api/personnel/work-hours/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/personnel/work-hours
// Filters: employeeId, startDate, endDate, status, projectId, departmentId
export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { searchParams } = new URL(request.url);
  
  const employeeId = searchParams.get('employeeId');
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const status = searchParams.get('status');
  const projectId = searchParams.get('projectId');
  const departmentId = searchParams.get('departmentId');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '50');
  
  let query = supabase
    .from('v_attendance_management')
    .select('*', { count: 'exact' });
  
  // Filters
  if (employeeId) query = query.eq('employee_id', employeeId);
  if (startDate) query = query.gte('date', startDate);
  if (endDate) query = query.lte('date', endDate);
  if (status) query = query.eq('status', status);
  if (projectId) query = query.eq('project_id', projectId);
  if (departmentId) query = query.eq('department_id', departmentId);
  
  // Pagination
  const offset = (page - 1) * limit;
  query = query
    .order('date', { ascending: false })
    .order('check_in_timestamp', { ascending: false })
    .range(offset, offset + limit - 1);
  
  const { data, error, count } = await query;
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  return NextResponse.json({
    data,
    pagination: {
      page,
      limit,
      total: count,
      pages: Math.ceil((count || 0) / limit),
    },
  });
}
```

### 2. Approve/Reject API

**Fail:** `apps/web/src/app/api/personnel/work-hours/[id]/approve/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/personnel/work-hours/[id]/approve
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const body = await request.json();
  
  const { comment } = body;
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Update attendance
  const { data, error } = await supabase
    .from('attendance')
    .update({
      status: 'approved',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  // Add comment if provided
  if (comment) {
    await supabase.from('attendance_comments').insert({
      attendance_id: params.id,
      comment,
      created_by: user.id,
      is_internal: false,
    });
  }
  
  return NextResponse.json(data);
}
```

**Fail:** `apps/web/src/app/api/personnel/work-hours/[id]/reject/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// POST /api/personnel/work-hours/[id]/reject
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const body = await request.json();
  
  const { reason } = body;
  
  if (!reason) {
    return NextResponse.json(
      { error: 'Rejection reason is required' },
      { status: 400 }
    );
  }
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Update attendance
  const { data, error } = await supabase
    .from('attendance')
    .update({
      status: 'rejected',
      approved_by: user.id,
      approved_at: new Date().toISOString(),
      rejection_reason: reason,
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

### 3. Modify API

**Fail:** `apps/web/src/app/api/personnel/work-hours/[id]/modify/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// PATCH /api/personnel/work-hours/[id]/modify
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const body = await request.json();
  
  const { checkInTime, checkOutTime, workedHours, reason } = body;
  
  if (!reason) {
    return NextResponse.json(
      { error: 'Modification reason is required' },
      { status: 400 }
    );
  }
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Update attendance
  const { data, error } = await supabase
    .from('attendance')
    .update({
      check_in_time: checkInTime,
      check_out_time: checkOutTime,
      worked_hours: workedHours,
      status: 'modified',
      modified_by: user.id,
      modified_at: new Date().toISOString(),
      modification_reason: reason,
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

### 4. Comments API

**Fail:** `apps/web/src/app/api/personnel/work-hours/[id]/comments/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/personnel/work-hours/[id]/comments
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('attendance_comments')
    .select(`
      *,
      author:employees!created_by(
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('attendance_id', params.id)
    .order('created_at', { ascending: false });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  return NextResponse.json(data);
}

// POST /api/personnel/work-hours/[id]/comments
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  const body = await request.json();
  
  const { comment, isInternal } = body;
  
  if (!comment || comment.trim().length === 0) {
    return NextResponse.json(
      { error: 'Comment cannot be empty' },
      { status: 400 }
    );
  }
  
  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Insert comment
  const { data, error } = await supabase
    .from('attendance_comments')
    .insert({
      attendance_id: params.id,
      comment: comment.trim(),
      created_by: user.id,
      is_internal: isInternal || false,
    })
    .select()
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  return NextResponse.json(data, { status: 201 });
}
```

### 5. Audit Log API

**Fail:** `apps/web/src/app/api/personnel/work-hours/[id]/audit/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/personnel/work-hours/[id]/audit
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('attendance_audit_log')
    .select(`
      *,
      performer:employees!performed_by(
        id,
        full_name,
        avatar_url
      )
    `)
    .eq('attendance_id', params.id)
    .order('performed_at', { ascending: false });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  
  return NextResponse.json(data);
}
```

---

## 🎨 FRONTEND KOMPONENDID

### 1. Work Hours Table (Põhikomponent)

**Fail:** `apps/web/src/components/personnel/WorkHoursTable.tsx`

```typescript
'use client';

import { useState, useMemo } from 'react';
import { 
  Table, 
  Button, 
  Tag, 
  Space, 
  Dropdown, 
  Input,
  Select,
  DatePicker,
  Badge,
  Tooltip,
  message
} from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  EditOutlined,
  CommentOutlined,
  HistoryOutlined,
  FilterOutlined,
  DownloadOutlined,
  MoreOutlined,
} from '@ant-design/icons';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { formatDistanceToNow } from 'date-fns';
import { et } from 'date-fns/locale';

interface WorkHour {
  id: string;
  employee_name: string;
  employee_code: string;
  department_name: string;
  project_name: string;
  location_name: string;
  date: string;
  check_in_time: string;
  check_out_time_display: string;
  worked_hours: number;
  overtime_hours: number;
  status: 'pending' | 'approved' | 'rejected' | 'modified';
  is_late: boolean;
  late_minutes: number;
  is_within_geofence: boolean;
  approved_by_name: string;
  approved_at: string;
  rejection_reason: string;
  modification_reason: string;
  comments_count: number;
}

interface WorkHoursTableProps {
  onApprove: (id: string, comment?: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
  onModify: (id: string, data: any) => Promise<void>;
  onViewComments: (id: string) => void;
  onViewAudit: (id: string) => void;
}

export function WorkHoursTable({
  onApprove,
  onReject,
  onModify,
  onViewComments,
  onViewAudit,
}: WorkHoursTableProps) {
  const [data, setData] = useState<WorkHour[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    department: 'all',
    project: 'all',
    startDate: null,
    endDate: null,
  });
  
  // Pagination
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 50,
    total: 0,
  });

  // Status config
  const statusConfig = {
    pending: { 
      label: 'Ootel', 
      color: 'orange',
      icon: <ClockCircleOutlined />
    },
    approved: { 
      label: 'Kinnitatud', 
      color: 'green',
      icon: <CheckCircleOutlined />
    },
    rejected: { 
      label: 'Tagasi lükatud', 
      color: 'red',
      icon: <CloseCircleOutlined />
    },
    modified: { 
      label: 'Muudetud', 
      color: 'blue',
      icon: <EditOutlined />
    },
  };

  // Columns definition - KOMPAKTNE!
  const columns: ColumnsType<WorkHour> = [
    {
      title: 'Kuupäev',
      dataIndex: 'date',
      key: 'date',
      width: 110,
      fixed: 'left',
      sorter: true,
      render: (date: string) => (
        <div className="text-sm">
          {new Date(date).toLocaleDateString('et-EE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })}
        </div>
      ),
    },
    {
      title: 'Töötaja',
      key: 'employee',
      width: 200,
      fixed: 'left',
      sorter: true,
      render: (_, record) => (
        <div>
          <div className="font-medium text-sm">{record.employee_name}</div>
          <div className="text-xs text-gray-500">{record.employee_code}</div>
        </div>
      ),
    },
    {
      title: 'Osakond',
      dataIndex: 'department_name',
      key: 'department',
      width: 120,
      filters: [], // Populate dynamically
      render: (dept: string) => (
        <Tag className="text-xs">{dept}</Tag>
      ),
    },
    {
      title: 'Projekt',
      key: 'project',
      width: 150,
      render: (_, record) => (
        <div className="text-xs">
          <div className="font-medium">{record.project_name || '-'}</div>
          {record.location_name && (
            <div className="text-gray-500">{record.location_name}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Saabumine',
      dataIndex: 'check_in_time',
      key: 'check_in',
      width: 80,
      sorter: true,
      render: (time: string, record) => (
        <div className="text-sm">
          {time}
          {record.is_late && (
            <Tooltip title={`Hilines ${record.late_minutes} min`}>
              <Badge status="error" className="ml-2" />
            </Tooltip>
          )}
        </div>
      ),
    },
    {
      title: 'Lahkumine',
      dataIndex: 'check_out_time_display',
      key: 'check_out',
      width: 80,
      render: (time: string) => (
        <div className="text-sm">{time || '-'}</div>
      ),
    },
    {
      title: 'Tunnid',
      key: 'hours',
      width: 100,
      sorter: true,
      render: (_, record) => (
        <div className="text-sm">
          <div className="font-medium">{record.worked_hours?.toFixed(1) || '0.0'}h</div>
          {record.overtime_hours > 0 && (
            <div className="text-xs text-orange-600">
              +{record.overtime_hours.toFixed(1)}h ületunne
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'GPS',
      key: 'gps',
      width: 60,
      align: 'center',
      render: (_, record) => (
        <Tooltip title={record.is_within_geofence ? 'GPS OK' : 'Väljaspool piirkonda'}>
          <Badge 
            status={record.is_within_geofence ? 'success' : 'error'} 
          />
        </Tooltip>
      ),
    },
    {
      title: 'Staatus',
      dataIndex: 'status',
      key: 'status',
      width: 120,
      filters: [
        { text: 'Ootel', value: 'pending' },
        { text: 'Kinnitatud', value: 'approved' },
        { text: 'Tagasi lükatud', value: 'rejected' },
        { text: 'Muudetud', value: 'modified' },
      ],
      render: (status: string) => (
        <Tag 
          color={statusConfig[status].color}
          icon={statusConfig[status].icon}
          className="text-xs"
        >
          {statusConfig[status].label}
        </Tag>
      ),
    },
    {
      title: 'Kinnitaja',
      key: 'approver',
      width: 140,
      render: (_, record) => {
        if (!record.approved_by_name) return '-';
        return (
          <div className="text-xs">
            <div>{record.approved_by_name}</div>
            <div className="text-gray-500">
              {formatDistanceToNow(new Date(record.approved_at), {
                addSuffix: true,
                locale: et,
              })}
            </div>
          </div>
        );
      },
    },
    {
      title: '',
      key: 'comments',
      width: 60,
      align: 'center',
      render: (_, record) => (
        <Badge count={record.comments_count} size="small">
          <Button
            type="text"
            size="small"
            icon={<CommentOutlined />}
            onClick={() => onViewComments(record.id)}
          />
        </Badge>
      ),
    },
    {
      title: 'Tegevused',
      key: 'actions',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          {record.status === 'pending' && (
            <>
              <Tooltip title="Kinnita">
                <Button
                  type="primary"
                  size="small"
                  icon={<CheckCircleOutlined />}
                  onClick={() => handleQuickApprove(record.id)}
                  style={{ backgroundColor: '#52c41a' }}
                />
              </Tooltip>
              <Tooltip title="Lükka tagasi">
                <Button
                  danger
                  size="small"
                  icon={<CloseCircleOutlined />}
                  onClick={() => handleRejectClick(record.id)}
                />
              </Tooltip>
            </>
          )}
          
          <Dropdown
            menu={{
              items: [
                {
                  key: 'edit',
                  label: 'Muuda',
                  icon: <EditOutlined />,
                  onClick: () => handleModifyClick(record.id),
                },
                {
                  key: 'comments',
                  label: 'Kommentaarid',
                  icon: <CommentOutlined />,
                  onClick: () => onViewComments(record.id),
                },
                {
                  key: 'history',
                  label: 'Ajalugu',
                  icon: <HistoryOutlined />,
                  onClick: () => onViewAudit(record.id),
                },
              ],
            }}
            trigger={['click']}
          >
            <Button size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  const handleQuickApprove = async (id: string) => {
    try {
      await onApprove(id);
      message.success('Kinnitatud!');
      loadData();
    } catch (error) {
      message.error('Kinnitamine ebaõnnestus');
    }
  };

  const handleRejectClick = (id: string) => {
    // Open rejection dialog
    // Implementation in parent component
  };

  const handleModifyClick = (id: string) => {
    // Open modification dialog
    // Implementation in parent component
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.current.toString(),
        limit: pagination.pageSize.toString(),
        ...filters,
      });
      
      const response = await fetch(`/api/personnel/work-hours?${params}`);
      const result = await response.json();
      
      setData(result.data);
      setPagination({
        ...pagination,
        total: result.pagination.total,
      });
    } catch (error) {
      message.error('Andmete laadimine ebaõnnestus');
    } finally {
      setLoading(false);
    }
  };

  // Bulk actions
  const handleBulkApprove = async () => {
    // Approve all selected
  };

  return (
    <div className="space-y-4">
      {/* Filters Bar - KOMPAKTNE */}
      <div className="flex flex-wrap gap-3 items-center bg-white p-4 rounded-lg border">
        <Input.Search
          placeholder="Otsi töötajat..."
          style={{ width: 250 }}
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          onSearch={loadData}
        />
        
        <Select
          style={{ width: 150 }}
          value={filters.status}
          onChange={(value) => setFilters({ ...filters, status: value })}
        >
          <Select.Option value="all">Kõik staatused</Select.Option>
          <Select.Option value="pending">Ootel</Select.Option>
          <Select.Option value="approved">Kinnitatud</Select.Option>
          <Select.Option value="rejected">Tagasi lükatud</Select.Option>
          <Select.Option value="modified">Muudetud</Select.Option>
        </Select>
        
        <DatePicker.RangePicker
          format="DD.MM.YYYY"
          onChange={(dates) => {
            setFilters({
              ...filters,
              startDate: dates?.[0]?.toISOString() || null,
              endDate: dates?.[1]?.toISOString() || null,
            });
          }}
        />
        
        <Button 
          icon={<FilterOutlined />} 
          onClick={loadData}
        >
          Filtreeri
        </Button>
        
        <Button 
          icon={<DownloadOutlined />}
        >
          Ekspordi
        </Button>
        
        {selectedRowKeys.length > 0 && (
          <div className="ml-auto flex gap-2">
            <span className="text-sm text-gray-600">
              {selectedRowKeys.length} valitud
            </span>
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={handleBulkApprove}
            >
              Kinnita kõik
            </Button>
          </div>
        )}
      </div>

      {/* Table - KOMPAKTNE */}
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        rowKey="id"
        size="small"
        scroll={{ x: 1500, y: 600 }}
        pagination={{
          ...pagination,
          showSizeChanger: true,
          showTotal: (total) => `Kokku ${total} kirjet`,
          pageSizeOptions: ['20', '50', '100', '200'],
        }}
        onChange={loadData}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
          getCheckboxProps: (record) => ({
            disabled: record.status !== 'pending',
          }),
        }}
        rowClassName={(record) => {
          if (record.status === 'pending') return 'bg-orange-50';
          if (record.status === 'rejected') return 'bg-red-50';
          return '';
        }}
      />
    </div>
  );
}
```

Jätkan järgmises osas koos dialoogide, kommentaaride ja teavitustega...

---

**Failid on loodud. Kas jätkan ülejäänud komponentide ja dialoogidega? 🚀**
