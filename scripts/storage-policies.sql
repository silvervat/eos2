-- ============================================================================
-- SUPABASE STORAGE RLS POLICIES - FILE VAULT
-- ============================================================================
-- Description: Row Level Security policies for Supabase Storage bucket
-- Bucket: file-vault
-- Date: 2025-11-30
-- ============================================================================

-- IMPORTANT: These policies must be added in Supabase Dashboard > Storage > file-vault > Policies
-- OR via SQL Editor if you have access to storage schema

-- ============================================================================
-- POLICY 1: UPLOAD FILES
-- ============================================================================
-- Users can upload files to their vault's folder
-- Storage path structure: {vault_id}/{file_id}/filename.ext

CREATE POLICY "Users can upload to their vault" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'file-vault' 
  AND
  -- Extract vault_id from path (first folder)
  (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM file_vaults 
    WHERE tenant_id = (
      SELECT tenant_id 
      FROM user_profiles 
      WHERE auth_user_id = auth.uid()
    )
    AND deleted_at IS NULL
  )
);

-- ============================================================================
-- POLICY 2: DOWNLOAD/READ FILES
-- ============================================================================
-- Users can read files from their vaults

CREATE POLICY "Users can read their files" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'file-vault'
  AND
  (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM file_vaults 
    WHERE tenant_id = (
      SELECT tenant_id 
      FROM user_profiles 
      WHERE auth_user_id = auth.uid()
    )
    AND deleted_at IS NULL
  )
);

-- ============================================================================
-- POLICY 3: UPDATE FILES
-- ============================================================================
-- Users can update files in their vaults (replace file)

CREATE POLICY "Users can update their files" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'file-vault'
  AND
  (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM file_vaults 
    WHERE tenant_id = (
      SELECT tenant_id 
      FROM user_profiles 
      WHERE auth_user_id = auth.uid()
    )
    AND deleted_at IS NULL
  )
);

-- ============================================================================
-- POLICY 4: DELETE FILES
-- ============================================================================
-- Users can delete files from their vaults

CREATE POLICY "Users can delete their files" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'file-vault'
  AND
  (storage.foldername(name))[1] IN (
    SELECT id::text 
    FROM file_vaults 
    WHERE tenant_id = (
      SELECT tenant_id 
      FROM user_profiles 
      WHERE auth_user_id = auth.uid()
    )
    AND deleted_at IS NULL
  )
);

-- ============================================================================
-- POLICY 5: PUBLIC ACCESS VIA SHARE LINKS (Optional - for future)
-- ============================================================================
-- Anonymous users can download files if they have a valid share link
-- This requires additional logic in your API to verify the share token

-- NOTE: This is commented out because we use signed URLs instead
-- Uncomment if you want to allow direct public access via share links

/*
CREATE POLICY "Public can access shared files" ON storage.objects
FOR SELECT TO anon
USING (
  bucket_id = 'file-vault'
  AND
  -- Check if there's an active share for this file
  EXISTS (
    SELECT 1 
    FROM file_shares fs
    INNER JOIN files f ON f.id = fs.file_id
    WHERE 
      -- Extract vault_id from path
      (storage.foldername(storage.objects.name))[1] = fs.vault_id::text
      -- Share is active
      AND (fs.expires_at IS NULL OR fs.expires_at > NOW())
      -- Download limit not reached
      AND (fs.download_limit IS NULL OR fs.downloads_count < fs.download_limit)
  )
);
*/

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to extract vault_id from storage path
CREATE OR REPLACE FUNCTION storage.get_vault_id_from_path(path text)
RETURNS uuid AS $$
BEGIN
  RETURN (storage.foldername(path))[1]::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has access to vault
CREATE OR REPLACE FUNCTION storage.user_has_vault_access(vault_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM file_vaults fv
    INNER JOIN user_profiles up ON up.tenant_id = fv.tenant_id
    WHERE 
      fv.id = $1
      AND up.auth_user_id = auth.uid()
      AND fv.deleted_at IS NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- USAGE EXAMPLES
-- ============================================================================

-- Upload a file (via JavaScript SDK):
/*
const { data, error } = await supabase.storage
  .from('file-vault')
  .upload(`${vaultId}/${fileId}/document.pdf`, file)
*/

-- Download a file (via JavaScript SDK):
/*
const { data, error } = await supabase.storage
  .from('file-vault')
  .download(`${vaultId}/${fileId}/document.pdf`)
*/

-- Get signed URL (recommended for downloads):
/*
const { data } = supabase.storage
  .from('file-vault')
  .createSignedUrl(`${vaultId}/${fileId}/document.pdf`, 3600) // 1 hour
*/

-- Delete a file:
/*
const { data, error } = await supabase.storage
  .from('file-vault')
  .remove([`${vaultId}/${fileId}/document.pdf`])
*/

-- ============================================================================
-- TROUBLESHOOTING
-- ============================================================================

-- Check if policies are applied:
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Test upload permission:
-- 1. Get your user's tenant_id
SELECT tenant_id FROM user_profiles WHERE auth_user_id = auth.uid();

-- 2. Get your vault_id
SELECT id FROM file_vaults WHERE tenant_id = '<tenant_id>';

-- 3. Try to upload via Supabase client
-- If it fails, check:
-- a) User is authenticated
-- b) User has a profile with tenant_id
-- c) Vault exists for that tenant
-- d) Path format is correct: {vault_id}/{file_id}/filename.ext

-- Check storage bucket settings:
SELECT * FROM storage.buckets WHERE name = 'file-vault';

-- Should show:
-- public: false
-- file_size_limit: 52428800000 (50GB in bytes)
-- allowed_mime_types: null (allows all)

-- ============================================================================
-- SECURITY NOTES
-- ============================================================================

-- 1. NEVER make the bucket public!
--    Always use: public = false

-- 2. Use signed URLs for downloads:
--    This gives you temporary, expiring access URLs

-- 3. File paths should always include vault_id first:
--    ✅ {vault_id}/{file_id}/filename.ext
--    ❌ {file_id}/filename.ext (no vault isolation!)

-- 4. For share links, use signed URLs, not public access:
--    const { data } = supabase.storage
--      .from('file-vault')
--      .createSignedUrl(path, expiresInSeconds)

-- 5. Consider file size limits per tenant:
--    Add logic in your API to check vault.used_bytes vs vault.quota_bytes

-- 6. Implement virus scanning for uploads:
--    Use Supabase Edge Functions or external service

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Next steps:
-- 1. Verify policies work by testing upload
-- 2. Test download with signed URLs
-- 3. Implement thumbnail generation
-- 4. Add file cleanup (delete orphaned files)
-- 5. Monitor storage usage per tenant

-- Policies applied: 4
-- Helper functions: 2
-- Security level: HIGH ✅
