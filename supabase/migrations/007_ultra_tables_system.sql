-- Ultra Tables System Migration
-- Creates the complete ultra tables infrastructure for custom table management

-- ============================================
-- TABLES
-- ============================================

-- Ultra Tables - Table definitions
CREATE TABLE IF NOT EXISTS ultra_tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '📊',
  color TEXT DEFAULT '#3B82F6',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),

  -- Settings
  settings JSONB DEFAULT '{}'::jsonb,

  CONSTRAINT ultra_tables_name_check CHECK (length(name) > 0)
);

-- Ultra Columns - Column definitions for each table
CREATE TABLE IF NOT EXISTS ultra_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES ultra_tables(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'text', 'number', 'dropdown', 'status', etc.

  -- Position & Display
  position INTEGER NOT NULL DEFAULT 0,
  width INTEGER DEFAULT 150,

  -- Configuration (dropdown options, validation rules, etc.)
  config JSONB DEFAULT '{}'::jsonb,

  -- Constraints
  required BOOLEAN DEFAULT FALSE,
  unique_values BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT ultra_columns_name_check CHECK (length(name) > 0)
);

-- Ultra Views - Saved views for each table (Grid, Kanban, Calendar, etc.)
CREATE TABLE IF NOT EXISTS ultra_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES ultra_tables(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'grid', -- 'grid', 'kanban', 'calendar', 'gallery', 'form'

  -- Configuration
  config JSONB DEFAULT '{}'::jsonb,

  -- Filters, sorts, groups
  filters JSONB DEFAULT '[]'::jsonb,
  sorts JSONB DEFAULT '[]'::jsonb,
  groups JSONB DEFAULT '[]'::jsonb,

  -- Visibility
  is_default BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,

  -- Position
  position INTEGER NOT NULL DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Ultra Records - Row data (dynamic structure via JSONB)
CREATE TABLE IF NOT EXISTS ultra_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id UUID NOT NULL REFERENCES ultra_tables(id) ON DELETE CASCADE,

  -- Dynamic columns stored as JSONB
  data JSONB DEFAULT '{}'::jsonb,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id),

  -- Position (for ordering)
  position REAL DEFAULT 0
);

-- ============================================
-- INDEXES
-- ============================================

-- Ultra Tables indexes
CREATE INDEX IF NOT EXISTS idx_ultra_tables_tenant ON ultra_tables(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ultra_tables_created_at ON ultra_tables(created_at DESC);

-- Ultra Columns indexes
CREATE INDEX IF NOT EXISTS idx_ultra_columns_table ON ultra_columns(table_id);
CREATE INDEX IF NOT EXISTS idx_ultra_columns_position ON ultra_columns(table_id, position);

-- Ultra Views indexes
CREATE INDEX IF NOT EXISTS idx_ultra_views_table ON ultra_views(table_id);
CREATE INDEX IF NOT EXISTS idx_ultra_views_default ON ultra_views(table_id, is_default) WHERE is_default = true;

-- Ultra Records indexes
CREATE INDEX IF NOT EXISTS idx_ultra_records_table ON ultra_records(table_id);
CREATE INDEX IF NOT EXISTS idx_ultra_records_data ON ultra_records USING gin(data);
CREATE INDEX IF NOT EXISTS idx_ultra_records_position ON ultra_records(table_id, position);
CREATE INDEX IF NOT EXISTS idx_ultra_records_created_at ON ultra_records(table_id, created_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE ultra_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE ultra_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ultra_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE ultra_records ENABLE ROW LEVEL SECURITY;

-- Ultra Tables RLS Policies
CREATE POLICY "ultra_tables_select" ON ultra_tables FOR SELECT
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "ultra_tables_insert" ON ultra_tables FOR INSERT
  WITH CHECK (tenant_id = get_current_tenant_id());

CREATE POLICY "ultra_tables_update" ON ultra_tables FOR UPDATE
  USING (tenant_id = get_current_tenant_id());

CREATE POLICY "ultra_tables_delete" ON ultra_tables FOR DELETE
  USING (tenant_id = get_current_tenant_id());

-- Ultra Columns RLS Policies
CREATE POLICY "ultra_columns_select" ON ultra_columns FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ultra_tables
      WHERE ultra_tables.id = ultra_columns.table_id
      AND ultra_tables.tenant_id = get_current_tenant_id()
    )
  );

CREATE POLICY "ultra_columns_insert" ON ultra_columns FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ultra_tables
      WHERE ultra_tables.id = ultra_columns.table_id
      AND ultra_tables.tenant_id = get_current_tenant_id()
    )
  );

