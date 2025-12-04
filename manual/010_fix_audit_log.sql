-- =============================================
-- FIX AUDIT_LOG TABLE
-- =============================================
-- Run this in Supabase SQL Editor if you get:
-- "Could not find the table 'public.audit_log' in the schema cache"
-- =============================================

-- 1. Create table if not exists
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);

-- 3. Enable RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view audit log in their tenant" ON audit_log;
DROP POLICY IF EXISTS "System can insert audit log" ON audit_log;
DROP POLICY IF EXISTS "Admins can view all audit logs" ON audit_log;
DROP POLICY IF EXISTS "Admins can delete old audit logs" ON audit_log;

-- 5. Helper function (create if not exists)
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID AS $$
BEGIN
  RETURN (
    SELECT tenant_id
    FROM user_profiles
    WHERE auth_user_id = auth.uid()
    AND deleted_at IS NULL
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Helper function to check admin role
CREATE OR REPLACE FUNCTION user_has_role(required_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_profiles
    WHERE auth_user_id = auth.uid()
    AND role = required_role
    AND deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create RLS policies

-- Users can view audit logs in their tenant
CREATE POLICY "Users can view audit log in their tenant"
  ON audit_log FOR SELECT
  USING (tenant_id = get_user_tenant_id());

-- Admins can view all audit logs (fallback if tenant not set)
CREATE POLICY "Admins can view all audit logs"
  ON audit_log FOR SELECT
  USING (user_has_role('admin'));

-- System/users can insert audit logs
CREATE POLICY "System can insert audit log"
  ON audit_log FOR INSERT
  WITH CHECK (tenant_id = get_user_tenant_id() OR user_has_role('admin'));

-- Admins can delete old audit logs
CREATE POLICY "Admins can delete old audit logs"
  ON audit_log FOR DELETE
  USING (user_has_role('admin'));

-- 8. Grant permissions to authenticated users
GRANT SELECT, INSERT ON audit_log TO authenticated;
GRANT DELETE ON audit_log TO authenticated;

-- 9. Verify table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_log' AND table_schema = 'public') THEN
    RAISE NOTICE 'SUCCESS: audit_log table exists and is ready!';
  ELSE
    RAISE EXCEPTION 'ERROR: audit_log table was not created!';
  END IF;
END $$;

-- 10. Insert a test log entry (optional - uncomment to test)
-- INSERT INTO audit_log (tenant_id, action, entity_type, entity_id)
-- SELECT get_user_tenant_id(), 'test', 'system', uuid_generate_v4()
-- WHERE get_user_tenant_id() IS NOT NULL;
