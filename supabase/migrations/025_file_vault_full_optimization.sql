-- =============================================
-- FILE VAULT - Comprehensive Performance Optimization
-- =============================================
-- Version: 1.0.1
-- Date: 2024-12-05
-- =============================================

-- ============================================
-- PART 1: COMPOSITE INDEXES FOR QUERY PATTERNS
-- ============================================

-- Primary file listing query (vault + folder + deleted filter + sort)
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

-- Files by creator (for "my uploads" filter)
CREATE INDEX IF NOT EXISTS idx_files_created_by
ON public.files(created_by, vault_id, created_at DESC)
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

-- Vault statistics materialized view
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
-- PART 7: HELPER FUNCTIONS
-- ============================================

-- Function to refresh vault statistics (call manually or via scheduler)
CREATE OR REPLACE FUNCTION refresh_vault_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_vault_stats;
END;
$$ LANGUAGE plpgsql;

-- Function to refresh folder statistics
CREATE OR REPLACE FUNCTION refresh_folder_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW mv_folder_stats;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 8: MONITORING FUNCTIONS
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
  SELECT ROUND((SUM(heap_blks_hit)::NUMERIC / NULLIF(SUM(heap_blks_hit + heap_blks_read), 0)::NUMERIC) * 100, 2)
  INTO cache_hit_ratio
  FROM pg_statio_user_tables
  WHERE relname LIKE 'file%' OR relname LIKE 'folder%';

  SELECT ROUND((SUM(idx_scan)::NUMERIC / NULLIF(SUM(idx_scan + seq_scan), 0)::NUMERIC) * 100, 2)
  INTO index_usage_ratio
  FROM pg_stat_user_tables
  WHERE relname LIKE 'file%' OR relname LIKE 'folder%';

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
  PERFORM id FROM public.files
  WHERE vault_id = p_vault_id
    AND deleted_at IS NULL
  ORDER BY created_at DESC
  LIMIT 500;

  PERFORM id FROM public.folders
  WHERE vault_id = p_vault_id
    AND deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 10: GRANTS
-- ============================================

GRANT EXECUTE ON FUNCTION check_index_usage() TO authenticated;
GRANT EXECUTE ON FUNCTION check_table_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION get_performance_summary() TO authenticated;
GRANT EXECUTE ON FUNCTION warm_vault_cache(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_vault_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION refresh_folder_stats() TO authenticated;

-- ============================================
-- DONE
-- ============================================
