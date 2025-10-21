'use client'

import { supabase } from '@/lib/supabase'
import {
  CreateInvitationRequest,
  CreateInvitationResponse,
  GetInvitationResponse,
  GetInvitationsResponse,
  AcceptInvitationResponse,
  AcceptInvitationRequest,
  PartnerInvitation,
} from '@/types/invitation'
import { normalizeNumericId } from '@/lib/utils'

/**
 * パートナー招待を作成する
 */
export const createInvitation = async (
  request: CreateInvitationRequest
): Promise<CreateInvitationResponse> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'ユーザーが認証されていません' }
    }

    // 招待コードを生成
    const { data: codeData, error: codeError } = await supabase
      .rpc('generate_invite_code')
    
    if (codeError) {
      console.error('招待コード生成エラー:', codeError)
      return { success: false, error: '招待コードの生成に失敗しました' }
    }

    // 招待を作成
    const { data, error } = await supabase
      .from('partner_invitations')
      .insert({
        inviter_id: user.id,
        invite_code: codeData,
        invitee_email: request.invitee_email,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7日後
        status: 'pending'
      })
      .select()
      .single()

    if (error) {
      console.error('招待作成エラー:', error)
      return { success: false, error: '招待の作成に失敗しました' }
    }

    return {
      success: true,
      invitation: data
    }
  } catch (error) {
    console.error('招待作成エラー:', error)
    return { success: false, error: '招待の作成に失敗しました' }
  }
}

/**
 * ユーザーの招待一覧を取得
 */
export const getInvitations = async (): Promise<GetInvitationsResponse> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'ユーザーが認証されていません' }
    }

    const { data, error } = await supabase
      .from('partner_invitations')
      .select('*')
      .eq('inviter_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('招待一覧取得エラー:', error)
      return { success: false, error: '招待一覧の取得に失敗しました' }
    }

    return { success: true, invitations: data || [] }
  } catch (error) {
    console.error('招待一覧取得エラー:', error)
    return { success: false, error: '招待一覧の取得に失敗しました' }
  }
}

/**
 * 招待コードから招待情報を取得
 */
export const getInvitation = async (code: string): Promise<GetInvitationResponse> => {
  try {
    const { data, error } = await supabase
      .from('partner_invitations')
      .select('*')
      .eq('invite_code', code)
      .single()

    if (error) {
      console.error('招待取得エラー:', error)
      return { success: false, error: '招待が見つかりません' }
    }

    return {
      success: true,
      invitation: data
    }
  } catch (error) {
    console.error('招待取得エラー:', error)
    return { success: false, error: '招待の取得に失敗しました' }
  }
}

/**
 * 招待を受け入れる
 */
export const acceptInvitation = async (
  request: AcceptInvitationRequest
): Promise<AcceptInvitationResponse> => {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { success: false, error: 'ユーザーが認証されていません' }
    }

    // link_partners関数を呼び出してパートナーシップを作成
    const { data, error } = await supabase
      .rpc('link_partners', {
        p_accepter_id: user.id,
        p_invite_code: request.invite_code
      })

    if (error) {
      console.error('招待受け入れエラー:', error)
      return { success: false, error: '招待の受け入れに失敗しました' }
    }

    if (!data) {
      return { success: false, error: '無効な招待コードです' }
    }

    return { success: true }
  } catch (error) {
    console.error('招待受け入れエラー:', error)
    return { success: false, error: '招待の受け入れに失敗しました' }
  }
}

/**
 * 招待をキャンセルする
 */
export const cancelInvitation = async (invitationId: string | number): Promise<void> => {
  const idNum = normalizeNumericId(invitationId)
  if (idNum === undefined) {
    throw new Error('不正な招待IDです')
  }
  const { error } = await supabase
    .from('partner_invitations')
    .update({ status: 'cancelled' })
    .eq('id', idNum)

  if (error) {
    throw new Error(`招待のキャンセルに失敗しました: ${error.message}`)
  }
}

/**
 * 期限切れの招待を削除する
 */
export const cleanupExpiredInvitations = async (): Promise<void> => {
  const { error } = await supabase
    .rpc('cleanup_expired_invitations')

  if (error) {
    throw new Error(`期限切れ招待の削除に失敗しました: ${error.message}`)
  }
}

// 後方互換性のためのクラス形式のエクスポート
export class InvitationService {
  static async createInvitation(request: CreateInvitationRequest): Promise<CreateInvitationResponse> {
    return createInvitation(request)
  }

  static async getInvitation(code: string): Promise<GetInvitationResponse> {
    return getInvitation(code)
  }
}