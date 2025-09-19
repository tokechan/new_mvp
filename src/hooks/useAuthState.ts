'use client'

import { useState, useEffect } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { authService } from '@/services/authService'
import { profileService } from '@/services/profileService'

/**
 * 認証状態を管理するカスタムフック
 * 単一責務: 認証状態の監視と管理
 */
export function useAuthState() {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // テスト環境では認証をスキップ
    if (process.env.NODE_ENV === 'test' || process.env.NEXT_PUBLIC_SKIP_AUTH === 'true') {
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
      
      // テスト用プロフィールを作成
      const createTestProfile = async () => {
        try {
          const { createSupabaseBrowserClient } = await import('@/lib/supabase')
          const supabase = createSupabaseBrowserClient()
          
          await supabase.from('profiles').upsert({
            id: mockUser.id,
            display_name: 'テストユーザー',
          })
        } catch (error) {
          console.warn('テスト用プロフィール作成に失敗:', error)
        }
      }
      
      createTestProfile()
      setUser(mockUser)
      setSession(mockSession)
      setLoading(false)
      return
    }

    // 初期セッション取得
    const getInitialSession = async () => {
      try {
        const session = await authService.getSession()
        setSession(session)
        setUser(session?.user ?? null)
        
        if (session?.user) {
          // プロフィール自動作成（非同期で実行）
          profileService.ensureProfile(session.user)
        }
      } catch (error) {
        console.error('初期セッション取得エラー:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // 認証状態の変更を監視
    const subscription = authService.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        
        if (session?.user) {
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