'use client'

/**
 * 招待関連のユーティリティ関数
 * URL生成、バリデーション、フォーマット等の純粋関数を担当
 */

/**
 * 招待URL生成ヘルパー
 */
export function generateInviteUrl(inviteCode: string): string {
  const baseUrl = typeof window !== 'undefined' 
    ? window.location.origin 
    : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
  return `${baseUrl}/invite/${inviteCode}`
}

/**
 * QRコード生成用URL（外部サービス使用）
 */
export function generateQRCodeUrl(inviteUrl: string): string {
  // QR Server APIを使用（無料、商用利用可能）
  const encodedUrl = encodeURIComponent(inviteUrl)
  return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUrl}`
}

/**
 * 招待コードの有効性チェック
 */
export function validateInviteCode(code: string): boolean {
  // UUID v4 からハイフンを除去した32文字の文字列
  return /^[a-f0-9]{32}$/i.test(code)
}

/**
 * 有効期限チェック
 */
export function isInvitationExpired(expiresAt: string): boolean {
  return new Date(expiresAt) <= new Date()
}

/**
 * 有効期限までの残り時間を取得
 */
export function getTimeUntilExpiration(expiresAt: string): {
  days: number
  hours: number
  minutes: number
  expired: boolean
} {
  const now = new Date()
  const expiry = new Date(expiresAt)
  const diff = expiry.getTime() - now.getTime()

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, expired: true }
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))

  return { days, hours, minutes, expired: false }
}

/**
 * エラーハンドリングヘルパー
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }
  if (typeof error === 'string') {
    return error
  }
  return '予期しないエラーが発生しました'
}

/**
 * 招待ステータスの日本語表示
 */
export function getInvitationStatusText(status: string): string {
  switch (status) {
    case 'pending':
      return '招待中'
    case 'accepted':
      return '受諾済み'
    case 'expired':
      return '期限切れ'
    case 'cancelled':
      return 'キャンセル済み'
    default:
      return '不明'
  }
}

/**
 * 招待ステータスの色クラス（Tailwind CSS）
 */
export function getInvitationStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'text-yellow-600 bg-yellow-100'
    case 'accepted':
      return 'text-green-600 bg-green-100'
    case 'expired':
      return 'text-gray-600 bg-gray-100'
    case 'cancelled':
      return 'text-red-600 bg-red-100'
    default:
      return 'text-gray-600 bg-gray-100'
  }
}

/**
 * 招待コードを生成（UUID v4ベース）
 */
export function generateInviteCode(): string {
  // UUID v4を生成してハイフンを除去
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'
    .replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
    .replace(/-/g, '')
}

/**
 * 招待の有効期限を計算（デフォルト7日後）
 */
export function calculateExpirationDate(daysFromNow: number = 7): string {
  const expiration = new Date()
  expiration.setDate(expiration.getDate() + daysFromNow)
  return expiration.toISOString()
}