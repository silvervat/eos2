-- =============================================
-- CATEGORY MINIMUM STOCK LEVELS
-- =============================================
-- Version: 1.0.0
-- Date: 2025-11-30
-- Description: Add minimum stock quantity field to asset_categories
-- for consumable items low stock warnings
-- =============================================

-- Add min_stock_quantity column to asset_categories
ALTER TABLE asset_categories
  ADD COLUMN IF NOT EXISTS min_stock_quantity INTEGER DEFAULT 0;

-- Add reorder_point for advanced inventory management
ALTER TABLE asset_categories
  ADD COLUMN IF NOT EXISTS reorder_point INTEGER DEFAULT 0;

-- Add preferred_supplier for reordering
ALTER TABLE asset_categories
  ADD COLUMN IF NOT EXISTS preferred_supplier TEXT;

-- Add unit of measure
ALTER TABLE asset_categories
  ADD COLUMN IF NOT EXISTS unit_of_measure TEXT DEFAULT 'tk';

-- Comments
COMMENT ON COLUMN asset_categories.min_stock_quantity IS 'Minimum stock quantity - below this shows warning';
COMMENT ON COLUMN asset_categories.reorder_point IS 'Stock level at which to trigger reorder';
COMMENT ON COLUMN asset_categories.preferred_supplier IS 'Default supplier for this category';
COMMENT ON COLUMN asset_categories.unit_of_measure IS 'Unit of measure (tk, m, kg, l, etc.)';

-- =============================================
-- VIEW: Category stock summary with warnings
-- =============================================
CREATE OR REPLACE VIEW category_stock_summary AS
SELECT
  c.id AS category_id,
  c.tenant_id,
  c.code,
  c.name,
  c.path,
  c.is_consumable,
  c.min_stock_quantity,
  c.reorder_point,
  c.unit_of_measure,
  COALESCE(SUM(a.current_quantity), 0) AS total_stock,
  COUNT(DISTINCT a.id) AS asset_count,
  CASE
    WHEN c.is_consumable AND c.min_stock_quantity > 0 AND COALESCE(SUM(a.current_quantity), 0) < c.min_stock_quantity THEN 'critical'
    WHEN c.is_consumable AND c.reorder_point > 0 AND COALESCE(SUM(a.current_quantity), 0) < c.reorder_point THEN 'low'
    ELSE 'ok'
  END AS stock_status
FROM asset_categories c
LEFT JOIN assets a ON a.category_id = c.id AND a.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.tenant_id, c.code, c.name, c.path, c.is_consumable,
         c.min_stock_quantity, c.reorder_point, c.unit_of_measure;

-- Grant access
GRANT SELECT ON category_stock_summary TO authenticated;

-- =============================================
-- END OF MIGRATION
-- =============================================
