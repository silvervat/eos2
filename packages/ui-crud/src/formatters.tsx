'use client'

import { format, formatDistanceToNow, isValid, parseISO } from 'date-fns'
import { et } from 'date-fns/locale'
import { Check, X, Mail, Phone, ExternalLink } from 'lucide-react'
import type { ColumnDefinition, StatusColor } from '@eos2/resources'
import { clsx } from 'clsx'

// ============ DATE FORMATTING ============

/**
 * Format a date value for display
 */
export function formatDate(value: unknown): string {
  if (!value) return '—'

  const date = typeof value === 'string' ? parseISO(value) : value as Date
  if (!isValid(date)) return '—'

  return format(date, 'dd.MM.yyyy', { locale: et })
}

/**
 * Format a datetime value for display
 */
export function formatDateTime(value: unknown): string {
  if (!value) return '—'

  const date = typeof value === 'string' ? parseISO(value) : value as Date
  if (!isValid(date)) return '—'

  return format(date, 'dd.MM.yyyy HH:mm', { locale: et })
}

/**
 * Format a date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(value: unknown): string {
  if (!value) return '—'

  const date = typeof value === 'string' ? parseISO(value) : value as Date
  if (!isValid(date)) return '—'

  return formatDistanceToNow(date, { addSuffix: true, locale: et })
}

// ============ NUMBER FORMATTING ============

/**
 * Format a currency value
 */
export function formatCurrency(value: unknown, currency = '€'): string {
  if (value === null || value === undefined || value === '') return '—'

  const num = typeof value === 'string' ? parseFloat(value) : value as number
  if (isNaN(num)) return '—'

  return `${num.toLocaleString('et-EE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`
}

/**
 * Format a number value
 */
export function formatNumber(value: unknown, decimals = 0): string {
  if (value === null || value === undefined || value === '') return '—'

  const num = typeof value === 'string' ? parseFloat(value) : value as number
  if (isNaN(num)) return '—'

  return num.toLocaleString('et-EE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}

// ============ STATUS/BADGE FORMATTING ============

const statusColorClasses: Record<StatusColor, string> = {
  default: 'bg-gray-100 text-gray-800',
  blue: 'bg-blue-100 text-blue-800',
  green: 'bg-green-100 text-green-800',
  red: 'bg-red-100 text-red-800',
  orange: 'bg-orange-100 text-orange-800',
  yellow: 'bg-yellow-100 text-yellow-800',
  purple: 'bg-purple-100 text-purple-800',
  pink: 'bg-pink-100 text-pink-800',
  gray: 'bg-gray-100 text-gray-600',
  cyan: 'bg-cyan-100 text-cyan-800',
}

interface StatusBadgeProps {
  value: string
  color?: StatusColor
  label?: string
}

/**
 * Status badge component
 */
export function StatusBadge({ value, color = 'default', label }: StatusBadgeProps) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        statusColorClasses[color]
      )}
    >
      {label || value}
    </span>
  )
}

// ============ BOOLEAN FORMATTING ============

interface BooleanDisplayProps {
  value: unknown
  trueLabel?: string
  falseLabel?: string
}

/**
 * Boolean display component
 */
export function BooleanDisplay({ value, trueLabel, falseLabel }: BooleanDisplayProps) {
  const isTrue = Boolean(value)

  if (trueLabel || falseLabel) {
    return (
      <StatusBadge
        value={isTrue ? (trueLabel || 'Jah') : (falseLabel || 'Ei')}
        color={isTrue ? 'green' : 'gray'}
      />
    )
  }

  return isTrue ? (
    <Check className="w-4 h-4 text-green-600" />
  ) : (
    <X className="w-4 h-4 text-gray-400" />
  )
}

// ============ CONTACT FORMATTING ============

interface EmailDisplayProps {
  value: unknown
}

/**
 * Email display with mailto link
 */
export function EmailDisplay({ value }: EmailDisplayProps) {
  if (!value) return <span className="text-gray-400">—</span>

  const email = String(value)

  return (
    <a
      href={`mailto:${email}`}
      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      <Mail className="w-3 h-3" />
      <span>{email}</span>
    </a>
  )
}

interface PhoneDisplayProps {
  value: unknown
}

/**
 * Phone display with tel link
 */
export function PhoneDisplay({ value }: PhoneDisplayProps) {
  if (!value) return <span className="text-gray-400">—</span>

  const phone = String(value)

  return (
    <a
      href={`tel:${phone.replace(/\s/g, '')}`}
      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      <Phone className="w-3 h-3" />
      <span>{phone}</span>
    </a>
  )
}

interface LinkDisplayProps {
  value: unknown
  label?: string
}

/**
 * Link display
 */
export function LinkDisplay({ value, label }: LinkDisplayProps) {
  if (!value) return <span className="text-gray-400">—</span>

  const url = String(value)

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 hover:underline"
      onClick={(e) => e.stopPropagation()}
    >
      <span>{label || url}</span>
      <ExternalLink className="w-3 h-3" />
    </a>
  )
}

