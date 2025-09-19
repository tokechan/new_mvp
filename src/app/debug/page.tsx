'use client'

/**
 * デバッグ用ページ
 * 環境変数とSupabase設定の確認
 */
export default function Debug() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">デバッグ情報</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold">環境変数</h2>
          <p>NEXT_PUBLIC_SUPABASE_URL: {supabaseUrl || '未設定'}</p>
          <p>NEXT_PUBLIC_SUPABASE_ANON_KEY: {supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...` : '未設定'}</p>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold">現在のURL</h2>
          <p>{typeof window !== 'undefined' ? window.location.href : 'サーバーサイド'}</p>
        </div>
        
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-semibold">Node環境</h2>
          <p>NODE_ENV: {process.env.NODE_ENV}</p>
        </div>
      </div>
    </div>
  )
}