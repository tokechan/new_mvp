'use client'

import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'

// 型定義
type Profile = Database['public']['Tables']['profiles']['Row']

/**
 * パートナー管理のカスタムフック
 * パートナー情報の取得、招待機能の責務を担当
 */
export function usePartner() {
  const { user } = useAuth()
  const [partnerInfo, setPartnerInfo] = useState<Profile | null>(null)
  const [partnerLoading, setPartnerLoading] = useState(false)
  const [partnerError, setPartnerError] = useState<string | null>(null)
  const [retryCount, setRetryCount] = useState(0)

  /**
   * パートナー情報を取得（エラーハンドリングとリトライ機能付き）
   */
  const fetchPartnerInfo = useCallback(async () => {
    if (!user) {
      console.log('👤 User not authenticated, skipping partner fetch')
      return
    }

    console.log('🔍 Fetching partner info for user:', user.id)
    setPartnerLoading(true)
    setPartnerError(null)

    try {
      // 現在のユーザーのプロフィールを取得してpartner_idを確認
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('partner_id')
        .eq('id', user.id)
        .single()

      if (profileError) {
        if (profileError.code === 'PGRST116') {
          console.log('👤 User profile not found')
          setPartnerInfo(null)
          return
        }
        throw profileError
      }

      if (!profile?.partner_id) {
        console.log('👥 No partner linked to user')
        setPartnerInfo(null)
        return
      }

      // パートナーの詳細情報を取得
      const { data: partner, error: partnerError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile.partner_id)
        .single()

      if (partnerError) {
        if (partnerError.code === 'PGRST116') {
          console.log('👥 Partner profile not found')
          setPartnerInfo(null)
          return
        }
        throw partnerError
      }

      console.log('✅ Partner info fetched successfully:', partner.display_name)
      setPartnerInfo(partner)
      setRetryCount(0) // 成功時はリトライカウントをリセット
    } catch (error: any) {
      console.error('❌ Failed to fetch partner info:', error)
      
      // エラーの種類に応じたメッセージを設定
      let errorMessage = 'パートナー情報の取得に失敗しました。'
      
      if (error?.message?.includes('JWT')) {
        errorMessage = 'ログインセッションが期限切れです。再度ログインしてください。'
      } else if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        errorMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください。'
      } else if (error?.code === '42P17' || error?.message?.includes('infinite recursion')) {
        errorMessage = 'データベースの設定に問題があります。しばらく待ってから再度お試しください。'
      }
      
      setPartnerError(errorMessage)
      
      // 自動リトライ（最大3回まで）
      if (retryCount < 3 && !error?.message?.includes('JWT')) {
        console.log(`🔄 Auto-retrying partner fetch (attempt ${retryCount + 1}/3) in 2 seconds...`)
        setTimeout(() => {
          setRetryCount(prev => prev + 1)
          fetchPartnerInfo()
        }, 2000)
      }
    } finally {
      setPartnerLoading(false)
    }
  }, [user, retryCount])

  /**
   * パートナー情報を手動で再取得
   */
  const refetchPartnerInfo = useCallback(() => {
    setRetryCount(0)
    fetchPartnerInfo()
  }, [fetchPartnerInfo])

  /**
   * パートナー情報をクリア
   */
  const clearPartnerInfo = useCallback(() => {
    setPartnerInfo(null)
    setPartnerError(null)
    setRetryCount(0)
  }, [])

  /**
   * パートナー情報を直接設定（リアルタイム更新用）
   */
  const setPartner = useCallback((partner: Profile | null) => {
    setPartnerInfo(partner)
    setPartnerError(null)
  }, [])

  return {
    partnerInfo,
    partnerLoading,
    partnerError,
    retryCount,
    fetchPartnerInfo,
    refetchPartnerInfo,
    clearPartnerInfo,
    setPartner
  }
}