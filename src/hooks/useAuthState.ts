'use client'

import { useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { authService } from '@/services/authService'
import { profileService } from '@/services/profileService'
import { shouldUseMockAuth } from '@/utils/authMode'

/**
 * 認証状態を管理するカスタムフック
 * 単一責務: 認証状態の監視と管理
 */
export function useAuthState() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    console.log('🔐 useAuthState初期化開始')
    console.log('🔐 環境変数:', {
      NODE_ENV: process.env.NODE_ENV,
      SKIP_AUTH: process.env.NEXT_PUBLIC_SKIP_AUTH,
      mockAuth: shouldUseMockAuth(),
    })
    
    // テスト環境や許可された開発モードでは認証をスキップ
    if (shouldUseMockAuth()) {
      console.log('🔐 モック認証を使用')
      const mockUser = {
        id: '550e8400-e29b-41d4-a716-446655440000', // 有効なUUID形式
        email: 'test@example.com',
        user_metadata: { name: 'テストユーザー' },
        app_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as User
      
      const mockSession = {
        user: mockUser,
        access_token: 'mock-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        expires_at: Date.now() / 1000 + 3600,
        token_type: 'bearer',
      } as Session
      
      console.log('🔐 モックユーザー作成:', mockUser.id)
      
      // テスト用プロフィールを作成し、Supabaseクライアントにセッションを設定
      const createTestProfile = async () => {
        try {
          console.log('🔐 テスト用プロフィール作成開始')
          const { supabase } = await import('@/lib/supabase')
          
          // テスト環境では認証セッションを設定
          console.log('🔐 Supabaseセッション設定中...')
          await supabase.auth.setSession({
            access_token: mockSession.access_token,
            refresh_token: mockSession.refresh_token
          })
          
          // 少し待機してセッションが設定されるのを待つ
          await new Promise(resolve => setTimeout(resolve, 100))
          
          // セッション確認
          const { data: sessionData } = await supabase.auth.getSession()
          console.log('🔐 設定後のセッション:', sessionData.session?.user?.id)
          
          // テスト用プロフィールを作成
          console.log('🔐 プロフィール作成中...')
          const { data, error } = await supabase
            .from('profiles')
            .upsert({
              id: mockUser.id,
              display_name: mockUser.user_metadata?.name || 'テストユーザー',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
          
          if (error) {
            console.error('🔐 プロフィール作成エラー:', error)
          } else {
            console.log('🔐 プロフィール作成成功:', data)
          }
        } catch (error) {
          console.warn('🔐 テスト用プロフィール作成に失敗:', error)
        }
      }
      
      createTestProfile()
      setUser(mockUser)
      setSession(mockSession)
      setLoading(false)
      console.log('🔐 モック認証完了')
      return
    }

    // 初期セッション取得
    const getInitialSession = async () => {
      try {
        console.log('🔐 実際の認証セッション取得開始')
        const session = await authService.getSession()
        console.log('🔐 初期セッション取得結果:', {
          hasSession: !!session,
          userId: session?.user?.id,
          email: session?.user?.email,
          accessToken: session?.access_token ? '存在' : '無し'
        })
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          console.log('🔐 ユーザー認証済み、プロフィール確認開始')
          // プロフィール自動作成（非同期で実行）
          try {
            const profile = await profileService.ensureProfile(session.user)
            console.log('🔐 プロフィール確認完了:', profile)
          } catch (profileError) {
            console.error('🔐 プロフィール作成エラー:', profileError)
          }
        } else {
          console.log('🔐 ユーザー未認証')
        }
      } catch (error) {
        console.error('🔐 初期セッション取得エラー:', error)
      } finally {
        setLoading(false)
        console.log('🔐 認証状態初期化完了')
      }
    }

    getInitialSession()

    // 認証状態の変更を監視
    const subscription = authService.onAuthStateChange(
      async (event, session) => {
        console.log('🔐 認証状態変更:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id,
          email: session?.user?.email
        })
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        
        if (session?.user) {
          console.log('🔐 認証状態変更でプロフィール確認開始')
          // プロフィール自動作成（非同期で実行）
          profileService.ensureProfile(session.user)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return {
    user,
    session,
    loading,
  }
}
