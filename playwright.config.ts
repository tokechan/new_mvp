import { defineConfig, devices } from '@playwright/test';

const E2E_BASE_URL = process.env.E2E_BASE_URL;
const E2E_SKIP_A11Y = process.env.E2E_SKIP_A11Y === 'true';

/**
 * Playwright設定ファイル
 * E2Eテストの実行環境とブラウザ設定を定義
 */
export default defineConfig({
  // テストディレクトリ
  testDir: './tests/e2e',
  // 一時的にアクセシビリティテストを除外するトグル
  testIgnore: E2E_SKIP_A11Y ? [/accessibility\.spec\.ts$/] : undefined,
  
  // 並列実行の設定
  fullyParallel: true,
  
  // CI環境での設定
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  // レポート設定
  reporter: 'html',
  
  // 共通設定
  use: {
    // ベースURL（開発サーバーのURL）
    baseURL: E2E_BASE_URL ?? 'http://localhost:3001',
    
    // スクリーンショット設定
    screenshot: 'only-on-failure',
    
    // ビデオ録画設定
    video: 'retain-on-failure',
    
    // トレース設定
    trace: 'on-first-retry',
  },

  // テスト対象ブラウザの設定
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // 開発サーバーの設定
  // ステージング（外部URL）指定時はローカル開発サーバーを起動しない
  webServer: E2E_BASE_URL
    ? undefined
    : {
        command: 'NEXT_PUBLIC_SKIP_AUTH=true next dev -p 3001',
        url: 'http://localhost:3001',
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000, // 2分
        env: {
          NEXT_PUBLIC_SKIP_AUTH: 'true',
          PORT: '3001',
        },
      },
});