import { NextResponse } from 'next/server'

import { createManagedUser } from '@/lib/users/create-user'

import type { CreateUserInput } from '@/lib/users/create-user'

// POST - create auth user, public user, and role assignments
export async function POST(request: Request) {
  try {
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
