-- =============================================
-- FILE VAULT PERFORMANCE OPTIMIZATIONS
-- =============================================
-- Version: 1.0.0
-- Date: 2024-12-05
-- Description: Performance indexes and materialized views for millions of files
-- =============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================
-- COMPOSITE INDEXES FOR FILES TABLE
-- =============================================

-- 1. Vault + Folder kombinatsioon (kõige sagedamini kasutatud)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_vault_folder_deleted
ON files(vault_id, folder_id)
WHERE deleted_at IS NULL;

-- 2. Kiire failinime otsing vault'i piires (trigram)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_vault_name_trgm
ON files USING gin(name gin_trgm_ops)
WHERE deleted_at IS NULL;

-- 3. Mime type filter (kiire filtreerimine tüübi järgi)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_vault_mime
ON files(vault_id, mime_type)
WHERE deleted_at IS NULL;

-- 4. Sorteerimise index (kuupäev DESC - kõige uuemad ees)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_vault_created
ON files(vault_id, created_at DESC)
WHERE deleted_at IS NULL;

-- 5. Sorteerimise index (suurus DESC - suuremad ees)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_vault_size
ON files(vault_id, size_bytes DESC)
WHERE deleted_at IS NULL;

-- 6. Ekstensiooni filter
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_vault_extension
ON files(vault_id, extension)
WHERE deleted_at IS NULL;

-- 7. Full-text search index (täistekst otsing eesti keeles)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_search_fts
ON files USING gin(
  to_tsvector('simple', coalesce(name, '') || ' ' || coalesce(path, ''))
);

-- 8. Owner based queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_vault_owner
ON files(vault_id, owner_id)
WHERE deleted_at IS NULL;

-- 9. Updated at for recent changes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_vault_updated
ON files(vault_id, updated_at DESC)
WHERE deleted_at IS NULL;

-- =============================================
-- FOLDER INDEXES
-- =============================================

-- 10. Folder hierarhia (path prefix matching)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_folders_path_prefix
ON file_folders USING btree(vault_id, path text_pattern_ops);

-- 11. Vault + Parent folder
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_folders_vault_parent
ON file_folders(vault_id, parent_id)
WHERE deleted_at IS NULL;

-- 12. Folder name search
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_file_folders_name_trgm
ON file_folders USING gin(name gin_trgm_ops)
WHERE deleted_at IS NULL;

-- =============================================
-- METADATA AND JSONB INDEXES
-- =============================================

-- 13. Metadata GIN index
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_metadata_gin
ON files USING gin(metadata jsonb_path_ops)
WHERE metadata IS NOT NULL AND metadata != '{}';

-- 14. Tags index (kui metadata sisaldab tags välja)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_metadata_tags
ON files USING gin((metadata->'tags'))
WHERE metadata ? 'tags';

-- =============================================
-- MATERIALIZED VIEW: VAULT STATISTICS
-- =============================================

-- Drop existing view if exists
DROP MATERIALIZED VIEW IF EXISTS file_vault_stats;

-- Create materialized view for fast statistics
CREATE MATERIALIZED VIEW file_vault_stats AS
SELECT
  vault_id,
  COUNT(*) as total_files,
  COALESCE(SUM(size_bytes), 0) as total_size_bytes,
  COUNT(DISTINCT folder_id) as total_folders,
  MAX(created_at) as last_upload_at,
  MIN(created_at) as first_upload_at,
  COUNT(*) FILTER (WHERE mime_type LIKE 'image/%') as image_count,
  COUNT(*) FILTER (WHERE mime_type LIKE 'video/%') as video_count,
  COUNT(*) FILTER (WHERE mime_type LIKE 'audio/%') as audio_count,
  COUNT(*) FILTER (WHERE mime_type = 'application/pdf') as pdf_count,
  COUNT(*) FILTER (WHERE mime_type LIKE 'application/vnd.ms-excel%' OR mime_type LIKE 'application/vnd.openxmlformats-officedocument.spreadsheet%') as excel_count,
  COUNT(*) FILTER (WHERE mime_type LIKE 'application/msword%' OR mime_type LIKE 'application/vnd.openxmlformats-officedocument.wordprocessing%') as word_count,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as files_last_7_days,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as files_last_30_days,
  COALESCE(SUM(size_bytes) FILTER (WHERE mime_type LIKE 'image/%'), 0) as image_size_bytes,
  COALESCE(SUM(size_bytes) FILTER (WHERE mime_type LIKE 'video/%'), 0) as video_size_bytes
FROM files
WHERE deleted_at IS NULL
GROUP BY vault_id;

