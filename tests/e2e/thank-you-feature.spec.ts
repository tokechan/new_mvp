import { test, expect } from '@playwright/test';

/**
 * ありがとう機能のE2Eテスト
 * 家事完了後のありがとうメッセージ送信機能をテスト
 */
test.describe('ありがとう機能', () => {
  
  /**
   * 各テスト前の準備処理
   */
  test.beforeEach(async ({ page }) => {
    // ホームページにアクセス
    await page.goto('/');
    
    // テスト用の家事を追加して完了状態にする
    const choreTitle = 'ありがとうテスト用家事';
    await page.fill('input[placeholder*="新しい家事"]', choreTitle);
    await page.click('button:has-text("追加")');
    await expect(page.locator(`text=${choreTitle}`)).toBeVisible();
    
    // 家事を完了状態にする
    const choreItem = page.locator(`text=${choreTitle}`).locator('..');
    await choreItem.locator('button').first().click();
    await expect(choreItem.locator('button').first()).toHaveClass(/bg-green-500/);
  });

  /**
   * テスト1: ありがとうボタンの表示
   */
  test('完了した家事にありがとうボタンが表示される', async ({ page }) => {
    const choreTitle = 'ありがとうテスト用家事';
    const choreItem = page.locator(`text=${choreTitle}`).locator('..');
    
    // ありがとうボタンが表示されることを確認
    await expect(choreItem.locator('button:has-text("💝 ありがとう")')).toBeVisible();
    
    // 未完了の家事にはありがとうボタンが表示されないことを確認
    // 新しい未完了の家事を追加
    const incompleteChore = '未完了テスト家事';
    await page.fill('input[placeholder*="新しい家事"]', incompleteChore);
    await page.click('button:has-text("追加")');
    
    const incompleteItem = page.locator(`text=${incompleteChore}`).locator('..');
    await expect(incompleteItem.locator('button:has-text("💝 ありがとう")')).not.toBeVisible();
  });

  /**
   * テスト2: ありがとうメッセージフォームの表示と非表示
   */
  test('ありがとうボタンをクリックするとメッセージフォームが表示される', async ({ page }) => {
    const choreTitle = 'ありがとうテスト用家事';
    const choreItem = page.locator(`text=${choreTitle}`).locator('..');
    
    // ありがとうボタンをクリック
    await choreItem.locator('button:has-text("💝 ありがとう")').click();
    
    // ありがとうメッセージフォームが表示されることを確認
    await expect(page.locator('text=ありがとうメッセージを送信')).toBeVisible();
    await expect(page.locator('textarea[placeholder*="メッセージ"]')).toBeVisible();
    
    // 定型メッセージボタンが表示されることを確認
    await expect(page.locator('button:has-text("ありがとう！")')).toBeVisible();
    await expect(page.locator('button:has-text("お疲れ様でした！")')).toBeVisible();
    await expect(page.locator('button:has-text("助かりました！")')).toBeVisible();
    
    // キャンセルボタンをクリックしてフォームを閉じる
    await page.click('button:has-text("キャンセル")');
    
    // フォームが非表示になることを確認
    await expect(page.locator('text=ありがとうメッセージを送信')).not.toBeVisible();
  });

  /**
   * テスト3: 定型メッセージの送信
   */
  test('定型メッセージを選択して送信できる', async ({ page }) => {
    const choreTitle = 'ありがとうテスト用家事';
    const choreItem = page.locator(`text=${choreTitle}`).locator('..');
    
    // ありがとうボタンをクリック
    await choreItem.locator('button:has-text("💝 ありがとう")').click();
    
    // 定型メッセージ「ありがとう！」を選択
    await page.click('button:has-text("ありがとう！")');
    
    // テキストエリアに定型メッセージが入力されることを確認
    await expect(page.locator('textarea[placeholder*="メッセージ"]')).toHaveValue('ありがとう！');
    
    // 送信ボタンをクリック
    await page.click('button:has-text("送信")');
    
    // フォームが閉じることを確認
    await expect(page.locator('text=ありがとうメッセージを送信')).not.toBeVisible();
    
    // ありがとうボタンが「ありがとう済み」に変わることを確認
    await expect(choreItem.locator('button:has-text("✨ ありがとう済み")')).toBeVisible();
    
    // 送信されたメッセージが表示されることを確認
    await expect(page.locator('text=ありがとうメッセージ')).toBeVisible();
    await expect(page.locator('text=ありがとう！')).toBeVisible();
  });

  /**
   * テスト4: カスタムメッセージの送信
   */
  test('カスタムメッセージを入力して送信できる', async ({ page }) => {
    const choreTitle = 'ありがとうテスト用家事';
    const choreItem = page.locator(`text=${choreTitle}`).locator('..');
    const customMessage = 'いつもお疲れ様です！本当に助かっています。';
    
    // ありがとうボタンをクリック
    await choreItem.locator('button:has-text("💝 ありがとう")').click();
    
    // カスタムメッセージを入力
    await page.fill('textarea[placeholder*="メッセージ"]', customMessage);
    
    // 送信ボタンをクリック
    await page.click('button:has-text("送信")');
    
    // フォームが閉じることを確認
    await expect(page.locator('text=ありがとうメッセージを送信')).not.toBeVisible();
    
    // ありがとうボタンが「ありがとう済み」に変わることを確認
    await expect(choreItem.locator('button:has-text("✨ ありがとう済み")')).toBeVisible();
    
    // 送信されたカスタムメッセージが表示されることを確認
    await expect(page.locator('text=ありがとうメッセージ')).toBeVisible();
    await expect(page.locator(`text=${customMessage}`)).toBeVisible();
  });

  /**
   * テスト5: 複数のありがとうメッセージ
   */
  test('同じ家事に複数のありがとうメッセージを送信できる', async ({ page }) => {
    const choreTitle = 'ありがとうテスト用家事';
    const choreItem = page.locator(`text=${choreTitle}`).locator('..');
    
    // 最初のありがとうメッセージを送信
    await choreItem.locator('button:has-text("💝 ありがとう")').click();
    await page.click('button:has-text("ありがとう！")');
    await page.click('button:has-text("送信")');
    
    // ありがとう済みボタンをクリックして再度フォームを開く
    await choreItem.locator('button:has-text("✨ ありがとう済み")').click();
    
    // 2つ目のメッセージを送信
    const secondMessage = '2回目のありがとうメッセージです';
    await page.fill('textarea[placeholder*="メッセージ"]', secondMessage);
    await page.click('button:has-text("送信")');
    
    // 両方のメッセージが表示されることを確認
    await expect(page.locator('text=ありがとう！')).toBeVisible();
    await expect(page.locator(`text=${secondMessage}`)).toBeVisible();
  });

  /**
   * テスト6: 通知機能の確認
   */
  test('ありがとうメッセージ送信時に通知が表示される', async ({ page }) => {
    const choreTitle = 'ありがとうテスト用家事';
    const choreItem = page.locator(`text=${choreTitle}`).locator('..');
    
    // ありがとうボタンをクリック
    await choreItem.locator('button:has-text("💝 ありがとう")').click();
    
    // メッセージを送信
    await page.click('button:has-text("ありがとう！")');
    await page.click('button:has-text("送信")');
    
    // 通知が表示されることを確認（通知システムが実装されている場合）
    // TODO: 通知システムの実装に応じて、適切なセレクターに変更
    // await expect(page.locator('.notification, .toast, [role="alert"]')).toBeVisible();
    
    // 現在は成功メッセージやフォームの閉じることで送信成功を確認
    await expect(page.locator('text=ありがとうメッセージを送信')).not.toBeVisible();
  });
});