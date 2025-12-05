-- =====================================================
-- PERFORMANCE OPTIMIZATIONS
-- Migration: 020_performance_optimizations.sql
-- Date: 2024-12-05
-- Description: Database indexes, materialized views, and query optimizations
-- =====================================================

-- =====================================================
-- 1. FILE VAULT INDEXES
-- =====================================================

-- Composite index for folder listing (most common query)
CREATE INDEX IF NOT EXISTS idx_file_vault_files_folder_created
    ON file_vault_files(folder_id, created_at DESC)
    WHERE deleted_at IS NULL;

-- Index for file owner queries
CREATE INDEX IF NOT EXISTS idx_file_vault_files_owner
    ON file_vault_files(created_by, created_at DESC)
    WHERE deleted_at IS NULL;

-- Index for file type filtering
CREATE INDEX IF NOT EXISTS idx_file_vault_files_mime
    ON file_vault_files(mime_type, created_at DESC)
    WHERE deleted_at IS NULL;

-- Full-text search index (Estonian language)
CREATE INDEX IF NOT EXISTS idx_file_vault_files_search
    ON file_vault_files
    USING gin(to_tsvector('simple', COALESCE(name, '') || ' ' || COALESCE(description, '')));

-- Folder hierarchy index
CREATE INDEX IF NOT EXISTS idx_file_vault_folders_parent
    ON file_vault_folders(parent_id, name)
    WHERE deleted_at IS NULL;

-- =====================================================
-- 2. WAREHOUSE INDEXES
-- =====================================================

-- Assets by category (common filter)
CREATE INDEX IF NOT EXISTS idx_warehouse_assets_category
    ON warehouse_assets(category_id, created_at DESC)
    WHERE deleted_at IS NULL;

-- Assets by status
CREATE INDEX IF NOT EXISTS idx_warehouse_assets_status
    ON warehouse_assets(status, created_at DESC)
    WHERE deleted_at IS NULL;

-- Assets by warehouse location
CREATE INDEX IF NOT EXISTS idx_warehouse_assets_warehouse
    ON warehouse_assets(warehouse_id, created_at DESC)
    WHERE deleted_at IS NULL;

-- Low stock query optimization
CREATE INDEX IF NOT EXISTS idx_warehouse_assets_quantity
    ON warehouse_assets(quantity, min_quantity)
    WHERE deleted_at IS NULL AND quantity <= min_quantity;

-- Assets search
CREATE INDEX IF NOT EXISTS idx_warehouse_assets_search
    ON warehouse_assets
    USING gin(to_tsvector('simple', COALESCE(name, '') || ' ' || COALESCE(description, '') || ' ' || COALESCE(serial_number, '')));

-- =====================================================
-- 3. QUOTES & PARTNERS INDEXES
-- =====================================================

-- Quotes by status
CREATE INDEX IF NOT EXISTS idx_quotes_status
    ON quotes(status, created_at DESC)
    WHERE deleted_at IS NULL;

-- Quotes by client
CREATE INDEX IF NOT EXISTS idx_quotes_client
    ON quotes(client_id, created_at DESC)
    WHERE deleted_at IS NULL;

-- Partners search
CREATE INDEX IF NOT EXISTS idx_companies_search
    ON companies
    USING gin(to_tsvector('simple', COALESCE(name, '') || ' ' || COALESCE(email, '') || ' ' || COALESCE(registration_code, '')));

-- Partners by type
CREATE INDEX IF NOT EXISTS idx_companies_type
    ON companies(company_type, created_at DESC);

-- =====================================================
-- 4. PROJECTS INDEXES
-- =====================================================

-- Projects by status
CREATE INDEX IF NOT EXISTS idx_projects_status
    ON projects(status, created_at DESC);

-- Projects by client
CREATE INDEX IF NOT EXISTS idx_projects_client
    ON projects(client_id, created_at DESC);

-- Projects search
CREATE INDEX IF NOT EXISTS idx_projects_search
    ON projects
    USING gin(to_tsvector('simple', COALESCE(name, '') || ' ' || COALESCE(code, '') || ' ' || COALESCE(description, '')));

-- =====================================================
-- 5. PERSONNEL & ATTENDANCE INDEXES
-- =====================================================

-- Attendance by employee and date
CREATE INDEX IF NOT EXISTS idx_attendance_employee_date
    ON attendance_records(employee_id, date DESC);

-- Attendance by project
CREATE INDEX IF NOT EXISTS idx_attendance_project
    ON attendance_records(project_id, date DESC)
    WHERE project_id IS NOT NULL;

-- Leave requests by status
CREATE INDEX IF NOT EXISTS idx_leave_requests_status
    ON leave_requests(status, start_date DESC);

-- Leave requests by employee
CREATE INDEX IF NOT EXISTS idx_leave_requests_employee
    ON leave_requests(employee_id, start_date DESC);

