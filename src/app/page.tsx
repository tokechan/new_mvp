'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import ChoresList from '@/components/ChoresList'
import NotificationCenter from '@/components/NotificationCenter'
import { Button } from '@/components/ui/Button'
import { profileService } from '@/services/profileService'
import { PartnerService } from '@/services/partnerService'
import { supabase } from '@/lib/supabase'
import { Bell, BellOff, BellRing, FileText, Loader2, LogOut } from 'lucide-react'
import FooterChoreInput from '@/components/FooterChoreInput'
import { ensurePushSubscription, disablePushSubscription } from '@/services/pushSubscriptionService'
import { useToast } from '@/components/ui/toast'

const pushFeatureEnabled =
  process.env.NEXT_PUBLIC_ENABLE_PWA === 'true' &&
  process.env.NEXT_PUBLIC_ENABLE_PUSH_SUBSCRIPTIONS === 'true'

type PushToggleStatus = 'checking' | 'enabled' | 'disabled' | 'unsupported' | 'error'

function PushNotificationToggle() {
  const { showToast } = useToast()
  const [status, setStatus] = useState<PushToggleStatus>('checking')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!pushFeatureEnabled) {
      return
    }

    let cancelled = false

    const detectStatus = async () => {
      if (typeof window === 'undefined') return
      if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        if (!cancelled) setStatus('unsupported')
        return
      }

      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()

        if (cancelled) return

        if (Notification.permission === 'denied') {
          setStatus('disabled')
          return
        }

        setStatus(subscription ? 'enabled' : 'disabled')
      } catch (error) {
        console.error('Failed to determine push subscription status', error)
        if (!cancelled) setStatus('error')
      }
    }

    detectStatus()

    return () => {
      cancelled = true
    }
  }, [])

  const handleToggle = async () => {
    if (!pushFeatureEnabled) {
      showToast({ message: 'プッシュ通知機能は現在無効です。', variant: 'warning' })
      return
    }

    if (busy || status === 'checking') {
      return
    }

    setBusy(true)
    try {
      if (status === 'enabled') {
        const result = await disablePushSubscription()

        if (result.state === 'unsupported') {
          setStatus('unsupported')
          showToast({ message: result.message ?? 'この端末では通知を利用できません。', variant: 'warning' })
          return
        }

        if (result.state === 'error') {
          setStatus('error')
          showToast({
            message: result.message ?? '通知をオフにできませんでした。時間を置いて再試行してください。',
            variant: 'error',
          })
          return
        }

        setStatus('disabled')
        showToast({
          message: result.message ?? '通知をオフにしました。',
          variant: 'info',
        })
        return
      }

      const result = await ensurePushSubscription()

      if (result.state === 'unsupported') {
        setStatus('unsupported')
        showToast({ message: result.message ?? 'この端末では通知を利用できません。', variant: 'warning' })
        return
      }

      if (result.state === 'permission-denied') {
        setStatus('disabled')
        showToast({ message: result.message ?? '通知許可をオンにしてください。', variant: 'warning' })
        return
      }

      if (result.state === 'error') {
        setStatus('error')
        showToast({
          message: result.message ?? '通知をオンにできませんでした。時間を置いて再試行してください。',
          variant: 'error',
        })
        return
      }

      setStatus('enabled')
      showToast({
        message: result.message ?? '通知をオンにしました。',
        variant: 'success',
      })
    } catch (error) {
      console.error('Failed to toggle push notifications', error)
      setStatus('error')
      showToast({
        message: error instanceof Error ? error.message : '通知設定の更新に失敗しました。',
        variant: 'error',
      })
    } finally {
      setBusy(false)
    }
  }

  if (!pushFeatureEnabled) {
    return null
  }

  const isEnabled = status === 'enabled'
  const isDisabled = status === 'disabled'
  const label =
    status === 'checking'
      ? '確認中…'
      : status === 'unsupported'
        ? '通知不可'
        : isEnabled
          ? '通知 ON'
          : isDisabled
            ? '通知 OFF'
            : '通知 再設定'

  const icon = busy ? (
    <Loader2 className="w-4 h-4 mr-1 animate-spin" aria-hidden="true" />
  ) : isEnabled ? (
    <BellRing className="w-4 h-4 mr-1" aria-hidden="true" />
  ) : (
    <BellOff className="w-4 h-4 mr-1" aria-hidden="true" />
  )

  return (
    <Button
      onClick={handleToggle}
      variant={isEnabled ? 'default' : 'outline'}
      size="sm"
      aria-pressed={isEnabled}
      disabled={busy || status === 'unsupported'}
      className={isEnabled ? 'bg-primary text-white hover:bg-primary/90' : 'bg-white text-primary border-primary/40 hover:bg-primary/10'}
    >
      {icon}
      <span className="whitespace-nowrap">{label}</span>
    </Button>
  )
}

export default function Home() {
  const { user, loading, signOut } = useAuth()
  const { addNotification } = useNotifications()
  const router = useRouter()
  const [displayName, setDisplayName] = useState<string>('')
  const [thanksTesting, setThanksTesting] = useState(false)
  const [thanksTestResult, setThanksTestResult] = useState<string | null>(null)

  const fetchDisplayName = useCallback(async () => {
    if (!user) return
    try {
      const profile = await profileService.getProfile(user.id)
      setDisplayName(profile?.display_name || '')
    } catch (error) {
      console.error('プロフィール取得に失敗しました:', error)
    }
  }, [user])

  useEffect(() => {
    if (!user && !loading) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user) {
      fetchDisplayName()
    }
  }, [user, fetchDisplayName])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg">読み込み中...</div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-28 sm:pt-12 sm:pb-12">
        {/* ユーザー情報とアクション */}
        <div className="bg-card rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex items-baseline gap-2">
              <p className="text-sm text-gray-600">こんにちは</p>
              <p className="font-medium text-gray-900 truncate">{displayName || user.email?.split('@')[0] || 'ユーザー'}さん</p>
            </div>
            <div className="flex items-center gap-2">
              <PushNotificationToggle />
              <Button 
                onClick={() => {
                  addNotification({
                    title: 'テスト通知',
                    message: 'これはテスト用の通知です',
                    type: 'info',
                    source: 'partner'
                  })
                }}
                variant="outline"
                size="sm"
                title="通知センターの表示テスト"
                className="bg-primary text-white hover:bg-primary/90"
              >
                <Bell className="w-4 h-4 mr-1" />
                通知テスト
              </Button>
              <Button 
                onClick={async () => {
                  try {
                    await signOut()
                    router.push('/auth/signin')
                  } catch (error) {
                    console.error('ログアウトに失敗しました:', error)
                  }
                }}
                variant="outline"
                size="sm"
                title="ログアウト"
                className="bg-primary text-white hover:bg-primary/90"
              >
                <LogOut className="w-4 h-4 mr-1" />
                ログアウト
              </Button>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground mb-2 flex items-center">
            <FileText className="w-6 h-6 mr-2 text-primary" aria-hidden="true" />
            YOUDO List
          </h1>
        </div>

 

        {/* 家事管理メインコンテンツ */}
        <ChoresList />
      </div>
      <FooterChoreInput />
    </>
  )
}
