'use client'

import React from 'react'
import { useOne } from '@eos2/data-provider'
import { getResource, type ResourceDefinition, type ColumnDefinition } from '@eos2/resources'
import { ArrowLeft, Edit, Trash2, Loader2 } from 'lucide-react'
import { clsx } from 'clsx'
import {
  formatValue,
  formatDate,
  formatDateTime,
  formatCurrency,
  formatNumber,
  StatusBadge,
  BooleanDisplay,
  EmailDisplay,
  PhoneDisplay,
  LinkDisplay,
  ImageDisplay,
  TagsDisplay,
  getNestedValue,
} from '../formatters'

// ============ TYPES ============

export interface ResourceShowProps {
  /** Resource name or definition */
  resource: string | ResourceDefinition
  /** Record ID to display */
  id: string
  /** Callback when edit button is clicked */
  onEdit?: (id: string) => void
  /** Callback when delete button is clicked */
  onDelete?: (id: string) => void
  /** Callback when back button is clicked */
  onBack?: () => void
  /** Hide specific columns */
  hideColumns?: string[]
  /** Additional columns to display */
  additionalColumns?: ColumnDefinition[]
  /** Custom title */
  title?: string
  /** Show back button */
  showBackButton?: boolean
  /** Show edit button */
  showEditButton?: boolean
  /** Show delete button */
  showDeleteButton?: boolean
  /** Custom header content */
  headerContent?: React.ReactNode
  /** Custom footer content */
  footerContent?: React.ReactNode
  /** Additional metadata for the query */
  meta?: Record<string, unknown>
  /** Layout style */
  layout?: 'card' | 'table' | 'grid'
  /** Number of columns for grid layout */
  gridColumns?: 2 | 3 | 4
}

// ============ SECTION COMPONENT ============

interface ShowSectionProps {
  title: string
  children: React.ReactNode
}

function ShowSection({ title, children }: ShowSectionProps) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
        {title}
      </h3>
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {children}
      </div>
    </div>
  )
}

// ============ FIELD ROW COMPONENT ============

interface ShowFieldProps {
  label: string
  value: React.ReactNode
  description?: string
}

function ShowField({ label, value, description }: ShowFieldProps) {
  return (
    <div className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm font-medium text-gray-500">
        {label}
        {description && (
          <p className="mt-1 text-xs text-gray-400 font-normal">{description}</p>
        )}
      </dt>
      <dd className="mt-1 text-sm text-gray-900 sm:col-span-2 sm:mt-0">
        {value}
      </dd>
    </div>
  )
}

// ============ GRID FIELD COMPONENT ============

interface GridFieldProps {
  label: string
  value: React.ReactNode
}

function GridField({ label, value }: GridFieldProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <dt className="text-sm font-medium text-gray-500 mb-1">{label}</dt>
      <dd className="text-sm text-gray-900">{value}</dd>
    </div>
  )
}

// ============ LOADING SKELETON ============

