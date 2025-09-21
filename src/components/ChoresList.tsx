'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { useChores } from '@/hooks/useChores'
import { Chore, PartnerInfo } from '@/types/chore'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'
import ThankYouMessage from './ThankYouMessage'
import PartnerInvitation from './PartnerInvitation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { useScreenReader, useFocusManagement } from '@/hooks/useScreenReader'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'

// 型定義
type ThankYou = Database['public']['Tables']['thanks']['Row']

export default function ChoresList() {
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  
  // useChoresフックを使用してデータ管理を統一
  const { chores, loading, isAdding, addChore, toggleChore, deleteChore, realtimeEvents } = useChores()
  
  // アクセシビリティ機能
  const { announce, announceSuccess, announceError, announceFormError } = useScreenReader()
  const { saveFocus, restoreFocus, focusFirstElement } = useFocusManagement()
  const keyboardNavigation = useKeyboardNavigation({
    enabled: true,
    loop: true,
    onFocusChange: (element, index) => {
      // フォーカス変更時の処理
      const choreName = element.getAttribute('data-chore-name')
      if (choreName) {
        announce(`${choreName}にフォーカスしました`)
      }
    }
  })
  
  // ローカル状態
  const [newChore, setNewChore] = useState('')
  const [showThankYou, setShowThankYou] = useState<number | null>(null)
  const [hasPartner, setHasPartner] = useState<boolean | null>(null)
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null)
  const [showRealtimeDetails, setShowRealtimeDetails] = useState(false)

  /**
   * パートナー情報を取得する
   */
  const fetchPartnerInfo = useCallback(async () => {
    if (!user) {
      console.log('👤 ユーザーが未ログインのため、パートナー情報取得をスキップ')
      return
    }
    
    console.log('🔍 パートナー情報を取得中...', user.id)
    
    try {
      // プロフィール情報を取得
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('partner_id, display_name')
        .eq('id', user.id)
        .single()
      
      console.log('📊 プロフィール取得結果:', { profile, error })
      
      if (error) {
        console.error('❌ パートナー情報取得エラー:', error)
        setHasPartner(false)
        setPartnerInfo(null)
        return
      }

      if (profile?.partner_id) {
        console.log('✅ パートナーが存在:', profile.partner_id)
        // パートナーの詳細情報を取得
        const { data: partnerProfile, error: partnerError } = await supabase
          .from('profiles')
          .select('id, display_name')
          .eq('id', profile.partner_id)
          .single()
        
        if (partnerError) {
          console.error('❌ パートナー詳細取得エラー:', partnerError)
          setHasPartner(true)
          setPartnerInfo({ id: profile.partner_id, name: 'パートナー' })
        } else {
          console.log('✅ パートナー詳細取得成功:', partnerProfile)
          setHasPartner(true)
          setPartnerInfo({
            id: partnerProfile.id,
            name: partnerProfile.display_name || 'パートナー'
          })
        }
      } else {
        console.log('❌ パートナーが未設定')
        setHasPartner(false)
        setPartnerInfo(null)
      }
    } catch (error) {
      console.error('❌ パートナー情報取得で予期しないエラー:', error)
      setHasPartner(false)
      setPartnerInfo(null)
    }
  }, [user])

  // パートナー連携完了時のハンドラー
  const handlePartnerLinked = async () => {
    await fetchPartnerInfo()
  }

  // 初期化
  useEffect(() => {
    if (user) {
      fetchPartnerInfo()
    }
  }, [user, fetchPartnerInfo])

  /**
   * 家事追加のハンドラー
   */
  const handleAddChore = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!newChore.trim()) {
      announceFormError('家事名を入力してください')
      return
    }

    try {
      await addChore(newChore.trim())
      setNewChore('')
      announceSuccess(`家事「${newChore.trim()}」を追加しました`)
      addNotification({
        title: '家事を追加しました',
        type: 'success',
        message: `家事「${newChore.trim()}」を追加しました`
      })
    } catch (error) {
      console.error('家事追加エラー:', error)
      announceError('家事の追加に失敗しました')
      addNotification({
        title: 'エラー',
        type: 'error',
        message: '家事の追加に失敗しました'
      })
    }
  }

  /**
   * 家事完了切り替えのハンドラー
   */
  const handleToggleChore = async (choreId: string) => {
    const chore = chores.find(c => c.id === choreId)
    if (!chore) return
    
    try {
      await toggleChore(choreId, chore.done)
      const choreName = chore.title
      announceSuccess(`家事「${choreName}」の状態を変更しました`)
      addNotification({
        title: '家事を更新しました',
        type: 'success',
        message: `家事「${choreName}」の状態を変更しました`
      })
    } catch (error) {
      console.error('家事状態変更エラー:', error)
      announceError('家事の状態変更に失敗しました')
      addNotification({
        title: 'エラー',
        type: 'error',
        message: '家事の状態変更に失敗しました'
      })
    }
  }

  /**
   * 家事削除のハンドラー
   */
  const handleDeleteChore = async (choreId: string) => {
    const chore = chores.find(c => c.id === choreId)
    if (!chore) return
    
    if (!confirm(`家事「${chore.title}」を削除しますか？`)) {
      return
    }

    try {
      await deleteChore(choreId)
      announceSuccess(`家事「${chore.title}」を削除しました`)
      addNotification({
        title: '家事を削除しました',
        type: 'success',
        message: `家事「${chore.title}」を削除しました`
      })
    } catch (error) {
      console.error('家事削除エラー:', error)
      announceError('家事の削除に失敗しました')
      addNotification({
        title: 'エラー',
        type: 'error',
        message: '家事の削除に失敗しました'
      })
    }
  }

  /**
   * ありがとうメッセージ送信のハンドラー
   */
  const handleSendThankYou = async (choreId: string, message: string) => {
    if (!user || !partnerInfo) return

    try {
      const { error } = await supabase
        .from('thanks')
        .insert({
          from_user_id: user.id,
          to_user_id: partnerInfo.id,
          message: message,
          chore_id: choreId
        })

      if (error) throw error

      setShowThankYou(null)
      announceSuccess('ありがとうメッセージを送信しました')
      addNotification({
        title: 'ありがとうメッセージを送信しました',
        type: 'success',
        message: 'ありがとうメッセージを送信しました'
      })
    } catch (error) {
      console.error('ありがとうメッセージ送信エラー:', error)
      announceError('ありがとうメッセージの送信に失敗しました')
      addNotification({
        title: 'エラー',
        type: 'error',
        message: 'ありがとうメッセージの送信に失敗しました'
      })
    }
  }

  // ローディング状態
  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-20" />
        </div>
        {[...Array(3)].map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    )
  }

  // パートナー未設定の場合
  if (hasPartner === false) {
    return (
      <div className="space-y-6">
        <PartnerInvitation onPartnerLinked={handlePartnerLinked} />
        
        {/* 家事追加フォーム */}
        <form onSubmit={handleAddChore} className="flex gap-2">
          <Input
            type="text"
            placeholder="新しい家事を入力"
            value={newChore}
            onChange={(e) => setNewChore(e.target.value)}
            disabled={isAdding}
            className="flex-1"
            aria-label="新しい家事名"
          />
          <Button type="submit" disabled={isAdding || !newChore.trim()}>
            {isAdding ? '追加中...' : '追加'}
          </Button>
        </form>

        {/* 家事一覧 */}
        <div ref={keyboardNavigation.containerRef as React.RefObject<HTMLDivElement>} className="space-y-2" role="list" aria-label="家事一覧">
          {chores.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              まだ家事が登録されていません
            </p>
          ) : (
            chores.map((chore) => {
              const isCompleted = chore.done
              return (
                <div
                  key={chore.id}
                  data-chore-name={chore.title}
                  className={`p-4 border rounded-lg ${
                    isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                      onClick={() => handleToggleChore(chore.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isCompleted
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-400'
                      }`}
                      aria-label={`${chore.title}を${isCompleted ? '未完了' : '完了'}にする`}
                      >
                        {isCompleted && (
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                      <span className={isCompleted ? 'line-through text-gray-500' : ''}>
                        {chore.title}
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteChore(chore.id)}
                      aria-label={`${chore.title}を削除`}
                    >
                      削除
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    )
  }

  // パートナー設定済みの場合
  return (
    <div className="space-y-6">
      {/* 家事追加フォーム */}
      <form onSubmit={handleAddChore} className="flex gap-2">
        <Input
          type="text"
          placeholder="新しい家事を入力"
          value={newChore}
          onChange={(e) => setNewChore(e.target.value)}
          disabled={isAdding}
          className="flex-1"
          aria-label="新しい家事名"
        />
        <Button type="submit" disabled={isAdding || !newChore.trim()}>
          {isAdding ? '追加中...' : '追加'}
        </Button>
      </form>

      {/* 家事一覧 */}
      <div ref={keyboardNavigation.containerRef as React.RefObject<HTMLDivElement>} className="space-y-2" role="list" aria-label="家事一覧">
        {chores.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            まだ家事が登録されていません
          </p>
        ) : (
          chores.map((chore) => {
            const isCompleted = chore.done
            const isOwnChore = chore.owner_id === user?.id
            
            return (
              <div
                key={chore.id}
                data-chore-name={chore.title}
                className={`p-4 border rounded-lg ${
                  isCompleted ? 'bg-green-50 border-green-200' : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleToggleChore(chore.id)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isCompleted
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-400'
                      }`}
                      aria-label={`${chore.title}を${isCompleted ? '未完了' : '完了'}にする`}
                    >
                      {isCompleted && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <div>
                      <span className={isCompleted ? 'line-through text-gray-500' : ''}>
                        {chore.title}
                      </span>
                      {!isOwnChore && (
                        <span className="ml-2 text-sm text-blue-600">
                          ({partnerInfo?.name || 'パートナー'}の家事)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isCompleted && !isOwnChore && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowThankYou(parseInt(chore.id))}
                        aria-label={`${chore.title}にありがとうメッセージを送る`}
                      >
                        ありがとう
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteChore(chore.id)}
                      aria-label={`${chore.title}を削除`}
                    >
                      削除
                    </Button>
                  </div>
                </div>
                
                {/* ありがとうメッセージフォーム */}
                {showThankYou === parseInt(chore.id) && (
                  <div className="mt-4 pt-4 border-t">
                    <ThankYouMessage
                      completionId={showThankYou?.toString() || ''}
                      toUserId={partnerInfo?.id || ''}
                      toUserName={partnerInfo?.name || 'パートナー'}
                      onSuccess={() => setShowThankYou(null)}
                      onCancel={() => setShowThankYou(null)}
                    />
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* リアルタイム接続状況（デバッグ用） */}
      {process.env.NODE_ENV === 'development' && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="realtime-debug">
            <AccordionTrigger className="text-sm">
              リアルタイム接続状況 ({realtimeEvents.connectionStatus})
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-2 text-sm">
                <div>接続状態: {realtimeEvents.connectionStatus}</div>
                <div>挿入: {realtimeEvents.inserts}回</div>
                <div>更新: {realtimeEvents.updates}回</div>
                <div>削除: {realtimeEvents.deletes}回</div>
                <div>最後のイベント: {realtimeEvents.lastEvent || 'なし'}</div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  )
}