# テスト戦略とガイドライン

## 概要

本ドキュメントは、夫婦/カップル向け家事管理アプリのテスト戦略とガイドラインを定義します。品質保証、リグレッション防止、継続的な改善を目的とした包括的なテスト戦略を提供します。

## テスト戦略の基本方針

### テストピラミッド

```
     E2E Tests (少数)
    ┌─────────────────┐
   │  統合テスト (中程度)  │
  ┌─────────────────────┐
 │   ユニットテスト (多数)   │
 └─────────────────────┘
```

- **ユニットテスト (70%)**: 個別の関数・コンポーネントの動作検証
- **統合テスト (20%)**: API、データベース、外部サービスとの連携検証
- **E2Eテスト (10%)**: ユーザーの主要な操作フローの検証

### 品質目標

- **コードカバレッジ**: 80%以上（重要な機能は90%以上）
- **テスト実行時間**: ユニットテスト < 30秒、統合テスト < 2分、E2E < 5分
- **テスト成功率**: 95%以上（CI/CD環境）
- **リグレッション検出**: 24時間以内

## 1. ユニットテスト戦略

### 対象範囲

- **Reactコンポーネント**: 表示ロジック、イベントハンドリング
- **カスタムフック**: 状態管理、副作用の処理
- **ユーティリティ関数**: データ変換、バリデーション
- **ビジネスロジック**: 計算処理、条件分岐

### テストツール

- **フレームワーク**: Jest + React Testing Library
- **モック**: Jest mocks, MSW (API モック)
- **アサーション**: Jest matchers + @testing-library/jest-dom

### ガイドライン

#### コンポーネントテスト

```typescript
/**
 * コンポーネントテストの基本パターン
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { ChoreItem } from '@/components/ChoreItem'

describe('ChoreItem', () => {
  const mockChore = {
    id: 1,
    title: 'テスト家事',
    done: false,
    owner_id: 'user-1'
  }

  it('家事のタイトルが表示される', () => {
    render(<ChoreItem chore={mockChore} onToggle={jest.fn()} />)
    expect(screen.getByText('テスト家事')).toBeInTheDocument()
  })

  it('完了ボタンをクリックするとonToggleが呼ばれる', () => {
    const mockOnToggle = jest.fn()
    render(<ChoreItem chore={mockChore} onToggle={mockOnToggle} />)
    
    fireEvent.click(screen.getByRole('button', { name: /完了/ }))
    expect(mockOnToggle).toHaveBeenCalledWith(1)
  })
})
```

#### カスタムフックテスト

```typescript
/**
 * カスタムフックテストの基本パターン
 */
import { renderHook, act } from '@testing-library/react'
import { useChores } from '@/hooks/useChores'

describe('useChores', () => {
  it('初期状態では空の配列を返す', () => {
    const { result } = renderHook(() => useChores())
    expect(result.current.chores).toEqual([])
    expect(result.current.loading).toBe(true)
  })

  it('家事を追加できる', async () => {
    const { result } = renderHook(() => useChores())
    
    await act(async () => {
      await result.current.addChore('新しい家事')
    })
    
    expect(result.current.chores).toHaveLength(1)
    expect(result.current.chores[0].title).toBe('新しい家事')
  })
})
```

### 命名規則

- **ファイル名**: `ComponentName.test.tsx`, `hookName.test.ts`
- **テストケース**: 「何をテストするか」を日本語で明確に記述
- **モック**: `mock` プレフィックスを使用

## 2. 統合テスト戦略

### 対象範囲

- **Supabase連携**: 認証、データベース操作、RLSポリシー
- **API エンドポイント**: レスポンス形式、エラーハンドリング
- **外部サービス**: 通知、ファイルアップロード

### テスト環境

- **データベース**: Supabase テスト環境（専用プロジェクト）
- **認証**: テスト用ユーザーアカウント
- **データ**: テスト実行前後でクリーンアップ

### ガイドライン

#### データベーステスト

