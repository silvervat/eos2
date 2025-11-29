# FILE VAULT - RLS POLICIES

**Row Level Security poliitikad File Vault süsteemile**

Loodud: 29. November 2025

---

## ÜLEVAADE

Kõik File Vault tabelid kasutavad Row Level Security (RLS) poliitikaid vastavalt PIIBEL standarditele.

---

## 1. FILE VAULTS

```sql
-- Enable RLS
ALTER TABLE file_vaults ENABLE ROW LEVEL SECURITY;

-- Users can view their tenant's vaults
CREATE POLICY "file_vaults_select_tenant"
ON file_vaults FOR SELECT
USING (
  tenant_id = (
    SELECT tenant_id FROM user_profiles
    WHERE auth_user_id = auth.uid()
  )
  AND deleted_at IS NULL
);

-- Users can insert into their tenant
CREATE POLICY "file_vaults_insert_tenant"
ON file_vaults FOR INSERT
WITH CHECK (
  tenant_id = (
    SELECT tenant_id FROM user_profiles
    WHERE auth_user_id = auth.uid()
  )
);

-- Users can update their tenant's vaults
CREATE POLICY "file_vaults_update_tenant"
ON file_vaults FOR UPDATE
USING (
  tenant_id = (
    SELECT tenant_id FROM user_profiles
    WHERE auth_user_id = auth.uid()
  )
  AND deleted_at IS NULL
)
WITH CHECK (
  tenant_id = (
    SELECT tenant_id FROM user_profiles
    WHERE auth_user_id = auth.uid()
  )
);

-- Only admins can delete (soft delete)
CREATE POLICY "file_vaults_delete_admin"
ON file_vaults FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE auth_user_id = auth.uid()
    AND tenant_id = file_vaults.tenant_id
    AND role = 'admin'
  )
);

-- Service role has full access
CREATE POLICY "file_vaults_service_role"
ON file_vaults FOR ALL TO service_role
USING (true) WITH CHECK (true);
```

---

## 2. FILES

```sql
-- Enable RLS
ALTER TABLE files ENABLE ROW LEVEL SECURITY;

-- Users can view files they have access to
CREATE POLICY "files_select_access"
ON files FOR SELECT
USING (
  deleted_at IS NULL
  AND (
    -- Owner can always see
    owner_id = auth.uid()

    -- Or file is in user's tenant
    OR EXISTS (
      SELECT 1 FROM file_vaults v
      WHERE v.id = files.vault_id
      AND v.tenant_id = (
        SELECT tenant_id FROM user_profiles
        WHERE auth_user_id = auth.uid()
      )
    )

    -- Or user has permission
    OR EXISTS (
      SELECT 1 FROM file_permissions p
      WHERE p.file_id = files.id
      AND p.user_id = auth.uid()
      AND (p.expires_at IS NULL OR p.expires_at > now())
    )

    -- Or user's team has permission
    OR EXISTS (
      SELECT 1 FROM file_permissions p
      INNER JOIN file_team_members tm ON tm.team_id = p.team_id
      WHERE p.file_id = files.id
      AND tm.user_id = auth.uid()
      AND (p.expires_at IS NULL OR p.expires_at > now())
    )

    -- Or file is public
    OR is_public = true
  )
);

-- Users can insert files into their tenant's vaults
CREATE POLICY "files_insert_tenant"
ON files FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM file_vaults v
    WHERE v.id = files.vault_id
    AND v.tenant_id = (
      SELECT tenant_id FROM user_profiles
      WHERE auth_user_id = auth.uid()
    )
  )
);

-- Owner or admin can update
CREATE POLICY "files_update_owner"
ON files FOR UPDATE
USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE auth_user_id = auth.uid()
    AND role = 'admin'
  )
)
WITH CHECK (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE auth_user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Service role has full access
CREATE POLICY "files_service_role"
ON files FOR ALL TO service_role
USING (true) WITH CHECK (true);
```

---

## 3. FILE FOLDERS

```sql
-- Enable RLS
ALTER TABLE file_folders ENABLE ROW LEVEL SECURITY;

-- Users can view folders in their tenant
CREATE POLICY "file_folders_select_tenant"
ON file_folders FOR SELECT
USING (
  deleted_at IS NULL
  AND EXISTS (
    SELECT 1 FROM file_vaults v
    WHERE v.id = file_folders.vault_id
    AND v.tenant_id = (
      SELECT tenant_id FROM user_profiles
      WHERE auth_user_id = auth.uid()
    )
  )
);

-- Insert policy
CREATE POLICY "file_folders_insert_tenant"
ON file_folders FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM file_vaults v
    WHERE v.id = file_folders.vault_id
    AND v.tenant_id = (
      SELECT tenant_id FROM user_profiles
      WHERE auth_user_id = auth.uid()
    )
  )
);

-- Update policy
CREATE POLICY "file_folders_update_owner"
ON file_folders FOR UPDATE
USING (
  owner_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE auth_user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Service role
CREATE POLICY "file_folders_service_role"
ON file_folders FOR ALL TO service_role
USING (true) WITH CHECK (true);
```

