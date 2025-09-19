'use client'

import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

// 型定義
type Profile = Database['public']['Tables']['profiles']['Row']
type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

/**
 * パートナー関連データアクセス層
 * プロフィールとパートナー関係の管理を抽象化
 */
export class PartnerService {
  /**
   * ユーザーのプロフィールを取得
   */
  static async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // プロフィールが見つからない場合
      }
      console.error('プロフィールの取得に失敗:', error)
      throw new Error(`プロフィールの取得に失敗しました: ${error.message}`)
    }

    return data
  }

  /**
   * ユーザーのプロフィールを作成または更新
   */
  static async upsertProfile(userId: string, profileData: Partial<Profile>): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...profileData })
      .select()
      .single()

    if (error) {
      console.error('プロフィールの作成/更新に失敗:', error)
      throw new Error(`プロフィールの作成/更新に失敗しました: ${error.message}`)
    }

    return data
  }

  /**
   * パートナー情報を取得
   */
  static async getPartnerInfo(userId: string): Promise<Profile | null> {
    try {
      // 現在のユーザーのプロフィールを取得してpartner_idを確認
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('partner_id')
        .eq('id', userId)
        .single()

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          return null // プロフィールが見つからない場合
        }
        throw profileError
      }

      if (!profile?.partner_id) {
        return null // パートナーがリンクされていない場合
      }

      // パートナーの詳細情報を取得
      const { data: partner, error: partnerError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.partner_id)
        .single()

      if (partnerError) {
        if (partnerError.code === 'PGRST116') {
          return null // パートナーのプロフィールが見つからない場合
        }
        throw partnerError
      }

      return partner
    } catch (error: any) {
      console.error('パートナー情報の取得に失敗:', error)
      throw new Error(`パートナー情報の取得に失敗しました: ${error.message}`)
    }
  }

  /**
   * パートナーとのリンクを確立
   */
  static async linkPartner(userId: string, partnerId: string): Promise<void> {
    try {
      // 双方向のリンクを確立
      const { error: userError } = await supabase
        .from('profiles')
        .update({ partner_id: partnerId })
        .eq('id', userId)

      if (userError) {
        throw new Error(`ユーザー側のリンク設定に失敗: ${userError.message}`)
      }

      const { error: partnerError } = await supabase
        .from('profiles')
        .update({ partner_id: userId })
        .eq('id', partnerId)

      if (partnerError) {
        // ロールバック: ユーザー側のリンクを削除
        await supabase
          .from('profiles')
          .update({ partner_id: null })
          .eq('id', userId)
        
        throw new Error(`パートナー側のリンク設定に失敗: ${partnerError.message}`)
      }
    } catch (error: any) {
      console.error('パートナーリンクの確立に失敗:', error)
      throw error
    }
  }

  /**
   * パートナーとのリンクを解除
   */
  static async unlinkPartner(userId: string): Promise<void> {
    try {
      // 現在のパートナーIDを取得
      const { data: profile, error: getError } = await supabase
        .from('profiles')
        .select('partner_id')
        .eq('id', userId)
        .single()

      if (getError) {
        throw new Error(`プロフィールの取得に失敗: ${getError.message}`)
      }

      const partnerId = profile?.partner_id

      // ユーザー側のリンクを削除
      const { error: userError } = await supabase
        .from('profiles')
        .update({ partner_id: null })
        .eq('id', userId)

      if (userError) {
        throw new Error(`ユーザー側のリンク削除に失敗: ${userError.message}`)
      }

      // パートナー側のリンクも削除（存在する場合）
      if (partnerId) {
        const { error: partnerError } = await supabase
          .from('profiles')
          .update({ partner_id: null })
          .eq('id', partnerId)

        if (partnerError) {
          console.warn('パートナー側のリンク削除に失敗:', partnerError)
          // パートナー側の削除に失敗してもユーザー側は削除済みなので続行
        }
      }
    } catch (error: any) {
      console.error('パートナーリンクの解除に失敗:', error)
      throw error
    }
  }

  /**
   * プロフィールの表示名を更新
   */
  static async updateDisplayName(userId: string, displayName: string): Promise<Profile> {
    const { data, error } = await supabase
      .from('profiles')
      .update({ display_name: displayName })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      console.error('表示名の更新に失敗:', error)
      throw new Error(`表示名の更新に失敗しました: ${error.message}`)
    }

    return data
  }

  /**
   * プロフィールが存在しない場合は作成する（RLSの前提を満たすため）
   */
  static async ensureProfile(userId: string, email?: string): Promise<Profile> {
    try {
      // 既存のプロフィールを確認
      const existingProfile = await this.getProfile(userId)
      if (existingProfile) {
        return existingProfile
      }

      // プロフィールが存在しない場合は作成
      const displayName = email?.split('@')[0] || 'ユーザー'
      return await this.upsertProfile(userId, {
        display_name: displayName
      })
    } catch (error: any) {
      // 無限再帰エラーの場合はスキップ
      if (error.code === '42P17' || error.message?.includes('infinite recursion')) {
        console.warn('🔄 RLSポリシーの無限再帰エラーを検出。プロフィール作成をスキップします。')
        throw new Error('プロフィールの作成に失敗しました。しばらく待ってから再度お試しください。')
      }
      throw error
    }
  }

  /**
   * パートナー関係の状態を確認
   */
  static async checkPartnershipStatus(userId: string): Promise<{
    hasPartner: boolean
    partnerId: string | null
    partnerInfo: Profile | null
    isLinkedProperly: boolean
  }> {
    try {
      const profile = await this.getProfile(userId)
      const partnerId = profile?.partner_id || null
      
      if (!partnerId) {
        return {
          hasPartner: false,
          partnerId: null,
          partnerInfo: null,
          isLinkedProperly: false
        }
      }

      const partnerInfo = await this.getProfile(partnerId)
      const isLinkedProperly = partnerInfo?.partner_id === userId

      return {
        hasPartner: !!partnerInfo,
        partnerId,
        partnerInfo,
        isLinkedProperly
      }
    } catch (error: any) {
      console.error('パートナー関係の状態確認に失敗:', error)
      throw new Error(`パートナー関係の状態確認に失敗しました: ${error.message}`)
    }
  }
}