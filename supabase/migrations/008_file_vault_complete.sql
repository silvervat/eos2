-- ================================================================
-- FILE VAULT SYSTEM - COMPLETE DATABASE SCHEMA
-- Version: 1.0 | Date: 2025-12-04
-- Description: Nextcloud-like file management system for EOS2
-- ================================================================

-- --------------------------------------------------------
-- 1. FILE VAULTS (Failihoidlad)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.file_vaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,

  -- Basic info
  name TEXT NOT NULL,
  description TEXT,
  config JSONB DEFAULT '{
    "maxFileSize": 1073741824,
    "allowedExtensions": [],
    "generateThumbnails": true,
    "enableVersioning": true,
    "enableSharing": true
  }'::jsonb,

  -- Storage quota
  quota_bytes BIGINT DEFAULT 107374182400, -- 100GB
  used_bytes BIGINT DEFAULT 0,
  file_count INTEGER DEFAULT 0,
  folder_count INTEGER DEFAULT 0,

  -- Status
  is_default BOOLEAN DEFAULT false,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'archived', 'suspended')),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL,
  deleted_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_file_vaults_tenant ON public.file_vaults(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_file_vaults_default ON public.file_vaults(tenant_id, is_default) WHERE deleted_at IS NULL AND is_default = true;

-- RLS
ALTER TABLE public.file_vaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "file_vaults_select" ON public.file_vaults FOR SELECT
  USING (tenant_id = (current_setting('app.tenant_id', true)::uuid));

CREATE POLICY "file_vaults_insert" ON public.file_vaults FOR INSERT
  WITH CHECK (tenant_id = (current_setting('app.tenant_id', true)::uuid));

CREATE POLICY "file_vaults_update" ON public.file_vaults FOR UPDATE
  USING (tenant_id = (current_setting('app.tenant_id', true)::uuid));

CREATE POLICY "file_vaults_delete" ON public.file_vaults FOR DELETE
  USING (tenant_id = (current_setting('app.tenant_id', true)::uuid));

-- --------------------------------------------------------
-- 2. FILE FOLDERS (Kaustad)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.file_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES public.file_vaults(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.file_folders(id) ON DELETE CASCADE,

  -- Folder info
  name TEXT NOT NULL,
  path TEXT NOT NULL, -- Full path like /Documents/Projects/2024
  slug TEXT NOT NULL, -- URL-friendly name
  depth INTEGER DEFAULT 0, -- Folder depth level

  -- Appearance
  color TEXT DEFAULT '#6B7280',
  icon TEXT DEFAULT 'folder',

  -- Access control
  is_public BOOLEAN DEFAULT false,
  password_hash TEXT, -- bcrypt hash for folder password

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,
  file_count INTEGER DEFAULT 0,
  total_size_bytes BIGINT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL,
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT folder_name_valid CHECK (name !~ '[<>:"/\\|?*]'),
  CONSTRAINT folder_path_unique UNIQUE (vault_id, path)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_file_folders_vault ON public.file_folders(vault_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_file_folders_parent ON public.file_folders(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_file_folders_path ON public.file_folders(path);
CREATE INDEX IF NOT EXISTS idx_file_folders_depth ON public.file_folders(vault_id, depth) WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE public.file_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "file_folders_all" ON public.file_folders FOR ALL
  USING (vault_id IN (
    SELECT id FROM public.file_vaults
    WHERE tenant_id = (current_setting('app.tenant_id', true)::uuid)
      AND deleted_at IS NULL
  ));

-- --------------------------------------------------------
-- 3. FILES (Failid)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES public.file_vaults(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.file_folders(id) ON DELETE SET NULL,

  -- File info
  name TEXT NOT NULL,
  original_name TEXT NOT NULL, -- Original filename before any changes
  path TEXT NOT NULL, -- Full path including filename
  slug TEXT NOT NULL, -- URL-friendly name

  -- Type info
  mime_type TEXT NOT NULL,
  extension TEXT,
  category TEXT GENERATED ALWAYS AS (
    CASE
      WHEN mime_type LIKE 'image/%' THEN 'image'
      WHEN mime_type LIKE 'video/%' THEN 'video'
      WHEN mime_type LIKE 'audio/%' THEN 'audio'
      WHEN mime_type LIKE 'application/pdf' THEN 'pdf'
      WHEN mime_type LIKE 'application/zip' OR mime_type LIKE 'application/x-rar%' OR mime_type LIKE 'application/x-7z%' THEN 'archive'
      WHEN mime_type LIKE 'application/vnd.ms-excel%' OR mime_type LIKE 'application/vnd.openxmlformats-officedocument.spreadsheet%' THEN 'spreadsheet'
      WHEN mime_type LIKE 'application/msword%' OR mime_type LIKE 'application/vnd.openxmlformats-officedocument.wordprocessing%' THEN 'document'
      WHEN mime_type LIKE 'application/vnd.ms-powerpoint%' OR mime_type LIKE 'application/vnd.openxmlformats-officedocument.presentation%' THEN 'presentation'
      WHEN mime_type LIKE 'text/%' THEN 'text'
      ELSE 'other'
    END
  ) STORED,

  -- Size
  size_bytes BIGINT NOT NULL,

  -- Storage
  storage_provider TEXT DEFAULT 'supabase',
  storage_bucket TEXT DEFAULT 'file-vault',
  storage_key TEXT NOT NULL, -- Unique key in storage
  storage_url TEXT, -- Direct URL if public

  -- Checksums
  checksum_md5 TEXT,
  checksum_sha256 TEXT,

  -- Image/Video dimensions
  width INTEGER,
  height INTEGER,
  duration_seconds NUMERIC, -- For audio/video

  -- Thumbnails
  thumbnail_small TEXT, -- 150x150
  thumbnail_medium TEXT, -- 500x500
  thumbnail_large TEXT, -- 1000x1000

  -- Processing status
  processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  processing_error TEXT,
  processed_at TIMESTAMPTZ,

  -- Preview
  preview_url TEXT, -- Rendered preview URL
  preview_html TEXT, -- HTML embed code

  -- Full-text search
  searchable_text TEXT, -- Extracted text content

  -- Tags and metadata
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}'::jsonb, -- Custom fields (Ultra Table style)

  -- Version control
  version INTEGER DEFAULT 1,
  is_latest BOOLEAN DEFAULT true,
  parent_version_id UUID REFERENCES public.files(id) ON DELETE SET NULL,

  -- Access control
  is_public BOOLEAN DEFAULT false,

  -- User features
  is_starred BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  is_trashed BOOLEAN DEFAULT false,
  trashed_at TIMESTAMPTZ,

  -- Owner
  owner_id UUID NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT file_size_positive CHECK (size_bytes >= 0)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_files_vault ON public.files(vault_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_files_folder ON public.files(folder_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_files_category ON public.files(category) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_files_starred ON public.files(vault_id, is_starred) WHERE deleted_at IS NULL AND is_starred = true;
CREATE INDEX IF NOT EXISTS idx_files_trashed ON public.files(vault_id, is_trashed) WHERE deleted_at IS NULL AND is_trashed = true;
CREATE INDEX IF NOT EXISTS idx_files_search ON public.files USING GIN(to_tsvector('simple', COALESCE(name, '') || ' ' || COALESCE(searchable_text, '')));
CREATE INDEX IF NOT EXISTS idx_files_tags ON public.files USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_files_metadata ON public.files USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_files_checksum ON public.files(checksum_sha256) WHERE checksum_sha256 IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_files_storage_key ON public.files(storage_key);

-- RLS
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "files_all" ON public.files FOR ALL
  USING (vault_id IN (
    SELECT id FROM public.file_vaults
    WHERE tenant_id = (current_setting('app.tenant_id', true)::uuid)
      AND deleted_at IS NULL
  ));

-- Public files can be read by anyone
CREATE POLICY "files_public_read" ON public.files FOR SELECT
  USING (is_public = true AND deleted_at IS NULL);

-- --------------------------------------------------------
-- 4. FILE SHARES (Jagamislinkid)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.file_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES public.file_vaults(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.file_folders(id) ON DELETE CASCADE,

  -- Share link
  short_code TEXT UNIQUE NOT NULL, -- e.g., "abc123" for /share/abc123
  share_url TEXT, -- Full URL

  -- Security
  password_hash TEXT, -- bcrypt hash
  require_login BOOLEAN DEFAULT false,
  allowed_emails TEXT[], -- Specific emails allowed

  -- Permissions
  allow_download BOOLEAN DEFAULT true,
  allow_preview BOOLEAN DEFAULT true,
  allow_upload BOOLEAN DEFAULT false, -- For folder shares
  allow_comment BOOLEAN DEFAULT false,

  -- Limits
  expires_at TIMESTAMPTZ,
  download_limit INTEGER, -- Max downloads
  view_limit INTEGER, -- Max views
  bandwidth_limit_bytes BIGINT, -- Max bandwidth

  -- Tracking
  downloads_count INTEGER DEFAULT 0,
  views_count INTEGER DEFAULT 0,
  bandwidth_used_bytes BIGINT DEFAULT 0,
  last_accessed_at TIMESTAMPTZ,

  -- Access log (recent IPs)
  access_log JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  title TEXT, -- Custom title for share page
  message TEXT, -- Message to recipient
  recipient_email TEXT, -- Email to notify
  notify_on_access BOOLEAN DEFAULT false,

  -- Branding
  show_logo BOOLEAN DEFAULT true,
  custom_background TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL,

  -- Constraints
  CONSTRAINT share_target_required CHECK (
    (file_id IS NOT NULL AND folder_id IS NULL) OR
    (file_id IS NULL AND folder_id IS NOT NULL)
  ),
  CONSTRAINT short_code_format CHECK (short_code ~ '^[a-zA-Z0-9_-]+$')
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_file_shares_code ON public.file_shares(short_code);
CREATE INDEX IF NOT EXISTS idx_file_shares_file ON public.file_shares(file_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_file_shares_folder ON public.file_shares(folder_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_file_shares_expires ON public.file_shares(expires_at) WHERE expires_at IS NOT NULL AND is_active = true;
CREATE INDEX IF NOT EXISTS idx_file_shares_vault ON public.file_shares(vault_id);

-- RLS
ALTER TABLE public.file_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "file_shares_owner" ON public.file_shares FOR ALL
  USING (vault_id IN (
    SELECT id FROM public.file_vaults
    WHERE tenant_id = (current_setting('app.tenant_id', true)::uuid)
      AND deleted_at IS NULL
  ));

-- Public access to shares (for viewing shared files)
CREATE POLICY "file_shares_public_read" ON public.file_shares FOR SELECT
  USING (is_active = true);

-- --------------------------------------------------------
-- 5. FILE VERSIONS (Versioonid)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,

  -- Version info
  version_number INTEGER NOT NULL,
  version_label TEXT, -- e.g., "v1.0", "Draft", "Final"

  -- Storage
  storage_key TEXT NOT NULL,
  storage_url TEXT,
  size_bytes BIGINT NOT NULL,

  -- Checksums
  checksum_md5 TEXT,
  checksum_sha256 TEXT NOT NULL,

  -- Type
  mime_type TEXT NOT NULL,

  -- Metadata
  change_description TEXT, -- What changed
  restore_point BOOLEAN DEFAULT false, -- Mark as restore point

  -- Thumbnails (copy from original at time of version)
  thumbnail_small TEXT,
  thumbnail_medium TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL,

  -- Constraints
  CONSTRAINT version_number_positive CHECK (version_number > 0),
  UNIQUE (file_id, version_number)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_file_versions_file ON public.file_versions(file_id);
CREATE INDEX IF NOT EXISTS idx_file_versions_created ON public.file_versions(file_id, created_at DESC);

-- RLS
ALTER TABLE public.file_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "file_versions_select" ON public.file_versions FOR SELECT
  USING (file_id IN (
    SELECT f.id FROM public.files f
    JOIN public.file_vaults v ON f.vault_id = v.id
    WHERE v.tenant_id = (current_setting('app.tenant_id', true)::uuid)
      AND v.deleted_at IS NULL
  ));

CREATE POLICY "file_versions_insert" ON public.file_versions FOR INSERT
  WITH CHECK (file_id IN (
    SELECT f.id FROM public.files f
    JOIN public.file_vaults v ON f.vault_id = v.id
    WHERE v.tenant_id = (current_setting('app.tenant_id', true)::uuid)
      AND v.deleted_at IS NULL
  ));

-- --------------------------------------------------------
-- 6. FILE ACTIVITIES (Logid)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.file_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES public.file_vaults(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.file_folders(id) ON DELETE CASCADE,
  share_id UUID REFERENCES public.file_shares(id) ON DELETE SET NULL,

  -- Action
  action TEXT NOT NULL CHECK (action IN (
    'upload', 'download', 'view', 'preview',
    'rename', 'move', 'copy', 'delete', 'restore', 'trash',
    'share', 'unshare', 'share_access',
    'create_folder', 'update_folder', 'delete_folder',
    'add_tag', 'remove_tag', 'update_metadata',
    'create_version', 'restore_version',
    'star', 'unstar', 'pin', 'unpin'
  )),

  -- Details
  details JSONB DEFAULT '{}'::jsonb, -- Action-specific data
  old_values JSONB, -- For updates
  new_values JSONB, -- For updates

  -- Actor
  user_id UUID,
  user_email TEXT,
  user_name TEXT,

  -- Client info
  ip_address INET,
  user_agent TEXT,
  referer TEXT,

  -- Related
  related_file_id UUID, -- For move/copy operations
  related_folder_id UUID,

  -- Bytes transferred
  bytes_transferred BIGINT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_file_activities_vault ON public.file_activities(vault_id);
CREATE INDEX IF NOT EXISTS idx_file_activities_file ON public.file_activities(file_id) WHERE file_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_file_activities_folder ON public.file_activities(folder_id) WHERE folder_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_file_activities_action ON public.file_activities(action);
CREATE INDEX IF NOT EXISTS idx_file_activities_user ON public.file_activities(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_file_activities_created ON public.file_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_file_activities_vault_created ON public.file_activities(vault_id, created_at DESC);

-- RLS
ALTER TABLE public.file_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "file_activities_select" ON public.file_activities FOR SELECT
  USING (vault_id IN (
    SELECT id FROM public.file_vaults
    WHERE tenant_id = (current_setting('app.tenant_id', true)::uuid)
      AND deleted_at IS NULL
  ));

CREATE POLICY "file_activities_insert" ON public.file_activities FOR INSERT
  WITH CHECK (vault_id IN (
    SELECT id FROM public.file_vaults
    WHERE tenant_id = (current_setting('app.tenant_id', true)::uuid)
      AND deleted_at IS NULL
  ));

-- --------------------------------------------------------
-- 7. UPLOAD SESSIONS (Chunked Upload)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.file_upload_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES public.file_vaults(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.file_folders(id) ON DELETE SET NULL,

  -- File info
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,

  -- Chunk info
  chunk_size INTEGER DEFAULT 10485760, -- 10MB
  total_chunks INTEGER NOT NULL,
  uploaded_chunks INTEGER DEFAULT 0,
  uploaded_bytes BIGINT DEFAULT 0,

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'uploading', 'processing', 'completed', 'failed', 'cancelled')),
  error_message TEXT,

  -- Resume token
  resume_token TEXT UNIQUE NOT NULL,

  -- Checksums (for verification)
  expected_checksum TEXT, -- Client-provided checksum

  -- Temporary storage keys for chunks
  chunk_keys JSONB DEFAULT '[]'::jsonb,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Owner
  user_id UUID NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  completed_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_upload_sessions_vault ON public.file_upload_sessions(vault_id);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_user ON public.file_upload_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_token ON public.file_upload_sessions(resume_token);
CREATE INDEX IF NOT EXISTS idx_upload_sessions_status ON public.file_upload_sessions(status) WHERE status IN ('pending', 'uploading');
CREATE INDEX IF NOT EXISTS idx_upload_sessions_expires ON public.file_upload_sessions(expires_at) WHERE status NOT IN ('completed', 'failed', 'cancelled');

-- RLS
ALTER TABLE public.file_upload_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "upload_sessions_all" ON public.file_upload_sessions FOR ALL
  USING (vault_id IN (
    SELECT id FROM public.file_vaults
    WHERE tenant_id = (current_setting('app.tenant_id', true)::uuid)
      AND deleted_at IS NULL
  ));

-- --------------------------------------------------------
-- 8. HELPER FUNCTIONS
-- --------------------------------------------------------

-- Update vault statistics on file changes
CREATE OR REPLACE FUNCTION update_vault_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.file_vaults
    SET
      used_bytes = used_bytes + NEW.size_bytes,
      file_count = file_count + 1,
      updated_at = NOW()
    WHERE id = NEW.vault_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.file_vaults
    SET
      used_bytes = GREATEST(0, used_bytes - OLD.size_bytes),
      file_count = GREATEST(0, file_count - 1),
      updated_at = NOW()
    WHERE id = OLD.vault_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.vault_id != NEW.vault_id THEN
      -- File moved to different vault
      UPDATE public.file_vaults
      SET
        used_bytes = GREATEST(0, used_bytes - OLD.size_bytes),
        file_count = GREATEST(0, file_count - 1),
        updated_at = NOW()
      WHERE id = OLD.vault_id;

      UPDATE public.file_vaults
      SET
        used_bytes = used_bytes + NEW.size_bytes,
        file_count = file_count + 1,
        updated_at = NOW()
      WHERE id = NEW.vault_id;
    ELSIF OLD.size_bytes != NEW.size_bytes THEN
      -- File size changed
      UPDATE public.file_vaults
      SET
        used_bytes = GREATEST(0, used_bytes - OLD.size_bytes + NEW.size_bytes),
        updated_at = NOW()
      WHERE id = NEW.vault_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_vault_stats ON public.files;
CREATE TRIGGER trigger_update_vault_stats
AFTER INSERT OR UPDATE OR DELETE ON public.files
FOR EACH ROW
EXECUTE FUNCTION update_vault_stats();

-- Update folder statistics
CREATE OR REPLACE FUNCTION update_folder_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.folder_id IS NOT NULL THEN
      UPDATE public.file_folders
      SET
        file_count = file_count + 1,
        total_size_bytes = total_size_bytes + NEW.size_bytes,
        updated_at = NOW()
      WHERE id = NEW.folder_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.folder_id IS NOT NULL THEN
      UPDATE public.file_folders
      SET
        file_count = GREATEST(0, file_count - 1),
        total_size_bytes = GREATEST(0, total_size_bytes - OLD.size_bytes),
        updated_at = NOW()
      WHERE id = OLD.folder_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.folder_id IS DISTINCT FROM NEW.folder_id THEN
      -- File moved to different folder
      IF OLD.folder_id IS NOT NULL THEN
        UPDATE public.file_folders
        SET
          file_count = GREATEST(0, file_count - 1),
          total_size_bytes = GREATEST(0, total_size_bytes - OLD.size_bytes),
          updated_at = NOW()
        WHERE id = OLD.folder_id;
      END IF;

      IF NEW.folder_id IS NOT NULL THEN
        UPDATE public.file_folders
        SET
          file_count = file_count + 1,
          total_size_bytes = total_size_bytes + NEW.size_bytes,
          updated_at = NOW()
        WHERE id = NEW.folder_id;
      END IF;
    ELSIF OLD.size_bytes != NEW.size_bytes AND NEW.folder_id IS NOT NULL THEN
      -- File size changed
      UPDATE public.file_folders
      SET
        total_size_bytes = GREATEST(0, total_size_bytes - OLD.size_bytes + NEW.size_bytes),
        updated_at = NOW()
      WHERE id = NEW.folder_id;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_folder_stats ON public.files;
CREATE TRIGGER trigger_update_folder_stats
AFTER INSERT OR UPDATE OR DELETE ON public.files
FOR EACH ROW
EXECUTE FUNCTION update_folder_stats();

-- Update vault folder count
CREATE OR REPLACE FUNCTION update_vault_folder_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.file_vaults
    SET folder_count = folder_count + 1, updated_at = NOW()
    WHERE id = NEW.vault_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.file_vaults
    SET folder_count = GREATEST(0, folder_count - 1), updated_at = NOW()
    WHERE id = OLD.vault_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_vault_folder_count ON public.file_folders;
CREATE TRIGGER trigger_update_vault_folder_count
AFTER INSERT OR DELETE ON public.file_folders
FOR EACH ROW
EXECUTE FUNCTION update_vault_folder_count();

-- Generate unique short code for shares
CREATE OR REPLACE FUNCTION generate_share_code(length INTEGER DEFAULT 8)
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Calculate folder path
CREATE OR REPLACE FUNCTION calculate_folder_path(p_parent_id UUID, p_name TEXT)
RETURNS TEXT AS $$
DECLARE
  parent_path TEXT;
BEGIN
  IF p_parent_id IS NULL THEN
    RETURN '/' || p_name;
  END IF;

  SELECT path INTO parent_path FROM public.file_folders WHERE id = p_parent_id;
  RETURN parent_path || '/' || p_name;
END;
$$ LANGUAGE plpgsql;

-- Get folder tree (recursive)
CREATE OR REPLACE FUNCTION get_folder_tree(p_vault_id UUID, p_parent_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  parent_id UUID,
  name TEXT,
  path TEXT,
  depth INTEGER,
  file_count INTEGER,
  total_size_bytes BIGINT
) AS $$
WITH RECURSIVE folder_tree AS (
  -- Base case
  SELECT
    f.id, f.parent_id, f.name, f.path, f.depth, f.file_count, f.total_size_bytes
  FROM public.file_folders f
  WHERE f.vault_id = p_vault_id
    AND f.deleted_at IS NULL
    AND (p_parent_id IS NULL AND f.parent_id IS NULL OR f.parent_id = p_parent_id)

  UNION ALL

  -- Recursive case
  SELECT
    f.id, f.parent_id, f.name, f.path, f.depth, f.file_count, f.total_size_bytes
  FROM public.file_folders f
  JOIN folder_tree ft ON f.parent_id = ft.id
  WHERE f.deleted_at IS NULL
)
SELECT * FROM folder_tree ORDER BY path;
$$ LANGUAGE sql STABLE;

-- Search files with full-text search
CREATE OR REPLACE FUNCTION search_files(
  p_vault_id UUID,
  p_query TEXT,
  p_folder_id UUID DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  path TEXT,
  mime_type TEXT,
  size_bytes BIGINT,
  category TEXT,
  created_at TIMESTAMPTZ,
  rank REAL
) AS $$
SELECT
  f.id,
  f.name,
  f.path,
  f.mime_type,
  f.size_bytes,
  f.category,
  f.created_at,
  ts_rank(to_tsvector('simple', COALESCE(f.name, '') || ' ' || COALESCE(f.searchable_text, '')), plainto_tsquery('simple', p_query)) as rank
FROM public.files f
WHERE f.vault_id = p_vault_id
  AND f.deleted_at IS NULL
  AND f.is_trashed = false
  AND (p_folder_id IS NULL OR f.folder_id = p_folder_id)
  AND (p_category IS NULL OR f.category = p_category)
  AND (
    p_query IS NULL
    OR p_query = ''
    OR to_tsvector('simple', COALESCE(f.name, '') || ' ' || COALESCE(f.searchable_text, '')) @@ plainto_tsquery('simple', p_query)
    OR f.name ILIKE '%' || p_query || '%'
  )
ORDER BY rank DESC, f.created_at DESC
LIMIT p_limit
OFFSET p_offset;
$$ LANGUAGE sql STABLE;

-- --------------------------------------------------------
-- 9. UPDATED_AT TRIGGERS
-- --------------------------------------------------------

CREATE TRIGGER update_file_vaults_updated_at BEFORE UPDATE ON public.file_vaults
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_file_folders_updated_at BEFORE UPDATE ON public.file_folders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at BEFORE UPDATE ON public.files
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_file_shares_updated_at BEFORE UPDATE ON public.file_shares
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_upload_sessions_updated_at BEFORE UPDATE ON public.file_upload_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- --------------------------------------------------------
-- 10. STORAGE BUCKET POLICIES (for Supabase)
-- --------------------------------------------------------
-- Note: These need to be run separately in Supabase Dashboard
-- or using the Supabase CLI with storage admin privileges

/*
-- Create bucket (run in Supabase Dashboard > Storage)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'file-vault',
  'file-vault',
  false,
  1073741824, -- 1GB max file size
  NULL -- Allow all mime types
);

-- RLS policies for storage bucket
CREATE POLICY "Users can upload to their vault" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'file-vault' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.file_vaults
      WHERE tenant_id = (current_setting('app.tenant_id', true)::uuid)
    )
  );

CREATE POLICY "Users can read their files" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'file-vault' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.file_vaults
      WHERE tenant_id = (current_setting('app.tenant_id', true)::uuid)
    )
  );

CREATE POLICY "Users can delete their files" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'file-vault' AND
    (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.file_vaults
      WHERE tenant_id = (current_setting('app.tenant_id', true)::uuid)
    )
  );

-- Public access for shared files
CREATE POLICY "Public access to shared files" ON storage.objects FOR SELECT
  USING (
    bucket_id = 'file-vault' AND
    EXISTS (
      SELECT 1 FROM public.files f
      JOIN public.file_shares s ON s.file_id = f.id
      WHERE f.storage_key = name
        AND s.is_active = true
        AND (s.expires_at IS NULL OR s.expires_at > NOW())
    )
  );
*/

-- --------------------------------------------------------
-- 11. INITIAL DATA
-- --------------------------------------------------------

-- Create default vault for each tenant that doesn't have one
DO $$
DECLARE
  t_id UUID;
BEGIN
  FOR t_id IN SELECT id FROM public.tenants LOOP
    INSERT INTO public.file_vaults (tenant_id, name, description, is_default, created_by)
    SELECT
      t_id,
      'Peamine failihoidla',
      'Vaikimisi failihoidla kõikide failide jaoks',
      true,
      t_id
    WHERE NOT EXISTS (
      SELECT 1 FROM public.file_vaults WHERE tenant_id = t_id AND deleted_at IS NULL
    );
  END LOOP;
END;
$$;

-- ================================================================
-- END OF MIGRATION
-- ================================================================

COMMENT ON TABLE public.file_vaults IS 'Failihoidlad - File storage vaults per tenant';
COMMENT ON TABLE public.file_folders IS 'Kaustad - Folder hierarchy within vaults';
COMMENT ON TABLE public.files IS 'Failid - Files stored in the system';
COMMENT ON TABLE public.file_shares IS 'Jagamislinkid - Share links for files and folders';
COMMENT ON TABLE public.file_versions IS 'Versioonid - File version history';
COMMENT ON TABLE public.file_activities IS 'Logid - Activity log for all file operations';
COMMENT ON TABLE public.file_upload_sessions IS 'Üleslaadimissessioonid - Chunked upload sessions';
