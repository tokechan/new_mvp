'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import ChoresList from '@/components/ChoresList'
import NotificationCenter from '@/components/NotificationCenter'
import { Button } from '@/components/ui/button'

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
    <main className="flex min-h-screen flex-col p-4 sm:p-6 lg:p-24">
      {/* モバイル対応ヘッダー */}
      <header className="w-full mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-xl sm:text-2xl font-bold text-blue-600">
              ThankYou Chores
            </h1>
            <p className="text-sm text-gray-600">家事管理アプリ</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <span className="text-sm truncate">こんにちは、{user.email}さん</span>
          <Button 
            onClick={() => {
              addNotification({
                title: 'テスト通知',
                message: 'これはテスト用の通知です',
                type: 'info'
              })
            }}
            variant="default"
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
      </header>

      {/* 通知センター */}
      <div className="w-full max-w-4xl mb-8">
        <NotificationCenter />
      </div>

      {/* 家事管理メインコンテンツ */}
      <div className="w-full max-w-4xl">
        <ChoresList />
      </div>
    </main>
  )
}