# オンボーディングページ設計書

## 概要

YOUDO アプリの新規ユーザー向けオンボーディングページ設計。
家事管理・リアルタイム共有・ありがとう機能・PWA/プッシュ通知の利用促進を目的とする。

---

## 目的

1. **機能理解の促進**: 3つの主要機能を視覚的に説明
2. **PWA インストール促進**: ホーム画面追加手順を案内
3. **プッシュ通知の許可促進**: 通知設定の重要性を伝える
4. **スムーズな開始**: 初回利用時の障壁を最小化

---

## ユーザーフロー

```
新規ユーザー登録・ログイン成功
  ↓
オンボーディングページ（初回のみ）
  ↓
Step 1: 機能紹介（スキップ可能）
  ├─ 家事の追加
  ├─ リアルタイム共有
  └─ ありがとうメッセージ
  ↓
Step 2: PWA インストール案内（スキップ可能）
  ├─ iOS: Safari 共有ボタン → ホーム画面に追加
  ├─ Android: Chrome メニュー → ホーム画面に追加
  └─ デスクトップ: アドレスバーのインストールアイコン
  ↓
Step 3: プッシュ通知設定（オプトイン）
  ├─ PWA 経由での通知の重要性を説明
  └─ ユーザーの了承を得て通知を有効化
  ↓
アプリメイン画面（/app）へ遷移
```

---

## 実装仕様

### ファイル構成

```
src/
  app/
    onboarding/
      page.tsx                          # メインページ
  components/
    onboarding/
      OnboardingStepper.tsx             # ステップインジケーター
      FeatureIntroduction.tsx           # Step 1: 機能紹介
      PwaInstallPrompt.tsx              # Step 2: PWA インストール案内
      PushNotificationPrompt.tsx        # Step 3: プッシュ通知設定
      OnboardingComplete.tsx            # 完了画面
  hooks/
    useOnboarding.ts                    # オンボーディング状態管理
  utils/
    onboardingStorage.ts                # 完了状態の永続化（localStorage）
```

---

### 画面構成

#### Step 1: 機能紹介

**コンポーネント**: `FeatureIntroduction`

**要素**:
- アイコン + タイトル + 説明文の3カード
- 「次へ」ボタン
- 「スキップ」リンク

**カード内容**:
1. **家事の追加**
   - アイコン: FileText
   - タイトル: "家事を追加しよう"
   - 説明: "料理、洗濯、掃除... やるべき家事をリストに追加します。未完了10件まで追加できます。"

2. **リアルタイム共有**
   - アイコン: Share2
   - タイトル: "パートナーと共有"
   - 説明: "パートナーを招待して、同じ家事リストをリアルタイムで共有。進捗を一緒に確認できます。"

3. **ありがとうメッセージ**
   - アイコン: HeartHandshake
   - タイトル: "感謝を伝えよう"
   - 説明: "パートナーが完了した家事にはハートボタンが表示されます。感謝の気持ちを伝えます。"

---

#### Step 2: PWA インストール案内

**コンポーネント**: `PwaInstallPrompt`

**機能**:
- ブラウザ/OS 検出 → 該当の案内を表示
- インストール状態の検出 → 既にインストール済みの場合はスキップ
- デバイス別の手順図解

**表示分岐**:
- **iOS Safari**: "ホーム画面に追加して、より便利に使おう"
  - 手順: Safari の共有ボタン → "ホーム画面に追加"
  - 理由: "ホーム画面から起動すると通知を受け取れます"
  
- **Android Chrome**: "ホーム画面に追加する"
  - 手順: Chrome メニュー → "ホーム画面に追加"
  
- **デスクトップ**: "アプリとしてインストール"
  - 手順: アドレスバーのインストールアイコン
  - 理由: "アプリのように立ち上げられます"

- **未対応**: "PWA 機能をご利用いただけません"
  - 説明: "iOS 16.4 以上または Android 環境でご利用ください"
  - 「スキップして続ける」ボタンのみ

**状態管理**:
```typescript
type PwaInstallStatus = 
  | 'checking'           // 検出中
  | 'installed'          // 既にインストール済み
  | 'available'          // インストール可能
  | 'not-available'      // 非対応
  | 'dismissed'          // ユーザーがスキップ
```

---

#### Step 3: プッシュ通知設定

**コンポーネント**: `PushNotificationPrompt`

**機能**:
- 通知許可の重要性を説明
- ユーザーの了承を得て通知を有効化
- 既に許可済みの場合はスキップ

**説明文**:
> パートナーが家事を完了した時や、ありがとうメッセージを受信した時に通知を受け取れます。
> アプリを閉じていても、重要なアクションを見逃しません。

**ボタン**:
- 「通知を有効にする」 → `ensurePushSubscription()` を呼び出し
- 「後で設定する」 → スキップ

**注意事項**:
- iOS PWA の場合: "ホーム画面から起動している必要があります"
- 環境変数フラグが無効な場合: 通知機能のスキップ表示

---

### 状態管理

#### `useOnboarding` Hook

```typescript
export function useOnboarding() {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1)
  const [isComplete, setIsComplete] = useState(false)
  const [isSkipped, setIsSkipped] = useState(false)

  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const skipOnboarding = () => {
    saveOnboardingComplete()
    setIsSkipped(true)
    router.push('/app')
  }

  const completeOnboarding = () => {
    saveOnboardingComplete()
    setIsComplete(true)
    router.push('/app')
  }

  return {
    currentStep,
    nextStep,
    skipOnboarding,
    completeOnboarding,
    isComplete,
    isSkipped
  }
}
```

#### 完了状態の永続化

