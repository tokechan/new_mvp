'use client'

import { useState } from 'react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/Input'
import { Laptop, Moon, Sun } from 'lucide-react'
import { ensurePushSubscription, disablePushSubscription } from '@/services/pushSubscriptionService'

export default function SettingsPage() {
  const [timezone, setTimezone] = useState('Asia/Tokyo')
  const [language, setLanguage] = useState('ja')
  const { theme, resolvedTheme, setTheme } = useTheme()
  const [pushState, setPushState] = useState<
    'idle' | 'loading' | 'subscribed' | 'already' | 'disabled' | 'error' | 'unsubscribed'
  >('idle')
  const [pushMessage, setPushMessage] = useState<string | null>(null)

  const pushFeatureEnabled =
    process.env.NEXT_PUBLIC_ENABLE_PWA === 'true' &&
    process.env.NEXT_PUBLIC_ENABLE_PUSH_SUBSCRIPTIONS === 'true'

  const isSelected = (key: 'light' | 'dark' | 'system') => theme === key

  const handleEnablePush = async () => {
    if (!pushFeatureEnabled) {
      setPushState('disabled')
      setPushMessage('プッシュ通知は現在無効化されています。')
      return
    }

    setPushState('loading')
    setPushMessage(null)

    try {
      const result = await ensurePushSubscription()

      if (result.state === 'unsupported') {
        setPushState('disabled')
        setPushMessage(result.message ?? 'この端末ではプッシュ通知を利用できません。')
        return
      }

      if (result.state === 'permission-denied') {
        setPushState('error')
        setPushMessage(result.message ?? '通知許可が必要です。')
        return
      }

      if (result.state === 'already-subscribed') {
        setPushState('already')
        setPushMessage('プッシュ通知は既に有効です。')
        return
      }

      if (result.state === 'error') {
        setPushState('error')
        setPushMessage(result.message ?? 'プッシュ通知の有効化に失敗しました。')
        return
      }

      setPushState('subscribed')
      setPushMessage('プッシュ通知を有効にしました。')
    } catch (error) {
      console.error('Failed to enable push notifications', error)
      setPushState('error')
      const fallbackMessage =
        error instanceof Error
          ? error.message
          : 'プッシュ通知の有効化に失敗しました。再度お試しください。'
      setPushMessage(fallbackMessage)
    }
  }

  const handleDisablePush = async () => {
    if (!pushFeatureEnabled) {
      setPushState('disabled')
      setPushMessage('プッシュ通知は現在無効化されています。')
      return
    }

    setPushState('loading')
    setPushMessage(null)

    const result = await disablePushSubscription()
    if (result.state === 'unsupported') {
      setPushState('disabled')
      setPushMessage(result.message ?? 'この端末ではプッシュ通知を利用できません。')
      return
    }

    if (result.state === 'already-unsubscribed') {
      setPushState('unsubscribed')
      setPushMessage(result.message ?? 'プッシュ通知は既にオフになっています。')
      return
    }

    if (result.state === 'error') {
      setPushState('error')
      setPushMessage(result.message ?? 'プッシュ通知の無効化に失敗しました。')
      return
    }

    setPushState('unsubscribed')
    setPushMessage(result.message ?? 'プッシュ通知をオフにしました。')
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6">
        <h1 className="text-2xl font-bold text-foreground">設定</h1>
        <p className="mt-1 text-sm text-muted-foreground">後で詳細を拡充予定のプレースホルダー画面です。</p>

        <div className="mt-6 grid gap-4">
          {/* 基本設定 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">基本設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="timezone" className="block text-sm text-muted-foreground mb-1">タイムゾーン</Label>
                <Input id="timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="language" className="block text-sm text-muted-foreground mb-1">言語</Label>
                <Input id="language" value={language} onChange={(e) => setLanguage(e.target.value)} />
              </div>
              <div>
                <Button className="mt-2">保存</Button>
              </div>
            </CardContent>
          </Card>

          {/* 表示設定：テーマ切替（画面下部） */}
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">表示設定</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground">テーマ</div>
                <div
                  role="radiogroup"
                  aria-label="テーマ切替"
                  className="grid grid-cols-3 gap-2"
                >
                  <button
                    role="radio"
                    aria-checked={isSelected('light')}
                    onClick={() => setTheme('light')}
                    className={`inline-flex flex-col items-center justify-center gap-1 sm:gap-2 px-3 py-3 rounded-md border border-border text-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${isSelected('light') ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-secondary/80'}`}
                  >
                    <Sun className="w-5 h-5 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">ライト</span>
                  </button>

                  <button
                    role="radio"
                    aria-checked={isSelected('dark')}
                    onClick={() => setTheme('dark')}
                    className={`inline-flex flex-col items-center justify-center gap-1 sm:gap-2 px-3 py-3 rounded-md border border-border text-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${isSelected('dark') ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-secondary/80'}`}
                  >
                    <Moon className="w-5 h-5 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">ダーク</span>
                  </button>

                  <button
                    role="radio"
                    aria-checked={isSelected('system')}
                    onClick={() => setTheme('system')}
                    className={`inline-flex flex-col items-center justify-center gap-1 sm:gap-2 px-3 py-3 rounded-md border border-border text-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${isSelected('system') ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-secondary/80'}`}
                  >
                    <Laptop className="w-5 h-5 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm">システム</span>
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">現在の見た目: <span className="font-medium text-foreground">{resolvedTheme}</span></p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-foreground">通知設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                プッシュ通知を受け取るには、ホーム画面に追加したうえで通知を許可する必要があります。
              </p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                <Button
                  onClick={handleEnablePush}
                  disabled={pushState === 'loading' || (!pushFeatureEnabled && pushState !== 'disabled')}
                  className="sm:flex-1"
                >
                  {pushState === 'loading' ? '有効化中…' : 'プッシュ通知を有効にする'}
                </Button>
                <Button
                  variant="secondary"
                  onClick={handleDisablePush}
                  disabled={pushState === 'loading' || !pushFeatureEnabled}
                  className="sm:flex-1 border border-border hover:bg-secondary/80"
                >
                  {pushState === 'loading' ? '処理中…' : 'プッシュ通知を無効にする'}
                </Button>
              </div>
              {pushMessage && (
                <p
                  className={`text-sm ${
                    pushState === 'subscribed' || pushState === 'already' || pushState === 'unsubscribed'
                      ? 'text-emerald-600'
                      : 'text-destructive'
                  }`}
                >
                  {pushMessage}
                </p>
              )}
              {!pushFeatureEnabled && (
                <p className="text-xs text-muted-foreground">
                  現在プッシュ通知機能は無効化されています。環境変数 `NEXT_PUBLIC_ENABLE_PUSH_SUBSCRIPTIONS` を有効に
                  してから利用してください。
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
