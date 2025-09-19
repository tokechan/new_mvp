'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Google認証テスト用ページ
 * 詳細なデバッグ情報を表示
 */
export default function TestAuth() {
  const [logs, setLogs] = useState<string[]>([])
  const { signInWithGoogle, user, session } = useAuth()

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    const logMessage = `[${timestamp}] ${message}`
    console.log(logMessage)
    setLogs(prev => [...prev, logMessage])
  }

  const handleGoogleAuth = async () => {
    addLog('Google認証テスト開始')
    
    try {
      addLog('環境変数確認:')
      addLog(`SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`)
      addLog(`ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '設定済み' : '未設定'}`)
      addLog(`現在のURL: ${window.location.href}`)
      addLog(`リダイレクトURL: ${window.location.origin}/auth/callback`)
      
      addLog('signInWithGoogle関数を呼び出し中...')
      const result = await signInWithGoogle()
      
      if (result.error) {
        addLog(`エラー発生: ${JSON.stringify(result.error, null, 2)}`)
      } else {
        addLog('認証リクエスト成功 - リダイレクト待機中...')
      }
    } catch (error) {
      addLog(`予期しないエラー: ${error}`)
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Google認証テスト</h1>
        
        {/* 現在の認証状態 */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">現在の認証状態</h2>
          <div className="space-y-2">
            <p><strong>ユーザー:</strong> {user ? user.email : '未認証'}</p>
            <p><strong>セッション:</strong> {session ? 'あり' : 'なし'}</p>
          </div>
        </div>

        {/* テストボタン */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-semibold mb-4">認証テスト</h2>
          <div className="space-x-4">
            <button
              onClick={handleGoogleAuth}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Google認証テスト
            </button>
            <button
              onClick={clearLogs}
              className="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700"
            >
              ログクリア
            </button>
          </div>
        </div>

        {/* ログ表示 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">デバッグログ</h2>
          <div className="bg-gray-100 p-4 rounded max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <p className="text-gray-500">ログはありません</p>
            ) : (
              <div className="space-y-1">
                {logs.map((log, index) => (
                  <div key={index} className="text-sm font-mono">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}