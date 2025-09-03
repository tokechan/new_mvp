import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Supabaseクライアントの作成
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

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
          title: string
          description: string | null
          assigned_to: string
          created_by: string
          due_date: string | null
          status: 'pending' | 'completed'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          assigned_to: string
          created_by: string
          due_date?: string | null
          status?: 'pending' | 'completed'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          assigned_to?: string
          created_by?: string
          due_date?: string | null
          status?: 'pending' | 'completed'
          created_at?: string
          updated_at?: string
        }
      }
      completions: {
        Row: {
          id: string
          chore_id: string
          completed_by: string
          completed_at: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          chore_id: string
          completed_by: string
          completed_at?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          chore_id?: string
          completed_by?: string
          completed_at?: string
          notes?: string | null
          created_at?: string
        }
      }
      thanks: {
        Row: {
          id: string
          completion_id: string
          from_user: string
          to_user: string
          message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          completion_id: string
          from_user: string
          to_user: string
          message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          completion_id?: string
          from_user?: string
          to_user?: string
          message?: string | null
          created_at?: string
        }
      }
    }
  }
}