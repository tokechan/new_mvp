'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import ChoresList from '@/components/ChoresList'
import NotificationCenter from '@/components/NotificationCenter'
import Navigation from '@/components/Navigation'
import { Button } from '@/components/ui/Button'

export default function Home() {
  const { user, loading, signOut } = useAuth()
  const { addNotification } = useNotifications()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

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
    <div className="min-h-screen bg-gray-50">
      {/* ナビゲーション */}
      <Navigation />
      
      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ユーザー情報とアクション */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-sm text-gray-600">こんにちは</p>
              <p className="font-medium text-gray-900 truncate">{user.email}さん</p>
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-2">
              <Button 
                onClick={() => {
                  addNotification({
                    title: 'テスト通知',
                    message: 'これはテスト用の通知です',
                    type: 'info'
                  })
                }}
                variant="outline"
                size="sm"
              >
                テスト通知
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
                variant="destructive"
                size="sm"
              >
                ログアウト
              </Button>
            </div>
          </div>
        </div>

        {/* 通知センター */}
        <div className="mb-8">
          <NotificationCenter />
        </div>

        {/* CTAテキスト */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6 mb-8 text-center dark:from-blue-950/30 dark:to-indigo-950/30 dark:border-blue-800">
          <div className="flex items-center justify-center gap-3 mb-2">
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              やることあった？？
            </p>
            <button
              onClick={() => {
                addNotification({
                  title: 'リマインダー',
                  message: '家事をチェックしてみましょう！',
                  type: 'info'
                })
              }}
              className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200 hover:text-blue-700 transition-colors duration-200 dark:bg-blue-900/50 dark:text-blue-400 dark:hover:bg-blue-800/70 dark:hover:text-blue-300"
              title="リマインダー通知を送信"
            >
              <svg 
                className="w-5 h-5" 
                fill="currentColor" 
                viewBox="0 0 20 20" 
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
              </svg>
            </button>
          </div>
        </div>

        {/* 家事管理メインコンテンツ */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <ChoresList />
        </div>
      </main>
      
      {/* モバイル用の下部余白（ナビゲーションバーの分） */}
      <div className="h-20 sm:h-0" />
    </div>
  )
}