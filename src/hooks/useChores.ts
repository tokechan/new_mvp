'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Chore, ChoreInsert, RealtimeEvents } from '@/types/chore'
import { ChoreService } from '@/services/choreService'

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
      console.log('🚫 ユーザーが未ログイン状態です')
      setChores([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      console.log('🔄 Fetching chores for user:', user.id)
      
      // 認証状態の詳細確認
      const { data: { session } } = await supabase.auth.getSession()
      console.log('🔍 Current session:', {
        hasSession: !!session,
        userId: session?.user?.id,
        accessToken: session?.access_token ? 'present' : 'missing',
        expiresAt: session?.expires_at
      })

      const { data, error } = await supabase
        .from('chores')
        .select('*')
        .or(`owner_id.eq.${user.id},partner_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ 家事の取得に失敗しました:', error)
        console.error('❌ エラー詳細:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
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
      console.error('🚫 家事追加失敗: ユーザーが未ログイン')
      throw new Error('ユーザーがログインしていません')
    }

    try {
      setIsAdding(true)
      console.log('➕ 家事を追加中:', title, 'by user:', user.id)
      
      // 認証状態の確認
      const { data: { session } } = await supabase.auth.getSession()
      console.log('🔍 Add chore session check:', {
        hasSession: !!session,
        userId: session?.user?.id,
        matchesCurrentUser: session?.user?.id === user.id
      })

      // パートナーIDを取得（連携済みなら共有家事として作成）
      let partnerId: string | null = null
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('partner_id')
          .eq('id', user.id)
          .single()

        if (profileError) {
          console.warn('⚠️ パートナーID取得に失敗（共有なしで作成）:', profileError)
        } else {
          partnerId = profile?.partner_id ?? null
        }
      } catch (e) {
        console.warn('⚠️ パートナー情報取得中に例外（共有なしで作成）:', e)
      }

      const choreData: ChoreInsert = {
        title: title.trim(),
        done: false,
        owner_id: user.id,
        partner_id: partnerId
      }

      console.log('📝 Inserting chore data:', choreData)

      const { data, error } = await supabase
        .from('chores')
        .insert([choreData])
        .select()
        .single()

      if (error) {
        console.error('❌ 家事の追加に失敗しました:', error)
        console.error('❌ 追加エラー詳細:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw error
      }

      console.log('✅ 家事を追加しました:', data)
      
      // 🔄 即座にローカル状態を更新（リアルタイムイベントを待たない）
      console.log('🔄 Adding chore to local state immediately:', data.title)
      setChores(prev => [data, ...prev])
      
      // リアルタイムイベント情報を更新
      setRealtimeEvents(prev => ({
        ...prev,
        inserts: prev.inserts + 1,
        lastEvent: `Added: ${data.title}`,
        connectionStatus: 'connected'
      }))
      
      return true
      
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
  const toggleChore = useCallback(async (choreId: number, currentDone: boolean) => {
    if (!user) {
      const errorMessage = '家事の状態更新には認証が必要です。'
      console.error(`❌ ${errorMessage}`)
      throw new Error(errorMessage)
    }

    try {
      console.log(`🔄 [useChores] 家事の状態を変更中 (via service): choreId=${choreId}, newDoneState=${!currentDone}`)

      // choreServiceで完了状態を切り替え（completionsテーブルも更新）
      const updatedChore = await ChoreService.toggleChoreCompletion(choreId, user.id, !currentDone)

      console.log('✅ [useChores] 家事の状態をサービス経由で変更しました:', updatedChore)

      // 即座にローカル状態を更新してUIに反映
      setChores(prevChores =>
        prevChores.map(chore =>
          chore.id === choreId
            ? { ...chore, ...updatedChore }
            : chore
        )
      )

    } catch (error) {
      console.error('❌ [useChores] 家事の状態変更に失敗しました (service error):', error)
      throw error
    }
  }, [user])

  /**
   * 家事を削除
   */
  const deleteChore = useCallback(async (choreId: number) => {
    try {
      console.log('🗑️ 家事を削除中:', choreId)
      
      // 認証状態の確認
      const { data: { session } } = await supabase.auth.getSession()
      console.log('🔍 Delete chore session check:', {
        hasSession: !!session,
        userId: session?.user?.id,
        choreId: choreId
      })

      const { error } = await supabase
        .from('chores')
        .delete()
        .eq('id', choreId)

      if (error) {
        console.error('❌ 家事の削除に失敗しました:', error)
        console.error('❌ 削除エラー詳細:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          choreId: choreId
        })
        throw error
      }

      console.log('✅ 家事を削除しました:', choreId)
      
      // 🔄 即座にローカル状態を更新（リアルタイムイベントを待たない）
      console.log('🔄 Removing chore from local state immediately:', choreId)
      setChores(prev => {
        const filtered = prev.filter(c => c.id !== choreId)
        console.log('🔄 Chores after deletion:', filtered.length, 'items')
        return filtered
      })
      
      // リアルタイムイベント情報を更新
      setRealtimeEvents(prev => ({
        ...prev,
        deletes: prev.deletes + 1,
        lastEvent: `Deleted: ${choreId}`,
        connectionStatus: 'connected'
      }))
      
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