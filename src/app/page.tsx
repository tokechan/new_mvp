'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import ChoresList from '@/components/ChoresList'
import NotificationCenter from '@/components/NotificationCenter'
import Navigation from '@/components/Navigation'
import { Button } from '@/components/ui/Button'
import { profileService } from '@/services/profileService'
import { PartnerService } from '@/services/partnerService'
import { supabase } from '@/lib/supabase'
import { Bell, LogOut } from 'lucide-react'

export default function Home() {
  const { user, loading, signOut } = useAuth()
  const { addNotification } = useNotifications()
  const router = useRouter()
  const [displayName, setDisplayName] = useState<string>('')
  const [partnerStatus, setPartnerStatus] = useState<{
    hasPartner: boolean
    partnerId: string | null
    partnerInfo: { id: string; display_name: string } | null
    isLinkedProperly: boolean
  } | null>(null)
  const [partnerChecking, setPartnerChecking] = useState(false)
  const [partnerError, setPartnerError] = useState<string | null>(null)
  const [thanksTesting, setThanksTesting] = useState(false)
  const [thanksTestResult, setThanksTestResult] = useState<string | null>(null)

  // ユーザーのdisplay_nameを取得
  const fetchDisplayName = useCallback(async () => {
    if (!user) return
    
    try {
      const profile = await profileService.getProfile(user.id)
      if (profile?.display_name) {
        setDisplayName(profile.display_name)
      } else {
        // プロフィールが見つからない場合はメールアドレスから生成
        setDisplayName(user.email?.split('@')[0] || 'ユーザー')
      }
    } catch (error) {
      console.error('プロフィール取得エラー:', error)
      // エラーの場合はメールアドレスから生成
      setDisplayName(user.email?.split('@')[0] || 'ユーザー')
    }
  }, [user])

  useEffect(() => {
    if (!loading && !user) {
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
    <div className="min-h-screen bg-gray-50">
      {/* ナビゲーション */}
      <Navigation />
      
      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ユーザー情報とアクション */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
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
                aria-label="テスト通知"
              >
                <Bell className="w-[19px] h-[19px] sm:w-4 sm:h-4 mr-1" aria-hidden="true" />
                <span className="hidden sm:inline">テスト通知</span>
              </Button>
              <div className="hide-on-menu-open">
                <NotificationCenter />
              </div>
            </div>
          </div>
        </div>


        {/* デバッグ: パートナー連携状態＆通知受信テスト */}
        <div className="bg-white rounded-lg shadow-sm border border-amber-300 p-4 mb-8">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">パートナー連携状態</h3>
              <div className="text-sm text-gray-700 space-y-1">
                <p><span className="font-medium">あなたのユーザーID:</span> {user.id}</p>
                {partnerStatus ? (
                  <>
                    <p><span className="font-medium">連携有無:</span> {partnerStatus.hasPartner ? '連携済み' : '未連携'}</p>
                    <p><span className="font-medium">partner_id:</span> {partnerStatus.partnerId ?? 'なし'}</p>
                    <p><span className="font-medium">相互リンク整合性:</span> {partnerStatus.isLinkedProperly ? 'OK' : '不整合'}</p>
                    {partnerStatus.partnerInfo && (
                      <p><span className="font-medium">パートナー表示名:</span> {partnerStatus.partnerInfo.display_name}</p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-500">未確認</p>
                )}
                {partnerError && (
                  <p className="text-red-600">エラー: {partnerError}</p>
                )}
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Button
                onClick={async () => {
                  if (!user) return
                  setPartnerChecking(true)
                  setPartnerError(null)
                  try {
                    const status = await PartnerService.checkPartnershipStatus(user.id)
                    setPartnerStatus(status as any)
                  } catch (e: any) {
                    setPartnerError(e?.message || '状態確認に失敗しました')
                  } finally {
                    setPartnerChecking(false)
                  }
                }}
                variant="outline"
                size="sm"
                disabled={partnerChecking}
              >
                {partnerChecking ? '確認中...' : '連携状態をチェック'}
              </Button>
              <Button
                onClick={async () => {
                  if (!user) return
                  setThanksTesting(true)
                  setThanksTestResult(null)
                  try {
                    const { data, error, status } = await supabase
                      .from('thanks')
                      .insert({
                        from_id: user.id,
                        to_id: user.id,
                        message: '通知受信テスト（自分宛）'
                      })
                      .select('*')
                    console.info('insert result', { data, error, status })
                    if (error) {
                      setThanksTestResult(`挿入失敗: ${error.message}`)
                    } else {
                      setThanksTestResult('挿入成功 → 通知が表示されるか確認してください')
                    }
                  } catch (e: any) {
                    setThanksTestResult(`例外: ${e?.message || e}`)
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
          </div>
          {thanksTestResult && (
            <div className="mt-2 text-sm text-gray-700">
              結果: {thanksTestResult}
            </div>
          )}
        </div>

        {/* 家事管理メインコンテンツ */}
        <ChoresList />
      </main>
      
      {/* モバイル用の下部余白（ナビゲーションバーの分） */}
      <div className="h-20 sm:h-0" />
    </div>
  )
}