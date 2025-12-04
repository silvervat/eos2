-- ================================================================
-- FILE VAULT SYSTEM - COMPLETE DATABASE SCHEMA + STORAGE POLICIES
-- Version: 1.0 | Date: 2025-12-04
-- Migration: 010_file_vault_system.sql
-- Includes: Database tables + Storage bucket + RLS policies
-- ================================================================

-- --------------------------------------------------------
-- PART 1: STORAGE BUCKET SETUP
-- --------------------------------------------------------

-- Create storage bucket (if not exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'file-vault',
  'file-vault',
  false,
  1073741824, -- 1GB max file size
  NULL -- Allow all mime types
)
ON CONFLICT (id) DO NOTHING;

-- --------------------------------------------------------
-- PART 2: STORAGE RLS POLICIES
-- --------------------------------------------------------

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "file_vault_users_can_upload" ON storage.objects;
DROP POLICY IF EXISTS "file_vault_users_can_read" ON storage.objects;
DROP POLICY IF EXISTS "file_vault_users_can_update" ON storage.objects;
DROP POLICY IF EXISTS "file_vault_users_can_delete" ON storage.objects;

-- Policy 1: Authenticated users can upload to file-vault bucket
CREATE POLICY "file_vault_users_can_upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'file-vault');

-- Policy 2: Authenticated users can read from file-vault bucket
CREATE POLICY "file_vault_users_can_read"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'file-vault');

-- Policy 3: Authenticated users can update in file-vault bucket
CREATE POLICY "file_vault_users_can_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'file-vault');

-- Policy 4: Authenticated users can delete from file-vault bucket
CREATE POLICY "file_vault_users_can_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'file-vault');

-- --------------------------------------------------------
-- PART 3: DATABASE TABLES
-- --------------------------------------------------------

-- 1. FILE VAULTS (Failihoidlad)
CREATE TABLE IF NOT EXISTS public.file_vaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  config JSONB DEFAULT '{}'::jsonb,

  -- Storage quota
  quota_bytes BIGINT DEFAULT 107374182400, -- 100GB
  used_bytes BIGINT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_file_vaults_tenant ON public.file_vaults(tenant_id) WHERE deleted_at IS NULL;

-- RLS for file_vaults
ALTER TABLE public.file_vaults ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "file_vaults_tenant_select" ON public.file_vaults;
CREATE POLICY "file_vaults_tenant_select" ON public.file_vaults FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "file_vaults_tenant_insert" ON public.file_vaults;
CREATE POLICY "file_vaults_tenant_insert" ON public.file_vaults FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "file_vaults_tenant_update" ON public.file_vaults;
CREATE POLICY "file_vaults_tenant_update" ON public.file_vaults FOR UPDATE
  TO authenticated
  USING (true);

