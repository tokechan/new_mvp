'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'
import ThankYouMessage from './ThankYouMessage'
import PartnerInvitation from './PartnerInvitation'

// 統合された型定義（両方の機能をサポート）
type Chore = Database['public']['Tables']['chores']['Row']
type ChoreInsert = Database['public']['Tables']['chores']['Insert']
type Completion = Database['public']['Tables']['completions']['Row']
type CompletionInsert = Database['public']['Tables']['completions']['Insert']
type ThankYou = Database['public']['Tables']['thanks']['Row']

// 拡張された家事型（完了記録とありがとうメッセージを含む）
interface ExtendedChore extends Chore {
  completions?: (Completion & {
    thanks?: ThankYou[]
  })[]
}

export default function ChoresList() {
  const { user } = useAuth()
  const [chores, setChores] = useState<ExtendedChore[]>([])
  const [loading, setLoading] = useState(true)
  const [newChore, setNewChore] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  const [showThankYou, setShowThankYou] = useState<string | null>(null) // 表示中のありがとうメッセージフォーム

  // パートナー情報の状態管理
  const [hasPartner, setHasPartner] = useState<boolean | null>(null)
  const [partnerInfo, setPartnerInfo] = useState<{ id: string; name: string } | null>(null)
  // リアルタイムイベント追跡用
  const [realtimeEvents, setRealtimeEvents] = useState({
    inserts: 0,
    updates: 0,
    deletes: 0,
    lastEvent: null as string | null,
    connectionStatus: 'unknown' as 'unknown' | 'connected' | 'disconnected' | 'error'
  })

  // 家事一覧を取得（完了記録とありがとうメッセージも含む）
  const fetchChores = async () => {
    if (!user) return

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
        .or(`owner_id.eq.${user.id},partner_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setChores(data || [])
    } catch (error) {
      console.error('家事の取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }

  /**
   * プロフィールが存在しない場合は作成する（RLSの前提を満たすため）。
   * - 一部のRLSポリシーで profiles.id = auth.uid() の存在を前提とすることがある。
   */
  const ensureOwnProfile = async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()
      if (error && error.code !== 'PGRST116') throw error // PGRST116: No rows found for single() 相当
      if (!data) {
        const displayName = user.email?.split('@')[0] || 'ユーザー'
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({ id: user.id, display_name: displayName })
        if (upsertError) throw upsertError
      }
    } catch (e) {
      console.warn('プロフィール確認/作成に失敗しました:', e)
    }
  }

  /**
   * パートナー情報を取得する
   */
  const fetchPartnerInfo = async () => {
    if (!user) {
      console.log('👤 ユーザーが未ログインのため、パートナー情報取得をスキップ')
      return
    }
    
    console.log('🔍 パートナー情報を取得中...', user.id)
    
    try {
      // まず基本的なプロフィール情報のみ取得
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('partner_id')
        .eq('id', user.id)
        .single()
      
      console.log('📊 プロフィール取得結果:', { profile, error })
      
      if (error) {
        console.error('❌ パートナー情報取得エラー:', error)
        // エラーでもhasPartnerをfalseに設定して招待UIを表示
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
      // エラーでもhasPartnerをfalseに設定して招待UIを表示
      setHasPartner(false)
      setPartnerInfo(null)
    }
    
    console.log('🏁 パートナー情報取得完了')
  }

  /**
   * パートナー連携完了時のコールバック
   */
  const handlePartnerLinked = async () => {
    // パートナー情報を再取得
    await fetchPartnerInfo()
    // 家事一覧も再取得（パートナーの家事が表示されるように）
    await fetchChores()
  }

  // 新しい家事を追加
  const addChore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newChore.trim()) return

    console.log('➕ Starting add chore operation:', newChore.trim())
    setIsAdding(true)
    try {
      // RLS要件を満たすためプロフィールの存在を保証
      await ensureOwnProfile()

      const choreData: ChoreInsert = {
        title: newChore.trim(),
        owner_id: user.id,
        partner_id: partnerInfo?.id || null,
        done: false
      }

      console.log('📝 Inserting chore data:', choreData)
      const { data, error } = await supabase
        .from('chores')
        .insert([choreData])
        .select()
        .single()

      if (error) {
        console.error('❌ Add chore operation failed:', error)
        throw error
      }

      console.log('✅ Add chore operation successful:', data)
      
      // ✅ 即時反映: 成功したらローカル状態を先に更新（UX向上）
      //    Realtimeはタブ間同期のために併用し、重複はIDで弾く
      if (data) {
        setChores(prev => {
          // 重複チェック（Realtimeでも同じ行が到着するため）
          if (prev.some(c => c.id === (data as any).id)) return prev
          return [data as ExtendedChore, ...prev]
        })
      }

      setNewChore('')
      console.log('✨ Add chore completed successfully - UI updated locally; waiting for realtime confirmation')
    } catch (error: any) {
      console.error('❌ 家事の追加に失敗しました:', error)
      alert('家事の追加に失敗しました。ログイン状態やプロフィールの作成状況を確認してください。')
    } finally {
      setIsAdding(false)
    }
  }

  /**
   * 家事の完了状態を切り替える
   * @param choreId - 家事のID
   * @param currentDone - 現在の完了状態
   */
  const toggleChore = async (choreId: string, currentDone: boolean) => {
    if (!user) return

    try {
      const newDone = !currentDone

      // 家事の完了状態を更新
      const { error: choreError } = await supabase
        .from('chores')
        .update({ done: newDone })
        .eq('id', choreId)

      if (choreError) throw choreError

      if (newDone) {
        // 完了記録を作成
        const { error: completionError } = await supabase
          .from('completions')
          .insert([{
            chore_id: choreId,
            user_id: user.id
          }])

        if (completionError) throw completionError
      } else {
        // 未完了にする場合は完了記録を削除
        const { error: deleteError } = await supabase
          .from('completions')
          .delete()
          .eq('chore_id', choreId)
          .eq('user_id', user.id)

        if (deleteError) throw deleteError
      }

      // 家事一覧を再取得
      fetchChores()
    } catch (error) {
      console.error('Error toggling chore:', error)
    }
  }

  // 家事を削除
  const deleteChore = async (choreId: string) => {
    if (!confirm('この家事を削除しますか？')) return

    console.log('🗑️ Starting delete operation for chore ID:', choreId)
    try {
      const { error, data } = await supabase
        .from('chores')
        .delete()
        .eq('id', choreId)
        .select() // 削除されたデータを取得

      if (error) {
        console.error('❌ Delete operation failed:', error)
        throw error
      }

      console.log('✅ Delete operation successful:', data)
      
      // ✅ 即時反映: ローカル状態からも先に削除
      setChores(prev => prev.filter(c => c.id !== choreId))
      
      console.log('✨ Delete chore completed successfully - UI updated locally; waiting for realtime update')
      
      // 削除操作後にリアルタイム接続状態を確認
      setTimeout(() => {
        console.log('⏰ Post-delete connection check: Realtime should still be active')
        console.log('📊 Current realtime events count:', realtimeEvents)
      }, 1000)
      
    } catch (error) {
      console.error('❌ 家事の削除に失敗しました:', error)
      alert('家事の削除に失敗しました。再度お試しください。')
    }
  }

  // 家事の完了状態を切り替え

  /**
   * 初期データ取得＋Supabase Realtime購読を設定する。
   * - userのowner/partnerに関係する行のみ購読（owner_id または partner_id が自分のID）。
   * - INSERT/UPDATE/DELETE をハンドリングしてローカル状態を即時同期。
   * - クリーンアップで前回のチャンネルを解除。
   */
  useEffect(() => {
    if (!user) {
      // 未ログイン時は表示を初期化してローディングを解除
      console.log('👤 No user logged in, skipping Realtime setup')
      setChores([])
      setLoading(false)
      return
    }

    console.log('🚀 Setting up Realtime for user:', user.id)
    // 初期ロード
    fetchChores()
    fetchPartnerInfo()

    // Realtime購読の設定
    const channel = supabase
      .channel('chores-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chores',
          filter: `owner_id=eq.${user.id}`
        },
        (payload) => {
          console.log('🔄 Realtime event received:', payload)
          setRealtimeEvents(prev => ({
            ...prev,
            [payload.eventType === 'INSERT' ? 'inserts' : 
             payload.eventType === 'UPDATE' ? 'updates' : 'deletes']: 
             prev[payload.eventType === 'INSERT' ? 'inserts' : 
                  payload.eventType === 'UPDATE' ? 'updates' : 'deletes'] + 1,
            lastEvent: new Date().toLocaleTimeString(),
            connectionStatus: 'connected'
          }))
          
          // データを再取得
          fetchChores()
        }
      )
      .subscribe((status) => {
        console.log('📡 Realtime subscription status:', status)
        setRealtimeEvents(prev => ({
          ...prev,
          connectionStatus: status === 'SUBSCRIBED' ? 'connected' : 
                           status === 'CHANNEL_ERROR' ? 'error' : 'disconnected'
        }))
      })

    return () => {
      console.log('🧹 Cleaning up Realtime subscription')
      supabase.removeChannel(channel)
    }
  }, [user?.id])

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

      {/* リアルタイム接続テスト */}
      <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-blue-800">🔧 リアルタイム接続テスト</h3>
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
           {realtimeEvents.lastEvent && (
             <div className="text-xs text-gray-600 mt-2">
               最新イベント: <span className="font-mono">{realtimeEvents.lastEvent}</span>
             </div>
           )}
         </div>
        <button
           onClick={() => {
             console.log('🔍 Manual connection status check')
             console.log('Current realtime events:', realtimeEvents)
             console.log('Current chores count:', chores.length)
             console.log('User ID:', user?.id)
             console.log('Supabase client status:', supabase)
           }}
           className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
         >
           詳細状態確認
         </button>
      </div>

      {/* パートナー状態デバッグ */}
      <div className="mb-4 p-3 bg-purple-50 border border-purple-200 rounded-lg dark:bg-purple-950/30 dark:border-purple-800">
        <h3 className="text-sm font-semibold mb-2 text-purple-800 dark:text-purple-400">
          🔧 パートナー状態デバッグ
        </h3>
        <div className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
          <div>hasPartner: <span className="font-mono">{String(hasPartner)}</span></div>
          <div>partnerInfo: <span className="font-mono">{partnerInfo ? JSON.stringify(partnerInfo) : 'null'}</span></div>
          <div>ユーザーID: <span className="font-mono text-xs">{user?.id}</span></div>
        </div>
      </div>

      {/* パートナー招待UI */}
      {hasPartner === false && (
        <div className="mb-6">
          <PartnerInvitation onPartnerLinked={handlePartnerLinked} />
        </div>
      )}

      {hasPartner === true && partnerInfo && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-950/30 dark:border-green-800">
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
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg dark:bg-yellow-950/30 dark:border-yellow-800">
          <h3 className="text-lg font-semibold mb-2 text-yellow-800 dark:text-yellow-400">
            ⏳ パートナー情報を確認中...
          </h3>
          <p className="text-yellow-700 dark:text-yellow-300 text-sm">
            パートナー情報を取得しています。しばらくお待ちください。
          </p>
        </div>
      )}

      {/* 家事追加フォーム */}
      <form onSubmit={addChore} className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={newChore}
            onChange={(e) => setNewChore(e.target.value)}
            placeholder="新しい家事を入力..."
            aria-label="新しい家事"
            className="flex-1 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 border border-gray-300 bg-white text-gray-900 placeholder-gray-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-400"
            disabled={isAdding}
          />
          <button
            type="submit"
            disabled={isAdding || !newChore.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAdding ? '追加中...' : '追加'}
          </button>
        </div>
      </form>

      {/* 家事一覧 */}
      {chores.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          まだ家事が登録されていません。<br />
          上のフォームから家事を追加してみましょう！
        </div>
      ) : (
        <div className="space-y-4">
          {chores.map((chore) => {
            const isCompleted = chore.done
            const latestCompletion = chore.completions?.[0]
            const hasThankYou = latestCompletion?.thanks && latestCompletion.thanks.length > 0

            return (
              <div
                key={chore.id}
                className={`p-4 border rounded-lg ${
                  isCompleted
                    ? 'bg-green-50 border-green-200'
                    : 'bg-white border-gray-200 dark:bg-zinc-900 dark:border-zinc-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => toggleChore(chore.id, chore.done)}
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isCompleted
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-green-500 dark:border-zinc-600'
                      }`}
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
                      <button
                        onClick={() => setShowThankYou(latestCompletion.id)}
                        className="px-3 py-1 text-pink-600 hover:bg-pink-50 rounded transition-colors dark:hover:bg-pink-950/30"
                      >
                        ありがとう
                      </button>
                    )}
                    <button
                      onClick={() => deleteChore(chore.id)}
                      className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors dark:hover:bg-red-950/30"
                    >
                      削除
                    </button>
                  </div>
                </div>

                {/* ありがとうメッセージ表示 */}
                {hasThankYou && latestCompletion?.thanks && (
                  <div className="mt-3 p-3 bg-pink-50 border border-pink-200 rounded-lg">
                    <h4 className="text-sm font-semibold text-pink-800 mb-2">💖 ありがとうメッセージ</h4>
                    {latestCompletion.thanks.map((thank) => (
                      <div key={thank.id} className="text-sm text-pink-700">
                        <p>"{thank.message}"</p>
                        <p className="text-xs text-pink-500 mt-1">
                          {new Date(thank.created_at).toLocaleString()}
                        </p>
                      </div>
                    ))}
                  </div>
                )}

                {/* ありがとうメッセージフォーム */}
                {showThankYou === latestCompletion?.id && latestCompletion && (
                  <div className="mt-3">
                    <ThankYouMessage
                      completionId={latestCompletion.id}
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