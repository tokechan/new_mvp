- LP (集客・情報提供トップ): https://you-do.dev → src/app/(marketing)/page.tsx
- サービス概要・機能紹介などの詳細ページ（必要なら）: https://you-do.dev/features, https://you-do.dev/pricing → src/app/(marketing)/features/page.tsx
  ほか
- CTAボタンの遷移先（ログイン／サインアップ）: https://you-do.dev/login, https://you-do.dev/signup → src/app/(auth)/login/page.tsx など
- アプリ本体（ログイン後のダッシュボードなど）: https://you-do.dev/app もしくは https://you-do.dev/dashboard → src/app/(app)/app/page.tsx や src/app/
  (app)/dashboard/page.tsx
- 法的文書: https://you-do.dev/terms, https://you-do.dev/privacy, https://you-do.dev/cookies → src/app/(legal)/terms/page.tsx など

括弧付きディレクトリ（Route Group）で (marketing)・(app)・(auth)・(legal) を分けておけば、それぞれ独立したレイアウトやメタデータを適用できますし、
トップをLPにしつつアプリへの導線を自然に配置できます。

