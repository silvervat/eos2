-- ================================================================
-- FILE COMMENTS SYSTEM
-- Migration: 011_file_comments.sql
-- ================================================================

-- FILE COMMENTS (Kommentaarid)
CREATE TABLE IF NOT EXISTS public.file_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,

  -- Content
  content TEXT NOT NULL,

  -- Threading (replies)
  parent_id UUID REFERENCES public.file_comments(id) ON DELETE CASCADE,

  -- Mentions (user IDs as JSON array)
  mentions JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL,

  -- Soft delete
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_file_comments_file ON public.file_comments(file_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_file_comments_parent ON public.file_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_file_comments_created ON public.file_comments(created_at DESC);

-- RLS
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

-- Add searchable_text column to files if not exists (for full-text search)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'files' AND column_name = 'extracted_text'
  ) THEN
    ALTER TABLE public.files ADD COLUMN extracted_text TEXT;
  END IF;
END $$;

-- Full-text search index on files
DROP INDEX IF EXISTS idx_files_fulltext;
CREATE INDEX idx_files_fulltext ON public.files
  USING GIN(to_tsvector('simple', COALESCE(name, '') || ' ' || COALESCE(extracted_text, '')));

-- ================================================================
-- Enable Realtime for file tables
-- ================================================================

-- Enable realtime on files table
ALTER PUBLICATION supabase_realtime ADD TABLE public.files;

-- Enable realtime on file_folders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.file_folders;

-- Enable realtime on file_comments table
ALTER PUBLICATION supabase_realtime ADD TABLE public.file_comments;
