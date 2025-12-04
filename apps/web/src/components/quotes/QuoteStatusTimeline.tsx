'use client'

import { Check, Circle, Clock, Send, Eye, ThumbsUp, ThumbsDown, RotateCcw, AlertCircle } from 'lucide-react'
import type { QuoteStatus, InquiryStatus } from '@rivest/types'

// Quote status flow
const quoteStatusFlow: { status: QuoteStatus; label: string; icon: React.ElementType }[] = [
  { status: 'draft', label: 'Mustand', icon: Circle },
  { status: 'pending', label: 'Ootel', icon: Clock },
  { status: 'sent', label: 'Saadetud', icon: Send },
  { status: 'viewed', label: 'Vaadatud', icon: Eye },
  { status: 'accepted', label: 'Kinnitatud', icon: ThumbsUp },
]

// Alternative end states
const quoteAlternativeStates: { status: QuoteStatus; label: string; icon: React.ElementType; color: string }[] = [
  { status: 'rejected', label: 'Tagasi lükatud', icon: ThumbsDown, color: 'text-red-500' },
  { status: 'expired', label: 'Aegunud', icon: AlertCircle, color: 'text-amber-500' },
  { status: 'revised', label: 'Uuendatud', icon: RotateCcw, color: 'text-blue-500' },
]

// Inquiry status flow
const inquiryStatusFlow: { status: InquiryStatus; label: string; icon: React.ElementType }[] = [
  { status: 'new', label: 'Uus', icon: Circle },
  { status: 'in_progress', label: 'Töös', icon: Clock },
  { status: 'quoted', label: 'Pakkumine tehtud', icon: Send },
  { status: 'won', label: 'Võidetud', icon: ThumbsUp },
]

const inquiryAlternativeStates: { status: InquiryStatus; label: string; icon: React.ElementType; color: string }[] = [
  { status: 'lost', label: 'Kaotatud', icon: ThumbsDown, color: 'text-red-500' },
  { status: 'cancelled', label: 'Tühistatud', icon: AlertCircle, color: 'text-slate-500' },
]

interface QuoteStatusTimelineProps {
  currentStatus: QuoteStatus
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
  className?: string
}

interface InquiryStatusTimelineProps {
  currentStatus: InquiryStatus
  size?: 'sm' | 'md' | 'lg'
  showLabels?: boolean
  className?: string
}

function getStatusIndex(status: QuoteStatus): number {
  const idx = quoteStatusFlow.findIndex(s => s.status === status)
  return idx >= 0 ? idx : quoteStatusFlow.length // Alternative states come after
}

function getInquiryStatusIndex(status: InquiryStatus): number {
  const idx = inquiryStatusFlow.findIndex(s => s.status === status)
  return idx >= 0 ? idx : inquiryStatusFlow.length
}

