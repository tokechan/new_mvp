#!/usr/bin/env node

/**
 * 環境変数検証スクリプト
 * 必要な環境変数が適切に設定されているかチェックします
 */

// .envファイルを読み込み
require('dotenv').config();

const requiredVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
  'SUPABASE_SECRET_KEY'
];

const optionalEnvVars = [
  'NODE_ENV'
];

console.log('🔍 環境変数をチェックしています...\n');

let hasErrors = false;

// 必須環境変数のチェック
console.log('📋 必須環境変数:');
requiredEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (!value) {
    console.log(`❌ ${envVar}: 未設定`);
    hasErrors = true;
  } else if (value.includes('your-') || value.includes('placeholder')) {
    console.log(`⚠️  ${envVar}: プレースホルダーが設定されています`);
    hasErrors = true;
  } else {
    // 値の一部のみ表示（セキュリティのため）
    const maskedValue = value.length > 10 
      ? `${value.substring(0, 10)}...` 
      : '***';
    console.log(`✅ ${envVar}: ${maskedValue}`);
  }
});

console.log('\n📋 オプション環境変数:');
optionalEnvVars.forEach(envVar => {
  const value = process.env[envVar];
  if (value) {
    console.log(`✅ ${envVar}: ${value}`);
  } else {
    console.log(`ℹ️  ${envVar}: 未設定（オプション）`);
  }
});

// Supabase URL の形式チェック
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
if (supabaseUrl && !supabaseUrl.match(/^https:\/\/[a-z0-9]+\.supabase\.co$/)) {
  console.log('\n⚠️  NEXT_PUBLIC_SUPABASE_URL の形式が正しくない可能性があります');
  console.log('   期待される形式: https://your-project.supabase.co');
  hasErrors = true;
}



console.log('\n' + '='.repeat(50));

if (hasErrors) {
  console.log('❌ 環境変数の設定に問題があります');
  console.log('\n📝 対処方法:');
  console.log('1. .envファイルを確認してください');
  console.log('2. .env.exampleを参考に正しい値を設定してください');
  console.log('3. 本番環境ではCloudflareダッシュボードで設定してください');
  process.exit(1);
} else {
  console.log('✅ すべての環境変数が正しく設定されています！');
  process.exit(0);
}