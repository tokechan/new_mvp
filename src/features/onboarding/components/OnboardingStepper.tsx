'use client'

import { Check, Circle } from 'lucide-react'
import { OnboardingStep } from '@/features/onboarding/hooks/useOnboarding'
import { cn } from '@/lib/utils'

interface OnboardingStepperProps {
  currentStep: OnboardingStep
}

const steps = [
  { number: 1, title: '機能紹介', shortTitle: '機能紹介' },
  { number: 2, title: 'PWA インストール', shortTitle: 'PWA' },
  { number: 3, title: '通知設定', shortTitle: '通知設定' },
] as const

/**
 * オンボーディングステップインジケーター
 * 現在のステップを視覚的に表示
 */
export default function OnboardingStepper({ currentStep }: OnboardingStepperProps) {
  return (
    <div className="mb-8 sm:mb-12 flex justify-center">
      <div className="flex items-center justify-center px-2 sm:px-0">
        {steps.map((step, index) => {
          const isCompleted = step.number < currentStep
          const isCurrent = step.number === currentStep
          const isLast = index === steps.length - 1

          return (
            <div key={step.number} className="flex items-center last:flex-none">
              {/* ステップアイコンとタイトル */}
              <div className="flex flex-col items-center min-w-0">
                <div
                  className="relative flex items-center justify-center w-10 h-10 rounded-full transition-colors bg-primary text-primary-foreground"
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
                    'mt-2 text-xs font-medium transition-colors text-center whitespace-nowrap',
                    isCurrent ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {/* 小さい画面では短縮タイトルを表示 */}
                  <span className="hidden sm:inline">{step.title}</span>
                  <span className="sm:hidden">{step.shortTitle}</span>
                </span>
              </div>

              {/* ステップ間の線 */}
              {!isLast && (
                <div
                  className="w-10 sm:w-16 h-0.5 mx-1 sm:mx-2 transition-colors bg-primary"
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

