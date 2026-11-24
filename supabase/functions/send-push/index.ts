// Supabase Edge Function: send-push
// Sends a native FCM push notification to every device registered by a user.
// Triggered by the notifications table webhook (migration 0008).
//
// Required secrets (set with `supabase secrets set`):
//   FCM_PROJECT_ID      — Firebase project id (e.g. tofik-store)
//   FCM_CLIENT_EMAIL   — Firebase service account email
//   FCM_PRIVATE_KEY    — Firebase service account private key
//   PUSH_INTERNAL_SECRET — shared secret checked against the Authorization header
//
// The FCM_* values come from the Firebase console:
// Project settings → Service accounts → Generate new private key.

import { JWT } from 'npm:google-auth-library@9'
import { createClient } from 'npm:@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
const PUSH_INTERNAL_SECRET = Deno.env.get('PUSH_INTERNAL_SECRET') ?? ''

const FCM_PROJECT_ID = Deno.env.get('FCM_PROJECT_ID') ?? ''
const FCM_CLIENT_EMAIL = Deno.env.get('FCM_CLIENT_EMAIL') ?? ''
const FCM_PRIVATE_KEY = (Deno.env.get('FCM_PRIVATE_KEY') ?? '').replace(
  /\\n/g,
  '\n',
)

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

let cachedClient: ReturnType<typeof getOAuthClient> | null = null

function getOAuthClient() {
  return new JWT({
    email: FCM_CLIENT_EMAIL,
    key: FCM_PRIVATE_KEY,
    scopes: ['https://www.googleapis.com/auth/firebase.messaging'],
  })
}

interface FcmMessage {
  token: string
  notification?: {
    title: string
    body?: string
  }
  data?: Record<string, string>
  android?: {
    notification?: {
      channel_id?: string
      priority?: 'PRIORITY_HIGH' | 'PRIORITY_NORMAL'
    }
    priority?: 'high' | 'normal'
  }
}

type FcmResult = 'sent' | 'invalid-token' | 'error'

async function sendFcm(message: FcmMessage): Promise<FcmResult> {
  if (!FCM_PROJECT_ID || !FCM_CLIENT_EMAIL || !FCM_PRIVATE_KEY) {
    console.error('send-push: FCM credentials are not configured')
    return 'error'
  }

  try {
    if (!cachedClient) cachedClient = getOAuthClient()
    const tokens = await cachedClient.getAccessToken()
    if (!tokens.token) return 'error'

    const response = await fetch(
      `https://fcm.googleapis.com/v1/projects/${FCM_PROJECT_ID}/messages:send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokens.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      },
    )

    if (response.ok) return 'sent'

    const detail = await response.text()
    console.error(`send-push: FCM error (${response.status}): ${detail}`)

    // UNREGISTERED / INVALID_ARGUMENT: this token will never work again.
    if (response.status === 404 || response.status === 400) {
      return 'invalid-token'
    }
    return 'error'
  } catch (error) {
    console.error(`send-push: FCM request failed: ${error}`)
    return 'error'
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed.' }, 405)
  }

  // The database trigger authenticates with the shared internal secret.
  const authHeader = req.headers.get('Authorization') ?? ''
  if (
    PUSH_INTERNAL_SECRET &&
    authHeader !== `Bearer ${PUSH_INTERNAL_SECRET}`
  ) {
    return json({ error: 'Unauthorized.' }, 401)
  }

  if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
    return json({ error: 'Server is not configured.' }, 500)
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return json({ error: 'Invalid request.' }, 400)
  }

  const userId = typeof body.userId === 'string' ? body.userId : ''
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  const notifBody =
    typeof body.body === 'string' && body.body.trim() ? body.body.trim() : null
  const orderId = typeof body.orderId === 'string' ? body.orderId : null
  const type = typeof body.type === 'string' ? body.type : null

  if (!userId || !title) {
    return json({ error: 'userId and title are required.' }, 400)
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Look up the current registration tokens for this user.
  const { data: devices, error } = await admin
    .from('device_tokens')
    .select('id, token')
    .eq('user_id', userId)

  if (error) {
    console.error(`send-push: could not read device tokens: ${error.message}`)
    return json({ error: 'Could not read device tokens.' }, 500)
  }
  if (!devices || devices.length === 0) {
    return json({ sent: 0 })
  }

  // Deep link: customers go to their order; admins go to the orders page.
  const link =
    type === 'order_placed'
      ? 'https://tofik.store/admin/orders'
      : orderId
        ? `https://tofik.store/order/${orderId}`
        : 'https://tofik.store/account'

  const data: Record<string, string> = {
    title,
    ...(notifBody ? { body: notifBody } : {}),
    ...(orderId ? { orderId } : {}),
    ...(type ? { type } : {}),
    link,
  }

  const results = await Promise.all(
    devices.map(async (device) => {
      const result = await sendFcm({
        token: device.token,
        notification: { title, ...(notifBody ? { body: notifBody } : {}) },
        data,
        android: {
          notification: { channel_id: 'orders', priority: 'PRIORITY_HIGH' },
          priority: 'high',
        },
      })

      // Prune tokens FCM explicitly rejected as unregistered so they are
      // not retried on every notification. Transient errors keep the token.
      if (result === 'invalid-token') {
        await admin.from('device_tokens').delete().eq('id', device.id)
      }
      return result === 'sent'
    }),
  )

  const sent = results.filter(Boolean).length
  return json({ sent })
})
