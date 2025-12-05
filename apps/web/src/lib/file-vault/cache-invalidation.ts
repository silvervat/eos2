/**
 * File Vault Cache Invalidation
 *
 * Utilities for invalidating cache when files/folders change
 */

import { cacheInvalidate, cacheDelete } from '@/lib/cache'

/**
 * Invalidate cache for a specific file
 */
export async function invalidateFileCache(
  vaultId: string,
  folderId: string | null
): Promise<void> {
  const patterns = [
    `files:${vaultId}:${folderId || 'root'}:*`,
    `files:${vaultId}:*`, // Also invalidate parent lists
    `stats:vault:${vaultId}`,
  ]

  if (folderId) {
    patterns.push(`stats:folder:${folderId}`)
  }

  await Promise.all(patterns.map(pattern => cacheInvalidate(pattern)))
}

/**
 * Invalidate cache for entire vault
 */
export async function invalidateVaultCache(vaultId: string): Promise<void> {
  await cacheInvalidate(`*:${vaultId}:*`)
  await cacheInvalidate(`stats:vault:${vaultId}`)
}

/**
 * Invalidate folder-specific cache
 */
export async function invalidateFolderCache(
  vaultId: string,
  folderId: string
): Promise<void> {
  await cacheInvalidate(`files:${vaultId}:${folderId}:*`)
  await cacheInvalidate(`folders:${vaultId}:${folderId}:*`)
  await cacheDelete(`stats:folder:${folderId}`)
}

/**
 * Hook: Call when file is created
 */
export async function onFileCreated(file: {
  vault_id: string
  folder_id: string | null
}): Promise<void> {
  await invalidateFileCache(file.vault_id, file.folder_id)
}

/**
 * Hook: Call when file is updated
 */
export async function onFileUpdated(file: {
  id: string
  vault_id: string
  folder_id: string | null
}): Promise<void> {
  await cacheDelete(`file:${file.id}`)
  await invalidateFileCache(file.vault_id, file.folder_id)
}

/**
 * Hook: Call when file is deleted
 */
export async function onFileDeleted(file: {
  id: string
  vault_id: string
  folder_id: string | null
}): Promise<void> {
  await cacheDelete(`file:${file.id}`)
  await invalidateFileCache(file.vault_id, file.folder_id)
}

/**
 * Hook: Call when file is moved
 */
export async function onFileMoved(
  file: { id: string; vault_id: string },
  oldFolderId: string | null,
  newFolderId: string | null
): Promise<void> {
  await cacheDelete(`file:${file.id}`)
  await invalidateFileCache(file.vault_id, oldFolderId)
  await invalidateFileCache(file.vault_id, newFolderId)
}

/**
 * Hook: Call when folder is created
 */
export async function onFolderCreated(folder: {
  vault_id: string
  parent_id: string | null
}): Promise<void> {
  await cacheInvalidate(`folders:${folder.vault_id}:*`)
  if (folder.parent_id) {
    await cacheDelete(`stats:folder:${folder.parent_id}`)
  }
}

/**
 * Hook: Call when folder is deleted
 */
export async function onFolderDeleted(folder: {
  id: string
  vault_id: string
  parent_id: string | null
}): Promise<void> {
  await cacheDelete(`folder:${folder.id}`)
  await cacheInvalidate(`folders:${folder.vault_id}:*`)
  await cacheInvalidate(`files:${folder.vault_id}:${folder.id}:*`)
  if (folder.parent_id) {
    await cacheDelete(`stats:folder:${folder.parent_id}`)
  }
}

/**
 * Hook: Call when multiple files are modified (batch operations)
 */
export async function onBatchOperation(
  vaultId: string,
  affectedFolderIds: (string | null)[]
): Promise<void> {
  // Invalidate all affected folders
  const uniqueFolders = [...new Set(affectedFolderIds)]

  await Promise.all([
    cacheInvalidate(`stats:vault:${vaultId}`),
    ...uniqueFolders.map(folderId =>
      invalidateFileCache(vaultId, folderId)
    ),
  ])
}

/**
 * Generate cache key for file list
 */
export function getFileListCacheKey(params: {
  vaultId: string
  folderId?: string | null
  search?: string | null
  mimeType?: string | null
  extension?: string | null
  minSize?: number | null
  maxSize?: number | null
  dateFrom?: string | null
  dateTo?: string | null
  sortBy?: string
  sortOrder?: string
  limit?: number
  offset?: number
}): string {
  const parts = [
    'files',
    params.vaultId,
    params.folderId || 'root',
    params.search || '',
    params.mimeType || '',
    params.extension || '',
    params.minSize || '',
    params.maxSize || '',
    params.dateFrom || '',
    params.dateTo || '',
    params.sortBy || 'created_at',
    params.sortOrder || 'desc',
    params.limit || 100,
    params.offset || 0,
  ]

  return parts.join(':')
}

/**
 * Generate cache key for folder list
 */
export function getFolderListCacheKey(
  vaultId: string,
  parentId: string | null
): string {
  return `folders:${vaultId}:${parentId || 'root'}`
}

/**
 * Generate cache key for vault stats
 */
export function getVaultStatsCacheKey(vaultId: string): string {
  return `stats:vault:${vaultId}`
}

/**
 * Generate cache key for folder stats
 */
export function getFolderStatsCacheKey(folderId: string): string {
  return `stats:folder:${folderId}`
}
