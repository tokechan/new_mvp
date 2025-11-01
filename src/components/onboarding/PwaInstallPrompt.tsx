'use client'

import { Smartphone, Share2, Home, ArrowRight, CheckCircle2, SkipForward, Search } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { usePwaInstallPrompt } from '@/hooks/usePwaInstallPrompt'

interface PwaInstallPromptProps {
  onNext: () => void
  onSkip: () => void
}

/**
 * ステップ2: PWA インストール案内コンポーネント
 * iOS に特化した詳細な手順を表示
 */
export default function PwaInstallPrompt({ onNext, onSkip }: PwaInstallPromptProps) {
  const { status, isInstalled, platform } = usePwaInstallPrompt()

  // 既にインストール済みの場合
  if (isInstalled) {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" aria-hidden="true" />
          </div>
          <h2 className="text-3xl font-bold text-foreground">アプリがインストール済みです</h2>
          <p className="text-muted-foreground">
            YOUDO がホーム画面に追加されています
          </p>
        </div>
        <Button onClick={onNext} size="lg" className="w-full sm:w-auto mx-auto block">
          次へ
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Button>
      </div>
    )
  }

  // iOS のインストール手順（詳細版）
  if (platform === 'ios') {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        {/* ヘッダー */}
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold text-foreground">ホーム画面に追加して、通知を受け取ろう</h2>
          <p className="text-muted-foreground">
            YOUDO をホーム画面に追加すると、パートナーからの通知を受け取れるようになります
          </p>
        </div>

        {/* 手順カード */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-primary" aria-hidden="true" />
              iPhone / iPad の場合
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* ステップ1 */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <p className="font-medium">Safari の共有ボタンをタップ</p>
                <p className="text-sm text-muted-foreground">
                  画面下部の
                  <Share2 className="w-4 h-4 inline-block mx-1 text-primary" aria-hidden="true" />
                  共有アイコンをタップします
                </p>
              </div>
            </div>

            {/* ステップ2 */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <p className="font-medium">「ホーム画面に追加」を探す</p>
                <p className="text-sm text-muted-foreground">
                  画面下部にスクロールすると見つかります
                </p>
                <div className="mt-2 bg-muted rounded-md p-2 text-xs text-muted-foreground flex items-center gap-1">
                  <Search className="w-3 h-3" aria-hidden="true" />
                  もしくは検索ボックスで「ホーム」と入力
                </div>
              </div>
            </div>

            {/* ステップ3 */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <p className="font-medium">追加をタップ</p>
                <p className="text-sm text-muted-foreground">
                  画面右上の「追加」ボタンをタップします
                </p>
              </div>
            </div>

            {/* ステップ4 */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                4
              </div>
              <div>
                <p className="font-medium">ホーム画面から起動</p>
                <p className="text-sm text-muted-foreground">
                  ホーム画面に追加された
                  <Home className="w-4 h-4 inline-block mx-1 text-primary" aria-hidden="true" />
                  YOUDO アイコンから起動します
                </p>
              </div>
            </div>

            {/* 重要ポイント */}
            <div className="mt-4 pt-4 border-t border-border">
              <div className="flex items-start gap-2">
                <div className="flex-shrink-0 w-5 h-5 bg-yellow-100 dark:bg-yellow-900 text-yellow-600 dark:text-yellow-400 rounded-full flex items-center justify-center text-xs font-bold">
                  !
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">重要なポイント</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Safari ブラウザで開いているだけでは通知を受け取れません。必ずホーム画面から起動してください。
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* アクションボタン */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={onNext} size="lg">
            次へ
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button onClick={onSkip} variant="ghost" size="lg">
            <SkipForward className="w-4 h-4 mr-2" aria-hidden="true" />
            スキップ
          </Button>
        </div>
      </div>
    )
  }

  // Android のインストール手順（シンプル版）
  if (platform === 'android') {
    return (
      <div className="space-y-8 animate-in fade-in duration-300">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold text-foreground">
            ホーム画面に追加して、より便利に
          </h2>
          <p className="text-muted-foreground">
            YOUDO をアプリのように使えます
          </p>
        </div>
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="w-6 h-6 text-primary" aria-hidden="true" />
              Android の場合
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              ブラウザメニューから「ホーム画面に追加」を選択するだけでOK！
            </p>
            <p>
              自動的にプロンプトが表示されます。
            </p>
          </CardContent>
        </Card>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={onNext} size="lg">
            次へ
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </Button>
          <Button onClick={onSkip} variant="ghost" size="lg">
            <SkipForward className="w-4 h-4 mr-2" aria-hidden="true" />
            スキップ
          </Button>
        </div>
      </div>
    )
  }

  // デスクトップ/その他（シンプル版）
  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-foreground">
          ホーム画面に追加して、より便利に
        </h2>
        <p className="text-muted-foreground">
          YOUDO をアプリのように使えます
        </p>
      </div>
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-6 h-6 text-primary" aria-hidden="true" />
            デスクトップの場合
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            アドレスバーに表示されるインストールアイコンをクリックするだけ！
          </p>
          <p>
            ブラウザが自動的に案内してくれます。
          </p>
        </CardContent>
      </Card>
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <Button onClick={onNext} size="lg">
          次へ
          <ArrowRight className="w-4 h-4" aria-hidden="true" />
        </Button>
        <Button onClick={onSkip} variant="ghost" size="lg">
          <SkipForward className="w-4 h-4 mr-2" aria-hidden="true" />
          スキップ
        </Button>
      </div>
    </div>
  )
}
