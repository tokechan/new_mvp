'use client'

import { BellRing, BellOff, AlertCircle, CheckCircle2, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { ensurePushSubscription } from '@/features/notifications/services/pushSubscriptionService'
import { useState, useEffect } from 'react'

interface PushNotificationPromptProps {
  onComplete: () => void
  onSkip: () => void
}

const isPushEnabled =
  process.env.NEXT_PUBLIC_ENABLE_PWA === 'true' &&
  process.env.NEXT_PUBLIC_ENABLE_PUSH_SUBSCRIPTIONS === 'true'

/**
 * ステップ3: プッシュ通知設定コンポーネント
 * ユーザーにプッシュ通知の有効化を案内
 */
export default function PushNotificationPrompt({ onComplete, onSkip }: PushNotificationPromptProps) {
  const [status, setStatus] = useState<
    'idle' | 'loading' | 'subscribed' | 'permission-denied' | 'unsupported' | 'error'
  >('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [isEnabled, setIsEnabled] = useState(false)

  // 初期状態チェック
  useEffect(() => {
    if (!isPushEnabled) {
      setStatus('unsupported')
      return
    }

    const checkStatus = async () => {
      if (typeof window === 'undefined') return
      if (!('Notification' in window) || !('serviceWorker' in navigator) || !('PushManager' in window)) {
        setStatus('unsupported')
        return
      }

      try {
        const registration = await navigator.serviceWorker.ready
        const subscription = await registration.pushManager.getSubscription()

        if (Notification.permission === 'denied') {
          setStatus('permission-denied')
          return
        }

        if (subscription) {
          setStatus('subscribed')
          setIsEnabled(true)
        }
      } catch (error) {
        console.error('Failed to check push subscription status', error)
      }
    }

    checkStatus()
  }, [])

  // 通知を有効化
  const handleEnable = async () => {
    if (!isPushEnabled) {
      setMessage('プッシュ通知機能は現在無効化されています。')
      setStatus('unsupported')
      return
    }

    setStatus('loading')
    setMessage(null)

    try {
      const result = await ensurePushSubscription()

      if (result.state === 'unsupported') {
        setStatus('unsupported')
        setMessage(result.message ?? 'この端末ではプッシュ通知を利用できません。')
        return
      }

      if (result.state === 'permission-denied') {
        setStatus('permission-denied')
        setMessage(
          '通知許可が必要です。ブラウザの設定から通知を許可してください。'
        )
        return
      }

      if (result.state === 'error') {
        setStatus('error')
        setMessage(result.message ?? 'プッシュ通知の有効化に失敗しました。')
        return
      }

      // 成功
      setStatus('subscribed')
      setIsEnabled(true)
      setMessage(result.message ?? 'プッシュ通知を有効にしました。')
    } catch (error) {
      console.error('Failed to enable push notifications', error)
      setStatus('error')
      setMessage('プッシュ通知の有効化に失敗しました。再度お試しください。')
    }
  }

  // 非対応ブラウザ
  if (status === 'unsupported') {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-10 h-10 text-muted-foreground" aria-hidden="true" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">
            プッシュ通知を利用できません
          </h2>
          <p className="text-muted-foreground">
            {message || 'この端末ではプッシュ通知機能をご利用いただけません。'}
          </p>
        </div>
        <Card className="border-muted">
          <CardContent className="pt-6">
            <p className="text-center text-sm text-muted-foreground">
              プッシュ通知を使用するには、PWA としてインストールし、通知を許可する必要があります。
            </p>
          </CardContent>
        </Card>
        <div className="flex justify-center">
          <Button onClick={onComplete} size="lg">
            完了
          </Button>
        </div>
      </div>
    )
  }

  // 通知拒否済み
  if (status === 'permission-denied') {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto">
            <BellOff className="w-10 h-10 text-destructive" aria-hidden="true" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">
            通知が拒否されています
          </h2>
          <p className="text-muted-foreground">
            {message || '通知許可が必要です。'}
          </p>
        </div>
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <p className="text-sm font-medium">通知を有効にする方法：</p>
              <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                <li>ブラウザの設定を開く</li>
                <li>サイト設定を選択</li>
                <li>通知を許可に変更</li>
                <li>この画面を更新</li>
              </ol>
            </div>
          </CardContent>
        </Card>
        <div className="flex justify-center">
          <Button onClick={onComplete} size="lg" variant="outline">
            後で設定する
          </Button>
        </div>
      </div>
    )
  }

  // 有効化済み
  if (status === 'subscribed' && isEnabled) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" aria-hidden="true" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">通知が有効になりました</h2>
          <p className="text-muted-foreground">
            {message || 'パートナーからのアクション通知を受け取れます'}
          </p>
        </div>
        <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="w-5 h-5 text-green-600 dark:text-green-400" aria-hidden="true" />
              通知を受け取れる内容
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" aria-hidden="true" />
                パートナーが家事を完了した時
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" aria-hidden="true" />
                ありがとうメッセージを受信した時
              </li>
            </ul>
          </CardContent>
        </Card>
        <div className="flex justify-center">
          <Button onClick={onComplete} size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
            完了
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Button>
        </div>
      </div>
    )
  }

  // デフォルト画面（有効化前）
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* ヘッダー */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold text-foreground">
          通知を受け取って、アクションを見逃さない
        </h2>
        <p className="text-muted-foreground">
          パートナーが家事を完了した時や、ありがとうメッセージを受信した時に通知を受け取れます
        </p>
      </div>

      {/* 説明カード */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="w-6 h-6 text-primary" aria-hidden="true" />
            通知のメリット
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="font-medium">リアルタイム通知</p>
                <p className="text-sm text-muted-foreground">
                  アプリを閉じていても、重要なアクションを見逃しません
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="font-medium">パートナーとの連携</p>
                <p className="text-sm text-muted-foreground">
                  家事の完了や感謝の気持ちをすばやく共有できます
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="font-medium">簡単に管理</p>
                <p className="text-sm text-muted-foreground">
                  いつでも設定画面から通知をオン/オフできます
                </p>
              </div>
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* エラーメッセージ */}
      {message && status === 'error' && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-sm text-destructive">{message}</p>
        </div>
      )}

      {/* アクションボタン */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button
          onClick={handleEnable}
          size="lg"
          disabled={status === 'loading'}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
              処理中...
            </>
          ) : (
            <>
              <BellRing className="w-4 h-4 mr-2" aria-hidden="true" />
              通知を有効にする
            </>
          )}
        </Button>
        <Button onClick={onSkip} variant="ghost" size="lg" disabled={status === 'loading'}>
          後で設定する
        </Button>
      </div>

      {/* 追加情報 */}
      <div className="text-center">
        <p className="text-xs text-muted-foreground">
          iOS をご利用の場合は、PWA としてインストールが必要です
        </p>
      </div>
    </div>
  )
}

