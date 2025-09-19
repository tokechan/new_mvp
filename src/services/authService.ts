'use client'

import { User, Session } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase'

/**
 * 認証操作を管理するサービスクラス
 * 単一責務: Supabaseの認証機能のラッパー
 */
export class AuthService {
  private supabase = createSupabaseBrowserClient()

  /**
   * メールアドレスとパスワードでサインイン
   */
  async signIn(email: string, password: string) {
    const { error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  /**
   * メールアドレスとパスワードでサインアップ
   */
  async signUp(email: string, password: string, name?: string) {
    const { error } = await this.supabase.auth.signUp({
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

  /**
   * サインアウト
   */
  async signOut() {
    const { error } = await this.supabase.auth.signOut()
    if (error) throw error
  }

  /**
   * Googleでサインイン
   */
  async signInWithGoogle() {
    try {
      console.log('Supabase Google OAuth開始...')
      console.log('リダイレクトURL:', `${window.location.origin}/auth/callback`)
      
      const { error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })
      
      if (error) {
        console.error('Supabase OAuth エラー:', error)
      } else {
        console.log('OAuth リダイレクト成功')
      }
      
      return { error }
    } catch (err) {
      console.error('OAuth 予期しないエラー:', err)
      return { error: err }
    }
  }

  /**
   * 現在のセッションを取得
   */
  async getSession() {
    const { data: { session } } = await this.supabase.auth.getSession()
    return session
  }

  /**
   * 認証状態の変更を監視
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    const { data: { subscription } } = this.supabase.auth.onAuthStateChange(callback)
    return subscription
  }
}

// シングルトンインスタンス
export const authService = new AuthService()