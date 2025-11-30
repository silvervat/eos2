-- =============================================
-- WAREHOUSE MANAGEMENT SYSTEM - DATABASE MIGRATION
-- =============================================
-- Version: 1.0.0
-- Date: 2024-11-30
-- Description: Complete warehouse management tables
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- =============================================
-- 1. WAREHOUSES - Ladud
-- =============================================
CREATE TABLE warehouses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'main', -- 'main', 'mobile', 'external', 'vehicle'
  location TEXT,
  address TEXT,
  manager_id UUID REFERENCES user_profiles(id),
  contact_phone TEXT,
  contact_email TEXT,
  capacity_m3 DECIMAL(10,2),
  temperature_controlled BOOLEAN DEFAULT false,
  security_level TEXT DEFAULT 'standard', -- 'low', 'standard', 'high', 'maximum'
  access_hours TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'maintenance'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(tenant_id, code)
);

CREATE INDEX idx_warehouses_tenant ON warehouses(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_warehouses_status ON warehouses(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_warehouses_manager ON warehouses(manager_id) WHERE deleted_at IS NULL;

COMMENT ON TABLE warehouses IS 'Ladude põhitabel';

-- =============================================
-- 2. ASSET CATEGORIES - Kategooriad
-- =============================================
CREATE TABLE asset_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES asset_categories(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT,
  path TEXT, -- Materialized path: /parent/child/grandchild
  level INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  requires_maintenance BOOLEAN DEFAULT false,
  maintenance_interval_days INTEGER,
  is_consumable BOOLEAN DEFAULT false, -- Kas tükikaup või vara
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(tenant_id, code)
);

CREATE INDEX idx_categories_tenant ON asset_categories(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_categories_parent ON asset_categories(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_categories_path ON asset_categories USING GIN(path gin_trgm_ops);
CREATE INDEX idx_categories_consumable ON asset_categories(is_consumable) WHERE deleted_at IS NULL;

COMMENT ON TABLE asset_categories IS 'Varade kategooriad (lõputu hierarhia)';

-- =============================================
-- 3. ASSETS - Varad ja Tooted
-- =============================================
CREATE TABLE assets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES asset_categories(id),
  
  -- Identifikatsioon
  asset_code TEXT NOT NULL,
  barcode TEXT,
  qr_code TEXT,
  serial_number TEXT,
  
  -- Põhiinfo
  name TEXT NOT NULL,
  model TEXT,
  manufacturer TEXT,
  description TEXT,
  keywords TEXT[], -- Otsinguks
  
  -- Tüüp ja staatus
  type TEXT DEFAULT 'asset', -- 'asset', 'consumable', 'tool'
  status TEXT DEFAULT 'available', -- 'available', 'in_use', 'maintenance', 'rented', 'retired', 'lost', 'damaged'
  condition TEXT DEFAULT 'good', -- 'excellent', 'good', 'fair', 'poor'
  
  -- Asukoht
  current_warehouse_id UUID REFERENCES warehouses(id),
  current_location TEXT, -- Täpne asukoht laos
  
  -- Kasutaja ja projekt
  assigned_to_user_id UUID REFERENCES user_profiles(id),
  assigned_to_project_id UUID REFERENCES projects(id),
  assigned_at TIMESTAMPTZ,
  
  -- Hinnad
  purchase_price DECIMAL(15,2),
  current_value DECIMAL(15,2),
  average_price DECIMAL(15,2), -- Consumables jaoks
  currency TEXT DEFAULT 'EUR',
  
  -- Tükikaupade väljad
  is_consumable BOOLEAN DEFAULT false,
  quantity_available DECIMAL(10,2) DEFAULT 0,
  quantity_reserved DECIMAL(10,2) DEFAULT 0,
  quantity_unit TEXT DEFAULT 'tk', -- 'tk', 'kg', 'l', 'm', 'm2', 'm3'
  min_quantity DECIMAL(10,2),
  max_quantity DECIMAL(10,2),
  reorder_point DECIMAL(10,2),
  reorder_quantity DECIMAL(10,2),
  
  -- Hooldus
  requires_maintenance BOOLEAN DEFAULT false,
  maintenance_interval_days INTEGER,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  maintenance_notes TEXT,
  
  -- Rentimine
  is_rental BOOLEAN DEFAULT false,
  rental_start_date DATE,
  rental_end_date DATE,
  rental_company TEXT,
  rental_contract_number TEXT,
  rental_monthly_cost DECIMAL(15,2),
  rental_deposit DECIMAL(15,2),
  
  -- Kindlustus
  is_insured BOOLEAN DEFAULT false,
  insurance_company TEXT,
  insurance_policy_number TEXT,
  insurance_value DECIMAL(15,2),
  insurance_expires_at DATE,
  
  -- Kuupäevad
  purchase_date DATE,
  warranty_expires_at DATE,
  acquisition_date DATE,
  retirement_date DATE,
  
  -- Muud
  dimensions TEXT, -- 'L x W x H'
  weight_kg DECIMAL(10,2),
  color TEXT,
  notes TEXT,
  defects JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(tenant_id, asset_code)
);

-- Indeksid
CREATE INDEX idx_assets_tenant ON assets(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_category ON assets(category_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_warehouse ON assets(current_warehouse_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_assigned_user ON assets(assigned_to_user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_assigned_project ON assets(assigned_to_project_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_status ON assets(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_barcode ON assets(barcode) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_qr ON assets(qr_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_serial ON assets(serial_number) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_consumable ON assets(is_consumable) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_rental ON assets(is_rental) WHERE is_rental = true AND deleted_at IS NULL;
CREATE INDEX idx_assets_insurance_expiry ON assets(insurance_expires_at) WHERE is_insured = true AND deleted_at IS NULL;
CREATE INDEX idx_assets_maintenance ON assets(next_maintenance_date) WHERE requires_maintenance = true AND deleted_at IS NULL;
CREATE INDEX idx_assets_keywords ON assets USING GIN(keywords);
CREATE INDEX idx_assets_search ON assets USING GIN(to_tsvector('estonian', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(manufacturer, '')));

COMMENT ON TABLE assets IS 'Varad ja tükikaubad';

-- =============================================
-- 4. ASSET PHOTOS - Fotod
-- =============================================
CREATE TABLE asset_photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  file_size BIGINT,
  file_type TEXT,
  width INTEGER,
  height INTEGER,
  
  photo_type TEXT DEFAULT 'general', -- 'general', 'check_in', 'check_out', 'damage', 'repair', 'maintenance'
  category TEXT, -- 'before', 'after', 'damage', 'current'
  
  taken_at TIMESTAMPTZ DEFAULT NOW(),
  taken_by_user_id UUID REFERENCES user_profiles(id),
  location TEXT,
  
  title TEXT,
  description TEXT,
  tags TEXT[],
  is_primary BOOLEAN DEFAULT false,
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_asset_photos_asset ON asset_photos(asset_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_asset_photos_type ON asset_photos(photo_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_asset_photos_primary ON asset_photos(is_primary) WHERE is_primary = true AND deleted_at IS NULL;

COMMENT ON TABLE asset_photos IS 'Varade fotogalerii';

-- =============================================
-- 5. ASSET TRANSFERS - Ülekanded
-- =============================================
CREATE TABLE asset_transfers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  transfer_number TEXT NOT NULL,
  
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  quantity DECIMAL(10,2) DEFAULT 1,
  
  -- Kust ja kuhu
  from_warehouse_id UUID REFERENCES warehouses(id),
  to_warehouse_id UUID REFERENCES warehouses(id),
  from_user_id UUID REFERENCES user_profiles(id),
  to_user_id UUID REFERENCES user_profiles(id),
  from_project_id UUID REFERENCES projects(id),
  to_project_id UUID REFERENCES projects(id),
  
  -- Staatus ja kinnitused
  status TEXT DEFAULT 'pending', -- 'pending', 'in_transit', 'delivered', 'rejected', 'cancelled'
  transfer_type TEXT DEFAULT 'warehouse', -- 'warehouse', 'user', 'project', 'rental_out', 'rental_return'
  
  -- Kuupäevad
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  requested_by_user_id UUID REFERENCES user_profiles(id),
  approved_at TIMESTAMPTZ,
  approved_by_user_id UUID REFERENCES user_profiles(id),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  expected_return_date DATE,
  
  -- Fotod ja seisund
  check_out_photos JSONB DEFAULT '[]',
  check_in_photos JSONB DEFAULT '[]',
  condition_before TEXT,
  condition_after TEXT,
  
  -- Muud
  notes TEXT,
  reason TEXT,
  rejection_reason TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(tenant_id, transfer_number)
);

CREATE INDEX idx_transfers_tenant ON asset_transfers(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transfers_asset ON asset_transfers(asset_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transfers_status ON asset_transfers(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_transfers_from_warehouse ON asset_transfers(from_warehouse_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transfers_to_warehouse ON asset_transfers(to_warehouse_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transfers_from_user ON asset_transfers(from_user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transfers_to_user ON asset_transfers(to_user_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_transfers_requested ON asset_transfers(requested_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_transfers_composite ON asset_transfers(tenant_id, status, created_at DESC) WHERE deleted_at IS NULL;

COMMENT ON TABLE asset_transfers IS 'Varade ülekanded';

-- =============================================
-- 6. ASSET MAINTENANCES - Hooldused
-- =============================================
CREATE TABLE asset_maintenances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  
  maintenance_type TEXT DEFAULT 'routine', -- 'routine', 'repair', 'inspection', 'calibration', 'certification'
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed', 'cancelled', 'overdue'
  
  scheduled_date DATE NOT NULL,
  completed_date DATE,
  due_date DATE,
  
  performed_by_user_id UUID REFERENCES user_profiles(id),
  performed_by_company TEXT,
  
  cost DECIMAL(15,2),
  invoice_number TEXT,
  
  description TEXT,
  work_performed TEXT,
  parts_replaced TEXT,
  issues_found TEXT,
  recommendations TEXT,
  
  next_maintenance_date DATE,
  next_maintenance_type TEXT,
  
  photos JSONB DEFAULT '[]',
  documents JSONB DEFAULT '[]',
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_maintenances_asset ON asset_maintenances(asset_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_maintenances_status ON asset_maintenances(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_maintenances_scheduled ON asset_maintenances(scheduled_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_maintenances_due ON asset_maintenances(due_date) WHERE status = 'scheduled' AND deleted_at IS NULL;

COMMENT ON TABLE asset_maintenances IS 'Varade hooldused';

-- =============================================
-- 7. MAINTENANCE TEMPLATES - Hoolduskavad
-- =============================================
CREATE TABLE maintenance_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category_id UUID REFERENCES asset_categories(id),
  
  name TEXT NOT NULL,
  description TEXT,
  maintenance_type TEXT DEFAULT 'routine',
  
  interval_days INTEGER,
  interval_type TEXT DEFAULT 'days', -- 'days', 'weeks', 'months', 'years', 'usage_hours'
  
  checklist JSONB DEFAULT '[]',
  required_parts TEXT[],
  estimated_duration_hours DECIMAL(5,2),
  estimated_cost DECIMAL(15,2),
  
  notification_days_before INTEGER DEFAULT 7,
  notification_users UUID[],
  
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_maintenance_templates_tenant ON maintenance_templates(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_maintenance_templates_category ON maintenance_templates(category_id) WHERE deleted_at IS NULL;

COMMENT ON TABLE maintenance_templates IS 'Hoolduskavad (šabloonid)';

-- =============================================
-- 8. ASSET PURCHASES - Ostud
-- =============================================
CREATE TABLE asset_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  
  purchase_order_number TEXT,
  invoice_number TEXT,
  supplier_id UUID REFERENCES companies(id),
  
  quantity DECIMAL(10,2) NOT NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  total_price DECIMAL(15,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  
  purchase_date DATE NOT NULL,
  received_date DATE,
  received_by_user_id UUID REFERENCES user_profiles(id),
  
  warehouse_id UUID REFERENCES warehouses(id),
  
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_purchases_asset ON asset_purchases(asset_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_purchases_date ON asset_purchases(purchase_date) WHERE deleted_at IS NULL;
CREATE INDEX idx_purchases_tenant ON asset_purchases(tenant_id) WHERE deleted_at IS NULL;

COMMENT ON TABLE asset_purchases IS 'Varade ostud (keskmine hinna arvutamiseks)';

-- =============================================
-- 9. STOCK MOVEMENTS - Lao Liikumised
-- =============================================
CREATE TABLE stock_movements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  warehouse_id UUID NOT NULL REFERENCES warehouses(id),
  
  movement_type TEXT NOT NULL, -- 'in', 'out', 'adjustment', 'transfer', 'lost', 'found', 'damaged'
  quantity DECIMAL(10,2) NOT NULL,
  quantity_before DECIMAL(10,2),
  quantity_after DECIMAL(10,2),
  
  reference_type TEXT, -- 'purchase', 'transfer', 'project', 'maintenance', 'disposal'
  reference_id UUID,
  
  user_id UUID REFERENCES user_profiles(id),
  project_id UUID REFERENCES projects(id),
  
  reason TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_stock_movements_asset ON stock_movements(asset_id);
CREATE INDEX idx_stock_movements_warehouse ON stock_movements(warehouse_id);
CREATE INDEX idx_stock_movements_date ON stock_movements(created_at);
CREATE INDEX idx_stock_movements_tenant ON stock_movements(tenant_id);

COMMENT ON TABLE stock_movements IS 'Lao liikumiste ajalugu';

-- =============================================
-- 10. ASSET REMINDERS - Meeldetuletused
-- =============================================
CREATE TABLE asset_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  reminder_type TEXT NOT NULL, -- 'maintenance', 'insurance_expiry', 'warranty_expiry', 'rental_end', 'low_stock', 'return_overdue'
  status TEXT DEFAULT 'active', -- 'active', 'snoozed', 'completed', 'dismissed'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
  
  asset_id UUID REFERENCES assets(id),
  category_id UUID REFERENCES asset_categories(id),
  
  title TEXT NOT NULL,
  message TEXT,
  
  due_date DATE,
  remind_at TIMESTAMPTZ,
  snoozed_until TIMESTAMPTZ,
  
  notify_users UUID[],
  notification_sent BOOLEAN DEFAULT false,
  last_notification_at TIMESTAMPTZ,
  
  action_url TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_reminders_tenant ON asset_reminders(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reminders_status ON asset_reminders(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_reminders_due ON asset_reminders(due_date) WHERE status = 'active' AND deleted_at IS NULL;
CREATE INDEX idx_reminders_asset ON asset_reminders(asset_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_reminders_type ON asset_reminders(reminder_type) WHERE deleted_at IS NULL;

COMMENT ON TABLE asset_reminders IS 'Meeldetuletused (hooldused, kindlustused, jne)';

-- =============================================
-- 11. WAREHOUSE ORDERS - Lao Tellimused
-- =============================================
CREATE TABLE warehouse_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  order_number TEXT NOT NULL,
  
  order_type TEXT DEFAULT 'purchase', -- 'purchase', 'replenishment', 'emergency'
  status TEXT DEFAULT 'draft', -- 'draft', 'submitted', 'approved', 'ordered', 'partially_received', 'received', 'cancelled'
  
  warehouse_id UUID REFERENCES warehouses(id),
  supplier_id UUID REFERENCES companies(id),
  
  requested_by_user_id UUID REFERENCES user_profiles(id),
  approved_by_user_id UUID REFERENCES user_profiles(id),
  
  total_amount DECIMAL(15,2),
  currency TEXT DEFAULT 'EUR',
  
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  
  UNIQUE(tenant_id, order_number)
);

CREATE INDEX idx_orders_tenant ON warehouse_orders(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_status ON warehouse_orders(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_orders_warehouse ON warehouse_orders(warehouse_id) WHERE deleted_at IS NULL;

COMMENT ON TABLE warehouse_orders IS 'Lao tellimused';

-- =============================================
-- 12. WAREHOUSE ORDER ITEMS - Tellimuse Read
-- =============================================
CREATE TABLE warehouse_order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES warehouse_orders(id) ON DELETE CASCADE,
  asset_id UUID NOT NULL REFERENCES assets(id),
  
  quantity_ordered DECIMAL(10,2) NOT NULL,
  quantity_received DECIMAL(10,2) DEFAULT 0,
  
  unit_price DECIMAL(15,2),
  total_price DECIMAL(15,2),
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_order_items_order ON warehouse_order_items(order_id);
CREATE INDEX idx_order_items_asset ON warehouse_order_items(asset_id);

COMMENT ON TABLE warehouse_order_items IS 'Tellimuste read';

-- =============================================
-- FUNCTIONS & TRIGGERS
-- =============================================

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON warehouses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_categories_updated_at BEFORE UPDATE ON asset_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_transfers_updated_at BEFORE UPDATE ON asset_transfers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_maintenances_updated_at BEFORE UPDATE ON asset_maintenances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_reminders_updated_at BEFORE UPDATE ON asset_reminders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warehouse_orders_updated_at BEFORE UPDATE ON warehouse_orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function: Generate transfer number
CREATE OR REPLACE FUNCTION generate_transfer_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.transfer_number IS NULL THEN
    NEW.transfer_number := 'TR-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                          LPAD(NEXTVAL('transfer_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE transfer_number_seq;

CREATE TRIGGER generate_transfer_number_trigger BEFORE INSERT ON asset_transfers
  FOR EACH ROW EXECUTE FUNCTION generate_transfer_number();

-- Function: Generate order number
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.order_number IS NULL THEN
    NEW.order_number := 'WO-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || 
                        LPAD(NEXTVAL('order_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE SEQUENCE order_number_seq;

CREATE TRIGGER generate_order_number_trigger BEFORE INSERT ON warehouse_orders
  FOR EACH ROW EXECUTE FUNCTION generate_order_number();

-- Function: Update category path (materialized path)
CREATE OR REPLACE FUNCTION update_category_path()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NULL THEN
    NEW.path := '/' || NEW.code;
    NEW.level := 0;
  ELSE
    SELECT path || '/' || NEW.code, level + 1
    INTO NEW.path, NEW.level
    FROM asset_categories
    WHERE id = NEW.parent_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_category_path_trigger BEFORE INSERT OR UPDATE ON asset_categories
  FOR EACH ROW EXECUTE FUNCTION update_category_path();

-- =============================================
-- SAMPLE DATA (Optional - remove in production)
-- =============================================

-- Sample warehouses
-- INSERT INTO warehouses (tenant_id, code, name, type) VALUES
--   ((SELECT id FROM tenants LIMIT 1), 'W001', 'Peakontor ladu', 'main'),
--   ((SELECT id FROM tenants LIMIT 1), 'W002', 'Arlanda ladu', 'external'),
--   ((SELECT id FROM tenants LIMIT 1), 'V001', 'Sõiduk - Iveco', 'vehicle');

-- Sample categories
-- INSERT INTO asset_categories (tenant_id, code, name, is_consumable) VALUES
--   ((SELECT id FROM tenants LIMIT 1), 'TOOLS', 'Tööriistad', false),
--   ((SELECT id FROM tenants LIMIT 1), 'CONSUMABLES', 'Tükikaubad', true),
--   ((SELECT id FROM tenants LIMIT 1), 'VEHICLES', 'Sõidukid', false);

-- =============================================
-- END OF MIGRATION
-- =============================================
