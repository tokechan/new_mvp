'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

// 新しいデータベーススキーマに対応した型定義
type Chore = {
  id: string
  owner_id: string
  partner_id: string | null
  title: string
  done: boolean
  created_at: string
}

type ChoreInsert = {
  owner_id: string
  partner_id?: string | null
  title: string
  done?: boolean
}

export default function ChoresList() {
  const { user } = useAuth()
  const [chores, setChores] = useState<Chore[]>([])
  const [loading, setLoading] = useState(true)
  const [newChore, setNewChore] = useState('')
  const [isAdding, setIsAdding] = useState(false)
  // リアルタイムイベント追跡用
  const [realtimeEvents, setRealtimeEvents] = useState({
    inserts: 0,
    updates: 0,
    deletes: 0,
    lastEvent: null as string | null,
    connectionStatus: 'unknown' as 'unknown' | 'connected' | 'disconnected' | 'error'
  })

  /**
   * 自分がownerまたはpartnerの家事を取得する。
   * RLSにより他ユーザーのデータは除外される。
   */
  const fetchChores = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('chores')
        .select('*')
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
        partner_id: null, // 後でパートナー設定機能を追加予定
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
          return [data as Chore, ...prev]
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
   * 家事の完了状態を切り替える。完了に変更された場合はcompletionsへ記録。
   */
  const toggleChore = async (choreId: string, currentDone: boolean) => {
    const newDone = !currentDone
    console.log(`🔄 Starting toggle chore operation: ID=${choreId}, ${currentDone ? 'completed' : 'pending'} → ${newDone ? 'completed' : 'pending'}`)
    
    try {
      console.log('📝 Updating chore status in database')
      const { error } = await supabase
        .from('chores')
        .update({ done: newDone })
        .eq('id', choreId)

      if (error) {
        console.error('❌ Toggle chore operation failed:', error)
        throw error
      }

      console.log('✅ Chore status updated successfully')

      // ✅ 即時反映: ローカル状態の done を先に更新
      setChores(prev => prev.map(c => (c.id === choreId ? { ...c, done: newDone } : c)))

      // 完了時にcompletionsテーブルにレコードを追加
      if (newDone && user) {
        console.log('📝 Adding completion record')
        const { error: completionError } = await supabase
          .from('completions')
          .insert({
            chore_id: choreId,
            user_id: user.id
          })
        
        if (completionError) {
          console.error('❌ 完了記録の追加に失敗しました:', completionError)
        } else {
          console.log('✅ Completion record added successfully')
        }
      }

      console.log('✨ Toggle chore completed successfully - UI updated locally; waiting for realtime update')
    } catch (error) {
      console.error('❌ 家事の更新に失敗しました:', error)
      alert('家事の更新に失敗しました。再度お試しください。')
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

    // 🔄 Back to Basic: 複雑なハンドラーを削除してシンプルに

    // 🔄 Back to Basic: 最もシンプルなRealtime実装
     console.log('🔄 Setting up Realtime subscription with REPLICA IDENTITY FULL')
     console.log('🔧 User ID for filters:', user.id)
     
     // 適切なサーバ側フィルタに復旧
     console.log('🔄 Restoring proper server-side filters')
     const channel = supabase
       .channel(`chores-realtime-${user.id}-${Date.now()}`)
       .on('postgres_changes', { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'chores',
          filter: `owner_id=eq.${user.id}`
        }, (payload) => {
           console.log('🟢 INSERT EVENT RECEIVED (owner):', payload)
           const newChore = payload.new as Chore
           // クライアント側フィルタリング: owner_idまたはpartner_idがユーザーIDと一致する場合のみ処理
           if (newChore && (newChore.owner_id === user.id || newChore.partner_id === user.id)) {
             console.log('📝 Adding chore to state:', newChore.title)
             setChores(prev => {
               // 重複チェック（ID型の不一致対応: 文字列化して比較）
               const exists = prev.some(c => String(c.id) === String(newChore.id))
               if (exists) {
                 console.log('⚠️ INSERT: Chore already exists, skipping:', newChore.id)
                 return prev
               }
               const updated = [newChore, ...prev]
               console.log('📊 Updated chores count:', updated.length)
               return updated
             })
             setRealtimeEvents(prev => ({
               ...prev, 
               inserts: prev.inserts + 1,
               lastEvent: `INSERT: ${newChore.title}`
             }))
           } else {
             console.log('⚠️ INSERT: Chore not for this user, skipping')
           }
        })
       // partner_idフィルタを削除（nullの場合にマッチしないため）
       // owner_idのみでフィルタリングし、クライアント側で追加判定を行う
       .on('postgres_changes', { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'chores',
          filter: `owner_id=eq.${user.id}`
        }, (payload) => {
           console.log('🟡 UPDATE EVENT RECEIVED (owner):', payload)
           const updatedChore = payload.new as Chore
           // クライアント側フィルタリング: owner_idまたはpartner_idがユーザーIDと一致する場合のみ処理
           if (updatedChore && (updatedChore.owner_id === user.id || updatedChore.partner_id === user.id)) {
             console.log('📝 Updating chore in state:', updatedChore.title)
             setChores(prev => {
               // ID型の不一致対応: 文字列化して比較
               const updated = prev.map(c => String(c.id) === String(updatedChore.id) ? updatedChore : c)
               console.log('📊 Updated chores after UPDATE:', updated.length)
               return updated
             })
             setRealtimeEvents(prev => ({
               ...prev, 
               updates: prev.updates + 1,
               lastEvent: `UPDATE: ${updatedChore.title}`
             }))
           } else {
             console.log('⚠️ UPDATE: Chore not for this user, skipping')
           }
        })
       // partner_idフィルタを削除（nullの場合にマッチしないため）
       // owner_idのみでフィルタリングし、クライアント側で更新判定を行う
       .on('postgres_changes', { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'chores',
          filter: `owner_id=eq.${user.id}`
        }, (payload) => {
          console.log('🔴 DELETE EVENT RECEIVED (owner):', payload)
          const deletedId = payload.old.id
          if (deletedId) {
            console.log('📝 Removing chore from state:', deletedId)
            setChores(prev => {
              // ID型の不一致対応: 文字列化して比較
              const updated = prev.filter(c => String(c.id) !== String(deletedId))
              console.log('📊 Updated chores after DELETE:', updated.length)
              return updated
            })
            setRealtimeEvents(prev => ({
              ...prev, 
              deletes: prev.deletes + 1,
              lastEvent: `DELETE: ${deletedId}`
            }))
          }
        })
       .on('postgres_changes', { 
          event: 'DELETE', 
          schema: 'public', 
          table: 'chores',
          filter: `partner_id=eq.${user.id}`
        }, (payload) => {
          console.log('🔴 DELETE EVENT RECEIVED (partner):', payload)
          const deletedId = payload.old.id
          if (deletedId) {
            console.log('📝 Removing chore from state (as partner):', deletedId)
            setChores(prev => {
              // ID型の不一致対応: 文字列化して比較
              const updated = prev.filter(c => String(c.id) !== String(deletedId))
              console.log('📊 Updated chores after DELETE:', updated.length)
              return updated
            })
            setRealtimeEvents(prev => ({
              ...prev, 
              deletes: prev.deletes + 1,
              lastEvent: `DELETE: ${deletedId}`
            }))
          }
        })
      .subscribe((status, err) => {
        console.log('📡 Realtime subscription status:', status, 'for user:', user.id)
        
        // 接続状態を更新
        setRealtimeEvents(prev => ({
          ...prev,
          connectionStatus: status === 'SUBSCRIBED' ? 'connected' : 
                           status === 'CHANNEL_ERROR' ? 'error' : 
                           status === 'TIMED_OUT' ? 'disconnected' : 'unknown'
        }))
        
        if (err) {
          console.error('❌ Realtime subscription error:', err)
          setRealtimeEvents(prev => ({ ...prev, connectionStatus: 'error' }))
        }
        if (status === 'SUBSCRIBED') {
          console.log('✅ Successfully subscribed to realtime changes for user:', user.id)
          console.log('🔍 Listening for events on chores table with filters:')
          console.log('  - owner_id=eq.' + user.id)
          console.log('  - partner_id=eq.' + user.id)
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Channel error - check Supabase connection and RLS policies')
        }
        if (status === 'TIMED_OUT') {
          console.error('⏰ Subscription timed out - check network connection')
        }
      })

    console.log('📡 Realtime channel created for user:', user.id)
    console.log('🔗 Channel name:', `chores-${user.id}`)

    // DEBUG: Channel to receive all events without filters
    const debugChannel = supabase
      .channel(`chores-debug-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'chores' },
        (payload) => {
          console.log('🐞 DEBUG EVENT (no filter):', payload)
        }
      )
      .subscribe()

    return () => {
      // 前回の購読を解除
      console.log('🧹 Cleaning up Realtime subscription for user:', user.id)
      supabase.removeChannel(channel)
      supabase.removeChannel(debugChannel)
    }
  }, [user?.id])

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-lg">家事を読み込み中...</div>
      </div>
    )
  }


  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">家事一覧</h2>
      
      {/* リアルタイム接続テスト用パネル */}
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
             console.log('🔍 現在の状態確認:')
             console.log('- 家事数:', chores.length)
             console.log('- 家事一覧:', chores.map(c => ({ id: c.id, title: c.title, done: c.done })))
             console.log('- ユーザーID:', user?.id)
             console.log('- リアルタイムイベント:', realtimeEvents)
             console.log('- Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
             console.log('- Supabase Anon Key:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Not Set')
           }}
           className="mt-2 px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
         >
           詳細状態確認
         </button>
      </div>
      
      {/* 新しい家事を追加するフォーム */}
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
        <div className="space-y-3">
          {chores.map((chore) => (
            <div
              key={chore.id}
              className={`flex items-center justify-between p-4 border rounded-lg ${
                chore.done
                  ? 'bg-green-50 border-green-200'
                  : 'bg-white border-gray-200 dark:bg-zinc-900 dark:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <button
                  onClick={() => toggleChore(chore.id, chore.done)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    chore.done
                      ? 'bg-green-500 border-green-500 text-white'
                      : 'border-gray-300 hover:border-green-500 dark:border-zinc-600'
                  }`}
                >
                  {chore.done && (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
                <div className="flex flex-col">
                  <span
                    className={`text-lg ${
                      chore.done
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
              <button
                onClick={() => deleteChore(chore.id)}
                className="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors dark:hover:bg-red-950/30"
              >
                削除
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}