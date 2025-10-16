import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY
const email = process.env.E2E_EMAIL || process.env.TEST_USER_EMAIL
const password = process.env.E2E_PASSWORD || process.env.TEST_USER_PASSWORD
const name = process.env.E2E_NAME || 'E2E User'

function exitWith(message, code = 1) {
  console.error(message)
  process.exit(code)
}

if (!supabaseUrl || !supabaseServiceKey) {
  exitWith('Missing Supabase config: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY')
}

if (!email || !password) {
  exitWith('Missing credentials: set E2E_EMAIL and E2E_PASSWORD')
}

const admin = createClient(supabaseUrl, supabaseServiceKey)

async function main() {
  console.log('Creating/upserting Supabase user:', { email, name })

  let userId = null

  const { data: createData, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name, created_by: 'scripts/create-supabase-user' },
  })

  if (createError) {
    const message = createError.message?.toLowerCase() || ''
    if (createError.status === 409 || message.includes('already')) {
      console.log('User already exists, locating user id via listUsers...')
      const { data, error: listErr } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 })
      if (listErr) {
        exitWith(`Failed to list users: ${listErr.message}`)
      }
      const found = (data?.users || []).find((u) => (u.email || '').toLowerCase() === email.toLowerCase())
      if (!found) {
        exitWith('Existing user not found via listUsers (increase perPage or check email).')
      }
      userId = found.id
      console.log('Found existing user id:', userId)
    } else {
      exitWith(`createUser error: ${createError.message}`)
    }
  } else {
    userId = createData?.user?.id
    console.log('User created:', userId)
  }

  if (!userId) {
    exitWith('No user id available after create/list; aborting profile upsert.')
  }

  // Upsert corresponding profile record (service role bypasses RLS)
  const { error: upsertErr } = await admin
    .from('profiles')
    .upsert({ id: userId, display_name: name })
    .select()

  if (upsertErr) {
    console.warn('Profile upsert warning:', upsertErr.message)
  } else {
    console.log('Profile upserted for user:', userId)
  }

  console.log('Done.')
}

main().catch((err) => {
  console.error('Script failed:', err?.message || err)
  process.exit(1)
})