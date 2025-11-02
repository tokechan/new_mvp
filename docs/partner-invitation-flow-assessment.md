# Partner Invitation Flow Assessment (現状調査レポート)

## 現状の構成
- 認証済みユーザー向けの `PartnerInvitation` コンポーネントが招待生成・共有・履歴管理を一画面に集約し、`useInvitations` フックで Supabase 操作を抽象化しています。
- `invitationService` が `partner_invitations` テーブルおよび `generate_invite_code` / `link_partners` / `cleanup_expired_invitations` RPC を利用し、プロフィール連携や共有家事数の算出には `PartnerService` を併用しています。
- 受諾ページ (`/invite/[code]`) は招待コード検証、ステータス表示、受諾アクション、完了時の自動リダイレクトまでを一貫して処理します。
- データベース側ではマイグレーションにより招待テーブル、プロフィール拡張、RLS ポリシー、PL/pgSQL 関数が定義され、パートナーリンク時に双方のプロフィールと既存家事を更新するよう設計されています。

## ユーザーフロー
```mermaid
flowchart TD
    A[ログイン済みユーザー] --> B[PartnerInvitationコンポーネントを開く]
    B --> C{既存の招待が有効か}
    C -- はい --> D[現在の招待を表示<br/>URLコピー/QR共有]
    C -- いいえ --> E[招待作成リクエスト<br/>(generate_invite_code → partner_invitations.insert)]
    E --> F[招待コードを取得し共有]
    F --> G[招待リンク/QRを受け取った相手]
    G --> H[招待ページ /invite/:code を開く]
    H --> I{ログイン済みか}
    I -- いいえ --> J[サインイン/サインアップ]
    J --> H
    I -- はい --> K{招待コードが有効か}
    K -- いいえ --> L[エラーメッセージ表示]
    K -- はい --> M[招待受諾ボタン押下]
    M --> N[link_partners RPC 実行<br/>(双方プロフィール更新＋共有家事同期)]
    N --> O[成功ダイアログ表示<br/>共有家事件数などを通知]
    O --> P[数秒後にアプリホームへ遷移]
```

## 良い点
- 認証ハンドリングで `profileService.ensureProfile` を必ず実行し、`profiles` 行の未作成による RLS 失敗を防いでいます。
- `link_partners` は双方向の `partner_id` 更新と `partnership_created_at` 記録、既存家事への `partner_id` 付与まで行うため、受諾後のデータ整合性が担保されています。
- 招待作成・受諾ともに Supabase エラーをキャッチしてユーザー向けのメッセージを返し、UI が例外で落ちないよう工夫されています。
- パートナー受諾後に `PartnerService.getPartnerInfo` を呼び、共有家事件数などの追加情報を返すことで UX が向上しています。

## リスク・課題
- `link_partners` に招待者と受諾者の同一チェックがなく、招待者本人がリンクを開いて受諾すると自己リンクが成立し、`partner_id` が自分自身になる恐れがあります。
- 受諾ページは `inviter_name` / `inviter_email` を表示しようとしますが、サービス層は `partner_invitations` 行のみを返すため常に未定義になり、ユーザー向け情報が欠落しています。
- `cleanup_expired_invitations` を定期実行する仕組みがなく、期限切れでもステータスが `pending` のまま履歴に残り、UI 表示と実際の状態が乖離します。
- 招待作成時に既存のパートナーリンク有無を確認しておらず、既にパートナーがいるユーザーが再度招待を発行すると、受諾時に RPC 側で弾かれて「無効な招待コード」エラーとなり原因が分かりづらくなります。

## 改善方針
1. `link_partners` およびフロント側双方に「招待者と受諾者が同一なら拒否する」ロジックと明示的なエラー表示を追加し、自己リンクを防止する。
2. 招待取得時に `profiles` との JOIN もしくは追加カラムで招待者の表示情報を返すよう拡張し、受諾ページの情報欠落を解消する。
3. Supabase のスケジュール機能やワーカーで `cleanup_expired_invitations` を定期実行し、期限切れ状態を自動更新して履歴表示の整合性を保つ。
4. 招待作成前に既存パートナーの有無を確認し、リンク済みの場合は招待を発行せず専用メッセージを返してユーザーに状況を知らせる。