-- =====================================================
-- 6. ULTRA TABLES INDEXES
-- =====================================================

-- Records by table
CREATE INDEX IF NOT EXISTS idx_ultra_table_records_table
    ON ultra_table_records(table_id, created_at DESC);

-- Records full-text search on data
CREATE INDEX IF NOT EXISTS idx_ultra_table_records_data
    ON ultra_table_records USING gin(data);

-- =====================================================
-- 7. AUDIT LOG INDEXES
-- =====================================================

-- Audit by entity
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity
    ON audit_logs(entity_type, entity_id, created_at DESC);

-- Audit by user
CREATE INDEX IF NOT EXISTS idx_audit_logs_user
    ON audit_logs(user_id, created_at DESC);

-- =====================================================
-- 8. MATERIALIZED VIEWS FOR STATISTICS
-- =====================================================

-- File vault statistics (refresh hourly)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_file_vault_stats AS
SELECT
    tenant_id,
    folder_id,
    COUNT(*) as file_count,
    SUM(size_bytes) as total_size,
    MAX(created_at) as last_upload,
    COUNT(CASE WHEN mime_type LIKE 'image/%' THEN 1 END) as image_count,
    COUNT(CASE WHEN mime_type = 'application/pdf' THEN 1 END) as pdf_count
FROM file_vault_files
WHERE deleted_at IS NULL
GROUP BY tenant_id, folder_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_file_vault_stats
    ON mv_file_vault_stats(tenant_id, folder_id);

-- Warehouse statistics (refresh hourly)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_warehouse_stats AS
SELECT
    tenant_id,
    warehouse_id,
    category_id,
    status,
    COUNT(*) as asset_count,
    SUM(quantity) as total_quantity,
    SUM(CASE WHEN quantity <= COALESCE(min_quantity, 0) THEN 1 ELSE 0 END) as low_stock_count
FROM warehouse_assets
WHERE deleted_at IS NULL
GROUP BY tenant_id, warehouse_id, category_id, status;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_warehouse_stats
    ON mv_warehouse_stats(tenant_id, warehouse_id, category_id, status);

-- Quote statistics (refresh hourly)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_quote_stats AS
SELECT
    tenant_id,
    status,
    DATE_TRUNC('month', created_at) as month,
    COUNT(*) as quote_count,
    SUM(total_amount) as total_amount,
    AVG(total_amount) as avg_amount
FROM quotes
WHERE deleted_at IS NULL
GROUP BY tenant_id, status, DATE_TRUNC('month', created_at);

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_quote_stats
    ON mv_quote_stats(tenant_id, status, month);

-- =====================================================
-- 9. REFRESH FUNCTIONS
-- =====================================================

-- Function to refresh all materialized views
CREATE OR REPLACE FUNCTION refresh_all_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_file_vault_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_warehouse_stats;
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_quote_stats;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh file vault stats only
CREATE OR REPLACE FUNCTION refresh_file_vault_stats()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY mv_file_vault_stats;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 10. QUERY OPTIMIZATION FUNCTIONS
-- =====================================================

-- Optimized file listing with cursor pagination
CREATE OR REPLACE FUNCTION get_files_paginated(
    p_folder_id UUID,
    p_limit INT DEFAULT 50,
    p_cursor TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(
    id UUID,
    name TEXT,
    size_bytes BIGINT,
    mime_type TEXT,
    created_at TIMESTAMPTZ,
    has_more BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH files AS (
        SELECT
            f.id,
            f.name,
            f.size_bytes,
            f.mime_type,
            f.created_at
        FROM file_vault_files f
        WHERE f.folder_id = p_folder_id
          AND f.deleted_at IS NULL
          AND (p_cursor IS NULL OR f.created_at < p_cursor)
        ORDER BY f.created_at DESC
        LIMIT p_limit + 1
    )
    SELECT
        files.id,
        files.name,
        files.size_bytes,
        files.mime_type,
        files.created_at,
        (SELECT COUNT(*) > p_limit FROM files) as has_more
    FROM files
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. CONNECTION POOLING OPTIMIZATION
-- =====================================================

-- Set statement timeout for long-running queries
ALTER DATABASE postgres SET statement_timeout = '30s';

-- Set idle session timeout
ALTER DATABASE postgres SET idle_in_transaction_session_timeout = '5min';

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON INDEX idx_file_vault_files_folder_created IS 'Optimizes folder listing queries';
COMMENT ON INDEX idx_warehouse_assets_category IS 'Optimizes category filtering';
COMMENT ON MATERIALIZED VIEW mv_file_vault_stats IS 'Pre-computed file statistics, refresh hourly';
COMMENT ON FUNCTION refresh_all_stats() IS 'Refreshes all statistics materialized views';
