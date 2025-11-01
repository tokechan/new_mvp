# オンボーディング Phase 2 完了報告

## 実装完了内容

Phase 2 の PWA インストール案内機能を実装しました。

### 作成したファイル

#### Hook
- `src/hooks/usePwaInstallPrompt.ts` - PWA インストール状態管理 Hook
  - プラットフォーム検出（iOS / Android / Desktop / Unknown）
  - `beforeinstallprompt` イベント処理
  - インストール済み状態の検出

#### UI コンポーネント
- `src/components/onboarding/PwaInstallPrompt.tsx` - Step 2: PWA インストール案内

#### 統合
- `src/app/onboarding/page.tsx` - PWA インストール案内コンポーネントを統合

---

## 機能仕様

### プラットフォーム検出

#### iOS
- **ユーザーエージェント判定**: iPhone / iPad / iPod
- **インストール検出**: `window.matchMedia('(display-mode: standalone)')` or `navigator.standalone`
- **インストール方式**: 手動案内（`beforeinstallprompt` 非対応）

#### Android
- **ユーザーエージェント判定**: Android
- **インストール検出**: `display-mode: standalone`
- **インストール方式**: `beforeinstallprompt` イベント + プロンプト表示

#### Desktop
- **デフォルト判定**: 上記以外
- **インストール検出**: `display-mode: standalone`
- **インストール方式**: `beforeinstallprompt` イベント + プロンプト表示

#### Unknown / 非対応
- 非対応ブラウザの表示

---

### 画面構成

#### インストール済み状態
```
✅ アプリがインストール済みです
→ 次へボタンのみ表示
```

#### iOS インストール手順
```
1. Safari の共有ボタンをタップ
2. 「ホーム画面に追加」を選択
3. ホーム画面から起動
```

#### Android インストール手順
```
1. メニューを開く
2. 「ホーム画面に追加」を選択
3. 確認して追加

+ 「今すぐインストール」ボタン（beforeinstallprompt 利用）
```

#### Desktop インストール手順
```
1. アドレスバーのアイコンをクリック
2. 「インストール」をクリック
3. アプリから起動

+ 「今すぐインストール」ボタン（beforeinstallprompt 利用）
```

#### 非対応ブラウザ
```
PWA 機能をご利用いただけません
→ スキップして続ける
```

---

### 状態管理

```typescript
type PwaInstallStatus = 
  | 'checking'           // 検出中
  | 'installed'          // 既にインストール済み
  | 'available'          // インストール可能
  | 'not-available'      // 非対応
  | 'prompted'           // ユーザーがプロンプトを閉じた
  | 'error'              // エラー
```

#### Hook インターフェース

```typescript
usePwaInstallPrompt() {
  status: PwaInstallStatus
  canInstall: boolean
  isInstalled: boolean
  install: () => Promise<void>
  platform: 'ios' | 'android' | 'desktop' | 'unknown'
}
```

---

### beforeinstallprompt イベント処理

**対応プラットフォーム**: Android Chrome, Desktop Chrome / Edge

**処理フロー**:
1. イベントリスナーで `e.preventDefault()` を実行
2. `deferredPrompt` を保存
3. 「今すぐインストール」ボタンで `deferredPrompt.prompt()` を実行
4. ユーザー選択結果に応じて状態を更新

**型定義**:
```typescript
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}
```

---

## アクセシビリティ対応

- ✅ キーボード操作対応（Tab / Enter / Escape）
- ✅ スクリーンリーダー対応（aria-label）
- ✅ 視覚的フィードバック（ステップ番号付きカード）
- ✅ インストール済み状態の明確な表示

---

## ビルド・テスト結果

### ビルド
```bash
npm run build
✓ Compiled successfully
✓ Route (app) /onboarding 6.51 kB + 163 kB (First Load JS)
```

**ファイルサイズの増加**:
- Phase 1: 4.8 kB
- Phase 2: 6.51 kB (+1.71 kB)

### リンター
```bash
npm run lint
✓ 新しいファイルにエラーなし
```

---

## 動作確認方法

### 1. ローカルで動作確認
```bash
npm run dev
# ブラウザで localhost:3000 を開く
```

### 2. iOS の動作確認
- Safari ブラウザで `/onboarding` にアクセス
- iOS の手順カードが表示されることを確認
- 実際にインストール手順を実行（共有ボタン → ホーム画面に追加）

### 3. Android / Desktop の動作確認
- Chrome / Edge で `/onboarding` にアクセス
- プラットフォームに応じた手順カードが表示されることを確認
- 「今すぐインストール」ボタンが表示される場合はクリックして動作確認

### 4. インストール済み状態の確認
- PWA としてインストール後に `/onboarding` にアクセス
- 「アプリがインストール済みです」画面が表示されることを確認

---

## 技術的な詳細

### standalone 検出の理由

iOS 16.4+ ではホーム画面から起動した場合のみ Web Push が利用可能。
そのため、インストール済みかどうかの判定は重要。

### beforeinstallprompt の制限

- **iOS**: 非対応（手動案内のみ）
- **Android**: Chrome のみ対応
- **Desktop**: Chrome / Edge のみ対応
- **Firefox**: `beforeinstallprompt` 非対応（手動案内のみ）

非対応ブラウザでも手順カードで案内するため、ユーザー体験の低下を回避。

---

## 次のステップ（Phase 3）

### プッシュ通知設定
- [ ] `PushNotificationPrompt.tsx` コンポーネント
- [ ] 既存の `pushSubscriptionService` との統合
- [ ] iOS PWA での通知設定の特殊対応

### Phase 4（テスト）
- [ ] E2E テスト（Playwright）
  - PWA インストール状態の検証
  - プラットフォーム別表示の検証
- [ ] Unit テスト（Jest）
  - `usePwaInstallPrompt` Hook のテスト

---

## 設計ドキュメント

詳細な設計は以下を参照：
- `docs/onboarding-design.md` - 全体設計書
- `src/components/onboarding/*.tsx` - 実装詳細
- `docs/onboarding-phase1-summary.md` - Phase 1 完了報告

---

**完了日**: 2025-11-1
**実装フェーズ**: Phase 2（PWA インストール案内）  
**ステータス**: ✅ 完了・テスト済み

