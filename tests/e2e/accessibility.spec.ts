import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * アクセシビリティテスト
 * WCAG 2.1 AA基準への準拠を確認
 */
test.describe('アクセシビリティテスト', () => {
  test.beforeEach(async ({ page }) => {
    // テスト用の認証をスキップ
    await page.goto('/test-auth');
    await page.waitForLoadState('networkidle');
  });

  test('ホームページのアクセシビリティ', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // axe-coreを使用したアクセシビリティチェック
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('サインインページのアクセシビリティ', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('サインアップページのアクセシビリティ', async ({ page }) => {
    await page.goto('/auth/signup');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('キーボードナビゲーション - ホームページ', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Tabキーでフォーカス可能な要素を確認
    const focusableElements = await page.locator(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ).all();

    // 最初の要素にフォーカス
    if (focusableElements.length > 0) {
      await focusableElements[0].focus();
      await expect(focusableElements[0]).toBeFocused();
    }

    // Tabキーで次の要素に移動
    for (let i = 1; i < Math.min(focusableElements.length, 5); i++) {
      await page.keyboard.press('Tab');
      await expect(focusableElements[i]).toBeFocused();
    }
  });

  test('キーボードナビゲーション - 家事追加フォーム', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 家事追加フォームの入力フィールドにフォーカス
    const choreInput = page.locator('input[placeholder*="新しい家事"]');
    await choreInput.focus();
    await expect(choreInput).toBeFocused();

    // テキストを入力
    await choreInput.fill('テスト家事');

    // Tabキーで送信ボタンに移動
    await page.keyboard.press('Tab');
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeFocused();

    // Enterキーで送信
    await page.keyboard.press('Enter');
    
    // 家事が追加されたことを確認
    await expect(page.locator('text=テスト家事')).toBeVisible();
  });

  test('フォーカス管理 - モーダル', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 家事を追加してありがとうボタンを表示
    const choreInput = page.locator('input[placeholder*="新しい家事"]');
    await choreInput.fill('テスト家事');
    await page.keyboard.press('Enter');
    
    // 家事を完了状態にする
    const choreCheckbox = page.locator('input[type="checkbox"]').first();
    await choreCheckbox.check();
    
    // ありがとうボタンが表示されるまで待機（パートナーがいる場合）
    const thankYouButton = page.locator('button:has-text("ありがとう")');
    if (await thankYouButton.isVisible()) {
      await thankYouButton.click();
      
      // モーダルが開いたらフォーカスが適切に管理されているか確認
      const modal = page.locator('[role="dialog"]');
      await expect(modal).toBeVisible();
      
      // モーダル内の最初のフォーカス可能要素にフォーカスが当たっているか確認
      const firstFocusableInModal = modal.locator(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      ).first();
      await expect(firstFocusableInModal).toBeFocused();
    }
  });

  test('色のコントラスト比チェック', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // axe-coreのcolor-contrastルールのみをチェック
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('ARIAラベルとロールの確認', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // メインコンテンツエリアの確認
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // ボタンのaria-labelまたはテキストの確認
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i);
      const hasText = await button.textContent();
      const hasAriaLabel = await button.getAttribute('aria-label');
      const hasAriaLabelledBy = await button.getAttribute('aria-labelledby');
      
      // ボタンには何らかのラベルが必要
      expect(
        hasText?.trim() || hasAriaLabel || hasAriaLabelledBy
      ).toBeTruthy();
    }
  });

  test('スクリーンリーダー対応 - ライブリージョン', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // 通知エリアのaria-live属性を確認
    const notificationArea = page.locator('[aria-live]');
    if (await notificationArea.count() > 0) {
      const ariaLive = await notificationArea.first().getAttribute('aria-live');
      expect(['polite', 'assertive']).toContain(ariaLive);
    }
  });

  test('フォームのエラーメッセージ', async ({ page }) => {
    await page.goto('/auth/signin');
    await page.waitForLoadState('networkidle');

    // 空のフォームを送信してエラーメッセージを表示
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // エラーメッセージが適切にaria-describedbyで関連付けられているか確認
    const emailInput = page.locator('input[type="email"]');
    const ariaDescribedBy = await emailInput.getAttribute('aria-describedby');
    
    if (ariaDescribedBy) {
      const errorElement = page.locator(`#${ariaDescribedBy}`);
      await expect(errorElement).toBeVisible();
      
      // エラーメッセージにrole="alert"があるか確認
      const role = await errorElement.getAttribute('role');
      expect(role).toBe('alert');
    }
  });
});