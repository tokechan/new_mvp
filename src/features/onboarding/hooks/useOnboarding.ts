'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { saveOnboardingComplete, isOnboardingComplete } from '@/utils/onboardingStorage'

export type OnboardingStep = 1 | 2 | 3

interface UseOnboardingReturn {
  currentStep: OnboardingStep
  nextStep: () => void
  skipOnboarding: () => void
  completeOnboarding: () => void
  isComplete: boolean
  isSkipped: boolean
}

/**
 * オンボーディングフローの状態管理Hook
 */
export function useOnboarding(): UseOnboardingReturn {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1)
  const [isComplete, setIsComplete] = useState(false)
  const [isSkipped, setIsSkipped] = useState(false)

  // 既に完了しているかチェック
  useEffect(() => {
    if (isOnboardingComplete()) {
      // 完了済みの場合はメイン画面へリダイレクト
      router.push('/app')
    }
  }, [router])

  /**
   * 次のステップへ進む
   */
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep((step) => (step + 1) as OnboardingStep)
    } else {
      // 最後のステップなら完了処理
      completeOnboarding()
    }
  }

  /**
   * オンボーディング全体をスキップ
   */
  const skipOnboarding = () => {
    saveOnboardingComplete()
    setIsSkipped(true)
    router.push('/app')
  }

  /**
   * オンボーディング完了
   */
  const completeOnboarding = () => {
    saveOnboardingComplete()
    setIsComplete(true)
    router.push('/app')
  }

  return {
    currentStep,
    nextStep,
    skipOnboarding,
    completeOnboarding,
    isComplete,
    isSkipped,
  }
}

