-- =============================================
-- FILE VAULT - Comprehensive Performance Optimization
-- =============================================
-- Version: 1.0.0
-- Date: 2024-12-05
-- Description: Full performance optimization including:
--   - Composite indexes for common query patterns
--   - Full-text search with GIN indexes
--   - Materialized views for analytics
--   - pg_cron background jobs for maintenance
--   - Performance monitoring functions
--   - Cache warming strategies
-- =============================================

-- ============================================
-- PART 1: COMPOSITE INDEXES FOR QUERY PATTERNS
-- ============================================

-- Primary file listing query (vault + folder + deleted filter + sort)
-- Used by: GET /api/file-vault/files
CREATE INDEX IF NOT EXISTS idx_files_vault_folder_deleted_created
ON public.files(vault_id, folder_id, deleted_at, created_at DESC)
WHERE deleted_at IS NULL;

-- Files by vault with sort (most common query)
CREATE INDEX IF NOT EXISTS idx_files_vault_created_desc
ON public.files(vault_id, created_at DESC)
WHERE deleted_at IS NULL;

-- Files by vault sorted by name (alphabetical listing)
CREATE INDEX IF NOT EXISTS idx_files_vault_name_asc
ON public.files(vault_id, name ASC)
WHERE deleted_at IS NULL;

-- Files by vault sorted by size (largest first)
CREATE INDEX IF NOT EXISTS idx_files_vault_size_desc
ON public.files(vault_id, size_bytes DESC)
WHERE deleted_at IS NULL;

-- Files by MIME type category (for type filtering)
CREATE INDEX IF NOT EXISTS idx_files_vault_mime
ON public.files(vault_id, mime_type, created_at DESC)
WHERE deleted_at IS NULL;

-- Files by extension (for extension filtering)
CREATE INDEX IF NOT EXISTS idx_files_extension
ON public.files(vault_id, extension, created_at DESC)
WHERE deleted_at IS NULL;

-- Files by uploader (for "my uploads" filter)
CREATE INDEX IF NOT EXISTS idx_files_uploaded_by
ON public.files(uploaded_by, vault_id, created_at DESC)
WHERE deleted_at IS NULL;

-- Files by owner (for ownership queries)
CREATE INDEX IF NOT EXISTS idx_files_owner
ON public.files(owner_id, vault_id, created_at DESC)
WHERE deleted_at IS NULL;

-- Soft-deleted files (for trash view)
CREATE INDEX IF NOT EXISTS idx_files_deleted
ON public.files(vault_id, deleted_at DESC)
WHERE deleted_at IS NOT NULL;

-- ============================================
-- PART 2: FULL-TEXT SEARCH INDEXES
-- ============================================

-- Add tsvector column for full-text search if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'files' AND column_name = 'search_vector'
  ) THEN
    ALTER TABLE public.files ADD COLUMN search_vector tsvector;
  END IF;
END$$;

-- GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_files_search_vector
ON public.files USING GIN(search_vector);

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_file_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.path, '')), 'B') ||
    setweight(to_tsvector('simple', COALESCE(NEW.extension, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update search vector
DROP TRIGGER IF EXISTS tr_files_search_vector ON public.files;
CREATE TRIGGER tr_files_search_vector
  BEFORE INSERT OR UPDATE OF name, path, extension
  ON public.files
  FOR EACH ROW
  EXECUTE FUNCTION update_file_search_vector();

-- Backfill existing rows
UPDATE public.files SET search_vector =
  setweight(to_tsvector('simple', COALESCE(name, '')), 'A') ||
  setweight(to_tsvector('simple', COALESCE(path, '')), 'B') ||
  setweight(to_tsvector('simple', COALESCE(extension, '')), 'C')
WHERE search_vector IS NULL;

-- ============================================
-- PART 3: FOLDER INDEXES
-- ============================================

-- Folders by vault and parent (tree navigation)
CREATE INDEX IF NOT EXISTS idx_folders_vault_parent
ON public.folders(vault_id, parent_id)
WHERE deleted_at IS NULL;

-- Folder path lookup
CREATE INDEX IF NOT EXISTS idx_folders_path
ON public.folders(vault_id, path)
WHERE deleted_at IS NULL;

-- ============================================
-- PART 4: USER PROFILE INDEXES
-- ============================================

-- User profile by auth user (most common lookup)
CREATE INDEX IF NOT EXISTS idx_user_profiles_auth_user
ON public.user_profiles(auth_user_id);

-- User profiles by tenant
CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant
ON public.user_profiles(tenant_id);

-- ============================================
-- PART 5: VAULT INDEXES
-- ============================================

-- Vaults by tenant (for vault listing)
CREATE INDEX IF NOT EXISTS idx_file_vaults_tenant
ON public.file_vaults(tenant_id)
WHERE deleted_at IS NULL;

-- ============================================
-- PART 6: MATERIALIZED VIEWS FOR ANALYTICS
-- ============================================

-- Vault statistics materialized view (refreshed by cron)
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_vault_stats AS
SELECT
  v.id AS vault_id,
  v.tenant_id,
  v.name AS vault_name,
  COALESCE(file_counts.total_files, 0) AS total_files,
  COALESCE(file_counts.total_size, 0) AS total_size_bytes,
  COALESCE(folder_counts.total_folders, 0) AS total_folders,
  COALESCE(file_counts.image_count, 0) AS image_count,
  COALESCE(file_counts.video_count, 0) AS video_count,
  COALESCE(file_counts.document_count, 0) AS document_count,
  COALESCE(file_counts.other_count, 0) AS other_count,
  NOW() AS refreshed_at
FROM public.file_vaults v
LEFT JOIN (
  SELECT
    vault_id,
    COUNT(*) AS total_files,
    COALESCE(SUM(size_bytes), 0) AS total_size,
    COUNT(*) FILTER (WHERE mime_type LIKE 'image/%') AS image_count,
    COUNT(*) FILTER (WHERE mime_type LIKE 'video/%') AS video_count,
    COUNT(*) FILTER (WHERE mime_type LIKE 'application/pdf' OR mime_type LIKE 'application/%document%' OR mime_type LIKE 'application/%sheet%') AS document_count,
    COUNT(*) FILTER (WHERE mime_type NOT LIKE 'image/%' AND mime_type NOT LIKE 'video/%' AND mime_type NOT LIKE 'application/pdf' AND mime_type NOT LIKE 'application/%document%' AND mime_type NOT LIKE 'application/%sheet%') AS other_count
  FROM public.files
  WHERE deleted_at IS NULL
  GROUP BY vault_id
) file_counts ON v.id = file_counts.vault_id
LEFT JOIN (
  SELECT
    vault_id,
    COUNT(*) AS total_folders
  FROM public.folders
  WHERE deleted_at IS NULL
  GROUP BY vault_id
) folder_counts ON v.id = folder_counts.vault_id
WHERE v.deleted_at IS NULL;

-- Index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_vault_stats_vault_id
ON mv_vault_stats(vault_id);

CREATE INDEX IF NOT EXISTS idx_mv_vault_stats_tenant
ON mv_vault_stats(tenant_id);

-- Folder statistics materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_folder_stats AS
SELECT
  f.id AS folder_id,
  f.vault_id,
  COALESCE(file_counts.file_count, 0) AS file_count,
  COALESCE(file_counts.total_size, 0) AS total_size_bytes,
  COALESCE(subfolder_counts.subfolder_count, 0) AS subfolder_count,
  NOW() AS refreshed_at
FROM public.folders f
LEFT JOIN (
  SELECT
    folder_id,
    COUNT(*) AS file_count,
    COALESCE(SUM(size_bytes), 0) AS total_size
  FROM public.files
  WHERE deleted_at IS NULL
  GROUP BY folder_id
) file_counts ON f.id = file_counts.folder_id
LEFT JOIN (
  SELECT
    parent_id,
    COUNT(*) AS subfolder_count
  FROM public.folders
  WHERE deleted_at IS NULL
  GROUP BY parent_id
) subfolder_counts ON f.id = subfolder_counts.parent_id
WHERE f.deleted_at IS NULL;

-- Index on folder stats
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_folder_stats_folder_id
ON mv_folder_stats(folder_id);

-- ============================================
-- PART 7: pg_cron BACKGROUND JOBS
-- ============================================

-- Enable pg_cron extension if available
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS pg_cron;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron extension not available, skipping cron jobs';
END$$;

-- Function to refresh vault statistics
CREATE OR REPLACE FUNCTION refresh_vault_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_vault_stats;
  RAISE NOTICE 'Vault stats refreshed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to refresh folder statistics
CREATE OR REPLACE FUNCTION refresh_folder_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_folder_stats;
  RAISE NOTICE 'Folder stats refreshed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired upload sessions
CREATE OR REPLACE FUNCTION cleanup_expired_upload_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.upload_sessions
  WHERE expires_at < NOW() - INTERVAL '1 hour'
    AND status NOT IN ('completed');
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Cleaned up % expired upload sessions', deleted_count;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to permanently delete old trashed files
CREATE OR REPLACE FUNCTION cleanup_old_trashed_files()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Files in trash for more than 30 days
  DELETE FROM public.files
  WHERE deleted_at < NOW() - INTERVAL '30 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Permanently deleted % old trashed files', deleted_count;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old access logs (keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_access_logs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.file_accesses
  WHERE created_at < NOW() - INTERVAL '90 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Cleaned up % old access logs', deleted_count;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to update file access counts (for hot files tracking)
CREATE OR REPLACE FUNCTION update_file_access_counts()
RETURNS void AS $$
BEGIN
  -- Update files with their recent access count
  UPDATE public.files f SET
    metadata = jsonb_set(
      COALESCE(metadata, '{}'::jsonb),
      '{access_count_7d}',
      to_jsonb(COALESCE(ac.access_count, 0))
    )
  FROM (
    SELECT file_id, COUNT(*) AS access_count
    FROM public.file_accesses
    WHERE created_at > NOW() - INTERVAL '7 days'
      AND file_id IS NOT NULL
    GROUP BY file_id
  ) ac
  WHERE f.id = ac.file_id;

  RAISE NOTICE 'Updated file access counts at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- Schedule cron jobs (if pg_cron is available)
DO $$
BEGIN
  -- Refresh vault stats every 5 minutes
  PERFORM cron.schedule('refresh-vault-stats', '*/5 * * * *', 'SELECT refresh_vault_stats()');

  -- Refresh folder stats every 10 minutes
  PERFORM cron.schedule('refresh-folder-stats', '*/10 * * * *', 'SELECT refresh_folder_stats()');

  -- Cleanup expired uploads every hour
  PERFORM cron.schedule('cleanup-uploads', '0 * * * *', 'SELECT cleanup_expired_upload_sessions()');

  -- Cleanup old trashed files daily at 3 AM
  PERFORM cron.schedule('cleanup-trash', '0 3 * * *', 'SELECT cleanup_old_trashed_files()');

  -- Cleanup old access logs weekly on Sunday at 4 AM
  PERFORM cron.schedule('cleanup-access-logs', '0 4 * * 0', 'SELECT cleanup_old_access_logs()');

  -- Update file access counts daily at 2 AM
  PERFORM cron.schedule('update-access-counts', '0 2 * * *', 'SELECT update_file_access_counts()');

  RAISE NOTICE 'pg_cron jobs scheduled successfully';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not available, skipping job scheduling. Error: %', SQLERRM;
END$$;

-- ============================================
-- PART 8: MONITORING & PERFORMANCE FUNCTIONS
-- ============================================

-- Function to check index usage
CREATE OR REPLACE FUNCTION check_index_usage()
RETURNS TABLE (
  table_name TEXT,
  index_name TEXT,
  index_size TEXT,
  index_scans BIGINT,
  index_tuples_read BIGINT,
  index_tuples_fetched BIGINT,
  usage_ratio NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.relname::TEXT AS table_name,
    i.relname::TEXT AS index_name,
    pg_size_pretty(pg_relation_size(i.oid))::TEXT AS index_size,
    COALESCE(s.idx_scan, 0) AS index_scans,
    COALESCE(s.idx_tup_read, 0) AS index_tuples_read,
    COALESCE(s.idx_tup_fetch, 0) AS index_tuples_fetched,
    CASE
      WHEN s.idx_scan > 0 THEN ROUND((s.idx_tup_fetch::NUMERIC / s.idx_scan::NUMERIC), 2)
      ELSE 0
    END AS usage_ratio
  FROM pg_index x
  JOIN pg_class t ON t.oid = x.indrelid
  JOIN pg_class i ON i.oid = x.indexrelid
  LEFT JOIN pg_stat_user_indexes s ON s.indexrelid = i.oid
  WHERE t.relname LIKE 'file%' OR t.relname LIKE 'folder%' OR t.relname LIKE 'user_%'
  ORDER BY s.idx_scan DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Function to check table statistics
CREATE OR REPLACE FUNCTION check_table_stats()
RETURNS TABLE (
  table_name TEXT,
  row_count BIGINT,
  table_size TEXT,
  index_size TEXT,
  total_size TEXT,
  seq_scans BIGINT,
  idx_scans BIGINT,
  cache_hit_ratio NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.relname::TEXT AS table_name,
    c.reltuples::BIGINT AS row_count,
    pg_size_pretty(pg_table_size(c.oid))::TEXT AS table_size,
    pg_size_pretty(pg_indexes_size(c.oid))::TEXT AS index_size,
    pg_size_pretty(pg_total_relation_size(c.oid))::TEXT AS total_size,
    COALESCE(s.seq_scan, 0) AS seq_scans,
    COALESCE(s.idx_scan, 0) AS idx_scans,
    CASE
      WHEN (s.heap_blks_hit + s.heap_blks_read) > 0
      THEN ROUND((s.heap_blks_hit::NUMERIC / (s.heap_blks_hit + s.heap_blks_read)::NUMERIC) * 100, 2)
      ELSE 0
    END AS cache_hit_ratio
  FROM pg_class c
  JOIN pg_stat_user_tables s ON s.relid = c.oid
  JOIN pg_tables t ON t.tablename = c.relname
  WHERE t.schemaname = 'public'
    AND (c.relname LIKE 'file%' OR c.relname LIKE 'folder%' OR c.relname LIKE 'user_%' OR c.relname LIKE 'upload%')
  ORDER BY pg_total_relation_size(c.oid) DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to check slow queries
CREATE OR REPLACE FUNCTION check_slow_queries(min_duration_ms INTEGER DEFAULT 100)
RETURNS TABLE (
  query TEXT,
  calls BIGINT,
  total_time_ms NUMERIC,
  mean_time_ms NUMERIC,
  max_time_ms NUMERIC,
  rows_returned BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    SUBSTRING(s.query, 1, 200) AS query,
    s.calls,
    ROUND(s.total_exec_time::NUMERIC, 2) AS total_time_ms,
    ROUND(s.mean_exec_time::NUMERIC, 2) AS mean_time_ms,
    ROUND(s.max_exec_time::NUMERIC, 2) AS max_time_ms,
    s.rows
  FROM pg_stat_statements s
  WHERE s.mean_exec_time > min_duration_ms
    AND s.query LIKE '%files%' OR s.query LIKE '%folders%'
  ORDER BY s.mean_exec_time DESC
  LIMIT 20;
EXCEPTION WHEN OTHERS THEN
  -- pg_stat_statements not available
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- Function to get performance summary
CREATE OR REPLACE FUNCTION get_performance_summary()
RETURNS TABLE (
  metric TEXT,
  value TEXT,
  status TEXT
) AS $$
DECLARE
  cache_hit_ratio NUMERIC;
  index_usage_ratio NUMERIC;
  seq_scan_count BIGINT;
BEGIN
  -- Calculate cache hit ratio
  SELECT ROUND((SUM(heap_blks_hit)::NUMERIC / NULLIF(SUM(heap_blks_hit + heap_blks_read), 0)::NUMERIC) * 100, 2)
  INTO cache_hit_ratio
  FROM pg_statio_user_tables
  WHERE relname LIKE 'file%' OR relname LIKE 'folder%';

  -- Calculate index usage ratio
  SELECT ROUND((SUM(idx_scan)::NUMERIC / NULLIF(SUM(idx_scan + seq_scan), 0)::NUMERIC) * 100, 2)
  INTO index_usage_ratio
  FROM pg_stat_user_tables
  WHERE relname LIKE 'file%' OR relname LIKE 'folder%';

  -- Count sequential scans
  SELECT SUM(seq_scan)
  INTO seq_scan_count
  FROM pg_stat_user_tables
  WHERE relname LIKE 'file%' OR relname LIKE 'folder%';

  RETURN QUERY VALUES
    ('Cache Hit Ratio', COALESCE(cache_hit_ratio::TEXT, '0') || '%',
      CASE WHEN cache_hit_ratio >= 99 THEN 'Excellent'
           WHEN cache_hit_ratio >= 95 THEN 'Good'
           WHEN cache_hit_ratio >= 90 THEN 'Fair'
           ELSE 'Poor' END),
    ('Index Usage Ratio', COALESCE(index_usage_ratio::TEXT, '0') || '%',
      CASE WHEN index_usage_ratio >= 95 THEN 'Excellent'
           WHEN index_usage_ratio >= 85 THEN 'Good'
           WHEN index_usage_ratio >= 70 THEN 'Fair'
           ELSE 'Poor' END),
    ('Sequential Scans', COALESCE(seq_scan_count::TEXT, '0'),
      CASE WHEN seq_scan_count < 1000 THEN 'Good'
           WHEN seq_scan_count < 10000 THEN 'Fair'
           ELSE 'High - Review Indexes' END);
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 9: CACHE WARMING
-- ============================================

-- Function to warm cache for frequently accessed vaults
CREATE OR REPLACE FUNCTION warm_vault_cache(p_vault_id UUID)
RETURNS void AS $$
BEGIN
  -- Touch recent files to load into cache
  PERFORM id FROM public.files
  WHERE vault_id = p_vault_id
    AND deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT 500;

  -- Touch folder structure
  PERFORM id FROM public.folders
  WHERE vault_id = p_vault_id
    AND deleted_at IS NULL;

  RAISE NOTICE 'Cache warmed for vault %', p_vault_id;
END;
$$ LANGUAGE plpgsql;

-- Function to warm cache for all active vaults
CREATE OR REPLACE FUNCTION warm_all_vaults_cache()
RETURNS void AS $$
DECLARE
  v_vault_id UUID;
BEGIN
  FOR v_vault_id IN
    SELECT id FROM public.file_vaults
    WHERE deleted_at IS NULL
    ORDER BY (
      SELECT COUNT(*) FROM public.file_accesses
      WHERE vault_id = file_vaults.id
        AND created_at > NOW() - INTERVAL '24 hours'
    ) DESC
    LIMIT 10  -- Top 10 most active vaults
  LOOP
    PERFORM warm_vault_cache(v_vault_id);
  END LOOP;

  RAISE NOTICE 'All active vaults cache warmed at %', NOW();
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 10: GRANTS
-- ============================================

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION check_index_usage() TO authenticated;
GRANT EXECUTE ON FUNCTION check_table_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_performance_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION warm_vault_cache(UUID) TO authenticated;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON INDEX idx_files_vault_folder_deleted_created IS 'Primary index for file listing queries - vault + folder + soft delete + sort';
COMMENT ON INDEX idx_files_vault_created_desc IS 'Index for default file listing sorted by created date';
COMMENT ON INDEX idx_files_search_vector IS 'GIN index for full-text search on file names and paths';
COMMENT ON MATERIALIZED VIEW mv_vault_stats IS 'Pre-computed vault statistics for fast dashboard loading';
COMMENT ON MATERIALIZED VIEW mv_folder_stats IS 'Pre-computed folder statistics for folder info panels';
COMMENT ON FUNCTION refresh_vault_stats() IS 'Refreshes vault statistics materialized view';
COMMENT ON FUNCTION check_index_usage() IS 'Returns index usage statistics for monitoring';
COMMENT ON FUNCTION check_table_stats() IS 'Returns table statistics including cache hit ratios';
COMMENT ON FUNCTION get_performance_summary() IS 'Returns high-level performance health indicators';
COMMENT ON FUNCTION warm_vault_cache(UUID) IS 'Warms PostgreSQL cache for a specific vault';

-- ============================================
-- DONE
-- ============================================
