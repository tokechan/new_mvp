import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// テスト環境かどうかを判定
const isTestEnvironment = process.env.NODE_ENV === 'test' || process.env.NEXT_PUBLIC_SKIP_AUTH === 'true'

// ブラウザ環境ではService Role Keyは使用できないため、常にAnon Keyを使用
// テスト環境では認証状態をモックで管理
export const supabase = createBrowserClient(
  supabaseUrl, 
  supabaseAnonKey,
  {
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  }
)

// デバッグ用にグローバルに公開
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase
}

// 互換性維持のためのヘルパー（常に同じインスタンスを返す）
export const createSupabaseBrowserClient = () => {
  return supabase
}

// 最新のSupabaseから生成された型定義
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      chores: {
        Row: {
          created_at: string
          done: boolean | null
          id: number
          owner_id: string | null
          partner_id: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          done?: boolean | null
          id?: number
          owner_id?: string | null
          partner_id?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          done?: boolean | null
          id?: number
          owner_id?: string | null
          partner_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chores_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chores_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      completions: {
        Row: {
          chore_id: number | null
          created_at: string
          id: number
          user_id: string | null
        }
        Insert: {
          chore_id?: number | null
          created_at?: string
          id?: number
          user_id?: string | null
        }
        Update: {
          chore_id?: number | null
          created_at?: string
          id?: number
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "completions_chore_id_fkey"
            columns: ["chore_id"]
            isOneToOne: false
            referencedRelation: "chores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "completions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string
          id: string
          partner_id: string | null
          partnership_created_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string
          id?: string
          partner_id?: string | null
          partnership_created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string
          id?: string
          partner_id?: string | null
          partnership_created_at?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      thanks: {
        Row: {
          created_at: string
          from_id: string | null
          id: number
          message: string | null
          to_id: string | null
        }
        Insert: {
          created_at?: string
          from_id?: string | null
          id?: number
          message?: string | null
          to_id?: string | null
        }
        Update: {
          created_at?: string
          from_id?: string | null
          id?: number
          message?: string | null
          to_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "thanks_from_id_fkey"
            columns: ["from_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "thanks_to_id_fkey"
            columns: ["to_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}