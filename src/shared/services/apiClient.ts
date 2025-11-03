'use client'

import { supabase } from '@/lib/supabase'

const normalizeBaseUrl = (value?: string | null) => {
  if (!value) return ''
  return value.endsWith('/') ? value.slice(0, -1) : value
}

const DEFAULT_BASE_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_BASE_URL)

export class ApiError extends Error {
  status: number
  data: unknown

  constructor(message: string, status: number, data: unknown) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

/**
 * 汎用APIクライアント
 * HTTPリクエストの共通処理を担当
 */
export class ApiClient {
  private baseUrl: string

  constructor(baseUrl: string = DEFAULT_BASE_URL) {
    this.baseUrl = normalizeBaseUrl(baseUrl)
  }

  /**
   * 汎用APIリクエストメソッド
   * 認証ヘッダーの付与、エラーハンドリングを統一
   */
  async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    const url = `${this.baseUrl}${normalizedEndpoint}`

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
        let errorBody: unknown = null
        try {
          errorBody = await response.json()
        } catch {
          try {
            const text = await response.text()
            errorBody = text || null
          } catch {
            errorBody = null
          }
        }

        const message =
          (errorBody && typeof errorBody === 'object' && 'message' in errorBody
            ? (errorBody as any).message
            : undefined) ||
          (errorBody && typeof errorBody === 'object' && 'error' in errorBody
            ? (errorBody as any).error
            : undefined) ||
          `HTTP ${response.status}: ${response.statusText}`

        throw new ApiError(message, response.status, errorBody)
      }

      if (response.status === 204) {
        return undefined as T
      }

      return (await response.json()) as T
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

// シングルトンインスタンス（レガシー用途向け）
export const apiClient = new ApiClient()

export const createApiClient = (baseUrl?: string) => new ApiClient(baseUrl)
