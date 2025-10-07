'use client'

import { User } from '@supabase/supabase-js'
import { createSupabaseBrowserClient } from '@/lib/supabase'

/**
 * プロフィール管理を行うサービスクラス
 * 単一責務: ユーザープロフィールのCRUD操作
 */
export class ProfileService {
  private supabase = createSupabaseBrowserClient()

  /**
   * ログイン済みユーザーのプロフィールをprofilesテーブルに自動作成/更新する
   * - RLSポリシーがprofiles参照を前提とする場合の挿入失敗を防止
   * - 表示名は user_metadata.name もしくはメールローカル部を使用
   */
  async ensureProfile(user: User): Promise<void> {
    console.log('👤 プロフィール確認開始:', {
      userId: user.id,
      email: user.email,
      userMetadata: user.user_metadata
    })
    
    try {
      // 現在のセッション状態を確認
      const { data: sessionData } = await this.supabase.auth.getSession()
      console.log('👤 現在のSupabaseセッション:', {
        hasSession: !!sessionData.session,
        sessionUserId: sessionData.session?.user?.id,
        accessToken: sessionData.session?.access_token ? '存在' : '無し'
      })
      
      const displayName = (user.user_metadata?.name as string | undefined) || 
                         (user.email?.split('@')[0] ?? 'ユーザー')
      
      console.log('👤 プロフィールupsert実行:', {
        id: user.id,
        display_name: displayName
      })
      
      const { data, error } = await this.supabase.from('profiles').upsert({
        id: user.id,
        display_name: displayName,
      }).select()
      
      console.log('👤 プロフィールupsert結果:', { data, error })
      
      // 無限再帰エラーの場合は警告のみ
      if (error && (error.code === '42P17' || error.message?.includes('infinite recursion'))) {
        console.warn('🔄 RLSポリシーの無限再帰エラーを検出。プロフィール作成をスキップします。')
        return
      }
      
      if (error) {
        console.error('👤 プロフィール作成エラー詳細:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw error
      }
      
      console.log('👤 プロフィール確認完了')
    } catch (err) {
      console.error('👤 プロフィールの自動作成/更新に失敗しました:', err)
      throw err
    }
  }

  /**
   * プロフィール情報を取得
   */
  async getProfile(userId: string) {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * プロフィール情報を更新
   */
  async updateProfile(userId: string, updates: { display_name?: string }) {
    const { data, error } = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  /**
   * プロフィールの存在確認
   */
  async profileExists(userId: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single()
    
    return !error && !!data
  }
}

// シングルトンインスタンス
export const profileService = new ProfileService()