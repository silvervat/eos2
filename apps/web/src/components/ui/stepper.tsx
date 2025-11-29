'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { Button } from '@rivest/ui'
import { Check, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

// Types
export interface Step {
  id: string
  title: string
  description?: string
  icon?: ReactNode
  optional?: boolean
  validate?: () => boolean | Promise<boolean>
}

interface StepperContextValue {
  steps: Step[]
  currentStep: number
  isFirstStep: boolean
  isLastStep: boolean
  goToStep: (step: number) => void
  nextStep: () => Promise<boolean>
  prevStep: () => void
  isStepComplete: (stepIndex: number) => boolean
  isStepActive: (stepIndex: number) => boolean
  completedSteps: Set<number>
}

const StepperContext = createContext<StepperContextValue | null>(null)

export function useStepper() {
  const context = useContext(StepperContext)
  if (!context) {
    throw new Error('useStepper must be used within a StepperProvider')
  }
  return context
}

// Stepper Provider
interface StepperProviderProps {
  steps: Step[]
  initialStep?: number
  onComplete?: () => void | Promise<void>
  children: ReactNode
}

export function StepperProvider({
  steps,
  initialStep = 0,
  onComplete,
  children,
}: StepperProviderProps) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set())

  const isFirstStep = currentStep === 0
  const isLastStep = currentStep === steps.length - 1

  const goToStep = useCallback(
    (step: number) => {
      if (step >= 0 && step < steps.length) {
        setCurrentStep(step)
      }
    },
    [steps.length]
  )

  const nextStep = useCallback(async () => {
    const step = steps[currentStep]

    // Validate current step if validation exists
    if (step.validate) {
      const isValid = await step.validate()
      if (!isValid) {
        return false
      }
    }

    // Mark current step as complete
    setCompletedSteps((prev) => new Set([...prev, currentStep]))

    if (isLastStep) {
      // Call onComplete when finishing last step
      if (onComplete) {
        await onComplete()
      }
      return true
    }

    setCurrentStep((prev) => prev + 1)
    return true
  }, [currentStep, steps, isLastStep, onComplete])

  const prevStep = useCallback(() => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1)
    }
  }, [isFirstStep])

  const isStepComplete = useCallback(
    (stepIndex: number) => completedSteps.has(stepIndex),
    [completedSteps]
  )

  const isStepActive = useCallback(
    (stepIndex: number) => stepIndex === currentStep,
    [currentStep]
  )

  return (
    <StepperContext.Provider
      value={{
        steps,
        currentStep,
        isFirstStep,
        isLastStep,
        goToStep,
        nextStep,
        prevStep,
        isStepComplete,
        isStepActive,
        completedSteps,
      }}
    >
      {children}
    </StepperContext.Provider>
  )
}

// Stepper Header - Shows steps visually
interface StepperHeaderProps {
  className?: string
  variant?: 'horizontal' | 'vertical'
}

