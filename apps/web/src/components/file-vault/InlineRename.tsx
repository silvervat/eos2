'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { Check, X, Loader2 } from 'lucide-react'

interface InlineRenameProps {
  fileId: string
  currentName: string
  extension?: string
  onRename: (newName: string) => Promise<boolean>
  onCancel: () => void
  className?: string
}

/**
 * Inline rename input for files
 * Shows in-place editing with validation
 */
export function InlineRename({
  fileId,
  currentName,
  extension,
  onRename,
  onCancel,
  className = '',
}: InlineRenameProps) {
  // Extract name without extension for editing
  const nameWithoutExt = extension
    ? currentName.replace(new RegExp(`\\.${extension}$`, 'i'), '')
    : currentName

  const [value, setValue] = useState(nameWithoutExt)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus and select text on mount
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [])

  // Validate name
  const validateName = (name: string): string | null => {
    if (!name.trim()) {
      return 'Nimi ei saa olla tühi'
    }
    if (name.includes('/') || name.includes('\\')) {
      return 'Nimi ei tohi sisaldada kaldkriipse'
    }
    if (name.length > 255) {
      return 'Nimi on liiga pikk'
    }
    // Check for reserved characters
    if (/[<>:"|?*]/.test(name)) {
      return 'Nimi sisaldab keelatud tähemärke'
    }
    return null
  }

  // Handle submit
  const handleSubmit = useCallback(async () => {
    const trimmedValue = value.trim()
    const validationError = validateName(trimmedValue)

    if (validationError) {
      setError(validationError)
      return
    }

    // Add extension back
    const fullName = extension ? `${trimmedValue}.${extension}` : trimmedValue

    // Check if name actually changed
    if (fullName === currentName) {
      onCancel()
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const success = await onRename(fullName)
      if (!success) {
        setError('Nime muutmine ebaõnnestus')
        setIsSubmitting(false)
      }
      // On success, parent component should handle cleanup
    } catch (err) {
      setError('Nime muutmine ebaõnnestus')
      setIsSubmitting(false)
    }
  }, [value, extension, currentName, onRename, onCancel])

  // Handle key events
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSubmit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      onCancel()
    }
  }, [handleSubmit, onCancel])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        // Check if click was on action buttons
        const target = e.target as HTMLElement
        if (target.closest('.inline-rename-actions')) return
        handleSubmit()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleSubmit])

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex-1 relative">
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setError(null)
          }}
          onKeyDown={handleKeyDown}
          disabled={isSubmitting}
          className={`
            w-full px-2 py-1 text-sm border rounded
            focus:outline-none focus:ring-2 focus:ring-[#279989] focus:border-transparent
            ${error ? 'border-red-500' : 'border-slate-300'}
            ${isSubmitting ? 'bg-slate-100 text-slate-400' : 'bg-white'}
          `}
          placeholder="Faili nimi"
        />
        {extension && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-slate-400">
            .{extension}
          </span>
        )}
      </div>

      {/* Action buttons */}
      <div className="inline-rename-actions flex items-center gap-1">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="p-1 rounded hover:bg-green-100 text-green-600 disabled:opacity-50"
          title="Salvesta (Enter)"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Check className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={onCancel}
          disabled={isSubmitting}
          className="p-1 rounded hover:bg-red-100 text-red-600 disabled:opacity-50"
          title="Tühista (Esc)"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Error message */}
      {error && (
        <span className="absolute left-0 top-full mt-1 text-xs text-red-500">
          {error}
        </span>
      )}
    </div>
  )
}

export default InlineRename
