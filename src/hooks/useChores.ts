'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Chore, ChoreInsert, RealtimeEvents } from '@/types/chore'

/**
 * テスト環境でSupabaseクライアントにセッションを設定するヘルパー関数
 */
const ensureTestSession = async () => {
  if (process.env.NODE_ENV === 'test' || process.env.NEXT_PUBLIC_SKIP_AUTH === 'true') {
    const mockUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'test@example.com',
      user_metadata: { name: 'テストユーザー' },
      app_metadata: {},
      aud: 'authenticated',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    
    const mockSession = {
      user: mockUser,
      access_token: 'mock-token',
      refresh_token: 'mock-refresh-token',
      expires_in: 3600,
      expires_at: Date.now() / 1000 + 3600,
      token_type: 'bearer',
    }
    
    try {
      await supabase.auth.setSession({
        access_token: mockSession.access_token,
        refresh_token: mockSession.refresh_token
      })
      
      // セッション設定後に少し待機
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // セッションが正しく設定されたか確認
      const { data: { session } } = await supabase.auth.getSession()
      console.log('テスト用セッション設定完了:', session?.user?.id)
      
      return true
    } catch (error) {
      console.warn('テスト用セッション設定に失敗:', error)
      return false
    }
  }
  return true
}

/**
 * 家事管理のカスタムフック
 * ChoresList.tsxから分離されたビジネスロジック
 */
