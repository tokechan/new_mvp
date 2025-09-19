'use client'

import { apiClient } from './apiClient'
import {
  PartnerInvitation,
  CreateInvitationRequest,
  CreateInvitationResponse,
  GetInvitationResponse,
  AcceptInvitationResponse,
} from '@/lib/types/partner-invitation'

/**
 * 招待機能のビジネスロジックを管理するサービス
 * API呼び出しと招待関連の操作を担当
 */
export class InvitationService {
  /**
   * 新しい招待を作成
   */
  async createInvitation(
    request: CreateInvitationRequest
  ): Promise<CreateInvitationResponse> {
    return apiClient.post<CreateInvitationResponse>('/api/invitations', request)
  }

  /**
   * ユーザーの招待一覧を取得
   */
  async getInvitations(): Promise<PartnerInvitation[]> {
    const response = await apiClient.get<{ invitations: PartnerInvitation[] }>('/api/invitations')
    return response.invitations
  }

  /**
   * 特定の招待を取得
   */
  async getInvitation(inviteCode: string): Promise<GetInvitationResponse> {
    return apiClient.get<GetInvitationResponse>(`/api/invitations/${inviteCode}`)
  }

  /**
   * 招待を受諾
   */
  async acceptInvitation(inviteCode: string): Promise<AcceptInvitationResponse> {
    return apiClient.post<AcceptInvitationResponse>(`/api/invitations/${inviteCode}`)
  }

  /**
   * 招待をキャンセル
   */
  async cancelInvitation(invitationId: string): Promise<void> {
    await apiClient.delete(`/api/invitations/${invitationId}`)
  }

  /**
   * 期限切れの招待を削除
   */
  async cleanupExpiredInvitations(): Promise<void> {
    await apiClient.post('/api/invitations/cleanup')
  }
}

// シングルトンインスタンス
export const invitationService = new InvitationService()