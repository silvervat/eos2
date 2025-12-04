'use client'

import { useEffect, useCallback, useRef } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface FileChangePayload {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE'
  new?: Record<string, unknown>
  old?: Record<string, unknown>
}

interface UseFileSyncOptions {
  vaultId: string
  folderId?: string | null
  onFileInsert?: (file: Record<string, unknown>) => void
  onFileUpdate?: (file: Record<string, unknown>) => void
  onFileDelete?: (fileId: string) => void
  onFolderInsert?: (folder: Record<string, unknown>) => void
  onFolderUpdate?: (folder: Record<string, unknown>) => void
  onFolderDelete?: (folderId: string) => void
  enabled?: boolean
}

/**
 * Real-time file sync hook using Supabase Realtime
 * Subscribes to changes in files and folders tables
 */
export function useFileSync({
  vaultId,
  folderId,
  onFileInsert,
  onFileUpdate,
  onFileDelete,
  onFolderInsert,
  onFolderUpdate,
  onFolderDelete,
  enabled = true,
}: UseFileSyncOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const handleFileChange = useCallback(
    (payload: FileChangePayload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload

      // Filter by vault and folder
      if (newRecord && newRecord.vault_id !== vaultId) return
      if (oldRecord && oldRecord.vault_id !== vaultId) return

      // Check folder match (null means root folder)
      const recordFolderId = newRecord?.folder_id || oldRecord?.folder_id
      if (folderId === null) {
        // Root folder - only show files without folder_id
        if (recordFolderId !== null) return
      } else if (folderId) {
        // Specific folder - only show files in that folder
        if (recordFolderId !== folderId) return
      }

      switch (eventType) {
        case 'INSERT':
          if (newRecord && onFileInsert) {
            onFileInsert(newRecord)
          }
          break
        case 'UPDATE':
          if (newRecord && onFileUpdate) {
            onFileUpdate(newRecord)
          }
          break
        case 'DELETE':
          if (oldRecord?.id && onFileDelete) {
            onFileDelete(oldRecord.id as string)
          }
          break
      }
    },
    [vaultId, folderId, onFileInsert, onFileUpdate, onFileDelete]
  )

  const handleFolderChange = useCallback(
    (payload: FileChangePayload) => {
      const { eventType, new: newRecord, old: oldRecord } = payload

      // Filter by vault
      if (newRecord && newRecord.vault_id !== vaultId) return
      if (oldRecord && oldRecord.vault_id !== vaultId) return

      // Check parent folder match
      const parentId = newRecord?.parent_id || oldRecord?.parent_id
      if (folderId === null) {
        if (parentId !== null) return
      } else if (folderId) {
        if (parentId !== folderId) return
      }

      switch (eventType) {
        case 'INSERT':
          if (newRecord && onFolderInsert) {
            onFolderInsert(newRecord)
          }
          break
        case 'UPDATE':
          if (newRecord && onFolderUpdate) {
            onFolderUpdate(newRecord)
          }
          break
        case 'DELETE':
          if (oldRecord?.id && onFolderDelete) {
            onFolderDelete(oldRecord.id as string)
          }
          break
      }
    },
    [vaultId, folderId, onFolderInsert, onFolderUpdate, onFolderDelete]
  )

  useEffect(() => {
    if (!enabled || !vaultId) return

    // Create channel for this vault
    const channel = supabase
      .channel(`file-vault:${vaultId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'files',
          filter: `vault_id=eq.${vaultId}`,
        },
        (payload) => handleFileChange(payload as unknown as FileChangePayload)
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'file_folders',
          filter: `vault_id=eq.${vaultId}`,
        },
        (payload) => handleFolderChange(payload as unknown as FileChangePayload)
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current)
        channelRef.current = null
      }
    }
  }, [enabled, vaultId, supabase, handleFileChange, handleFolderChange])

  return {
    channel: channelRef.current,
  }
}
