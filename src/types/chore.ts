/**
 * 家事関連の型定義
 * ChoresList.tsxから分離
 */

/**
 * 家事データの型定義
 * Supabaseの生成型（Tables<'chores'>）をベースにし、派生フィールドを追加
 */
import type { Tables, TablesInsert } from '@/lib/supabase'

export type Chore = Tables<'chores'> & {
  owner_name?: string
  completed_at?: string
}

/**
 * 家事作成時のデータ型
 * Supabase生成型に合わせる（必要項目は呼び出し側で必ず指定）
 */
export type ChoreInsert = TablesInsert<'chores'>

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