export function QuoteStatusTimeline({
  currentStatus,
  size = 'md',
  showLabels = false,
  className = '',
}: QuoteStatusTimelineProps) {
  const currentIndex = getStatusIndex(currentStatus)
  const isAlternativeState = quoteAlternativeStates.some(s => s.status === currentStatus)
  const alternativeState = quoteAlternativeStates.find(s => s.status === currentStatus)

  const sizeClasses = {
    sm: { icon: 'w-4 h-4', dot: 'w-5 h-5', line: 'h-0.5', text: 'text-[10px]', gap: 'gap-1' },
    md: { icon: 'w-5 h-5', dot: 'w-6 h-6', line: 'h-0.5', text: 'text-xs', gap: 'gap-2' },
    lg: { icon: 'w-6 h-6', dot: 'w-8 h-8', line: 'h-1', text: 'text-sm', gap: 'gap-3' },
  }

  const sizes = sizeClasses[size]

  return (
    <div className={`flex items-center ${sizes.gap} ${className}`}>
      {quoteStatusFlow.map((step, index) => {
        const isCompleted = index < currentIndex && !isAlternativeState
        const isCurrent = index === currentIndex && !isAlternativeState
        const StepIcon = step.icon

        return (
          <div key={step.status} className="flex items-center">
            {/* Step dot/icon */}
            <div className="flex flex-col items-center">
              <div
                className={`
                  ${sizes.dot} rounded-full flex items-center justify-center transition-colors
                  ${isCompleted ? 'bg-green-500 text-white' : ''}
                  ${isCurrent ? 'bg-[#279989] text-white ring-2 ring-[#279989]/30' : ''}
                  ${!isCompleted && !isCurrent ? 'bg-slate-200 text-slate-400' : ''}
                `}
              >
                {isCompleted ? (
                  <Check className={sizes.icon} strokeWidth={3} />
                ) : (
                  <StepIcon className={sizes.icon} strokeWidth={isCurrent ? 2.5 : 2} />
                )}
              </div>
              {showLabels && (
                <span
                  className={`
                    ${sizes.text} mt-1 whitespace-nowrap
                    ${isCurrent ? 'font-medium text-slate-900' : 'text-slate-500'}
                  `}
                >
                  {step.label}
                </span>
              )}
            </div>

            {/* Connector line (not after last item) */}
            {index < quoteStatusFlow.length - 1 && (
              <div
                className={`
                  w-6 ${sizes.line} mx-1
                  ${index < currentIndex && !isAlternativeState ? 'bg-green-500' : 'bg-slate-200'}
                `}
              />
            )}
          </div>
        )
      })}

      {/* Alternative state indicator */}
      {isAlternativeState && alternativeState && (
        <>
          <div className={`w-4 ${sizes.line} bg-slate-200`} />
          <div className="flex flex-col items-center">
            <div
              className={`
                ${sizes.dot} rounded-full flex items-center justify-center
                ${alternativeState.color} bg-slate-100
              `}
            >
              <alternativeState.icon className={sizes.icon} />
            </div>
            {showLabels && (
              <span className={`${sizes.text} mt-1 whitespace-nowrap ${alternativeState.color}`}>
                {alternativeState.label}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export function InquiryStatusTimeline({
  currentStatus,
  size = 'md',
  showLabels = false,
  className = '',
}: InquiryStatusTimelineProps) {
  const currentIndex = getInquiryStatusIndex(currentStatus)
  const isAlternativeState = inquiryAlternativeStates.some(s => s.status === currentStatus)
  const alternativeState = inquiryAlternativeStates.find(s => s.status === currentStatus)

  const sizeClasses = {
    sm: { icon: 'w-4 h-4', dot: 'w-5 h-5', line: 'h-0.5', text: 'text-[10px]', gap: 'gap-1' },
    md: { icon: 'w-5 h-5', dot: 'w-6 h-6', line: 'h-0.5', text: 'text-xs', gap: 'gap-2' },
    lg: { icon: 'w-6 h-6', dot: 'w-8 h-8', line: 'h-1', text: 'text-sm', gap: 'gap-3' },
  }

  const sizes = sizeClasses[size]

  return (
    <div className={`flex items-center ${sizes.gap} ${className}`}>
      {inquiryStatusFlow.map((step, index) => {
        const isCompleted = index < currentIndex && !isAlternativeState
        const isCurrent = index === currentIndex && !isAlternativeState
        const StepIcon = step.icon

        return (
          <div key={step.status} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`
                  ${sizes.dot} rounded-full flex items-center justify-center transition-colors
                  ${isCompleted ? 'bg-green-500 text-white' : ''}
                  ${isCurrent ? 'bg-[#279989] text-white ring-2 ring-[#279989]/30' : ''}
                  ${!isCompleted && !isCurrent ? 'bg-slate-200 text-slate-400' : ''}
                `}
              >
                {isCompleted ? (
                  <Check className={sizes.icon} strokeWidth={3} />
                ) : (
                  <StepIcon className={sizes.icon} strokeWidth={isCurrent ? 2.5 : 2} />
                )}
              </div>
              {showLabels && (
                <span
                  className={`
                    ${sizes.text} mt-1 whitespace-nowrap
                    ${isCurrent ? 'font-medium text-slate-900' : 'text-slate-500'}
                  `}
                >
                  {step.label}
                </span>
              )}
            </div>

            {index < inquiryStatusFlow.length - 1 && (
              <div
                className={`
                  w-6 ${sizes.line} mx-1
                  ${index < currentIndex && !isAlternativeState ? 'bg-green-500' : 'bg-slate-200'}
                `}
              />
            )}
          </div>
        )
      })}

      {isAlternativeState && alternativeState && (
        <>
          <div className={`w-4 ${sizes.line} bg-slate-200`} />
          <div className="flex flex-col items-center">
            <div
              className={`
                ${sizes.dot} rounded-full flex items-center justify-center
                ${alternativeState.color} bg-slate-100
              `}
            >
              <alternativeState.icon className={sizes.icon} />
            </div>
            {showLabels && (
              <span className={`${sizes.text} mt-1 whitespace-nowrap ${alternativeState.color}`}>
                {alternativeState.label}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  )
}

// Status badge component
interface StatusBadgeProps {
  status: QuoteStatus | InquiryStatus
  type: 'quote' | 'inquiry'
  size?: 'sm' | 'md'
}

const quoteStatusColors: Record<QuoteStatus, string> = {
  draft: 'bg-slate-100 text-slate-700',
  pending: 'bg-amber-100 text-amber-700',
  sent: 'bg-blue-100 text-blue-700',
  viewed: 'bg-purple-100 text-purple-700',
  accepted: 'bg-green-100 text-green-700',
  rejected: 'bg-red-100 text-red-700',
  expired: 'bg-amber-100 text-amber-700',
  revised: 'bg-blue-100 text-blue-700',
}

const quoteStatusLabels: Record<QuoteStatus, string> = {
  draft: 'Mustand',
  pending: 'Ootel',
  sent: 'Saadetud',
  viewed: 'Vaadatud',
  accepted: 'Kinnitatud',
  rejected: 'Tagasi lükatud',
  expired: 'Aegunud',
  revised: 'Uuendatud',
}

const inquiryStatusColors: Record<InquiryStatus, string> = {
  new: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-amber-100 text-amber-700',
  quoted: 'bg-purple-100 text-purple-700',
  won: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
  cancelled: 'bg-slate-100 text-slate-500',
}

const inquiryStatusLabels: Record<InquiryStatus, string> = {
  new: 'Uus',
  in_progress: 'Töös',
  quoted: 'Pakkumine tehtud',
  won: 'Võidetud',
  lost: 'Kaotatud',
  cancelled: 'Tühistatud',
}

export function StatusBadge({ status, type, size = 'md' }: StatusBadgeProps) {
  const colors = type === 'quote'
    ? quoteStatusColors[status as QuoteStatus]
    : inquiryStatusColors[status as InquiryStatus]

  const label = type === 'quote'
    ? quoteStatusLabels[status as QuoteStatus]
    : inquiryStatusLabels[status as InquiryStatus]

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        ${colors}
        ${size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-sm'}
      `}
    >
      {label}
    </span>
  )
}
