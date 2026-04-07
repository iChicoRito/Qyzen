import { NextResponse } from 'next/server'

import { fetchAuthContext } from '@/lib/auth/auth-context'
import { createClient } from '@/lib/supabase/server'
import { createManagedUser, fetchManagedUsers } from '@/lib/users/create-user'

import type { CreateUserInput } from '@/lib/users/create-user'

// requireAdminContext - block non-admin access to user management routes
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

// GET - load managed users with auth verification status
export async function GET() {
  try {
    await requireAdminContext()
    const users = await fetchManagedUsers()

    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Failed to load users.',
      },
      {
        status: 400,
      }
    )
  }
}

// POST - create auth user, public user, and role assignments
export async function POST(request: Request) {
  try {
    await requireAdminContext()
    const user = (await request.json()) as CreateUserInput
    const createdUser = await createManagedUser(user)

    return NextResponse.json(createdUser)
  } catch (error) {
    return NextResponse.json(
      {
        message: error instanceof Error ? error.message : 'Failed to create user.',
      },
      {
        status: 400,
      }
    )
  }
}
