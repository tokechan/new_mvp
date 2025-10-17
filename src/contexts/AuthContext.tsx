'use client'

import React, { createContext, useContext } from 'react'
import { User, Session } from '@supabase/supabase-js'
import { useAuthState } from '@/hooks/useAuthState'
import { useAuthActions } from '@/hooks/useAuthActions'

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
  resendConfirmation: (email: string) => Promise<{ error: any }>
  clearError: () => void
}

// 認証コンテキストの作成
const AuthContext = createContext<AuthContextType | undefined>(undefined)

/**
 * リファクタリングされた認証プロバイダーコンポーネント
 * 単一責務の原則に従い、状態管理とアクションを分離したフックを使用
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // 認証状態管理フック
  const { user, session, loading: stateLoading } = useAuthState()
  
  // 認証操作フック
  const {
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resendConfirmation,
    clearError,
    error,
    loading: actionLoading,
  } = useAuthActions()

  // 全体のローディング状態（状態取得中またはアクション実行中）
  const loading = stateLoading || actionLoading

  const value = {
    user,
    session,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    signInWithGoogle,
    resendConfirmation,
    clearError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

/**
 * 認証コンテキストを使用するためのカスタムフック
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}