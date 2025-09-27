#!/bin/bash

# 環境変数設定スクリプト
# 使用方法: ./scripts/setup-env.sh [staging|production]

set -e

ENVIRONMENT=${1:-staging}

echo "🚀 Cloudflare環境変数を設定します (環境: $ENVIRONMENT)"

# 必要な環境変数をチェック
check_env_var() {
    if [ -z "${!1}" ]; then
        echo "❌ エラー: 環境変数 $1 が設定されていません"
        echo "   以下のコマンドで設定してください:"
        echo "   export $1='your-value'"
        exit 1
    fi
}

# 環境変数の存在確認
echo "📋 環境変数をチェックしています..."
check_env_var "NEXT_PUBLIC_SUPABASE_URL"
check_env_var "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
check_env_var "SUPABASE_SECRET_KEY"
check_env_var "NEXTAUTH_SECRET"

# 環境に応じたNEXTAUTH_URLの設定
if [ "$ENVIRONMENT" = "production" ]; then
    NEXTAUTH_URL_VALUE=${NEXTAUTH_URL:-"https://your-domain.pages.dev"}
else
    NEXTAUTH_URL_VALUE=${NEXTAUTH_URL:-"https://your-staging-domain.pages.dev"}
fi

echo "🔧 Cloudflareに環境変数を設定しています..."

# wranglerコマンドで環境変数を設定
wrangler secret put NEXT_PUBLIC_SUPABASE_URL --env $ENVIRONMENT <<< "$NEXT_PUBLIC_SUPABASE_URL"
wrangler secret put NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY --env $ENVIRONMENT <<< "$NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
wrangler secret put SUPABASE_SECRET_KEY --env $ENVIRONMENT <<< "$SUPABASE_SECRET_KEY"
wrangler secret put NEXTAUTH_SECRET --env $ENVIRONMENT <<< "$NEXTAUTH_SECRET"
wrangler secret put NEXTAUTH_URL --env $ENVIRONMENT <<< "$NEXTAUTH_URL_VALUE"

echo "✅ 環境変数の設定が完了しました！"
echo ""
echo "📝 設定された環境変数:"
echo "   - NEXT_PUBLIC_SUPABASE_URL"
echo "   - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
echo "   - SUPABASE_SECRET_KEY"
echo "   - NEXTAUTH_SECRET"
echo "   - NEXTAUTH_URL: $NEXTAUTH_URL_VALUE"
echo ""
echo "🔍 設定を確認するには:"
echo "   wrangler secret list --env $ENVIRONMENT"