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

    // 招待情報を取得（循環参照を避けるため簡素化）
    const { data: invitation, error: invitationError } = await supabase
      .from('partner_invitations')
      .select('status, expires_at, inviter_id')
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

    // 招待者の基本情報を取得（循環参照を避ける）
    let inviterName = 'ユーザー'
    let inviterEmail = ''
    
    try {
      // 招待者のプロフィール情報を取得
      const { data: inviterProfile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', invitation.inviter_id)
        .maybeSingle()
      
      if (inviterProfile?.display_name) {
        inviterName = inviterProfile.display_name
      }
      
      // 招待者のユーザー情報を取得
      const { data: inviterAuth } = await supabase.auth.admin.getUserById(invitation.inviter_id)
      if (inviterAuth.user?.email) {
        inviterEmail = inviterAuth.user.email
      }
    } catch (error) {
      console.error('招待者情報取得エラー:', error)
      // エラーでもデフォルト値で続行
    }

    return NextResponse.json({
      success: true,
      data: {
        inviter_name: inviterName,
        inviter_email: inviterEmail,
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

    // 連携後の情報を取得（循環参照を避けるため簡素化）
    let partnerName = 'パートナー'
    let partnerId = ''
    
    try {
      // 自分のプロフィールからpartner_idを取得
      const { data: profile } = await supabase
        .from('profiles')
        .select('partner_id')
        .eq('id', user.id)
        .maybeSingle()
      
      if (profile?.partner_id) {
        partnerId = profile.partner_id
        
        // パートナーの表示名を取得
        const { data: partnerProfile } = await supabase
          .from('profiles')
          .select('display_name')
          .eq('id', profile.partner_id)
          .maybeSingle()
        
        if (partnerProfile?.display_name) {
          partnerName = partnerProfile.display_name
        }
      }
    } catch (error) {
      console.error('連携後情報取得エラー:', error)
      // エラーでもデフォルト値で続行
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
        partner_id: partnerId,
        partner_name: partnerName,
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