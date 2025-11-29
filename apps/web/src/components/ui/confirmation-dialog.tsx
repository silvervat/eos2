'use client'

import { useState, useCallback, createContext, useContext, ReactNode } from 'react'
import { Button, Card } from '@rivest/ui'
import {
  AlertTriangle,
  Trash2,
  CheckCircle,
  Info,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react'

// Types
export type ConfirmationVariant = 'danger' | 'warning' | 'info' | 'success'

export interface ConfirmationOptions {
  title: string
  message: string | ReactNode
  variant?: ConfirmationVariant
  confirmLabel?: string
  cancelLabel?: string
  confirmDestructive?: boolean
  icon?: ReactNode
  requireTypedConfirmation?: string
  onConfirm?: () => void | Promise<void>
  onCancel?: () => void
}

interface ConfirmationContextValue {
  confirm: (options: ConfirmationOptions) => Promise<boolean>
  confirmDelete: (itemName: string) => Promise<boolean>
}

const ConfirmationContext = createContext<ConfirmationContextValue | null>(null)

export function useConfirmation() {
  const context = useContext(ConfirmationContext)
  if (!context) {
    throw new Error('useConfirmation must be used within a ConfirmationProvider')
  }
  return context
}

// Provider
interface ConfirmationProviderProps {
  children: ReactNode
}

export function ConfirmationProvider({ children }: ConfirmationProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ConfirmationOptions | null>(null)
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null)
  const [loading, setLoading] = useState(false)
  const [typedValue, setTypedValue] = useState('')

  const confirm = useCallback((opts: ConfirmationOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setOptions(opts)
      setResolver(() => resolve)
      setIsOpen(true)
      setTypedValue('')
    })
  }, [])

  const confirmDelete = useCallback(
    (itemName: string): Promise<boolean> => {
      return confirm({
        title: 'Kustuta element',
        message: (
          <>
            Kas olete kindel, et soovite kustutada{' '}
            <strong className="text-slate-900">{itemName}</strong>? See toiming on
            pöördumatu.
          </>
        ),
        variant: 'danger',
        confirmLabel: 'Kustuta',
        confirmDestructive: true,
      })
    },
    [confirm]
  )

  const handleConfirm = async () => {
    if (options?.requireTypedConfirmation && typedValue !== options.requireTypedConfirmation) {
      return
    }

    setLoading(true)
    try {
      if (options?.onConfirm) {
        await options.onConfirm()
      }
      resolver?.(true)
    } finally {
      setLoading(false)
      setIsOpen(false)
      setOptions(null)
      setResolver(null)
    }
  }

  const handleCancel = () => {
    options?.onCancel?.()
    resolver?.(false)
    setIsOpen(false)
    setOptions(null)
    setResolver(null)
  }

  const getVariantStyles = (variant: ConfirmationVariant = 'warning') => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          icon: <Trash2 className="w-6 h-6" />,
          confirmBg: 'bg-red-600 hover:bg-red-700',
        }
      case 'warning':
        return {
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          icon: <AlertTriangle className="w-6 h-6" />,
          confirmBg: 'bg-amber-600 hover:bg-amber-700',
        }
      case 'info':
        return {
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          icon: <Info className="w-6 h-6" />,
          confirmBg: 'bg-blue-600 hover:bg-blue-700',
        }
      case 'success':
        return {
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          icon: <CheckCircle className="w-6 h-6" />,
          confirmBg: 'bg-green-600 hover:bg-green-700',
        }
    }
  }

  const styles = options ? getVariantStyles(options.variant) : getVariantStyles('warning')
  const canConfirm = !options?.requireTypedConfirmation || typedValue === options.requireTypedConfirmation

  return (
    <ConfirmationContext.Provider value={{ confirm, confirmDelete }}>
      {children}

      {/* Dialog */}
      {isOpen && options && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md bg-white rounded-xl shadow-xl animate-in fade-in zoom-in-95 duration-200">
            {/* Close button */}
            <button
              onClick={handleCancel}
              className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Content */}
            <div className="p-6">
              {/* Icon */}
              <div
                className={`w-12 h-12 rounded-full ${styles.iconBg} ${styles.iconColor} flex items-center justify-center mx-auto mb-4`}
              >
                {options.icon || styles.icon}
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-slate-900 text-center mb-2">
                {options.title}
              </h3>

              {/* Message */}
              <p className="text-slate-600 text-center">{options.message}</p>

              {/* Typed confirmation */}
              {options.requireTypedConfirmation && (
                <div className="mt-4">
                  <p className="text-sm text-slate-600 mb-2">
                    Kinnitamiseks sisestage:{' '}
                    <code className="px-2 py-1 bg-slate-100 rounded text-red-600 font-mono">
                      {options.requireTypedConfirmation}
                    </code>
                  </p>
                  <input
                    type="text"
                    value={typedValue}
                    onChange={(e) => setTypedValue(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    placeholder={options.requireTypedConfirmation}
                    autoFocus
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={loading}
                className="flex-1"
              >
                {options.cancelLabel || 'Tühista'}
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={loading || !canConfirm}
                className={`flex-1 ${
                  options.confirmDestructive
                    ? styles.confirmBg
                    : 'bg-[#279989] hover:bg-[#1e7a6d]'
                } text-white`}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Laadin...
                  </>
                ) : (
                  options.confirmLabel || 'Kinnita'
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </ConfirmationContext.Provider>
  )
}

// Standalone Dialog Component (for use without context)
interface ConfirmationDialogProps extends ConfirmationOptions {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  message,
  variant = 'warning',
  confirmLabel = 'Kinnita',
  cancelLabel = 'Tühista',
  confirmDestructive = false,
  icon,
  requireTypedConfirmation,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  const [loading, setLoading] = useState(false)
  const [typedValue, setTypedValue] = useState('')

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-red-100',
          iconColor: 'text-red-600',
          defaultIcon: <Trash2 className="w-6 h-6" />,
          confirmBg: 'bg-red-600 hover:bg-red-700',
        }
      case 'warning':
        return {
          iconBg: 'bg-amber-100',
          iconColor: 'text-amber-600',
          defaultIcon: <AlertTriangle className="w-6 h-6" />,
          confirmBg: 'bg-amber-600 hover:bg-amber-700',
        }
      case 'info':
        return {
          iconBg: 'bg-blue-100',
          iconColor: 'text-blue-600',
          defaultIcon: <Info className="w-6 h-6" />,
          confirmBg: 'bg-blue-600 hover:bg-blue-700',
        }
      case 'success':
        return {
          iconBg: 'bg-green-100',
          iconColor: 'text-green-600',
          defaultIcon: <CheckCircle className="w-6 h-6" />,
          confirmBg: 'bg-green-600 hover:bg-green-700',
        }
    }
  }

  const styles = getVariantStyles()
  const canConfirm = !requireTypedConfirmation || typedValue === requireTypedConfirmation

  const handleConfirm = async () => {
    if (!canConfirm) return

    setLoading(true)
    try {
      await onConfirm?.()
      onOpenChange(false)
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md bg-white rounded-xl shadow-xl">
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div
            className={`w-12 h-12 rounded-full ${styles.iconBg} ${styles.iconColor} flex items-center justify-center mx-auto mb-4`}
          >
            {icon || styles.defaultIcon}
          </div>

          <h3 className="text-lg font-semibold text-slate-900 text-center mb-2">
            {title}
          </h3>

          <p className="text-slate-600 text-center">{message}</p>

          {requireTypedConfirmation && (
            <div className="mt-4">
              <p className="text-sm text-slate-600 mb-2">
                Kinnitamiseks sisestage:{' '}
                <code className="px-2 py-1 bg-slate-100 rounded text-red-600 font-mono">
                  {requireTypedConfirmation}
                </code>
              </p>
              <input
                type="text"
                value={typedValue}
                onChange={(e) => setTypedValue(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder={requireTypedConfirmation}
                autoFocus
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 p-4 border-t border-slate-200 bg-slate-50 rounded-b-xl">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={loading || !canConfirm}
            className={`flex-1 ${
              confirmDestructive ? styles.confirmBg : 'bg-[#279989] hover:bg-[#1e7a6d]'
            } text-white`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Laadin...
              </>
            ) : (
              confirmLabel
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default ConfirmationDialog
