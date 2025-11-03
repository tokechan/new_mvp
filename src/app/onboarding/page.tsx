'use client'

import { useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { useOnboarding } from '@/features/onboarding/hooks/useOnboarding'
import OnboardingStepper from '@/features/onboarding/components/OnboardingStepper'
import FeatureIntroduction from '@/features/onboarding/components/FeatureIntroduction'
import PwaInstallPrompt from '@/features/onboarding/components/PwaInstallPrompt'
import PushNotificationPrompt from '@/features/onboarding/components/PushNotificationPrompt'
import { Button } from '@/shared/ui/Button'
import { CheckCircle } from 'lucide-react'

/**
 * オンボーディングページ
 * 新規ユーザー向けの機能紹介・設定ガイド
 */
export default function OnboardingPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { currentStep, nextStep, completeOnboarding, skipOnboarding } = useOnboarding()

  // 認証チェック: 未認証の場合はログインページへリダイレクト
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  // ローディング状態
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    )
  }

  // 未認証の場合は何も表示しない（リダイレクト処理中）
  if (!user) {
    return null
  }

  // 完了画面（すべてのステップを通過した場合）
  if (currentStep > 3) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-6 animate-in fade-in duration-500">
          <CheckCircle className="w-16 h-16 mx-auto text-primary" aria-hidden="true" />
          <h2 className="text-3xl font-bold text-foreground">セットアップ完了！</h2>
          <p className="text-muted-foreground">YOUDO の準備が整いました</p>
          <Button onClick={completeOnboarding} size="lg">
            アプリを始める
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background w-full -mx-4 sm:-mx-6 lg:-mx-8">
      {/* 専用レイアウト（Navigation/Footer なし） */}
      <div className="max-w-2xl mx-auto px-4 py-12 w-full">
        <OnboardingStepper currentStep={currentStep} />

        {/* Step 1: 機能紹介 */}
        {currentStep === 1 && (
          <FeatureIntroduction onNext={nextStep} onSkip={completeOnboarding} />
        )}

        {/* Step 2: PWA インストール案内 */}
        {currentStep === 2 && (
          <PwaInstallPrompt onNext={nextStep} onSkip={completeOnboarding} />
        )}

        {/* Step 3: プッシュ通知設定 */}
        {currentStep === 3 && (
          <PushNotificationPrompt onComplete={completeOnboarding} onSkip={completeOnboarding} />
        )}
      </div>
    </div>
  )
}

