'use client'

interface RealtimeDebugPanelProps {
  isConnected: boolean
  connectionError: string | null
  lastEventTime: Date | null
  eventCount: number
  onReconnect: () => void
}

/**
 * リアルタイム接続のデバッグパネルコンポーネント
 * 開発時のリアルタイム接続状態の監視とテストの責務を担当
 */
export function RealtimeDebugPanel({
  isConnected,
  connectionError,
  lastEventTime,
  eventCount,
  onReconnect
}: RealtimeDebugPanelProps) {
  /**
   * 最後のイベント時刻をフォーマット
   */
  const formatLastEventTime = () => {
    if (!lastEventTime) return 'なし'
    
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - lastEventTime.getTime()) / 1000)
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}秒前`
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}分前`
    } else {
      return lastEventTime.toLocaleTimeString('ja-JP')
    }
  }

  /**
   * 接続状態のアイコンとカラーを取得
   */
  const getConnectionStatus = () => {
    if (connectionError) {
      return {
        icon: '❌',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        text: 'エラー'
      }
    } else if (isConnected) {
      return {
        icon: '✅',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        text: '接続中'
      }
    } else {
      return {
        icon: '🔄',
        color: 'text-yellow-600',
        bgColor: 'bg-yellow-50',
        borderColor: 'border-yellow-200',
        text: '接続中...'
      }
    }
  }

  const status = getConnectionStatus()

  return (
    <div className={`
      p-4 rounded-lg border transition-all duration-200
      ${status.bgColor} ${status.borderColor}
    `}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-900 flex items-center">
          <span className="mr-2">🔌</span>
          リアルタイム接続テスト
        </h3>
        
        {/* 再接続ボタン */}
        <button
          onClick={onReconnect}
          className="
            px-3 py-1 text-xs font-medium rounded-md
            bg-blue-600 text-white hover:bg-blue-700
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
            transition-colors duration-200
          "
        >
          再接続
        </button>
      </div>

      {/* 接続状態 */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="flex items-center mb-2">
            <span className="text-lg mr-2">{status.icon}</span>
            <span className={`font-medium ${status.color}`}>
              {status.text}
            </span>
          </div>
          
          {connectionError && (
            <p className="text-xs text-red-600 mt-1 p-2 bg-red-100 rounded">
              {connectionError}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div>
            <span className="text-gray-600">イベント数:</span>
            <span className="ml-2 font-mono font-medium">{eventCount}</span>
          </div>
          
          <div>
            <span className="text-gray-600">最終イベント:</span>
            <span className="ml-2 font-mono text-xs">{formatLastEventTime()}</span>
          </div>
        </div>
      </div>

      {/* 詳細情報（開発時のみ表示） */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-3">
          <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
            詳細情報を表示
          </summary>
          <div className="mt-2 p-2 bg-gray-100 rounded text-xs font-mono space-y-1">
            <div>接続状態: {isConnected ? 'true' : 'false'}</div>
            <div>エラー: {connectionError || 'なし'}</div>
            <div>最終イベント時刻: {lastEventTime?.toISOString() || 'なし'}</div>
            <div>累計イベント数: {eventCount}</div>
          </div>
        </details>
      )}

      {/* 使用方法のヒント */}
      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
        <p className="text-blue-700">
          <strong>💡 テスト方法:</strong> 別のタブで同じページを開き、家事を追加/完了してリアルタイム同期を確認できます。
        </p>
      </div>
    </div>
  )
}