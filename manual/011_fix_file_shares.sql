-- =============================================
-- FIX FILE_SHARES TABLE
-- =============================================
-- Run this in Supabase SQL Editor if you get:
-- "Could not find the 'message' column of 'file_shares' in the schema cache"
-- =============================================

-- 1. Create table if not exists (with all columns)
CREATE TABLE IF NOT EXISTS public.file_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL,
  file_id UUID,
  folder_id UUID,

  -- Share settings
  short_code TEXT UNIQUE NOT NULL,
  password_hash TEXT,

  -- Access control
  allow_download BOOLEAN DEFAULT true,
  allow_upload BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  download_limit INTEGER,
  downloads_count INTEGER DEFAULT 0,

  -- Tracking
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  access_ips JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  title TEXT,
  message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL,

  CONSTRAINT file_or_folder_required CHECK (
    (file_id IS NOT NULL AND folder_id IS NULL) OR
    (file_id IS NULL AND folder_id IS NOT NULL) OR
    (file_id IS NULL AND folder_id IS NULL) -- Allow vault-level shares
  )
);

-- 2. Add missing columns if table exists but columns are missing
DO $$
BEGIN
  -- Add title column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'file_shares'
    AND column_name = 'title'
  ) THEN
    ALTER TABLE public.file_shares ADD COLUMN title TEXT;
    RAISE NOTICE 'Added title column to file_shares';
  END IF;

  -- Add message column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'file_shares'
    AND column_name = 'message'
  ) THEN
    ALTER TABLE public.file_shares ADD COLUMN message TEXT;
    RAISE NOTICE 'Added message column to file_shares';
  END IF;

  -- Add access_count column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'file_shares'
    AND column_name = 'access_count'
  ) THEN
    ALTER TABLE public.file_shares ADD COLUMN access_count INTEGER DEFAULT 0;
    RAISE NOTICE 'Added access_count column to file_shares';
  END IF;

  -- Add last_accessed_at column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'file_shares'
    AND column_name = 'last_accessed_at'
  ) THEN
    ALTER TABLE public.file_shares ADD COLUMN last_accessed_at TIMESTAMPTZ;
    RAISE NOTICE 'Added last_accessed_at column to file_shares';
  END IF;

  -- Add access_ips column if missing
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'file_shares'
    AND column_name = 'access_ips'
  ) THEN
    ALTER TABLE public.file_shares ADD COLUMN access_ips JSONB DEFAULT '[]'::jsonb;
    RAISE NOTICE 'Added access_ips column to file_shares';
  END IF;
END $$;

-- 3. Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_file_shares_code ON public.file_shares(short_code);
CREATE INDEX IF NOT EXISTS idx_file_shares_file ON public.file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_folder ON public.file_shares(folder_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_vault ON public.file_shares(vault_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_expires ON public.file_shares(expires_at);

-- 4. Enable RLS
ALTER TABLE public.file_shares ENABLE ROW LEVEL SECURITY;

-- 5. Drop and recreate policies
DROP POLICY IF EXISTS "file_shares_all" ON public.file_shares;
DROP POLICY IF EXISTS "file_shares_public_read" ON public.file_shares;
DROP POLICY IF EXISTS "file_shares_authenticated" ON public.file_shares;

-- Authenticated users can do everything
CREATE POLICY "file_shares_authenticated" ON public.file_shares FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Public can read active shares (for share page)
CREATE POLICY "file_shares_public_read" ON public.file_shares FOR SELECT
  TO anon
  USING (
    expires_at IS NULL OR expires_at > NOW()
  );

-- 6. Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.file_shares TO authenticated;
GRANT SELECT ON public.file_shares TO anon;

-- 7. Verify
DO $$
DECLARE
  col_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO col_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
  AND table_name = 'file_shares';

  IF col_count >= 15 THEN
    RAISE NOTICE 'SUCCESS: file_shares table has % columns and is ready!', col_count;
  ELSE
    RAISE WARNING 'WARNING: file_shares table only has % columns, expected 15+', col_count;
  END IF;
END $$;
