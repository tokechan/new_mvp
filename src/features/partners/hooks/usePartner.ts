'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { PartnerInfo } from '@/features/chores/types/chore'

/**
 * パートナー管理のカスタムフック
 * ChoresList.tsxから分離されたパートナー関連ロジック
 */
export function usePartner() {
  const { user } = useAuth()
  const [hasPartner, setHasPartner] = useState<boolean | null>(null)
  const [partnerInfo, setPartnerInfo] = useState<PartnerInfo | null>(null)

  /**
   * パートナー情報を取得する
   */
  const fetchPartnerInfo = useCallback(async () => {
    if (!user) {
      console.log('👤 ユーザーが未ログインのため、パートナー情報取得をスキップ')
      return
    }
    
    console.log('🔍 パートナー情報を取得中...', user.id)
    
    try {
      // まず基本的なプロフィール情報のみ取得
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('partner_id')
        .eq('id', user.id)
        .single()
      
      console.log('📊 プロフィール取得結果:', { profile, error })
      
      if (error) {
        console.error('❌ パートナー情報取得エラー:', error)
        // エラーでもhasPartnerをfalseに設定して招待UIを表示
        setHasPartner(false)
        setPartnerInfo(null)
        return
      }

      if (profile?.partner_id) {
        console.log('✅ パートナーが存在:', profile.partner_id)
        // パートナーの詳細情報を取得
        const { data: partnerProfile, error: partnerError } = await supabase
          .from('profiles')
          .select('id, display_name')
          .eq('id', profile.partner_id)
          .single()
        
        if (partnerError) {
          console.error('❌ パートナー詳細取得エラー:', partnerError)
          setHasPartner(true)
          setPartnerInfo({ id: profile.partner_id, name: 'パートナー' })
        } else {
          setHasPartner(true)
          setPartnerInfo({
            id: profile.partner_id,
            name: partnerProfile?.display_name || 'パートナー'
          })
        }
      } else {
        console.log('❌ パートナーが未設定')
        setHasPartner(false)
        setPartnerInfo(null)
      }
    } catch (error) {
      console.error('💥 パートナー情報取得で予期しないエラー:', error)
      // エラーでもhasPartnerをfalseに設定して招待UIを表示
      setHasPartner(false)
      setPartnerInfo(null)
    }
    
    console.log('🏁 パートナー情報取得完了')
  }, [user])

  /**
   * パートナー連携完了時のコールバック
   */
  const handlePartnerLinked = useCallback(async () => {
    // パートナー情報を再取得
    await fetchPartnerInfo()
  }, [fetchPartnerInfo])

  /**
   * パートナー連携を解除
   */
  const unlinkPartner = useCallback(async () => {
    if (!user || !hasPartner) return false

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ partner_id: null })
        .eq('id', user.id)

      if (error) throw error

      // 相手側のpartner_idもクリア
      if (partnerInfo) {
        await supabase
          .from('profiles')
          .update({ partner_id: null })
          .eq('id', partnerInfo.id)
      }

      setHasPartner(false)
      setPartnerInfo(null)
      return true
    } catch (error) {
      console.error('❌ パートナー連携解除に失敗しました:', error)
      throw error
    }
  }, [user, hasPartner, partnerInfo])

  /**
   * 初期化時にパートナー情報を取得
   */
  useEffect(() => {
    if (user) {
      fetchPartnerInfo()
    } else {
      setHasPartner(null)
      setPartnerInfo(null)
    }
  }, [user, fetchPartnerInfo])

  return {
    hasPartner,
    partnerInfo,
    fetchPartnerInfo,
    handlePartnerLinked,
    unlinkPartner
  }
}