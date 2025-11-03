'use client'

/**
 * 招待API - リファクタリング版
 * 新しいサービス層とユーティリティを使用した統合インターフェース
 * 後方互換性を保ちながら、段階的に新しいアーキテクチャに移行
 */

// 新しいサービス層とユーティリティをインポート
import {
  createInvitation as createInvitationService,
  getInvitations as getInvitationsService,
  getInvitation as getInvitationService,
  acceptInvitation as acceptInvitationService,
} from '@/features/partners/services/invitationService'
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
  GetInvitationsResponse,
  AcceptInvitationResponse,
  AcceptInvitationRequest,
} from '@/features/partners/types/invitation'

// ===== API操作（新しいサービス層を使用） =====

/**
 * 招待作成
 */
export async function createInvitation(
  request: CreateInvitationRequest
): Promise<CreateInvitationResponse> {
  return createInvitationService(request)
}

/**
 * 招待一覧取得
 */
export async function getInvitations(): Promise<GetInvitationsResponse> {
  return getInvitationsService()
}

/**
 * 招待取得
 */
export async function getInvitation(
  inviteCode: string
): Promise<GetInvitationResponse> {
  return getInvitationService(inviteCode)
}

/**
 * 招待受諾
 */
export async function acceptInvitation(
  inviteCode: string
): Promise<AcceptInvitationResponse> {
  return acceptInvitationService({ invite_code: inviteCode })
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