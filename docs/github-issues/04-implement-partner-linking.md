# 👫 パートナー連携機能の実装

## 機能概要

夫婦/カップルがアプリ内で連携し、家事を共有できる機能を実装する。

## 要件

### 基本機能
- [ ] パートナー招待システム
- [ ] 招待リンクの生成と共有
- [ ] 招待の受諾・拒否機能
- [ ] パートナー関係の管理
- [ ] パートナー情報の表示

### 招待システム
- [ ] 一意な招待コードの生成
- [ ] 招待リンクの有効期限管理
- [ ] 招待状態の追跡（送信済み、受諾済み、期限切れ）
- [ ] 重複招待の防止

### セキュリティ
- [ ] 招待コードの暗号化
- [ ] 適切なRLSポリシー
- [ ] 不正アクセスの防止
- [ ] 招待の取り消し機能

## 技術的詳細

### データベーススキーマ
```sql
-- パートナー招待テーブル
CREATE TABLE partner_invitations (
  id BIGSERIAL PRIMARY KEY,
  inviter_id UUID REFERENCES profiles(id),
  invitee_email TEXT,
  invitation_code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ
);

-- パートナー関係テーブル
CREATE TABLE partnerships (
  id BIGSERIAL PRIMARY KEY,
  user1_id UUID REFERENCES profiles(id),
  user2_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id != user2_id)
);

-- プロフィールテーブルにパートナーIDを追加
ALTER TABLE profiles ADD COLUMN partner_id UUID REFERENCES profiles(id);

-- インデックス
CREATE INDEX idx_partner_invitations_code ON partner_invitations(invitation_code);
CREATE INDEX idx_partner_invitations_inviter ON partner_invitations(inviter_id);
CREATE INDEX idx_partnerships_user1 ON partnerships(user1_id);
CREATE INDEX idx_partnerships_user2 ON partnerships(user2_id);
```

### RLSポリシー
```sql
-- 招待の作成ポリシー
CREATE POLICY "partner_invitations_insert_own"
ON public.partner_invitations FOR INSERT
WITH CHECK (inviter_id = auth.uid());

-- 招待の閲覧ポリシー
CREATE POLICY "partner_invitations_select_involved"
ON public.partner_invitations FOR SELECT
USING (
  inviter_id = auth.uid() OR 
  invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- 招待の更新ポリシー（受諾・拒否）
CREATE POLICY "partner_invitations_update_invitee"
ON public.partner_invitations FOR UPDATE
USING (
  invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid()) AND
  status = 'pending' AND
  expires_at > NOW()
);

-- パートナーシップの閲覧ポリシー
CREATE POLICY "partnerships_select_involved"
ON public.partnerships FOR SELECT
USING (user1_id = auth.uid() OR user2_id = auth.uid());
```

### API設計
```typescript
// 招待の送信
const sendPartnerInvitation = async (inviteeEmail: string) => {
  const invitationCode = generateInvitationCode();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7日後
  
  const { data, error } = await supabase
    .from('partner_invitations')
    .insert({
      inviter_id: user.id,
      invitee_email: inviteeEmail,
      invitation_code: invitationCode,
      expires_at: expiresAt.toISOString()
    })
    .select();
  
  if (error) throw error;
  return data;
};

// 招待の受諾
const acceptPartnerInvitation = async (invitationCode: string) => {
  // 1. 招待を受諾状態に更新
  const { data: invitation, error: updateError } = await supabase
    .from('partner_invitations')
    .update({ 
      status: 'accepted',
      accepted_at: new Date().toISOString()
    })
    .eq('invitation_code', invitationCode)
    .eq('status', 'pending')
    .select()
    .single();
  
  if (updateError) throw updateError;
  
  // 2. パートナーシップを作成
  const { error: partnershipError } = await supabase
    .from('partnerships')
    .insert({
      user1_id: invitation.inviter_id,
      user2_id: user.id
    });
  
  if (partnershipError) throw partnershipError;
  
  // 3. プロフィールを相互更新
  await updatePartnerProfiles(invitation.inviter_id, user.id);
  
  return invitation;
};

// パートナー情報の取得
const getPartnerInfo = async () => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.partner_id)
    .single();
  
  if (error) throw error;
  return data;
};
```

