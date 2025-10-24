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
    // ダイアログハンドラーを最初に設定（confirm()ダイアログを自動承認）
    page.on('dialog', async dialog => {
      console.log('Dialog message:', dialog.message());
      await dialog.accept();
    });
    
    // ホームページにアクセス
    await page.goto('/');
    
    // ページが完全に読み込まれるまで待機
    await page.waitForLoadState('networkidle');
    
    // 認証状態を確認し、必要に応じてログイン（環境変数で資格情報を指定可能）
    const isSignInPage = await page.locator('text=サインイン').isVisible();
    if (isSignInPage) {
      const email = process.env.E2E_EMAIL || 'test@example.com';
      const password = process.env.E2E_PASSWORD || 'test12345!';

      // サインイン試行
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      const signInButton = page.locator('button:has-text("サインイン")');
      if (await signInButton.count()) {
        await signInButton.click();
      }
      await page.waitForLoadState('networkidle');

      // まだサインイン画面ならサインアップを試行（アカウント未作成ケース）
      const stillSignIn = await page.locator('text=アカウントにサインイン').isVisible();
      if (stillSignIn) {
        // サインアップページへ遷移
        const toSignupLink = page.locator('text=新しいアカウントを作成');
        if (await toSignupLink.count()) {
          await toSignupLink.click();
          await page.waitForLoadState('networkidle');

          // サインアップ入力
          await page.fill('input[type="email"]', email);
          await page.fill('input[type="password"]', password);
          const signUpButton = page.locator('button:has-text("サインアップ")');
          if (await signUpButton.count()) {
            await signUpButton.click();
          } else {
            // 表記ゆれ対策
            const registerButton = page.locator('button:has-text("登録")');
            if (await registerButton.count()) {
              await registerButton.click();
            }
          }
          await page.waitForLoadState('networkidle');

          // ホームへ戻る
          await page.goto('/');
          await page.waitForLoadState('networkidle');
        }
      }
    }
    
    // 既存の家事をすべて削除してクリーンな状態にする
    const deleteButtons = page.locator('button[aria-label="削除"]');
    const deleteCount = await deleteButtons.count();
    
    // 最大20個まで削除（無限ループ防止）
    for (let i = 0; i < Math.min(deleteCount, 20); i++) {
      const remainingButtons = page.locator('button[aria-label="削除"]');
      const currentCount = await remainingButtons.count();
      
      if (currentCount === 0) break;
      
      // 最初の削除ボタンをクリック
      const firstDeleteButton = remainingButtons.first();
      await firstDeleteButton.click();
      
      // 削除処理の完了を待機
      await page.waitForTimeout(1000);
    }
    
    // 家事追加フォームが表示されるまで待機（ページ読み込み完了の指標として使用）
    await expect(page.locator('input[placeholder*="新しい家事を入力"]')).toBeVisible({ timeout: 10000 });
   });

  /**
   * テスト1: 家事の追加と表示
   */
  test('家事を追加して一覧に表示される', async ({ page }) => {
    // 新しい家事のタイトル
    const choreTitle = 'テスト用家事 - 掃除機をかける';
    
    // 家事追加フォームが表示されていることを確認
    await expect(page.locator('input[placeholder*="新しい家事を入力"]')).toBeVisible();
    
    // 家事のタイトルを入力
    await page.fill('input[placeholder*="新しい家事を入力"]', choreTitle);
    
    // 追加ボタンをクリック
    await page.click('button:has-text("追加")');
    
    // 追加処理の完了を待機
    await expect(page.locator('button:has-text("追加中...")')).not.toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // 追加された家事が一覧に表示されることを確認
    const card = page.getByText(choreTitle).locator('..').locator('..');
    await expect(card.getByRole('button', { name: '完了する' })).toBeVisible({ timeout: 10000 });
    
    // 家事の状態が「未完了」であることを確認（完了ボタンが青系）
    const completeButton = card.getByRole('button', { name: '完了する' });
    await expect(completeButton).toHaveClass(/bg-primary\/10/);
  });

  /**
   * テスト2: 家事の完了と未完了の切り替え
   */
  test('家事を完了状態に変更し、再び未完了に戻せる', async ({ page }) => {
    const choreTitle = 'テスト用家事 - 洗濯物を干す';
    
    // 家事を追加
    await page.fill('input[placeholder*="新しい家事を入力"]', choreTitle);
    await page.click('button:has-text("追加")');
    
    // 追加処理が完全に完了するまで待機
    await expect(page.locator('button:has-text("追加中...")')).not.toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // 追加された家事が表示されることを確認
    const card = page.getByText(choreTitle).locator('..').locator('..');
    await expect(card.getByRole('button', { name: '完了する' })).toBeVisible({ timeout: 10000 });
    
    // 家事の完了ボタンをクリック
    const completeButton = card.getByRole('button', { name: '完了する' });
    await completeButton.click();
    
    // 完了モーダルで「完了」を押下
    await page.getByRole('button', { name: '完了' }).click();
    
    // 家事が完了状態になることを確認（少し待機）
    await page.waitForTimeout(1000);
    const completedButton = card.getByRole('button', { name: '未完了に戻す' });
    await expect(completedButton).toBeVisible({ timeout: 5000 });
    await expect(completedButton).toHaveClass(/bg-success\/10/);
    
    // 再度クリックして未完了に戻す
    await completedButton.click();
    
    // 家事が未完了状態に戻ることを確認（少し待機）
    await page.waitForTimeout(1000);
    const newCompleteButton = card.getByRole('button', { name: '完了する' });
    await expect(newCompleteButton).toBeVisible({ timeout: 5000 });
    await expect(newCompleteButton).toHaveClass(/bg-primary\/10/);
  });

  /**
   * テスト3: 家事の削除
   */
  test('家事を削除できる', async ({ page }) => {
    const choreTitle = 'テスト用家事 - 削除テスト';
    
    // 家事を追加
    await page.fill('input[placeholder*="新しい家事を入力"]', choreTitle);
    await page.click('button:has-text("追加")');
    
    // 追加処理が完全に完了するまで待機
    await expect(page.locator(`text=${choreTitle}`)).toBeVisible({ timeout: 10000 });
    await expect(page.locator('button:has-text("追加中...")')).not.toBeVisible({ timeout: 10000 });
    await page.waitForTimeout(2000); // 追加処理の完了を確実に待機
    
    // カード内の削除ボタンをクリック
    const card = page.getByText(choreTitle).locator('..').locator('..');
    await card.getByRole('button', { name: '削除' }).click();
    
    // 家事が削除されたことを確認
    await expect(page.locator(`text=${choreTitle}`)).not.toBeVisible();
  });

  /**
   * テスト4: 複数の家事を同時に管理できる
   */
  test('複数の家事を同時に管理できる', async ({ page }) => {
    const chores = [
      'テスト用家事1 - 食器洗い',
      'テスト用家事2 - ゴミ出し',
      'テスト用家事3 - 風呂掃除'
    ];
    
    // 複数の家事を追加
    for (const chore of chores) {
      await page.fill('input[placeholder*="新しい家事を入力"]', chore);
      await page.click('button:has-text("追加")');
      await expect(page.locator('button:has-text("追加中...")')).not.toBeVisible({ timeout: 10000 });
      await page.waitForTimeout(1000);
      const card = page.getByText(chore).locator('..').locator('..');
      await expect(card.getByRole('button', { name: '完了する' })).toBeVisible({ timeout: 10000 });
    }
    
    // すべての家事が表示されていることを確認
    for (const chore of chores) {
      const card = page.getByText(chore).locator('..').locator('..');
      await expect(card.getByRole('button', { name: '完了する' })).toBeVisible();
    }
    
    // 最初の家事を完了状態にする
    const firstCard = page.getByText(chores[0]).locator('..').locator('..');
    const firstCompleteButton = firstCard.getByRole('button', { name: '完了する' });
    await firstCompleteButton.click();
    await page.getByRole('button', { name: '完了' }).click();
    
    // 最初の家事のみが完了状態になることを確認（少し待機）
    await page.waitForTimeout(1000);
    const firstCompletedButton = firstCard.getByRole('button', { name: '未完了に戻す' });
    await expect(firstCompletedButton).toBeVisible({ timeout: 5000 });
    await expect(firstCompletedButton).toHaveClass(/bg-success\/10/);
    
    // 他の家事は未完了状態のままであることを確認
    for (let i = 1; i < chores.length; i++) {
      const card = page.getByText(chores[i]).locator('..').locator('..');
      const choreCompleteButton = card.getByRole('button', { name: '完了する' });
      await expect(choreCompleteButton).toBeVisible();
      await expect(choreCompleteButton).toHaveClass(/bg-primary\/10/);
    }
  });
});