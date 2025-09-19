'use client'

/**
 * 招待API - リファクタリング版
 * 新しいサービス層とユーティリティを使用した統合インターフェース
 * 後方互換性を保ちながら、段階的に新しいアーキテクチャに移行
 */

// 新しいサービス層とユーティリティをインポート
import { invitationService } from '@/services/invitationService'
import {
  generateInviteUrl,
  generateQRCodeUrl,
  validateInviteCode,
  isInvitationExpired,
  getTimeUntilExpiration,
  getErrorMessage,
  getInvitationStatusText,
  getInvitationStatusColor,
  generateInviteCode,
  calculateExpirationDate,
} from '@/utils/invitationUtils'

// 型定義をインポート
import {
  PartnerInvitation,
  CreateInvitationRequest,
  CreateInvitationResponse,
  GetInvitationResponse,
  AcceptInvitationResponse,
} from './types/partner-invitation'

// ===== API操作（新しいサービス層を使用） =====

/**
 * 招待作成
 */
export async function createInvitation(
  request: CreateInvitationRequest
): Promise<CreateInvitationResponse> {
  return invitationService.createInvitation(request)
}

/**
 * 招待一覧取得
 */
export async function getInvitations(): Promise<PartnerInvitation[]> {
  return invitationService.getInvitations()
}

/**
 * 招待取得
 */
export async function getInvitation(
  inviteCode: string
): Promise<GetInvitationResponse> {
  return invitationService.getInvitation(inviteCode)
}

/**
 * 招待受諾
 */
export async function acceptInvitation(
  inviteCode: string
): Promise<AcceptInvitationResponse> {
  return invitationService.acceptInvitation(inviteCode)
}

// ===== ユーティリティ関数（新しいユーティリティ層を使用） =====

// URL生成とQRコード
export { generateInviteUrl, generateQRCodeUrl }

// バリデーション
export { validateInviteCode, isInvitationExpired }

// 時間計算
export { getTimeUntilExpiration }

// エラーハンドリング
export { getErrorMessage }

// ステータス表示
export { getInvitationStatusText, getInvitationStatusColor }

// 新しいユーティリティ関数
export { generateInviteCode, calculateExpirationDate }