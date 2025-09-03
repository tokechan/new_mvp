# NextAuth Secret Generation Guide

## 概要

NextAuth.jsで使用するセキュアなシークレットキーの生成方法について記録します。

## NEXTAUTH_SECRETとは

- NextAuth.jsで使用される重要なセキュリティキー
- JWTトークンの署名・暗号化に使用
- 32文字以上のランダムな文字列が必要
- 環境変数として設定し、絶対に公開してはいけない

## 生成方法

### 1. OpenSSLを使用（推奨）

```bash
openssl rand -base64 32
```

**特徴：**
- 最もセキュアで推奨される方法
- 32バイトのランダムデータをBase64エンコードで生成
- ほとんどのシステムで利用可能

### 2. Node.jsを使用

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**特徴：**
- Node.js環境があれば利用可能
- cryptoモジュールを使用してセキュアに生成

### 3. オンラインジェネレーター

- NextAuth.js公式サイトでも生成ツールを提供
- 開発環境では利用可能だが、本番環境では自分で生成することを推奨

## 設定方法

### .env.localファイルに追加

```env
NEXTAUTH_SECRET=生成されたシークレットキー
NEXTAUTH_URL=http://localhost:3000
```

### 例

```env
NEXTAUTH_SECRET=rB7Pp8QNGsmMlL28poy1alknYfSTeXY8LTCd80X6TqE=
NEXTAUTH_URL=http://localhost:3000
```

## セキュリティ上の注意点

### 必須事項
- **32文字以上の長さを保つ**
- **ランダムで予測不可能である必要**
- **絶対に公開しない**（GitHubなどにコミットしない）
- **環境ごとに異なるキーを使用**

### 推奨事項
- 定期的な更新を行う
- 本番環境では特に厳重に管理
- 漏洩した場合は即座に更新

### リスク
- 漏洩するとセッションハイジャックのリスクがある
- 不正なJWTトークンの生成が可能になる

## 実装例

### プロジェクトでの使用例

1. シークレットキーを生成
   ```bash
   openssl rand -base64 32
   ```

2. .env.localファイルに設定
   ```env
   NEXTAUTH_SECRET=生成されたキー
   ```

3. NextAuth設定で使用
   ```javascript
   // pages/api/auth/[...nextauth].js
   export default NextAuth({
     secret: process.env.NEXTAUTH_SECRET,
     // その他の設定...
   })
   ```

## 関連リンク

- [NextAuth.js公式ドキュメント](https://next-auth.js.org/)
- [OpenSSL公式サイト](https://www.openssl.org/)

---

**作成日:** 2024年1月
**更新日:** 2024年1月
**作成者:** Development Team