import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const ANON_KEY =
  Deno.env.get('SUPABASE_ANON_KEY') ??
  Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ??
  ''
const SERVICE_ROLE_KEY =
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ??
  Deno.env.get('SUPABASE_SECRET_KEY') ??
  ''

const INTERNAL_EMAIL_DOMAIN = 'internal.tofik.store'
const PHONE_PATTERN = /^\+[1-9]\d{6,14}$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405)
  }
  if (!SUPABASE_URL || !ANON_KEY || !SERVICE_ROLE_KEY) {
    return json({ error: 'Server authentication is not configured.' }, 500)
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const anon = createClient(SUPABASE_URL, ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid request.' }, 400)
  }

  if (body.action === 'login-phone') {
    const phone = text(body.phone)
    const password = typeof body.password === 'string' ? body.password : ''
    if (!PHONE_PATTERN.test(phone) || password.length < 6) {
      return json({ error: 'Invalid phone or password.' })
    }

    const { data: profile, error: profileError } = await admin
      .from('profiles')
      .select('id')
      .eq('phone', phone)
      .maybeSingle()

    if (profileError) {
      return json(
        { error: 'Phone sign-in is not set up yet. Contact the shop.' },
        500,
      )
    }
    if (!profile) {
      return json({ error: 'Invalid phone or password.' })
    }

    const { data: userData, error: userError } =
      await admin.auth.admin.getUserById(profile.id)
    const email = userData?.user?.email
    if (userError || !email) {
      return json({ error: 'Invalid phone or password.' })
    }

    const { data: signIn, error: signInError } =
      await anon.auth.signInWithPassword({ email, password })
    if (signInError || !signIn.session) {
      return json({ error: 'Invalid phone or password.' })
    }

    return json({
      session: {
        access_token: signIn.session.access_token,
        refresh_token: signIn.session.refresh_token,
      },
    })
  }

  if (body.action === 'set-email') {
    const email = text(body.email).toLowerCase()
    const password = typeof body.password === 'string' ? body.password : ''
    if (
      !EMAIL_PATTERN.test(email) ||
      email.endsWith(`@${INTERNAL_EMAIL_DOMAIN}`) ||
      password.length < 6
    ) {
      return json({
        error: 'Enter a valid email address and your current password.',
      })
    }

    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : ''
    if (!token) {
      return json({ error: 'Sign in again to change your email.' }, 401)
    }

    const { data: current, error: currentError } = await anon.auth.getUser(token)
    const user = current?.user
    if (currentError || !user) {
      return json({ error: 'Sign in again to change your email.' }, 401)
    }

    const currentEmail = user.email
    if (!currentEmail) {
      return json({ error: 'This account cannot change email right now.' }, 400)
    }

    const { error: verifyError } = await anon.auth.signInWithPassword({
      email: currentEmail,
      password,
    })
    if (verifyError) {
      return json({ error: 'Current password is incorrect.' })
    }

    const { data: updated, error: updateError } =
      await admin.auth.admin.updateUserById(user.id, {
        email,
        email_confirm: true,
        user_metadata: { ...user.user_metadata, internal_email: false },
      })

    if (updateError || !updated.user) {
      const message = updateError?.message
        ?.toLowerCase()
        .includes('already')
        ? 'That email is already linked to another account.'
        : 'Could not update your email. Try again.'
      return json({ error: message })
    }

    const { error: profileError } = await admin
      .from('profiles')
      .update({ email })
      .eq('id', user.id)
    if (profileError) {
      return json({
        error:
          'Email changed, but the profile could not be updated. Contact the shop.',
      })
    }

    const { data: signIn, error: signInError } =
      await anon.auth.signInWithPassword({ email, password })
    if (signInError || !signIn.session) {
      return json({
        error: 'Email changed. Sign in again with your new email.',
      })
    }

    return json({
      email,
      session: {
        access_token: signIn.session.access_token,
        refresh_token: signIn.session.refresh_token,
      },
    })
  }

  if (body.action === 'change-password') {
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : ''
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''
    if (currentPassword.length < 6 || newPassword.length < 6) {
      return json({
        error: 'Both passwords must be at least 6 characters.',
      })
    }

    const authHeader = req.headers.get('Authorization') ?? ''
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : ''
    if (!token) {
      return json({ error: 'Sign in again to change your password.' }, 401)
    }

    const { data: current, error: currentError } = await anon.auth.getUser(token)
    const user = current?.user
    if (currentError || !user) {
      return json({ error: 'Sign in again to change your password.' }, 401)
    }

    const currentEmail = user.email
    if (!currentEmail) {
      return json({ error: 'This account cannot change password right now.' }, 400)
    }

    const { error: verifyError } = await anon.auth.signInWithPassword({
      email: currentEmail,
      password: currentPassword,
    })
    if (verifyError) {
      return json({ error: 'Current password is incorrect.' })
    }

    const { data: updated, error: updateError } =
      await admin.auth.admin.updateUserById(user.id, {
        password: newPassword,
      })

    if (updateError || !updated.user) {
      return json({ error: 'Could not update your password. Try again.' })
    }

    const { data: signIn, error: signInError } =
      await anon.auth.signInWithPassword({ email: currentEmail, password: newPassword })
    if (signInError || !signIn.session) {
      return json({
        error: 'Password changed. Sign in again with your new password.',
      })
    }

    return json({
      session: {
        access_token: signIn.session.access_token,
        refresh_token: signIn.session.refresh_token,
      },
    })
  }

  return json({ error: 'Unknown action.' }, 400)
})
