-- ================================================================
-- FILE VAULT SYSTEM - COMPLETE DATABASE SCHEMA
-- Version: 1.0 | Date: 2025-12-04
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

-- RLS
ALTER TABLE public.file_vaults ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their tenant's vaults" ON public.file_vaults FOR SELECT
  USING (tenant_id = (current_setting('app.tenant_id', true)::uuid));

CREATE POLICY "Users can create vaults" ON public.file_vaults FOR INSERT
  WITH CHECK (tenant_id = (current_setting('app.tenant_id', true)::uuid));

-- --------------------------------------------------------
-- 2. FILE FOLDERS (Kaustad)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.file_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vault_id UUID NOT NULL REFERENCES public.file_vaults(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.file_folders(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  path TEXT NOT NULL,
  color TEXT,
  icon TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_file_folders_vault ON public.file_folders(vault_id);
CREATE INDEX IF NOT EXISTS idx_file_folders_parent ON public.file_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_file_folders_path ON public.file_folders(path);

-- RLS
ALTER TABLE public.file_folders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage folders" ON public.file_folders FOR ALL
  USING (vault_id IN (
    SELECT id FROM public.file_vaults 
    WHERE tenant_id = (current_setting('app.tenant_id', true)::uuid)
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
  path TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  extension TEXT,
  
  -- Hashes
  hash_md5 TEXT,
  hash_sha256 TEXT,
  
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
  
  -- User features
  is_starred BOOLEAN DEFAULT false,
  is_trashed BOOLEAN DEFAULT false,
  trashed_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL,
  deleted_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_files_vault ON public.files(vault_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_files_folder ON public.files(folder_id);
CREATE INDEX IF NOT EXISTS idx_files_search ON public.files USING GIN(to_tsvector('english', COALESCE(searchable_text, '')));
CREATE INDEX IF NOT EXISTS idx_files_tags ON public.files USING GIN(tags);

-- RLS
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage files" ON public.files FOR ALL
  USING (vault_id IN (
    SELECT id FROM public.file_vaults 
    WHERE tenant_id = (current_setting('app.tenant_id', true)::uuid)
  ));

-- --------------------------------------------------------
-- 4. FILE SHARES (Jagamislinkid)
-- --------------------------------------------------------
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

-- RLS
ALTER TABLE public.file_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage shares" ON public.file_shares FOR ALL
  USING (vault_id IN (
    SELECT id FROM public.file_vaults 
    WHERE tenant_id = (current_setting('app.tenant_id', true)::uuid)
  ));

-- --------------------------------------------------------
-- 5. FILE VERSIONS (Versioonid)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.file_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_id UUID NOT NULL REFERENCES public.files(id) ON DELETE CASCADE,
  
  version INTEGER NOT NULL,
  path TEXT NOT NULL,
  size_bytes BIGINT NOT NULL,
  hash_sha256 TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  change_description TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_file_versions_file ON public.file_versions(file_id);

-- RLS
ALTER TABLE public.file_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view versions" ON public.file_versions FOR SELECT
  USING (file_id IN (
    SELECT f.id FROM public.files f
    JOIN public.file_vaults v ON f.vault_id = v.id
    WHERE v.tenant_id = (current_setting('app.tenant_id', true)::uuid)
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
  
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  
  user_id UUID,
  user_email TEXT,
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_file_activities_vault ON public.file_activities(vault_id);
CREATE INDEX IF NOT EXISTS idx_file_activities_created ON public.file_activities(created_at DESC);

-- RLS
ALTER TABLE public.file_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view activities" ON public.file_activities FOR SELECT
  USING (vault_id IN (
    SELECT id FROM public.file_vaults 
    WHERE tenant_id = (current_setting('app.tenant_id', true)::uuid)
  ));

-- --------------------------------------------------------
-- 7. HELPER FUNCTIONS
-- --------------------------------------------------------

-- Update vault used_bytes
CREATE OR REPLACE FUNCTION update_vault_used_bytes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.file_vaults
    SET used_bytes = used_bytes + NEW.size_bytes
    WHERE id = NEW.vault_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.file_vaults
    SET used_bytes = GREATEST(0, used_bytes - OLD.size_bytes)
    WHERE id = OLD.vault_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_vault_used_bytes ON public.files;
CREATE TRIGGER trigger_update_vault_used_bytes
AFTER INSERT OR DELETE ON public.files
FOR EACH ROW
EXECUTE FUNCTION update_vault_used_bytes();

-- --------------------------------------------------------
-- 8. INITIAL DATA
-- --------------------------------------------------------

-- Create default vault for each tenant
INSERT INTO public.file_vaults (tenant_id, name, created_by)
SELECT 
  id,
  'Peamine failihoidla',
  id
FROM public.tenants
WHERE NOT EXISTS (
  SELECT 1 FROM public.file_vaults WHERE tenant_id = tenants.id
);

-- ================================================================
-- END OF MIGRATION
-- ================================================================
