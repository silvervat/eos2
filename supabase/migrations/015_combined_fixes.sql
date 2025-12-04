-- ================================================================
-- COMBINED FIXES - Run this in Supabase SQL Editor
-- Includes: file_shares fixes, comments, collections, performance
-- Date: 2025-12-04
-- ================================================================

-- --------------------------------------------------------
-- PART 1: FILE_SHARES - Add missing columns if needed
-- --------------------------------------------------------

-- Add title column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'file_shares' AND column_name = 'title'
  ) THEN
    ALTER TABLE public.file_shares ADD COLUMN title TEXT;
  END IF;
END $$;

-- Add message column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'file_shares' AND column_name = 'message'
  ) THEN
    ALTER TABLE public.file_shares ADD COLUMN message TEXT;
  END IF;
END $$;

-- --------------------------------------------------------
-- PART 2: FILE COMMENTS
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.file_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.file_comments(id) ON DELETE CASCADE,
  mentions JSONB DEFAULT '[]'::jsonb,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_file_comments_file ON public.file_comments(file_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_file_comments_parent ON public.file_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_file_comments_created ON public.file_comments(created_at DESC);

ALTER TABLE public.file_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "file_comments_select" ON public.file_comments;
CREATE POLICY "file_comments_select" ON public.file_comments FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "file_comments_insert" ON public.file_comments;
CREATE POLICY "file_comments_insert" ON public.file_comments FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "file_comments_update" ON public.file_comments;
CREATE POLICY "file_comments_update" ON public.file_comments FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "file_comments_delete" ON public.file_comments;
CREATE POLICY "file_comments_delete" ON public.file_comments FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- --------------------------------------------------------
-- PART 3: USER COLLECTIONS
-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_file_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vault_id UUID NOT NULL REFERENCES public.file_vaults(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT '#279989',
    icon VARCHAR(50) DEFAULT 'folder-heart',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ,
    UNIQUE(user_id, vault_id, name)
);

CREATE TABLE IF NOT EXISTS public.user_collection_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES public.user_file_collections(id) ON DELETE CASCADE,
    file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    added_by UUID REFERENCES auth.users(id),
    notes TEXT,
    UNIQUE(collection_id, file_id)
);

CREATE INDEX IF NOT EXISTS idx_user_file_collections_user ON public.user_file_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_user_file_collections_vault ON public.user_file_collections(vault_id);
CREATE INDEX IF NOT EXISTS idx_user_collection_files_collection ON public.user_collection_files(collection_id);
CREATE INDEX IF NOT EXISTS idx_user_collection_files_file ON public.user_collection_files(file_id);

ALTER TABLE public.user_file_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_collection_files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own collections" ON public.user_file_collections;
CREATE POLICY "Users can view own collections"
    ON public.user_file_collections
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create own collections" ON public.user_file_collections;
CREATE POLICY "Users can create own collections"
    ON public.user_file_collections
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own collections" ON public.user_file_collections;
CREATE POLICY "Users can update own collections"
    ON public.user_file_collections
    FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own collections" ON public.user_file_collections;
CREATE POLICY "Users can delete own collections"
    ON public.user_file_collections
    FOR DELETE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view files in own collections" ON public.user_collection_files;
CREATE POLICY "Users can view files in own collections"
    ON public.user_collection_files
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.user_file_collections
            WHERE id = collection_id AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can add files to own collections" ON public.user_collection_files;
CREATE POLICY "Users can add files to own collections"
    ON public.user_collection_files
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.user_file_collections
            WHERE id = collection_id AND user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can remove files from own collections" ON public.user_collection_files;
CREATE POLICY "Users can remove files from own collections"
    ON public.user_collection_files
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM public.user_file_collections
            WHERE id = collection_id AND user_id = auth.uid()
        )
    );

-- --------------------------------------------------------
-- PART 4: PERFORMANCE INDEXES
-- --------------------------------------------------------

-- Enable pg_trgm extension for fast LIKE searches
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Compound indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_files_vault_folder_created
ON public.files(vault_id, folder_id, created_at DESC)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_files_owner_vault_created
ON public.files(owner_id, vault_id, created_at DESC)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_files_vault_folder_name
ON public.files(vault_id, folder_id, name)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_files_vault_folder_size
ON public.files(vault_id, folder_id, size_bytes DESC)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_files_vault_mime_created
ON public.files(vault_id, mime_type, created_at DESC)
WHERE deleted_at IS NULL;

-- Trigram index for fast name searches
CREATE INDEX IF NOT EXISTS idx_files_name_trgm ON public.files
USING GIN (name gin_trgm_ops);

-- Folder indexes
CREATE INDEX IF NOT EXISTS idx_folders_vault_parent
ON public.file_folders(vault_id, parent_id)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_folders_vault_path
ON public.file_folders(vault_id, path)
WHERE deleted_at IS NULL;

-- Shares indexes
CREATE INDEX IF NOT EXISTS idx_shares_created_by
ON public.file_shares(created_by, created_at DESC);

-- --------------------------------------------------------
-- PART 5: HELPER FUNCTIONS
-- --------------------------------------------------------

CREATE OR REPLACE FUNCTION get_folder_file_count(p_folder_id UUID)
RETURNS BIGINT AS $$
  SELECT COUNT(*)::BIGINT
  FROM public.files
  WHERE folder_id = p_folder_id
  AND deleted_at IS NULL;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION get_folder_size(p_folder_id UUID)
RETURNS BIGINT AS $$
  SELECT COALESCE(SUM(size_bytes), 0)::BIGINT
  FROM public.files
  WHERE folder_id = p_folder_id
  AND deleted_at IS NULL;
$$ LANGUAGE SQL STABLE;

-- Updated_at trigger for collections
CREATE OR REPLACE FUNCTION update_user_collection_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_file_collections_updated_at ON public.user_file_collections;
CREATE TRIGGER update_user_file_collections_updated_at
    BEFORE UPDATE ON public.user_file_collections
    FOR EACH ROW
    EXECUTE FUNCTION update_user_collection_updated_at();

-- --------------------------------------------------------
-- PART 6: ANALYZE TABLES
-- --------------------------------------------------------

ANALYZE public.files;
ANALYZE public.file_folders;
ANALYZE public.file_shares;
ANALYZE public.file_comments;
ANALYZE public.user_file_collections;
ANALYZE public.user_collection_files;

-- ================================================================
-- DONE!
-- ================================================================
