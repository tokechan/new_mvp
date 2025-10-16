'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'

export default function TestAuthPage() {
  const { user, loading } = useAuth()

  return (
    <div data-testid="test-auth-ready" style={{ padding: 24 }}>
      <h1>テスト認証を準備しました</h1>
      <p>このページにアクセスすると、テスト用の認証スキップが有効になります。</p>
      <ul>
        <li>読み込み状態: {loading ? '読み込み中' : '完了'}</li>
        <li>ユーザーID: {user?.id || '未ログイン'}</li>
      </ul>
    </div>
  )
}