import { Database } from '@/lib/supabase'

// Supabaseの型定義から招待関連の型を抽出
export type PartnerInvitation = Database['public']['Tables']['partner_invitations']['Row']
export type PartnerInvitationInsert = Database['public']['Tables']['partner_invitations']['Insert']
export type PartnerInvitationUpdate = Database['public']['Tables']['partner_invitations']['Update']

// API レスポンス型
export interface CreateInvitationResponse {
  success: boolean
  invitation?: PartnerInvitation
  error?: string
}

export interface GetInvitationResponse {
  success: boolean
  invitation?: PartnerInvitation
  error?: string
}

export interface GetInvitationsResponse {
  success: boolean
  invitations?: PartnerInvitation[]
  error?: string
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

// リクエスト型
export interface CreateInvitationRequest {
  invitee_email?: string
}

export interface AcceptInvitationRequest {
  invite_code: string
}

// 招待ステータス
export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled'

// 招待の表示用型
export interface InvitationDisplay extends PartnerInvitation {
  isExpired: boolean
  canAccept: boolean
}