'use client'

import { redirect } from 'next/navigation'
import { useEffect } from 'react'

/**
 * DoneListページ - completed-choresページへのリダイレクト
 * ナビゲーションからアクセスしやすくするためのエイリアス
 */
export default function DoneListPage() {
  useEffect(() => {
    redirect('/completed-chores')
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">リダイレクト中...</p>
      </div>
    </div>
  )
}