```typescript
/**
 * Supabase統合テストの基本パターン
 */
import { createSupabaseBrowserClient } from '@/lib/supabase'

describe('Chores API Integration', () => {
  let supabase: ReturnType<typeof createSupabaseBrowserClient>
  let testUserId: string

  beforeAll(async () => {
    supabase = createSupabaseBrowserClient()
    // テストユーザーの作成
    testUserId = await createTestUser()
  })

  afterAll(async () => {
    // テストデータのクリーンアップ
    await cleanupTestData(testUserId)
  })

  it('家事を作成できる', async () => {
    const { data, error } = await supabase
      .from('chores')
      .insert({
        title: 'テスト家事',
        owner_id: testUserId
      })
      .select()
      .single()

    expect(error).toBeNull()
    expect(data.title).toBe('テスト家事')
    expect(data.owner_id).toBe(testUserId)
  })
})
```

## 3. E2Eテスト戦略

### 対象範囲

- **主要ユーザーフロー**: 登録→家事追加→完了→通知
- **認証フロー**: ログイン、ログアウト、セッション管理
- **レスポンシブ対応**: モバイル、タブレット、デスクトップ
- **ブラウザ互換性**: Chrome, Firefox, Safari

### テストツール

- **フレームワーク**: Playwright
- **ブラウザ**: Chromium, Firefox, WebKit
- **レポート**: HTML レポート、スクリーンショット、動画

### ガイドライン

#### 主要フローテスト

```typescript
/**
 * E2Eテストの基本パターン
 */
import { test, expect } from '@playwright/test'

test.describe('家事管理フロー', () => {
  test('家事の追加から完了までの一連の流れ', async ({ page }) => {
    // 1. ログイン
    await page.goto('/login')
    await page.fill('[data-testid="email"]', 'test@example.com')
    await page.click('[data-testid="login-button"]')
    
    // 2. 家事追加
    await page.goto('/')
    await page.fill('[data-testid="chore-input"]', '洗濯物を干す')
    await page.click('[data-testid="add-chore-button"]')
    
    // 3. 家事が表示されることを確認
    await expect(page.locator('text=洗濯物を干す')).toBeVisible()
    
    // 4. 家事を完了
    await page.click('[data-testid="complete-chore-button"]')
    
    // 5. 完了状態の確認
    await expect(page.locator('[data-testid="chore-completed"]')).toBeVisible()
  })
})
```

### Page Object Model

```typescript
/**
 * Page Object Modelの実装例
 */
export class ChoresPage {
  constructor(private page: Page) {}

  async addChore(title: string) {
    await this.page.fill('[data-testid="chore-input"]', title)
    await this.page.click('[data-testid="add-chore-button"]')
  }

  async completeChore(title: string) {
    const choreItem = this.page.locator(`text=${title}`).locator('..')
    await choreItem.locator('[data-testid="complete-button"]').click()
  }

  async expectChoreVisible(title: string) {
    await expect(this.page.locator(`text=${title}`)).toBeVisible()
  }
}
```

## 4. テストデータ管理戦略

### データ戦略

- **ユニットテスト**: モックデータ、ファクトリーパターン
- **統合テスト**: テスト専用データベース、自動クリーンアップ
- **E2Eテスト**: シードデータ、テスト後リセット

### ファクトリーパターン

```typescript
/**
 * テストデータファクトリー
 */
export const ChoreFactory = {
  build: (overrides: Partial<Chore> = {}): Chore => ({
    id: Math.floor(Math.random() * 1000),
    title: 'デフォルト家事',
    done: false,
    owner_id: 'default-user',
    created_at: new Date().toISOString(),
    ...overrides
  }),

  buildMany: (count: number, overrides: Partial<Chore> = {}): Chore[] => {
    return Array.from({ length: count }, (_, i) => 
      ChoreFactory.build({ ...overrides, id: i + 1 })
    )
  }
}
```

### データクリーンアップ

