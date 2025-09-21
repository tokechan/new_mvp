import { test, expect } from '@playwright/test'

test.describe('感謝機能', () => {
  let testUserId: string
  let testChoreId: number

  test.beforeEach(async ({ page }) => {
    // テスト用の認証をスキップ
    await page.goto('/test-auth')
    await page.waitForLoadState('networkidle')
    
    // テスト用のchoreIdを設定
    testChoreId = 1
  })

  test.afterEach(async ({ page }) => {
    // テストデータのクリーンアップ（必要に応じて実装）
    // 現在はページリロードで十分
    await page.reload()
  })

  test('感謝メッセージを送信できる', async ({ page }) => {
    // 感謝メッセージページに移動
    await page.goto(`/thank-you?choreId=${testChoreId}`)
    
    // ページが正しく読み込まれることを確認
    await expect(page.locator('h1')).toContainText('ありがとう')
    
    // カスタムメッセージを入力
    const customMessage = 'お疲れさまでした！とても助かりました。'
    await page.fill('[data-testid="custom-message-input"]', customMessage)
    
    // 送信ボタンをクリック
    await page.click('[data-testid="send-thank-you-button"]')
    
    // 成功メッセージが表示されることを確認
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="success-message"]')).toContainText('送信しました')
  })

  test('定型メッセージを選択して送信できる', async ({ page }) => {
    // 感謝メッセージページに移動
    await page.goto(`/thank-you?choreId=${testChoreId}`)
    
    // 定型メッセージを選択
    await page.click('[data-testid="predefined-message-0"]')
    
    // 選択されたメッセージがテキストエリアに反映されることを確認
    const messageInput = page.locator('[data-testid="custom-message-input"]')
    await expect(messageInput).not.toHaveValue('')
    
    // 送信ボタンをクリック
    await page.click('[data-testid="send-thank-you-button"]')
    
    // 成功メッセージが表示されることを確認
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })

  test('空のメッセージは送信できない', async ({ page }) => {
    // 感謝メッセージページに移動
    await page.goto(`/thank-you?choreId=${testChoreId}`)
    
    // メッセージを空のまま送信ボタンをクリック
    await page.click('[data-testid="send-thank-you-button"]')
    
    // エラーメッセージが表示されることを確認
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText('メッセージを入力してください')
  })

  test('感謝履歴を表示できる', async ({ page }) => {
    // まず感謝メッセージを送信
    await page.goto(`/thank-you?choreId=${testChoreId}`)
    await page.fill('[data-testid="custom-message-input"]', 'テスト感謝メッセージ')
    await page.click('[data-testid="send-thank-you-button"]')
    
    // 感謝履歴ページに移動
    await page.goto('/thank-you/history')
    
    // 履歴が表示されることを確認
    await expect(page.locator('[data-testid="thank-you-history"]')).toBeVisible()
    await expect(page.locator('[data-testid="thank-you-message"]')).toContainText('テスト感謝メッセージ')
  })

  test('キーボードナビゲーションが機能する', async ({ page }) => {
    // 感謝メッセージページに移動
    await page.goto(`/thank-you?choreId=${testChoreId}`)
    
    // Tabキーでフォーカス移動をテスト
    await page.keyboard.press('Tab')
    await expect(page.locator('[data-testid="custom-message-input"]')).toBeFocused()
    
    await page.keyboard.press('Tab')
    await expect(page.locator('[data-testid="send-thank-you-button"]')).toBeFocused()
    
    // Enterキーで送信できることをテスト
    await page.fill('[data-testid="custom-message-input"]', 'キーボードテスト')
    await page.locator('[data-testid="send-thank-you-button"]').focus()
    await page.keyboard.press('Enter')
    
    // 成功メッセージが表示されることを確認
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible()
  })

  test('スクリーンリーダー対応のARIA属性が設定されている', async ({ page }) => {
    // 感謝メッセージページに移動
    await page.goto(`/thank-you?choreId=${testChoreId}`)
    
    // フォームにaria-labelが設定されていることを確認
    await expect(page.locator('[data-testid="custom-message-input"]')).toHaveAttribute('aria-label')
    
    // ボタンにaria-describedbyが設定されていることを確認
    await expect(page.locator('[data-testid="send-thank-you-button"]')).toHaveAttribute('aria-describedby')
    
    // エラーメッセージにrole="alert"が設定されていることを確認
    await page.click('[data-testid="send-thank-you-button"]') // 空メッセージでエラーを発生
    await expect(page.locator('[data-testid="error-message"]')).toHaveAttribute('role', 'alert')
  })

  test('レスポンシブデザインが機能する', async ({ page }) => {
    // モバイルサイズでテスト
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(`/thank-you?choreId=${testChoreId}`)
    
    // モバイルレイアウトが適用されることを確認
    const container = page.locator('[data-testid="thank-you-container"]')
    await expect(container).toBeVisible()
    
    // タブレットサイズでテスト
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(container).toBeVisible()
    
    // デスクトップサイズでテスト
    await page.setViewportSize({ width: 1024, height: 768 })
    await expect(container).toBeVisible()
  })
})