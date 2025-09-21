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
    <main className="flex min-h-screen flex-col items-center justify-between p-24 sm:p-24 px-2">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex">
        <p className="fixed left-0 top-0 flex w-full justify-center border-b border-gray-300 bg-gradient-to-b from-zinc-200 pb-6 pt-8 backdrop-blur-2xl dark:border-neutral-800 dark:bg-zinc-800/30 dark:from-inherit lg:static lg:w-auto lg:rounded-xl lg:border lg:bg-gray-200 lg:p-4 lg:dark:bg-zinc-800/30">
          ThankYou Chores&nbsp;
          <code className="font-mono font-bold">家事管理アプリ</code>
        </p>
        <div className="flex items-center gap-4">
          <span>こんにちは、{user.email}さん</span>
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