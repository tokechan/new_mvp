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
    try {
      const displayName = (user.user_metadata?.name as string | undefined) || 
                         (user.email?.split('@')[0] ?? 'ユーザー')
      
      const { error } = await this.supabase.from('profiles').upsert({
        id: user.id,
        display_name: displayName,
      })
      
      // 無限再帰エラーの場合は警告のみ
      if (error && (error.code === '42P17' || error.message?.includes('infinite recursion'))) {
        console.warn('🔄 RLSポリシーの無限再帰エラーを検出。プロフィール作成をスキップします。')
        return
      }
      
      if (error) throw error
    } catch (err) {
      console.warn('プロフィールの自動作成/更新に失敗しました:', err)
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