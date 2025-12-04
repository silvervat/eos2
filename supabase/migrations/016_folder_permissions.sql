-- ================================================================
-- FOLDER PERMISSIONS SYSTEM
-- Migration: 016_folder_permissions.sql
-- Date: 2025-12-04
-- ================================================================

-- Add visibility column to file_folders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'file_folders' AND column_name = 'visibility'
  ) THEN
    -- visibility: 'public' | 'private' | 'groups' | 'users'
    ALTER TABLE public.file_folders ADD COLUMN visibility VARCHAR(20) DEFAULT 'public';
  END IF;
END $$;

-- Add description column to file_folders
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'file_folders' AND column_name = 'description'
  ) THEN
    ALTER TABLE public.file_folders ADD COLUMN description TEXT;
  END IF;
END $$;

-- Create folder_permissions table for granular access control
CREATE TABLE IF NOT EXISTS public.folder_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID NOT NULL REFERENCES public.file_folders(id) ON DELETE CASCADE,

    -- Permission target (either group_id or user_id)
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Permission type
    permission_type VARCHAR(20) NOT NULL DEFAULT 'view',  -- 'view', 'edit', 'admin', 'deny'

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL,

    -- Only one of group_id or user_id should be set
    CONSTRAINT folder_perm_target CHECK (
        (group_id IS NOT NULL AND user_id IS NULL) OR
        (group_id IS NULL AND user_id IS NOT NULL)
    ),

    -- Unique constraint for group permissions
    UNIQUE(folder_id, group_id),
    -- Unique constraint for user permissions
    UNIQUE(folder_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_folder_permissions_folder ON public.folder_permissions(folder_id);
CREATE INDEX IF NOT EXISTS idx_folder_permissions_group ON public.folder_permissions(group_id);
CREATE INDEX IF NOT EXISTS idx_folder_permissions_user ON public.folder_permissions(user_id);

-- RLS for folder_permissions
ALTER TABLE public.folder_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view folder permissions for folders they have access to
DROP POLICY IF EXISTS "folder_permissions_select" ON public.folder_permissions;
CREATE POLICY "folder_permissions_select" ON public.folder_permissions FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Folder owners can manage permissions
DROP POLICY IF EXISTS "folder_permissions_insert" ON public.folder_permissions;
CREATE POLICY "folder_permissions_insert" ON public.folder_permissions FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.file_folders
            WHERE id = folder_id AND owner_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "folder_permissions_delete" ON public.folder_permissions;
CREATE POLICY "folder_permissions_delete" ON public.folder_permissions FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.file_folders
            WHERE id = folder_id AND owner_id = auth.uid()
        )
    );

-- Create groups table if not exists (for tenant groups)
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT '#64748b',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- Group members table
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',  -- 'member', 'admin'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- Indexes for groups
CREATE INDEX IF NOT EXISTS idx_groups_tenant ON public.groups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user ON public.group_members(user_id);

-- RLS for groups
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "groups_select" ON public.groups;
CREATE POLICY "groups_select" ON public.groups FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "group_members_select" ON public.group_members;
CREATE POLICY "group_members_select" ON public.group_members FOR SELECT
    TO authenticated
    USING (true);

-- ================================================================
-- END OF MIGRATION
-- ================================================================
