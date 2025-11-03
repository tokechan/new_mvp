import { supabase } from '@/lib/supabase'
import { Database } from '@/lib/supabase'
import { z } from 'zod'
import { shouldUseClientMockAuth } from '@/utils/authMode'

// 型定義
type ThankYouRow = Database['public']['Tables']['thanks']['Row']
type ThankYouInsert = Database['public']['Tables']['thanks']['Insert']

/**
 * 感謝メッセージの型定義
 * Issue #32の要件に基づく拡張型
 */
export interface ThankYouMessage extends ThankYouRow {
  from_user?: {
    display_name: string
  }
  to_user?: {
    display_name: string
  }
  chore?: {
    title: string
  }
}

/**
 * 感謝メッセージ送信のバリデーションスキーマ
 */
const SendThankYouSchema = z.object({
  toUserId: z.string().uuid('有効なユーザーIDを指定してください'),
  choreId: z.number().int().positive('有効な家事IDを指定してください').optional(),
  message: z.string()
    .min(1, 'メッセージを入力してください')
    .max(500, 'メッセージは500文字以内で入力してください')
    .trim()
})

type SendThankYouInput = z.infer<typeof SendThankYouSchema>

/**
 * 感謝メッセージを送信する
 * @param fromUserId 送信者のユーザーID
 * @param input 感謝メッセージの内容
 * @returns 送信された感謝メッセージ
 */
export async function sendThankYou(
  fromUserId: string,
  input: SendThankYouInput
): Promise<ThankYouMessage> {
  // 入力値のバリデーション
  const validatedInput = SendThankYouSchema.parse(input)
  
  // 認証スキップ時（E2E/開発高速化モード）はローカルストレージに保存して擬似的に成功させる
  if (shouldUseClientMockAuth()) {
    const LOCAL_KEY = 'thank_you_history'
    const raw = window.localStorage.getItem(LOCAL_KEY)
    const history: ThankYouMessage[] = raw ? JSON.parse(raw) : []

    const newItem: ThankYouMessage = {
      id: Date.now(),
      from_id: fromUserId,
      to_id: validatedInput.toUserId,
      message: validatedInput.message,
      created_at: new Date().toISOString(),
      chore_id: validatedInput.choreId,
      from_user: { display_name: 'あなた' },
      to_user: { display_name: '相手' }
    } as any

    // 先頭に追加（新しい順）
    history.unshift(newItem)
    window.localStorage.setItem(LOCAL_KEY, JSON.stringify(history))

    return newItem
  }
  
  // 感謝メッセージをデータベースに挿入
  const { data, error } = await supabase
    .from('thanks')
    .insert({
      from_id: fromUserId,
      to_id: validatedInput.toUserId,
      message: validatedInput.message,
      created_at: new Date().toISOString()
    })
    .select(`
      *,
      from_user:profiles!from_id(display_name),
      to_user:profiles!to_id(display_name)
    `)
    .single()

  if (error) {
    console.error('感謝メッセージの送信に失敗しました:', error)
    throw new Error(`感謝メッセージの送信に失敗しました: ${error.message}`)
  }

  return data as ThankYouMessage
}

/**
 * 家事完了に対する感謝メッセージを送信する
 * @param fromUserId 送信者のユーザーID
 * @param choreCompletionId 家事完了ID
 * @param input 感謝メッセージの内容
 * @returns 送信された感謝メッセージ
 */
export async function sendThankYouForChore(
  fromUserId: string,
  choreCompletionId: number,
  input: Omit<SendThankYouInput, 'choreId'>
): Promise<ThankYouMessage> {
  // 家事完了情報を取得して、関連する家事IDとパートナーIDを確認
  const { data: completion, error: completionError } = await supabase
    .from('completions')
    .select(`
      *,
      chore:chores!chore_id(
        id,
        title,
        owner_id,
        partner_id
      )
    `)
    .eq('id', choreCompletionId)
    .single()

  if (completionError || !completion) {
    throw new Error('家事完了情報が見つかりません')
  }

  // 送信者が家事の関係者（owner または partner）であることを確認
  const chore = completion.chore as any
  if (chore.owner_id !== fromUserId && chore.partner_id !== fromUserId) {
    throw new Error('この家事に対する感謝メッセージを送信する権限がありません')
  }

  // 感謝メッセージの送信先を決定（完了者に送信）
  const toUserId = completion.user_id!
  
  return sendThankYou(fromUserId, {
    ...input,
    toUserId,
    choreId: chore.id
  })
}

