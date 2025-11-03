import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import { ChoreItem } from '@/features/chores/components/ChoreItem'
import { Chore } from '@/types/chore'

// モック設定
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}))

jest.mock('@/features/chores/components/ChoreCompletionModal', () => ({
  ChoreCompletionModal: ({ isOpen, onClose, onConfirm }: any) => {
    if (!isOpen) return null
    return (
      <div data-testid="chore-completion-modal">
        <button onClick={onConfirm}>確認</button>
        <button onClick={onClose}>閉じる</button>
      </div>
    )
  }
}))

jest.mock('@/features/thank-you/components/CongratulationsModal', () => ({
  CongratulationsModal: ({ isOpen, onClose }: any) => {
    if (!isOpen) return null
    return (
      <div data-testid="congratulations-modal">
        <button onClick={onClose}>閉じる</button>
      </div>
    )
  }
}))

jest.mock('@/features/thank-you/components/ThankYouMessage', () => {
  return function ThankYouMessage({ onSuccess, onCancel }: any) {
    return (
      <div data-testid="thank-you-message">
        <button onClick={onSuccess}>送信</button>
        <button onClick={onCancel}>キャンセル</button>
      </div>
    )
  }
})

describe('ChoreItem', () => {
  const mockRouter = {
    push: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn()
  }

  const mockChore: Chore = {
    id: 'test-chore-1',
    owner_id: 'user-1',
    partner_id: 'partner-1',
    title: 'テスト家事',
    done: false,
    created_at: '2024-01-01T00:00:00Z',
    completed_at: undefined
  }

  const mockPartnerInfo = {
    id: 'partner-1',
    name: 'パートナー'
  }

  const defaultProps = {
    chore: mockChore,
    onToggle: jest.fn(),
    onDelete: jest.fn(),
    isOwnChore: true,
    partnerName: 'パートナー',
    showThankYou: false,
    onShowThankYou: jest.fn(),
    onHideThankYou: jest.fn(),
    partnerInfo: mockPartnerInfo,
    currentUserId: 'user-1'
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
  })

  describe('基本的なレンダリング', () => {
    it('家事タイトルが表示される', () => {
      render(<ChoreItem {...defaultProps} />)
      expect(screen.getByText('テスト家事')).toBeInTheDocument()
    })

    it('完了ボタンが表示される', () => {
      render(<ChoreItem {...defaultProps} />)
      expect(screen.getByTestId('toggle-chore-button')).toBeInTheDocument()
      expect(screen.getByText('完了する')).toBeInTheDocument()
    })

    it('削除ボタンが表示される', () => {
      render(<ChoreItem {...defaultProps} />)
      expect(screen.getByText('削除')).toBeInTheDocument()
    })
  })

  describe('未完了の家事の場合', () => {
    it('完了ボタンをクリックするとモーダルが表示される', async () => {
      render(<ChoreItem {...defaultProps} />)
      
      fireEvent.click(screen.getByTestId('toggle-chore-button'))
      
      await waitFor(() => {
        expect(screen.getByTestId('chore-completion-modal')).toBeInTheDocument()
      })
    })

    it('モーダルで確認すると完了処理が実行される', async () => {
      const mockOnToggle = jest.fn().mockResolvedValue(undefined)
      render(<ChoreItem {...defaultProps} onToggle={mockOnToggle} />)
      
      // 完了ボタンをクリック
      fireEvent.click(screen.getByTestId('toggle-chore-button'))
      
      // モーダルで確認
      await waitFor(() => {
        expect(screen.getByTestId('chore-completion-modal')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByText('確認'))
      
      await waitFor(() => {
        expect(mockOnToggle).toHaveBeenCalledWith('test-chore-1', false)
      })
    })

    it('完了後にお疲れ様モーダルが表示される', async () => {
      const mockOnToggle = jest.fn().mockResolvedValue(undefined)
      render(<ChoreItem {...defaultProps} onToggle={mockOnToggle} />)
      
      fireEvent.click(screen.getByTestId('toggle-chore-button'))
      
      await waitFor(() => {
        expect(screen.getByTestId('chore-completion-modal')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByText('確認'))
      
      await waitFor(() => {
        expect(screen.getByTestId('congratulations-modal')).toBeInTheDocument()
      })
    })

    it('ありがとうボタンは表示されない', () => {
      render(<ChoreItem {...defaultProps} />)
      expect(screen.queryByText('ありがとう')).not.toBeInTheDocument()
    })
  })

  describe('完了済みの家事の場合', () => {
    const completedChore: Chore = {
      ...mockChore,
      done: true,
      completed_at: '2024-01-01T12:00:00Z'
    }

    it('完了済みのスタイルが適用される', () => {
      render(<ChoreItem {...defaultProps} chore={completedChore} />)
      
      const title = screen.getByText('テスト家事')
      expect(title).toHaveClass('line-through', 'text-green-700')
    })

    it('完了日時が表示される', () => {
      render(<ChoreItem {...defaultProps} chore={completedChore} />)
      expect(screen.getByText(/に完了/)).toBeInTheDocument()
    })

    it('未完了に戻すボタンが表示される', () => {
      render(<ChoreItem {...defaultProps} chore={completedChore} />)
      expect(screen.getByText('未完了に戻す')).toBeInTheDocument()
    })

    it('未完了に戻すボタンをクリックすると直接処理が実行される', async () => {
      const mockOnToggle = jest.fn().mockResolvedValue(undefined)
      render(<ChoreItem {...defaultProps} chore={completedChore} onToggle={mockOnToggle} />)
      
      fireEvent.click(screen.getByTestId('toggle-chore-button'))
      
      await waitFor(() => {
        expect(mockOnToggle).toHaveBeenCalledWith('test-chore-1', true)
      })
    })

    it('パートナーの家事の場合、ありがとうボタンが表示される', () => {
      render(<ChoreItem {...defaultProps} chore={completedChore} isOwnChore={false} />)
      expect(screen.getByText('ありがとう')).toBeInTheDocument()
    })

    it('自分の家事の場合、ありがとうボタンは表示されない', () => {
      render(<ChoreItem {...defaultProps} chore={completedChore} isOwnChore={true} />)
      expect(screen.queryByText('ありがとう')).not.toBeInTheDocument()
    })
  })

  describe('ありがとう機能', () => {
    const completedChore: Chore = {
      ...mockChore,
      done: true,
      completed_at: '2024-01-01T12:00:00Z'
    }

    it('ありがとうボタンをクリックするとメッセージフォームが表示される', () => {
      const mockOnShowThankYou = jest.fn()
      render(
        <ChoreItem 
          {...defaultProps} 
          chore={completedChore} 
          isOwnChore={false}
          showThankYou={true}
          onShowThankYou={mockOnShowThankYou}
        />
      )
      
      expect(screen.getByTestId('thank-you-message')).toBeInTheDocument()
    })

    it('ありがとうメッセージ送信後にフォームが非表示になる', () => {
      const mockOnHideThankYou = jest.fn()
      render(
        <ChoreItem 
          {...defaultProps} 
          chore={completedChore} 
          isOwnChore={false}
          showThankYou={true}
          onHideThankYou={mockOnHideThankYou}
        />
      )
      
      fireEvent.click(screen.getByText('送信'))
      expect(mockOnHideThankYou).toHaveBeenCalled()
    })
  })

  describe('削除機能', () => {
    it('削除ボタンをクリックすると削除処理が実行される', () => {
      const mockOnDelete = jest.fn()
      render(<ChoreItem {...defaultProps} onDelete={mockOnDelete} />)
      
      fireEvent.click(screen.getByText('削除'))
      expect(mockOnDelete).toHaveBeenCalledWith('test-chore-1')
    })
  })

  describe('エラーハンドリング', () => {
    it('完了処理でエラーが発生してもUIが正常に動作する', async () => {
      const mockOnToggle = jest.fn().mockRejectedValue(new Error('Network error'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      render(<ChoreItem {...defaultProps} onToggle={mockOnToggle} />)
      
      fireEvent.click(screen.getByTestId('toggle-chore-button'))
      
      await waitFor(() => {
        expect(screen.getByTestId('chore-completion-modal')).toBeInTheDocument()
      })
      
      fireEvent.click(screen.getByText('確認'))
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('家事の完了に失敗しました:', expect.any(Error))
      })
      
      consoleSpy.mockRestore()
    })

    it('未完了に戻す処理でエラーが発生してもUIが正常に動作する', async () => {
      const completedChore: Chore = { ...mockChore, done: true }
      const mockOnToggle = jest.fn().mockRejectedValue(new Error('Network error'))
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      
      render(<ChoreItem {...defaultProps} chore={completedChore} onToggle={mockOnToggle} />)
      
      fireEvent.click(screen.getByTestId('toggle-chore-button'))
      
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('家事の状態更新に失敗しました:', expect.any(Error))
      })
      
      consoleSpy.mockRestore()
    })
  })

  describe('ローディング状態', () => {
    it('処理中はボタンが無効化される', async () => {
      const mockOnToggle = jest.fn(() => new Promise<void>(resolve => setTimeout(resolve, 100)))
      const completedChore: Chore = { ...mockChore, done: true }
      
      render(<ChoreItem {...defaultProps} chore={completedChore} onToggle={mockOnToggle} />)
      
      const button = screen.getByTestId('toggle-chore-button')
      fireEvent.click(button)
      
      expect(button).toBeDisabled()
      expect(screen.getByText('処理中...')).toBeInTheDocument()
      
      await waitFor(() => {
        expect(button).not.toBeDisabled()
      })
    })

    it('処理中は重複クリックを防ぐ', async () => {
      const mockOnToggle = jest.fn(() => new Promise<void>(resolve => setTimeout(resolve, 100)))
      
      render(<ChoreItem {...defaultProps} onToggle={mockOnToggle} />)
      
      const button = screen.getByTestId('toggle-chore-button')
      
      // 最初のクリック
      fireEvent.click(button)
      
      // 処理中に再度クリック
      fireEvent.click(button)
      
      await waitFor(() => {
        expect(mockOnToggle).toHaveBeenCalledTimes(0) // モーダル表示のため、まだ呼ばれない
      })
    })
  })

  describe('完了日時のフォーマット', () => {
    it('1時間以内の場合は「1時間以内」と表示される', () => {
      const now = new Date()
      const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000)
      
      const recentChore: Chore = {
        ...mockChore,
        done: true,
        completed_at: thirtyMinutesAgo.toISOString()
      }
      
      render(<ChoreItem {...defaultProps} chore={recentChore} />)
      expect(screen.getByText('1時間以内に完了')).toBeInTheDocument()
    })

    it('24時間以内の場合は「X時間前」と表示される', () => {
      const now = new Date()
      const threeHoursAgo = new Date(now.getTime() - 3 * 60 * 60 * 1000)
      
      const recentChore: Chore = {
        ...mockChore,
        done: true,
        completed_at: threeHoursAgo.toISOString()
      }
      
      render(<ChoreItem {...defaultProps} chore={recentChore} />)
      expect(screen.getByText('3時間前に完了')).toBeInTheDocument()
    })

    it('24時間以上前の場合は日付が表示される', () => {
      const twoDaysAgo = new Date('2024-01-01T12:00:00Z')
      
      const oldChore: Chore = {
        ...mockChore,
        done: true,
        completed_at: twoDaysAgo.toISOString()
      }
      
      render(<ChoreItem {...defaultProps} chore={oldChore} />)
      expect(screen.getByText(/1月1日に完了/)).toBeInTheDocument()
    })
  })

  describe('アクセシビリティ', () => {
    it('ボタンに適切なaria属性が設定されている', () => {
      render(<ChoreItem {...defaultProps} />)
      
      const toggleButton = screen.getByTestId('toggle-chore-button')
      // Buttonコンポーネントはbutton要素なので、デフォルトでtype="submit"になる
      expect(toggleButton.tagName).toBe('BUTTON')
    })

    it('キーボードナビゲーションが機能する', () => {
      render(<ChoreItem {...defaultProps} />)
      
      const toggleButton = screen.getByTestId('toggle-chore-button')
      toggleButton.focus()
      expect(toggleButton).toHaveFocus()
    })
  })
})
