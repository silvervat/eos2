-- =============================================
-- WAREHOUSE MANAGEMENT - ROW LEVEL SECURITY POLICIES
-- =============================================
-- Version: 1.0.0
-- Date: 2024-11-30
-- Description: RLS policies for warehouse management module
-- =============================================

-- =============================================
-- ENABLE RLS ON ALL WAREHOUSE TABLES
-- =============================================

ALTER TABLE warehouses ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_maintenances ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE warehouse_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_cost_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_counts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_count_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- WAREHOUSES POLICIES
-- =============================================

CREATE POLICY "warehouse_select_policy" ON warehouses
  FOR SELECT USING (tenant_id = get_user_tenant_id() AND deleted_at IS NULL);

CREATE POLICY "warehouse_insert_policy" ON warehouses
  FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "warehouse_update_policy" ON warehouses
  FOR UPDATE USING (tenant_id = get_user_tenant_id() AND deleted_at IS NULL);

CREATE POLICY "warehouse_delete_policy" ON warehouses
  FOR DELETE USING (tenant_id = get_user_tenant_id());

-- =============================================
-- ASSET CATEGORIES POLICIES
-- =============================================

CREATE POLICY "category_select_policy" ON asset_categories
  FOR SELECT USING (tenant_id = get_user_tenant_id() AND deleted_at IS NULL);

CREATE POLICY "category_insert_policy" ON asset_categories
  FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "category_update_policy" ON asset_categories
  FOR UPDATE USING (tenant_id = get_user_tenant_id() AND deleted_at IS NULL);

CREATE POLICY "category_delete_policy" ON asset_categories
  FOR DELETE USING (tenant_id = get_user_tenant_id());

-- =============================================
-- ASSETS POLICIES
-- =============================================

CREATE POLICY "asset_select_policy" ON assets
  FOR SELECT USING (tenant_id = get_user_tenant_id() AND deleted_at IS NULL);

CREATE POLICY "asset_insert_policy" ON assets
  FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "asset_update_policy" ON assets
  FOR UPDATE USING (tenant_id = get_user_tenant_id() AND deleted_at IS NULL);

CREATE POLICY "asset_delete_policy" ON assets
  FOR DELETE USING (tenant_id = get_user_tenant_id());

-- =============================================
-- ASSET PHOTOS POLICIES
-- =============================================

CREATE POLICY "photo_select_policy" ON asset_photos
  FOR SELECT USING (tenant_id = get_user_tenant_id() AND deleted_at IS NULL);

CREATE POLICY "photo_insert_policy" ON asset_photos
  FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "photo_update_policy" ON asset_photos
  FOR UPDATE USING (tenant_id = get_user_tenant_id() AND deleted_at IS NULL);

CREATE POLICY "photo_delete_policy" ON asset_photos
  FOR DELETE USING (tenant_id = get_user_tenant_id());

-- =============================================
-- ASSET TRANSFERS POLICIES
-- =============================================

CREATE POLICY "transfer_select_policy" ON asset_transfers
  FOR SELECT USING (tenant_id = get_user_tenant_id() AND deleted_at IS NULL);

CREATE POLICY "transfer_insert_policy" ON asset_transfers
  FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "transfer_update_policy" ON asset_transfers
  FOR UPDATE USING (tenant_id = get_user_tenant_id() AND deleted_at IS NULL);

CREATE POLICY "transfer_delete_policy" ON asset_transfers
  FOR DELETE USING (tenant_id = get_user_tenant_id());

-- =============================================
-- ASSET MAINTENANCES POLICIES
-- =============================================

CREATE POLICY "maintenance_select_policy" ON asset_maintenances
  FOR SELECT USING (tenant_id = get_user_tenant_id() AND deleted_at IS NULL);

CREATE POLICY "maintenance_insert_policy" ON asset_maintenances
  FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "maintenance_update_policy" ON asset_maintenances
  FOR UPDATE USING (tenant_id = get_user_tenant_id() AND deleted_at IS NULL);

