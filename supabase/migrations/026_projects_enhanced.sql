-- ============================================
-- PROJECTS ENHANCED - Type, Status, GPS
-- ============================================
-- Version: 1.0.0
-- Date: 2024-12-05
-- Description: Add project type, GPS coordinates, company/contact links
-- ============================================

-- Add type column for project categorization
ALTER TABLE projects ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'ptv';

-- Add GPS coordinates for map
ALTER TABLE projects ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8);

-- Add contact_id for company contact
ALTER TABLE projects ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES company_contacts(id);

-- Add thumbnail/cover image URL
ALTER TABLE projects ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Update status values (map old to new)
-- Old: draft, active, on_hold, completed, cancelled
-- New: starting, waiting, working, warranty, completed

-- Create enum-like constraint for type
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_type_check;
ALTER TABLE projects ADD CONSTRAINT projects_type_check
  CHECK (type IN ('ptv', 'montaaz', 'muuk', 'vahendus', 'rent'));

-- Create enum-like constraint for status
ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check
  CHECK (status IN ('starting', 'waiting', 'working', 'warranty', 'completed'));

-- Update existing records to new status values
UPDATE projects SET status = 'starting' WHERE status = 'draft';
UPDATE projects SET status = 'waiting' WHERE status = 'on_hold';
UPDATE projects SET status = 'working' WHERE status = 'active';
UPDATE projects SET status = 'completed' WHERE status IN ('completed', 'cancelled', 'archived');

-- Create indexes for better filtering
CREATE INDEX IF NOT EXISTS idx_projects_type ON projects(type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_projects_contact ON projects(contact_id) WHERE deleted_at IS NULL;

-- Add comments
COMMENT ON COLUMN projects.type IS 'Project type: ptv, montaaz, muuk, vahendus, rent';
COMMENT ON COLUMN projects.latitude IS 'GPS latitude for map display';
COMMENT ON COLUMN projects.longitude IS 'GPS longitude for map display';
COMMENT ON COLUMN projects.contact_id IS 'Primary contact person from company';
COMMENT ON COLUMN projects.thumbnail_url IS 'Project cover/thumbnail image URL';
