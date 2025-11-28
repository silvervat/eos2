'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import {
  Type,
  Mail,
  Phone,
  Hash,
  Link,
  AlignLeft,
  ChevronDown,
  Circle,
  CheckSquare,
  List,
  Calendar,
  Clock,
  Upload,
  PenTool,
  Star,
  Sliders,
  Heading,
  Text,
  Minus,
} from 'lucide-react'
import { FIELD_CATEGORIES, FieldType } from './types'

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Type,
  Mail,
  Phone,
  Hash,
  Link,
  AlignLeft,
  ChevronDown,
  Circle,
  CheckSquare,
  List,
  Calendar,
  Clock,
  CalendarClock: Calendar,
  Upload,
  PenTool,
  Star,
  Sliders,
  Heading,
  Text,
  Minus,
}

interface DraggableFieldProps {
  type: FieldType
  label: string
  icon: string
}

function DraggableField({ type, label, icon }: DraggableFieldProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: {
      isNew: true,
      type,
    },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  const Icon = iconMap[icon] || Type

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="flex items-center gap-2 p-2 rounded-md border border-border bg-card hover:bg-accent hover:border-primary/50 cursor-grab active:cursor-grabbing transition-colors"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm">{label}</span>
    </div>
  )
}

export function FieldPalette() {
  return (
    <div className="w-64 border-r border-border bg-muted/30 p-4 overflow-y-auto">
      <h3 className="font-semibold text-sm mb-4">Väljad</h3>
      <p className="text-xs text-muted-foreground mb-4">
        Lohista väli vormile lisamiseks
      </p>

      <div className="space-y-6">
        {FIELD_CATEGORIES.map((category) => (
          <div key={category.name}>
            <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              {category.label}
            </h4>
            <div className="grid grid-cols-1 gap-2">
              {category.fields.map((field) => (
                <DraggableField
                  key={field.type}
                  type={field.type}
                  label={field.label}
                  icon={field.icon}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
