-- =============================================
-- FIX MISSING TABLES AND COLUMNS
-- =============================================
-- Version: 1.0.0
-- Date: 2024-12-05
-- Description: Ensure all tables and columns exist
-- =============================================

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- AUDIT_LOG TABLE (for system logs)
-- =============================================
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID,
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address TEXT,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_audit_log_tenant ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);

-- =============================================
-- QUOTE_UNITS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS quote_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  name_plural TEXT,
  symbol TEXT,
  is_default BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'quantity',
  base_unit_id UUID REFERENCES quote_units(id),
  conversion_factor DECIMAL(20,10) DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_quote_units_tenant ON quote_units(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_quote_units_category ON quote_units(category) WHERE deleted_at IS NULL;

-- Create unique constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'quote_units_tenant_id_code_key') THEN
    ALTER TABLE quote_units ADD CONSTRAINT quote_units_tenant_id_code_key UNIQUE (tenant_id, code);
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- =============================================
-- ENSURE PROJECTS TABLE HAS ALL COLUMNS
-- =============================================
DO $$
BEGIN
  -- Add created_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE projects ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Add updated_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE projects ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;

  -- Add deleted_at if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'deleted_at'
  ) THEN
    ALTER TABLE projects ADD COLUMN deleted_at TIMESTAMPTZ;
  END IF;

  -- Add type column if missing (for project types: PTV, Montaaž, Müük, etc.)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'type'
  ) THEN
    ALTER TABLE projects ADD COLUMN type TEXT DEFAULT 'general';
  END IF;
END $$;

-- =============================================
-- INSERT DEFAULT QUOTE UNITS (for each tenant)
-- =============================================
INSERT INTO quote_units (tenant_id, code, name, name_plural, symbol, category, is_default)
SELECT t.id, 'tk', 'Tükk', 'Tükki', 'tk', 'quantity', true
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM quote_units qu WHERE qu.tenant_id = t.id AND qu.code = 'tk'
)
ON CONFLICT DO NOTHING;

INSERT INTO quote_units (tenant_id, code, name, name_plural, symbol, category, is_default)
SELECT t.id, 'm', 'Meeter', 'Meetrit', 'm', 'length', false
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM quote_units qu WHERE qu.tenant_id = t.id AND qu.code = 'm'
)
ON CONFLICT DO NOTHING;

INSERT INTO quote_units (tenant_id, code, name, name_plural, symbol, category, is_default)
SELECT t.id, 'm2', 'Ruutmeeter', 'Ruutmeetrit', 'm²', 'area', false
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM quote_units qu WHERE qu.tenant_id = t.id AND qu.code = 'm2'
)
ON CONFLICT DO NOTHING;

INSERT INTO quote_units (tenant_id, code, name, name_plural, symbol, category, is_default)
SELECT t.id, 'm3', 'Kuupmeeter', 'Kuupmeetrit', 'm³', 'volume', false
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM quote_units qu WHERE qu.tenant_id = t.id AND qu.code = 'm3'
)
ON CONFLICT DO NOTHING;

INSERT INTO quote_units (tenant_id, code, name, name_plural, symbol, category, is_default)
SELECT t.id, 'kg', 'Kilogramm', 'Kilogrammi', 'kg', 'weight', false
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM quote_units qu WHERE qu.tenant_id = t.id AND qu.code = 'kg'
)
ON CONFLICT DO NOTHING;

INSERT INTO quote_units (tenant_id, code, name, name_plural, symbol, category, is_default)
SELECT t.id, 'h', 'Tund', 'Tundi', 'h', 'time', false
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM quote_units qu WHERE qu.tenant_id = t.id AND qu.code = 'h'
)
ON CONFLICT DO NOTHING;

INSERT INTO quote_units (tenant_id, code, name, name_plural, symbol, category, is_default)
SELECT t.id, 'km', 'Kilomeeter', 'Kilomeetrit', 'km', 'length', false
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM quote_units qu WHERE qu.tenant_id = t.id AND qu.code = 'km'
)
ON CONFLICT DO NOTHING;

INSERT INTO quote_units (tenant_id, code, name, name_plural, symbol, category, is_default)
SELECT t.id, 'l', 'Liiter', 'Liitrit', 'l', 'volume', false
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM quote_units qu WHERE qu.tenant_id = t.id AND qu.code = 'l'
)
ON CONFLICT DO NOTHING;

INSERT INTO quote_units (tenant_id, code, name, name_plural, symbol, category, is_default)
SELECT t.id, 'kmpl', 'Komplekt', 'Komplekti', 'kmpl', 'quantity', false
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM quote_units qu WHERE qu.tenant_id = t.id AND qu.code = 'kmpl'
)
ON CONFLICT DO NOTHING;

INSERT INTO quote_units (tenant_id, code, name, name_plural, symbol, category, is_default)
SELECT t.id, 'pk', 'Pakk', 'Pakki', 'pk', 'quantity', false
FROM tenants t
WHERE NOT EXISTS (
  SELECT 1 FROM quote_units qu WHERE qu.tenant_id = t.id AND qu.code = 'pk'
)
ON CONFLICT DO NOTHING;

-- =============================================
-- RLS POLICIES FOR AUDIT_LOG
-- =============================================
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log_tenant_isolation" ON audit_log;
CREATE POLICY "audit_log_tenant_isolation" ON audit_log
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles
      WHERE auth_user_id = auth.uid()
    )
    OR tenant_id IS NULL
  );

DROP POLICY IF EXISTS "audit_log_insert" ON audit_log;
CREATE POLICY "audit_log_insert" ON audit_log
  FOR INSERT
  WITH CHECK (true);

-- =============================================
-- RLS POLICIES FOR QUOTE_UNITS
-- =============================================
ALTER TABLE quote_units ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "quote_units_tenant_isolation" ON quote_units;
CREATE POLICY "quote_units_tenant_isolation" ON quote_units
  FOR ALL
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles
      WHERE auth_user_id = auth.uid()
    )
  );

-- =============================================
-- TRIGGER FOR QUOTE_UNITS UPDATED_AT
-- =============================================
DROP TRIGGER IF EXISTS update_quote_units_updated_at ON quote_units;
CREATE TRIGGER update_quote_units_updated_at BEFORE UPDATE ON quote_units
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- GRANT PERMISSIONS
-- =============================================
GRANT ALL ON audit_log TO authenticated;
GRANT ALL ON quote_units TO authenticated;
