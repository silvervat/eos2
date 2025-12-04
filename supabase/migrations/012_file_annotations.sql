-- ================================================================
-- FILE ANNOTATIONS SYSTEM
-- Migration: 012_file_annotations.sql
-- Adds position-based annotations for documents
-- ================================================================

-- FILE ANNOTATIONS (Positsiooni-põhised märkmed dokumentidel)
CREATE TABLE IF NOT EXISTS public.file_annotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,

  -- Position on document (percentage or pixels based on context)
  position_x REAL NOT NULL,  -- X coordinate (0-100 for percentage)
  position_y REAL NOT NULL,  -- Y coordinate (0-100 for percentage)
  page_number INTEGER DEFAULT 1,  -- For PDFs

  -- Annotation type
  type TEXT NOT NULL DEFAULT 'comment',  -- 'comment', 'highlight', 'pin', 'rectangle'

  -- Visual properties
  color TEXT DEFAULT '#279989',  -- Annotation color
  width REAL,   -- For rectangles/highlights
  height REAL,  -- For rectangles/highlights

  -- Content
  content TEXT NOT NULL,

  -- Status
  is_resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL,

  -- Soft delete
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_file_annotations_file ON public.file_annotations(file_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_file_annotations_page ON public.file_annotations(file_id, page_number);
CREATE INDEX IF NOT EXISTS idx_file_annotations_type ON public.file_annotations(type);

-- RLS
ALTER TABLE public.file_annotations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "file_annotations_select" ON public.file_annotations;
CREATE POLICY "file_annotations_select" ON public.file_annotations FOR SELECT
  TO authenticated
  USING (deleted_at IS NULL);

DROP POLICY IF EXISTS "file_annotations_insert" ON public.file_annotations;
CREATE POLICY "file_annotations_insert" ON public.file_annotations FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "file_annotations_update" ON public.file_annotations;
CREATE POLICY "file_annotations_update" ON public.file_annotations FOR UPDATE
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "file_annotations_delete" ON public.file_annotations;
CREATE POLICY "file_annotations_delete" ON public.file_annotations FOR DELETE
  TO authenticated
  USING (created_by = auth.uid());

-- ANNOTATION COMMENTS (Vastused annotatsioonidele)
CREATE TABLE IF NOT EXISTS public.annotation_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  annotation_id UUID NOT NULL REFERENCES public.file_annotations(id) ON DELETE CASCADE,

  -- Content
  content TEXT NOT NULL,

  -- Threading
  parent_id UUID REFERENCES public.annotation_comments(id) ON DELETE CASCADE,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL,

  -- Soft delete
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_annotation_comments_annotation ON public.annotation_comments(annotation_id);
CREATE INDEX IF NOT EXISTS idx_annotation_comments_parent ON public.annotation_comments(parent_id);

-- RLS
ALTER TABLE public.annotation_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "annotation_comments_all" ON public.annotation_comments;
CREATE POLICY "annotation_comments_all" ON public.annotation_comments FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Add original_name column to files if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'files' AND column_name = 'original_name'
  ) THEN
    ALTER TABLE public.files ADD COLUMN original_name TEXT;
    -- Copy existing names to original_name
    UPDATE public.files SET original_name = name WHERE original_name IS NULL;
  END IF;
END $$;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.file_annotations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.annotation_comments;

-- Grants
GRANT ALL ON public.file_annotations TO authenticated;
GRANT ALL ON public.annotation_comments TO authenticated;
