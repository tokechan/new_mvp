/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 15では実験的なappDirは不要
  
  // 開発環境でのCORS設定（複数のプライベートネットワークからのアクセスを許可）
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ]
  },
  
  // Cloudflare Pages対応
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig