'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useChores } from '@/hooks/useChores'
import { usePartner } from '@/hooks/usePartner'
import { useRealtime } from '@/hooks/useRealtime'
import { ChoreItem } from '@/components/ChoreItem'
import { ChoreForm } from '@/components/ChoreForm'
import { RealtimeDebugPanel } from '@/components/RealtimeDebugPanel'
import PartnerInvitation from '@/components/PartnerInvitation'

/**
 * リファクタリング後の家事一覧コンポーネント
 * 単一責務の原則に従い、各機能を分離したカスタムフックとコンポーネントを使用
 */
export function ChoresListRefactored() {
  const { user } = useAuth()
  
  // カスタムフックで各責務を分離
  const {
    chores,
    loading: choresLoading,
    addChore,
    toggleChore,
    deleteChore,
    refetch: fetchChores
  } = useChores()

  const {
    partnerInfo,
    fetchPartnerInfo
  } = usePartner()

  const {
    isConnected,
    connectionError,
    lastEventTime,
    eventCount,
    reconnect
  } = useRealtime({
    onChoreChange: () => fetchChores(),
    onPartnerChange: () => fetchPartnerInfo()
  })

  // ローディング状態の表示
  if (choresLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">読み込み中...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // エラー状態の表示
  if (connectionError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-center">
              <div className="text-red-500 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">エラーが発生しました</h3>
              <p className="text-gray-600 mb-4">
                {connectionError}
              </p>
              <button
                onClick={() => {
                  fetchChores()
                  fetchPartnerInfo()
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                再試行
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* ヘッダー */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            家事一覧
          </h1>
          <p className="text-gray-600">
            夫婦で家事を分担・管理しましょう
          </p>
        </div>

        {/* リアルタイム接続デバッグパネル（開発時のみ表示） */}
        {process.env.NODE_ENV === 'development' && (
          <RealtimeDebugPanel
            isConnected={isConnected}
            connectionError={connectionError}
            lastEventTime={lastEventTime}
            eventCount={eventCount}
            onReconnect={reconnect}
          />
        )}

        {/* パートナー招待UI */}
        <PartnerInvitation />

        {/* 家事追加フォーム */}
        <ChoreForm
          onAdd={addChore}
          isAdding={choresLoading}
        />

        {/* 家事一覧 */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              家事リスト ({chores.length}件)
            </h2>
          </div>
          
          {chores.length === 0 ? (
            <div className="p-6 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <p className="text-gray-500 mb-2">まだ家事が登録されていません</p>
              <p className="text-sm text-gray-400">上のフォームから家事を追加してみましょう</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {chores.map((chore) => (
                <ChoreItem
                  key={chore.id}
                  chore={chore}
                  onToggle={async (choreId: string, currentDone: boolean) => {
                    await toggleChore(choreId, currentDone)
                    return true
                  }}
                  onDelete={async (choreId: string) => {
                    await deleteChore(choreId)
                    return true
                  }}
                  currentUserId={user?.id || ''}
                />
              ))}
            </div>
          )}
        </div>

        {/* 統計情報 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">統計</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {chores.filter(c => c.done).length}
              </div>
              <div className="text-sm text-gray-600">完了済み</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {chores.filter(c => !c.done).length}
              </div>
              <div className="text-sm text-gray-600">未完了</div>
            </div>
          </div>
          
          {chores.length > 0 && (
            <div className="mt-4">
              <div className="text-sm text-gray-600 mb-2">
                完了率: {Math.round((chores.filter(c => c.done).length / chores.length) * 100)}%
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ 
                    width: `${(chores.filter(c => c.done).length / chores.length) * 100}%` 
                  }}
                ></div>
              </div>
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="text-center text-sm text-gray-500">
          <p>夫婦の家事管理アプリ</p>
          {partnerInfo && (
            <p className="mt-1">
              パートナー: {partnerInfo.name}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChoresListRefactored