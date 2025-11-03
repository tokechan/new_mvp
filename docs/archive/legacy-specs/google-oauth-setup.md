# Google OAuth設定手順

## 概要
SupabaseでGoogle OAuth認証を有効にするための設定手順です。

## 1. Google Cloud Console設定

### 1.1 プロジェクト作成・選択
1. [Google Cloud Console](https://console.cloud.google.com/)にアクセス
2. 新しいプロジェクトを作成するか、既存のプロジェクトを選択

### 1.2 OAuth同意画面の設定
1. 「APIとサービス」→「OAuth同意画面」に移動
2. ユーザータイプを選択（通常は「外部」）
3. アプリ情報を入力：
   - アプリ名: `ThankYou Chores`
   - ユーザーサポートメール
   - デベロッパーの連絡先情報

### 1.3 認証情報の作成
1. 「APIとサービス」→「認証情報」に移動
2. 「認証情報を作成」→「OAuth 2.0 クライアントID」を選択
3. アプリケーションの種類：「ウェブアプリケーション」
4. 承認済みのリダイレクトURIを追加：
   ```
   https://[YOUR_SUPABASE_PROJECT_REF].supabase.co/auth/v1/callback
   ```

### 1.4 クライアントIDとシークレットを取得
- 作成されたOAuth 2.0クライアントからクライアントIDとクライアントシークレットをコピー

## 2. Supabase設定

### 2.1 認証プロバイダーの有効化
1. Supabaseダッシュボードにログイン
2. プロジェクトを選択
3. 「Authentication」→「Providers」に移動
4. 「Google」を選択して有効化

### 2.2 Google OAuth設定
1. 「Client ID」にGoogle Cloud ConsoleのクライアントIDを入力
2. 「Client Secret」にクライアントシークレットを入力
3. 「Save」をクリック

## 3. 環境変数確認

`.env.local`ファイルに以下が設定されていることを確認：

```env
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[YOUR_PUBLISHABLE_KEY]
```

## 4. トラブルシューティング

### よくあるエラー
1. **リダイレクトURIの不一致**
   - Google Cloud ConsoleとSupabaseの設定が一致していることを確認

2. **クライアントIDまたはシークレットの誤り**
   - Google Cloud Consoleから正しい値をコピーしていることを確認

3. **OAuth同意画面の未設定**
   - Google Cloud ConsoleでOAuth同意画面が適切に設定されていることを確認

### デバッグ方法
1. ブラウザの開発者ツールでコンソールエラーを確認
2. Supabaseダッシュボードの「Logs」でエラーログを確認
3. ネットワークタブでOAuthリクエストの詳細を確認

## 5. 確認手順

1. アプリケーションを起動
2. サインインページで「Googleでサインイン」をクリック
3. Googleの認証画面が表示されることを確認
4. 認証後、アプリケーションにリダイレクトされることを確認