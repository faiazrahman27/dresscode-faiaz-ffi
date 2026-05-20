const RESEND_API_URL = 'https://api.resend.com/emails'

const ALLOWED_ORIGINS = new Set([
  'https://www.dresscode.bio',
  'https://dresscode.bio',
  'https://dresscode-faiaz-ffi.vercel.app',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
])

const DEFAULT_FROM = 'Dresscode <no-reply@dresscode.bio>'
const DEFAULT_SUBJECT = 'Welcome to Dresscode'

function getCorsHeaders(req: Request) {
  const origin = req.headers.get('origin') || ''
  const allowedOrigin = ALLOWED_ORIGINS.has(origin) ? origin : 'https://www.dresscode.bio'

  return {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Vary': 'Origin',
  }
}

function jsonResponse(req: Request, body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...getCorsHeaders(req),
      'Content-Type': 'application/json; charset=utf-8',
    },
  })
}

function getRequiredEnv(name: string) {
  const value = Deno.env.get(name)

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }

  return value
}

function getAccessToken(req: Request) {
  const authorization = req.headers.get('authorization') || ''

  if (!authorization.startsWith('Bearer ')) {
    return null
  }

  return authorization.slice('Bearer '.length).trim()
}

function escapeHtml(value: string) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function normalizeName(name: string | null | undefined) {
  const cleaned = String(name || '').trim()

  if (!cleaned) {
    return 'there'
  }

  return cleaned.slice(0, 80)
}

function renderWelcomeText(name: string) {
  return `Welcome to Dresscode, ${name}.

Your account is verified and ready.

Dresscode connects physical pieces, products, and stories to live digital profiles.

You can now sign in, activate QR-linked items, manage your profile, and explore your dashboard.

Open Dresscode:
https://www.dresscode.bio/portal

If you did not create a Dresscode account, you can ignore this email.

© Dresscode`
}

function renderWelcomeHtml(name: string) {
  const safeName = escapeHtml(name)

  return `
<div style="margin:0;padding:0;background:#08090d;font-family:Inter,Arial,sans-serif;color:#f8fafc;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0;padding:32px 16px;background:#08090d;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#11131a;border:1px solid #262b38;border-radius:22px;overflow:hidden;">
          <tr>
            <td style="padding:34px 34px 20px 34px;">
              <div style="font-size:13px;letter-spacing:0.16em;text-transform:uppercase;color:#8b5cf6;font-weight:700;">
                Dresscode
              </div>

              <h1 style="margin:18px 0 10px 0;font-size:28px;line-height:1.15;color:#ffffff;font-weight:800;">
                Welcome to Dresscode, ${safeName}
              </h1>

              <p style="margin:0;color:#cbd5e1;font-size:15px;line-height:1.7;">
                Your account is verified and ready. You can now activate QR-linked items, manage your profile, and connect physical pieces to live digital experiences.
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:8px 34px 26px 34px;">
              <a href="https://www.dresscode.bio/portal"
                 style="display:inline-block;background:#ffffff;color:#09090b;text-decoration:none;font-size:15px;font-weight:800;padding:14px 20px;border-radius:999px;">
                Open Dresscode
              </a>
            </td>
          </tr>

          <tr>
            <td style="padding:0 34px 30px 34px;">
              <div style="background:#171a23;border:1px solid #2b3140;border-radius:16px;padding:16px;">
                <p style="margin:0;color:#cbd5e1;font-size:13px;line-height:1.7;">
                  Start from your dashboard. Manage your profile, activate supported QR codes, and build public digital pages for connected items.
                </p>
              </div>
            </td>
          </tr>

          <tr>
            <td style="padding:20px 34px 34px 34px;border-top:1px solid #262b38;">
              <p style="margin:0;color:#64748b;font-size:12px;line-height:1.6;">
                Dresscode connects physical pieces, products, and stories to live digital profiles.
              </p>
              <p style="margin:10px 0 0 0;color:#475569;font-size:12px;line-height:1.6;">
                If you did not create a Dresscode account, you can ignore this email.
              </p>
            </td>
          </tr>
        </table>

        <p style="margin:18px 0 0 0;color:#475569;font-size:12px;line-height:1.6;">
          © Dresscode
        </p>
      </td>
    </tr>
  </table>
</div>
`.trim()
}

async function claimWelcomeEmailSend({
  supabaseUrl,
  supabaseAnonKey,
  accessToken,
}: {
  supabaseUrl: string
  supabaseAnonKey: string
  accessToken: string
}) {
  const response = await fetch(`${supabaseUrl}/rest/v1/rpc/claim_welcome_email_send`, {
    method: 'POST',
    headers: {
      apikey: supabaseAnonKey,
      authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: '{}',
  })

  const text = await response.text()
  const payload = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new Error(payload?.message || 'Could not claim welcome email send.')
  }

  const result = Array.isArray(payload) ? payload[0] : payload

  return {
    shouldSend: Boolean(result?.should_send),
    recipientEmail: String(result?.recipient_email || ''),
    recipientName: String(result?.recipient_name || ''),
  }
}

async function sendWelcomeEmail({
  resendApiKey,
  recipientEmail,
  recipientName,
}: {
  resendApiKey: string
  recipientEmail: string
  recipientName: string
}) {
  const name = normalizeName(recipientName)

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: Deno.env.get('WELCOME_EMAIL_FROM') || DEFAULT_FROM,
      to: [recipientEmail],
      subject: Deno.env.get('WELCOME_EMAIL_SUBJECT') || DEFAULT_SUBJECT,
      html: renderWelcomeHtml(name),
      text: renderWelcomeText(name),
    }),
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(payload?.message || 'Could not send welcome email.')
  }

  return payload
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return new Response('ok', {
        status: 200,
        headers: getCorsHeaders(req),
      })
    }

    if (req.method !== 'POST') {
      return jsonResponse(req, { error: 'Method not allowed.' }, 405)
    }

    const accessToken = getAccessToken(req)

    if (!accessToken) {
      return jsonResponse(req, { error: 'Authentication required.' }, 401)
    }

    const supabaseUrl = getRequiredEnv('PROJECT_SUPABASE_URL')
    const supabaseAnonKey = getRequiredEnv('PROJECT_SUPABASE_ANON_KEY')
    const resendApiKey = getRequiredEnv('RESEND_API_KEY')

    const claim = await claimWelcomeEmailSend({
      supabaseUrl,
      supabaseAnonKey,
      accessToken,
    })

    if (!claim.shouldSend) {
      return jsonResponse(req, {
        sent: false,
        reason: 'not_required',
      })
    }

    if (!claim.recipientEmail) {
      return jsonResponse(req, {
        sent: false,
        reason: 'missing_recipient',
      })
    }

    await sendWelcomeEmail({
      resendApiKey,
      recipientEmail: claim.recipientEmail,
      recipientName: claim.recipientName,
    })

    return jsonResponse(req, {
      sent: true,
    })
  } catch (error) {
    console.error('send-welcome-email error:', error)

    return jsonResponse(req, {
      error: 'Could not process welcome email.',
    }, 500)
  }
})
