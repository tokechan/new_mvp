import { test, expect } from '@playwright/test';

/**
 * 家事管理機能のE2Eテスト
 * 家事の追加、完了、削除の一連の流れをテスト
 */
test.describe('家事管理機能', () => {
  
  /**
   * 各テスト前の準備処理
   * 認証が必要な場合はここでログイン処理を行う
   */
  test.beforeEach(async ({ page }) => {
    // ホームページにアクセス
    await page.goto('/');
    
    // 認証が必要な場合は、サインインページにリダイレクトされる
    // 現在は認証をスキップしてテストを実行
    // TODO: 実際の認証フローが完成したら、ここでログイン処理を追加
  });

  /**
   * テスト1: 家事の追加と表示
   */
  test('家事を追加して一覧に表示される', async ({ page }) => {
    // 新しい家事のタイトル
    const choreTitle = 'テスト用家事 - 掃除機をかける';
    
    // 家事追加フォームが表示されていることを確認
    await expect(page.locator('input[placeholder*="新しい家事"]')).toBeVisible();
    
    // 家事のタイトルを入力
    await page.fill('input[placeholder*="新しい家事"]', choreTitle);
    
    // 追加ボタンをクリック
    await page.click('button:has-text("追加")');
    
    // 追加された家事が一覧に表示されることを確認
    await expect(page.locator(`text=${choreTitle}`)).toBeVisible();
    
    // 家事の状態が「未完了」であることを確認（チェックボックスが空）
    const choreItem = page.locator(`text=${choreTitle}`).locator('..');
    await expect(choreItem.locator('button').first()).not.toHaveClass(/bg-green-500/);
  });

  /**
   * テスト2: 家事の完了と未完了の切り替え
   */
  test('家事を完了状態に変更し、再び未完了に戻せる', async ({ page }) => {
    const choreTitle = 'テスト用家事 - 洗濯物を干す';
    
    // 家事を追加
    await page.fill('input[placeholder*="新しい家事"]', choreTitle);
    await page.click('button:has-text("追加")');
    
    // 追加された家事が表示されるまで待機
    await expect(page.locator(`text=${choreTitle}`)).toBeVisible();
    
    // 家事の完了ボタン（チェックボックス）をクリック
    const choreItem = page.locator(`text=${choreTitle}`).locator('..');
    const completeButton = choreItem.locator('button').first();
    await completeButton.click();
    
    // 家事が完了状態になることを確認
    await expect(completeButton).toHaveClass(/bg-green-500/);
    await expect(choreItem.locator(`text=${choreTitle}`)).toHaveClass(/line-through/);
    
    // ありがとうボタンが表示されることを確認
    await expect(choreItem.locator('button:has-text("💝 ありがとう")')).toBeVisible();
    
    // 再度完了ボタンをクリックして未完了に戻す
    await completeButton.click();
    
    // 家事が未完了状態に戻ることを確認
    await expect(completeButton).not.toHaveClass(/bg-green-500/);
    await expect(choreItem.locator(`text=${choreTitle}`)).not.toHaveClass(/line-through/);
    
    // ありがとうボタンが非表示になることを確認
    await expect(choreItem.locator('button:has-text("💝 ありがとう")')).not.toBeVisible();
  });

  /**
   * テスト3: 家事の削除
   */
  test('家事を削除できる', async ({ page }) => {
    const choreTitle = 'テスト用家事 - 削除テスト';
    
    // 家事を追加
    await page.fill('input[placeholder*="新しい家事"]', choreTitle);
    await page.click('button:has-text("追加")');
    
    // 追加された家事が表示されるまで待機
    await expect(page.locator(`text=${choreTitle}`)).toBeVisible();
    
    // 削除ボタンをクリック
    const choreItem = page.locator(`text=${choreTitle}`).locator('..');
    await choreItem.locator('button:has-text("削除")').click();
    
    // 家事が一覧から削除されることを確認
    await expect(page.locator(`text=${choreTitle}`)).not.toBeVisible();
  });

  /**
   * テスト4: 複数の家事を管理
   */
  test('複数の家事を同時に管理できる', async ({ page }) => {
    const chores = [
      'テスト用家事1 - 食器洗い',
      'テスト用家事2 - ゴミ出し',
      'テスト用家事3 - 風呂掃除'
    ];
    
    // 複数の家事を追加
    for (const chore of chores) {
      await page.fill('input[placeholder*="新しい家事"]', chore);
      await page.click('button:has-text("追加")');
      await expect(page.locator(`text=${chore}`)).toBeVisible();
    }
    
    // すべての家事が表示されていることを確認
    for (const chore of chores) {
      await expect(page.locator(`text=${chore}`)).toBeVisible();
    }
    
    // 最初の家事を完了状態にする
    const firstChoreItem = page.locator(`text=${chores[0]}`).locator('..');
    await firstChoreItem.locator('button').first().click();
    
    // 最初の家事のみが完了状態になることを確認
    await expect(firstChoreItem.locator('button').first()).toHaveClass(/bg-green-500/);
    
    // 他の家事は未完了状態のままであることを確認
    for (let i = 1; i < chores.length; i++) {
      const choreItem = page.locator(`text=${chores[i]}`).locator('..');
      await expect(choreItem.locator('button').first()).not.toHaveClass(/bg-green-500/);
    }
  });
});