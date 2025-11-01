/**
 * オンボーディング完了状態の永続化
 * localStorage を使用してオンボーディングの完了状態を保存・取得
 */

const ONBOARDING_KEY = 'youdo_onboarding_complete'

/**
 * オンボーディング完了状態を保存
 */
export function saveOnboardingComplete(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ONBOARDING_KEY, 'true')
  }
}

/**
 * オンボーディングが完了しているかどうかを確認
 */
export function isOnboardingComplete(): boolean {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(ONBOARDING_KEY) === 'true'
  }
  return false
}

/**
 * オンボーディング完了状態をクリア（テスト用）
 */
export function clearOnboardingComplete(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ONBOARDING_KEY)
  }
}

