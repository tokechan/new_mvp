# ドキュメント変更履歴（Version Log）

変更の追跡性を高め、関係者への共有を容易にするためのドキュメント版の変更履歴です。

## 2025-10-25
- 追加: `system-design-changes.md`
  - 現行実装と設計ドキュメントの差分、変更点、理由、影響範囲を整理。
- 追加: `auth-token-spec.md`
  - トークン仕様、生成/検証、期限、権限設定（RLS）を明文化。
- 追加: `verification-test-cases.md`
  - 実装とドキュメントの整合性確認用の検証テストケース集（非実行）。
- 目次更新: `docs/reference/index.md` に上記ドキュメントへのリンクを追記。

## 通知・配置
- 配置場所: `docs/reference/`（技術仕様の一元管理）。
- 共有: READMEに記載のドキュメント入口（`docs/reference/index.md`）。PR/変更通知のテンプレート:
  - 件名: 「ドキュメント更新（System Design/Token/Verification）」
  - 本文: 変更概要、影響範囲、参照リンク（上記3ドキュメント）、次アクション（CORS制限の検討、BFF時のJWKS検証）。

## 今後のメンテナンス指針
- 各機能の変更時は、関連ドキュメント（architecture/security/api/openapi/operations）への影響を必ず評価し、`doc-change-log.md`に追記。
- 本番向け方針変更（例: CORS強化、NextAuth採用/BFF導入）時は、ADR追加（決定の経緯と選定理由）を作成。
