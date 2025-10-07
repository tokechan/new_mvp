'use client'

import { Session, AuthChangeEvent } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase'

// 統一された返り値型
type AuthResult<T = unknown> = { data: T | null; error: Error | null }

/**
 * 認証サービス
 * Supabaseの認証機能をラップし、統一されたインターフェースを提供
 * 全メソッドで { data, error } 形式の統一された返り値を使用
 */
export class AuthService {
  // HMR対策: createSupabaseBrowserClient側でメモ化しておくことを推奨
  private supabase = createSupabaseBrowserClient()

  /**
   * メールアドレスとパスワードでサインイン
   */
  async signIn(email: string, password: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { data, error }
    } catch (e: any) {
      return { data: null, error: e }
    }
  }

  /**
   * メールアドレスとパスワードでサインアップ
   */
  async signUp(email: string, password: string, name?: string): Promise<AuthResult> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name ?? '',
          },
        },
      })
      return { data, error }
    } catch (e: any) {
      return { data: null, error: e }
    }
  }

  /**
   * サインアウト
   */
  async signOut(): Promise<AuthResult<void>> {
    try {
      const { error } = await this.supabase.auth.signOut()
      return { data: undefined, error }
    } catch (e: any) {
      return { data: undefined, error: e }
    }
  }

  /**
   * Googleアカウントでサインイン
   */
  async signInWithGoogle(): Promise<AuthResult> {
    try {
      console.log('🔄 Google認証開始')
      
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) {
        console.error('❌ Google認証エラー:', error)
        return { data: null, error }
      }

      console.log('✅ Google認証リクエスト送信完了')
      return { data, error }
    } catch (error) {
      console.error('❌ Google認証失敗:', error)
      return { data: null, error: error as Error }
    }
  }



  /**
   * 現在のセッションを取得
   * セキュリティ上、自動ログイン機能は削除
   */
  async getSession(): Promise<Session | null> {
    try {
      const { data: { session } } = await this.supabase.auth.getSession()
      return session
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('❌ セッション取得エラー:', error)
      }
      return null
    }
  }

  /**
   * 認証状態の変更を監視
   * @param callback - 認証状態変更時のコールバック関数
   * @returns subscription - 呼び出し側でsubscription.unsubscribe()を忘れずに実行してください
   */
  onAuthStateChange(callback: (event: AuthChangeEvent, session: Session | null) => void) {
    const { data: { subscription } } = this.supabase.auth.onAuthStateChange(callback)
    return subscription
  }
}

// シングルトンインスタンス
export const authService = new AuthService()