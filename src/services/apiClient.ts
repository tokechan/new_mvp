'use client'

import { supabase } from '@/lib/supabase'

/**
 * 汎用APIクライアント
 * HTTPリクエストの共通処理を担当
 */
export class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl
  }

  /**
   * 汎用APIリクエストメソッド
   * 認証ヘッダーの付与、エラーハンドリングを統一
   */
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const defaultHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    }

    let accessToken: string | undefined
    if (typeof window !== 'undefined') {
      try {
        const { data } = await supabase.auth.getSession()
        accessToken = data.session?.access_token
      } catch (error) {
        console.warn('Failed to resolve Supabase session for API request', error)
      }
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...options.headers,
      },
    }

    try {
      const response = await fetch(url, config)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(
          errorData.message || 
          errorData.error || 
          `HTTP ${response.status}: ${response.statusText}`
        )
      }

      return await response.json()
    } catch (error) {
      console.error('API Request failed:', { url, error })
      throw error
    }
  }

  /**
   * GETリクエスト
   */
  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  /**
   * POSTリクエスト
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * PUTリクエスト
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  /**
   * DELETEリクエスト
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }
}

// シングルトンインスタンス
export const apiClient = new ApiClient()