// ============ IMAGE FORMATTING ============

interface ImageDisplayProps {
  value: unknown
  alt?: string
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Image/avatar display
 */
export function ImageDisplay({ value, alt = '', size = 'sm' }: ImageDisplayProps) {
  if (!value) {
    const sizeClasses = {
      sm: 'w-8 h-8',
      md: 'w-12 h-12',
      lg: 'w-16 h-16',
    }

    return (
      <div className={clsx(
        'rounded-full bg-gray-200 flex items-center justify-center text-gray-400',
        sizeClasses[size]
      )}>
        —
      </div>
    )
  }

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  }

  return (
    <img
      src={String(value)}
      alt={alt}
      className={clsx('rounded-full object-cover', sizeClasses[size])}
    />
  )
}

// ============ PROGRESS FORMATTING ============

interface ProgressDisplayProps {
  value: unknown
  max?: number
}

/**
 * Progress bar display
 */
export function ProgressDisplay({ value, max = 100 }: ProgressDisplayProps) {
  const num = typeof value === 'number' ? value : parseFloat(String(value)) || 0
  const percentage = Math.min(100, Math.max(0, (num / max) * 100))

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={clsx(
            'h-full rounded-full transition-all',
            percentage >= 100 ? 'bg-green-500' :
            percentage >= 75 ? 'bg-blue-500' :
            percentage >= 50 ? 'bg-yellow-500' :
            'bg-gray-400'
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 w-10 text-right">
        {formatNumber(num)}%
      </span>
    </div>
  )
}

// ============ TAGS FORMATTING ============

interface TagsDisplayProps {
  value: unknown
}

/**
 * Tags display
 */
export function TagsDisplay({ value }: TagsDisplayProps) {
  if (!value) return <span className="text-gray-400">—</span>

  const tags = Array.isArray(value) ? value : String(value).split(',').map(t => t.trim())

  if (tags.length === 0) return <span className="text-gray-400">—</span>

  return (
    <div className="flex flex-wrap gap-1">
      {tags.slice(0, 3).map((tag, index) => (
        <span
          key={index}
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700"
        >
          {tag}
        </span>
      ))}
      {tags.length > 3 && (
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">
          +{tags.length - 3}
        </span>
      )}
    </div>
  )
}

// ============ MAIN FORMAT FUNCTION ============

/**
 * Get nested value from object using dot notation
 */
export function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current: unknown, key) => {
    if (current && typeof current === 'object' && key in (current as Record<string, unknown>)) {
      return (current as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

/**
 * Format a value based on column definition
 */
export function formatValue(
  value: unknown,
  column: ColumnDefinition,
  record: Record<string, unknown>
): React.ReactNode {
  // If custom render is provided, use it
  if (column.render) {
    return column.render(value, record)
  }

  // Handle null/undefined
  if (value === null || value === undefined || value === '') {
    return <span className="text-gray-400">—</span>
  }

  // Format based on column type
  switch (column.type) {
    case 'text':
      return String(value)

    case 'number':
      return formatNumber(value)

    case 'currency':
      return formatCurrency(value)

    case 'date':
      return formatDate(value)

    case 'datetime':
      return formatDateTime(value)

    case 'boolean':
      return <BooleanDisplay value={value} />

    case 'status': {
      const statusValue = String(value)
      const color = column.statusColors?.[statusValue] || 'default'
      // Try to get label from options if available
      return <StatusBadge value={statusValue} color={color} />
    }

    case 'email':
      return <EmailDisplay value={value} />

    case 'phone':
      return <PhoneDisplay value={value} />

    case 'link':
      return <LinkDisplay value={value} />

    case 'image':
    case 'avatar':
      return <ImageDisplay value={value} size="sm" />

    case 'progress':
      return <ProgressDisplay value={value} />

    case 'tags':
      return <TagsDisplay value={value} />

    case 'relation':
      // For relations, the value is usually already the display value
      // because of the Supabase select query
      if (column.relationField) {
        const nestedValue = getNestedValue(record, column.relationField)
        return nestedValue ? String(nestedValue) : <span className="text-gray-400">—</span>
      }
      return String(value)

    case 'json':
      try {
        const json = typeof value === 'string' ? JSON.parse(value) : value
        return (
          <pre className="text-xs bg-gray-50 p-1 rounded overflow-x-auto max-w-xs">
            {JSON.stringify(json, null, 2)}
          </pre>
        )
      } catch {
        return String(value)
      }

    default:
      return String(value)
  }
}

/**
 * Get cell alignment class based on column type
 */
export function getCellAlignment(column: ColumnDefinition): string {
  if (column.align) {
    return column.align === 'center' ? 'text-center' :
           column.align === 'right' ? 'text-right' : 'text-left'
  }

  // Default alignments based on type
  switch (column.type) {
    case 'number':
    case 'currency':
      return 'text-right'
    case 'boolean':
      return 'text-center'
    default:
      return 'text-left'
  }
}