export function useChores() {
  const { user } = useAuth()
  const [chores, setChores] = useState<Chore[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [realtimeEvents, setRealtimeEvents] = useState<RealtimeEvents>({
    inserts: 0,
    updates: 0,
    deletes: 0,
    lastEvent: null,
    connectionStatus: 'unknown'
  })

  /**
   * プロフィールが存在しない場合は作成する（RLSの前提を満たすため）
   */
  const ensureOwnProfile = useCallback(async () => {
    if (!user) return
    
    try {
      console.log('👤 プロフィール確認中:', user.id)
      
      // テスト環境では固定のユーザーIDを使用
      const userId = process.env.NODE_ENV === 'test' || process.env.NEXT_PUBLIC_SKIP_AUTH === 'true' 
        ? '550e8400-e29b-41d4-a716-446655440000' 
        : user.id
      
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId)
        .single()
        
      if (error && error.code !== 'PGRST116') {
        console.error('プロフィール確認エラー:', error)
        throw error
      }
      
      if (!data) {
        console.log('📝 プロフィールが存在しないため作成します')
        const displayName = user.email?.split('@')[0] || 'テストユーザー'
        const { error: upsertError } = await supabase
          .from('profiles')
          .upsert({ 
            id: userId, 
            display_name: displayName 
          })
          
        if (upsertError) {
          console.error('プロフィール作成エラー:', upsertError)
          throw upsertError
        }
        
        console.log('✅ プロフィールを作成しました:', displayName)
      } else {
        console.log('✅ プロフィールが存在します')
      }
    } catch (e) {
      console.warn('プロフィール確認/作成に失敗しました:', e)
      throw e
    }
  }, [user])

  /**
   * 自分がownerまたはpartnerの家事を取得する
   */
  const fetchChores = useCallback(async () => {
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
  }, [user])

  /**
   * 新しい家事を追加
   */
  const addChore = useCallback(async (title: string) => {
    if (!user || !title.trim()) return false

    console.log('➕ Starting add chore operation:', title.trim())
    setIsAdding(true)
    try {
      // テスト環境でのセッション設定
      const sessionReady = await ensureTestSession()
      if (!sessionReady) {
        throw new Error('テスト環境でのセッション設定に失敗しました')
      }
      await ensureOwnProfile()

      // テスト環境では固定のユーザーIDを使用
      const userId = process.env.NODE_ENV === 'test' || process.env.NEXT_PUBLIC_SKIP_AUTH === 'true' 
        ? '550e8400-e29b-41d4-a716-446655440000' 
        : user.id
      
      const choreData: ChoreInsert = {
        title: title.trim(),
        owner_id: userId,
        partner_id: null,
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
      
      // 即時反映: 成功したらローカル状態を先に更新
      if (data) {
        setChores(prev => {
          if (prev.some(c => c.id === (data as any).id)) return prev
          return [data as Chore, ...prev]
        })
      }

      console.log('✨ Add chore completed successfully')
      return true
    } catch (error: any) {
      console.error('❌ 家事の追加に失敗しました:', error)
      throw error
    } finally {
      setIsAdding(false)
    }
  }, [user, ensureOwnProfile])

  /**
   * 家事の完了状態を切り替える
   */
  const toggleChore = useCallback(async (choreId: string, currentDone: boolean) => {
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

      // 即時反映: ローカル状態の done を先に更新
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

      console.log('✨ Toggle chore completed successfully')
    } catch (error) {
      console.error('❌ 家事の更新に失敗しました:', error)
      throw error
    }
  }, [user])

  /**
   * 家事を削除
   */
  const deleteChore = useCallback(async (choreId: string) => {
    console.log('🗑️ Starting delete operation for chore ID:', choreId)
    try {
      const { error, data } = await supabase
        .from('chores')
        .delete()
        .eq('id', choreId)
        .select()

      if (error) {
        console.error('❌ Delete operation failed:', error)
        throw error
      }

      console.log('✅ Delete operation successful:', data)
      
      // 即時反映: ローカル状態からも先に削除
      setChores(prev => prev.filter(c => c.id !== choreId))
      
      console.log('✨ Delete chore completed successfully')
      
      // 削除操作後にリアルタイム接続状態を確認
      setTimeout(() => {
        console.log('⏰ Post-delete connection check: Realtime should still be active')
        console.log('📊 Current realtime events count:', realtimeEvents)
      }, 1000)
      
    } catch (error) {
      console.error('❌ 家事の削除に失敗しました:', error)
      throw error
    }
  }, [realtimeEvents])

  /**
   * リアルタイム購読の設定
   */
  useEffect(() => {
    if (!user) {
      console.log('👤 No user logged in, skipping Realtime setup')
      setChores([])
      setLoading(false)
      return
    }

    console.log('🚀 Setting up Realtime for user:', user.id)
    fetchChores()

    console.log('🔄 Setting up Realtime subscription with REPLICA IDENTITY FULL')
    console.log('🔧 User ID for filters:', user.id)
    
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
          if (newChore && (newChore.owner_id === user.id || newChore.partner_id === user.id)) {
            console.log('📝 Adding chore to state:', newChore.title)
            setChores(prev => {
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
          }
       })
      .on('postgres_changes', { 
         event: 'UPDATE', 
         schema: 'public', 
         table: 'chores',
         filter: `owner_id=eq.${user.id}`
       }, (payload) => {
          console.log('🟡 UPDATE EVENT RECEIVED (owner):', payload)
          const updatedChore = payload.new as Chore
          if (updatedChore && (updatedChore.owner_id === user.id || updatedChore.partner_id === user.id)) {
            console.log('📝 Updating chore in state:', updatedChore.title)
            setChores(prev => {
              const updated = prev.map(c => String(c.id) === String(updatedChore.id) ? updatedChore : c)
              console.log('📊 Updated chores after UPDATE:', updated.length)
              return updated
            })
            setRealtimeEvents(prev => ({
              ...prev, 
              updates: prev.updates + 1,
              lastEvent: `UPDATE: ${updatedChore.title}`
            }))
          }
       })
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
       }
     })

    console.log('📡 Realtime channel created for user:', user.id)

    return () => {
      console.log('🧹 Cleaning up Realtime subscription for user:', user.id)
      supabase.removeChannel(channel)
    }
  }, [user?.id, user, fetchChores])

  return {
    chores,
    loading,
    isAdding,
    realtimeEvents,
    addChore,
    toggleChore,
    deleteChore,
    refetch: fetchChores
  }
}