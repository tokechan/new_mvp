/**
 * 家事関連の型定義
 * ChoresList.tsxから分離
 */

/**
 * 家事データの型定義
 */
export type Chore = {
  id: string
  owner_id: string
  partner_id: string | null
  title: string
  done: boolean
  created_at: string
  owner_name?: string
  completed_at?: string
}

/**
 * 家事作成時のデータ型
 */
export type ChoreInsert = {
  owner_id: string
  partner_id?: string | null
  title: string
  done?: boolean
}

/**
 * リアルタイムイベントの追跡用型定義
 */
export type RealtimeEvents = {
  inserts: number
  updates: number
  deletes: number
  lastEvent: string | null
  connectionStatus: 'unknown' | 'connected' | 'disconnected' | 'error'
}

/**
 * パートナー情報の型定義
 */
export type PartnerInfo = {
  id: string
  name: string
}