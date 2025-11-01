# オンボーディングページ 動作確認ガイド

## 問題
オンボーディングページが「ページが見つかりません」と表示される

## 原因
オンボーディング完了状態が localStorage に保存されており、アクセス時に `/app` に自動リダイレクトされるため

## 解決方法

### 方法1: localStorage をクリア（推奨）

ブラウザの DevTools を開いて以下を実行：

```javascript
localStorage.removeItem('youdo_onboarding_complete')
location.reload()
```

### 方法2: シークレットウィンドウで確認
新しいシークレットウィンドウでアプリにアクセス

### 方法3: 直接 URL でアクセス
ローカル開発環境で以下にアクセス：
```
http://localhost:3000/onboarding
```

ただし、認証が完了していない場合は `/auth/signin` にリダイレクトされます。

---

## 正常な動作フロー

### 初回ユーザー
```
1. サインアップ/ログイン
   ↓
2. /app にアクセス
   ↓
3. 自動的に /onboarding にリダイレクト
   ↓
4. Step 1: 機能紹介
   ↓
5. Step 2: PWA インストール案内
   ↓
6. Step 3: プッシュ通知設定
   ↓
7. 完了時に /app にリダイレクト
   ↓
8. 以降は /onboarding にアクセスしても /app にリダイレクト
```

### 2回目以降のユーザー
```
1. /app にアクセス
   ↓
2. オンボーディング完了状態を確認
   ↓
3. そのまま /app を表示（リダイレクトなし）
```

---

## オンボーディングをリセットして再テストする方法

ブラウザの DevTools Console で：

```javascript
// 1. オンボーディング完了状態をクリア
localStorage.removeItem('youdo_onboarding_complete')

// 2. ページをリロード
location.reload()

// または

// 1. すべての localStorage をクリア（注意：他のデータも消えます）
localStorage.clear()

// 2. ページをリロード
location.reload()
```

---

## 動作確認チェックリスト

### ✅ 初回アクセス
- [ ] サインアップ/ログイン後に `/onboarding` にリダイレクトされる
- [ ] Step 1 の3つの機能カードが表示される
- [ ] 「次へ」ボタンで Step 2 に進める
- [ ] 「スキップ」ボタンで `/app` にリダイレクトされる

### ✅ Step 2（PWA インストール）
- [ ] プラットフォームに応じた手順が表示される
- [ ] iOS の場合は手動案内
- [ ] Android/Desktop の場合は「今すぐインストール」ボタンが表示される
- [ ] インストール済みの場合は「アプリがインストール済みです」と表示される

### ✅ Step 3（プッシュ通知）
- [ ] 通知のメリットが3つ表示される
- [ ] 「通知を有効にする」ボタンが動作する
- [ ] 有効化後は「通知が有効になりました」と表示される
- [ ] 「後で設定する」でも進行できる

### ✅ 完了後
- [ ] 完了時に `/app` にリダイレクトされる
- [ ] localStorage に `youdo_onboarding_complete: 'true'` が保存される
- [ ] 2回目以降は `/onboarding` にアクセスしても `/app` にリダイレクトされる

---

## トラブルシューティング

### 「ページが見つかりません」と表示される
- → localStorage に `youdo_onboarding_complete` がある可能性があります
- → 解決方法: 上記の「localStorage をクリア」を実行

### 認証ページにリダイレクトされる
- → 正常な動作です。オンボーディングは認証済みユーザーのみが利用できます

### Step が進まない
- → ブラウザのコンソールでエラーを確認
- → ネットワークタブで API 呼び出しが失敗していないか確認

### プラットフォーム検出が正しくない
- → `usePwaInstallPrompt.ts` のログを確認
- → User Agent が正しく取得できているか確認

---

## 開発時の便利コマンド

### オンボーディング状態を確認
```javascript
console.log('Onboarding complete:', localStorage.getItem('youdo_onboarding_complete'))
```

### 強制的にオンボーディングを表示
```javascript
localStorage.removeItem('youdo_onboarding_complete')
location.href = '/onboarding'
```

### オンボーディングを完了済みにする
```javascript
localStorage.setItem('youdo_onboarding_complete', 'true')
location.href = '/app'
```

---

**最終更新**: 2025-11-01

