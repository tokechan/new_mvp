'use client'

import { Check, Circle } from 'lucide-react'
import { OnboardingStep } from '@/hooks/useOnboarding'
import { cn } from '@/lib/utils'

interface OnboardingStepperProps {
  currentStep: OnboardingStep
}

const steps = [
  { number: 1, title: '機能紹介' },
  { number: 2, title: 'PWA インストール' },
  { number: 3, title: '通知設定' },
] as const

/**
 * オンボーディングステップインジケーター
 * 現在のステップを視覚的に表示
 */
export default function OnboardingStepper({ currentStep }: OnboardingStepperProps) {
  return (
    <div className="mb-12">
      <div className="flex items-center w-full">
        {steps.map((step, index) => {
          const isCompleted = step.number < currentStep
          const isCurrent = step.number === currentStep
          const isLast = index === steps.length - 1

          return (
            <div key={step.number} className="flex items-center flex-1 last:flex-none">
              {/* ステップアイコンとタイトル */}
              <div className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    'relative flex items-center justify-center w-10 h-10 rounded-full transition-colors',
                    isCompleted
                      ? 'bg-primary text-primary-foreground'
                      : isCurrent
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground'
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" aria-hidden="true" />
                  ) : (
                    <Circle className="w-5 h-5" fill="currentColor" aria-hidden="true" />
                  )}
                  <span className="sr-only">
                    {isCompleted
                      ? `${step.title}を完了`
                      : isCurrent
                        ? `現在: ${step.title}`
                        : step.title}
                  </span>
                </div>
                <span
                  className={cn(
                    'mt-2 text-xs font-medium transition-colors',
                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {step.title}
                </span>
              </div>

              {/* ステップ間の線 */}
              {!isLast && (
                <div
                  className={cn(
                    'flex-1 h-0.5 mx-2 transition-colors',
                    isCompleted ? 'bg-primary' : 'bg-muted'
                  )}
                  aria-hidden="true"
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

