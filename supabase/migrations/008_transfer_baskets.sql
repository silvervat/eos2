-- =============================================
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

CREATE INDEX idx_transfer_baskets_tenant
  ON warehouse_transfer_baskets(tenant_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_transfer_baskets_status
  ON warehouse_transfer_baskets(status)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_transfer_baskets_user
  ON warehouse_transfer_baskets(created_by)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_transfer_baskets_project
  ON warehouse_transfer_baskets(to_project_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_transfer_baskets_from_warehouse
  ON warehouse_transfer_baskets(from_warehouse_id)
  WHERE deleted_at IS NULL;

CREATE INDEX idx_transfer_baskets_composite
  ON warehouse_transfer_baskets(tenant_id, status, created_at DESC)
  WHERE deleted_at IS NULL;

-- GIN index for JSONB items search
CREATE INDEX idx_transfer_baskets_items
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

CREATE TRIGGER trigger_transfer_basket_insert
  BEFORE INSERT ON warehouse_transfer_baskets
  FOR EACH ROW
  EXECUTE FUNCTION set_transfer_basket_defaults();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE warehouse_transfer_baskets ENABLE ROW LEVEL SECURITY;

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
-- =============================================
