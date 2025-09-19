'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

// 型定義
type Chore = Database['public']['Tables']['chores']['Row']
type ChoreInsert = Database['public']['Tables']['chores']['Insert']
type Completion = Database['public']['Tables']['completions']['Row']

// 拡張された家事型（完了記録を含む）
export interface ExtendedChore extends Chore {
  completions?: Completion[]
}

/**
 * 家事管理のカスタムフック
 * 家事の取得、追加、更新、削除の責務を担当
 */
export function useChores() {
  const { user } = useAuth()
  const [chores, setChores] = useState<ExtendedChore[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)

  /**
   * プロフィールが存在しない場合は作成する（RLSの前提を満たすため）
   */
  const ensureOwnProfile = useCallback(async () => {
    if (!user) return
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()
      
      // 無限再帰エラーの場合はスキップ
      if (error && (error.code === '42P17' || error.message?.includes('infinite recursion'))) {
        console.warn('🔄 RLSポリシーの無限再帰エラーを検出。プロフィール確認をスキップします。')
        return
      }
      
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
  }, [user])

  /**
   * 家事一覧を取得（完了記録も含む）
   */
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
      
      setChores(choresData || [])
    } catch (error) {
      console.error('家事の取得に失敗しました:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  /**
   * 新しい家事を追加
   */
  const addChore = useCallback(async (title: string, partnerId?: string) => {
    if (!user || !title.trim()) return false

    console.log('➕ Starting add chore operation:', title.trim())
    setIsAdding(true)
    try {
      // RLS要件を満たすためプロフィールの存在を保証
      await ensureOwnProfile()

      const choreData: ChoreInsert = {
        title: title.trim(),
        owner_id: user.id,
        partner_id: partnerId || null,
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

      console.log('✨ Add chore completed successfully - UI updated locally; waiting for realtime confirmation')
      return true
    } catch (error: any) {
      console.error('❌ 家事の追加に失敗しました:', error)
      
      // より具体的なエラーメッセージを提供
      let errorMessage = '家事の追加に失敗しました。'
      
      if (error?.code === '42P17' || error?.message?.includes('infinite recursion')) {
        errorMessage = 'データベースの設定に問題があります。しばらく待ってから再度お試しください。'
      } else if (error?.code === '23503') {
        errorMessage = 'プロフィールの設定に問題があります。ページを再読み込みしてから再度お試しください。'
      } else if (error?.message?.includes('JWT')) {
        errorMessage = 'ログインの有効期限が切れています。再度ログインしてください。'
      } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください。'
      }
      
      throw new Error(errorMessage)
    } finally {
      setIsAdding(false)
    }
  }, [user, ensureOwnProfile])

  /**
   * 家事の完了状態を切り替える
   */
  const toggleChore = useCallback(async (choreId: number, currentDone: boolean) => {
    if (!user) return false

    console.log('🔄 Toggling chore completion:', { choreId, currentDone, newDone: !currentDone })

    try {
      const newDone = !currentDone

      // ✅ 即時反映: ローカル状態を先に更新（UX向上）
      setChores(prev => prev.map(chore => 
        chore.id === choreId 
          ? { ...chore, done: newDone }
          : chore
      ))

      // 家事の完了状態を更新
      const { error: choreError } = await supabase
        .from('chores')
        .update({ done: newDone })
        .eq('id', choreId)

      if (choreError) {
        // エラー時はローカル状態を元に戻す
        setChores(prev => prev.map(chore => 
          chore.id === choreId 
            ? { ...chore, done: currentDone }
            : chore
        ))
        throw choreError
      }

      if (newDone) {
        // 完了記録を作成
        const { error: completionError } = await supabase
          .from('completions')
          .insert([{
            chore_id: choreId,
            user_id: user.id
          }])

        if (completionError) {
          console.error('完了記録の作成に失敗:', completionError)
          // 完了記録の作成に失敗した場合、家事の状態を元に戻す
          await supabase
            .from('chores')
            .update({ done: false })
            .eq('id', choreId)
          
          setChores(prev => prev.map(chore => 
            chore.id === choreId 
              ? { ...chore, done: false }
              : chore
          ))
          throw completionError
        }
      } else {
        // 未完了にする場合は完了記録を削除
        const { error: deleteError } = await supabase
          .from('completions')
          .delete()
          .eq('chore_id', choreId)
          .eq('user_id', user.id)

        if (deleteError) {
          console.error('完了記録の削除に失敗:', deleteError)
          throw deleteError
        }
      }

      console.log('✅ Toggle chore completed successfully - UI updated locally; realtime will sync')
      return true
    } catch (error: any) {
      console.error('❌ 家事の完了状態変更に失敗:', error)
      
      // より具体的なエラーメッセージを提供
      let errorMessage = '家事の完了状態の変更に失敗しました。'
      
      if (error?.code === '23503') {
        errorMessage = 'データベースの制約エラーが発生しました。プロフィールの設定を確認してください。'
      } else if (error?.message?.includes('JWT')) {
        errorMessage = 'ログインの有効期限が切れています。再度ログインしてください。'
      } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください。'
      }
      
      throw new Error(errorMessage)
    }
  }, [user])

  /**
   * 家事を削除
   */
  const deleteChore = useCallback(async (choreId: number) => {
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
      console.log('✨ Delete chore completed successfully - waiting for realtime update')
      return true
    } catch (error) {
      console.error('❌ 家事の削除に失敗しました:', error)
      
      // エラーの種類に応じたメッセージを設定
      let errorMessage = '家事の削除に失敗しました。'
      
      if (error instanceof Error) {
        if (error.message.includes('JWT')) {
          errorMessage = 'ログインセッションが期限切れです。再度ログインしてください。'
        } else if (error.message.includes('network') || error.message.includes('fetch')) {
          errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください。'
        } else if (error.message.includes('constraint') || error.message.includes('foreign key')) {
          errorMessage = 'この家事には関連データがあるため削除できません。'
        } else if (error.message.includes('permission') || error.message.includes('policy')) {
          errorMessage = 'この家事を削除する権限がありません。'
        }
      }
      
      throw new Error(errorMessage)
    }
  }, [])

  /**
   * リアルタイム更新用のセッター関数
   */
  const updateChores = useCallback((updater: (prev: ExtendedChore[]) => ExtendedChore[]) => {
    setChores(updater)
  }, [])

  return {
    chores,
    loading,
    isAdding,
    fetchChores,
    addChore,
    toggleChore,
    deleteChore,
    updateChores,
    ensureOwnProfile
  }
}