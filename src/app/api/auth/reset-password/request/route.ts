import { NextResponse } from 'next/server'

import { createAdminClient } from '@/lib/supabase/admin'

interface ResetPasswordRequestBody {
  email?: string
}

// POST - verify an existing user and send the recovery email
export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ResetPasswordRequestBody
    const email = body.email?.trim().toLowerCase()

    if (!email) {
      return NextResponse.json({ message: 'Email is required.' }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data: userRow, error: userError } = await supabase
      .from('tbl_users')
      .select('id,email')
      .eq('email', email)
      .is('deleted_at', null)
      .maybeSingle()

    if (userError) {
      return NextResponse.json({ message: userError.message }, { status: 500 })
    }

    if (!userRow) {
      return NextResponse.json(
        { message: "We couldn't find an account with that email address." },
        { status: 404 }
      )
    }

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${new URL(request.url).origin}/auth/reset-password`,
    })

    if (resetError) {
      return NextResponse.json({ message: resetError.message }, { status: 400 })
    }

    return NextResponse.json({
      message: 'Recovery link sent.',
      email,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to send recovery email.'
    return NextResponse.json({ message }, { status: 500 })
  }
}
