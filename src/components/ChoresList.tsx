'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
import { useChores } from '@/hooks/useChores'
import { Chore, PartnerInfo } from '@/types/chore'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'
import ThankYouMessage from './ThankYouMessage'
import { ChoreItem } from './ChoreItem'
import { ChoreAddForm } from './ChoreAddForm'
import { PartnerSetup } from './PartnerSetup'
import { RealtimeDebugPanel } from './RealtimeDebugPanel'
import { Skeleton } from '@/components/ui/skeleton'
import { useScreenReader, useFocusManagement } from '@/hooks/useScreenReader'
import { useKeyboardNavigation } from '@/hooks/useKeyboardNavigation'

// 型定義
type ThankYou = Database['public']['Tables']['thanks']['Row']

/**
 * 家事リストメインコンポーネント
 * 責務：家事リストの表示とコンポーネント間の調整のみ
 */
export default function ChoresList() {
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  
  // useChoresフックを使用してデータ管理を統一
  const { chores, loading, isAdding, addChore, toggleChore, deleteChore, realtimeEvents } = useChores()
  
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
      const { data, error } = await supabase
        .from('partner_links')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('パートナー情報の取得に失敗:', error)
        return
      }

      if (data) {
        setPartnerInfo(data)
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
    } catch (error) {
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
      await toggleChore(chore.id, chore.done)
      
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
    const chore = chores.find(c => c.id === choreId)
    if (!chore) return

    try {
      saveFocus()
      await deleteChore(choreId)
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
      <PartnerSetup 
        hasPartner={!!partnerInfo}
        onPartnerLinked={fetchPartnerInfo}
      />

      {/* 家事追加フォーム */}
      <ChoreAddForm 
        onAddChore={handleAddChore}
        isAdding={isAdding}
      />

      {/* 家事リスト */}
      <div 
        ref={keyboardNavigation.containerRef as React.RefObject<HTMLDivElement>} 
        className="space-y-2"
        role="list" 
        aria-label="家事一覧"
      >
        {chores.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            まだ家事が登録されていません。上のフォームから追加してください。
          </p>
        ) : (
          chores.map((chore) => (
            <ChoreItem
              key={chore.id}
              chore={chore}
              onToggle={() => handleToggleChore(chore)}
              onDelete={() => handleDeleteChore(chore.id)}
              isOwnChore={chore.owner_id === user?.id}
              partnerName={partnerInfo?.name || 'パートナー'}
              showThankYou={false}
              onShowThankYou={() => {}}
              onHideThankYou={() => {}}
              partnerInfo={partnerInfo}
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
      <RealtimeDebugPanel realtimeEvents={realtimeEvents} />
    </div>
  )
}