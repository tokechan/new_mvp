/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 15では実験的なappDirは不要
  
  // 開発環境でのクロスオリジンリクエストを許可
  // スマホやタブレットからのアクセスを可能にする
  allowedDevOrigins: [
    '192.168.0.0/16',  // プライベートネットワーク全体
    '10.0.0.0/8',      // プライベートネットワーク
    '172.16.0.0/12'    // プライベートネットワーク
  ]
}

module.exports = nextConfig