```typescript
// utils/onboardingStorage.ts

const ONBOARDING_KEY = 'youdo_onboarding_complete'

export function saveOnboardingComplete(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ONBOARDING_KEY, 'true')
  }
}

export function isOnboardingComplete(): boolean {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(ONBOARDING_KEY) === 'true'
  }
  return false
}
```

---

### ページ統合

#### メインページ: `src/app/onboarding/page.tsx`

```typescript
'use client'

import { useOnboarding } from '@/hooks/useOnboarding'
import FeatureIntroduction from '@/features/onboarding/components/FeatureIntroduction'
import PwaInstallPrompt from '@/features/onboarding/components/PwaInstallPrompt'
import PushNotificationPrompt from '@/features/onboarding/components/PushNotificationPrompt'
import OnboardingComplete from '@/features/onboarding/components/OnboardingComplete'

export default function OnboardingPage() {
  const { currentStep, nextStep, completeOnboarding } = useOnboarding()

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <OnboardingStepper currentStep={currentStep} />
        
        {currentStep === 1 && (
          <FeatureIntroduction onNext={nextStep} onSkip={completeOnboarding} />
        )}
        {currentStep === 2 && (
          <PwaInstallPrompt onNext={nextStep} onSkip={completeOnboarding} />
        )}
        {currentStep === 3 && (
          <PushNotificationPrompt onComplete={completeOnboarding} onSkip={completeOnboarding} />
        )}
      </div>
    </div>
  )
}
```

---

### ナビゲーション統合

#### 初回ユーザーの判定とリダイレクト

**場所**: `src/app/app/page.tsx`

```typescript
useEffect(() => {
  if (user && !loading && !isOnboardingComplete()) {
    router.push('/onboarding')
  }
}, [user, loading])
```

**既存のナビゲーションから除外**:
- オンボーディング中は `Navigation.tsx` を非表示
- 専用の「スキップ」ボタンでメイン画面へ遷移

---

### アクセシビリティ

- すべてのボタン/リンクに適切な `aria-label`
- キーボード操作対応: Tab / Enter / Escape
- スクリーンリーダー対応: ステップ番号と進捗の読み上げ
- アニメーション: `prefers-reduced-motion` で無効化

---

### テスト要件

#### E2E テスト（Playwright）

```typescript
// tests/e2e/onboarding.spec.ts

test.describe('Onboarding Flow', () => {
  test('should complete all steps', async ({ page }) => {
    // 新規ユーザーでログイン
    await page.goto('/auth/signup')
    await fillSignUpForm(page)
    
    // オンボーディングページへリダイレクト
    await expect(page).toHaveURL('/onboarding')
    
    // Step 1: 機能紹介
    await expect(page.locator('text=家事を追加しよう')).toBeVisible()
    await page.click('button:has-text("次へ")')
    
    // Step 2: PWA インストール案内
    await expect(page.locator('text=ホーム画面に追加')).toBeVisible()
    await page.click('button:has-text("次へ")')
    
    // Step 3: プッシュ通知設定
    await expect(page.locator('text=通知を有効にする')).toBeVisible()
    await page.click('button:has-text("後で設定する")')
    
    // メイン画面へ遷移
    await expect(page).toHaveURL('/app')
    
    // 完了状態が保存されていることを確認
    const isComplete = await page.evaluate(() => {
      return localStorage.getItem('youdo_onboarding_complete') === 'true'
    })
    expect(isComplete).toBe(true)
    
    // リロードしてもオンボーディングページに戻らないことを確認
    await page.reload()
    await expect(page).toHaveURL('/app')
  })
  
  test('should allow skipping entire flow', async ({ page }) => {
    await page.goto('/onboarding')
    await page.click('button:has-text("スキップ")')
    await expect(page).toHaveURL('/app')
  })
})
```

#### Unit テスト

```typescript
// src/hooks/useOnboarding.test.ts

describe('useOnboarding', () => {
  test('should progress through steps', () => {
    const { result } = renderHook(() => useOnboarding())
    expect(result.current.currentStep).toBe(1)
    
    act(() => {
      result.current.nextStep()
    })
    expect(result.current.currentStep).toBe(2)
  })
  
  test('should save completion state', () => {
    const { result } = renderHook(() => useOnboarding())
    
    act(() => {
      result.current.completeOnboarding()
    })
    
    expect(localStorage.getItem('youdo_onboarding_complete')).toBe('true')
  })
})
```

---

### デザイン仕様

**レイアウト**:
- 中央揃え、最大幅 2xl（896px）
- ステップインジケーター: 上部固定
- 各ステップ: カード形式、padding 6（24px）

**カラースキーム**:
- 既存の Tailwind テーマを使用
- `primary`: メイン CTA ボタン
- `secondary`: スキップボタン
- `muted`: 説明文

**アニメーション**:
- フェードイン: `animate-in fade-in duration-300`
- カード表示: `slide-in-from-bottom-4`

---

### フェーズ分割実装

#### Phase 1（MVP）
- [x] 機能紹介コンポーネント
- [x] 基本ステップ遷移
- [x] 完了状態の保存
- [ ] PWA インストール検出（基本）

#### Phase 2
- [ ] PWA インストール案内（デバイス別）
- [ ] インストール済み状態の検出

#### Phase 3
- [ ] プッシュ通知設定統合
- [ ] 完了画面・CTA 最適化

---

## 参考資料

- [PWA Add to Home Screen - MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_Web_Apps/Guides/Adding_to_home_screen)
- [Web Push Notifications - Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)
- 既存実装:
  - `docs/reference/pwa-push-notifications.md`
  - `docs/reference/push-notification-implementation.md`
  - `src/shared/components/PwaInitializer.tsx`
  - `src/services/pushSubscriptionService.ts`

---

**最終更新**: 2025-01-27  
**作成者**: AI Assistant (VSCode Cursor)