---

## 4. FILE SHARES

```sql
-- Enable RLS
ALTER TABLE file_shares ENABLE ROW LEVEL SECURITY;

-- Users can view their tenant's shares
CREATE POLICY "file_shares_select_tenant"
ON file_shares FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM file_vaults v
    WHERE v.id = file_shares.vault_id
    AND v.tenant_id = (
      SELECT tenant_id FROM user_profiles
      WHERE auth_user_id = auth.uid()
    )
  )
);

-- Users can create shares
CREATE POLICY "file_shares_insert_tenant"
ON file_shares FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM file_vaults v
    WHERE v.id = file_shares.vault_id
    AND v.tenant_id = (
      SELECT tenant_id FROM user_profiles
      WHERE auth_user_id = auth.uid()
    )
  )
);

-- Creator or admin can update/delete
CREATE POLICY "file_shares_update_creator"
ON file_shares FOR UPDATE
USING (
  created_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE auth_user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Service role
CREATE POLICY "file_shares_service_role"
ON file_shares FOR ALL TO service_role
USING (true) WITH CHECK (true);
```

---

## 5. FILE PERMISSIONS (Internal Sharing)

```sql
-- Enable RLS
ALTER TABLE file_permissions ENABLE ROW LEVEL SECURITY;

-- Users can view permissions for files they have access to
CREATE POLICY "file_permissions_select"
ON file_permissions FOR SELECT
USING (
  -- Can see own permissions
  user_id = auth.uid()

  -- Or can see team permissions
  OR EXISTS (
    SELECT 1 FROM file_team_members tm
    WHERE tm.team_id = file_permissions.team_id
    AND tm.user_id = auth.uid()
  )

  -- Or is admin
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE auth_user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Only file owner or admin can manage permissions
CREATE POLICY "file_permissions_insert"
ON file_permissions FOR INSERT
WITH CHECK (
  -- Owner of the file
  EXISTS (
    SELECT 1 FROM files f
    WHERE f.id = file_permissions.file_id
    AND f.owner_id = auth.uid()
  )
  -- Or admin
  OR EXISTS (
    SELECT 1 FROM user_profiles
    WHERE auth_user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Service role
CREATE POLICY "file_permissions_service_role"
ON file_permissions FOR ALL TO service_role
USING (true) WITH CHECK (true);
```

---

## 6. FILE TEAMS

```sql
-- Enable RLS
ALTER TABLE file_teams ENABLE ROW LEVEL SECURITY;

-- Users can view their tenant's teams
CREATE POLICY "file_teams_select_tenant"
ON file_teams FOR SELECT
USING (
  tenant_id = (
    SELECT tenant_id FROM user_profiles
    WHERE auth_user_id = auth.uid()
  )
  AND deleted_at IS NULL
);

-- Only admin can create teams
CREATE POLICY "file_teams_insert_admin"
ON file_teams FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE auth_user_id = auth.uid()
    AND role IN ('admin', 'manager')
  )
);

-- Service role
CREATE POLICY "file_teams_service_role"
ON file_teams FOR ALL TO service_role
USING (true) WITH CHECK (true);
```

---

## SOFT DELETE PATTERN

Kõik File Vault tabelid kasutavad soft delete mustrit:

```typescript
// Never hard delete - always soft delete
async function deleteFile(fileId: string, userId: string) {
  return prisma.file.update({
    where: { id: fileId },
    data: {
      deletedAt: new Date(),
      deletedBy: userId
    }
  })
}

// Restore soft deleted file
async function restoreFile(fileId: string) {
  return prisma.file.update({
    where: { id: fileId },
    data: {
      deletedAt: null,
      deletedBy: null
    }
  })
}

// Query only non-deleted files
async function getFiles(vaultId: string) {
  return prisma.file.findMany({
    where: {
      vaultId,
      deletedAt: null  // IMPORTANT!
    }
  })
}
```

---

## APPLYING POLICIES

```bash
# Apply all RLS policies
psql $DATABASE_URL -f manual/FILE-VAULT-RLS-POLICIES.sql

# Verify policies
psql $DATABASE_URL -c "SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';"
```
