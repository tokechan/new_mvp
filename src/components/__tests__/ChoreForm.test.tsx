import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { ChoreForm } from '../ChoreForm'

// テスト用のモック関数
const mockOnAdd = jest.fn()

describe('ChoreForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const defaultProps = {
    onAdd: mockOnAdd,
    partnerId: null,
    isAdding: false,
  }

  describe('レンダリング', () => {
    it('should render form elements correctly', () => {
      render(<ChoreForm {...defaultProps} />)

      expect(screen.getByText('新しい家事を追加')).toBeInTheDocument()
      expect(screen.getByLabelText('家事のタイトル')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('例: 洗濯物を干す')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: '家事を追加' })).toBeInTheDocument()
      expect(screen.getByText('自分専用の家事として追加されます')).toBeInTheDocument()
    })

    it('should show partner message when partnerId is provided', () => {
      render(<ChoreForm {...defaultProps} partnerId="partner-123" />)

      expect(screen.getByText('パートナーと共有されます')).toBeInTheDocument()
    })

    it('should show loading state when isAdding is true', () => {
      render(<ChoreForm {...defaultProps} isAdding={true} />)

      const input = screen.getByLabelText('家事のタイトル')
      const button = screen.getByRole('button')

      expect(input).toBeDisabled()
      expect(button).toBeDisabled()
      expect(screen.getByText('追加中...')).toBeInTheDocument()
    })

    it('should show hint message', () => {
      render(<ChoreForm {...defaultProps} />)

      expect(screen.getByText(/ヒント:/)).toBeInTheDocument()
      expect(screen.getByText(/Enterキーでも追加できます/)).toBeInTheDocument()
    })
  })

  describe('入力処理', () => {
    it('should update input value when typing', async () => {
      const user = userEvent.setup()
      render(<ChoreForm {...defaultProps} />)

      const input = screen.getByLabelText('家事のタイトル')
      await user.type(input, 'テスト家事')

      expect(input).toHaveValue('テスト家事')
    })

    it('should show character count', async () => {
      const user = userEvent.setup()
      render(<ChoreForm {...defaultProps} />)

      const input = screen.getByLabelText('家事のタイトル')
      await user.type(input, 'テスト')

      expect(screen.getByText('3/100')).toBeInTheDocument()
    })

    it('should show warning color when approaching character limit', async () => {
      const user = userEvent.setup()
      render(<ChoreForm {...defaultProps} />)

      const input = screen.getByLabelText('家事のタイトル')
      const longText = 'a'.repeat(70) // 70文字
      await user.type(input, longText)

      const counter = screen.getByText('70/100')
      expect(counter).toHaveClass('text-yellow-500')
    })

    it('should show error color when near character limit', async () => {
      const user = userEvent.setup()
      render(<ChoreForm {...defaultProps} />)

      const input = screen.getByLabelText('家事のタイトル')
      const longText = 'a'.repeat(85) // 85文字
      await user.type(input, longText)

      const counter = screen.getByText('85/100')
      expect(counter).toHaveClass('text-red-500')
    })
  })

  describe('バリデーション', () => {
    it('should show error for empty title', async () => {
      const { container } = render(<ChoreForm {...defaultProps} />)

      const form = container.querySelector('form')
      fireEvent.submit(form!)

      await waitFor(() => {
        expect(screen.getByText('家事のタイトルを入力してください')).toBeInTheDocument()
      })
      expect(mockOnAdd).not.toHaveBeenCalled()
    })

    it('should show error for whitespace-only title', async () => {
      const { container } = render(<ChoreForm {...defaultProps} />)

      const input = screen.getByLabelText('家事のタイトル')
      fireEvent.change(input, { target: { value: '   ' } })

      const form = container.querySelector('form')
      fireEvent.submit(form!)

      await waitFor(() => {
        expect(screen.getByText('家事のタイトルを入力してください')).toBeInTheDocument()
      })
      expect(mockOnAdd).not.toHaveBeenCalled()
    })

    it('should show error for title exceeding 100 characters', async () => {
      const { container } = render(<ChoreForm {...defaultProps} />)

      const input = screen.getByLabelText('家事のタイトル')
      const longTitle = 'a'.repeat(101)
      
      // 直接値を設定してフォーム送信
      fireEvent.change(input, { target: { value: longTitle } })
      
      const form = container.querySelector('form')
      fireEvent.submit(form!)

      await waitFor(() => {
        expect(screen.getByText('タイトルは100文字以内で入力してください')).toBeInTheDocument()
      })
      expect(mockOnAdd).not.toHaveBeenCalled()
    })

    it('should clear error when valid input is entered', async () => {
      const user = userEvent.setup()
      const { container } = render(<ChoreForm {...defaultProps} />)

      const input = screen.getByLabelText('家事のタイトル')
      const form = container.querySelector('form')

      // エラーを発生させる
      fireEvent.submit(form!)
      await waitFor(() => {
        expect(screen.getByText('家事のタイトルを入力してください')).toBeInTheDocument()
      })

      // 有効な入力をする
      await user.type(input, 'テスト家事')
      await waitFor(() => {
        expect(screen.queryByText('家事のタイトルを入力してください')).not.toBeInTheDocument()
      })
    })

    it('should disable submit button when input is empty', () => {
      render(<ChoreForm {...defaultProps} />)

      const button = screen.getByRole('button', { name: '家事を追加' })
      expect(button).toBeDisabled()
    })

    it('should enable submit button when input has valid text', async () => {
      const user = userEvent.setup()
      render(<ChoreForm {...defaultProps} />)

      const input = screen.getByLabelText('家事のタイトル')
      const button = screen.getByRole('button', { name: '家事を追加' })

      await user.type(input, 'テスト家事')
      expect(button).not.toBeDisabled()
    })
  })

  describe('フォーム送信', () => {
    it('should call onAdd with correct parameters on successful submission', async () => {
      const user = userEvent.setup()
      mockOnAdd.mockResolvedValue(true)
      render(<ChoreForm {...defaultProps} />)

      const input = screen.getByLabelText('家事のタイトル')
      const button = screen.getByRole('button', { name: '家事を追加' })

      await user.type(input, 'テスト家事')
      await user.click(button)

      expect(mockOnAdd).toHaveBeenCalledWith('テスト家事', undefined)
    })

    it('should call onAdd with partnerId when provided', async () => {
      const user = userEvent.setup()
      mockOnAdd.mockResolvedValue(true)
      render(<ChoreForm {...defaultProps} partnerId="partner-123" />)

      const input = screen.getByLabelText('家事のタイトル')
      const button = screen.getByRole('button', { name: '家事を追加' })

      await user.type(input, 'テスト家事')
      await user.click(button)

      expect(mockOnAdd).toHaveBeenCalledWith('テスト家事', 'partner-123')
    })

    it('should clear input on successful submission', async () => {
      const user = userEvent.setup()
      mockOnAdd.mockResolvedValue(true)
      render(<ChoreForm {...defaultProps} />)

      const input = screen.getByLabelText('家事のタイトル')
      const button = screen.getByRole('button', { name: '家事を追加' })

      await user.type(input, 'テスト家事')
      await user.click(button)

      await waitFor(() => {
        expect(input).toHaveValue('')
      })
    })

    it('should handle submission error gracefully', async () => {
      const user = userEvent.setup()
      const errorMessage = 'サーバーエラーが発生しました'
      mockOnAdd.mockRejectedValue(new Error(errorMessage))
      
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      render(<ChoreForm {...defaultProps} />)

      const input = screen.getByLabelText('家事のタイトル')
      const button = screen.getByRole('button', { name: '家事を追加' })

      await user.type(input, 'テスト家事')
      await user.click(button)

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument()
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith('家事の追加に失敗:', expect.any(Error))
      consoleErrorSpy.mockRestore()
    })

    it('should trim whitespace from title before submission', async () => {
      const user = userEvent.setup()
      mockOnAdd.mockResolvedValue(true)
      render(<ChoreForm {...defaultProps} />)

      const input = screen.getByLabelText('家事のタイトル')
      const button = screen.getByRole('button', { name: '家事を追加' })

      await user.type(input, '  テスト家事  ')
      await user.click(button)

      expect(mockOnAdd).toHaveBeenCalledWith('テスト家事', undefined)
    })
  })

  describe('キーボード操作', () => {
    it('should submit form when Enter key is pressed', async () => {
      const user = userEvent.setup()
      mockOnAdd.mockResolvedValue(true)
      render(<ChoreForm {...defaultProps} />)

      const input = screen.getByLabelText('家事のタイトル')
      await user.type(input, 'テスト家事')
      await user.keyboard('{Enter}')

      await waitFor(() => {
        expect(mockOnAdd).toHaveBeenCalledWith('テスト家事', undefined)
      })
    })

    it('should not submit form when Shift+Enter is pressed', async () => {
      render(<ChoreForm {...defaultProps} />)

      const input = screen.getByLabelText('家事のタイトル')
      await userEvent.type(input, 'テスト家事')
      
      fireEvent.keyDown(input, { key: 'Enter', code: 'Enter', shiftKey: true })

      expect(mockOnAdd).not.toHaveBeenCalled()
    })
  })

  describe('アクセシビリティ', () => {
    it('should have proper labels and ARIA attributes', () => {
      render(<ChoreForm {...defaultProps} />)

      const input = screen.getByLabelText('家事のタイトル')
      expect(input).toHaveAttribute('id', 'chore-title')
      expect(input).toHaveAttribute('maxLength', '100')
    })

    it('should show error with proper styling', async () => {
      const { container } = render(<ChoreForm {...defaultProps} />)

      const form = container.querySelector('form')
      fireEvent.submit(form!)

      await waitFor(() => {
        expect(screen.getByText('家事のタイトルを入力してください')).toBeInTheDocument()
      })

      const input = screen.getByLabelText('家事のタイトル')
      expect(input).toHaveClass('border-red-300')
    })
  })
})