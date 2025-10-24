'use client'

interface RealtimeTestPanelProps {
  isConnected: boolean | null
  connectionStatus: string
  onTestConnection: () => void
  onStopConnection: () => void
}

/**
 * リアルタイム接続テストパネルコンポーネント
 * ChoresList.tsxから分離されたRealtime接続テストUI
 */
export function RealtimeTestPanel({
  isConnected,
  connectionStatus,
  onTestConnection,
  onStopConnection
}: RealtimeTestPanelProps) {
  const getStatusColor = () => {
    if (isConnected === true) return 'text-green-600'
    if (isConnected === false) return 'text-red-600'
    return 'text-yellow-600'
  }

  const getStatusIcon = () => {
    if (isConnected === true) return '✅'
    if (isConnected === false) return '❌'
    return '⏳'
  }

  return (
    <div className="bg-gray-50 p-4 rounded-lg border">
      <h3 className="font-medium text-gray-800 mb-3">🔗 Realtime接続テスト</h3>
      
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getStatusIcon()}</span>
          <span className={`font-medium ${getStatusColor()}`}>
            {connectionStatus}
          </span>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={onTestConnection}
            disabled={isConnected === null}
            className="px-3 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            接続テスト
          </button>
          
          <button
            onClick={onStopConnection}
            disabled={isConnected !== true}
            className="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            停止
          </button>
        </div>
        
        <p className="text-sm text-gray-600">
          このテストはSupabase Realtimeの接続状況を確認します。
          家事の即座な同期にはRealtime接続が必要です。
        </p>
      </div>
    </div>
  )
}