```typescript
/**
 * テストデータクリーンアップユーティリティ
 */
export class TestDataManager {
  private createdIds: { table: string; id: any }[] = []

  async createChore(data: Partial<Chore>): Promise<Chore> {
    const { data: chore, error } = await supabase
      .from('chores')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    
    this.createdIds.push({ table: 'chores', id: chore.id })
    return chore
  }

  async cleanup(): Promise<void> {
    for (const { table, id } of this.createdIds.reverse()) {
      await supabase.from(table).delete().eq('id', id)
    }
    this.createdIds = []
  }
}
```

## 5. CI/CDパイプラインでのテスト実行

### GitHub Actions設定

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:coverage
      
      - name: Upload coverage to Codecov
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    env:
      NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_TEST_URL }}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_TEST_ANON_KEY }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:integration

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### テスト実行戦略

- **プルリクエスト**: ユニットテスト + 統合テスト
- **メインブランチ**: 全テストスイート実行
- **夜間実行**: 包括的なE2Eテスト + パフォーマンステスト
- **リリース前**: 全ブラウザでのE2Eテスト

## 6. テスト品質の監視と改善

### メトリクス

- **コードカバレッジ**: 行カバレッジ、分岐カバレッジ
- **テスト実行時間**: 各テストスイートの実行時間
- **フレイキーテスト**: 不安定なテストの特定と修正
- **テスト成功率**: CI/CD環境での成功率

### 継続的改善

- **週次レビュー**: テストメトリクスの確認
- **月次改善**: フレイキーテストの修正、テスト追加
- **四半期評価**: テスト戦略の見直し

## 7. ベストプラクティス

### 一般的なガイドライン

1. **テストは独立性を保つ**: 他のテストに依存しない
2. **明確な命名**: テストの目的が分かる名前を付ける
3. **AAA パターン**: Arrange, Act, Assert の構造を守る
4. **適切なアサーション**: 必要最小限で明確な検証
5. **モックの適切な使用**: 外部依存を適切に分離

### アンチパターン

- **過度なモック**: 実装詳細に依存したテスト
- **巨大なテスト**: 複数の責務を持つテスト
- **フレイキーテスト**: 不安定で信頼性の低いテスト
- **テストのためのコード**: テスト専用の実装

## 8. トラブルシューティング

### よくある問題と解決策

#### テストが不安定

```typescript
// 悪い例: タイミングに依存
test('データが読み込まれる', async () => {
  render(<ChoresList />)
  await new Promise(resolve => setTimeout(resolve, 1000)) // 固定待機
  expect(screen.getByText('家事一覧')).toBeInTheDocument()
})

// 良い例: 条件待ち
test('データが読み込まれる', async () => {
  render(<ChoresList />)
  await waitFor(() => {
    expect(screen.getByText('家事一覧')).toBeInTheDocument()
  })
})
```

#### モックが効かない

```typescript
// モックの設定を beforeEach で行う
beforeEach(() => {
  jest.clearAllMocks()
  
  // Supabase クライアントのモック
  jest.mocked(createSupabaseBrowserClient).mockReturnValue({
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ data: [], error: null })
    })
  } as any)
})
```

## 9. 今後の拡張計画

### Phase 1: 基盤整備（現在）
- ユニットテストの充実
- 統合テストの安定化
- E2Eテストの主要フロー対応

### Phase 2: 品質向上
- ビジュアルリグレッションテスト
- パフォーマンステスト
- アクセシビリティテスト

### Phase 3: 高度な自動化
- 自動テスト生成
- AI を活用したテストケース提案
- 動的テスト実行最適化

## まとめ

本テスト戦略により、以下を実現します：

- **品質保証**: バグの早期発見と修正
- **開発効率**: 安心してリファクタリングできる環境
- **継続的改善**: メトリクスに基づく改善サイクル
- **チーム協力**: 明確なガイドラインによる一貫性

テストは品質の要であり、ユーザーに価値を提供するための重要な投資です。このガイドラインに従って、堅牢で保守性の高いアプリケーションを構築していきましょう。