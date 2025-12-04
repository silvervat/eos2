'use client'

import React, { useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getResource, type ResourceDefinition } from '@eos2/resources'
import { ResourceForm } from '../components/ResourceForm'

// ============ TYPES ============

export interface ResourceEditPageProps {
  /** Resource name or definition */
  resource: string | ResourceDefinition
  /** Record ID for edit mode (omit for create mode) */
  id?: string
  /** Page title (defaults based on mode and resource) */
  title?: string
  /** Page description/subtitle */
  description?: string
  /** Show back button */
  showBackButton?: boolean
  /** Custom back handler */
  onBack?: () => void
  /** Custom success handler */
  onSuccess?: (data: Record<string, unknown>) => void
  /** Custom cancel handler */
  onCancel?: () => void
  /** Default values for the form */
  defaultValues?: Record<string, unknown>
  /** Additional metadata for mutations */
  meta?: Record<string, unknown>
  /** Custom header content */
  headerContent?: React.ReactNode
  /** Custom footer content */
  footerContent?: React.ReactNode
}

// ============ COMPONENT ============

export function ResourceEditPage({
  resource,
  id,
  title,
  description,
  showBackButton = true,
  onBack,
  onSuccess,
  onCancel,
  defaultValues,
  meta,
  headerContent,
  footerContent,
}: ResourceEditPageProps) {
  const router = useRouter()

  // Get resource definition
  const resourceDef = typeof resource === 'string' ? getResource(resource) : resource
  const isEdit = !!id

  // Navigation handlers
  const handleBack = useCallback(() => {
    if (onBack) {
      onBack()
    } else if (isEdit) {
      router.push(`${resourceDef.basePath}/${id}`)
    } else {
      router.push(resourceDef.basePath)
    }
  }, [onBack, isEdit, router, resourceDef.basePath, id])

  const handleSuccess = useCallback((data: Record<string, unknown>) => {
    if (onSuccess) {
      onSuccess(data)
    } else {
      // Navigate to the detail page for the new/updated record
      router.push(`${resourceDef.basePath}/${data.id}`)
    }
  }, [onSuccess, router, resourceDef.basePath])

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel()
    } else {
      handleBack()
    }
  }, [onCancel, handleBack])

  // Get display title
  const displayTitle = title || (isEdit ? `Muuda ${resourceDef.label.toLowerCase()}` : `Lisa uus ${resourceDef.label.toLowerCase()}`)

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
            {description && (
              <p className="mt-1 text-sm text-gray-500">{description}</p>
            )}
            {isEdit && (
              <p className="text-sm text-gray-500">ID: {id}</p>
            )}
          </div>
        </div>

        {/* Custom header content */}
        {headerContent && (
          <div className="flex items-center gap-2">
            {headerContent}
          </div>
        )}
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <ResourceForm
          resource={resourceDef.name}
          id={id}
          defaultValues={defaultValues}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
          showBackButton={false} // Handled by page header
          meta={meta}
        />
      </div>

      {/* Footer content */}
      {footerContent && (
        <div className="pt-4 border-t border-gray-200">
          {footerContent}
        </div>
      )}
    </div>
  )
}

// ============ CONVENIENCE EXPORTS ============

/** Create page - convenience wrapper for ResourceEditPage without id */
export function ResourceCreatePage(props: Omit<ResourceEditPageProps, 'id'>) {
  return <ResourceEditPage {...props} />
}

export default ResourceEditPage
