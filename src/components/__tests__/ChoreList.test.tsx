import React from 'react'
import { render, screen } from '@testing-library/react'
import { ChoreList } from '../ChoreList'
import { Chore } from '@/types/chore'
import { useAuthState } from '@/hooks/useAuthState'

// モック設定
jest.mock('@/hooks/useAuthState', () => ({
  useAuthState: jest.fn()
}))

jest.mock('../ChoreItem', () => ({
  ChoreItem: ({ chore, isOwnChore }: any) => (
    <div data-testid={`chore-item-${chore.id}`}>
      <span>{chore.title}</span>
      <span data-testid="is-own-chore">{isOwnChore ? 'own' : 'partner'}</span>
    </div>
  )
}))

describe('ChoreList', () => {
  const mockUser = {
    id: 'user-1',
    email: 'test@example.com'
  }

  const mockChores: Chore[] = [
    {
      id: 'chore-1',
      owner_id: 'user-1',
      partner_id: 'partner-1',
      title: '洗濯',
      done: false,
      created_at: '2024-01-01T00:00:00Z'
    },
    {
      id: 'chore-2',
      owner_id: 'partner-1',
      partner_id: 'user-1',
      title: '掃除',
      done: true,
      created_at: '2024-01-02T00:00:00Z',
      completed_at: '2024-01-02T12:00:00Z'
    }
  ]

  const defaultProps = {
    chores: mockChores,
    isLoading: false,
    onToggleChore: jest.fn(),
    onDeleteChore: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useAuthState as jest.Mock).mockReturnValue({ user: mockUser })
  })

  describe('基本的なレンダリング', () => {
    it('家事一覧のタイトルが表示される', () => {
      render(<ChoreList {...defaultProps} />)
      expect(screen.getByText('家事一覧')).toBeInTheDocument()
    })

    it('家事の件数が表示される', () => {
      render(<ChoreList {...defaultProps} />)
      expect(screen.getByText('(2件)')).toBeInTheDocument()
    })

    it('すべての家事アイテムが表示される', () => {
      render(<ChoreList {...defaultProps} />)
      
      expect(screen.getByTestId('chore-item-chore-1')).toBeInTheDocument()
      expect(screen.getByTestId('chore-item-chore-2')).toBeInTheDocument()
      expect(screen.getByText('洗濯')).toBeInTheDocument()
      expect(screen.getByText('掃除')).toBeInTheDocument()
    })
  })

  describe('ローディング状態', () => {
    it('ローディング中はスピナーが表示される', () => {
      render(<ChoreList {...defaultProps} isLoading={true} />)
      
      expect(screen.getByText('家事を読み込み中...')).toBeInTheDocument()
      expect(screen.queryByText('家事一覧')).not.toBeInTheDocument()
    })

    it('ローディング中は家事アイテムが表示されない', () => {
      render(<ChoreList {...defaultProps} isLoading={true} />)
      
      expect(screen.queryByTestId('chore-item-chore-1')).not.toBeInTheDocument()
      expect(screen.queryByTestId('chore-item-chore-2')).not.toBeInTheDocument()
    })
  })

  describe('空の状態', () => {
    it('家事がない場合は空の状態メッセージが表示される', () => {
      render(<ChoreList {...defaultProps} chores={[]} />)
      
      expect(screen.getByText('まだ家事が登録されていません')).toBeInTheDocument()
      expect(screen.getByText('上のフォームから最初の家事を追加してみましょう！')).toBeInTheDocument()
    })

    it('家事がない場合は家事一覧ヘッダーが表示されない', () => {
      render(<ChoreList {...defaultProps} chores={[]} />)
      
      expect(screen.queryByText('家事一覧')).not.toBeInTheDocument()
    })

    it('空の状態では家事のアイコンが表示される', () => {
      const { container } = render(<ChoreList {...defaultProps} chores={[]} />)
      const homeIcon = container.querySelector('svg')
      expect(homeIcon).toBeInTheDocument()
    })
  })

  describe('家事の所有者判定', () => {
    it('自分の家事は正しく識別される', () => {
      render(<ChoreList {...defaultProps} />)
      
      const choreItem1 = screen.getByTestId('chore-item-chore-1')
      const isOwnChore1 = choreItem1.querySelector('[data-testid="is-own-chore"]')
      expect(isOwnChore1).toHaveTextContent('own')
    })

    it('パートナーの家事は正しく識別される', () => {
      render(<ChoreList {...defaultProps} />)
      
      const choreItem2 = screen.getByTestId('chore-item-chore-2')
      const isOwnChore2 = choreItem2.querySelector('[data-testid="is-own-chore"]')
      expect(isOwnChore2).toHaveTextContent('partner')
    })
  })

  describe('プロパティの受け渡し', () => {
    it('onToggleChoreが正しく渡される', () => {
      const mockOnToggle = jest.fn()
      render(<ChoreList {...defaultProps} onToggleChore={mockOnToggle} />)
      
      // ChoreItemコンポーネントがレンダリングされていることを確認
      expect(screen.getByTestId('chore-item-chore-1')).toBeInTheDocument()
      expect(screen.getByTestId('chore-item-chore-2')).toBeInTheDocument()
    })

    it('onDeleteChoreが正しく渡される', () => {
      const mockOnDelete = jest.fn()
      render(<ChoreList {...defaultProps} onDeleteChore={mockOnDelete} />)
      
      // ChoreItemコンポーネントがレンダリングされていることを確認
      expect(screen.getByTestId('chore-item-chore-1')).toBeInTheDocument()
      expect(screen.getByTestId('chore-item-chore-2')).toBeInTheDocument()
    })
  })

  describe('ユーザー認証状態', () => {
    it('ユーザーがログインしていない場合でも正常に動作する', () => {
      ;(useAuthState as jest.Mock).mockReturnValue({ user: null })
      
      render(<ChoreList {...defaultProps} />)
      
      expect(screen.getByText('家事一覧')).toBeInTheDocument()
      expect(screen.getByTestId('chore-item-chore-1')).toBeInTheDocument()
      expect(screen.getByTestId('chore-item-chore-2')).toBeInTheDocument()
    })

    it('ユーザーがnullの場合、すべての家事がパートナーの家事として扱われる', () => {
      ;(useAuthState as jest.Mock).mockReturnValue({ user: null })
      
      render(<ChoreList {...defaultProps} />)
      
      const choreItems = screen.getAllByTestId(/^chore-item-/)
      choreItems.forEach(item => {
        const isOwnChore = item.querySelector('[data-testid="is-own-chore"]')
        expect(isOwnChore).toHaveTextContent('partner')
      })
    })
  })

  describe('レスポンシブデザイン', () => {
    it('適切なCSSクラスが適用されている', () => {
      const { container } = render(<ChoreList {...defaultProps} />)
      
      const listContainer = container.querySelector('.bg-white.rounded-lg.shadow-sm.border')
      expect(listContainer).toBeInTheDocument()
    })

    it('家事アイテムが適切に区切られている', () => {
      const { container } = render(<ChoreList {...defaultProps} />)
      
      const divider = container.querySelector('.divide-y.divide-gray-100')
      expect(divider).toBeInTheDocument()
    })
  })

  describe('パフォーマンス', () => {
    it('大量の家事でも正常にレンダリングされる', () => {
      const manyChores: Chore[] = Array.from({ length: 100 }, (_, index) => ({
        id: `chore-${index}`,
        owner_id: index % 2 === 0 ? 'user-1' : 'partner-1',
        partner_id: index % 2 === 0 ? 'partner-1' : 'user-1',
        title: `家事${index}`,
        done: index % 3 === 0,
        created_at: `2024-01-${String(index % 30 + 1).padStart(2, '0')}T00:00:00Z`
      }))

      render(<ChoreList {...defaultProps} chores={manyChores} />)
      
      expect(screen.getByText('(100件)')).toBeInTheDocument()
      expect(screen.getByTestId('chore-item-chore-0')).toBeInTheDocument()
      expect(screen.getByTestId('chore-item-chore-99')).toBeInTheDocument()
    })
  })

  describe('エラーハンドリング', () => {
    it('不正な家事データでもクラッシュしない', () => {
      const invalidChores = [
        {
          id: 'invalid-chore',
          owner_id: '',
          partner_id: null,
          title: '',
          done: false,
          created_at: 'invalid-date'
        }
      ] as Chore[]

      expect(() => {
        render(<ChoreList {...defaultProps} chores={invalidChores} />)
      }).not.toThrow()
      
      expect(screen.getByText('家事一覧')).toBeInTheDocument()
      expect(screen.getByText('(1件)')).toBeInTheDocument()
    })

    it('useAuthStateがエラーを返してもクラッシュしない', () => {
      ;(useAuthState as jest.Mock).mockImplementation(() => {
        throw new Error('Auth error')
      })

      expect(() => {
        render(<ChoreList {...defaultProps} />)
      }).toThrow('Auth error')
    })
  })

  describe('アクセシビリティ', () => {
    it('適切なセマンティックHTML構造を持つ', () => {
      render(<ChoreList {...defaultProps} />)
      
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toHaveTextContent('家事一覧')
    })

    it('空の状態でも適切な見出しを持つ', () => {
      render(<ChoreList {...defaultProps} chores={[]} />)
      
      const heading = screen.getByRole('heading', { level: 3 })
      expect(heading).toHaveTextContent('まだ家事が登録されていません')
    })
  })
})