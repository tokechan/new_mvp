# 🧪 E2Eテストの修正と拡張

## 機能概要

現在失敗しているE2Eテストの修正と、新機能に対応したテストケースの追加を行う。

## 現在の問題

### テスト失敗の原因
- [ ] RLSポリシーエラーによるテスト失敗
- [ ] 認証フローの不安定性
- [ ] リアルタイム機能のテスト困難性
- [ ] テストデータの準備不備
- [ ] 非同期処理の待機不足

### テストカバレッジの不足
- [ ] パートナー連携機能のテスト
- [ ] エラーケースのテスト
- [ ] パフォーマンステスト
- [ ] セキュリティテスト

## 解決策

### Phase 1: 既存テストの修正
- [ ] 認証フローの安定化
- [ ] テストデータセットアップの改善
- [ ] 非同期処理の適切な待機
- [ ] エラーハンドリングの追加

### Phase 2: 新機能のテスト追加
- [ ] パートナー連携フローのテスト
- [ ] 感謝メッセージ機能のテスト
- [ ] リアルタイム同期のテスト
- [ ] 通知機能のテスト

### Phase 3: テスト基盤の強化
- [ ] テストユーティリティの作成
- [ ] モックデータの整備
- [ ] テスト環境の分離
- [ ] CI/CD統合の準備

## 技術的詳細

### テスト環境のセットアップ
```typescript
// tests/setup/test-setup.ts
import { test as base, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

// テスト用のSupabaseクライアント
const supabaseTest = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // サービスロールキー
);

// テストユーザーの作成
export const createTestUser = async (email: string, password: string) => {
  const { data, error } = await supabaseTest.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });
  
  if (error) throw error;
  
  // プロフィールの作成
  await supabaseTest
    .from('profiles')
    .insert({
      id: data.user.id,
      display_name: `Test User ${Date.now()}`
    });
  
  return data.user;
};

// テストデータのクリーンアップ
export const cleanupTestData = async (userId: string) => {
  // 関連データを削除
  await supabaseTest.from('thank_you_messages').delete().eq('sender_id', userId);
  await supabaseTest.from('thank_you_messages').delete().eq('receiver_id', userId);
  await supabaseTest.from('chores').delete().eq('owner_id', userId);
  await supabaseTest.from('partner_invitations').delete().eq('inviter_id', userId);
  await supabaseTest.from('partnerships').delete().eq('user1_id', userId);
  await supabaseTest.from('partnerships').delete().eq('user2_id', userId);
  await supabaseTest.from('profiles').delete().eq('id', userId);
  
  // ユーザーを削除
  await supabaseTest.auth.admin.deleteUser(userId);
};

// 拡張されたテストフィクスチャ
export const test = base.extend<{
  authenticatedPage: Page;
  testUser: { id: string; email: string; password: string };
  partnerUser: { id: string; email: string; password: string };
}>{
  testUser: async ({}, use) => {
    const email = `test-${Date.now()}@example.com`;
    const password = 'test-password-123';
    const user = await createTestUser(email, password);
    
    await use({ id: user.id, email, password });
    
    // クリーンアップ
    await cleanupTestData(user.id);
  },
  
  partnerUser: async ({}, use) => {
    const email = `partner-${Date.now()}@example.com`;
    const password = 'partner-password-123';
    const user = await createTestUser(email, password);
    
    await use({ id: user.id, email, password });
    
    // クリーンアップ
    await cleanupTestData(user.id);
  },
  
  authenticatedPage: async ({ page, testUser }, use) => {
    // ログインフロー
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');
    
    // ホームページへのリダイレクトを待機
    await page.waitForURL('/');
    await page.waitForSelector('[data-testid="chores-list"]');
    
    await use(page);
  }
});
```

