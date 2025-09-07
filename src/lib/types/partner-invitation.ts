// パートナー招待機能の型定義
// 作成日: 2025-09-07

// データベーステーブルの型定義
export interface PartnerInvitation {
  id: string
  inviter_id: string
  invite_code: string
  invitee_email?: string
  status: 'pending' | 'accepted' | 'expired' | 'cancelled'
  expires_at: string
  created_at: string
  accepted_at?: string
  accepted_by?: string
}

// プロフィール型の拡張
export interface ProfileWithPartner {
  id: string
  display_name: string
  partner_id?: string
  partnership_created_at?: string
}

// API リクエスト・レスポンス型
export interface CreateInvitationRequest {
  invitee_email?: string // オプション: 招待先メールアドレス
}

export interface CreateInvitationResponse {
  success: boolean
  data?: {
    invite_code: string
    invite_url: string
    expires_at: string
  }
  error?: string
}

export interface GetInvitationResponse {
  success: boolean
  data?: {
    inviter_name: string
    inviter_email: string
    status: 'pending' | 'expired'
    expires_at: string
  }
  error?: string
}

export interface AcceptInvitationRequest {
  invite_code: string
}

export interface AcceptInvitationResponse {
  success: boolean
  data?: {
    partner_id: string
    partner_name: string
    shared_chores_count: number
  }
  error?: string
}

export interface GetInvitationsResponse {
  success: boolean
  data?: {
    invitations: {
      id: string
      invite_code: string
      invitee_email?: string
      status: string
      created_at: string
      expires_at: string
    }[]
  }
  error?: string
}

// エラー型
export interface InvitationError {
  code: 'INVALID_CODE' | 'EXPIRED' | 'ALREADY_ACCEPTED' | 'ALREADY_PARTNERED' | 'UNAUTHORIZED' | 'INTERNAL_ERROR'
  message: string
}

// 招待状態の型ガード
export function isValidInvitationStatus(status: string): status is PartnerInvitation['status'] {
  return ['pending', 'accepted', 'expired', 'cancelled'].includes(status)
}

// 招待コード検証
export function isValidInviteCode(code: string): boolean {
  // UUID v4 からハイフンを除去した32文字の文字列
  return /^[a-f0-9]{32}$/i.test(code)
}