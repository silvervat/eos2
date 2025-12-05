-- =============================================
-- TABLE CONFIGURATIONS SYSTEM
-- =============================================
-- Version: 1.0.0
-- Date: 2024-12-05
-- Description: Store custom table configurations and feature toggles
-- =============================================

-- =============================================
-- TABLE CONFIGURATIONS
-- =============================================
CREATE TABLE IF NOT EXISTS table_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
  table_id TEXT NOT NULL,

  -- Feature toggles (stored as JSONB for flexibility)
  features JSONB DEFAULT '{}',
  /*
  {
    "pagination": true,
    "search": true,
    "sorting": true,
    "filtering": true,
    "inline_edit": false,
    "export_csv": true,
    ...
  }
  */

  -- Column customizations
  columns JSONB DEFAULT '{}',
  /*
  {
    "name": { "visible": true, "width": 200, "order": 1 },
    "status": { "visible": true, "width": 100, "order": 2 },
    ...
  }
  */

  -- View preferences
  default_view JSONB DEFAULT '{}',
  /*
  {
    "pageSize": 25,
    "sortColumn": "created_at",
    "sortDirection": "desc",
    "filters": []
  }
  */

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_by UUID,

  -- Each tenant can have one config per table
  UNIQUE(tenant_id, table_id)
);

-- Index for quick lookup
CREATE INDEX idx_table_configurations_tenant ON table_configurations(tenant_id);
CREATE INDEX idx_table_configurations_table ON table_configurations(table_id);

-- For global configs (no tenant)
CREATE UNIQUE INDEX idx_table_configurations_global
  ON table_configurations(table_id)
  WHERE tenant_id IS NULL;

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE table_configurations ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read configs
CREATE POLICY "read_table_configurations" ON table_configurations
  FOR SELECT
  USING (
    tenant_id IS NULL
    OR tenant_id = get_user_tenant_id()
  );

-- Only admins can modify configs
CREATE POLICY "modify_table_configurations" ON table_configurations
  FOR ALL
  USING (
    tenant_id IS NULL
    OR tenant_id = get_user_tenant_id()
  );

-- =============================================
-- TRIGGERS
-- =============================================
CREATE TRIGGER update_table_configurations_updated_at
  BEFORE UPDATE ON table_configurations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- INITIAL DATA (Global defaults can be added here)
-- =============================================
-- No initial data needed - defaults are in the table registry
