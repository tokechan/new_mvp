// パートナー招待API - 招待生成・一覧取得
// 作成日: 2025-09-07

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { 
  CreateInvitationRequest, 
  CreateInvitationResponse, 
  GetInvitationsResponse,
  InvitationError 
} from '@/lib/types/partner-invitation'

// 招待リンク生成 (POST)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
    
    // 認証確認（テスト環境対応）
    let user
    if (process.env.NEXT_PUBLIC_SKIP_AUTH === 'true') {
      // テスト環境では固定ユーザーを使用
      user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com'
      }
    } else {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      if (authError || !authUser) {
        return NextResponse.json(
          { success: false, error: '認証が必要です' } as CreateInvitationResponse,
          { status: 401 }
        )
      }
      user = authUser
    }

    // リクエストボディの解析
    const body: CreateInvitationRequest = await request.json()
    
    // 既にパートナーがいるかチェック（循環参照を避けるため簡素化）
    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('partner_id')
        .eq('id', user.id)
        .maybeSingle() // singleの代わりにmaybeSingleを使用
      
      if (profileError) {
        console.error('プロフィール取得エラー:', profileError)
        // プロフィールが存在しない場合は作成を試行
        console.log('プロフィールを作成します...')
        const displayName = user.email?.split('@')[0] || 'ユーザー'
        const { error: createError } = await supabase
          .from('profiles')
          .insert({ id: user.id, display_name: displayName })
        
        if (createError) {
          console.error('プロフィール作成エラー:', createError)
          // プロフィール作成に失敗しても招待は続行（RLSで保護されている）
        }
      } else if (profile?.partner_id) {
        return NextResponse.json(
          { success: false, error: '既にパートナーが設定されています' } as CreateInvitationResponse,
          { status: 400 }
        )
      }
    } catch (error) {
      console.error('プロフィールチェックで予期しないエラー:', error)
      // エラーが発生しても招待処理は続行（RLSで保護されている）
    }

    // 有効な招待が既に存在するかチェック
    const { data: existingInvitations, error: checkError } = await supabase
      .from('partner_invitations')
      .select('id')
      .eq('inviter_id', user.id)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
    
    if (checkError) {
      console.error('既存招待チェックエラー:', checkError)
      return NextResponse.json(
        { success: false, error: '招待状態の確認に失敗しました' } as CreateInvitationResponse,
        { status: 500 }
      )
    }

    if (existingInvitations && existingInvitations.length > 0) {
      return NextResponse.json(
        { success: false, error: '有効な招待が既に存在します。先に既存の招待をキャンセルしてください。' } as CreateInvitationResponse,
        { status: 400 }
      )
    }

    // 招待コード生成（Supabase関数を使用）
    const { data: inviteCodeData, error: codeError } = await supabase
      .rpc('generate_invite_code')
    
    if (codeError || !inviteCodeData) {
      console.error('招待コード生成エラー:', codeError)
      return NextResponse.json(
        { success: false, error: '招待コードの生成に失敗しました' } as CreateInvitationResponse,
        { status: 500 }
      )
    }

    const inviteCode = inviteCodeData as string

    // 招待レコード作成
    const { data: invitation, error: insertError } = await supabase
      .from('partner_invitations')
      .insert({
        inviter_id: user.id,
        invite_code: inviteCode,
        invitee_email: body.invitee_email || null,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7日後
      })
      .select('invite_code, expires_at')
      .single()
    
    if (insertError || !invitation) {
      console.error('招待作成エラー:', insertError)
      return NextResponse.json(
        { success: false, error: '招待の作成に失敗しました' } as CreateInvitationResponse,
        { status: 500 }
      )
    }

    // 招待URLを生成
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3001'
    const inviteUrl = `${baseUrl}/invite/${invitation.invite_code}`

    return NextResponse.json({
      success: true,
      data: {
        invite_code: invitation.invite_code,
        invite_url: inviteUrl,
        expires_at: invitation.expires_at
      }
    } as CreateInvitationResponse)

  } catch (error) {
    console.error('招待生成API エラー:', error)
    return NextResponse.json(
      { success: false, error: 'サーバーエラーが発生しました' } as CreateInvitationResponse,
      { status: 500 }
    )
  }
}

// 招待一覧取得 (GET)
export async function GET() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {
              // The `setAll` method was called from a Server Component.
              // This can be ignored if you have middleware refreshing
              // user sessions.
            }
          },
        },
      }
    )
    
    // 認証確認（テスト環境対応）
    let user
    if (process.env.NEXT_PUBLIC_SKIP_AUTH === 'true') {
      // テスト環境では固定ユーザーを使用
      user = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'test@example.com'
      }
    } else {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
      if (authError || !authUser) {
        return NextResponse.json(
          { success: false, error: '認証が必要です' } as GetInvitationsResponse,
          { status: 401 }
        )
      }
      user = authUser
    }

    // 期限切れ招待のクリーンアップ
    await supabase.rpc('cleanup_expired_invitations')

    // ユーザーの招待一覧を取得
    const { data: invitations, error: fetchError } = await supabase
      .from('partner_invitations')
      .select('id, invite_code, invitee_email, status, created_at, expires_at')
      .eq('inviter_id', user.id)
      .order('created_at', { ascending: false })
    
    if (fetchError) {
      console.error('招待一覧取得エラー:', fetchError)
      return NextResponse.json(
        { success: false, error: '招待一覧の取得に失敗しました' } as GetInvitationsResponse,
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        invitations: invitations || []
      }
    } as GetInvitationsResponse)

  } catch (error) {
    console.error('招待一覧取得API エラー:', error)
    return NextResponse.json(
      { success: false, error: 'サーバーエラーが発生しました' } as GetInvitationsResponse,
      { status: 500 }
    )
  }
}