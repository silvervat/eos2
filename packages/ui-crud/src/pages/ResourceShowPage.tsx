'use client'

import React, { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Edit, Trash2, ArrowLeft } from 'lucide-react'
import { getResource, type ResourceDefinition } from '@eos2/resources'
import { useDelete } from '@eos2/data-provider'
import { ResourceShow } from '../components/ResourceShow'

// ============ TYPES ============

export interface ResourceShowPageProps {
  /** Resource name or definition */
  resource: string | ResourceDefinition
  /** Record ID to display */
  id: string
  /** Page title (defaults to resource.label) */
  title?: string
  /** Show back button */
  showBackButton?: boolean
  /** Show edit button */
  showEditButton?: boolean
  /** Show delete button */
  showDeleteButton?: boolean
  /** Custom back handler */
  onBack?: () => void
  /** Custom edit handler */
  onEdit?: (id: string) => void
  /** Custom delete handler */
  onDelete?: (id: string) => void
  /** Callback after successful delete */
  onDeleteSuccess?: () => void
  /** Columns to hide */
  hideColumns?: string[]
  /** Layout style */
  layout?: 'card' | 'table' | 'grid'
  /** Number of columns for grid layout */
  gridColumns?: 2 | 3 | 4
  /** Custom header content */
  headerContent?: React.ReactNode
  /** Custom footer content */
  footerContent?: React.ReactNode
  /** Additional tabs to display */
  tabs?: TabDefinition[]
  /** Additional metadata for queries */
  meta?: Record<string, unknown>
}

export interface TabDefinition {
  /** Tab identifier */
  key: string
  /** Tab label */
  label: string
  /** Tab content */
  content: React.ReactNode
}

// ============ COMPONENT ============

export function ResourceShowPage({
  resource,
  id,
  title,
  showBackButton = true,
  showEditButton = true,
  showDeleteButton = true,
  onBack,
  onEdit,
  onDelete,
  onDeleteSuccess,
  hideColumns,
  layout = 'table',
  gridColumns = 2,
  headerContent,
  footerContent,
  tabs,
  meta,
}: ResourceShowPageProps) {
  const router = useRouter()

  // Get resource definition
  const resourceDef = typeof resource === 'string' ? getResource(resource) : resource
  const capabilities = resourceDef.capabilities || {}

  // Active tab state
  const [activeTab, setActiveTab] = useState<string | null>(tabs?.[0]?.key || null)

  // Delete mutation
  const { mutate: deleteRecord, isPending: isDeleting } = useDelete(resourceDef.name)

  // Delete confirmation state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  // Navigation handlers
  const handleBack = useCallback(() => {
    if (onBack) {
      onBack()
    } else {
      router.push(resourceDef.basePath)
    }
  }, [onBack, router, resourceDef.basePath])

  const handleEdit = useCallback(() => {
    if (onEdit) {
      onEdit(id)
    } else {
      router.push(`${resourceDef.basePath}/${id}/edit`)
    }
  }, [onEdit, id, router, resourceDef.basePath])

  const handleDelete = useCallback(() => {
    if (onDelete) {
      onDelete(id)
      return
    }

    setShowDeleteConfirm(true)
  }, [onDelete, id])

  const confirmDelete = useCallback(() => {
    deleteRecord(id, {
      onSuccess: () => {
        setShowDeleteConfirm(false)
        if (onDeleteSuccess) {
          onDeleteSuccess()
        } else {
          router.push(resourceDef.basePath)
        }
      },
    })
  }, [deleteRecord, id, onDeleteSuccess, router, resourceDef.basePath])

  // Determine which buttons to show
  const canEdit = showEditButton && capabilities.edit !== false
  const canDelete = showDeleteButton && capabilities.delete !== false

  // Get display title
  const displayTitle = title || resourceDef.label

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          {showBackButton && (
            <button
              onClick={handleBack}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Tagasi</span>
            </button>
          )}
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{displayTitle}</h1>
            <p className="text-sm text-gray-500">ID: {id}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Custom header content */}
          {headerContent}

          {/* Edit button */}
          {canEdit && (
            <button
              onClick={handleEdit}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Edit className="w-4 h-4" />
              <span>Muuda</span>
            </button>
          )}

          {/* Delete button */}
          {canDelete && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Kustuta</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs (if defined) */}
      {tabs && tabs.length > 0 && (
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex gap-4">
            <button
              onClick={() => setActiveTab(null)}
              className={`py-2 px-1 border-b-2 text-sm font-medium ${
                activeTab === null
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Üldinfo
            </button>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`py-2 px-1 border-b-2 text-sm font-medium ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      )}

      {/* Content */}
      {activeTab === null ? (
        <ResourceShow
          resource={resourceDef}
          id={id}
          hideColumns={hideColumns}
          layout={layout}
          gridColumns={gridColumns}
          showBackButton={false} // Handled by page header
          showEditButton={false} // Handled by page header
          showDeleteButton={false} // Handled by page header
          meta={meta}
        />
      ) : (
        <div>
          {tabs?.find((t) => t.key === activeTab)?.content}
        </div>
      )}

      {/* Footer content */}
      {footerContent && (
        <div className="pt-4 border-t border-gray-200">
          {footerContent}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowDeleteConfirm(false)} />

            <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-lg font-semibold leading-6 text-gray-900">
                      Kustuta kirje
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Kas olete kindel, et soovite selle kirje kustutada? Seda toimingut ei saa tagasi võtta.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6 gap-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={confirmDelete}
                  className="inline-flex w-full justify-center rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:w-auto disabled:opacity-50"
                >
                  {isDeleting ? 'Kustutamine...' : 'Kustuta'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-lg bg-white px-4 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Tühista
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ResourceShowPage