### 修正された家事管理テスト
```typescript
// tests/e2e/chores-management.spec.ts
import { test, expect } from '../setup/test-setup';

test.describe('家事管理機能', () => {
  test('家事の追加と表示', async ({ authenticatedPage }) => {
    // 家事追加フォームの表示
    await authenticatedPage.click('[data-testid="add-chore-button"]');
    await expect(authenticatedPage.locator('[data-testid="chore-form"]')).toBeVisible();
    
    // 家事の追加
    const choreTitle = `テスト家事 ${Date.now()}`;
    await authenticatedPage.fill('[data-testid="chore-title-input"]', choreTitle);
    await authenticatedPage.click('[data-testid="submit-chore-button"]');
    
    // 追加された家事の確認
    await expect(authenticatedPage.locator(`text=${choreTitle}`)).toBeVisible();
    
    // フォームが閉じられることを確認
    await expect(authenticatedPage.locator('[data-testid="chore-form"]')).not.toBeVisible();
  });
  
  test('家事の完了状態切り替え', async ({ authenticatedPage }) => {
    // テスト用家事の追加
    const choreTitle = `完了テスト家事 ${Date.now()}`;
    await authenticatedPage.click('[data-testid="add-chore-button"]');
    await authenticatedPage.fill('[data-testid="chore-title-input"]', choreTitle);
    await authenticatedPage.click('[data-testid="submit-chore-button"]');
    
    // 家事アイテムの特定
    const choreItem = authenticatedPage.locator(`[data-testid="chore-item"]:has-text("${choreTitle}")`);
    await expect(choreItem).toBeVisible();
    
    // 完了状態の切り替え
    const completeButton = choreItem.locator('[data-testid="complete-chore-button"]');
    await completeButton.click();
    
    // 完了状態の確認
    await expect(choreItem.locator('[data-testid="chore-status"]')).toHaveText('完了');
    
    // 未完了に戻す
    await completeButton.click();
    await expect(choreItem.locator('[data-testid="chore-status"]')).toHaveText('未完了');
  });
  
  test('エラーハンドリング - 空のタイトル', async ({ authenticatedPage }) => {
    await authenticatedPage.click('[data-testid="add-chore-button"]');
    await authenticatedPage.click('[data-testid="submit-chore-button"]');
    
    // エラーメッセージの確認
    await expect(authenticatedPage.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(authenticatedPage.locator('[data-testid="error-message"]')).toContainText('タイトルを入力してください');
  });
});
```

### パートナー連携テスト
```typescript
// tests/e2e/partner-linking.spec.ts
import { test, expect } from '../setup/test-setup';

test.describe('パートナー連携機能', () => {
  test('パートナー招待の送信と受諾', async ({ page, testUser, partnerUser }) => {
    // 招待者としてログイン
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/');
    
    // パートナー招待の送信
    await page.click('[data-testid="invite-partner-button"]');
    await page.fill('[data-testid="partner-email-input"]', partnerUser.email);
    await page.click('[data-testid="send-invitation-button"]');
    
    // 招待リンクの取得
    const invitationLink = await page.locator('[data-testid="invitation-link"]').textContent();
    expect(invitationLink).toContain('/invite/');
    
    // 新しいページで招待受諾
    const partnerPage = await page.context().newPage();
    
    // パートナーとしてログイン
    await partnerPage.goto('/auth/login');
    await partnerPage.fill('[data-testid="email-input"]', partnerUser.email);
    await partnerPage.fill('[data-testid="password-input"]', partnerUser.password);
    await partnerPage.click('[data-testid="login-button"]');
    
    // 招待リンクにアクセス
    await partnerPage.goto(invitationLink!);
    
    // 招待内容の確認
    await expect(partnerPage.locator('[data-testid="invitation-details"]')).toBeVisible();
    await expect(partnerPage.locator('[data-testid="inviter-name"]')).toContainText(testUser.email);
    
    // 招待の受諾
    await partnerPage.click('[data-testid="accept-invitation-button"]');
    
    // 成功メッセージの確認
    await expect(partnerPage.locator('[data-testid="success-message"]')).toBeVisible();
    
    // 元のページでパートナー情報の確認
    await page.reload();
    await expect(page.locator('[data-testid="partner-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="partner-email"]')).toContainText(partnerUser.email);
  });
  
  test('無効な招待コードのエラーハンドリング', async ({ page, testUser }) => {
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', testUser.email);
    await page.fill('[data-testid="password-input"]', testUser.password);
    await page.click('[data-testid="login-button"]');
    
    // 無効な招待コードでアクセス
    await page.goto('/invite/invalid-code-123');
    
    // エラーメッセージの確認
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText('無効な招待コードです');
  });
});
```

