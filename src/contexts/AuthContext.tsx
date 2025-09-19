'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase'

// 認証コンテキストの型定義
interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, name?: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  signInWithGoogle: () => Promise<{ error: any }>
  clearError: () => void
}

// 認証コンテキストの作成
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// 認証プロバイダーコンポーネント
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createSupabaseBrowserClient()

  /**
   * ログイン済みユーザーのプロフィールをprofilesテーブルに自動作成/更新する。
   * - RLSポリシーがprofiles参照を前提とする場合の挿入失敗を防止
   * - 表示名は user_metadata.name もしくはメールローカル部を使用
   */
  const ensureProfile = async (u: User) => {
    try {
      const displayName = (u.user_metadata?.name as string | undefined) || (u.email?.split('@')[0] ?? 'ユーザー')
      await supabase.from('profiles').upsert({
        id: u.id,
        display_name: displayName,
      })
    } catch (err) {
      console.warn('プロフィールの自動作成/更新に失敗しました:', err)
    }
  }

  useEffect(() => {
    // 初期セッション取得
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      if (session?.user) {
        // プロフィール自動作成（非同期で実行）
        ensureProfile(session.user)
      }
    }

    getInitialSession()

    // 認証状態の変更を監視
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
        if (session?.user) {
          // プロフィール自動作成（非同期で実行）
          ensureProfile(session.user)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  // メールアドレスとパスワードでサインイン
  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  // メールアドレスとパスワードでサインアップ
  const signUp = async (email: string, password: string, name?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || '',
        },
      },
    })
    return { error }
  }

  // サインアウト
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // 状態をリセット
      setUser(null)
      setSession(null)
    } catch (error) {
      console.error('サインアウトエラー:', error)
      throw error
    }
  }

  // Googleでサインイン
  const signInWithGoogle = async () => {
    try {
      setError(null) // エラーをクリア
      console.log('Supabase Google OAuth開始...')
      console.log('リダイレクトURL:', `${window.location.origin}/auth/callback`)
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) {
        console.error('Supabase OAuth エラー:', error)
        setError(error.message || 'Google認証に失敗しました')
      } else {
        console.log('OAuth リダイレクト成功')
      }
      
      return { error }
    } catch (err) {
      console.error('OAuth 予期しないエラー:', err)
      const errorMessage = err instanceof Error ? err.message : 'Google認証中に予期しないエラーが発生しました'
      setError(errorMessage)
      return { error: err }
    }
  }

  // エラーをクリアする関数
  const clearError = () => {
    setError(null)
  }

  const value = {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// 認証コンテキストを使用するためのカスタムフック
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}