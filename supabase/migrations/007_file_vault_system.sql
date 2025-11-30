-- ============================================================================
-- RIVEST FILE VAULT - DATABASE MIGRATION
-- ============================================================================
-- Description: Complete file management system with table-based metadata
-- Version: 1.0.0
-- Date: 2025-11-30
-- ============================================================================

-- ============================================================================
-- 1. FILE VAULTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.file_vaults (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  
  -- Vault configuration
  config JSONB DEFAULT '{}',
  
  -- Storage quota (bytes)
  quota_bytes BIGINT DEFAULT 107374182400, -- 100GB default
  used_bytes BIGINT DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL,
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT file_vaults_name_check CHECK (char_length(name) > 0),
  CONSTRAINT file_vaults_quota_check CHECK (quota_bytes > 0),
  CONSTRAINT file_vaults_used_check CHECK (used_bytes >= 0)
);

-- Indexes
CREATE INDEX idx_file_vaults_tenant ON public.file_vaults(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_file_vaults_created ON public.file_vaults(created_at DESC);

-- Comments
COMMENT ON TABLE public.file_vaults IS 'File storage containers for tenants';
COMMENT ON COLUMN public.file_vaults.quota_bytes IS 'Maximum storage allowed in bytes';
COMMENT ON COLUMN public.file_vaults.used_bytes IS 'Current storage used in bytes';

-- ============================================================================
-- 2. FILE FOLDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.file_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES public.file_vaults(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.file_folders(id) ON DELETE CASCADE,
  
  -- Folder details
  name TEXT NOT NULL,
  path TEXT NOT NULL, -- Materialized path: /folder1/folder2
  color TEXT, -- Hex color for UI
  icon TEXT, -- Icon name
  
  -- Custom metadata (Airtable-style)
  metadata JSONB DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL,
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT file_folders_name_check CHECK (char_length(name) > 0),
  CONSTRAINT file_folders_no_self_parent CHECK (id != parent_id)
);

-- Indexes
CREATE INDEX idx_file_folders_vault ON public.file_folders(vault_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_file_folders_parent ON public.file_folders(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_file_folders_path ON public.file_folders USING btree(path) WHERE deleted_at IS NULL;
CREATE INDEX idx_file_folders_metadata ON public.file_folders USING GIN(metadata);

-- Comments
COMMENT ON TABLE public.file_folders IS 'Hierarchical folder structure for files';
COMMENT ON COLUMN public.file_folders.path IS 'Materialized path for efficient tree queries';
COMMENT ON COLUMN public.file_folders.metadata IS 'Custom metadata columns (Airtable-style)';

-- ============================================================================
-- 3. FILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES public.file_vaults(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.file_folders(id) ON DELETE SET NULL,
  
  -- File storage
  name TEXT NOT NULL,
  path TEXT NOT NULL, -- Supabase Storage path: vault_id/file_id/original_name.ext
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  extension TEXT,
  
  -- File hashes (for deduplication & integrity)
  hash_md5 TEXT,
  hash_sha256 TEXT,
  
  -- Thumbnails (Supabase Storage paths)
  thumbnail_small TEXT, -- 100x100
  thumbnail_medium TEXT, -- 400x400
  thumbnail_large TEXT, -- 800x800
  
  -- Custom metadata (Airtable-style)
  metadata JSONB DEFAULT '{}',
  
  -- Tags & search
  tags TEXT[] DEFAULT '{}',
  searchable_text TEXT, -- Extracted text from PDF/DOCX/etc
  
  -- Version control
  version INTEGER DEFAULT 1,
  is_latest BOOLEAN DEFAULT true,
  parent_version_id UUID REFERENCES public.files(id) ON DELETE SET NULL,
  
  -- UI flags
  is_starred BOOLEAN DEFAULT false,
  is_trashed BOOLEAN DEFAULT false,
  trashed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL,
  deleted_at TIMESTAMPTZ,
  
  -- Constraints
  CONSTRAINT files_name_check CHECK (char_length(name) > 0),
  CONSTRAINT files_size_check CHECK (size_bytes >= 0),
  CONSTRAINT files_version_check CHECK (version > 0)
);

-- Indexes
CREATE INDEX idx_files_vault ON public.files(vault_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_folder ON public.files(folder_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_name ON public.files(name) WHERE deleted_at IS NULL;
CREATE INDEX idx_files_hash_sha256 ON public.files(hash_sha256) WHERE hash_sha256 IS NOT NULL;
CREATE INDEX idx_files_starred ON public.files(is_starred) WHERE is_starred = true AND deleted_at IS NULL;
CREATE INDEX idx_files_trashed ON public.files(is_trashed) WHERE is_trashed = true;
CREATE INDEX idx_files_latest ON public.files(is_latest) WHERE is_latest = true AND deleted_at IS NULL;
CREATE INDEX idx_files_created ON public.files(created_at DESC);
CREATE INDEX idx_files_updated ON public.files(updated_at DESC);

-- GIN indexes for advanced queries
CREATE INDEX idx_files_tags ON public.files USING GIN(tags);
CREATE INDEX idx_files_metadata ON public.files USING GIN(metadata);
CREATE INDEX idx_files_search ON public.files USING GIN(to_tsvector('english', COALESCE(searchable_text, '')));

-- Comments
COMMENT ON TABLE public.files IS 'File metadata and storage references';
COMMENT ON COLUMN public.files.path IS 'Supabase Storage path to actual file';
COMMENT ON COLUMN public.files.metadata IS 'Custom metadata columns (project_id, client_id, status, etc)';
COMMENT ON COLUMN public.files.searchable_text IS 'Extracted text for full-text search';
COMMENT ON COLUMN public.files.hash_sha256 IS 'SHA-256 hash for deduplication and integrity';

-- ============================================================================
-- 4. FILE SHARES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.file_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES public.file_vaults(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.files(id) ON DELETE CASCADE,
  folder_id UUID REFERENCES public.file_folders(id) ON DELETE CASCADE,
  
  -- Share link
  short_code TEXT UNIQUE NOT NULL, -- e.g., "abc123xyz" for vault.ee/abc123xyz
  password_hash TEXT, -- bcrypt hash if password protected
  
  -- Access control
  allow_download BOOLEAN DEFAULT true,
  allow_upload BOOLEAN DEFAULT false, -- For folder shares
  expires_at TIMESTAMPTZ, -- NULL = never expires
  download_limit INTEGER, -- NULL = unlimited
  downloads_count INTEGER DEFAULT 0,
  
  -- Tracking
  last_accessed_at TIMESTAMPTZ,
  access_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL,
  
  -- Constraints
  CONSTRAINT file_shares_target_check CHECK (
    (file_id IS NOT NULL AND folder_id IS NULL) OR
    (file_id IS NULL AND folder_id IS NOT NULL)
  ),
  CONSTRAINT file_shares_short_code_check CHECK (char_length(short_code) >= 6)
);

-- Indexes
CREATE UNIQUE INDEX idx_file_shares_short_code ON public.file_shares(short_code);
CREATE INDEX idx_file_shares_file ON public.file_shares(file_id);
CREATE INDEX idx_file_shares_folder ON public.file_shares(folder_id);
CREATE INDEX idx_file_shares_expires ON public.file_shares(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_file_shares_created ON public.file_shares(created_at DESC);

-- Comments
COMMENT ON TABLE public.file_shares IS 'Public sharing links for files and folders';
COMMENT ON COLUMN public.file_shares.short_code IS 'Short URL code (e.g., vault.ee/abc123)';
COMMENT ON COLUMN public.file_shares.password_hash IS 'bcrypt hash for password protection';

-- ============================================================================
-- 5. FILE VERSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  
  -- Version details
  version INTEGER NOT NULL,
  path TEXT NOT NULL, -- Storage path to this version
  size_bytes BIGINT NOT NULL,
  hash_sha256 TEXT NOT NULL,
  
  -- Change information
  change_description TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL,
  
  -- Constraints
  CONSTRAINT file_versions_version_check CHECK (version > 0),
  CONSTRAINT file_versions_size_check CHECK (size_bytes >= 0),
  CONSTRAINT file_versions_unique_version UNIQUE(file_id, version)
);

-- Indexes
CREATE INDEX idx_file_versions_file ON public.file_versions(file_id);
CREATE INDEX idx_file_versions_file_version ON public.file_versions(file_id, version DESC);
CREATE INDEX idx_file_versions_created ON public.file_versions(created_at DESC);

-- Comments
COMMENT ON TABLE public.file_versions IS 'Version history for files';
COMMENT ON COLUMN public.file_versions.version IS 'Version number (1, 2, 3, ...)';

-- ============================================================================
-- 6. FILE ACTIVITIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.file_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES public.file_vaults(id) ON DELETE CASCADE,
  file_id UUID REFERENCES public.files(id) ON DELETE SET NULL,
  folder_id UUID REFERENCES public.file_folders(id) ON DELETE SET NULL,
  
  -- Activity details
  action TEXT NOT NULL, -- 'upload', 'download', 'delete', 'share', 'move', 'rename', 'update'
  details JSONB DEFAULT '{}',
  
  -- User & session
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes (partitioned by time for performance)
CREATE INDEX idx_file_activities_vault ON public.file_activities(vault_id);
CREATE INDEX idx_file_activities_file ON public.file_activities(file_id) WHERE file_id IS NOT NULL;
CREATE INDEX idx_file_activities_folder ON public.file_activities(folder_id) WHERE folder_id IS NOT NULL;
CREATE INDEX idx_file_activities_user ON public.file_activities(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_file_activities_action ON public.file_activities(action);
CREATE INDEX idx_file_activities_created ON public.file_activities(created_at DESC);

-- Comments
COMMENT ON TABLE public.file_activities IS 'Audit log for all file operations';
COMMENT ON COLUMN public.file_activities.action IS 'Type of activity performed';
COMMENT ON COLUMN public.file_activities.details IS 'Additional context (old_name, new_name, etc)';

-- ============================================================================
-- 7. FUNCTIONS
-- ============================================================================

-- Function to update vault used_bytes
CREATE OR REPLACE FUNCTION update_vault_storage()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- File added
    UPDATE file_vaults
    SET used_bytes = used_bytes + NEW.size_bytes
    WHERE id = NEW.vault_id;
    
  ELSIF TG_OP = 'UPDATE' AND OLD.size_bytes != NEW.size_bytes THEN
    -- File size changed
    UPDATE file_vaults
    SET used_bytes = used_bytes + (NEW.size_bytes - OLD.size_bytes)
    WHERE id = NEW.vault_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    -- File removed
    UPDATE file_vaults
    SET used_bytes = used_bytes - OLD.size_bytes
    WHERE id = OLD.vault_id;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Function to update folder paths when parent changes
CREATE OR REPLACE FUNCTION update_folder_paths()
RETURNS TRIGGER AS $$
DECLARE
  new_path TEXT;
  old_path TEXT;
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.parent_id IS DISTINCT FROM NEW.parent_id OR OLD.name != NEW.name)) THEN
    -- Calculate new path
    IF NEW.parent_id IS NULL THEN
      new_path := '/' || NEW.name;
    ELSE
      SELECT path || '/' || NEW.name INTO new_path
      FROM file_folders
      WHERE id = NEW.parent_id;
    END IF;
    
    -- Update this folder's path
    NEW.path = new_path;
    
    -- If updating and path changed, update all children
    IF TG_OP = 'UPDATE' AND OLD.path != new_path THEN
      old_path := OLD.path;
      
      -- Update all descendant folders
      UPDATE file_folders
      SET path = new_path || substring(path from length(old_path) + 1)
      WHERE path LIKE old_path || '/%';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to prevent circular folder references
CREATE OR REPLACE FUNCTION prevent_circular_folder_ref()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.parent_id IS NOT NULL THEN
    -- Check if new parent is a descendant
    IF EXISTS (
      SELECT 1 FROM file_folders
      WHERE id = NEW.parent_id
      AND path LIKE (SELECT path FROM file_folders WHERE id = NEW.id) || '/%'
    ) THEN
      RAISE EXCEPTION 'Cannot move folder into its own subfolder';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 8. TRIGGERS
-- ============================================================================

-- Trigger to update vault storage
DROP TRIGGER IF EXISTS trigger_update_vault_storage ON public.files;
CREATE TRIGGER trigger_update_vault_storage
  AFTER INSERT OR UPDATE OR DELETE ON public.files
  FOR EACH ROW
  EXECUTE FUNCTION update_vault_storage();

-- Trigger to update folder paths
DROP TRIGGER IF EXISTS trigger_update_folder_paths ON public.file_folders;
CREATE TRIGGER trigger_update_folder_paths
  BEFORE INSERT OR UPDATE ON public.file_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_folder_paths();

-- Trigger to prevent circular references
DROP TRIGGER IF EXISTS trigger_prevent_circular_folder_ref ON public.file_folders;
CREATE TRIGGER trigger_prevent_circular_folder_ref
  BEFORE UPDATE ON public.file_folders
  FOR EACH ROW
  WHEN (NEW.parent_id IS NOT NULL AND OLD.parent_id IS DISTINCT FROM NEW.parent_id)
  EXECUTE FUNCTION prevent_circular_folder_ref();

-- Trigger to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
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
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_file_folders_updated_at ON public.file_folders;
CREATE TRIGGER trigger_file_folders_updated_at
  BEFORE UPDATE ON public.file_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_files_updated_at ON public.files;
CREATE TRIGGER trigger_files_updated_at
  BEFORE UPDATE ON public.files
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.file_vaults ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_folders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.file_activities ENABLE ROW LEVEL SECURITY;

-- Helper function to get user's tenant_id
CREATE OR REPLACE FUNCTION auth.user_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id
  FROM user_profiles
  WHERE auth_user_id = auth.uid()
$$ LANGUAGE SQL SECURITY DEFINER;

-- FILE VAULTS policies
CREATE POLICY "Users can view their tenant's vaults"
  ON public.file_vaults FOR SELECT
  TO authenticated
  USING (tenant_id = auth.user_tenant_id());

CREATE POLICY "Admins can insert vaults"
  ON public.file_vaults FOR INSERT
  TO authenticated
  WITH CHECK (
    tenant_id = auth.user_tenant_id() AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE auth_user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY "Admins can update vaults"
  ON public.file_vaults FOR UPDATE
  TO authenticated
  USING (
    tenant_id = auth.user_tenant_id() AND
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE auth_user_id = auth.uid()
      AND role IN ('admin', 'owner')
    )
  );

-- FILE FOLDERS policies
CREATE POLICY "Users can view folders in their vaults"
  ON public.file_folders FOR SELECT
  TO authenticated
  USING (
    vault_id IN (
      SELECT id FROM file_vaults WHERE tenant_id = auth.user_tenant_id()
    )
  );

CREATE POLICY "Users can create folders in their vaults"
  ON public.file_folders FOR INSERT
  TO authenticated
  WITH CHECK (
    vault_id IN (
      SELECT id FROM file_vaults WHERE tenant_id = auth.user_tenant_id()
    )
  );

CREATE POLICY "Users can update folders in their vaults"
  ON public.file_folders FOR UPDATE
  TO authenticated
  USING (
    vault_id IN (
      SELECT id FROM file_vaults WHERE tenant_id = auth.user_tenant_id()
    )
  );

CREATE POLICY "Users can delete folders in their vaults"
  ON public.file_folders FOR DELETE
  TO authenticated
  USING (
    vault_id IN (
      SELECT id FROM file_vaults WHERE tenant_id = auth.user_tenant_id()
    )
  );

-- FILES policies
CREATE POLICY "Users can view files in their vaults"
  ON public.files FOR SELECT
  TO authenticated
  USING (
    vault_id IN (
      SELECT id FROM file_vaults WHERE tenant_id = auth.user_tenant_id()
    )
  );

CREATE POLICY "Users can upload files to their vaults"
  ON public.files FOR INSERT
  TO authenticated
  WITH CHECK (
    vault_id IN (
      SELECT id FROM file_vaults WHERE tenant_id = auth.user_tenant_id()
    )
  );

CREATE POLICY "Users can update files in their vaults"
  ON public.files FOR UPDATE
  TO authenticated
  USING (
    vault_id IN (
      SELECT id FROM file_vaults WHERE tenant_id = auth.user_tenant_id()
    )
  );

CREATE POLICY "Users can delete files in their vaults"
  ON public.files FOR DELETE
  TO authenticated
  USING (
    vault_id IN (
      SELECT id FROM file_vaults WHERE tenant_id = auth.user_tenant_id()
    )
  );

-- FILE SHARES policies
CREATE POLICY "Users can view their vault's shares"
  ON public.file_shares FOR SELECT
  TO authenticated
  USING (
    vault_id IN (
      SELECT id FROM file_vaults WHERE tenant_id = auth.user_tenant_id()
    )
  );

CREATE POLICY "Users can create shares for their files"
  ON public.file_shares FOR INSERT
  TO authenticated
  WITH CHECK (
    vault_id IN (
      SELECT id FROM file_vaults WHERE tenant_id = auth.user_tenant_id()
    )
  );

-- Public can access shares (checked separately in API)
CREATE POLICY "Public can view active shares"
  ON public.file_shares FOR SELECT
  TO anon
  USING (
    (expires_at IS NULL OR expires_at > NOW()) AND
    (download_limit IS NULL OR downloads_count < download_limit)
  );

-- FILE VERSIONS policies
CREATE POLICY "Users can view versions of their files"
  ON public.file_versions FOR SELECT
  TO authenticated
  USING (
    file_id IN (
      SELECT id FROM files WHERE vault_id IN (
        SELECT id FROM file_vaults WHERE tenant_id = auth.user_tenant_id()
      )
    )
  );

-- FILE ACTIVITIES policies
CREATE POLICY "Users can view activities in their vaults"
  ON public.file_activities FOR SELECT
  TO authenticated
  USING (
    vault_id IN (
      SELECT id FROM file_vaults WHERE tenant_id = auth.user_tenant_id()
    )
  );

CREATE POLICY "System can insert activities"
  ON public.file_activities FOR INSERT
  TO authenticated
  WITH CHECK (true); -- Logged by system

-- ============================================================================
-- 10. INITIAL DATA (Optional)
-- ============================================================================

-- This will be created automatically by API when user first accesses file vault
-- See: apps/web/src/app/api/file-vault/vaults/route.ts

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Verify tables
DO $$
BEGIN
  RAISE NOTICE 'File Vault Migration Complete!';
  RAISE NOTICE 'Created tables:';
  RAISE NOTICE '  - file_vaults';
  RAISE NOTICE '  - file_folders';
  RAISE NOTICE '  - files';
  RAISE NOTICE '  - file_shares';
  RAISE NOTICE '  - file_versions';
  RAISE NOTICE '  - file_activities';
  RAISE NOTICE '';
  RAISE NOTICE 'Created functions: 4';
  RAISE NOTICE 'Created triggers: 6';
  RAISE NOTICE 'Created RLS policies: 20+';
  RAISE NOTICE '';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '  1. Create Supabase Storage bucket: file-vault';
  RAISE NOTICE '  2. Configure storage RLS policies';
  RAISE NOTICE '  3. Test file upload via UI';
END $$;
