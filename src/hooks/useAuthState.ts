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