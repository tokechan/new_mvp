'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  createInvitation,
  getInvitations,
  getInvitation,
  acceptInvitation,
} from '@/features/partners/services/invitationService'
import {
  PartnerInvitation,
  CreateInvitationRequest,
  CreateInvitationResponse,
  GetInvitationResponse,
  GetInvitationsResponse,
  AcceptInvitationResponse,
  AcceptInvitationRequest,
} from '@/features/partners/types/invitation'
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
      const response: GetInvitationsResponse = await getInvitations()
      if (response.success) {
        setInvitations(response.invitations || [])
      } else {
        setError(response.error || '招待一覧の取得に失敗しました')
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * 招待を作成
   */
  const createInvitationHandler = useCallback(async (request: CreateInvitationRequest): Promise<CreateInvitationResponse> => {
    try {
      setLoading(true)
      setError(null)
      const response = await createInvitation(request)
      if (response.success) {
        // 招待一覧を再取得
        await fetchInvitations()
      } else {
        setError(response.error || '招待の作成に失敗しました')
      }
      return response
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [fetchInvitations])

  /**
   * 招待を受諾
   */
  const acceptInvitationHandler = useCallback(async (request: AcceptInvitationRequest): Promise<AcceptInvitationResponse> => {
    try {
      setLoading(true)
      setError(null)
      const response = await acceptInvitation(request)
      if (response.success) {
        // 招待一覧を再取得
        await fetchInvitations()
      } else {
        setError(response.error || '招待の受諾に失敗しました')
      }
      return response
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [fetchInvitations])

  /**
   * 初期化時に招待一覧を取得
   */
  useEffect(() => {
    fetchInvitations()
  }, [fetchInvitations])

  return {
    invitations,
    loading,
    error,
    clearError,
    fetchInvitations,
    createInvitation: createInvitationHandler,
    acceptInvitation: acceptInvitationHandler,
  }
}

/**
 * 単一の招待を取得するカスタムフック
 */
export function useInvitation(inviteCode: string) {
  const [invitation, setInvitation] = useState<PartnerInvitation | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * エラーをクリア
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  /**
   * 招待を取得
   */
  const fetchInvitation = useCallback(async () => {
    if (!inviteCode) return

    try {
      setLoading(true)
      setError(null)
      const response: GetInvitationResponse = await getInvitation(inviteCode)
      if (response.success) {
        setInvitation(response.invitation || null)
      } else {
        setError(response.error || '招待の取得に失敗しました')
      }
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [inviteCode])

  /**
   * 招待を受諾
   */
  const acceptInvitationHandler = useCallback(async (): Promise<AcceptInvitationResponse> => {
    try {
      setLoading(true)
      setError(null)
      const response = await acceptInvitation({ invite_code: inviteCode })
      if (response.success) {
        // 招待情報を再取得
        await fetchInvitation()
      } else {
        setError(response.error || '招待の受諾に失敗しました')
      }
      return response
    } catch (err) {
      const errorMessage = getErrorMessage(err)
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [inviteCode, fetchInvitation])

  /**
   * 初期化時に招待を取得
   */
  useEffect(() => {
    fetchInvitation()
  }, [fetchInvitation])

  return {
    invitation,
    loading,
    error,
    clearError,
    fetchInvitation,
    acceptInvitation: acceptInvitationHandler,
  }
}