-- 2. FILE FOLDERS (Kaustad)
CREATE TABLE IF NOT EXISTS public.file_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES public.file_vaults(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.file_folders(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  path TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Access control (matches API)
  is_public BOOLEAN DEFAULT false,
  owner_id UUID,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL,
  updated_by UUID,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID
);

CREATE INDEX IF NOT EXISTS idx_file_folders_vault ON public.file_folders(vault_id);
CREATE INDEX IF NOT EXISTS idx_file_folders_parent ON public.file_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_file_folders_path ON public.file_folders(path);

-- RLS for file_folders
ALTER TABLE public.file_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "file_folders_all" ON public.file_folders;
CREATE POLICY "file_folders_all" ON public.file_folders FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 3. FILES (Failid) - Column names match API expectations
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES public.file_vaults(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.file_folders(id) ON DELETE SET NULL,

  -- File info
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  extension TEXT,

  -- Storage info (matches API)
  storage_provider TEXT DEFAULT 'supabase',
  storage_bucket TEXT DEFAULT 'file-vault',
  storage_path TEXT,
  storage_key TEXT,

  -- Checksums (matches API column names)
  checksum_md5 TEXT,
  checksum_sha256 TEXT,

  -- Image/Video dimensions
  width INTEGER,
  height INTEGER,
  duration REAL, -- Video/Audio duration in seconds

  -- EXIF / Media metadata (matches API)
  exif_data JSONB,
  camera_make TEXT,
  camera_model TEXT,
  lens TEXT,
  iso INTEGER,
  aperture TEXT,
  shutter_speed TEXT,
  focal_length TEXT,
  taken_at TIMESTAMPTZ,
  gps_latitude DOUBLE PRECISION,
  gps_longitude DOUBLE PRECISION,
  gps_location TEXT,

  -- Thumbnails
  thumbnail_small TEXT,
  thumbnail_medium TEXT,
  thumbnail_large TEXT,

  -- Processing
  preview_url TEXT,
  processing_status TEXT DEFAULT 'pending',
  processing_error TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  tags TEXT[] DEFAULT '{}',
  searchable_text TEXT,

  -- Version control
  version INTEGER DEFAULT 1,
  is_latest BOOLEAN DEFAULT true,
  parent_version_id UUID REFERENCES public.files(id),

  -- Access control
  is_public BOOLEAN DEFAULT false,
  owner_id UUID,

  -- User features
  is_starred BOOLEAN DEFAULT false,
  is_trashed BOOLEAN DEFAULT false,
  trashed_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL,
  updated_by UUID,
  deleted_at TIMESTAMPTZ,
  deleted_by UUID
);

CREATE INDEX IF NOT EXISTS idx_files_vault ON public.files(vault_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_files_folder ON public.files(folder_id);
CREATE INDEX IF NOT EXISTS idx_files_checksum ON public.files(checksum_md5);
CREATE INDEX IF NOT EXISTS idx_files_search ON public.files USING GIN(to_tsvector('english', COALESCE(searchable_text, '')));
CREATE INDEX IF NOT EXISTS idx_files_tags ON public.files USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_files_mime ON public.files(mime_type);
CREATE INDEX IF NOT EXISTS idx_files_owner ON public.files(owner_id);

-- RLS for files
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "files_all" ON public.files;
CREATE POLICY "files_all" ON public.files FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 4. FILE SHARES (Jagamislinkid)
CREATE TABLE IF NOT EXISTS public.file_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES public.file_vaults(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.file_folders(id) ON DELETE CASCADE,

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
    (file_id IS NULL AND folder_id IS NOT NULL)
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_file_shares_code ON public.file_shares(short_code);
CREATE INDEX IF NOT EXISTS idx_file_shares_file ON public.file_shares(file_id);
CREATE INDEX IF NOT EXISTS idx_file_shares_expires ON public.file_shares(expires_at);

-- RLS for file_shares
ALTER TABLE public.file_shares ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "file_shares_all" ON public.file_shares;
CREATE POLICY "file_shares_all" ON public.file_shares FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Public can read shares by short_code (for public share page)
DROP POLICY IF EXISTS "file_shares_public_read" ON public.file_shares;
CREATE POLICY "file_shares_public_read" ON public.file_shares FOR SELECT
  TO anon
  USING (
    expires_at IS NULL OR expires_at > NOW()
  );

-- 5. FILE VERSIONS (Versioonid)
CREATE TABLE IF NOT EXISTS public.file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,

  version INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  checksum_sha256 TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  change_description TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_file_versions_file ON public.file_versions(file_id);

-- RLS for file_versions
ALTER TABLE public.file_versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "file_versions_all" ON public.file_versions;
CREATE POLICY "file_versions_all" ON public.file_versions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 6. FILE ACTIVITIES / ACCESSES (Logid)
CREATE TABLE IF NOT EXISTS public.file_accesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.file_folders(id) ON DELETE CASCADE,
  share_id UUID REFERENCES public.file_shares(id) ON DELETE SET NULL,

  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,

  user_id UUID,
  user_email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  bytes_transferred BIGINT DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_file_accesses_file ON public.file_accesses(file_id);
CREATE INDEX IF NOT EXISTS idx_file_accesses_created ON public.file_accesses(created_at DESC);

-- RLS for file_accesses
ALTER TABLE public.file_accesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "file_accesses_insert" ON public.file_accesses;
CREATE POLICY "file_accesses_insert" ON public.file_accesses FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "file_accesses_select" ON public.file_accesses;
CREATE POLICY "file_accesses_select" ON public.file_accesses FOR SELECT
  TO authenticated
  USING (true);

-- 7. FILE TAGS (Sildid)
CREATE TABLE IF NOT EXISTS public.file_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  tag TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,

  UNIQUE(file_id, tag)
);

CREATE INDEX IF NOT EXISTS idx_file_tags_file ON public.file_tags(file_id);
CREATE INDEX IF NOT EXISTS idx_file_tags_tag ON public.file_tags(tag);

-- RLS for file_tags
ALTER TABLE public.file_tags ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "file_tags_all" ON public.file_tags;
CREATE POLICY "file_tags_all" ON public.file_tags FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- --------------------------------------------------------
-- PART 4: HELPER FUNCTIONS & TRIGGERS
-- --------------------------------------------------------

-- Update vault used_bytes trigger
CREATE OR REPLACE FUNCTION update_file_vault_used_bytes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.file_vaults
    SET used_bytes = used_bytes + NEW.size_bytes,
        updated_at = NOW()
    WHERE id = NEW.vault_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.file_vaults
    SET used_bytes = GREATEST(0, used_bytes - OLD.size_bytes),
        updated_at = NOW()
    WHERE id = OLD.vault_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.size_bytes != OLD.size_bytes THEN
    UPDATE public.file_vaults
    SET used_bytes = used_bytes - OLD.size_bytes + NEW.size_bytes,
        updated_at = NOW()
    WHERE id = NEW.vault_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_file_vault_used_bytes ON public.files;
CREATE TRIGGER trigger_update_file_vault_used_bytes
AFTER INSERT OR UPDATE OR DELETE ON public.files
FOR EACH ROW
EXECUTE FUNCTION update_file_vault_used_bytes();

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_file_vault_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_file_vaults_updated_at ON public.file_vaults;
CREATE TRIGGER trigger_file_vaults_updated_at
BEFORE UPDATE ON public.file_vaults
FOR EACH ROW
EXECUTE FUNCTION update_file_vault_updated_at();

DROP TRIGGER IF EXISTS trigger_file_folders_updated_at ON public.file_folders;
CREATE TRIGGER trigger_file_folders_updated_at
BEFORE UPDATE ON public.file_folders
FOR EACH ROW
EXECUTE FUNCTION update_file_vault_updated_at();

DROP TRIGGER IF EXISTS trigger_files_updated_at ON public.files;
CREATE TRIGGER trigger_files_updated_at
BEFORE UPDATE ON public.files
FOR EACH ROW
EXECUTE FUNCTION update_file_vault_updated_at();

-- ================================================================
-- END OF MIGRATION
-- Migration includes:
-- ✅ Storage bucket creation (file-vault)
-- ✅ Storage RLS policies (4 policies)
-- ✅ Database tables (7 tables):
--    - file_vaults: Failihoidlad
--    - file_folders: Kaustad
--    - files: Failid (with EXIF, GPS, media metadata)
--    - file_shares: Jagamislinkid
--    - file_versions: Versioonid
--    - file_accesses: Logid
--    - file_tags: Sildid
-- ✅ Database RLS policies
-- ✅ Indexes for performance
-- ✅ Triggers for automation (used_bytes, updated_at)
-- ================================================================