/**
 * 感謝メッセージの履歴を取得する
 * @param userId ユーザーID
 * @param options 取得オプション
 * @returns 感謝メッセージの配列
 */
export async function getThankYouHistory(
  userId: string,
  options: {
    limit?: number
    offset?: number
    type?: 'sent' | 'received' | 'all'
  } = {}
): Promise<ThankYouMessage[]> {
  const { limit = 50, offset = 0, type = 'all' } = options

  // 認証スキップ時（E2E/開発高速化モード）はローカルストレージから取得
  if (shouldUseClientMockAuth()) {
    const LOCAL_KEY = 'thank_you_history'
    const raw = window.localStorage.getItem(LOCAL_KEY)
    const all: ThankYouMessage[] = raw ? JSON.parse(raw) : []

    let filtered: ThankYouMessage[]
    switch (type) {
      case 'sent':
        filtered = all.filter((i) => i.from_id === userId)
        break
      case 'received':
        filtered = all.filter((i) => i.to_id === userId)
        break
      case 'all':
      default:
        filtered = all.filter((i) => i.from_id === userId || i.to_id === userId)
        break
    }

    filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    return filtered.slice(offset, offset + limit)
  }

  let query = supabase
    .from('thanks')
    .select(`
      *,
      from_user:profiles!from_id(display_name),
      to_user:profiles!to_id(display_name)
    `)

  // フィルタリング条件を適用
  switch (type) {
    case 'sent':
      query = query.eq('from_id', userId)
      break
    case 'received':
      query = query.eq('to_id', userId)
      break
    case 'all':
    default:
      query = query.or(`from_id.eq.${userId},to_id.eq.${userId}`)
      break
  }

  const { data, error } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    console.error('感謝メッセージ履歴の取得に失敗しました:', error)
    throw new Error(`感謝メッセージ履歴の取得に失敗しました: ${error.message}`)
  }

  return (data || []) as ThankYouMessage[]
}

/**
 * 感謝メッセージの統計情報を取得する
 * @param userId ユーザーID
 * @returns 統計情報
 */
export async function getThankYouStats(userId: string): Promise<{
  sentCount: number
  receivedCount: number
  totalCount: number
}> {
  // 認証スキップ時（E2E/開発高速化モード）はローカルストレージから集計
  if (shouldUseClientMockAuth()) {
    const LOCAL_KEY = 'thank_you_history'
    const raw = window.localStorage.getItem(LOCAL_KEY)
    const all: ThankYouMessage[] = raw ? JSON.parse(raw) : []
    const sentCount = all.filter((i) => i.from_id === userId).length
    const receivedCount = all.filter((i) => i.to_id === userId).length
    return {
      sentCount,
      receivedCount,
      totalCount: sentCount + receivedCount
    }
  }
  // 送信した感謝メッセージ数
  const { count: sentCount, error: sentError } = await supabase
    .from('thanks')
    .select('*', { count: 'exact', head: true })
    .eq('from_id', userId)

  if (sentError) {
    console.error('送信済み感謝メッセージ数の取得に失敗しました:', sentError)
    throw new Error('統計情報の取得に失敗しました')
  }

  // 受信した感謝メッセージ数
  const { count: receivedCount, error: receivedError } = await supabase
    .from('thanks')
    .select('*', { count: 'exact', head: true })
    .eq('to_id', userId)

  if (receivedError) {
    console.error('受信済み感謝メッセージ数の取得に失敗しました:', receivedError)
    throw new Error('統計情報の取得に失敗しました')
  }

  return {
    sentCount: sentCount || 0,
    receivedCount: receivedCount || 0,
    totalCount: (sentCount || 0) + (receivedCount || 0)
  }
}

/**
 * 定型感謝メッセージのリスト
 * Issue #32の要件に基づく
 */
export const PREDEFINED_THANK_YOU_MESSAGES = [
  'ありがとう！助かりました 😊',
  'お疲れさまでした！',
  'いつもありがとう ❤️',
  'とても助かります！',
  'ありがとう！愛してる 💕'
] as const

export type PredefinedThankYouMessage = typeof PREDEFINED_THANK_YOU_MESSAGES[number]