function ShowSkeleton({ columns = 6 }: { columns?: number }) {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-6" />
      <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="px-4 py-3 sm:grid sm:grid-cols-3 sm:gap-4">
            <div className="h-4 bg-gray-200 rounded w-24" />
            <div className="mt-1 h-4 bg-gray-100 rounded w-48 sm:mt-0 sm:col-span-2" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ============ EMPTY STATE ============

function EmptyState({ message = 'Kirjet ei leitud' }: { message?: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-gray-500">{message}</p>
    </div>
  )
}

// ============ MAIN COMPONENT ============

export function ResourceShow({
  resource,
  id,
  onEdit,
  onDelete,
  onBack,
  hideColumns = [],
  additionalColumns = [],
  title,
  showBackButton = true,
  showEditButton = true,
  showDeleteButton = false,
  headerContent,
  footerContent,
  meta,
  layout = 'table',
  gridColumns = 2,
}: ResourceShowProps) {
  // Get resource definition
  const resourceDef = typeof resource === 'string' ? getResource(resource) : resource

  // Build visible columns
  const visibleColumns = React.useMemo(() => {
    const baseColumns = resourceDef.columns.filter(
      (col) => !hideColumns.includes(col.field) && col.showInShow !== false
    )
    return [...baseColumns, ...additionalColumns]
  }, [resourceDef.columns, hideColumns, additionalColumns])

  // Fetch data
  const { data: record, isLoading, error } = useOne<Record<string, unknown>>(
    resourceDef.name,
    id,
    { supabaseSelect: resourceDef.select, meta }
  )

  // Group columns by section (if defined)
  const columnsBySection = React.useMemo(() => {
    const sections: Record<string, ColumnDefinition[]> = {}
    const noSection: ColumnDefinition[] = []

    for (const col of visibleColumns) {
      if (col.section) {
        if (!sections[col.section]) {
          sections[col.section] = []
        }
        sections[col.section].push(col)
      } else {
        noSection.push(col)
      }
    }

    return { sections, noSection }
  }, [visibleColumns])

  // Format value for display
  const renderValue = (column: ColumnDefinition, data: Record<string, unknown>) => {
    const value = getNestedValue(data, column.field)
    return formatValue(value, column, data)
  }

  // Render based on layout
  const renderContent = () => {
    if (!record) return null

    if (layout === 'grid') {
      const gridClasses = {
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
      }

      return (
        <div className={clsx('grid gap-4', gridClasses[gridColumns])}>
          {visibleColumns.map((column) => (
            <GridField
              key={column.field}
              label={column.label}
              value={renderValue(column, record)}
            />
          ))}
        </div>
      )
    }

    if (layout === 'card') {
      return (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <dl className="space-y-4">
            {visibleColumns.map((column) => (
              <div key={column.field}>
                <dt className="text-sm font-medium text-gray-500">{column.label}</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {renderValue(column, record)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      )
    }

    // Default: table layout with sections
    const { sections, noSection } = columnsBySection

    return (
      <div className="space-y-6">
        {/* Main fields without section */}
        {noSection.length > 0 && (
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-100">
            <dl>
              {noSection.map((column) => (
                <ShowField
                  key={column.field}
                  label={column.label}
                  value={renderValue(column, record)}
                  description={column.description}
                />
              ))}
            </dl>
          </div>
        )}

        {/* Sectioned fields */}
        {Object.entries(sections).map(([sectionName, columns]) => (
          <ShowSection key={sectionName} title={sectionName}>
            <dl>
              {columns.map((column) => (
                <ShowField
                  key={column.field}
                  label={column.label}
                  value={renderValue(column, record)}
                  description={column.description}
                />
              ))}
            </dl>
          </ShowSection>
        ))}
      </div>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-4">
        {showBackButton && (
          <div className="h-10 bg-gray-200 rounded w-24 animate-pulse" />
        )}
        <ShowSkeleton columns={visibleColumns.length} />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Viga andmete laadimisel: {error.message}</p>
      </div>
    )
  }

  // Not found state
  if (!record) {
    return <EmptyState />
  }

  const displayTitle = title || resourceDef.label

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {showBackButton && onBack && (
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Tagasi</span>
            </button>
          )}
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">{displayTitle}</h1>
            {resourceDef.labelPlural && (
              <p className="text-sm text-gray-500">ID: {id}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {headerContent}

          {showEditButton && onEdit && (
            <button
              onClick={() => onEdit(id)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Edit className="w-4 h-4" />
              <span>Muuda</span>
            </button>
          )}

          {showDeleteButton && onDelete && (
            <button
              onClick={() => onDelete(id)}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>Kustuta</span>
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      {renderContent()}

      {/* Footer */}
      {footerContent && (
        <div className="pt-4 border-t border-gray-200">
          {footerContent}
        </div>
      )}

      {/* Metadata (timestamps) */}
      {(record.created_at || record.updated_at) ? (
        <div className="pt-4 border-t border-gray-200">
          <dl className="flex gap-6 text-xs text-gray-500">
            {record.created_at ? (
              <div>
                <dt className="inline">Loodud: </dt>
                <dd className="inline">{formatDateTime(record.created_at)}</dd>
              </div>
            ) : null}
            {record.updated_at ? (
              <div>
                <dt className="inline">Muudetud: </dt>
                <dd className="inline">{formatDateTime(record.updated_at)}</dd>
              </div>
            ) : null}
          </dl>
        </div>
      ) : null}
    </div>
  )
}

// ============ RELATION SHOW COMPONENT ============

export interface RelationShowProps {
  /** Resource definition for the related resource */
  resource: string | ResourceDefinition
  /** Record ID */
  id: string
  /** Columns to display */
  columns?: string[]
  /** Layout style */
  layout?: 'inline' | 'card'
}

/**
 * Compact component for showing related record details
 */
export function RelationShow({
  resource,
  id,
  columns,
  layout = 'inline',
}: RelationShowProps) {
  const resourceDef = typeof resource === 'string' ? getResource(resource) : resource

  const { data: record, isLoading } = useOne<Record<string, unknown>>(
    resourceDef.name,
    id,
    { supabaseSelect: resourceDef.select }
  )

  if (isLoading) {
    return <span className="animate-pulse bg-gray-200 rounded h-4 w-24 inline-block" />
  }

  if (!record) {
    return <span className="text-gray-400">—</span>
  }

  const visibleColumns = columns
    ? resourceDef.columns.filter((col) => columns.includes(col.field))
    : resourceDef.columns.slice(0, 3)

  if (layout === 'card') {
    return (
      <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
        <dl className="space-y-1">
          {visibleColumns.map((column) => (
            <div key={column.field} className="flex justify-between text-sm">
              <dt className="text-gray-500">{column.label}:</dt>
              <dd className="text-gray-900">
                {formatValue(getNestedValue(record, column.field), column, record)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    )
  }

  // Inline layout
  return (
    <span className="text-sm">
      {visibleColumns.map((column, index) => (
        <span key={column.field}>
          {index > 0 && ' • '}
          {formatValue(getNestedValue(record, column.field), column, record)}
        </span>
      ))}
    </span>
  )
}

export default ResourceShow
