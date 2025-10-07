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
 * 家事データ管理フック
 * リアルタイム機能はuseRealtimeフックに委譲し、データ管理に専念
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
    connectionStatus: 'disconnected',
    lastEvent: null
  })

  /**
   * 家事一覧を取得
   */
  const fetchChores = useCallback(async () => {
    if (!user) {
      setChores([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      console.log('🔄 Fetching chores for user:', user.id)

      const { data, error } = await supabase
        .from('chores')
        .select('*')
        .or(`owner_id.eq.${user.id},partner_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ 家事の取得に失敗しました:', error)
        throw error
      }

      console.log('✅ 家事を取得しました:', data?.length || 0, '件')
      setChores(data || [])
    } catch (error) {
      console.error('❌ 家事の取得中にエラーが発生しました:', error)
      setChores([])
    } finally {
      setLoading(false)
    }
  }, [user])

  /**
   * 家事を追加
   */
  const addChore = useCallback(async (title: string) => {
    if (!user) {
      throw new Error('ユーザーがログインしていません')
    }

    try {
      setIsAdding(true)
      console.log('➕ 家事を追加中:', title)

      const choreData: ChoreInsert = {
        title: title.trim(),
        done: false,
        owner_id: user.id,
        partner_id: null
      }

      const { data, error } = await supabase
        .from('chores')
        .insert([choreData])
        .select()
        .single()

      if (error) {
        console.error('❌ 家事の追加に失敗しました:', error)
        throw error
      }

      console.log('✅ 家事を追加しました:', data)
      
      // リアルタイムイベントで更新されるため、手動でstateを更新しない
      // setChores(prev => [data, ...prev])
      
    } catch (error) {
      console.error('❌ 家事の追加に失敗しました:', error)
      throw error
    } finally {
      setIsAdding(false)
    }
  }, [user])

  /**
   * 家事の完了状態を切り替え
   */
  const toggleChore = useCallback(async (choreId: string, currentDone: boolean) => {
    try {
      console.log('🔄 家事の状態を変更中:', choreId, '→', !currentDone)

      const { data, error } = await supabase
        .from('chores')
        .update({ done: !currentDone })
        .eq('id', choreId)
        .select()
        .single()

      if (error) {
        console.error('❌ 家事の状態変更に失敗しました:', error)
        throw error
      }

      console.log('✅ 家事の状態を変更しました:', data)
      
      // リアルタイムイベントで更新されるため、手動でstateを更新しない
      // setChores(prev => prev.map(c => c.id === choreId ? data : c))
      
    } catch (error) {
      console.error('❌ 家事の状態変更に失敗しました:', error)
      throw error
    }
  }, [])

  /**
   * 家事を削除
   */
  const deleteChore = useCallback(async (choreId: string) => {
    try {
      console.log('🗑️ 家事を削除中:', choreId)

      const { error } = await supabase
        .from('chores')
        .delete()
        .eq('id', choreId)

      if (error) {
        console.error('❌ 家事の削除に失敗しました:', error)
        throw error
      }

      console.log('✅ 家事を削除しました:', choreId)
      
      // リアルタイムイベントで更新されるため、手動でstateを更新しない
      // setChores(prev => prev.filter(c => c.id !== choreId))
      
    } catch (error) {
      console.error('❌ 家事の削除に失敗しました:', error)
      throw error
    }
  }, [])

  // 初期データ取得
  useEffect(() => {
    fetchChores()
  }, [fetchChores])

  return {
    chores,
    loading,
    isAdding,
    realtimeEvents,
    addChore,
    toggleChore,
    deleteChore,
    refetch: fetchChores,
    setChores, // リアルタイムフックから状態を更新するために公開
    setRealtimeEvents // リアルタイムイベント情報を更新するために公開
  }
}