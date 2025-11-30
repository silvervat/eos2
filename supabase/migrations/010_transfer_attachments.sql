-- =============================================
-- TRANSFER ATTACHMENTS
-- =============================================
-- Version: 1.0.0
-- Date: 2025-11-30
-- Description: Add photo and file attachments to transfers
-- for documenting transferred items visually
-- =============================================

-- Create transfer_attachments table
CREATE TABLE IF NOT EXISTS transfer_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  transfer_id UUID NOT NULL REFERENCES asset_transfers(id) ON DELETE CASCADE,

  -- File information
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL, -- mime type
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL, -- path in storage bucket

  -- Photo specific
  is_photo BOOLEAN DEFAULT false,
  caption TEXT,

  -- Metadata
  uploaded_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Index for fast lookups
  CONSTRAINT fk_tenant FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transfer_attachments_transfer
  ON transfer_attachments(transfer_id);
CREATE INDEX IF NOT EXISTS idx_transfer_attachments_tenant
  ON transfer_attachments(tenant_id);

-- RLS Policies
ALTER TABLE transfer_attachments ENABLE ROW LEVEL SECURITY;

-- View policy - users can see attachments for transfers in their tenant
CREATE POLICY "Users can view transfer attachments in their tenant"
  ON transfer_attachments FOR SELECT
  USING (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles
      WHERE auth_user_id = auth.uid()
    )
  );

-- Insert policy - users can add attachments to transfers in their tenant
CREATE POLICY "Users can add transfer attachments in their tenant"
  ON transfer_attachments FOR INSERT
  WITH CHECK (
    tenant_id IN (
      SELECT tenant_id FROM user_profiles
      WHERE auth_user_id = auth.uid()
    )
  );

-- Delete policy - users can delete their own attachments
CREATE POLICY "Users can delete their own attachments"
  ON transfer_attachments FOR DELETE
  USING (
    uploaded_by IN (
      SELECT id FROM user_profiles
      WHERE auth_user_id = auth.uid()
    )
  );

-- Grant access
GRANT ALL ON transfer_attachments TO authenticated;

-- Comments
COMMENT ON TABLE transfer_attachments IS 'Photos and files attached to asset transfers';
COMMENT ON COLUMN transfer_attachments.storage_path IS 'Path to file in Supabase storage bucket';
COMMENT ON COLUMN transfer_attachments.is_photo IS 'True if attachment is a photo taken during transfer';

-- =============================================
-- Add attachments count to transfers view
-- =============================================

-- Add column to track if transfer has attachments (for quick filtering)
ALTER TABLE asset_transfers
  ADD COLUMN IF NOT EXISTS has_attachments BOOLEAN DEFAULT false;

COMMENT ON COLUMN asset_transfers.has_attachments IS 'Quick flag to indicate if transfer has attachments';

-- Function to update has_attachments flag
CREATE OR REPLACE FUNCTION update_transfer_has_attachments()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE asset_transfers
    SET has_attachments = true
    WHERE id = NEW.transfer_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE asset_transfers
    SET has_attachments = EXISTS(
      SELECT 1 FROM transfer_attachments
      WHERE transfer_id = OLD.transfer_id
    )
    WHERE id = OLD.transfer_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update has_attachments
DROP TRIGGER IF EXISTS trigger_update_transfer_attachments ON transfer_attachments;
CREATE TRIGGER trigger_update_transfer_attachments
  AFTER INSERT OR DELETE ON transfer_attachments
  FOR EACH ROW
  EXECUTE FUNCTION update_transfer_has_attachments();

-- =============================================
-- END OF MIGRATION
-- =============================================
