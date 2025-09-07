// パートナー招待API - 招待情報取得・受諾
// 作成日: 2025-09-07

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { 
  GetInvitationResponse,
  AcceptInvitationResponse,
  isValidInviteCode 
} from '@/lib/types/partner-invitation'

// 招待情報取得 (GET)
export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params
    
    // 招待コードの形式チェック
    if (!isValidInviteCode(code)) {
      return NextResponse.json(
        { success: false, error: '無効な招待コードです' } as GetInvitationResponse,
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // 期限切れ招待のクリーンアップ
    await supabase.rpc('cleanup_expired_invitations')

    // 招待情報を取得（招待者の情報も含む）
    const { data: invitation, error: invitationError } = await supabase
      .from('partner_invitations')
      .select(`
        status,
        expires_at,
        inviter:profiles!inviter_id(
          display_name,
          id
        )
      `)
      .eq('invite_code', code)
      .eq('status', 'pending')
      .gt('expires_at', new Date().toISOString())
      .single()
    
    if (invitationError || !invitation) {
      return NextResponse.json(
        { success: false, error: '招待が見つからないか、期限切れです' } as GetInvitationResponse,
        { status: 404 }
      )
    }

    // 招待者のユーザー情報を取得
    const { data: inviterAuth, error: authError } = await supabase.auth.admin.getUserById(
      (invitation.inviter as any).id
    )

    if (authError || !inviterAuth.user) {
      return NextResponse.json(
        { success: false, error: '招待者の情報を取得できませんでした' } as GetInvitationResponse,
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        inviter_name: (invitation.inviter as any).display_name || 'ユーザー',
        inviter_email: inviterAuth.user.email || '',
        status: invitation.status as 'pending',
        expires_at: invitation.expires_at
      }
    } as GetInvitationResponse)

  } catch (error) {
    console.error('招待情報取得API エラー:', error)
    return NextResponse.json(
      { success: false, error: 'サーバーエラーが発生しました' } as GetInvitationResponse,
      { status: 500 }
    )
  }
}

// 招待受諾 (POST)
export async function POST(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params
    
    // 招待コードの形式チェック
    if (!isValidInviteCode(code)) {
      return NextResponse.json(
        { success: false, error: '無効な招待コードです' } as AcceptInvitationResponse,
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )
    
    // 認証確認
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: '認証が必要です' } as AcceptInvitationResponse,
        { status: 401 }
      )
    }

    // パートナー連携処理（Supabase関数を使用）
    const { data: linkResult, error: linkError } = await supabase
      .rpc('link_partners', {
        p_invite_code: code,
        p_accepter_id: user.id
      })
    
    if (linkError) {
      console.error('パートナー連携エラー:', linkError)
      return NextResponse.json(
        { success: false, error: 'パートナー連携に失敗しました' } as AcceptInvitationResponse,
        { status: 500 }
      )
    }

    if (!linkResult) {
      return NextResponse.json(
        { success: false, error: '招待が無効か、既にパートナーが設定されています' } as AcceptInvitationResponse,
        { status: 400 }
      )
    }

    // 連携後の情報を取得
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select(`
        partner_id,
        partner:profiles!partner_id(
          display_name
        )
      `)
      .eq('id', user.id)
      .single()
    
    if (profileError || !profile) {
      console.error('プロフィール取得エラー:', profileError)
      return NextResponse.json(
        { success: false, error: 'プロフィール情報の取得に失敗しました' } as AcceptInvitationResponse,
        { status: 500 }
      )
    }

    // 共有された家事の数を取得
    const { count: sharedChoresCount, error: countError } = await supabase
      .from('chores')
      .select('*', { count: 'exact', head: true })
      .or(`owner_id.eq.${user.id},partner_id.eq.${user.id}`)
    
    if (countError) {
      console.error('家事数取得エラー:', countError)
    }

    return NextResponse.json({
      success: true,
      data: {
        partner_id: profile.partner_id!,
        partner_name: (profile.partner as any)?.display_name || 'パートナー',
        shared_chores_count: sharedChoresCount || 0
      }
    } as AcceptInvitationResponse)

  } catch (error) {
    console.error('招待受諾API エラー:', error)
    return NextResponse.json(
      { success: false, error: 'サーバーエラーが発生しました' } as AcceptInvitationResponse,
      { status: 500 }
    )
  }
}