### リアルタイム機能テスト
```typescript
// tests/e2e/realtime-sync.spec.ts
import { test, expect } from '../setup/test-setup';

test.describe('リアルタイム同期機能', () => {
  test('家事の追加がリアルタイムで同期される', async ({ page, testUser, partnerUser }) => {
    // 2つのブラウザセッションを準備
    const userPage = page;
    const partnerPage = await page.context().newPage();
    
    // 両方のユーザーでログイン
    await userPage.goto('/auth/login');
    await userPage.fill('[data-testid="email-input"]', testUser.email);
    await userPage.fill('[data-testid="password-input"]', testUser.password);
    await userPage.click('[data-testid="login-button"]');
    await userPage.waitForURL('/');
    
    await partnerPage.goto('/auth/login');
    await partnerPage.fill('[data-testid="email-input"]', partnerUser.email);
    await partnerPage.fill('[data-testid="password-input"]', partnerUser.password);
    await partnerPage.click('[data-testid="login-button"]');
    await partnerPage.waitForURL('/');
    
    // パートナー関係を事前に設定（テストセットアップで実行）
    
    // ユーザーが家事を追加
    const choreTitle = `リアルタイムテスト ${Date.now()}`;
    await userPage.click('[data-testid="add-chore-button"]');
    await userPage.fill('[data-testid="chore-title-input"]', choreTitle);
    await userPage.click('[data-testid="submit-chore-button"]');
    
    // パートナーページで新しい家事が表示されることを確認
    await expect(partnerPage.locator(`text=${choreTitle}`)).toBeVisible({ timeout: 5000 });
    
    // パートナーが家事を完了
    const choreItem = partnerPage.locator(`[data-testid="chore-item"]:has-text("${choreTitle}")`);
    await choreItem.locator('[data-testid="complete-chore-button"]').click();
    
    // ユーザーページで完了状態が同期されることを確認
    const userChoreItem = userPage.locator(`[data-testid="chore-item"]:has-text("${choreTitle}")`);
    await expect(userChoreItem.locator('[data-testid="chore-status"]')).toHaveText('完了', { timeout: 5000 });
  });
});
```

## 実装ファイル

### 修正が必要なファイル
- `tests/e2e/chores-management.spec.ts` - 既存テストの修正
- `tests/e2e/thank-you-feature.spec.ts` - 既存テストの修正
- `playwright.config.ts` - テスト設定の最適化

### 新規作成が必要なファイル
- `tests/setup/test-setup.ts` - テストセットアップユーティリティ
- `tests/e2e/partner-linking.spec.ts` - パートナー連携テスト
- `tests/e2e/realtime-sync.spec.ts` - リアルタイム同期テスト
- `tests/e2e/error-handling.spec.ts` - エラーハンドリングテスト
- `tests/utils/test-data.ts` - テストデータ管理

## テスト改善項目

### 安定性の向上
- [ ] 適切な待機処理の実装
- [ ] テストデータの分離
- [ ] 非同期処理の確実な待機
- [ ] フレーキーテストの修正

### カバレッジの拡張
- [ ] 全ての主要機能のテスト
- [ ] エラーケースのテスト
- [ ] エッジケースのテスト
- [ ] パフォーマンステスト

### 保守性の向上
- [ ] テストコードの重複排除
- [ ] 再利用可能なヘルパー関数
- [ ] 明確なテストデータ管理
- [ ] わかりやすいテスト名

## CI/CD統合

### GitHub Actions設定
```yaml
# .github/workflows/e2e-tests.yml
name: E2E Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Install Playwright
      run: npx playwright install --with-deps
    
    - name: Run E2E tests
      run: npm run test:e2e
      env:
        NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
    
    - name: Upload test results
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: playwright-report
        path: playwright-report/
```

## 依存関係

### 前提条件
- Issue #1: RLSポリシーエラーの解決
- Issue #4: パートナー連携機能の実装
- 基本的な認証機能が動作していること

### 後続タスク
- 継続的なテストメンテナンス
- パフォーマンステストの追加
- セキュリティテストの実装

## 優先度

**High** - 品質保証とリリース準備のため重要

## 見積もり

**工数**: 2-3日
**複雑度**: Medium（テスト設計、非同期処理、環境設定）

## 受け入れ基準

- [ ] 全ての既存テストが通る
- [ ] 新機能のテストが追加されている
- [ ] テストが安定して実行される
- [ ] 適切なテストカバレッジが確保されている
- [ ] CI/CD統合が動作する
- [ ] テストの実行時間が合理的である

## テスト目標

- [ ] テスト成功率: > 95%
- [ ] テスト実行時間: < 10分
- [ ] カバレッジ: 主要機能 100%
- [ ] フレーキーテスト: 0件

## ラベル

`testing`, `e2e`, `quality-assurance`, `ci-cd`, `high-priority`

---

**作成日**: 2024年12月
**担当者**: 未割り当て
**マイルストーン**: MVP リリース前