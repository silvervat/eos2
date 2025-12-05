-- ============================================
-- ENSURE ALL PROJECTS COLUMNS EXIST
-- ============================================
-- Version: 1.0.0
-- Date: 2024-12-05
-- Description: Safely add all required columns to projects table
-- This migration is idempotent and can be run multiple times
-- ============================================

-- Core columns that must exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS client_id UUID;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'starting';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'EUR';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS end_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS country TEXT DEFAULT 'Estonia';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS manager_id UUID;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- Enhanced columns for new features
ALTER TABLE projects ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'ptv';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contact_id UUID;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Timestamps
ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE projects ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Set NOT NULL on essential columns if they don't have it
-- (Using a DO block to handle errors gracefully)
DO $$
BEGIN
  -- Try to set code as NOT NULL if there are no NULL values
  IF NOT EXISTS (SELECT 1 FROM projects WHERE code IS NULL) THEN
    BEGIN
      ALTER TABLE projects ALTER COLUMN code SET NOT NULL;
    EXCEPTION WHEN OTHERS THEN
      -- Column might already be NOT NULL, ignore error
    END;
  END IF;

  -- Try to set name as NOT NULL if there are no NULL values
  IF NOT EXISTS (SELECT 1 FROM projects WHERE name IS NULL) THEN
    BEGIN
      ALTER TABLE projects ALTER COLUMN name SET NOT NULL;
    EXCEPTION WHEN OTHERS THEN
      -- Column might already be NOT NULL, ignore error
    END;
  END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_projects_tenant ON projects(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_client ON projects(client_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_contact ON projects(contact_id) WHERE deleted_at IS NULL;

-- Ensure foreign key constraints exist (use DO block to handle errors)
DO $$
BEGIN
  -- Add foreign key for client_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'projects_client_id_fkey'
    AND table_name = 'projects'
  ) THEN
    BEGIN
      ALTER TABLE projects
        ADD CONSTRAINT projects_client_id_fkey
        FOREIGN KEY (client_id) REFERENCES companies(id);
    EXCEPTION WHEN OTHERS THEN
      -- Constraint might already exist or reference table doesn't exist
    END;
  END IF;

  -- Add foreign key for contact_id if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'projects_contact_id_fkey'
    AND table_name = 'projects'
  ) THEN
    BEGIN
      ALTER TABLE projects
        ADD CONSTRAINT projects_contact_id_fkey
        FOREIGN KEY (contact_id) REFERENCES company_contacts(id);
    EXCEPTION WHEN OTHERS THEN
      -- Constraint might already exist or reference table doesn't exist
    END;
  END IF;
END $$;

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
