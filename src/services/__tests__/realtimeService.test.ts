import { RealtimeService, realtimeService, type RealtimeConnectionState } from '../realtimeService'
import { supabase } from '@/lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

// Supabaseクライアントのモック
jest.mock('@/lib/supabase', () => ({
  supabase: {
    channel: jest.fn(),
    removeChannel: jest.fn(),
    from: jest.fn()
  }
}))

const mockSupabase = supabase as any

describe('RealtimeService', () => {
  let service: RealtimeService
  const mockUserId = '123e4567-e89b-12d3-a456-426614174000'
  let mockChannel: any
  let mockOnStateChange: jest.Mock

  beforeEach(() => {
    jest.clearAllMocks()
    service = new RealtimeService()
    mockOnStateChange = jest.fn()

    // モックチャンネルの設定
    mockChannel = {
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
      state: 'SUBSCRIBED'
    }

    mockSupabase.channel.mockReturnValue(mockChannel)
  })

  describe('initialize', () => {
    it('ユーザーIDとコールバックを設定して接続を初期化する', () => {
      const connectSpy = jest.spyOn(service as any, 'connect').mockImplementation()

      service.initialize(mockUserId, mockOnStateChange)

      expect(connectSpy).toHaveBeenCalled()
      expect((service as any).userId).toBe(mockUserId)
      expect((service as any).onStateChange).toBe(mockOnStateChange)
    })

    it('コールバックなしでも初期化できる', () => {
      const connectSpy = jest.spyOn(service as any, 'connect').mockImplementation()

      service.initialize(mockUserId)

      expect(connectSpy).toHaveBeenCalled()
      expect((service as any).userId).toBe(mockUserId)
      expect((service as any).onStateChange).toBeUndefined()
    })
  })

  describe('connect', () => {
    beforeEach(() => {
      service.initialize(mockUserId)
    })

    it('新しいチャンネルを作成して接続する', () => {
      expect(mockSupabase.channel).toHaveBeenCalledWith(`user-${mockUserId}-changes`)
      expect(mockChannel.on).toHaveBeenCalledWith('presence', { event: 'sync' }, expect.any(Function))
      expect(mockChannel.on).toHaveBeenCalledWith('presence', { event: 'join' }, expect.any(Function))
      expect(mockChannel.on).toHaveBeenCalledWith('presence', { event: 'leave' }, expect.any(Function))
      expect(mockChannel.subscribe).toHaveBeenCalledWith(expect.any(Function))
    })

    it('ユーザーIDが設定されていない場合は接続しない', () => {
      const serviceWithoutUser = new RealtimeService()
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      // モックをクリアしてから実行
      jest.clearAllMocks()

      serviceWithoutUser['connect']()

      expect(consoleSpy).toHaveBeenCalledWith('ユーザーIDが設定されていません')
      expect(mockSupabase.channel).not.toHaveBeenCalled()
    })

    it('既存の接続がある場合は切断してから新しい接続を作成する', () => {
      const disconnectSpy = jest.spyOn(service, 'disconnect').mockImplementation()

      service['connect']()

      expect(disconnectSpy).toHaveBeenCalled()
    })

    it('接続エラーが発生した場合にエラー状態を更新する', () => {
      mockSupabase.channel.mockImplementation(() => {
        throw new Error('Connection failed')
      })

      const updateStateSpy = jest.spyOn(service as any, 'updateConnectionState')

      service['connect']()

      expect(updateStateSpy).toHaveBeenCalledWith({
        isConnected: false,
        error: '接続初期化エラー: Connection failed'
      })
    })

    describe('subscription status handling', () => {
      it('SUBSCRIBED状態で接続成功を更新する', () => {
        const updateStateSpy = jest.spyOn(service as any, 'updateConnectionState')
        
        service['connect']()
        
        // subscribeコールバックを取得して実行
        const subscribeCallback = mockChannel.subscribe.mock.calls[0][0]
        subscribeCallback('SUBSCRIBED')

        expect(updateStateSpy).toHaveBeenCalledWith({ isConnected: true, error: null })
      })

      it('CHANNEL_ERROR状態でエラーを更新する', () => {
        const updateStateSpy = jest.spyOn(service as any, 'updateConnectionState')
        
        service['connect']()
        
        const subscribeCallback = mockChannel.subscribe.mock.calls[0][0]
        subscribeCallback('CHANNEL_ERROR')

        expect(updateStateSpy).toHaveBeenCalledWith({
          isConnected: false,
          error: 'チャンネル接続エラー'
        })
      })

      it('TIMED_OUT状態でタイムアウトエラーを更新する', () => {
        const updateStateSpy = jest.spyOn(service as any, 'updateConnectionState')
        
        service['connect']()
        
        const subscribeCallback = mockChannel.subscribe.mock.calls[0][0]
        subscribeCallback('TIMED_OUT')

        expect(updateStateSpy).toHaveBeenCalledWith({
          isConnected: false,
          error: '接続タイムアウト'
        })
      })

      it('CLOSED状態で接続終了エラーを更新する', () => {
        const updateStateSpy = jest.spyOn(service as any, 'updateConnectionState')
        
        service['connect']()
        
        const subscribeCallback = mockChannel.subscribe.mock.calls[0][0]
        subscribeCallback('CLOSED')

        expect(updateStateSpy).toHaveBeenCalledWith({
          isConnected: false,
          error: '接続が閉じられました'
        })
      })
    })

    describe('presence event handling', () => {
      it('presence join イベントで接続状態を更新する', () => {
        const updateStateSpy = jest.spyOn(service as any, 'updateConnectionState')
        
        service['connect']()
        
        // presence joinコールバックを取得して実行
        const joinCallback = mockChannel.on.mock.calls.find(
          (call: any) => call[0] === 'presence' && call[1].event === 'join'
        )[2]
        
        joinCallback({ key: 'test', newPresences: [] })

        expect(updateStateSpy).toHaveBeenCalledWith({ isConnected: true, error: null })
      })
    })
  })

  describe('subscribeToChoreChanges', () => {
    const mockHandler = jest.fn()

    beforeEach(() => {
      service.initialize(mockUserId)
    })

    it('家事変更イベントの監視を開始する', () => {
      service.subscribeToChoreChanges(mockHandler)

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chores',
          filter: `owner_id=eq.${mockUserId}`
        },
        expect.any(Function)
      )
    })

    it('チャンネルが設定されていない場合はエラーログを出力する', () => {
      const serviceWithoutChannel = new RealtimeService()
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      serviceWithoutChannel.subscribeToChoreChanges(mockHandler)

      expect(consoleSpy).toHaveBeenCalledWith('RealtimeチャンネルまたはユーザーIDが設定されていません')
    })

    it('イベントハンドラーが正しく呼び出される', () => {
      const updateEventCountSpy = jest.spyOn(service as any, 'updateEventCount')
      
      service.subscribeToChoreChanges(mockHandler)

      // postgres_changesコールバックを取得して実行
      const changeCallback = mockChannel.on.mock.calls.find(
        (call: any) => call[0] === 'postgres_changes'
      )[2]
      
      const mockPayload = { eventType: 'INSERT', new: { id: 1 } }
      changeCallback(mockPayload)

      expect(updateEventCountSpy).toHaveBeenCalled()
      expect(mockHandler).toHaveBeenCalledWith(mockPayload)
    })
  })

  describe('subscribeToCompletionChanges', () => {
    const mockHandler = jest.fn()

    beforeEach(() => {
      service.initialize(mockUserId)
    })

    it('完了記録変更イベントの監視を開始する', () => {
      service.subscribeToCompletionChanges(mockHandler)

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'completions'
        },
        expect.any(Function)
      )
    })

    it('チャンネルが設定されていない場合はエラーログを出力する', () => {
      const serviceWithoutChannel = new RealtimeService()
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      serviceWithoutChannel.subscribeToCompletionChanges(mockHandler)

      expect(consoleSpy).toHaveBeenCalledWith('RealtimeチャンネルまたはユーザーIDが設定されていません')
    })

    it('イベントハンドラーが正しく呼び出される', () => {
      const updateEventCountSpy = jest.spyOn(service as any, 'updateEventCount')
      
      service.subscribeToCompletionChanges(mockHandler)

      const changeCallback = mockChannel.on.mock.calls.find(
        (call: any) => call[0] === 'postgres_changes'
      )[2]
      
      const mockPayload = { eventType: 'INSERT', new: { id: 1 } }
      changeCallback(mockPayload)

      expect(updateEventCountSpy).toHaveBeenCalled()
      expect(mockHandler).toHaveBeenCalledWith(mockPayload)
    })
  })

  describe('subscribeToProfileChanges', () => {
    const mockHandler = jest.fn()

    beforeEach(() => {
      service.initialize(mockUserId)
    })

    it('プロフィール変更イベントの監視を開始する', () => {
      service.subscribeToProfileChanges(mockHandler)

      expect(mockChannel.on).toHaveBeenCalledWith(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles'
        },
        expect.any(Function)
      )
    })

    it('チャンネルが設定されていない場合はエラーログを出力する', () => {
      const serviceWithoutChannel = new RealtimeService()
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()

      serviceWithoutChannel.subscribeToProfileChanges(mockHandler)

      expect(consoleSpy).toHaveBeenCalledWith('RealtimeチャンネルまたはユーザーIDが設定されていません')
    })

    it('イベントハンドラーが正しく呼び出される', () => {
      const updateEventCountSpy = jest.spyOn(service as any, 'updateEventCount')
      
      service.subscribeToProfileChanges(mockHandler)

      const changeCallback = mockChannel.on.mock.calls.find(
        (call: any) => call[0] === 'postgres_changes'
      )[2]
      
      const mockPayload = { eventType: 'UPDATE', new: { id: mockUserId } }
      changeCallback(mockPayload)

      expect(updateEventCountSpy).toHaveBeenCalled()
      expect(mockHandler).toHaveBeenCalledWith(mockPayload)
    })
  })

  describe('reconnect', () => {
    it('手動再接続を実行する', () => {
      const connectSpy = jest.spyOn(service as any, 'connect')

      service.reconnect()

      expect(connectSpy).toHaveBeenCalled()
    })
  })

  describe('disconnect', () => {
    beforeEach(() => {
      service.initialize(mockUserId)
    })

    it('チャンネルを削除して接続状態をリセットする', () => {
      const updateStateSpy = jest.spyOn(service as any, 'updateConnectionState')

      service.disconnect()

      expect(mockSupabase.removeChannel).toHaveBeenCalledWith(mockChannel)
      expect((service as any).channel).toBeNull()
      expect(updateStateSpy).toHaveBeenCalledWith({
        isConnected: false,
        error: null
      })
    })

    it('チャンネルがない場合でも正常に動作する', () => {
      const serviceWithoutChannel = new RealtimeService()
      const updateStateSpy = jest.spyOn(serviceWithoutChannel as any, 'updateConnectionState')

      serviceWithoutChannel.disconnect()

      expect(updateStateSpy).toHaveBeenCalledWith({
        isConnected: false,
        error: null
      })
    })
  })

  describe('getConnectionState', () => {
    it('現在の接続状態のコピーを返す', () => {
      const state = service.getConnectionState()

      expect(state).toEqual({
        isConnected: false,
        lastEventTime: null,
        eventCount: 0,
        error: null
      })

      // 元のオブジェクトとは別のインスタンスであることを確認
      expect(state).not.toBe((service as any).connectionState)
    })
  })

  describe('updateConnectionState', () => {
    it('接続状態を更新する', () => {
      const newState = {
        isConnected: true,
        error: 'test error'
      }

      service['updateConnectionState'](newState)

      const state = service.getConnectionState()
      expect(state.isConnected).toBe(true)
      expect(state.error).toBe('test error')
      expect(state.eventCount).toBe(0) // 既存の値は保持される
    })

    it('状態変更コールバックが設定されている場合は呼び出す', () => {
      service.initialize(mockUserId, mockOnStateChange)

      const newState = { isConnected: true }
      service['updateConnectionState'](newState)

      expect(mockOnStateChange).toHaveBeenCalledWith(
        expect.objectContaining({ isConnected: true })
      )
    })

    it('状態変更コールバックが設定されていない場合はエラーにならない', () => {
      service.initialize(mockUserId)

      const newState = { isConnected: true }
      
      expect(() => {
        service['updateConnectionState'](newState)
      }).not.toThrow()
    })
  })

  describe('updateEventCount', () => {
    it('イベント数と最終イベント時刻を更新する', () => {
      const beforeTime = new Date()
      
      service['updateEventCount']()
      
      const state = service.getConnectionState()
      expect(state.eventCount).toBe(1)
      expect(state.lastEventTime).toBeInstanceOf(Date)
      expect(state.lastEventTime!.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime())
    })

    it('複数回呼び出すとイベント数が増加する', () => {
      service['updateEventCount']()
      service['updateEventCount']()
      service['updateEventCount']()

      const state = service.getConnectionState()
      expect(state.eventCount).toBe(3)
    })
  })

  describe('testConnection', () => {
    beforeEach(() => {
      service.initialize(mockUserId)
    })

    it('接続テストが成功する', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: [{ id: mockUserId }],
            error: null
          })
        })
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      })

      const result = await service.testConnection()

      expect(result).toBe(true)
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles')
      expect(mockSelect).toHaveBeenCalledWith('id')
    })

    it('ユーザーIDが設定されていない場合はエラーになる', async () => {
      const serviceWithoutUser = new RealtimeService()

      const result = await serviceWithoutUser.testConnection()

      expect(result).toBe(false)
    })

    it('データベースエラーが発生した場合はfalseを返す', async () => {
      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' }
          })
        })
      })

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      })

      const updateStateSpy = jest.spyOn(service as any, 'updateConnectionState')

      const result = await service.testConnection()

      expect(result).toBe(false)
      expect(updateStateSpy).toHaveBeenCalledWith({
        error: '接続テスト失敗: Database error'
      })
    })
  })

  describe('enableAutoReconnect', () => {
    beforeEach(() => {
      jest.useFakeTimers()
      service.initialize(mockUserId)
    })

    afterEach(() => {
      jest.useRealTimers()
    })

    it('指定した間隔で自動再接続を試行する', () => {
      const reconnectSpy = jest.spyOn(service, 'reconnect').mockImplementation()
      
      // 接続が切断された状態にする
      service['updateConnectionState']({ isConnected: false })

      service.enableAutoReconnect(1000)

      // 1秒経過
      jest.advanceTimersByTime(1000)

      expect(reconnectSpy).toHaveBeenCalledTimes(1)

      // さらに1秒経過
      jest.advanceTimersByTime(1000)

      expect(reconnectSpy).toHaveBeenCalledTimes(2)
    })

    it('接続中の場合は再接続を試行しない', () => {
      const reconnectSpy = jest.spyOn(service, 'reconnect').mockImplementation()
      
      // 接続中の状態にする
      service['updateConnectionState']({ isConnected: true })

      service.enableAutoReconnect(1000)

      // 1秒経過
      jest.advanceTimersByTime(1000)

      expect(reconnectSpy).not.toHaveBeenCalled()
    })

    it('デフォルトの間隔（30秒）で動作する', () => {
      const reconnectSpy = jest.spyOn(service, 'reconnect').mockImplementation()
      
      service['updateConnectionState']({ isConnected: false })
      service.enableAutoReconnect()

      // 30秒経過
      jest.advanceTimersByTime(30000)

      expect(reconnectSpy).toHaveBeenCalledTimes(1)
    })
  })

  describe('getDebugInfo', () => {
    it('デバッグ情報を正しく返す', () => {
      service.initialize(mockUserId)

      const debugInfo = service.getDebugInfo()

      expect(debugInfo).toEqual({
        userId: mockUserId,
        hasChannel: true,
        connectionState: expect.objectContaining({
          isConnected: false,
          lastEventTime: null,
          eventCount: 0,
          error: null
        }),
        channelState: 'SUBSCRIBED'
      })
    })

    it('チャンネルがない場合の情報を返す', () => {
      const serviceWithoutChannel = new RealtimeService()

      const debugInfo = serviceWithoutChannel.getDebugInfo()

      expect(debugInfo).toEqual({
        userId: null,
        hasChannel: false,
        connectionState: expect.any(Object),
        channelState: null
      })
    })
  })

  describe('singleton instance', () => {
    it('realtimeServiceシングルトンインスタンスが存在する', () => {
      expect(realtimeService).toBeInstanceOf(RealtimeService)
    })

    it('複数回インポートしても同じインスタンスを返す', () => {
      const { realtimeService: service1 } = require('../realtimeService')
      const { realtimeService: service2 } = require('../realtimeService')

      expect(service1).toBe(service2)
    })
  })
})