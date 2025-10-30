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
import { Bell, LogOut, FileText } from 'lucide-react'
import FooterChoreInput from '@/components/FooterChoreInput'

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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 sm:pb-12">
        {/* ユーザー情報とアクション */}
        <div className="bg-muted rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
            <div className="flex items-baseline gap-2">
              <p className="text-sm text-gray-600">こんにちは</p>
              <p className="font-medium text-gray-900 truncate">{displayName || user.email?.split('@')[0] || 'ユーザー'}さん</p>
            </div>
            <div className="flex items-center gap-2">
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

        {/* デバッグ機能 */}
        {/* <div className="bg-surface rounded-lg shadow-sm border border-amber-300 p-4 mb-8">
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-900">リアルタイム通知の挙動確認</p>
            <NotificationCenter />
          </div>
          <div className="mt-4 flex gap-2">
            <Button
              onClick={async () => {
                setThanksTesting(true)
                setThanksTestResult(null)
                try {
                  const { error } = await supabase.from('thanks').insert({
                    from_user_id: user.id,
                    message: 'テストありがとう',
                    created_at: new Date().toISOString()
                  })
                  if (error) {
                    setThanksTestResult(`エラー: ${error.message}`)
                  } else {
                    setThanksTestResult('成功: thanksにINSERTしました')
                  }
                } catch (err: any) {
                  setThanksTestResult(`例外: ${err?.message || '原因不明'}`)
                } finally {
                  setThanksTesting(false)
                }
              }}
              size="sm"
              title="thanksにINSERTして通知受信を確認"
              disabled={thanksTesting}
            >
              {thanksTesting ? 'テスト中...' : 'ありがとう受信テスト'}
            </Button>
          </div>
          {thanksTestResult && (
            <div className="mt-2 text-sm text-gray-700">
              結果: {thanksTestResult}
            </div>
          )}
        </div> */}

        {/* 家事管理メインコンテンツ */}
        <ChoresList />
      </div>
      <FooterChoreInput />
    </>
  )
}
