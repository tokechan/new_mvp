import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// ブラウザ用の単一インスタンスのSupabaseクライアント（全アプリ共通で使用）
// Realtime機能を明示的に有効化
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// 互換性維持のためのヘルパー（常に同じインスタンスを返す）
export const createSupabaseBrowserClient = () => {
  return supabase
}

// 型定義
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      chores: {
        Row: {
          id: string
          owner_id: string
          partner_id: string | null
          title: string
          done: boolean
          created_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          partner_id?: string | null
          title: string
          done?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          partner_id?: string | null
          title?: string
          done?: boolean
          created_at?: string
        }
      }
      completions: {
        Row: {
          id: string
          chore_id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          chore_id: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          chore_id?: string
          user_id?: string
          created_at?: string
        }
      }
      thanks: {
        Row: {
          id: string
          from_id: string
          to_id: string
          message: string
          created_at: string
        }
        Insert: {
          id?: string
          from_id: string
          to_id: string
          message: string
          created_at?: string
        }
        Update: {
          id?: string
          from_id?: string
          to_id?: string
          message?: string
          created_at?: string
        }
      }
    }
  }
}