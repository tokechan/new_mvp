'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { createSupabaseBrowserClient } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

/**
 * 認証デバッグページ
 * ユーザBでログインした際のエラーを詳細に調査するためのページ
 */
export default function AuthDebugPage() {
  const { user, session, error: authError, signIn, signInWithGoogle, signUp } = useAuth()
  const [debugInfo, setDebugInfo] = useState<any[]>([])
  const [testEmail, setTestEmail] = useState('userb@example.com')
  const [testPassword, setTestPassword] = useState('password123')
  const [createUserMode, setCreateUserMode] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createSupabaseBrowserClient()

  // デバッグ情報を追加する関数
  const addDebugInfo = (message: string, data?: any) => {
    const timestamp = new Date().toLocaleTimeString()
    setDebugInfo(prev => [...prev, { timestamp, message, data }])
    console.log(`[${timestamp}] ${message}`, data)
  }

  // プロフィール存在確認
  const checkProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      addDebugInfo('プロフィール確認結果', { data, error })
      return { data, error }
    } catch (err) {
      addDebugInfo('プロフィール確認エラー', err)
      return { data: null, error: err }
    }
  }

  // プロフィール作成テスト
  const testProfileCreation = async (userId: string, displayName: string) => {
    try {
      addDebugInfo('プロフィール作成開始', { userId, displayName })
      
      const { data, error } = await supabase.from('profiles').upsert({
        id: userId,
        display_name: displayName,
      })
      
      addDebugInfo('プロフィール作成結果', { data, error })
      return { data, error }
    } catch (err) {
      addDebugInfo('プロフィール作成エラー', err)
      return { data: null, error: err }
    }
  }

  // ユーザー作成
  const handleCreateUser = async () => {
    setLoading(true)
    setDebugInfo([])
    
    try {
      addDebugInfo('ユーザー作成開始', { email: testEmail })
      
      const result = await signUp(testEmail, testPassword)
      addDebugInfo('ユーザー作成結果', result)
      
      if (result.error) {
        addDebugInfo('ユーザー作成エラー詳細', {
          message: result.error.message,
          code: result.error.code || 'unknown',
          status: result.error.status || 'unknown',
          details: result.error
        })
        
        if (result.error.message?.includes('User already registered')) {
          addDebugInfo('分析: ユーザーは既に登録されています。ログインを試行してください。')
        }
      } else {
         addDebugInfo('ユーザー作成成功！確認メールをチェックしてください。')
         addDebugInfo('サインアップ完了。メール確認後にログインできます。')
       }
    } catch (err) {
      addDebugInfo('ユーザー作成例外', err)
    } finally {
      setLoading(false)
    }
  }

  // ユーザー存在確認
  const checkUserExists = async (email: string) => {
    try {
      addDebugInfo('ユーザー存在確認開始', { email })
      
      // 管理者権限が必要なため、直接的な確認はできない
      // 代わりにパスワードリセットを試行してユーザーの存在を確認
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })
      
      addDebugInfo('パスワードリセット結果', { error })
      
      if (!error) {
        addDebugInfo('ユーザーは存在します（パスワードリセットメールが送信されました）')
      } else {
        addDebugInfo('ユーザーが存在しないか、エラーが発生しました', error)
      }
      
      return { exists: !error, error }
    } catch (err) {
      addDebugInfo('ユーザー存在確認エラー', err)
      return { exists: false, error: err }
    }
  }

  // テストログイン
  const handleTestLogin = async () => {
    setLoading(true)
    setDebugInfo([])
    
    try {
      addDebugInfo('ログイン開始', { email: testEmail })
      
      // まずユーザーの存在を確認
      await checkUserExists(testEmail)
      
      const result = await signIn(testEmail, testPassword)
      addDebugInfo('ログイン結果', result)
      
      if (result.error) {
        addDebugInfo('ログインエラー詳細', {
          message: result.error.message,
          code: result.error.code || 'unknown',
          status: result.error.status || 'unknown',
          details: result.error
        })
        
        // エラーの種類に応じた詳細分析
        if (result.error.message?.includes('Invalid login credentials')) {
          addDebugInfo('分析: 認証情報が無効です。ユーザーが存在しないか、パスワードが間違っています。')
        } else if (result.error.message?.includes('Email not confirmed')) {
          addDebugInfo('分析: メールアドレスが確認されていません。')
        } else if (result.error.message?.includes('Too many requests')) {
          addDebugInfo('分析: リクエストが多すぎます。しばらく待ってから再試行してください。')
        }
      } else {
        // ログイン成功後、セッション情報を確認
        setTimeout(async () => {
          const { data: { session } } = await supabase.auth.getSession()
          addDebugInfo('セッション確認', session)
          
          if (session?.user) {
            // プロフィール確認
            await checkProfile(session.user.id)
            
            // プロフィール作成テスト
            const displayName = session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'テストユーザー'
            await testProfileCreation(session.user.id, displayName)
          }
        }, 1000)
      }
    } catch (err) {
      addDebugInfo('ログイン例外', err)
    } finally {
      setLoading(false)
    }
  }

  // Supabase設定確認
  const checkSupabaseConfig = async () => {
    setLoading(true)
    setDebugInfo([])
    
    try {
      addDebugInfo('Supabase設定確認開始')
      
      // 環境変数確認
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      addDebugInfo('環境変数', {
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl || '未設定',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey ? '設定済み（長さ: ' + supabaseKey.length + '）' : '未設定'
      })
      
      // Supabase接続テスト
      try {
        const { data, error } = await supabase.auth.getSession()
        addDebugInfo('Supabase接続テスト', {
          success: !error,
          error: error?.message || null,
          session: data.session ? 'あり' : 'なし'
        })
      } catch (err) {
        addDebugInfo('Supabase接続エラー', err)
      }
      
      // 認証プロバイダー確認（間接的）
      addDebugInfo('認証設定確認', {
        note: 'Google OAuth設定はSupabaseダッシュボードで確認してください',
        dashboard: 'https://supabase.com/dashboard/project/' + (supabaseUrl?.split('//')[1]?.split('.')[0] || 'PROJECT_ID') + '/auth/providers'
      })
      
    } catch (err) {
      addDebugInfo('設定確認エラー', err)
    } finally {
      setLoading(false)
    }
  }

  // Google認証テスト
  const handleGoogleLogin = async () => {
    setLoading(true)
    setDebugInfo([])
    
    try {
      addDebugInfo('Google認証開始')
      addDebugInfo('現在のURL', window.location.href)
      addDebugInfo('リダイレクトURL', `${window.location.origin}/auth/callback`)
      
      // Supabase設定確認
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      addDebugInfo('Supabase設定確認', {
        url: supabaseUrl ? '設定済み' : '未設定',
        key: supabaseKey ? '設定済み' : '未設定'
      })
      
      const result = await signInWithGoogle()
      addDebugInfo('Google認証結果', result)
      
      if (result.error) {
        addDebugInfo('Google認証エラー詳細', {
          message: result.error.message || 'メッセージなし',
          code: result.error.code || 'コードなし',
          status: result.error.status || 'ステータスなし',
          details: result.error
        })
        
        // エラーの種類に応じた詳細分析
        if (result.error.message?.includes('Invalid provider')) {
          addDebugInfo('分析: Googleプロバイダーが無効です。Supabaseの設定を確認してください。')
        } else if (result.error.message?.includes('redirect_uri')) {
          addDebugInfo('分析: リダイレクトURIが無効です。Google Cloud Consoleの設定を確認してください。')
        } else if (result.error.message?.includes('client_id')) {
          addDebugInfo('分析: クライアントIDが無効です。Supabaseの認証設定を確認してください。')
        }
      } else {
        addDebugInfo('Google認証成功 - リダイレクト中...')
        addDebugInfo('注意: リダイレクト後、/auth/callbackページで認証が完了します。')
      }
    } catch (err) {
      addDebugInfo('Google認証例外', err)
    } finally {
      setLoading(false)
    }
  }

  // ブラウザセッションクリア機能
  const clearBrowserSession = async () => {
    setLoading(true)
    setDebugInfo([])
    
    try {
      addDebugInfo('ブラウザセッションクリア開始')
      
      // Supabaseセッションをクリア
      const { error } = await supabase.auth.signOut()
      if (error) {
        addDebugInfo('Supabaseサインアウトエラー', error)
      } else {
        addDebugInfo('Supabaseセッションクリア完了')
      }
      
      // ローカルストレージをクリア
      const localStorageKeys = Object.keys(localStorage)
      addDebugInfo('ローカルストレージ内容（クリア前）', localStorageKeys)
      localStorage.clear()
      addDebugInfo('ローカルストレージクリア完了')
      
      // セッションストレージをクリア
      const sessionStorageKeys = Object.keys(sessionStorage)
      addDebugInfo('セッションストレージ内容（クリア前）', sessionStorageKeys)
      sessionStorage.clear()
      addDebugInfo('セッションストレージクリア完了')
      
      // Cookieの確認と削除
      const cookies = document.cookie.split(';')
      addDebugInfo('現在のCookie', cookies)
      
      // Supabase関連のCookieを削除
      cookies.forEach(cookie => {
        const eqPos = cookie.indexOf('=')
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim()
        if (name.includes('supabase') || name.includes('auth')) {
          document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`
          addDebugInfo(`Cookie削除: ${name}`)
        }
      })
      
      addDebugInfo('ページリロード準備中...')
      addDebugInfo('注意: 3秒後に自動でリロードされます')
      
      // 3秒後にページをリロード
      setTimeout(() => {
        window.location.reload()
      }, 3000)
      
    } catch (err) {
      addDebugInfo('セッションクリアエラー', err)
    } finally {
      setLoading(false)
    }
  }

  // 現在の認証状態を表示
  useEffect(() => {
    if (user) {
      addDebugInfo('現在のユーザー', {
        id: user.id,
        email: user.email,
        metadata: user.user_metadata
      })
    }
    if (authError) {
      addDebugInfo('認証エラー', authError)
    }
  }, [user, authError])

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">認証デバッグページ</h1>
      
      {/* 現在の状態 */}
      <div className="bg-gray-100 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-2">現在の認証状態</h2>
        <p><strong>ユーザー:</strong> {user ? `${user.email} (${user.id})` : 'なし'}</p>
        <p><strong>セッション:</strong> {session ? 'あり' : 'なし'}</p>
        <p><strong>エラー:</strong> {authError || 'なし'}</p>
      </div>

      {/* テストフォーム */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <h2 className="text-lg font-semibold mb-4">ログインテスト</h2>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="test-email" className="block text-sm font-medium mb-1">メールアドレス</label>
            <input
              id="test-email"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="userb@example.com"
            />
          </div>
          
          <div>
            <label htmlFor="test-password" className="block text-sm font-medium mb-1">パスワード</label>
            <input
              id="test-password"
              type="password"
              value={testPassword}
              onChange={(e) => setTestPassword(e.target.value)}
              className="w-full p-2 border rounded"
              placeholder="password123"
            />
          </div>
          
          <div className="flex space-x-2">
            <Button
              onClick={handleCreateUser}
              disabled={loading}
              className="flex-1 bg-green-500 text-white p-2 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading ? '作成中...' : 'ユーザー作成'}
            </Button>
            
            <Button
              onClick={handleTestLogin}
              disabled={loading}
              className="flex-1 bg-blue-500 text-white p-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'テスト中...' : 'ログインテスト'}
            </Button>
          </div>
          
          <div className="space-y-2">
             <Button
               onClick={checkSupabaseConfig}
               disabled={loading}
               className="w-full bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
             >
               {loading ? '確認中...' : 'Supabase設定確認'}
             </Button>
             
             <Button
               onClick={handleGoogleLogin}
               disabled={loading}
               className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
             >
               {loading ? 'テスト中...' : 'Google認証テスト'}
             </Button>
             
             <Button
               onClick={clearBrowserSession}
               disabled={loading}
               className="w-full bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700"
             >
               {loading ? 'クリア中...' : 'ブラウザセッションクリア'}
             </Button>
           </div>
          
          <div className="text-sm text-gray-600 space-y-2">
             <div>
               <p className="font-semibold">メール認証テスト:</p>
               <p>1. まず「ユーザー作成」でテストユーザーを作成</p>
               <p>2. メール確認後、「ログインテスト」を実行</p>
             </div>
             <div>
               <p className="font-semibold">Google認証テスト:</p>
               <p>1. 「Supabase設定確認」で設定状況を確認</p>
               <p>2. 「Google認証テスト」でOAuth動作を確認</p>
               <p>3. エラーが出た場合は詳細ログを確認</p>
             </div>
           </div>
        </div>
      </div>

      {/* Google認証トラブルシューティング */}
      <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
        <h2 className="text-lg font-semibold mb-3 text-yellow-800">🔧 Google認証トラブルシューティング</h2>
        <div className="space-y-3 text-sm">
          <div>
            <p className="font-semibold text-yellow-700">よくある問題と解決策:</p>
            <ul className="list-disc list-inside space-y-1 text-yellow-600">
              <li><strong>「Invalid provider」エラー</strong>: SupabaseでGoogleプロバイダーが有効化されていません</li>
              <li><strong>「redirect_uri mismatch」エラー</strong>: Google Cloud ConsoleのリダイレクトURIが正しく設定されていません</li>
              <li><strong>「client_id invalid」エラー</strong>: SupabaseのGoogle OAuth設定でクライアントIDが間違っています</li>
              <li><strong>ポップアップがブロック</strong>: ブラウザのポップアップブロッカーを無効にしてください</li>
              <li><strong>即座にログインされる</strong>: ブラウザにセッションが残っている</li>
              <li><strong>アカウント選択画面が出ない</strong>: Googleアカウントが1つだけログイン中</li>
            </ul>
          </div>
          <div>
            <p className="font-semibold text-yellow-700">設定確認手順:</p>
            <ol className="list-decimal list-inside space-y-1 text-yellow-600">
              <li>Google Cloud Console: OAuth 2.0クライアントIDの作成</li>
              <li>承認済みリダイレクトURI: <code className="bg-yellow-100 px-1 rounded">https://njbormsqqfwnzwbigxuh.supabase.co/auth/v1/callback</code></li>
              <li>Supabaseダッシュボード: Authentication → Providers → Google</li>
              <li>クライアントIDとシークレットを正しく入力</li>
            </ol>
          </div>
          <div>
            <p className="font-semibold text-yellow-700">複数アカウントテスト手順:</p>
            <ol className="list-decimal list-inside space-y-1 text-yellow-600">
              <li>「ブラウザセッションクリア」でセッションを完全にクリア</li>
              <li>ページリロード後、「Google認証テスト」を実行</li>
              <li>Googleアカウント選択画面で1つ目のアカウントを選択</li>
              <li>ログイン後、再度「ブラウザセッションクリア」を実行</li>
              <li>「Google認証テスト」で2つ目のアカウントをテスト</li>
            </ol>
          </div>
          <div>
            <p className="font-semibold text-green-700">期待される動作:</p>
            <ul className="list-disc list-inside space-y-1 text-green-600">
              <li>セッションクリア後は必ずGoogleアカウント選択画面が表示される</li>
              <li>異なるアカウントでそれぞれログインできる</li>
              <li>各アカウントで個別のプロフィールが作成される</li>
            </ul>
          </div>
        </div>
      </div>

      {/* デバッグログ */}
      <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-sm">
        <h2 className="text-lg font-semibold mb-4 text-white">デバッグログ</h2>
        
        {debugInfo.length === 0 ? (
          <p className="text-gray-400">ログインテストを実行してください</p>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {debugInfo.map((info, index) => (
              <div key={index} className="border-b border-gray-700 pb-2">
                <div className="text-yellow-400">[{info.timestamp}] {info.message}</div>
                {info.data && (
                  <pre className="text-xs mt-1 text-gray-300 overflow-x-auto">
                    {JSON.stringify(info.data, null, 2)}
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}
        
        <Button
          onClick={() => setDebugInfo([])}
          className="mt-4 bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700"
        >
          ログクリア
        </Button>
      </div>
    </div>
  )
}