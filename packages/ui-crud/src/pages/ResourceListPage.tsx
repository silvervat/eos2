'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Download, Upload, Trash2, RefreshCw } from 'lucide-react'
import { clsx } from 'clsx'
import { getResource, type ResourceDefinition } from '@eos2/resources'
import { useDeleteMany, type Filter } from '@eos2/data-provider'
import { ResourceTable } from '../components/ResourceTable'

// ============ TYPES ============

export interface ResourceListPageProps {
  /** Resource name or definition */
  resource: string | ResourceDefinition
  /** Page title (defaults to resource.labelPlural) */
  title?: string
  /** Page description/subtitle */
  description?: string
  /** Show create button */
  showCreateButton?: boolean
  /** Show export button */
  showExportButton?: boolean
  /** Show import button */
  showImportButton?: boolean
  /** Show refresh button */
  showRefreshButton?: boolean
  /** Allow bulk selection and actions */
  allowBulkActions?: boolean
  /** Custom create handler (instead of navigation) */
  onCreateClick?: () => void
  /** Custom row click handler (instead of navigation) */
  onRowClick?: (record: Record<string, unknown>) => void
  /** Custom export handler */
  onExport?: (ids: string[]) => void
  /** Custom import handler */
  onImport?: () => void
  /** Default filters to apply */
  defaultFilters?: Filter[]
  /** Columns to hide */
  hideColumns?: string[]
  /** Custom toolbar content */
  toolbarContent?: React.ReactNode
  /** Additional metadata for queries */
  meta?: Record<string, unknown>
}

// ============ COMPONENT ============

export function ResourceListPage({
  resource,
  title,
  description,
  showCreateButton = true,
  showExportButton = false,
  showImportButton = false,
  showRefreshButton = true,
  allowBulkActions = false,
  onCreateClick,
  onRowClick,
  onExport,
  onImport,
  defaultFilters,
  hideColumns,
  toolbarContent,
  meta,
}: ResourceListPageProps) {
  const router = useRouter()

  // Get resource definition
  const resourceDef = typeof resource === 'string' ? getResource(resource) : resource
  const capabilities = resourceDef.capabilities || {}

  // Selection state for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [refreshKey, setRefreshKey] = useState(0)

  // Bulk delete mutation
  const { mutate: deleteMany, isPending: isDeleting } = useDeleteMany(resourceDef.name)

  // Navigation handlers
  const handleRowClick = useCallback((record: Record<string, unknown>) => {
    if (onRowClick) {
      onRowClick(record)
    } else if (capabilities.show !== false) {
      router.push(`${resourceDef.basePath}/${record.id}`)
    }
  }, [onRowClick, capabilities.show, router, resourceDef.basePath])

  const handleCreateClick = useCallback(() => {
    if (onCreateClick) {
      onCreateClick()
    } else {
      router.push(`${resourceDef.basePath}/new`)
    }
  }, [onCreateClick, router, resourceDef.basePath])

  // Bulk actions
  const handleBulkDelete = useCallback(() => {
    if (selectedIds.length === 0) return

    const confirmed = window.confirm(
      `Kas olete kindel, et soovite kustutada ${selectedIds.length} kirjet?`
    )

    if (confirmed) {
      deleteMany(selectedIds, {
        onSuccess: () => {
          setSelectedIds([])
          setRefreshKey((k) => k + 1)
        },
      })
    }
  }, [selectedIds, deleteMany])

  const handleRefresh = useCallback(() => {
    setRefreshKey((k) => k + 1)
  }, [])

  // Determine which buttons to show based on capabilities
  const canCreate = showCreateButton && capabilities.create !== false
  const canExport = showExportButton && capabilities.export !== false
  const canImport = showImportButton && capabilities.import !== false
  const canBulkDelete = allowBulkActions && capabilities.bulkDelete !== false

  // Get display title
  const displayTitle = title || resourceDef.labelPlural

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">{displayTitle}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Custom toolbar content */}
          {toolbarContent}

          {/* Refresh button */}
          {showRefreshButton && (
            <button
              onClick={handleRefresh}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              title="Värskenda"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          {/* Import button */}
          {canImport && (
            <button
              onClick={onImport}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Upload className="w-4 h-4" />
              <span className="hidden sm:inline">Impordi</span>
            </button>
          )}

          {/* Export button */}
          {canExport && (
            <button
              onClick={() => onExport?.(selectedIds)}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Ekspordi</span>
            </button>
          )}

          {/* Create button */}
          {canCreate && (
            <button
              onClick={handleCreateClick}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Plus className="w-4 h-4" />
              <span>Lisa uus</span>
            </button>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {allowBulkActions && selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
          <span className="text-sm text-blue-700">
            {selectedIds.length} kirjet valitud
          </span>
          <div className="flex items-center gap-2">
            {canBulkDelete && (
              <button
                onClick={handleBulkDelete}
                disabled={isDeleting}
                className={clsx(
                  'inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-lg',
                  isDeleting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-200'
                )}
              >
                <Trash2 className="w-4 h-4" />
                <span>Kustuta valitud</span>
              </button>
            )}
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900"
            >
              Tühista valik
            </button>
          </div>
        </div>
      )}

      {/* Resource Table */}
      <ResourceTable
        key={refreshKey}
        resource={resourceDef.name}
        onRowClick={handleRowClick}
        hideColumns={hideColumns}
        defaultFilters={defaultFilters}
        selectable={allowBulkActions}
        onSelect={setSelectedIds}
        showSearch
        showCreateButton={false} // Handled by page header
        meta={meta}
      />
    </div>
  )
}

export default ResourceListPage