CREATE POLICY "maintenance_delete_policy" ON asset_maintenances
  FOR DELETE USING (tenant_id = get_user_tenant_id());

-- =============================================
-- STOCK MOVEMENTS POLICIES
-- =============================================

CREATE POLICY "stock_select_policy" ON stock_movements
  FOR SELECT USING (tenant_id = get_user_tenant_id());

CREATE POLICY "stock_insert_policy" ON stock_movements
  FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());

-- Stock movements should not be updated or deleted (audit trail)
-- Only admins can delete stock movements
CREATE POLICY "stock_delete_policy" ON stock_movements
  FOR DELETE USING (
    tenant_id = get_user_tenant_id()
    AND user_has_role('admin')
  );

-- =============================================
-- ASSET REMINDERS POLICIES
-- =============================================

CREATE POLICY "reminder_select_policy" ON asset_reminders
  FOR SELECT USING (tenant_id = get_user_tenant_id() AND deleted_at IS NULL);

CREATE POLICY "reminder_insert_policy" ON asset_reminders
  FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "reminder_update_policy" ON asset_reminders
  FOR UPDATE USING (tenant_id = get_user_tenant_id() AND deleted_at IS NULL);

CREATE POLICY "reminder_delete_policy" ON asset_reminders
  FOR DELETE USING (tenant_id = get_user_tenant_id());

-- =============================================
-- WAREHOUSE ORDERS POLICIES
-- =============================================

CREATE POLICY "order_select_policy" ON warehouse_orders
  FOR SELECT USING (tenant_id = get_user_tenant_id() AND deleted_at IS NULL);

CREATE POLICY "order_insert_policy" ON warehouse_orders
  FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "order_update_policy" ON warehouse_orders
  FOR UPDATE USING (tenant_id = get_user_tenant_id() AND deleted_at IS NULL);

CREATE POLICY "order_delete_policy" ON warehouse_orders
  FOR DELETE USING (tenant_id = get_user_tenant_id());

-- =============================================
-- WAREHOUSE ORDER ITEMS POLICIES
-- =============================================

CREATE POLICY "order_item_select_policy" ON warehouse_order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM warehouse_orders
      WHERE id = warehouse_order_items.order_id
      AND tenant_id = get_user_tenant_id()
    )
  );

CREATE POLICY "order_item_insert_policy" ON warehouse_order_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM warehouse_orders
      WHERE id = warehouse_order_items.order_id
      AND tenant_id = get_user_tenant_id()
    )
  );

CREATE POLICY "order_item_update_policy" ON warehouse_order_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM warehouse_orders
      WHERE id = warehouse_order_items.order_id
      AND tenant_id = get_user_tenant_id()
    )
  );

CREATE POLICY "order_item_delete_policy" ON warehouse_order_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM warehouse_orders
      WHERE id = warehouse_order_items.order_id
      AND tenant_id = get_user_tenant_id()
    )
  );

-- =============================================
-- WAREHOUSE LOCATIONS POLICIES
-- =============================================

CREATE POLICY "location_select_policy" ON warehouse_locations
  FOR SELECT USING (tenant_id = get_user_tenant_id() AND deleted_at IS NULL);

CREATE POLICY "location_insert_policy" ON warehouse_locations
  FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "location_update_policy" ON warehouse_locations
  FOR UPDATE USING (tenant_id = get_user_tenant_id() AND deleted_at IS NULL);

CREATE POLICY "location_delete_policy" ON warehouse_locations
  FOR DELETE USING (tenant_id = get_user_tenant_id());

-- =============================================
-- ASSET RELATIONS POLICIES
-- =============================================

CREATE POLICY "relation_select_policy" ON asset_relations
  FOR SELECT USING (tenant_id = get_user_tenant_id());

CREATE POLICY "relation_insert_policy" ON asset_relations
  FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "relation_update_policy" ON asset_relations
  FOR UPDATE USING (tenant_id = get_user_tenant_id());

