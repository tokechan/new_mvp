// プライバシーポリシーページ
// 作成日: 2025-10-31

'use client'

import type { ComponentType, SVGProps } from 'react'
import Link from 'next/link'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  ShieldCheck,
  FolderOpen,
  Share2,
  RefreshCw,
  UserCog,
  Mail,
} from 'lucide-react'

const LAST_UPDATED = '2025年10月31日'

type PolicySection = {
  id: string
  title: string
  description: string
  bullets: string[]
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

const sections: PolicySection[] = [
  {
    id: 'collection',
    title: '1. 取得する情報',
    description:
      'YOUDOではサービスの提供と改善のため、以下の情報を必要な範囲で取得します。',
    bullets: [
      'アカウント情報（氏名、メールアドレス、プロフィール画像など）',
      '家事タスクに関する利用データ（完了履歴、コメント、リアクション）',
      '端末および接続情報（ブラウザ種別、IPアドレス、クッキーID）',
      'お問い合わせ時に提供いただく追加情報',
    ],
    icon: FolderOpen,
  },
  {
    id: 'usage',
    title: '2. 利用目的',
    description:
      '取得した情報は、透明性のもとでサービス体験を向上させるために活用します。',
    bullets: [
      '家事共有・感謝送信などコア機能の提供と改善',
      'パートナーとの連携、招待、通知配信の管理',
      '障害対応やセキュリティ監査など安全な運用のための分析',
      'キャンペーンや新機能のお知らせなど利用者へのご案内',
    ],
    icon: ShieldCheck,
  },
  {
    id: 'sharing',
    title: '3. 第三者提供',
    description:
      '法令に基づく場合を除き、利用者の同意なく個人情報を第三者へ提供することはありません。',
    bullets: [
      'データ処理を委託する場合は、機密保持契約を締結した委託先のみがアクセスできます。',
      '統計処理された匿名化データは、サービス改善やレポートに活用することがあります。',
      '法的要請がある場合を除き、個人情報を外部に公開することはありません。',
    ],
    icon: Share2,
  },
  {
    id: 'retention',
    title: '4. 保存期間と削除',
    description:
      '情報は利用目的が達成されるまで適切に保存し、不要になった時点で安全に削除します。',
    bullets: [
      'アカウント削除リクエストを受けた場合、30日以内を目安に関連データを消去します。',
      'バックアップは一定期間保持後、安全な手段で破棄します。',
      '法令で保存義務がある情報は、定められた期間保管します。',
    ],
    icon: RefreshCw,
  },
  {
    id: 'rights',
    title: '5. 利用者の権利',
    description:
      '利用者は自らの情報について、いつでも確認・更新・削除を求めることができます。',
    bullets: [
      'プロフィールや家事データはアプリ内設定から編集・削除できます。',
      '通知設定やメール配信はマイページからいつでも変更できます。',
      '情報開示や訂正のご依頼は、サポート窓口までご連絡ください。',
    ],
    icon: UserCog,
  },
]

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8">
        <header className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1 text-xs font-medium text-primary">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            プライバシーとセキュリティ
          </div>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              プライバシーポリシー
            </h1>
            <p className="text-sm text-muted-foreground">最終更新日: {LAST_UPDATED}</p>
          </div>
          <p className="max-w-3xl text-base leading-relaxed text-muted-foreground">
            YOUDO（以下「当社」）は、利用者の個人情報を大切に扱います。本ポリシーでは、当社がどのようなデータを収集し、どのように利用・共有し、利用者の権利をどのように守るかを説明します。アプリをご利用になる前に内容をご確認ください。
          </p>
        </header>

        <Card>
          <CardHeader className="space-y-4">
            <CardTitle className="text-2xl font-semibold text-foreground">
              プライバシーへの取り組み
            </CardTitle>
            <CardDescription className="text-base leading-relaxed text-muted-foreground">
              当社は業界標準のセキュリティ対策を実施し、最小限のデータ取得に努めています。個人情報保護に関するご不明点がある場合は、いつでもお問い合わせください。
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-2">
            {sections.map((section) => {
              const Icon = section.icon
              return (
                <Card key={section.id} className="rounded-xl border-border/60 bg-card/80 shadow-sm">
                  <CardHeader className="flex flex-row items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-semibold text-foreground">
                        {section.title}
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed">
                        {section.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <ul className="space-y-2 text-sm leading-relaxed text-muted-foreground">
                      {section.bullets.map((bullet, index) => (
                        <li key={`${section.id}-${index}`} className="flex gap-2">
                          <span className="mt-1 block h-1.5 w-1.5 rounded-full bg-primary/80" aria-hidden="true" />
                          <span>{bullet}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )
            })}
          </CardContent>
        </Card>

        <Card className="rounded-xl border-border/60 bg-card/90 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl font-semibold text-foreground">
              6. セキュリティとデータ保護
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              アクセス制御、通信の暗号化、継続的なモニタリングを実施し、不正アクセスや情報漏えいを防止します。内部スタッフには必要最小限の権限のみを付与し、定期的に教育を行っています。
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="rounded-xl border-border/60 bg-card/90 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl font-semibold text-foreground">
              7. プライバシーポリシーの更新
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              法令改正やサービス仕様の変更に伴い、本ポリシーを改定する場合があります。重要な変更がある場合は、アプリ内通知またはメールでお知らせします。
            </CardDescription>
          </CardHeader>
        </Card>

        <Card className="rounded-xl border-border/60 bg-card/90 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-xl font-semibold text-foreground">
              8. お問い合わせ
            </CardTitle>
            <CardDescription className="text-sm leading-relaxed">
              プライバシーに関するご質問や、情報開示・削除のリクエストは以下の窓口までご連絡ください。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" aria-hidden="true" />
              <Link
                href="mailto:privacy@youdohome.app"
                className="text-primary underline underline-offset-4"
              >
                privacy@youdohome.app
              </Link>
            </div>
            <p>
              平日（祝日除く）であれば48時間以内のご返信を目安としております。返信までにお時間をいただく場合がありますが、順次対応いたします。
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
