'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { getThankYouHistory, type ThankYouMessage } from '@/services/thankYouService'

export default function ThankYouHistoryPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [items, setItems] = useState<ThankYouMessage[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  useEffect(() => {
    const load = async () => {
      if (!user) return
      setError(null)
      try {
        const history = await getThankYouHistory(user.id, { limit: 20, type: 'all' })
        setItems(history)
      } catch (e) {
        console.error(e)
        setError(e instanceof Error ? e.message : '履歴の取得に失敗しました')
      }
    }
    load()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto px-4 py-8" data-testid="thank-you-history">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">ありがとう履歴</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded" role="alert">
            {error}
          </div>
        )}

        {items.length === 0 ? (
          <p className="text-gray-600">履歴がまだありません。</p>
        ) : (
          <ul className="space-y-3" data-testid="thank-you-history-list">
            {items.map((item) => (
              <li
                key={item.id}
                className="p-3 rounded border bg-white"
                data-testid="thank-you-message"
              >
                <div className="text-sm text-gray-500 mb-1">
                  {new Date(item.created_at).toLocaleString()}
                </div>
                <div className="text-gray-900">{item.message}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}