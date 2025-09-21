'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useNotifications } from '@/contexts/NotificationContext'
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

// 統合された型定義（両方の機能をサポート）
type Chore = Database['public']['Tables']['chores']['Row']
type ChoreInsert = Database['public']['Tables']['chores']['Insert']
type Completion = Database['public']['Tables']['completions']['Row']
type CompletionInsert = Database['public']['Tables']['completions']['Insert']
type ThankYou = Database['public']['Tables']['thanks']['Row']

// 拡張された家事型（完了記録を含む）
interface ExtendedChore extends Chore {
  completions?: Completion[]
}

export default function ChoresList() {
  const { user } = useAuth()
  const { addNotification } = useNotifications()
  
  // アクセシビリティ機能
  const { announce, announceSuccess, announceError, announceFormError } = useScreenReader()
  const { saveFocus, restoreFocus, focusFirstElement } = useFocusManagement()
  const choreListRef = useKeyboardNavigation({
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
  const [chores, setChores] = useState<ExtendedChore[]>([])
  const [loading, setLoading] = useState(true)
  const [newChore, setNewChore] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [showThankYou, setShowThankYou] = useState<number | null>(null) // 表示中のありがとうメッセージフォーム

  // パートナー情報の状態管理
  const [hasPartner, setHasPartner] = useState<boolean | null>(null)
  const [partnerInfo, setPartnerInfo] = useState<{ id: string; name: string } | null>(null)
  
  // パートナー連携完了時のハンドラー
  const handlePartnerLinked = async () => {
    // パートナー情報を再取得
    await fetchPartnerInfo()
    // 家事一覧も再取得（パートナーの家事が表示されるように）
    await fetchChores()
  }
  
  // リアルタイムイベント追跡用
  const [realtimeEvents, setRealtimeEvents] = useState({
    inserts: 0,
    updates: 0,
    deletes: 0,
    lastEvent: null as string | null,
    lastError: null as string | null,
    reconnectAttempts: 0,
    lastConnectedAt: null as number | null,
    connectionStatus: 'unknown' as 'unknown' | 'connected' | 'disconnected' | 'error'
  })
  const [showRealtimeDetails, setShowRealtimeDetails] = useState(false)

  // 家事一覧を取得（完了記録も含む）
  const fetchChores = useCallback(async () => {
    if (!user) return

    try {
      // 家事と完了記録を取得
      const { data: choresData, error: choresError } = await supabase
        .from('chores')
        .select(`
          *,
          completions (*)
        `)
        .or(`owner_id.eq.${user.id},partner_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (choresError) throw choresError

      // 現在のスキーマではthanksテーブルにchore_idがないため、
      // ありがとうメッセージは別途取得する必要があります
      // TODO: Migration 003実行後は、chores -> thanks の直接関係で取得可能
      
      setChores(choresData || [])
    } catch (error) {
      console.error('家事の取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }, [user])



  /**
   * パートナー情報を取得する
   * - RLSポリシー修正後の簡素化版
   */
  const fetchPartnerInfo = useCallback(async (retryCount = 0) => {
    if (!user) {
      console.log('👤 ユーザーが未ログインのため、パートナー情報取得をスキップ')
      return
    }
    
    console.log('🔍 パートナー情報を取得中...', user.id, retryCount > 0 ? `(リトライ: ${retryCount})` : '')
    
    try {
      // プロフィール情報を取得（RLSポリシー修正後）
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
          setHasPartner(true)
          setPartnerInfo({
            id: profile.partner_id,
            name: partnerProfile?.display_name || 'パートナー'
          })
        }
      } else {
        console.log('❌ パートナーが未設定')
        setHasPartner(false)
        setPartnerInfo(null)
      }
    } catch (error) {
      console.error('💥 パートナー情報取得で予期しないエラー:', error)
      
      // 予期しないエラーの場合もリトライ
      if (retryCount < 3) {
        console.log(`🔄 予期しないエラーのため ${retryCount + 1}/3 回目のリトライを実行します...`)
        setTimeout(() => fetchPartnerInfo(retryCount + 1), 1000)
        return
      }
      
      // リトライ回数超過でもhasPartnerをfalseに設定して招待UIを表示
      setHasPartner(false)
      setPartnerInfo(null)
    }
    
    console.log('🏁 パートナー情報取得完了')
  }, [user])

  // リアルタイム接続の手動再接続
  const [reconnectTrigger, setReconnectTrigger] = useState(0)
  
  const handleReconnect = () => {
    console.log('🔄 手動再接続を実行します')
    
    // 再接続前に状態をリセット
    setRealtimeEvents(prev => ({
      ...prev,
      connectionStatus: 'disconnected',
      lastError: null,
      reconnectAttempts: prev.reconnectAttempts + 1
    }))
    
    // useEffectを再実行するためにトリガーを変更
    setReconnectTrigger(prev => prev + 1)
  }



  // 新しい家事を追加
  const addChore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newChore.trim()) {
      return
    }

    setIsAdding(true)
    console.log('🚀 Adding chore:', newChore.trim())
    
    try {
      let data, error
      
      if (process.env.NEXT_PUBLIC_SKIP_AUTH === 'true') {
        console.log('🧪 テスト環境: 直接SQL実行でRLSを回避')
        const { createClient } = await import('@supabase/supabase-js')
        const serviceClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            auth: {
              autoRefreshToken: false,
              persistSession: false
            }
          }
        )
        
        // RLS回避関数を使用してINSERT
        const { data: rpcData, error: rpcError } = await serviceClient
          .rpc('insert_chore_bypass_rls', {
            p_title: newChore.trim(),
            p_owner_id: user.id,
            p_partner_id: partnerInfo?.id || null
          })
        
        if (rpcError) {
          // RPC関数が失敗した場合は通常のSupabaseクライアントを試す
          console.warn('⚠️ RPC関数実行失敗、通常のクライアントを使用:', rpcError)
          const result = await supabase
            .from('chores')
            .insert({
              title: newChore.trim(),
              owner_id: user.id,
              partner_id: partnerInfo?.id || null,
              done: false
            })
            .select()
            .single()
          data = result.data
          error = result.error
        } else {
          data = rpcData?.[0] || rpcData
          error = null
        }
      } else {
        // 本番環境では通常のSupabaseクライアントを使用
        const result = await supabase
          .from('chores')
          .insert({
            title: newChore.trim(),
            owner_id: user.id,
            partner_id: partnerInfo?.id || null,
            done: false
          })
          .select()
          .single()
        data = result.data
        error = result.error
      }

      if (error) {
        console.error('❌ Insert failed:', error)
        alert(`家事の追加に失敗しました: ${error.message}`)
        return
      }

      console.log('✅ Chore added:', data)
      setChores(prev => [data as ExtendedChore, ...prev])
      setNewChore('')
      
      // スクリーンリーダーに成功を通知
      announceSuccess(`家事「${data.title}」を追加しました`)
      
    } catch (error: any) {
      console.error('💥 Error:', error)
      announceError(`家事の追加に失敗しました: ${error.message}`)
      alert(`エラーが発生しました: ${error.message}`)
    } finally {
      setIsAdding(false)
    }
  }

  /**
   * 家事の完了状態を切り替える
   */
  const toggleChore = async (choreId: number, currentDone: boolean) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('chores')
        .update({ done: !currentDone })
        .eq('id', choreId)

      if (error) {
        console.error('❌ Toggle failed:', error)
        alert(`状態更新に失敗しました: ${error.message}`)
        return
      }

      // 成功時のみローカル状態を更新
      setChores(prev => 
        prev.map(chore => 
          chore.id === choreId 
            ? { ...chore, done: !currentDone }
            : chore
        )
      )
      console.log('✅ Chore toggled:', choreId)
      
      // スクリーンリーダーに状態変更を通知
      const chore = chores.find(c => c.id === choreId)
      if (chore) {
        const status = !currentDone ? '完了' : '未完了'
        announceSuccess(`家事「${chore.title}」を${status}にしました`)
      }

    } catch (error: any) {
      console.error('💥 Error:', error)
      announceError(`家事の状態更新に失敗しました: ${error.message}`)
      alert(`エラーが発生しました: ${error.message}`)
    }
  }

  // 家事を削除
  const deleteChore = async (choreId: number) => {
    if (!confirm('この家事を削除しますか？')) return

    try {
      const { error } = await supabase
        .from('chores')
        .delete()
        .eq('id', choreId)

      if (error) {
        console.error('❌ Delete failed:', error)
        alert(`削除に失敗しました: ${error.message}`)
        return
      }

      // 削除前に家事名を取得
      const deletedChore = chores.find(c => c.id === choreId)
      setChores(prev => prev.filter(chore => chore.id !== choreId))
      console.log('✅ Chore deleted:', choreId)
      
      // スクリーンリーダーに削除を通知
      if (deletedChore) {
        announceSuccess(`家事「${deletedChore.title}」を削除しました`)
      }

    } catch (error: any) {
      console.error('💥 Error:', error)
      announceError(`家事の削除に失敗しました: ${error.message}`)
      alert(`エラーが発生しました: ${error.message}`)
    }
  }

  // 家事の完了状態を切り替え

  /**
   * 家事データの変更処理
   * - 全データ再取得ではなく、増分更新を実装
   * - パフォーマンスを向上させ、ネットワーク負荷を軽減
   */
  const handleChoreChange = useCallback((payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload
    
    console.log('🔄 handleChoreChange called:', {
      eventType,
      newRecord,
      oldRecord,
      timestamp: new Date().toISOString()
    })
    
    setRealtimeEvents(prev => ({
      ...prev,
      [eventType === 'INSERT' ? 'inserts' : 
       eventType === 'UPDATE' ? 'updates' : 'deletes']: 
       prev[eventType === 'INSERT' ? 'inserts' : 
            eventType === 'UPDATE' ? 'updates' : 'deletes'] + 1,
      lastEvent: new Date().toLocaleTimeString(),
      connectionStatus: 'connected'
    }))

    setChores(prev => {
      switch (eventType) {
        case 'INSERT':
          // 重複チェック（ローカル更新と競合回避）
          if (prev.some(c => c.id === newRecord.id)) {
            console.log('🔄 INSERT: Duplicate detected, skipping')
            return prev
          }
          console.log('✅ INSERT: Adding new chore to list')
          return [newRecord as ExtendedChore, ...prev]
          
        case 'UPDATE':
          console.log('✅ UPDATE: Updating chore in list')
          return prev.map(chore => 
            chore.id === newRecord.id 
              ? { ...chore, ...newRecord } as ExtendedChore
              : chore
          )
          
        case 'DELETE':
          console.log('🗑️ DELETE: Removing chore from list, ID:', oldRecord?.id)
          // 重複チェック（即時ローカル更新と競合回避）
          if (!prev.some(c => c.id === oldRecord.id)) {
            console.log('🗑️ DELETE: Chore already removed locally, skipping')
            return prev
          }
          const filteredChores = prev.filter(chore => chore.id !== oldRecord.id)
          console.log('🗑️ DELETE: Before filter:', prev.length, 'After filter:', filteredChores.length)
          return filteredChores
          
        default:
          console.log('❓ Unknown event type:', eventType)
          return prev
      }
    })
  }, [])

  /**
   * 完了記録の変更処理
   * - 完了記録が変更された場合、関連する家事データを再取得
   */
  const handleCompletionChange = useCallback(async (payload: any) => {
    const { eventType, new: newRecord, old: oldRecord } = payload
    
    setRealtimeEvents(prev => ({
      ...prev,
      [eventType === 'INSERT' ? 'inserts' : 
       eventType === 'UPDATE' ? 'updates' : 'deletes']: 
       prev[eventType === 'INSERT' ? 'inserts' : 
            eventType === 'UPDATE' ? 'updates' : 'deletes'] + 1,
      lastEvent: new Date().toLocaleTimeString(),
      connectionStatus: 'connected'
    }))

    // 完了記録の変更は関連する家事の完了状態に影響するため、
    // 該当する家事のデータを再取得
    const choreId = newRecord?.chore_id || oldRecord?.chore_id
    if (choreId) {
      try {
        const { data, error } = await supabase
          .from('chores')
          .select(`
            *,
            completions (
              *,
              thanks (*)
            )
          `)
          .eq('id', choreId)
          .single()

        if (error) throw error
        
        if (data) {
          setChores(prev => prev.map(chore => 
            chore.id === choreId ? data as ExtendedChore : chore
          ))
        }
      } catch (error) {
        console.error('完了記録変更後の家事データ更新に失敗:', error)
      }
    }
  }, [])

  /**
   * 初期データ取得＋Supabase Realtime購読を設定する。
   * - Supabase公式ベストプラクティスに基づく実装
   * - 単一チャンネルでシンプルな構成
   * - 効率的な増分更新を実装
   */
  useEffect(() => {
    // テスト環境での認証設定
    const setupTestAuth = async () => {
      if (process.env.NEXT_PUBLIC_SKIP_AUTH === 'true' && user) {
        console.log('🧪 テスト環境: 認証をスキップしてRLSを無効化')
        // テスト環境では、addChore関数内でサービスロールキーを使用
        console.log('✅ テスト環境設定完了')
      }
    }

    if (!user) {
      console.log('👤 No user logged in, skipping Realtime setup')
      setChores([])
      setLoading(false)
      return
    }

    console.log('🚀 Setting up optimized Realtime for user:', user.id)
    
    // テスト環境の認証設定を実行してから初期データ取得
    setupTestAuth().then(() => {
      fetchChores()
      fetchPartnerInfo()
    })

    // Supabase公式推奨: 単一チャンネルでシンプルな構成
    const channel = supabase
      .channel(`user:${user.id}:chores`) // privateフラグを削除
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chores'
        },
        (payload) => {
          console.log('🔄 Chore change received:', {
            event: payload.eventType,
            table: payload.table,
            new: payload.new,
            old: payload.old,
            timestamp: new Date().toISOString()
          })
          
          // ユーザーに関連する変更のみ処理
          // DELETEイベントではpayload.newはnullで、payload.oldにデータが含まれる
          const record = payload.eventType === 'DELETE' ? payload.old : (payload.new || payload.old)
          
          console.log('🔍 Record check for user filtering:', {
            eventType: payload.eventType,
            record,
            userId: user.id,
            recordOwnerId: record?.owner_id,
            recordPartnerId: record?.partner_id
          })
          
          // ユーザーに関連する変更のみ処理（partner_idがnullでもowner_idが一致すれば処理）
          if (record && (record as any).owner_id === user.id) {
            console.log('✅ Processing change for user (owner):', payload.eventType)
            handleChoreChange(payload)
          } else if (record && (record as any).partner_id === user.id) {
            console.log('✅ Processing change for user (partner):', payload.eventType)
            handleChoreChange(payload)
          } else {
            console.log('❌ Skipping change - not for this user:', payload.eventType, {
              recordOwnerId: record?.owner_id,
              recordPartnerId: record?.partner_id,
              userId: user.id
            })
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'completions'
        },
        (payload) => {
          console.log('🔄 Completion change received:', {
            event: payload.eventType,
            table: payload.table,
            new: payload.new,
            old: payload.old,
            timestamp: new Date().toISOString()
          })
          
          handleCompletionChange(payload)
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'thanks'
        },
        (payload) => {
          console.log('🔄 Thanks change received:', {
            event: payload.eventType,
            table: payload.table,
            new: payload.new,
            old: payload.old,
            timestamp: new Date().toISOString()
          })
          
          setRealtimeEvents(prev => ({
            ...prev,
            [payload.eventType === 'INSERT' ? 'inserts' : 
             payload.eventType === 'UPDATE' ? 'updates' : 'deletes']: 
             prev[payload.eventType === 'INSERT' ? 'inserts' : 
                  payload.eventType === 'UPDATE' ? 'updates' : 'deletes'] + 1,
            lastEvent: new Date().toLocaleTimeString(),
            connectionStatus: 'connected'
          }))
          
          // ありがとうメッセージの変更は関連する完了記録を再取得
          //  const completionId = (payload.new as any)?.completion_id || (payload.old as any)?.completion_id
          //  if (completionId) {
             fetchChores() // 簡単のため全体を再取得（ありがとうメッセージは頻度が低いため）
          //  }
        }
      )
      .subscribe((status, err) => {
        console.log('📡 Realtime subscription status:', status, err)
        
        // エラーがある場合はログに記録
        if (err) {
          console.error('Realtime subscription error:', err)
        }
        
        // 接続状態を更新
        setRealtimeEvents(prev => {
          const connectionStatus: 'unknown' | 'connected' | 'disconnected' | 'error' = 
            status === 'SUBSCRIBED' ? 'connected' : 
            status === 'CHANNEL_ERROR' ? 'error' : 'disconnected'
          
          const newState = {
            ...prev,
            connectionStatus,
            lastError: err ? String(err) : prev.lastError
          }
          
          // 接続成功時は接続時刻を記録
          if (status === 'SUBSCRIBED') {
            newState.lastConnectedAt = Date.now()
          }
          
          return newState
        })
        
        // エラー発生時に自動再接続を試みる
        if (status === 'CHANNEL_ERROR') {
          console.log('🔄 Attempting to reconnect in 3 seconds...')
          
          // 再接続試行回数をインクリメント
          setRealtimeEvents(prev => ({
            ...prev,
            reconnectAttempts: prev.reconnectAttempts + 1
          }))
          
          setTimeout(() => {
            console.log('🔄 Reconnecting to Realtime...')
            channel.subscribe()
          }, 3000)
        }
      })

    // Supabase公式推奨: 適切なクリーンアップ
    return () => {
      console.log('🧹 Cleaning up Realtime subscription')
      supabase.removeChannel(channel)
    }
  }, [user?.id, user, reconnectTrigger, fetchChores, fetchPartnerInfo, handleChoreChange, handleCompletionChange])

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center">読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">家事一覧</h2>

      {/* デバッグ・管理機能 */}
      <Accordion type="single" collapsible className="mb-6">
        <AccordionItem value="realtime-test">
          <AccordionTrigger className="text-lg font-semibold text-blue-800">
            🔧 リアルタイム接続テスト
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="space-y-2 text-sm">
                 <div>現在の家事数: <span className="font-bold text-blue-600">{chores.length}</span></div>
                 <div>ユーザーID: <span className="font-mono text-xs">{user?.id}</span></div>
                 <div className="flex items-center gap-2">
                   <span>接続状態:</span>
                   <span className={`px-2 py-1 rounded text-xs font-bold ${
                     realtimeEvents.connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
                     realtimeEvents.connectionStatus === 'error' ? 'bg-red-100 text-red-800' :
                     realtimeEvents.connectionStatus === 'disconnected' ? 'bg-yellow-100 text-yellow-800' :
                     'bg-gray-100 text-gray-800'
                   }`}>
                     {realtimeEvents.connectionStatus === 'connected' ? '🟢 接続中' :
                      realtimeEvents.connectionStatus === 'error' ? '🔴 エラー' :
                      realtimeEvents.connectionStatus === 'disconnected' ? '🟡 切断' :
                      '⚪ 不明'}
                   </span>
                   {realtimeEvents.connectionStatus === 'error' && (
                     <span className="text-xs text-red-600">
                       (自動再接続を試行中...)
                     </span>
                   )}
                 </div>
                 <div className="grid grid-cols-3 gap-2 mt-2">
                   <div className="text-center p-2 bg-green-100 rounded">
                     <div className="font-bold text-green-600">{realtimeEvents.inserts}</div>
                     <div className="text-xs">追加</div>
                   </div>
                   <div className="text-center p-2 bg-yellow-100 rounded">
                     <div className="font-bold text-yellow-600">{realtimeEvents.updates}</div>
                     <div className="text-xs">更新</div>
                   </div>
                   <div className="text-center p-2 bg-red-100 rounded">
                     <div className="font-bold text-red-600">{realtimeEvents.deletes}</div>
                     <div className="text-xs">削除</div>
                   </div>
                 </div>
                 <div className="mt-2">
                   <button
                     onClick={() => {
                       console.log('🔍 詳細状態確認')
                       console.log('リアルタイムイベント:', realtimeEvents)
                       console.log('家事数:', chores.length)
                       console.log('ユーザーID:', user?.id)
                       console.log('Supabase接続状態:', supabase)
                       
                       // 詳細表示を切り替え
                       setShowRealtimeDetails && setShowRealtimeDetails(prev => !prev)
                     }}
                     className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                   >
                     {showRealtimeDetails ? '詳細を隠す' : '詳細を表示'}
                   </button>
                 </div>
                 
                 {showRealtimeDetails && (
                   <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono overflow-x-auto">
                     <div>最終イベント: {realtimeEvents.lastEvent || 'なし'}</div>
                     <div>最終エラー: {realtimeEvents.lastError || 'なし'}</div>
                     <div>接続試行回数: {realtimeEvents.reconnectAttempts || 0}</div>
                     <div>最終接続時刻: {realtimeEvents.lastConnectedAt ? new Date(realtimeEvents.lastConnectedAt).toLocaleString() : 'なし'}</div>
                   </div>
                 )}
                 
                 <div className="flex gap-2 mt-2">
                   <Button 
                     onClick={() => {
                       console.log('🔄 手動再接続を試行')
                       // handleReconnect関数が定義されていれば呼び出し
                       handleReconnect && handleReconnect()
                     }}
                     variant="default"
                   >
                     再接続を試みる
                   </Button>
                   <Button 
                     onClick={() => {
                       console.log('🔔 テスト通知を送信')
                       addNotification({
                         title: 'テスト通知',
                         message: 'リアルタイム通知システムが正常に動作しています！',
                         type: 'info',
                         userId: user?.id
                       })
                     }}
                     variant="secondary"
                     size="sm"
                   >
                     テスト通知
                   </Button>
                   <Button 
                     onClick={() => setRealtimeEvents(prev => ({...prev, inserts: 0, updates: 0, deletes: 0}))}
                     variant="ghost"
                     size="sm"
                   >
                     カウンターリセット
                   </Button>
                 </div>
               </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="partner-debug">
          <AccordionTrigger className="text-sm font-semibold text-purple-800 dark:text-purple-400">
            🔧 パートナー状態デバッグ
          </AccordionTrigger>
          <AccordionContent>
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg dark:bg-purple-950/30 dark:border-purple-800">
              <div className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
                <div>hasPartner: <span className="font-mono">{String(hasPartner)}</span></div>
                <div>partnerInfo: <span className="font-mono">{partnerInfo ? JSON.stringify(partnerInfo) : 'null'}</span></div>
                <div>ユーザーID: <span className="font-mono text-xs">{user?.id}</span></div>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="partner-invitation">
          <AccordionTrigger className="text-lg font-semibold text-orange-800">
            😊 パートナーを招待
          </AccordionTrigger>
          <AccordionContent>
            {/* パートナー招待UI */}
            {hasPartner === false && (
              <div className="mb-4">
                <PartnerInvitation onPartnerLinked={handlePartnerLinked} />
              </div>
            )}

            {hasPartner === true && partnerInfo && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950/30 dark:border-green-800">
                <h3 className="text-lg font-semibold mb-2 text-green-800 dark:text-green-400">
                  👫 パートナー連携済み
                </h3>
                <div className="text-green-700 dark:text-green-300">
                  <p><span className="font-medium">パートナー:</span> {partnerInfo.name}</p>
                  <p className="text-sm mt-1">家事の追加・完了・削除がリアルタイムで共有されます</p>
                </div>
              </div>
            )}

            {hasPartner === null && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-950/30 dark:border-yellow-800">
                <h3 className="text-lg font-semibold mb-2 text-yellow-800 dark:text-yellow-400">
                  ⏳ パートナー情報を確認中...
                </h3>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm">
                  パートナー情報を取得しています。しばらくお待ちください。
                </p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      {/* 家事追加フォーム */}
      <form onSubmit={(e) => addChore(e)} className="mb-6">
        <div className="flex gap-2">
          <Input
            type="text"
            value={newChore}
            onChange={(e) => setNewChore(e.target.value)}
            placeholder="新しい家事を入力..."
            aria-label="新しい家事"
            disabled={isAdding}
            className="flex-1"
          />
          <Button
              type="submit"
              disabled={isAdding || !newChore.trim()}
              variant="default"
            >
            追加
          </Button>
        </div>
      </form>

      {/* 家事一覧 */}
      {loading ? (
        <div className="space-y-4" role="status" aria-live="polite" aria-label="家事データを読み込み中">
          {[...Array(3)].map((_, index) => (
            <div key={index} className="p-4 border rounded-lg bg-white border-gray-200 dark:bg-zinc-900 dark:border-zinc-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-6 h-6 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-5 w-32 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="w-8 h-8 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : chores.length === 0 ? (
        <div className="text-center py-8 text-gray-500" role="status" aria-live="polite">
          まだ家事が登録されていません。<br />
          上のフォームから家事を追加してみましょう！
        </div>
      ) : (
        <div 
          className="space-y-4" 
          role="list" 
          aria-label="家事一覧"
        >
          {chores.map((chore) => {
            const isCompleted = chore.done
            const latestCompletion = chore.completions?.[0]
            // TODO: Migration 003実行後に有効化
            // const hasThankYou = latestCompletion?.thanks && latestCompletion.thanks.length > 0
            const hasThankYou = false // 一時的に無効化

            return (
              <div
                key={chore.id}
                className={`p-4 border rounded-lg ${
                  isCompleted
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-200 dark:bg-zinc-900 dark:border-zinc-700'
                }`}
                role="listitem"
                data-chore-name={chore.title}
                aria-label={`家事: ${chore.title}, ${isCompleted ? '完了済み' : '未完了'}, ${chore.owner_id === user?.id ? '自分が作成' : 'パートナーが作成'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleChore(chore.id, chore.done ?? false)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isCompleted
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-500 dark:border-zinc-600'
                      }`}
                      aria-label={`${chore.title}を${isCompleted ? '未完了' : '完了'}にする`}
                      aria-checked={isCompleted ? 'true' : 'false'}
                      role="switch"
                    >
                      {isCompleted && (
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                    <div className="flex flex-col">
                      <span
                        className={`text-lg ${
                          isCompleted
                            ? 'line-through text-gray-500'
                            : 'text-gray-900 dark:text-zinc-100'
                        }`}
                      >
                        {chore.title}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-zinc-400">
                        {chore.owner_id === user?.id ? '自分が作成' : 'パートナーが作成'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* ありがとうボタン（完了済みで自分以外が完了した場合のみ表示） */}
                    {isCompleted && latestCompletion && latestCompletion.user_id !== user?.id && !hasThankYou && (
                      <Button
                        onClick={() => setShowThankYou(chore.id)}
                        variant="ghost"
                        size="sm"
                        className="text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-950/30"
                        aria-label={`${chore.title}の完了にありがとうメッセージを送る`}
                      >
                        ありがとう
                      </Button>
                    )}
                    <Button
                      onClick={() => deleteChore(chore.id)}
                      variant="ghost"
                      size="sm"
                      className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                      aria-label={`家事「${chore.title}」を削除する`}
                    >
                      削除
                    </Button>
                  </div>
                </div>

                {/* ありがとうメッセージ表示 */}
                {/* TODO: Migration 003実行後に有効化
                {hasThankYou && latestCompletion?.thanks && (
                  <div className="mt-3 p-3 bg-pink-50 border border-pink-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-pink-800 mb-2">💖 ありがとうメッセージ</h4>
                    {latestCompletion.thanks.map((thank) => (
                      <div key={thank.id} className="text-sm text-pink-700">
                        <p>&ldquo;{thank.message}&rdquo;</p>
                        <p className="text-xs text-pink-500 mt-1">
                          {new Date(thank.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                */}

                {/* ありがとうメッセージフォーム */}
                {showThankYou === chore.id && latestCompletion && latestCompletion.user_id && (
                  <div className="mt-3">
                    <ThankYouMessage
                      completionId={latestCompletion.id.toString()}
                      toUserId={latestCompletion.user_id}
                      toUserName="パートナー"
                      onSuccess={() => {
                        setShowThankYou(null)
                        fetchChores()
                      }}
                      onCancel={() => setShowThankYou(null)}
                    />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}