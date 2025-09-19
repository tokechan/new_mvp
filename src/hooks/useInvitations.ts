'use client'

import { useState, useEffect, useCallback } from 'react'
import { invitationService } from '@/services/invitationService'
import {
  PartnerInvitation,
  CreateInvitationRequest,
  CreateInvitationResponse,
  GetInvitationResponse,
  AcceptInvitationResponse,
} from '@/lib/types/partner-invitation'
import { getErrorMessage } from '@/utils/invitationUtils'

/**
 * 招待機能のカスタムフック
 * 招待の状態管理とAPI操作を担当
 */
export function useInvitations() {
  const [invitations, setInvitations] = useState<PartnerInvitation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * エラーをクリア
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * 招待一覧を取得
   */
  const fetchInvitations = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await invitationService.getInvitations()
      setInvitations(data)
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      console.error('招待一覧の取得に失敗:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * 新しい招待を作成
   */
  const createInvitation = useCallback(async (
    request: CreateInvitationRequest
  ): Promise<CreateInvitationResponse | null> => {
    try {
      setLoading(true)
      setError(null)
      const response = await invitationService.createInvitation(request)
      // 招待一覧を再取得
      await fetchInvitations()
      return response
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      console.error('招待の作成に失敗:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [fetchInvitations])

  /**
   * 招待をキャンセル
   */
  const cancelInvitation = useCallback(async (invitationId: string): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      await invitationService.cancelInvitation(invitationId)
      // 招待一覧を再取得
      await fetchInvitations()
      return true
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      console.error('招待のキャンセルに失敗:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [fetchInvitations])

  /**
   * 期限切れの招待を削除
   */
  const cleanupExpiredInvitations = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true)
      setError(null)
      await invitationService.cleanupExpiredInvitations()
      // 招待一覧を再取得
      await fetchInvitations()
      return true
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      console.error('期限切れ招待の削除に失敗:', err)
      return false
    } finally {
      setLoading(false)
    }
  }, [fetchInvitations])

  // 初回マウント時に招待一覧を取得
  useEffect(() => {
    fetchInvitations()
  }, [fetchInvitations])

  return {
    invitations,
    loading,
    error,
    clearError,
    fetchInvitations,
    createInvitation,
    cancelInvitation,
    cleanupExpiredInvitations,
  }
}

/**
 * 単一の招待を管理するカスタムフック
 */
export function useInvitation(inviteCode: string) {
  const [invitation, setInvitation] = useState<GetInvitationResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * エラーをクリア
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * 招待情報を取得
   */
  const fetchInvitation = useCallback(async () => {
    if (!inviteCode) return

    try {
      setLoading(true)
      setError(null)
      const data = await invitationService.getInvitation(inviteCode)
      setInvitation(data)
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      console.error('招待情報の取得に失敗:', err)
    } finally {
      setLoading(false)
    }
  }, [inviteCode])

  /**
   * 招待を受諾
   */
  const acceptInvitation = useCallback(async (): Promise<AcceptInvitationResponse | null> => {
    if (!inviteCode) return null

    try {
      setLoading(true)
      setError(null)
      const response = await invitationService.acceptInvitation(inviteCode)
      // 招待情報を再取得
      await fetchInvitation()
      return response
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      console.error('招待の受諾に失敗:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [inviteCode, fetchInvitation])

  // 招待コードが変更されたら招待情報を取得
  useEffect(() => {
    fetchInvitation()
  }, [fetchInvitation])

  return {
    invitation,
    loading,
    error,
    clearError,
    fetchInvitation,
    acceptInvitation,
  }
}