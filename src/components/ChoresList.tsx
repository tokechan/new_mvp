'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { useChores } from '@/hooks/useChores'
import { useRealtime } from '@/hooks/useRealtime' // リアルタイム機能を追加
import { Chore, PartnerInfo } from '@/types/chore'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'
import { ChoreLimitReachedError } from '@/services/choreService'
import ThankYouMessage from './ThankYouMessage'
import { ChoreItem } from './ChoreItem'
import { PartnerSetup } from './PartnerSetup'
import { RealtimeDebugPanel } from './RealtimeDebugPanel'
import { Skeleton } from '@/components/ui/skeleton'
import { useScreenReader, useFocusManagement } from '@/hooks/useScreenReader'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'
import { useToast } from '@/components/ui/toast'

// 型定義
type ThankYou = Database['public']['Tables']['thanks']['Row']

/**
 * 家事リストメインコンポーネント
 * 責務：家事リストの表示とコンポーネント間の調整のみ
 */
export default function ChoresList() {
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  const { showToast } = useToast()
  
  // useChoresフックを使用してデータ管理を統一
  const { 
    chores, 
    loading, 
    isAdding, 
    addChore, 
    toggleChore, 
    deleteChore, 
    realtimeEvents,
    setChores,
    setRealtimeEvents,
    refetch
  } = useChores()
  
  // リアルタイム機能を統合
  const realtimeState = useRealtime({
    onChoreChange: (chores) => {
      console.log('🔄 Realtime chore changes received:', chores.length, 'chores')
      
      // 🔄 リアルタイムイベントによる更新（即座更新との重複を避けるため、慎重に処理）
      setChores(prevChores => {
        // 現在のローカル状態と比較して、主要プロパティの差分がある場合のみ更新
        const hasDiff =
          prevChores.length !== chores.length ||
          prevChores.some(prev => {
            const next = chores.find(c => c.id === prev.id)
            if (!next) return true
            return (
              prev.title !== next.title ||
              prev.done !== next.done ||
              prev.owner_id !== next.owner_id ||
              prev.partner_id !== next.partner_id
            )
          })

        if (hasDiff) {
          console.log('🔄 Applying realtime chore changes with diff detected:', {
            previousCount: prevChores.length,
            newCount: chores.length
          })
          return chores
        }

        console.log('🔄 Skipping realtime update - no changes detected')
        return prevChores
      })
      
      // リアルタイムイベント情報を更新
      setRealtimeEvents(prev => ({
        ...prev,
        updates: prev.updates + 1,
        lastEvent: `Realtime update: ${chores.length} items`,
        connectionStatus: 'connected'
      }))
    },
    onPartnerChange: (partner) => {
      console.log('👤 Partner change received:', partner)
      // パートナー変更時の処理（必要に応じて）
      
      setRealtimeEvents(prev => ({
        ...prev,
        updates: prev.updates + 1,
        lastEvent: `Partner updated: ${partner?.display_name || 'Unknown'}`,
        connectionStatus: 'connected'
      }))
    }
  })
  
  // アクセシビリティ機能
  const { announce, announceSuccess, announceError } = useScreenReader()
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
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null)
  const [isLoadingPartner, setIsLoadingPartner] = useState(true)
  const [thankYouMessage, setThankYouMessage] = useState<ThankYou | null>(null)

  /**
   * パートナー情報を取得
   */
  const fetchPartnerInfo = useCallback(async () => {
    if (!user) return

    try {
      setIsLoadingPartner(true)
      // 自分のプロフィールから partner_id を取得
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('partner_id')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        console.error('プロフィールの取得に失敗:', profileError)
        return
      }

      // パートナーが設定されている場合は詳細情報を取得
      if (profile?.partner_id) {
        const { data: partner, error: partnerError } = await supabase
          .from('profiles')
          .select('id, display_name')
          .eq('id', profile.partner_id)
          .single()

        if (partnerError && partnerError.code !== 'PGRST116') {
          console.error('パートナー情報の取得に失敗:', partnerError)
          return
        }

        if (partner) {
          setPartnerInfo({ id: partner.id, name: partner.display_name })
        } else {
          setPartnerInfo(null)
        }
      } else {
        setPartnerInfo(null)
      }
    } catch (error) {
      console.error('パートナー情報の取得中にエラー:', error)
    } finally {
      setIsLoadingPartner(false)
    }
  }, [user])

  // 初期化処理
  useEffect(() => {
    fetchPartnerInfo()
  }, [fetchPartnerInfo])

  /**
   * 家事追加処理
   */
  const handleAddChore = async (title: string) => {
    try {
      await addChore(title)
      announceSuccess(`家事「${title}」を追加しました`)
      addNotification({
        title: '家事を追加しました',
        type: 'success',
        message: `家事「${title}」を追加しました`
      })
    } catch (error: unknown) {
      if (error instanceof ChoreLimitReachedError) {
        announceError(error.message)
        showToast({ message: error.message, variant: 'warning' })
        addNotification({
          title: '家事を追加できません',
          type: 'warning',
          message: error.message
        })
        return
      }

      announceError('家事の追加に失敗しました')
      addNotification({
        title: 'エラー',
        type: 'error',
        message: '家事の追加に失敗しました'
      })
    }
  }

  /**
   * 家事完了切り替え処理
   */
  const handleToggleChore = async (chore: Chore) => {
    try {
      saveFocus()
      // idはstring/number両対応、doneはboolean|nullの可能性に対応
      const numericId = typeof chore.id === 'number' ? chore.id : Number(chore.id)
      await toggleChore(numericId, !!chore.done)
      
      if (!chore.done) {
        announceSuccess(`家事「${chore.title}」を完了しました`)
        addNotification({
          title: '家事を完了しました',
          type: 'success',
          message: `家事「${chore.title}」を完了しました`,
          actionUrl: '/completed-chores'
        })
      } else {
        announce(`家事「${chore.title}」を未完了に戻しました`)
        addNotification({
          title: '家事を更新しました',
          type: 'info',
          message: `家事「${chore.title}」を未完了に戻しました`
        })
      }
      
      setTimeout(restoreFocus, 100)
    } catch (error) {
      announceError('家事の状態変更に失敗しました')
      addNotification({
        title: 'エラー',
        type: 'error',
        message: '家事の状態変更に失敗しました'
      })
      restoreFocus()
    }
  }

  /**
   * 家事削除処理
   */
  const handleDeleteChore = async (choreId: string) => {
    const numericId = Number(choreId)
    const chore = chores.find(c => c.id === numericId)
    if (!chore) return

    try {
      saveFocus()
      await deleteChore(numericId)
      announceSuccess(`家事「${chore.title}」を削除しました`)
      addNotification({
        title: '家事を削除しました',
        type: 'success',
        message: `家事「${chore.title}」を削除しました`
      })
      setTimeout(focusFirstElement, 100)
    } catch (error) {
      announceError('家事の削除に失敗しました')
      addNotification({
        title: 'エラー',
        type: 'error',
        message: '家事の削除に失敗しました'
      })
      restoreFocus()
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* パートナー設定セクション */}
      {/* <PartnerSetup 
        hasPartner={!!partnerInfo}
        onPartnerLinked={fetchPartnerInfo}
      /> */}

      {/* 家事追加フォーム（検討段階のため一時的に非表示） */}
      
      {/* 家事リスト */}
      <div 
        ref={keyboardNavigation.containerRef as React.RefObject<HTMLDivElement>} 
        className="grid grid-cols-2 gap-3 sm:gap-4 w-full border border-transparent rounded-lg"
        role="list" 
        aria-label="家事一覧"
      >
        {chores.length === 0 ? (
          <div
            className="col-span-2 flex flex-col gap-2 rounded-lg border border-info/30 bg-info/10 p-6 text-info shadow-sm"
            role="listitem"
            aria-live="polite"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-info">登録待ち</span>
            </div>
            <p className="text-sm leading-relaxed">
              まだ家事が登録されていません。下の入力欄から追加してください。
            </p>
          </div>
        ) : (
          chores.map((chore) => (
            <ChoreItem
              key={chore.id}
              chore={chore}
              onToggle={() => handleToggleChore(chore)}
              onDelete={() => handleDeleteChore(String(chore.id))}
              isOwnChore={String(chore.owner_id) === String(user?.id || '')}
              partnerName={partnerInfo?.name || 'パートナー'}
              showThankYou={false}
              onShowThankYou={() => {}}
              onHideThankYou={() => {}}
              partnerInfo={partnerInfo}
              currentUserId={user?.id}
              data-chore-name={chore.title}
            />
          ))
        )}
      </div>

      {/* サンクスメッセージ */}
      {thankYouMessage && (
        <ThankYouMessage
          choreId={thankYouMessage.chore_id?.toString() || ''}
          toUserId={thankYouMessage.to_id || ''}
          toUserName={partnerInfo?.name || 'パートナー'}
          onSuccess={() => setThankYouMessage(null)}
          onCancel={() => setThankYouMessage(null)}
        />
      )}

      {/* リアルタイムデバッグパネル（開発環境のみ） */}
      {/* <RealtimeDebugPanel realtimeEvents={realtimeEvents} /> */}
    </div>
  )
}
