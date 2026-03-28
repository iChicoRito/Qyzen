import { NextResponse } from 'next/server'

import { createClient } from '@/lib/supabase/server'

interface CreateUserInput {
  userId: string
  givenName: string
  surname: string
  email: string
  status: 'active' | 'inactive'
  userType: 'student' | 'educator'
  roleNames: string[]
}

interface UserRow {
  id: number
  user_type: 'admin' | 'student' | 'educator'
  user_id: string
  given_name: string
  surname: string
  email: string
  is_active: boolean
}

interface RoleLookupRow {
  id: number
  name: string
}

interface SupabaseErrorResponse {
  code?: string
  message?: string
}

// getSupabaseErrorMessage - normalize api errors
function getSupabaseErrorMessage(error: SupabaseErrorResponse, fallbackMessage: string) {
  return error.message || fallbackMessage
}

// formatPasswordValue - replace spaces with underscores
function formatPasswordValue(value: string) {
  return value.trim().replace(/\s+/g, '_')
}

// generateUserPassword - create the initial password
function generateUserPassword(givenName: string, surname: string) {
  return `${formatPasswordValue(givenName)}_${formatPasswordValue(surname)}`
}

// mapUserRow - convert db row to api response
function mapUserRow(row: UserRow, roleNames: string[]) {
  return {
    id: row.id,
    userId: row.user_id,
    givenName: row.given_name,
    surname: row.surname,
    email: row.email,
    status: row.is_active ? 'active' : 'inactive',
    userType: row.user_type,
    roleNames,
  }
}

// getRoleIdsByNames - resolve role ids from names
async function getRoleIdsByNames(roleNames: string[]) {
  if (roleNames.length === 0) {
    return [] as number[]
  }

  const supabase = await createClient()
  const { data: rows, error } = await supabase
    .from('tbl_roles')
    .select('id,name')
    .in('name', roleNames)

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to resolve roles.'))
  }

  return (rows as RoleLookupRow[]).map((row: RoleLookupRow) => row.id)
}

// createAuthUser - create auth user and trigger email confirmation
async function createAuthUser(user: CreateUserInput, password: string) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: user.email,
    password,
    options: {
      data: {
        surname: user.surname,
        given_name: user.givenName,
        email_address: user.email,
        password,
        status: user.status,
        user_type: user.userType,
        role: user.roleNames.join(', '),
      },
    },
  })

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to create auth user.'))
  }
}

// createPublicUser - insert public user record
async function createPublicUser(user: CreateUserInput) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tbl_users')
    .insert({
      user_type: user.userType,
      user_id: user.userId,
      given_name: user.givenName,
      surname: user.surname,
      email: user.email,
      is_active: user.status === 'active',
    })
    .select('id,user_type,user_id,given_name,surname,email,is_active')
    .single()

  if (error) {

    if (error.code === '23505') {
      throw new Error('User ID or email already exists.')
    }

    throw new Error(getSupabaseErrorMessage(error, 'Failed to create user record.'))
  }

  return data as UserRow
}

// assignUserRoles - insert user role records
async function assignUserRoles(userId: number, roleNames: string[]) {
  const roleIds = await getRoleIdsByNames(roleNames)

  if (roleIds.length === 0) {
    return
  }

  const supabase = await createClient()
  const { error } = await supabase.from('tbl_user_roles').insert(
    roleIds.map((roleId: number) => ({
      user_id: userId,
      role_id: roleId,
    }))
  )

  if (error) {
    throw new Error(getSupabaseErrorMessage(error, 'Failed to assign user roles.'))
  }
}

// POST - create auth user, public user, and role assignments
export async function POST(request: Request) {
  try {
    const user = (await request.json()) as CreateUserInput
    const password = generateUserPassword(user.givenName, user.surname)

    await createAuthUser(user, password)
    const createdUser = await createPublicUser(user)
    await assignUserRoles(createdUser.id, user.roleNames)

    return NextResponse.json(mapUserRow(createdUser, user.roleNames))
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
