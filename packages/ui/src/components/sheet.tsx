'use client'

import * as React from 'react'
import { cn } from '../lib/utils'
import { X } from 'lucide-react'

interface SheetContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const SheetContext = React.createContext<SheetContextValue | null>(null)

interface SheetProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

function Sheet({ open = false, onOpenChange = () => {}, children }: SheetProps) {
  return (
    <SheetContext.Provider value={{ open, onOpenChange }}>
      {children}
    </SheetContext.Provider>
  )
}

interface SheetTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
}

const SheetTrigger = React.forwardRef<HTMLButtonElement, SheetTriggerProps>(
  ({ children, onClick, ...props }, ref) => {
    const context = React.useContext(SheetContext)
    if (!context) throw new Error('SheetTrigger must be used within Sheet')

    return (
      <button
        ref={ref}
        onClick={(e) => {
          context.onOpenChange(true)
          onClick?.(e)
        }}
        {...props}
      >
        {children}
      </button>
    )
  }
)
SheetTrigger.displayName = 'SheetTrigger'

interface SheetContentProps extends React.HTMLAttributes<HTMLDivElement> {
  side?: 'left' | 'right' | 'top' | 'bottom'
}

const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
  ({ className, side = 'right', children, ...props }, ref) => {
    const context = React.useContext(SheetContext)
    if (!context) throw new Error('SheetContent must be used within Sheet')

    if (!context.open) return null

    const sideClasses = {
      left: 'inset-y-0 left-0 h-full w-3/4 sm:max-w-sm border-r',
      right: 'inset-y-0 right-0 h-full w-3/4 sm:max-w-sm border-l',
      top: 'inset-x-0 top-0 w-full border-b',
      bottom: 'inset-x-0 bottom-0 w-full border-t',
    }

    return (
      <>
        {/* Overlay */}
        <div
          className="fixed inset-0 z-50 bg-black/80 animate-in fade-in-0"
          onClick={() => context.onOpenChange(false)}
        />
        {/* Content */}
        <div
          ref={ref}
          className={cn(
            'fixed z-50 gap-4 bg-background p-6 shadow-lg transition ease-in-out',
            'animate-in slide-in-from-right duration-300',
            sideClasses[side],
            className
          )}
          {...props}
        >
          <button
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            onClick={() => context.onOpenChange(false)}
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
          {children}
        </div>
      </>
    )
  }
)
SheetContent.displayName = 'SheetContent'

export { Sheet, SheetTrigger, SheetContent }
