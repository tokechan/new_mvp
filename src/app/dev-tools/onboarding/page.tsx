'use client'

import { useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card'
import { CheckCircle2, XCircle, Trash2, RotateCcw, ExternalLink } from 'lucide-react'
import Link from 'next/link'

/**
 * オンボーディング状態の確認・リセット用 DevTools ページ
 * 
 * 実機テストで既存ユーザーがオンボーディングを確認するための開発用ページ
 * 
 * 使用方法:
 * 1. 既存ユーザーでログインした状態で /dev-tools/onboarding にアクセス
 * 2. 「オンボーディングをリセット」ボタンをクリック
 * 3. オンボーディングページへ遷移
 */
export default function OnboardingDevToolsPage() {
  const [status, setStatus] = useState<'idle' | 'reset' | 'complete'>('idle')

  const checkStatus = () => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('youdo_onboarding_complete') === 'true'
  }

  const [isComplete, setIsComplete] = useState(checkStatus())

  const handleReset = () => {
    if (typeof window === 'undefined') return
    
    localStorage.removeItem('youdo_onboarding_complete')
    setIsComplete(false)
    setStatus('reset')
    
    // 2秒後にオンボーディングページへリダイレクト
    setTimeout(() => {
      window.location.href = '/onboarding'
    }, 2000)
  }

  const handleComplete = () => {
    if (typeof window === 'undefined') return
    
    localStorage.setItem('youdo_onboarding_complete', 'true')
    setIsComplete(true)
    setStatus('complete')
  }

  const handleRefresh = () => {
    setIsComplete(checkStatus())
    setStatus('idle')
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Link href="/app" className="text-primary hover:underline">
              ← アプリに戻る
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-foreground">オンボーディング DevTools</h1>
          <p className="text-muted-foreground mt-2">
            オンボーディングの状態を確認・リセットする開発用ページ
          </p>
        </div>

        {/* 警告カード */}
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950 mb-6">
          <CardContent className="pt-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ これは開発・テスト用のページです。本番環境では非表示にしてください。
            </p>
          </CardContent>
        </Card>

        {/* ステータスカード */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>現在の状態</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              {isComplete ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-medium text-foreground">オンボーディング完了済み</p>
                    <p className="text-sm text-muted-foreground">
                      localStorage: youdo_onboarding_complete = &apos;true&apos;
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-6 h-6 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-foreground">オンボーディング未完了</p>
                    <p className="text-sm text-muted-foreground">
                      localStorage に完了状態が保存されていません
                    </p>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-2">
              <Button onClick={handleRefresh} variant="outline" size="sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                状態を更新
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* アクションカード */}
        <Card>
          <CardHeader>
            <CardTitle>アクション</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* リセットアクション */}
            <div className="space-y-2">
              <h3 className="font-medium text-foreground">オンボーディングをリセット</h3>
              <p className="text-sm text-muted-foreground">
                オンボーディング完了状態をクリアし、オンボーディングページを表示します。
                実機テストで使用してください。
              </p>
              {status === 'reset' ? (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✓ リセット完了。オンボーディングページへリダイレクト中...
                  </p>
                </div>
              ) : (
                <Button onClick={handleReset} disabled={!isComplete} className="w-full">
                  <Trash2 className="w-4 h-4 mr-2" />
                  オンボーディングをリセット
                </Button>
              )}
            </div>

            <div className="border-t border-border pt-4" />

            {/* 完了にするアクション */}
            <div className="space-y-2">
              <h3 className="font-medium text-foreground">オンボーディングを完了にする</h3>
              <p className="text-sm text-muted-foreground">
                オンボーディング完了状態を設定し、次回アクセス時に /app を表示します。
              </p>
              {status === 'complete' ? (
                <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    ✓ オンボーディング完了状態を設定しました。
                  </p>
                </div>
              ) : (
                <Button onClick={handleComplete} disabled={isComplete} variant="outline" className="w-full">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  オンボーディングを完了にする
                </Button>
              )}
            </div>

            <div className="border-t border-border pt-4" />

            {/* 直接リンク */}
            <div className="space-y-2">
              <h3 className="font-medium text-foreground">直接アクセス</h3>
              <p className="text-sm text-muted-foreground">
                オンボーディングページに直接アクセスします。
                完了済みの場合は自動的に /app にリダイレクトされます。
              </p>
              <Link href="/onboarding">
                <Button variant="outline" className="w-full">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  オンボーディングページを開く
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 使い方 */}
        <Card className="mt-6 border-muted">
          <CardHeader>
            <CardTitle className="text-base">使い方</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>このページで現在のオンボーディング状態を確認</li>
              <li>「オンボーディングをリセット」ボタンをクリック</li>
              <li>自動的にオンボーディングページへリダイレクト</li>
              <li>各ステップを確認・操作</li>
              <li>完了後に /app に戻ることを確認</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

