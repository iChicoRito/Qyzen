import { NextResponse } from 'next/server'

import { createRateLimit } from '@/lib/security/rate-limit'
import { createAdminClient } from '@/lib/supabase/admin'

interface ResetPasswordRequestBody {
  email?: string
}

const RESET_PASSWORD_SUCCESS_MESSAGE = 'If an account exists, a recovery link will be sent.'
const checkRateLimit = createRateLimit({
  windowMs: 15 * 60 * 1000,
  maxRequests: 5,
})

// getRequestIp - resolve a stable request source key
function getRequestIp(request: Request) {
  const forwardedFor = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
  const realIp = request.headers.get('x-real-ip')?.trim()

  return forwardedFor || realIp || 'unknown'
}

// buildRateLimitKey - group reset attempts by source and email
function buildRateLimitKey(request: Request, email: string) {
  return `${getRequestIp(request)}:${email}`
}

// buildSuccessResponse - return a non-enumerating reset response
function buildSuccessResponse() {
  return NextResponse.json({
    message: RESET_PASSWORD_SUCCESS_MESSAGE,
  })
}

// POST - request a recovery email without exposing account existence
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ResetPasswordRequestBody
    const email = body.email?.trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ message: 'Email is required.' }, { status: 400 })
    }

    const rateLimit = checkRateLimit(buildRateLimitKey(request, email))

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          message: 'Too many recovery requests. Please try again later.',
        },
        {
          status: 429,
          headers: {
            'Retry-After': String(Math.ceil((rateLimit.resetAt - Date.now()) / 1000)),
          },
        }
      )
    }

    const supabase = createAdminClient()
    const { data: userRow, error: userError } = await supabase
      .from('tbl_users')
      .select('id,email')
      .eq('email', email)
      .is('deleted_at', null)
      .maybeSingle()

    if (userError) {
      return NextResponse.json({ message: 'Failed to process recovery request.' }, { status: 500 })
    }

    if (!userRow) {
      return buildSuccessResponse()
    }

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/auth/reset-password`,
    })

    return buildSuccessResponse()
  } catch (error) {
    const message = error instanceof Error ? 'Failed to process recovery request.' : 'Failed to send recovery email.'
    return NextResponse.json({ message }, { status: 500 })
  }
}