## 実装ファイル

### 修正が必要なファイル
- `src/components/PartnerInvitation.tsx` - 既存コンポーネントの完成
- `src/app/invite/[code]/page.tsx` - 招待受諾ページの実装
- `src/hooks/usePartner.ts` - パートナー管理フックの拡張
- `src/hooks/useInvitations.ts` - 招待管理フックの拡張

### 新規作成が必要なファイル
- `src/components/PartnerProfile.tsx` - パートナー情報表示
- `src/components/InvitationStatus.tsx` - 招待状態表示
- `src/services/partnerService.ts` - パートナー関連API
- `src/utils/invitationUtils.ts` - 招待コード生成・検証

## 招待フロー

### 招待送信フロー
1. ユーザーがパートナーのメールアドレスを入力
2. システムが一意な招待コードを生成
3. 招待リンクを生成（`/invite/[code]`）
4. メール送信またはリンク共有
5. 招待状態を「送信済み」に更新

### 招待受諾フロー
1. 招待されたユーザーが招待リンクにアクセス
2. 未登録の場合は新規登録を促す
3. 登録済みの場合はログインを促す
4. 招待内容を確認し、受諾・拒否を選択
5. 受諾時にパートナーシップを作成
6. 両者のプロフィールを相互更新

## UI/UX要件

### 招待送信画面
- [ ] メールアドレス入力フォーム
- [ ] 招待メッセージのカスタマイズ
- [ ] 招待リンクの表示と共有機能
- [ ] 送信済み招待の一覧表示

### 招待受諾画面
- [ ] 招待者情報の表示
- [ ] 招待内容の説明
- [ ] 受諾・拒否ボタン
- [ ] エラーハンドリング（期限切れ、無効なコードなど）

### パートナー管理画面
- [ ] パートナー情報の表示
- [ ] パートナーシップの解除機能
- [ ] 招待履歴の表示

## テスト要件

### E2Eテスト
- [ ] パートナー招待の送信
- [ ] 招待リンクでの受諾フロー
- [ ] パートナー情報の表示
- [ ] 招待の期限切れ処理
- [ ] 重複招待の防止

### 新規テストファイル
- `tests/e2e/partner-invitation.spec.ts`
- `tests/e2e/partner-management.spec.ts`

## セキュリティ考慮事項

- [ ] 招待コードの推測困難性（UUID v4使用）
- [ ] 招待の有効期限設定（7日間）
- [ ] 不正アクセスの検知と防止
- [ ] パートナーシップの重複防止
- [ ] 招待の取り消し機能

## 依存関係

### 前提条件
- Issue #1: RLSポリシーエラーの解決
- 基本的な認証機能が動作していること

### 後続タスク
- Issue #2: 家事完了機能（パートナー間での家事共有）
- Issue #3: ありがとう機能（パートナー間でのメッセージ）

## 優先度

**High** - アプリの核心機能（夫婦/カップル向け）

## 見積もり

**工数**: 3-4日
**複雑度**: High（複雑なデータベース設計、セキュリティ、UI実装）

## 受け入れ基準

- [ ] パートナー招待を送信できる
- [ ] 招待リンクから受諾できる
- [ ] パートナー情報が正しく表示される
- [ ] セキュリティ要件を満たす
- [ ] E2Eテストが通る
- [ ] 招待の期限管理が正しく動作する

## ラベル

`feature`, `high-priority`, `mvp`, `security`, `database`, `ui`

---

**作成日**: 2024年12月
**担当者**: 未割り当て
**マイルストーン**: MVP リリース前