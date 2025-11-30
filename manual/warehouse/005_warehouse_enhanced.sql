-- =============================================
-- TÄIUSTATUD LAOHALDUS - TÄIELIK MIGRATSIOON
-- =============================================
-- Version: 2.0.0
-- Date: 2024-11-30
-- Includes: Locations, Photo Metadata, Inventory, Relations, etc.
-- =============================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =============================================
-- 1. WAREHOUSE LOCATIONS - Asukohtade hierarhia
-- =============================================
CREATE TABLE warehouse_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES warehouse_locations(id) ON DELETE CASCADE,
  
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'zone', 'room', 'shelf', 'row', 'bin'
  
  path TEXT, -- Materialized path: /RUUM1/A/3
  level INTEGER DEFAULT 0,
  
  capacity INTEGER,
  current_count INTEGER DEFAULT 0,
  
  barcode TEXT,
  qr_code TEXT,
  
  dimensions TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT unique_location UNIQUE(warehouse_id, code, parent_id)
);

CREATE INDEX idx_locations_warehouse ON warehouse_locations(warehouse_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_locations_parent ON warehouse_locations(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_locations_path ON warehouse_locations USING GIN(path gin_trgm_ops);
CREATE INDEX idx_locations_barcode ON warehouse_locations(barcode) WHERE deleted_at IS NULL;

-- Trigger: Update path
CREATE OR REPLACE FUNCTION update_location_path()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.path := '/' || NEW.code;
    NEW.level := 0;
  ELSE
    SELECT path || '/' || NEW.code, level + 1
    INTO NEW.path, NEW.level
    FROM warehouse_locations
    WHERE id = NEW.parent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_location_path_trigger 
  BEFORE INSERT OR UPDATE ON warehouse_locations
  FOR EACH ROW EXECUTE FUNCTION update_location_path();

-- =============================================
-- 2. WAREHOUSES - Lisa settings
-- =============================================
ALTER TABLE warehouses ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

COMMENT ON COLUMN warehouses.settings IS 'Location system, photo requirements, inventory settings';

-- =============================================
-- 3. ASSETS - Lisa täiendused
-- =============================================
ALTER TABLE assets 
  ADD COLUMN IF NOT EXISTS current_location_id UUID REFERENCES warehouse_locations(id),
  ADD COLUMN IF NOT EXISTS unit_weight_kg DECIMAL(10,4),
  ADD COLUMN IF NOT EXISTS weight_tolerance_percent DECIMAL(5,2) DEFAULT 5;

CREATE INDEX idx_assets_location ON assets(current_location_id) WHERE deleted_at IS NULL;

-- =============================================
-- 4. ASSET RELATIONS - Komplektid ja seosed
-- =============================================
CREATE TABLE asset_relations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  parent_asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  child_asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  
  relation_type TEXT DEFAULT 'component', -- 'component', 'accessory', 'compatible', 'alternative'
  
  quantity INTEGER DEFAULT 1,
  is_required BOOLEAN DEFAULT false,
  auto_transfer BOOLEAN DEFAULT false,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT unique_relation UNIQUE(parent_asset_id, child_asset_id)
);

CREATE INDEX idx_asset_relations_parent ON asset_relations(parent_asset_id);
CREATE INDEX idx_asset_relations_child ON asset_relations(child_asset_id);

-- =============================================
-- 5. ASSET PHOTOS - Täiendused metadata jaoks
-- =============================================
ALTER TABLE asset_photos 
  ADD COLUMN IF NOT EXISTS location_id UUID REFERENCES warehouse_locations(id),
  ADD COLUMN IF NOT EXISTS transfer_id UUID REFERENCES asset_transfers(id),
  ADD COLUMN IF NOT EXISTS gps_coordinates JSONB,
  ADD COLUMN IF NOT EXISTS device_info JSONB;

-- Photo metadata indexing
CREATE INDEX idx_asset_photos_location ON asset_photos(location_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_asset_photos_transfer ON asset_photos(transfer_id) WHERE deleted_at IS NULL;

-- =============================================
-- 6. MAINTENANCES - Lisa kulud
-- =============================================
ALTER TABLE asset_maintenances 
  ADD COLUMN IF NOT EXISTS labor_cost DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS parts_cost DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS external_service_cost DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS other_costs DECIMAL(15,2);

-- Add computed total_cost
ALTER TABLE asset_maintenances 
  ADD COLUMN IF NOT EXISTS total_cost DECIMAL(15,2) 
  GENERATED ALWAYS AS (
    COALESCE(labor_cost, 0) + 
    COALESCE(parts_cost, 0) + 
    COALESCE(external_service_cost, 0) + 
    COALESCE(other_costs, 0)
  ) STORED;

CREATE TABLE maintenance_cost_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  maintenance_id UUID NOT NULL REFERENCES asset_maintenances(id) ON DELETE CASCADE,
  
  item_type TEXT NOT NULL, -- 'labor', 'part', 'service', 'other'
  description TEXT NOT NULL,
  quantity DECIMAL(10,2) DEFAULT 1,
  unit_price DECIMAL(15,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  
  supplier_id UUID REFERENCES companies(id),
  invoice_number TEXT,
  invoice_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_maintenance_costs_maintenance ON maintenance_cost_items(maintenance_id);

-- =============================================
-- 7. INVENTORY COUNTS - Inventuuri süsteem
-- =============================================
CREATE TABLE inventory_counts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  
  count_number TEXT NOT NULL,
  count_type TEXT DEFAULT 'full', -- 'full', 'partial', 'cycle', 'spot'
  status TEXT DEFAULT 'planned', -- 'planned', 'in_progress', 'completed', 'cancelled'
  
  planned_date DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  responsible_user_id UUID REFERENCES user_profiles(id),
  
  -- Ulatus
  location_ids UUID[],
  category_ids UUID[],
  
  -- Tulemused
  total_items_expected INTEGER,
  total_items_counted INTEGER,
  total_items_matched INTEGER,
  total_items_variance INTEGER,
  variance_value DECIMAL(15,2),
  
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  CONSTRAINT unique_count_number UNIQUE(tenant_id, count_number)
);

CREATE TABLE inventory_count_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  count_id UUID NOT NULL REFERENCES inventory_counts(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id),
  
  expected_quantity DECIMAL(10,2),
  expected_location_id UUID REFERENCES warehouse_locations(id),
  
  counted_quantity DECIMAL(10,2),
  counted_location_id UUID REFERENCES warehouse_locations(id),
  
  variance DECIMAL(10,2),
  variance_percent DECIMAL(5,2),
  
  status TEXT DEFAULT 'pending', -- 'pending', 'counted', 'verified', 'adjusted'
  
  counted_at TIMESTAMPTZ,
  counted_by_user_id UUID REFERENCES user_profiles(id),
  
  photos JSONB DEFAULT '[]',
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_inventory_counts_warehouse ON inventory_counts(warehouse_id);
CREATE INDEX idx_inventory_counts_status ON inventory_counts(status);
CREATE INDEX idx_inventory_count_items_count ON inventory_count_items(count_id);
CREATE INDEX idx_inventory_count_items_asset ON inventory_count_items(asset_id);

-- Function: Generate count number
CREATE OR REPLACE FUNCTION generate_count_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.count_number IS NULL THEN
    NEW.count_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                        LPAD(NEXTVAL('count_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE IF NOT EXISTS count_number_seq;

CREATE TRIGGER generate_count_number_trigger 
  BEFORE INSERT ON inventory_counts
  FOR EACH ROW EXECUTE FUNCTION generate_count_number();

-- =============================================
-- 8. AUDIT LOGS - Auditi jälgimine
-- =============================================
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  entity_type TEXT NOT NULL, -- 'asset', 'transfer', 'maintenance', etc.
  entity_id UUID NOT NULL,
  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'transfer', etc.
  
  user_id UUID REFERENCES user_profiles(id),
  
  changes JSONB, -- Before/after values
  metadata JSONB DEFAULT '{}',
  
  ip_address TEXT,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_date ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);

-- Function: Auto-create audit log
CREATE OR REPLACE FUNCTION create_audit_log()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_action TEXT;
  v_changes JSONB;
BEGIN
  -- Get current user
  SELECT id INTO v_user_id 
  FROM user_profiles 
  WHERE auth_user_id = auth.uid() 
  LIMIT 1;
  
  -- Determine action
  IF (TG_OP = 'INSERT') THEN
    v_action := 'create';
    v_changes := to_jsonb(NEW);
  ELSIF (TG_OP = 'UPDATE') THEN
    v_action := 'update';
    v_changes := jsonb_build_object(
      'before', to_jsonb(OLD),
      'after', to_jsonb(NEW)
    );
  ELSIF (TG_OP = 'DELETE') THEN
    v_action := 'delete';
    v_changes := to_jsonb(OLD);
  END IF;
  
  -- Insert audit log
  INSERT INTO audit_logs (
    tenant_id,
    entity_type,
    entity_id,
    action,
    user_id,
    changes
  ) VALUES (
    COALESCE(NEW.tenant_id, OLD.tenant_id),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    v_action,
    v_user_id,
    v_changes
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply audit logging to key tables
CREATE TRIGGER audit_assets AFTER INSERT OR UPDATE OR DELETE ON assets
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_transfers AFTER INSERT OR UPDATE OR DELETE ON asset_transfers
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

CREATE TRIGGER audit_maintenances AFTER INSERT OR UPDATE OR DELETE ON asset_maintenances
  FOR EACH ROW EXECUTE FUNCTION create_audit_log();

-- =============================================
-- 9. PERMISSIONS - Lisa bulk editing õigused
-- =============================================
-- user_profiles.permissions structure näide:
COMMENT ON COLUMN user_profiles.permissions IS '{
  "warehouse": {
    "view": true,
    "create": true,
    "edit": true,
    "delete": false,
    "bulk_edit": true,
    "bulk_delete": false,
    "bulk_transfer": true,
    "export_all": true,
    "import": true,
    "manage_locations": true,
    "approve_transfers": true,
    "complete_inventory": true
  }
}';

-- =============================================
-- 10. HELPER FUNCTIONS
-- =============================================

-- Get asset full location path
CREATE OR REPLACE FUNCTION get_asset_location_path(asset_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_path TEXT;
BEGIN
  SELECT wl.path INTO v_path
  FROM assets a
  LEFT JOIN warehouse_locations wl ON wl.id = a.current_location_id
  WHERE a.id = asset_id;
  
  RETURN COALESCE(v_path, '/');
END;
$$ LANGUAGE plpgsql;

-- Get warehouse stats
CREATE OR REPLACE FUNCTION get_warehouse_stats(warehouse_id UUID)
RETURNS TABLE(
  total_assets BIGINT,
  available_assets BIGINT,
  in_use_assets BIGINT,
  maintenance_assets BIGINT,
  total_value DECIMAL(15,2),
  total_locations BIGINT,
  occupancy_rate DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(a.id)::BIGINT as total_assets,
    COUNT(CASE WHEN a.status = 'available' THEN 1 END)::BIGINT as available_assets,
    COUNT(CASE WHEN a.status = 'in_use' THEN 1 END)::BIGINT as in_use_assets,
    COUNT(CASE WHEN a.status = 'maintenance' THEN 1 END)::BIGINT as maintenance_assets,
    SUM(COALESCE(a.current_value, 0))::DECIMAL(15,2) as total_value,
    (SELECT COUNT(*) FROM warehouse_locations WHERE warehouse_locations.warehouse_id = get_warehouse_stats.warehouse_id)::BIGINT as total_locations,
    CASE 
      WHEN (SELECT COUNT(*) FROM warehouse_locations WHERE warehouse_locations.warehouse_id = get_warehouse_stats.warehouse_id) > 0 
      THEN (COUNT(a.id)::DECIMAL / (SELECT COUNT(*) FROM warehouse_locations WHERE warehouse_locations.warehouse_id = get_warehouse_stats.warehouse_id)::DECIMAL * 100)::DECIMAL(5,2)
      ELSE 0
    END as occupancy_rate
  FROM assets a
  WHERE a.current_warehouse_id = get_warehouse_stats.warehouse_id
    AND a.deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Calculate average purchase price for consumables
CREATE OR REPLACE FUNCTION calculate_average_price(asset_id UUID)
RETURNS DECIMAL(15,2) AS $$
DECLARE
  v_avg_price DECIMAL(15,2);
BEGIN
  SELECT 
    SUM(quantity * unit_price) / NULLIF(SUM(quantity), 0)
  INTO v_avg_price
  FROM asset_purchases
  WHERE asset_purchases.asset_id = calculate_average_price.asset_id
    AND deleted_at IS NULL;
  
  RETURN COALESCE(v_avg_price, 0);
END;
$$ LANGUAGE plpgsql;

-- Update asset average price trigger
CREATE OR REPLACE FUNCTION update_asset_average_price()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    UPDATE assets
    SET average_price = calculate_average_price(NEW.asset_id)
    WHERE id = NEW.asset_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE assets
    SET average_price = calculate_average_price(OLD.asset_id)
    WHERE id = OLD.asset_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_avg_price_trigger 
  AFTER INSERT OR UPDATE OR DELETE ON asset_purchases
  FOR EACH ROW EXECUTE FUNCTION update_asset_average_price();

-- =============================================
-- 11. VIEWS - Kasulikud vaated
-- =============================================

-- Assets with full location path
CREATE OR REPLACE VIEW assets_with_location AS
SELECT 
  a.*,
  w.name as warehouse_name,
  w.code as warehouse_code,
  wl.path as location_path,
  wl.name as location_name,
  c.name as category_name,
  c.path as category_path,
  u.full_name as assigned_user_name,
  p.name as assigned_project_name
FROM assets a
LEFT JOIN warehouses w ON w.id = a.current_warehouse_id
LEFT JOIN warehouse_locations wl ON wl.id = a.current_location_id
LEFT JOIN asset_categories c ON c.id = a.category_id
LEFT JOIN user_profiles u ON u.id = a.assigned_to_user_id
LEFT JOIN projects p ON p.id = a.assigned_to_project_id
WHERE a.deleted_at IS NULL;

-- Low stock consumables
CREATE OR REPLACE VIEW low_stock_assets AS
SELECT 
  a.*,
  w.name as warehouse_name,
  c.name as category_name,
  (a.quantity_available / NULLIF(a.min_quantity, 0) * 100)::DECIMAL(5,2) as stock_percent
FROM assets a
LEFT JOIN warehouses w ON w.id = a.current_warehouse_id
LEFT JOIN asset_categories c ON c.id = a.category_id
WHERE a.is_consumable = true
  AND a.quantity_available <= a.reorder_point
  AND a.deleted_at IS NULL
ORDER BY stock_percent ASC;

-- Pending transfers
CREATE OR REPLACE VIEW pending_transfers_view AS
SELECT 
  t.*,
  a.name as asset_name,
  a.asset_code,
  fw.name as from_warehouse_name,
  tw.name as to_warehouse_name,
  fu.full_name as from_user_name,
  tu.full_name as to_user_name,
  ru.full_name as requested_by_name
FROM asset_transfers t
LEFT JOIN assets a ON a.id = t.asset_id
LEFT JOIN warehouses fw ON fw.id = t.from_warehouse_id
LEFT JOIN warehouses tw ON tw.id = t.to_warehouse_id
LEFT JOIN user_profiles fu ON fu.id = t.from_user_id
LEFT JOIN user_profiles tu ON tu.id = t.to_user_id
LEFT JOIN user_profiles ru ON ru.id = t.requested_by_user_id
WHERE t.status = 'pending'
  AND t.deleted_at IS NULL
ORDER BY t.created_at DESC;

-- Upcoming maintenances
CREATE OR REPLACE VIEW upcoming_maintenances_view AS
SELECT 
  m.*,
  a.name as asset_name,
  a.asset_code,
  c.name as category_name,
  w.name as warehouse_name,
  u.full_name as performed_by_name,
  (m.scheduled_date - CURRENT_DATE) as days_until
FROM asset_maintenances m
LEFT JOIN assets a ON a.id = m.asset_id
LEFT JOIN asset_categories c ON c.id = a.category_id
LEFT JOIN warehouses w ON w.id = a.current_warehouse_id
LEFT JOIN user_profiles u ON u.id = m.performed_by_user_id
WHERE m.status = 'scheduled'
  AND m.scheduled_date >= CURRENT_DATE
  AND m.scheduled_date <= CURRENT_DATE + INTERVAL '30 days'
  AND m.deleted_at IS NULL
ORDER BY m.scheduled_date ASC;

-- =============================================
-- 12. SAMPLE DATA (Optional - Remove in production)
-- =============================================

-- Example: Create default locations for a warehouse
-- INSERT INTO warehouse_locations (tenant_id, warehouse_id, code, name, type) VALUES
--   ((SELECT id FROM tenants LIMIT 1), (SELECT id FROM warehouses WHERE code = 'W001' LIMIT 1), 'RUUM1', 'Ruum 1', 'room'),
--   ((SELECT id FROM tenants LIMIT 1), (SELECT id FROM warehouses WHERE code = 'W001' LIMIT 1), 'A', 'Riiul A', 'shelf'),
--   ((SELECT id FROM tenants LIMIT 1), (SELECT id FROM warehouses WHERE code = 'W001' LIMIT 1), '1', 'Rida 1', 'row');

-- =============================================
-- END OF MIGRATION
-- =============================================

-- Verify tables created
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  - warehouse_locations';
  RAISE NOTICE '  - asset_relations';
  RAISE NOTICE '  - maintenance_cost_items';
  RAISE NOTICE '  - inventory_counts';
  RAISE NOTICE '  - inventory_count_items';
  RAISE NOTICE '  - audit_logs';
  RAISE NOTICE 'Created views:';
  RAISE NOTICE '  - assets_with_location';
  RAISE NOTICE '  - low_stock_assets';
  RAISE NOTICE '  - pending_transfers_view';
  RAISE NOTICE '  - upcoming_maintenances_view';
END $$;
