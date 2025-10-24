import { test, expect } from '@playwright/test';

/**
 * ありがとう機能のE2Eテスト（Completed Chores + ThankYouModal）
 * 完了した家事からアイコンを選択してモーダルでメッセージを送る流れをテスト
 */
test.describe('ありがとう機能（Completed Chores）', () => {
  const choreTitle = 'ありがとうテスト用家事';

  /**
   * 各テスト前の準備処理
   * - 認証（必要ならサインイン/サインアップ）
   * - 既存家事の削除でクリーン状態にする
   * - ホームで家事を追加し、完了モーダルから完了
   * - Completed Choresページへ移動して対象の家事のカードを表示
   */
  test.beforeEach(async ({ page }) => {
    // confirm()ダイアログなどが出た場合は自動承認
    page.on('dialog', async dialog => {
      await dialog.accept();
    });

    // ホームページにアクセス
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 認証が必要ならサインイン → 未作成ならサインアップ
    const isSignInPage = await page.locator('text=アカウントにサインイン').isVisible();
    if (isSignInPage) {
      const email = process.env.E2E_EMAIL || 'test@example.com';
      const password = process.env.E2E_PASSWORD || 'test12345!';

      // サインイン
      await page.fill('input[type="email"]', email);
      await page.fill('input[type="password"]', password);
      const signInButton = page.locator('button:has-text("サインイン")');
      if (await signInButton.count()) {
        await signInButton.click();
        await page.waitForLoadState('networkidle');
      }

      // まだサインイン画面ならサインアップを試行
      const stillSignIn = await page.locator('text=アカウントにサインイン').isVisible();
      if (stillSignIn) {
        const toSignupLink = page.locator('text=新しいアカウントを作成');
        if (await toSignupLink.count()) {
          await toSignupLink.click();
          await page.waitForLoadState('networkidle');

          await page.fill('input[type="email"]', email);
          await page.fill('input[type="password"]', password);
          const signUpButton = page.locator('button:has-text("サインアップ")');
          if (await signUpButton.count()) {
            await signUpButton.click();
          } else {
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

    // クリーンな状態にするため、既存の家事を削除
    // 最大20件まで削除（安全のため）
    for (let i = 0; i < 20; i++) {
      const deleteButtons = page.locator('button[aria-label="削除"]');
      const count = await deleteButtons.count();
      if (count === 0) break;
      await deleteButtons.first().click();
      await page.waitForTimeout(500);
    }

    // 「追加」ボタンを含むフォームにスコープして入力
    const addForm = page.locator('form').filter({ has: page.locator('button:has-text("追加")') });
    await expect(addForm.locator('input[placeholder*="新しい家事を入力"]')).toBeVisible({ timeout: 10000 });

    // テスト用の家事を追加（フォーム内の入力に対して）
    await addForm.locator('input[placeholder*="新しい家事を入力"]').fill(choreTitle);
    await addForm.locator('button:has-text("追加")').click();

    // 追加処理の完了を待機
    await expect(page.locator('button:has-text("追加中...")')).not.toBeVisible({ timeout: 10000 });
    await expect(page.getByText(choreTitle)).toBeVisible({ timeout: 10000 });

    // 家事を完了状態にする（モーダルで「完了」を押下）
    const choreItem = page.getByText(choreTitle).locator('..').locator('..');
    await choreItem.getByRole('button', { name: '完了する' }).click();
    await page.getByRole('button', { name: '完了' }).click();

    // 完了ボタンのスタイル（緑系）に変わることを確認
    await expect(choreItem.getByRole('button', { name: '未完了に戻す' })).toHaveClass(/bg-green-50/);

    // Completed Choresページに移動
    await page.goto('/completed-chores');

    // ページ見出しと家事タイトルの表示確認
    await expect(page.getByRole('heading', { name: '完了した家事' })).toBeVisible();
    await expect(page.getByRole('heading', { name: choreTitle })).toBeVisible();
  });

  /**
   * テスト1: アイコンボタンの表示とモーダルの開閉
   */
  test('アイコンボタンが表示され、モーダルを開閉できる', async ({ page }) => {
    // 対象家事カードにスコープ
    const card = page.getByRole('heading', { name: choreTitle }).locator('..').locator('..');

    // アイコンボタンの一例（お疲れさま）が表示されること
    await expect(card.getByRole('button', { name: 'お疲れさま' })).toBeVisible();

    // クリックでモーダルが開き、入力欄が見えること
    await card.getByRole('button', { name: 'お疲れさま' }).click();
    await expect(page.getByText('メッセージを送る')).toBeVisible();
    await expect(page.locator('textarea#thank-you-message')).toBeVisible();

    // キャンセルで閉じること
    await page.getByRole('button', { name: 'キャンセル' }).click();
    await expect(page.getByText('メッセージを送る')).not.toBeVisible();
  });

  /**
   * テスト2: カスタムメッセージ送信でモーダルが閉じる（送信ボタン有効化と無効化）
   */
  test('カスタムメッセージを入力して送信（モーダルが閉じる）', async ({ page }) => {
    const card = page.getByRole('heading', { name: choreTitle }).locator('..').locator('..');

    await card.getByRole('button', { name: 'すごい' }).click();
    const input = page.locator('textarea#thank-you-message');

    // 入力前は送信ボタンが無効
    await expect(page.getByRole('button', { name: '送信' })).toBeDisabled();

    // 入力後に送信ボタンが有効化される
    await input.fill('テストのありがとうメッセージです。');
    await expect(page.getByRole('button', { name: '送信' })).toBeEnabled();

    // 送信でモーダルが閉じる（送信先ユーザー未設定でもUIは閉じる）
    await page.getByRole('button', { name: '送信' }).click();
    await expect(page.getByText('メッセージを送る')).not.toBeVisible();
  });

  /**
   * テスト3: 同じ家事に複数回メッセージを送れる（毎回モーダルが閉じる）
   */
  test('複数回メッセージを送信できる（毎回モーダルが閉じる）', async ({ page }) => {
    const card = page.getByRole('heading', { name: choreTitle }).locator('..').locator('..');

    // 1回目
    await card.getByRole('button', { name: 'いいね' }).click();
    await page.locator('textarea#thank-you-message').fill('1回目のありがとう');
    await page.getByRole('button', { name: '送信' }).click();
    await expect(page.getByText('メッセージを送る')).not.toBeVisible();

    // 2回目
    await card.getByRole('button', { name: '嬉しい' }).click();
    await page.locator('textarea#thank-you-message').fill('2回目のありがとう');
    await page.getByRole('button', { name: '送信' }).click();
    await expect(page.getByText('メッセージを送る')).not.toBeVisible();
  });

  /**
   * テスト4: 文字数カウンターが入力に応じて更新される
   */
  test('文字数カウンターが入力に応じて更新される', async ({ page }) => {
    const card = page.getByRole('heading', { name: choreTitle }).locator('..').locator('..');

    await card.getByRole('button', { name: '愛してる' }).click();
    const input = page.locator('textarea#thank-you-message');

    await input.fill('abc');
    await expect(page.locator('text=/\b3\/200\b/')).toBeVisible();

    // キャンセルで閉じる
    await page.getByRole('button', { name: 'キャンセル' }).click();
    await expect(page.getByText('メッセージを送る')).not.toBeVisible();
  });
});