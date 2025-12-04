-- ================================================================
-- FILE VAULT PERFORMANCE OPTIMIZATION
-- Version: 1.0 | Date: 2025-12-04
-- Migration: 014_file_vault_performance.sql
-- ================================================================

-- --------------------------------------------------------
-- PART 1: COMPOUND INDEXES FOR COMMON QUERY PATTERNS
-- --------------------------------------------------------

-- Most common query: files by vault + folder + not deleted, sorted by created_at
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_vault_folder_created
ON public.files(vault_id, folder_id, created_at DESC)
WHERE deleted_at IS NULL;

-- For "my files" queries - owner + vault + created_at
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_owner_vault_created
ON public.files(owner_id, vault_id, created_at DESC)
WHERE deleted_at IS NULL;

-- For sorting by name
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_vault_folder_name
ON public.files(vault_id, folder_id, name)
WHERE deleted_at IS NULL;

-- For sorting by size
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_vault_folder_size
ON public.files(vault_id, folder_id, size_bytes DESC)
WHERE deleted_at IS NULL;

-- For MIME type filtering with vault
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_files_vault_mime_created
ON public.files(vault_id, mime_type, created_at DESC)
WHERE deleted_at IS NULL;

-- Full-text search optimization - use Estonian and English
DROP INDEX IF EXISTS idx_files_search;
CREATE INDEX IF NOT EXISTS idx_files_name_trgm ON public.files
USING GIN (name gin_trgm_ops);

-- Add trigram extension if not exists (for fast LIKE searches)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- --------------------------------------------------------
-- PART 2: FOLDER INDEXES
-- --------------------------------------------------------

-- Folders by vault and parent - most common query
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_folders_vault_parent
ON public.file_folders(vault_id, parent_id)
WHERE deleted_at IS NULL;

-- Folders by path for breadcrumb lookups
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_folders_vault_path
ON public.file_folders(vault_id, path)
WHERE deleted_at IS NULL;

-- --------------------------------------------------------
-- PART 3: FILE SHARES INDEXES
-- --------------------------------------------------------

-- Shares by user - for "my shares" listing
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shares_created_by
ON public.file_shares(created_by, created_at DESC);

-- Active shares lookup
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_shares_active
ON public.file_shares(created_by, expires_at)
WHERE expires_at IS NULL OR expires_at > NOW();

-- --------------------------------------------------------
-- PART 4: MATERIALIZED VIEW FOR FOLDER STATS (OPTIONAL)
-- --------------------------------------------------------

-- Create a function to count files in folder
CREATE OR REPLACE FUNCTION get_folder_file_count(p_folder_id UUID)
RETURNS BIGINT AS $$
  SELECT COUNT(*)::BIGINT
  FROM public.files
  WHERE folder_id = p_folder_id
  AND deleted_at IS NULL;
$$ LANGUAGE SQL STABLE;

-- Create a function to get folder size
CREATE OR REPLACE FUNCTION get_folder_size(p_folder_id UUID)
RETURNS BIGINT AS $$
  SELECT COALESCE(SUM(size_bytes), 0)::BIGINT
  FROM public.files
  WHERE folder_id = p_folder_id
  AND deleted_at IS NULL;
$$ LANGUAGE SQL STABLE;

-- --------------------------------------------------------
-- PART 5: VACUUM AND ANALYZE
-- --------------------------------------------------------

-- Run ANALYZE on key tables to update statistics
ANALYZE public.files;
ANALYZE public.file_folders;
ANALYZE public.file_shares;

-- ================================================================
-- END OF MIGRATION
--
-- To apply this migration:
-- 1. Run in Supabase SQL Editor
-- 2. CONCURRENTLY indexes won't block writes
-- 3. pg_trgm extension enables fast LIKE '%text%' searches
-- ================================================================
