'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

/**
 * キャッシュデバッグページ
 * ブラウザのキャッシュ状況を確認し、クリア機能を提供
 */
export default function DebugCachePage() {
  const [cacheInfo, setCacheInfo] = useState<string[]>([])
  const [isClearing, setIsClearing] = useState(false)

  useEffect(() => {
    // ブラウザの情報を収集
    const info = [
      `User Agent: ${navigator.userAgent}`,
      `URL: ${window.location.href}`,
      `Referrer: ${document.referrer}`,
      `Cookie enabled: ${navigator.cookieEnabled}`,
      `Online: ${navigator.onLine}`,
      `Language: ${navigator.language}`,
      `Platform: ${navigator.platform}`,
    ]
    setCacheInfo(info)
  }, [])

  /**
   * ハードリフレッシュを実行
   */
  const handleHardRefresh = () => {
    // ハードリフレッシュ（キャッシュを無視して再読み込み）
    window.location.reload()
  }

  /**
   * サービスワーカーをクリア
   */
  const handleClearServiceWorker = async () => {
    setIsClearing(true)
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations()
        for (const registration of registrations) {
          await registration.unregister()
        }
        alert('サービスワーカーをクリアしました')
      } else {
        alert('このブラウザはサービスワーカーをサポートしていません')
      }
    } catch (error) {
      console.error('サービスワーカークリアエラー:', error)
      alert('サービスワーカーのクリアに失敗しました')
    } finally {
      setIsClearing(false)
    }
  }

  /**
   * ローカルストレージをクリア
   */
  const handleClearLocalStorage = () => {
    try {
      localStorage.clear()
      sessionStorage.clear()
      alert('ローカルストレージをクリアしました')
    } catch (error) {
      console.error('ローカルストレージクリアエラー:', error)
      alert('ローカルストレージのクリアに失敗しました')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          🔧 キャッシュデバッグページ
        </h1>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            📊 ブラウザ情報
          </h2>
          <div className="space-y-2">
            {cacheInfo.map((info, index) => (
              <div key={index} className="text-sm text-gray-600 font-mono">
                {info}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            🧹 キャッシュクリア操作
          </h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">
                ハードリフレッシュ（推奨）
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                ブラウザキャッシュを無視してページを再読み込みします。
                @vite/clientエラーの解決に効果的です。
              </p>
              <button
                onClick={handleHardRefresh}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                🔄 ハードリフレッシュ実行
              </button>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-2">
                サービスワーカークリア
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                登録されているサービスワーカーをすべて削除します。
              </p>
              <button
                onClick={handleClearServiceWorker}
                disabled={isClearing}
                className="bg-orange-600 text-white px-4 py-2 rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50"
              >
                {isClearing ? '🔄 処理中...' : '🗑️ サービスワーカークリア'}
              </button>
            </div>

            <div>
              <h3 className="font-medium text-gray-700 mb-2">
                ローカルストレージクリア
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                ローカルストレージとセッションストレージをクリアします。
              </p>
              <button
                onClick={handleClearLocalStorage}
                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
              >
                🗑️ ローカルストレージクリア
              </button>
            </div>
          </div>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-yellow-800 mb-4">
            ⚠️ 手動でのキャッシュクリア方法
          </h2>
          <div className="space-y-3 text-sm text-yellow-700">
            <div>
              <strong>Chrome/Edge:</strong>
              <ol className="list-decimal list-inside ml-4 mt-1">
                <li>F12キーで開発者ツールを開く</li>
                <li>Networkタブを選択</li>
                <li>「Disable cache」にチェックを入れる</li>
                <li>ページを再読み込み</li>
              </ol>
            </div>
            <div>
              <strong>Firefox:</strong>
              <ol className="list-decimal list-inside ml-4 mt-1">
                <li>F12キーで開発者ツールを開く</li>
                <li>Networkタブを選択</li>
                <li>設定アイコンから「Disable HTTP Cache」を有効にする</li>
                <li>ページを再読み込み</li>
              </ol>
            </div>
            <div>
              <strong>Safari:</strong>
              <ol className="list-decimal list-inside ml-4 mt-1">
                <li>開発メニューから「キャッシュを空にする」を選択</li>
                <li>ページを再読み込み</li>
              </ol>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-block bg-gray-600 text-white px-6 py-2 rounded-md hover:bg-gray-700 transition-colors"
          >
            🏠 ホームに戻る
          </Link>
        </div>
      </div>
    </div>
  )
}