CREATE POLICY "ultra_columns_update" ON ultra_columns FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM ultra_tables
      WHERE ultra_tables.id = ultra_columns.table_id
      AND ultra_tables.tenant_id = get_current_tenant_id()
    )
  );

CREATE POLICY "ultra_columns_delete" ON ultra_columns FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM ultra_tables
      WHERE ultra_tables.id = ultra_columns.table_id
      AND ultra_tables.tenant_id = get_current_tenant_id()
    )
  );

-- Ultra Views RLS Policies
CREATE POLICY "ultra_views_select" ON ultra_views FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ultra_tables
      WHERE ultra_tables.id = ultra_views.table_id
      AND ultra_tables.tenant_id = get_current_tenant_id()
    )
  );

CREATE POLICY "ultra_views_insert" ON ultra_views FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ultra_tables
      WHERE ultra_tables.id = ultra_views.table_id
      AND ultra_tables.tenant_id = get_current_tenant_id()
    )
  );

CREATE POLICY "ultra_views_update" ON ultra_views FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM ultra_tables
      WHERE ultra_tables.id = ultra_views.table_id
      AND ultra_tables.tenant_id = get_current_tenant_id()
    )
  );

CREATE POLICY "ultra_views_delete" ON ultra_views FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM ultra_tables
      WHERE ultra_tables.id = ultra_views.table_id
      AND ultra_tables.tenant_id = get_current_tenant_id()
    )
  );

-- Ultra Records RLS Policies
CREATE POLICY "ultra_records_select" ON ultra_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM ultra_tables
      WHERE ultra_tables.id = ultra_records.table_id
      AND ultra_tables.tenant_id = get_current_tenant_id()
    )
  );

CREATE POLICY "ultra_records_insert" ON ultra_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM ultra_tables
      WHERE ultra_tables.id = ultra_records.table_id
      AND ultra_tables.tenant_id = get_current_tenant_id()
    )
  );

CREATE POLICY "ultra_records_update" ON ultra_records FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM ultra_tables
      WHERE ultra_tables.id = ultra_records.table_id
      AND ultra_tables.tenant_id = get_current_tenant_id()
    )
  );

CREATE POLICY "ultra_records_delete" ON ultra_records FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM ultra_tables
      WHERE ultra_tables.id = ultra_records.table_id
      AND ultra_tables.tenant_id = get_current_tenant_id()
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_ultra_table_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ultra_tables_updated_at ON ultra_tables;
CREATE TRIGGER ultra_tables_updated_at
  BEFORE UPDATE ON ultra_tables
  FOR EACH ROW
  EXECUTE FUNCTION update_ultra_table_timestamp();

DROP TRIGGER IF EXISTS ultra_columns_updated_at ON ultra_columns;
CREATE TRIGGER ultra_columns_updated_at
  BEFORE UPDATE ON ultra_columns
  FOR EACH ROW
  EXECUTE FUNCTION update_ultra_table_timestamp();

DROP TRIGGER IF EXISTS ultra_views_updated_at ON ultra_views;
CREATE TRIGGER ultra_views_updated_at
  BEFORE UPDATE ON ultra_views
  FOR EACH ROW
  EXECUTE FUNCTION update_ultra_table_timestamp();

DROP TRIGGER IF EXISTS ultra_records_updated_at ON ultra_records;
CREATE TRIGGER ultra_records_updated_at
  BEFORE UPDATE ON ultra_records
  FOR EACH ROW
  EXECUTE FUNCTION update_ultra_table_timestamp();

-- ============================================
-- STORAGE (for table files)
-- ============================================

-- Create storage bucket for table file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('table-files', 'table-files', true, 52428800, null)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for table-files bucket
CREATE POLICY "table_files_select" ON storage.objects FOR SELECT
  USING (bucket_id = 'table-files' AND auth.role() = 'authenticated');

CREATE POLICY "table_files_insert" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'table-files' AND auth.role() = 'authenticated');

CREATE POLICY "table_files_update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'table-files' AND auth.role() = 'authenticated');

CREATE POLICY "table_files_delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'table-files' AND auth.role() = 'authenticated');

-- ============================================
-- FILE VAULT METADATA SUPPORT
-- ============================================

-- Add metadata column to file_vault_files if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'file_vault_files' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE file_vault_files ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Index for table file queries via metadata
CREATE INDEX IF NOT EXISTS idx_file_vault_files_table_metadata
  ON file_vault_files USING gin(metadata);