-- Index for materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_file_vault_stats_vault ON file_vault_stats(vault_id);

-- =============================================
-- MATERIALIZED VIEW: FOLDER STATISTICS
-- =============================================

DROP MATERIALIZED VIEW IF EXISTS file_folder_stats;

CREATE MATERIALIZED VIEW file_folder_stats AS
SELECT
  f.folder_id,
  f.vault_id,
  COUNT(*) as file_count,
  COALESCE(SUM(f.size_bytes), 0) as total_size_bytes,
  MAX(f.created_at) as last_upload_at,
  COUNT(*) FILTER (WHERE f.mime_type LIKE 'image/%') as image_count,
  COUNT(*) FILTER (WHERE f.mime_type LIKE 'video/%') as video_count
FROM files f
WHERE f.deleted_at IS NULL
GROUP BY f.folder_id, f.vault_id;

CREATE INDEX IF NOT EXISTS idx_file_folder_stats_folder ON file_folder_stats(folder_id);
CREATE INDEX IF NOT EXISTS idx_file_folder_stats_vault ON file_folder_stats(vault_id);

-- =============================================
-- FUNCTION: REFRESH VAULT STATS
-- =============================================

CREATE OR REPLACE FUNCTION refresh_vault_stats()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY file_vault_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY file_folder_stats;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCTION: BATCH ADD TAGS
-- =============================================

CREATE OR REPLACE FUNCTION batch_add_tags(
  file_ids UUID[],
  new_tags TEXT[]
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE files
  SET metadata = jsonb_set(
    COALESCE(metadata, '{}'),
    '{tags}',
    COALESCE(metadata->'tags', '[]'::jsonb) || to_jsonb(new_tags)
  )
  WHERE id = ANY(file_ids)
  AND deleted_at IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCTION: BATCH MOVE FILES
-- =============================================

CREATE OR REPLACE FUNCTION batch_move_files(
  file_ids UUID[],
  target_folder_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE files
  SET
    folder_id = target_folder_id,
    updated_at = NOW()
  WHERE id = ANY(file_ids)
  AND deleted_at IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCTION: BATCH DELETE FILES (SOFT)
-- =============================================

CREATE OR REPLACE FUNCTION batch_soft_delete_files(
  file_ids UUID[],
  deleted_by_user UUID
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  UPDATE files
  SET
    deleted_at = NOW(),
    deleted_by = deleted_by_user
  WHERE id = ANY(file_ids)
  AND deleted_at IS NULL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- FUNCTION: SEARCH FILES WITH RANKING
-- =============================================

CREATE OR REPLACE FUNCTION search_files_ranked(
  p_vault_id UUID,
  p_search_term TEXT,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  path TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  extension TEXT,
  folder_id UUID,
  created_at TIMESTAMPTZ,
  rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id,
    f.name,
    f.path,
    f.mime_type,
    f.size_bytes,
    f.extension,
    f.folder_id,
    f.created_at,
    ts_rank(
      to_tsvector('simple', coalesce(f.name, '') || ' ' || coalesce(f.path, '')),
      plainto_tsquery('simple', p_search_term)
    ) as rank
  FROM files f
  WHERE f.vault_id = p_vault_id
    AND f.deleted_at IS NULL
    AND (
      f.name ILIKE '%' || p_search_term || '%'
      OR to_tsvector('simple', coalesce(f.name, '') || ' ' || coalesce(f.path, '')) @@ plainto_tsquery('simple', p_search_term)
    )
  ORDER BY rank DESC, f.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- ANALYZE TABLES FOR QUERY PLANNER
-- =============================================

ANALYZE files;
ANALYZE file_folders;

-- =============================================
-- COMMENTS
-- =============================================

COMMENT ON INDEX idx_files_vault_folder_deleted IS 'Primary index for listing files in a folder';
COMMENT ON INDEX idx_files_vault_name_trgm IS 'Trigram index for fuzzy name search';
COMMENT ON INDEX idx_files_vault_created IS 'Index for date-based sorting';
COMMENT ON INDEX idx_files_search_fts IS 'Full-text search index';
COMMENT ON MATERIALIZED VIEW file_vault_stats IS 'Pre-computed vault statistics for dashboard';
COMMENT ON MATERIALIZED VIEW file_folder_stats IS 'Pre-computed folder statistics';
COMMENT ON FUNCTION refresh_vault_stats IS 'Refresh all file vault materialized views';
COMMENT ON FUNCTION search_files_ranked IS 'Search files with relevance ranking';
