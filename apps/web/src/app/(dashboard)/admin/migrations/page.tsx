'use client';

import { useState, useEffect } from 'react';
import { Database, Copy, Check, ExternalLink, Play, FileText } from 'lucide-react';

interface Migration {
  name: string;
  path: string;
}

export default function MigrationsPage() {
  const [migrations, setMigrations] = useState<Migration[]>([]);
  const [selectedMigration, setSelectedMigration] = useState<string | null>(null);
  const [sqlContent, setSqlContent] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  // Hardcoded migrations list (since we can't read files from browser)
  const knownMigrations: Migration[] = [
    { name: '001_initial_schema.sql', path: 'supabase/migrations/001_initial_schema.sql' },
    { name: '002_file_vault.sql', path: 'supabase/migrations/002_file_vault.sql' },
    { name: '003_notifications.sql', path: 'supabase/migrations/003_notifications.sql' },
    { name: '004_soft_delete.sql', path: 'supabase/migrations/004_soft_delete.sql' },
    { name: '005_warehouse.sql', path: 'supabase/migrations/005_warehouse.sql' },
    { name: '006_ultra_tables.sql', path: 'supabase/migrations/006_ultra_tables.sql' },
    { name: '007_user_profiles_tenant_id.sql', path: 'supabase/migrations/007_user_profiles_tenant_id.sql' },
    { name: '008_transfer_baskets.sql', path: 'supabase/migrations/008_transfer_baskets.sql' },
  ];

  useEffect(() => {
    setMigrations(knownMigrations);
    setLoading(false);
  }, []);

  // Load SQL content from GitHub raw (if available) or show instructions
  const loadMigration = async (migrationPath: string) => {
    setSelectedMigration(migrationPath);
    setSqlContent('Loading...');

    // Try to load from API
    try {
      const res = await fetch(`/api/admin/migration-content?path=${encodeURIComponent(migrationPath)}`);
      if (res.ok) {
        const data = await res.json();
        setSqlContent(data.content);
        return;
      }
    } catch {
      // Ignore, use fallback
    }

    // Fallback: show the 008 migration content directly (most common need)
    if (migrationPath.includes('008_transfer_baskets')) {
      setSqlContent(transferBasketsMigration);
    } else {
      setSqlContent(`-- Migration: ${migrationPath}\n-- Content not available. Please check the file in your repository.`);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(sqlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openSupabaseSQL = () => {
    // Open Supabase SQL Editor (user needs to select their project)
    window.open('https://supabase.com/dashboard/project/_/sql', '_blank');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Database Migrations</h1>
          <p className="text-slate-600 text-sm">Manage and run database migrations</p>
        </div>
        <button
          onClick={openSupabaseSQL}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#3ECF8E] text-white hover:bg-[#3ECF8E]/90"
        >
          <ExternalLink className="h-4 w-4" />
          Open Supabase SQL Editor
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Migrations list */}
        <div className="bg-white rounded-xl border p-4">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-[#279989]" />
            Available Migrations
          </h2>
          <div className="space-y-2">
            {loading ? (
              <p className="text-slate-500">Loading...</p>
            ) : (
              migrations.map((m) => (
                <button
                  key={m.path}
                  onClick={() => loadMigration(m.path)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                    selectedMigration === m.path
                      ? 'bg-[#279989]/10 text-[#279989] border border-[#279989]/20'
                      : 'hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span className="text-sm font-mono">{m.name}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* SQL Content */}
        <div className="lg:col-span-2 bg-white rounded-xl border">
          <div className="flex items-center justify-between p-4 border-b">
            <h2 className="font-semibold">
              {selectedMigration ? selectedMigration.split('/').pop() : 'Select a migration'}
            </h2>
            {sqlContent && selectedMigration && (
              <div className="flex gap-2">
                <button
                  onClick={copyToClipboard}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                    copied
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy SQL
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
          <div className="p-4">
            {selectedMigration ? (
              <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-x-auto text-sm max-h-[600px] overflow-y-auto">
                <code>{sqlContent}</code>
              </pre>
            ) : (
              <div className="text-center py-12 text-slate-500">
                <Database className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                <p>Select a migration from the list to view its SQL</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <h3 className="font-semibold text-blue-900 mb-2">How to run migrations</h3>
        <ol className="list-decimal list-inside space-y-1 text-blue-800 text-sm">
          <li>Select a migration from the list above</li>
          <li>Click "Copy SQL" to copy the migration to clipboard</li>
          <li>Click "Open Supabase SQL Editor" to open the SQL editor</li>
          <li>Paste the SQL and click "Run"</li>
          <li>Verify the migration was successful (no errors)</li>
        </ol>
      </div>
    </div>
  );
}

// Hardcoded migration content for the most needed migration
const transferBasketsMigration = `-- =============================================
-- TRANSFER BASKETS - FAST MOBILE SCANNING SUPPORT
-- =============================================
-- Version: 1.0.0
-- Date: 2025-11-30
-- Description: Transfer basket table for batch material transfers
-- =============================================

-- =============================================
-- TRANSFER BASKETS TABLE
-- =============================================
-- Supports the fast mobile scanning workflow where users
-- scan multiple items into a "basket" before completing transfer

CREATE TABLE IF NOT EXISTS warehouse_transfer_baskets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),

  -- Source & destination
  from_warehouse_id UUID REFERENCES warehouses(id),
  to_project_id TEXT REFERENCES projects(id),  -- TEXT because projects.id is TEXT type
  to_warehouse_id UUID REFERENCES warehouses(id),
  to_user_id UUID REFERENCES user_profiles(id),

  -- Basket state
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'completed', 'cancelled')),

  -- Items stored as JSONB array
  -- Each item: { assetId, assetName, qrCode, currentStock, requestedQuantity, availableQuantity, thumbnailUrl, isValid, warnings[] }
  items JSONB NOT NULL DEFAULT '[]'::jsonb,

  -- Metadata
  created_by UUID NOT NULL REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Search optimization
  total_items INTEGER NOT NULL DEFAULT 0,
  total_value DECIMAL(10,2),

  -- Notes
  notes TEXT,

  -- Soft delete
  deleted_at TIMESTAMPTZ
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_transfer_baskets_tenant
  ON warehouse_transfer_baskets(tenant_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transfer_baskets_status
  ON warehouse_transfer_baskets(status)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transfer_baskets_user
  ON warehouse_transfer_baskets(created_by)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transfer_baskets_project
  ON warehouse_transfer_baskets(to_project_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transfer_baskets_from_warehouse
  ON warehouse_transfer_baskets(from_warehouse_id)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_transfer_baskets_composite
  ON warehouse_transfer_baskets(tenant_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

-- GIN index for JSONB items search
CREATE INDEX IF NOT EXISTS idx_transfer_baskets_items
  ON warehouse_transfer_baskets USING GIN (items);

-- =============================================
-- TRIGGER FOR UPDATED_AT
-- =============================================

CREATE OR REPLACE FUNCTION update_transfer_basket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.total_items = jsonb_array_length(COALESCE(NEW.items, '[]'::jsonb));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_transfer_basket_updated ON warehouse_transfer_baskets;
CREATE TRIGGER trigger_transfer_basket_updated
  BEFORE UPDATE ON warehouse_transfer_baskets
  FOR EACH ROW
  EXECUTE FUNCTION update_transfer_basket_timestamp();

-- Also set total_items on insert
CREATE OR REPLACE FUNCTION set_transfer_basket_defaults()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_items = jsonb_array_length(COALESCE(NEW.items, '[]'::jsonb));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_transfer_basket_insert ON warehouse_transfer_baskets;
CREATE TRIGGER trigger_transfer_basket_insert
  BEFORE INSERT ON warehouse_transfer_baskets
  FOR EACH ROW
  EXECUTE FUNCTION set_transfer_basket_defaults();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE warehouse_transfer_baskets ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "transfer_basket_select_policy" ON warehouse_transfer_baskets;
DROP POLICY IF EXISTS "transfer_basket_insert_policy" ON warehouse_transfer_baskets;
DROP POLICY IF EXISTS "transfer_basket_update_policy" ON warehouse_transfer_baskets;
DROP POLICY IF EXISTS "transfer_basket_delete_policy" ON warehouse_transfer_baskets;

-- Users can view their own baskets and completed baskets in their tenant
CREATE POLICY "transfer_basket_select_policy" ON warehouse_transfer_baskets
  FOR SELECT USING (
    tenant_id = get_user_tenant_id()
    AND deleted_at IS NULL
  );

-- Users can create baskets for their tenant
CREATE POLICY "transfer_basket_insert_policy" ON warehouse_transfer_baskets
  FOR INSERT WITH CHECK (
    tenant_id = get_user_tenant_id()
  );

-- Users can only update their own draft baskets
CREATE POLICY "transfer_basket_update_policy" ON warehouse_transfer_baskets
  FOR UPDATE USING (
    tenant_id = get_user_tenant_id()
    AND deleted_at IS NULL
    AND (
      status = 'draft'
      OR (status = 'pending' AND created_by = (
        SELECT id FROM user_profiles WHERE auth_user_id = auth.uid() LIMIT 1
      ))
    )
  );

-- Users can only delete their own draft baskets
CREATE POLICY "transfer_basket_delete_policy" ON warehouse_transfer_baskets
  FOR DELETE USING (
    tenant_id = get_user_tenant_id()
    AND status = 'draft'
    AND created_by = (
      SELECT id FROM user_profiles WHERE auth_user_id = auth.uid() LIMIT 1
    )
  );

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON TABLE warehouse_transfer_baskets IS 'Transfer baskets for batch material transfers via mobile scanning';
COMMENT ON COLUMN warehouse_transfer_baskets.items IS 'JSONB array of basket items with asset details and validation status';
COMMENT ON COLUMN warehouse_transfer_baskets.status IS 'Basket status: draft (editing), pending (submitted), completed (transferred), cancelled';
COMMENT ON COLUMN warehouse_transfer_baskets.total_items IS 'Auto-calculated count of items in basket (set by trigger)';

-- =============================================
-- GRANT PERMISSIONS
-- =============================================

GRANT SELECT, INSERT, UPDATE, DELETE ON warehouse_transfer_baskets TO authenticated;

-- =============================================
-- END OF TRANSFER BASKETS MIGRATION
-- =============================================`;
