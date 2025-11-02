import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/supabase'

export type PartnerInvitationCleanupJobEnv = {
  SUPABASE_URL?: string
  SUPABASE_SECRET_KEY?: string
}

type CleanupClient = SupabaseClient<Database>

export function createPartnerInvitationCleanupJob() {
  let client: CleanupClient | null = null

  function getClient(env: PartnerInvitationCleanupJobEnv) {
    if (!client) {
      if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
        throw new Error('Supabase credentials are not configured for the cleanup job.')
      }
      client = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_SECRET_KEY, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      })
    }
    return client
  }

  return {
    async run(env: PartnerInvitationCleanupJobEnv) {
      const supabase = getClient(env)
      const { error } = await supabase.rpc('cleanup_expired_invitations')

      if (error) {
        console.error('[PartnerInvitationCleanupJob] cleanup failed', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint,
        })
        throw new Error('partner_invitation_cleanup_failed')
      }

      console.log('[PartnerInvitationCleanupJob] cleanup executed:', new Date().toISOString())
    },
  }
}