CREATE POLICY "relation_delete_policy" ON asset_relations
  FOR DELETE USING (tenant_id = get_user_tenant_id());

-- =============================================
-- MAINTENANCE COST ITEMS POLICIES
-- =============================================

CREATE POLICY "cost_item_select_policy" ON maintenance_cost_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM asset_maintenances
      WHERE id = maintenance_cost_items.maintenance_id
      AND tenant_id = get_user_tenant_id()
    )
  );

CREATE POLICY "cost_item_insert_policy" ON maintenance_cost_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM asset_maintenances
      WHERE id = maintenance_cost_items.maintenance_id
      AND tenant_id = get_user_tenant_id()
    )
  );

CREATE POLICY "cost_item_update_policy" ON maintenance_cost_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM asset_maintenances
      WHERE id = maintenance_cost_items.maintenance_id
      AND tenant_id = get_user_tenant_id()
    )
  );

CREATE POLICY "cost_item_delete_policy" ON maintenance_cost_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM asset_maintenances
      WHERE id = maintenance_cost_items.maintenance_id
      AND tenant_id = get_user_tenant_id()
    )
  );

-- =============================================
-- INVENTORY COUNTS POLICIES
-- =============================================

CREATE POLICY "count_select_policy" ON inventory_counts
  FOR SELECT USING (tenant_id = get_user_tenant_id() AND deleted_at IS NULL);

CREATE POLICY "count_insert_policy" ON inventory_counts
  FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "count_update_policy" ON inventory_counts
  FOR UPDATE USING (tenant_id = get_user_tenant_id() AND deleted_at IS NULL);

CREATE POLICY "count_delete_policy" ON inventory_counts
  FOR DELETE USING (tenant_id = get_user_tenant_id());

-- =============================================
-- INVENTORY COUNT ITEMS POLICIES
-- =============================================

CREATE POLICY "count_item_select_policy" ON inventory_count_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM inventory_counts
      WHERE id = inventory_count_items.count_id
      AND tenant_id = get_user_tenant_id()
    )
  );

CREATE POLICY "count_item_insert_policy" ON inventory_count_items
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM inventory_counts
      WHERE id = inventory_count_items.count_id
      AND tenant_id = get_user_tenant_id()
    )
  );

CREATE POLICY "count_item_update_policy" ON inventory_count_items
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM inventory_counts
      WHERE id = inventory_count_items.count_id
      AND tenant_id = get_user_tenant_id()
    )
  );

CREATE POLICY "count_item_delete_policy" ON inventory_count_items
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM inventory_counts
      WHERE id = inventory_count_items.count_id
      AND tenant_id = get_user_tenant_id()
    )
  );

-- =============================================
-- AUDIT LOGS POLICIES
-- =============================================

CREATE POLICY "audit_select_policy" ON audit_logs
  FOR SELECT USING (tenant_id = get_user_tenant_id());

CREATE POLICY "audit_insert_policy" ON audit_logs
  FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());

-- Audit logs should never be updated or deleted
-- No update or delete policies

-- =============================================
-- GRANT EXECUTE ON HELPER FUNCTION
-- =============================================

-- Ensure authenticated users can use the helper function
GRANT EXECUTE ON FUNCTION get_user_tenant_id() TO authenticated;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON POLICY "warehouse_select_policy" ON warehouses IS 'Users can only view warehouses from their tenant';
COMMENT ON POLICY "asset_select_policy" ON assets IS 'Users can only view assets from their tenant';
COMMENT ON POLICY "transfer_select_policy" ON asset_transfers IS 'Users can only view transfers from their tenant';
COMMENT ON POLICY "maintenance_select_policy" ON asset_maintenances IS 'Users can only view maintenance records from their tenant';
COMMENT ON POLICY "stock_select_policy" ON stock_movements IS 'Users can only view stock movements from their tenant';

-- =============================================
-- END OF WAREHOUSE RLS POLICIES
-- =============================================
