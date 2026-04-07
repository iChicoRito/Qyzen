import { NextResponse } from 'next/server'

import { fetchAuthContext } from '@/lib/auth/auth-context'
import { createClient } from '@/lib/supabase/server'
import { resendManagedUserVerification } from '@/lib/users/create-user'

interface RouteContext {
  params: Promise<{
    userId: string
  }>
}

// requireAdminContext - block non-admin access to resend actions
async function requireAdminContext() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized.')
  }

  const context = await fetchAuthContext(supabase, user)

  if (!context.isActive) {
    throw new Error('Your account is inactive.')
  }

  if (!context.isEmailVerified) {
    throw new Error('Please verify your email first.')
  }

  if (!context.roles.includes('admin')) {
    throw new Error('Forbidden.')
  }
}

// POST - resend the signup verification email
export async function POST(request: Request, context: RouteContext) {
  try {
    await requireAdminContext()
    const { userId } = await context.params
    const redirectTo = new URL(request.url).origin
    const result = await resendManagedUserVerification(Number(userId), redirectTo)

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Failed to resend verification email.',
      },
      {
        status: 400,
      }
    )
  }
}