export function StepperHeader({
  className = '',
  variant = 'horizontal',
}: StepperHeaderProps) {
  const { steps, currentStep, isStepComplete, goToStep, completedSteps } =
    useStepper()

  if (variant === 'vertical') {
    return (
      <div className={`space-y-4 ${className}`}>
        {steps.map((step, index) => {
          const isComplete = isStepComplete(index)
          const isActive = index === currentStep
          const isPast = index < currentStep
          const canNavigate = isPast || isComplete

          return (
            <button
              key={step.id}
              onClick={() => canNavigate && goToStep(index)}
              disabled={!canNavigate}
              className={`flex items-start gap-4 w-full text-left ${
                canNavigate ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                    isComplete
                      ? 'bg-[#279989] text-white'
                      : isActive
                      ? 'bg-[#279989] text-white ring-4 ring-[#279989]/20'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {isComplete ? (
                    <Check className="w-5 h-5" />
                  ) : step.icon ? (
                    step.icon
                  ) : (
                    index + 1
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={`w-0.5 h-12 mt-2 ${
                      isComplete ? 'bg-[#279989]' : 'bg-slate-200'
                    }`}
                  />
                )}
              </div>

              {/* Step content */}
              <div className="pt-1">
                <p
                  className={`font-medium ${
                    isActive ? 'text-slate-900' : 'text-slate-600'
                  }`}
                >
                  {step.title}
                  {step.optional && (
                    <span className="ml-2 text-xs text-slate-400">
                      (valikuline)
                    </span>
                  )}
                </p>
                {step.description && (
                  <p className="text-sm text-slate-500 mt-0.5">
                    {step.description}
                  </p>
                )}
              </div>
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className={`flex items-center ${className}`}>
      {steps.map((step, index) => {
        const isComplete = isStepComplete(index)
        const isActive = index === currentStep
        const isPast = index < currentStep
        const canNavigate = isPast || isComplete

        return (
          <div key={step.id} className="flex items-center flex-1 last:flex-initial">
            <button
              onClick={() => canNavigate && goToStep(index)}
              disabled={!canNavigate}
              className={`flex flex-col items-center ${
                canNavigate ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              {/* Step circle */}
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  isComplete
                    ? 'bg-[#279989] text-white'
                    : isActive
                    ? 'bg-[#279989] text-white ring-4 ring-[#279989]/20'
                    : 'bg-slate-200 text-slate-500'
                }`}
              >
                {isComplete ? (
                  <Check className="w-5 h-5" />
                ) : step.icon ? (
                  step.icon
                ) : (
                  index + 1
                )}
              </div>

              {/* Step label */}
              <div className="mt-2 text-center">
                <p
                  className={`text-sm font-medium ${
                    isActive ? 'text-slate-900' : 'text-slate-600'
                  }`}
                >
                  {step.title}
                </p>
                {step.optional && (
                  <p className="text-xs text-slate-400">Valikuline</p>
                )}
              </div>
            </button>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-4 ${
                  isComplete ? 'bg-[#279989]' : 'bg-slate-200'
                }`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// Stepper Content - Renders current step content
interface StepperContentProps {
  children: ReactNode[]
  className?: string
}

export function StepperContent({ children, className = '' }: StepperContentProps) {
  const { currentStep } = useStepper()

  return <div className={className}>{children[currentStep]}</div>
}

// Stepper Footer - Navigation buttons
interface StepperFooterProps {
  className?: string
  nextLabel?: string
  prevLabel?: string
  finishLabel?: string
  showPrev?: boolean
  onCancel?: () => void
  cancelLabel?: string
  loading?: boolean
}

export function StepperFooter({
  className = '',
  nextLabel = 'Edasi',
  prevLabel = 'Tagasi',
  finishLabel = 'Lõpeta',
  showPrev = true,
  onCancel,
  cancelLabel = 'Tühista',
  loading = false,
}: StepperFooterProps) {
  const { isFirstStep, isLastStep, nextStep, prevStep } = useStepper()
  const [isLoading, setIsLoading] = useState(false)

  const handleNext = async () => {
    setIsLoading(true)
    try {
      await nextStep()
    } finally {
      setIsLoading(false)
    }
  }

  const showLoading = loading || isLoading

  return (
    <div className={`flex items-center justify-between ${className}`}>
      <div className="flex items-center gap-3">
        {onCancel && (
          <Button variant="outline" onClick={onCancel} disabled={showLoading}>
            {cancelLabel}
          </Button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {showPrev && !isFirstStep && (
          <Button variant="outline" onClick={prevStep} disabled={showLoading}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            {prevLabel}
          </Button>
        )}

        <Button
          onClick={handleNext}
          disabled={showLoading}
          className="bg-[#279989] hover:bg-[#1e7a6d]"
        >
          {showLoading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Laadin...
            </>
          ) : isLastStep ? (
            <>
              <Check className="w-4 h-4 mr-1" />
              {finishLabel}
            </>
          ) : (
            <>
              {nextLabel}
              <ChevronRight className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// Full Stepper Component (combines all parts)
interface StepperProps {
  steps: Step[]
  children: ReactNode[]
  onComplete?: () => void | Promise<void>
  onCancel?: () => void
  className?: string
  headerVariant?: 'horizontal' | 'vertical'
  initialStep?: number
}

export function Stepper({
  steps,
  children,
  onComplete,
  onCancel,
  className = '',
  headerVariant = 'horizontal',
  initialStep = 0,
}: StepperProps) {
  return (
    <StepperProvider steps={steps} onComplete={onComplete} initialStep={initialStep}>
      <div className={`space-y-8 ${className}`}>
        <StepperHeader variant={headerVariant} />

        <StepperContent className="min-h-[200px]">{children}</StepperContent>

        <StepperFooter onCancel={onCancel} className="pt-4 border-t" />
      </div>
    </StepperProvider>
  )
}

export default Stepper
