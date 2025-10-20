import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { useRouter, usePathname } from 'next/navigation'
import '@testing-library/jest-dom'
import Navigation from '../Navigation'

// Next.jsのナビゲーションフックをモック
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
}))

// NotificationCenterコンポーネントをモック
jest.mock('@/components/NotificationCenter', () => {
  return function MockNotificationCenter() {
    return <div data-testid="notification-center">Notification Center</div>
  }
})

const mockPush = jest.fn()
const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>
const mockUsePathname = usePathname as jest.MockedFunction<typeof usePathname>

describe('Navigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    })
  })

  describe('レンダリング', () => {
    it('should render all navigation items correctly', () => {
      mockUsePathname.mockReturnValue('/')
      
      render(<Navigation />)

      // ナビゲーション項目の確認
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('DoneList')).toBeInTheDocument()
      expect(screen.getByText('Share')).toBeInTheDocument()
      
      // 通知センターの確認
      expect(screen.getByTestId('notification-center')).toBeInTheDocument()
    })

    it('should render navigation buttons with correct accessibility attributes', () => {
      mockUsePathname.mockReturnValue('/')
      
      render(<Navigation />)

      const homeButton = screen.getByRole('button', { name: /home/i })
      const doneListButton = screen.getByRole('button', { name: /donelist/i })
      const shareButton = screen.getByRole('button', { name: /share/i })

      expect(homeButton).toBeInTheDocument()
      expect(doneListButton).toBeInTheDocument()
      expect(shareButton).toBeInTheDocument()
    })
  })

  describe('アクティブ状態の判定', () => {
    it('should highlight home button when on home page', () => {
      mockUsePathname.mockReturnValue('/')
      
      render(<Navigation />)

      const homeButton = screen.getByRole('button', { name: /home/i })
      
      // アクティブ状態のスタイルが適用されているかを確認
      // 実際のスタイルクラス名は実装に依存するため、適切に調整が必要
      expect(homeButton).toHaveClass('bg-blue-100') // 例: アクティブ時のクラス
    })

    it('should highlight done-list button when on completed-chores page', () => {
      mockUsePathname.mockReturnValue('/completed-chores')
      
      render(<Navigation />)

      const doneListButton = screen.getByRole('button', { name: /donelist/i })
      
      expect(doneListButton).toHaveClass('bg-blue-100')
    })

    it('should highlight share button when on share page', () => {
      mockUsePathname.mockReturnValue('/share')
      
      render(<Navigation />)

      const shareButton = screen.getByRole('button', { name: /share/i })
      
      expect(shareButton).toHaveClass('bg-blue-100')
    })

    it('should handle nested paths correctly', () => {
      mockUsePathname.mockReturnValue('/completed-chores/details')
      
      render(<Navigation />)

      const doneListButton = screen.getByRole('button', { name: /donelist/i })
      
      expect(doneListButton).toHaveClass('bg-blue-100')
    })
  })

  describe('ナビゲーション機能', () => {
    it('should navigate to home when home button is clicked', () => {
      mockUsePathname.mockReturnValue('/other-page')
      
      render(<Navigation />)

      const homeButton = screen.getByRole('button', { name: /home/i })
      fireEvent.click(homeButton)

      expect(mockPush).toHaveBeenCalledWith('/')
    })

    it('should navigate to completed-chores when done-list button is clicked', () => {
      mockUsePathname.mockReturnValue('/')
      
      render(<Navigation />)

      const doneListButton = screen.getByRole('button', { name: /donelist/i })
      fireEvent.click(doneListButton)

      expect(mockPush).toHaveBeenCalledWith('/completed-chores')
    })

    it('should navigate to share when share button is clicked', () => {
      mockUsePathname.mockReturnValue('/')
      
      render(<Navigation />)

      const shareButton = screen.getByRole('button', { name: /share/i })
      fireEvent.click(shareButton)

      expect(mockPush).toHaveBeenCalledWith('/share')
    })
  })

  describe('エラーハンドリング', () => {
    it('should handle router push errors gracefully', () => {
      mockUsePathname.mockReturnValue('/')
      mockPush.mockImplementation(() => {
        throw new Error('Navigation failed')
      })
      
      // エラーをキャッチするためのスパイ
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<Navigation />)

      const homeButton = screen.getByRole('button', { name: /home/i })
      
      // エラーが発生してもアプリがクラッシュしないことを確認
      expect(() => fireEvent.click(homeButton)).not.toThrow()
      
      consoleSpy.mockRestore()
    })
  })

  describe('レスポンシブ対応', () => {
    it('should render correctly on mobile viewport', () => {
      // モバイルビューポートのシミュレーション
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      mockUsePathname.mockReturnValue('/')
      
      render(<Navigation />)

      // モバイル表示でも全ての要素が表示されることを確認
      expect(screen.getByText('Home')).toBeInTheDocument()
      expect(screen.getByText('DoneList')).toBeInTheDocument()
      expect(screen.getByText('Share')).toBeInTheDocument()
    })
  })
})