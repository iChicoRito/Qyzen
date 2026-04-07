import { NextResponse } from 'next/server'

import { fetchAuthContext } from '@/lib/auth/auth-context'
import { createClient } from '@/lib/supabase/server'
import { deleteManagedUser } from '@/lib/users/create-user'

interface RouteContext {
  params: Promise<{
    userId: string
  }>
}

// requireAdminContext - block non-admin access to destructive user routes
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

// DELETE - remove the auth account and public user record
export async function DELETE(_request: Request, context: RouteContext) {
  try {
    await requireAdminContext()
    const { userId } = await context.params
    const deletedUser = await deleteManagedUser(Number(userId))

    return NextResponse.json(deletedUser)
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Failed to delete user.',
      },
      {
        status: 400,
      }
    )
  }
}
