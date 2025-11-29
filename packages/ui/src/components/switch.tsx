'use client'

import * as React from 'react'
import { cn } from '../lib/utils'

export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  onCheckedChange?: (checked: boolean) => void
}

const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ className, onCheckedChange, checked, disabled, ...props }, ref) => {
    return (
      <label className={cn('relative inline-flex items-center cursor-pointer', disabled && 'cursor-not-allowed opacity-50')}>
        <input
          type="checkbox"
          className="sr-only peer"
          ref={ref}
          checked={checked}
          disabled={disabled}
          onChange={(e) => onCheckedChange?.(e.target.checked)}
          {...props}
        />
        <div
          className={cn(
            'w-9 h-5 bg-muted rounded-full peer',
            'peer-checked:bg-primary',
            'after:content-[""] after:absolute after:top-0.5 after:left-[2px]',
            'after:bg-white after:rounded-full after:h-4 after:w-4',
            'after:transition-all peer-checked:after:translate-x-4',
            className
          )}
        />
      </label>
    )
  }
)
Switch.displayName = 'Switch'

export { Switch }
